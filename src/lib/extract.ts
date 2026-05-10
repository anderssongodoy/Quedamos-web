import 'server-only'
import type Anthropic from '@anthropic-ai/sdk'
import { aiExtractionSchema, type AiExtraction } from '@/lib/schemas'
import { computeCostUsd, getAnthropic, MODELS, type ModelKey } from '@/lib/anthropic'

// System prompt fijo — se envía con cache_control para reducir 90% el costo
// del bloque en llamadas repetidas (Anthropic prompt caching).
// El "ahora" en la zona del usuario se inyecta como un mensaje system separado
// (sin cache, varía por request) — así Claude resuelve fechas relativas.
export const EXTRACT_SYSTEM_PROMPT = `Eres un extractor de información para Quedamos, una app que convierte capturas de pantalla, links o textos en planes sociales (restaurantes, eventos, cines, reuniones casuales).

Analiza la entrada y devuelve ÚNICAMENTE un objeto JSON válido con el siguiente esquema:

{
  "type": "restaurant | cafe | cinema | event | concert | activity | birthday | meetup | walk | casual_meeting | class_workshop | match | short_trip | other | unknown",
  "title": "string corto y descriptivo (max 120 chars)",
  "summary": "string | null — resumen breve",
  "location_name": "string | null — nombre del lugar (ej: 'Café Tostado')",
  "address": "string | null — dirección legible",
  "date_candidates": ["YYYY-MM-DD"],
  "time_candidates": ["HH:mm"],
  "requirements": ["string"],
  "warnings": ["string"],
  "source_confidence": 0.0,
  "missing_fields": ["date" | "time" | "location" | "title"]
}

Reglas estrictas:
- No inventes datos. Si un dato no aparece claramente en la entrada, usa null o agrégalo a missing_fields.
- No proceses pagos, cobros, reservas ni transacciones. Si aparece un precio, trátalo solo como información textual sin destacarlo.
- Las fechas deben ir en formato YYYY-MM-DD interpretadas en la zona horaria del usuario (segundo bloque del system).
- Devuelve SOLO el JSON, sin markdown, sin texto adicional, sin backticks.
- Idioma del título y resumen: español neutro.
- source_confidence va de 0 a 1: 1 = todos los datos clave (lugar+fecha+hora) son explícitos; 0.5 = parcial; 0 = casi nada útil.

Cómo resolver fechas relativas o incompletas (PRIORIDAD ALTA — son la causa #1 de errores):

A) **Día de la semana relativo** ("este viernes", "el sábado", "el próximo lunes"):
   - "este X" / "el X" → el próximo X a partir de HOY inclusive. Si hoy ES X, asumí HOY a menos que la frase implique futuro lejano. Si X ya pasó esta semana, usá X de la semana próxima.
   - "el próximo X" / "el siguiente X" → el X de la semana SIGUIENTE (no esta semana).
   - Calculá manualmente usando el día de la semana de "hoy" del contexto temporal.

B) **Día y mes sin año** ("9 y 10 de mayo", "20 de noviembre"):
   - Por DEFECTO usá el año actual del contexto temporal.
   - PERO si ese mes/día ya pasó este año, usá el año siguiente. Ejemplo: si hoy es 15 de diciembre 2026 y el texto dice "10 de marzo", devolvé 2027-03-10 (no 2026-03-10).
   - Excepción: si el texto claramente indica algo pasado ("la semana pasada", "ayer"), no rellenes año futuro — mejor missing_fields.

C) **Solo mes** ("en mayo"): mandalo a missing_fields, no asumas día.

D) **Hora ambigua**:
   - "8 de la noche" / "8pm" / "20:00" → "20:00"
   - "8" sin contexto → missing_fields (no asumas am/pm)
   - "mediodía" → "12:00", "medianoche" → "00:00"

E) **Si después de aplicar todo lo anterior no podés resolverlo**, recién ahí mandalo a missing_fields. La meta es minimizar missing_fields cuando el contexto temporal alcanza para deducir la fecha real.

Ejemplos rápidos (asumiendo hoy = sábado 9 de mayo 2026):
- "el viernes a las 8pm" → date "2026-05-15", time "20:00" (próximo viernes)
- "el próximo viernes" → date "2026-05-22" (NO 2026-05-15 que sería "este viernes")
- "9 y 10 de mayo" → ["2026-05-09","2026-05-10"]
- "20 de noviembre" → "2026-11-20" (mes no pasó aún este año)
- "20 de marzo" → "2027-03-20" (marzo ya pasó este año)`

const COMMON_PARAMS = {
  max_tokens: 1024,
  temperature: 0.1,
}

// Cuando NO pasamos `stream: true`, el SDK devuelve un Message síncrono.
type MessageResponse = Anthropic.Message

export interface ExtractionResult {
  data: AiExtraction
  modelUsed: 'claude-haiku-4-5' | 'claude-sonnet-4-6'
  usage: {
    input_tokens: number
    output_tokens: number
    cache_creation_input_tokens: number | null
    cache_read_input_tokens: number | null
  }
  costUsd: number
}

function parseAndValidate(response: MessageResponse): AiExtraction {
  const block = response.content.find((b: Anthropic.ContentBlock) => b.type === 'text')
  if (!block || block.type !== 'text') {
    throw new Error('Anthropic respondió sin bloque de texto')
  }
  const text = block.text.trim()
  // Anthropic a veces envuelve en ```json — limpiar tolerante
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()
  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch (err) {
    throw new Error(`JSON inválido del modelo: ${(err as Error).message}\n---raw---\n${text}`)
  }
  return aiExtractionSchema.parse(parsed)
}

function buildSystem(temporalContext: string) {
  return [
    {
      type: 'text' as const,
      text: EXTRACT_SYSTEM_PROMPT,
      cache_control: { type: 'ephemeral' as const },
    },
    {
      type: 'text' as const,
      // Sin cache — varía por request
      text: `Contexto temporal (úsalo para resolver fechas relativas y completar el año):\n${temporalContext}`,
    },
  ]
}

async function callModel(
  modelKey: ModelKey,
  userContent: Anthropic.MessageParam['content'],
  temporalContext: string,
): Promise<ExtractionResult> {
  const client = getAnthropic()
  const response = (await client.messages.create({
    model: MODELS[modelKey],
    ...COMMON_PARAMS,
    system: buildSystem(temporalContext),
    messages: [{ role: 'user', content: userContent }],
  })) as MessageResponse
  const data = parseAndValidate(response)
  const usage = {
    input_tokens: response.usage.input_tokens,
    output_tokens: response.usage.output_tokens,
    cache_creation_input_tokens: response.usage.cache_creation_input_tokens ?? null,
    cache_read_input_tokens: response.usage.cache_read_input_tokens ?? null,
  }
  return {
    data,
    modelUsed: MODELS[modelKey],
    usage,
    costUsd: computeCostUsd(modelKey, usage),
  }
}

// =============================================================================
// API pública del módulo
// =============================================================================

const CONFIDENCE_ESCALATION_THRESHOLD = 0.7

export async function extractFromImage(opts: {
  imageBase64: string
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
  temporalContext: string
}): Promise<ExtractionResult> {
  const userContent: Anthropic.MessageParam['content'] = [
    {
      type: 'image',
      source: {
        type: 'base64',
        media_type: opts.mediaType,
        data: opts.imageBase64,
      },
    },
    {
      type: 'text',
      text: 'Esta es la captura. Devuelve el JSON estructurado del plan.',
    },
  ]

  let result = await callModel('haiku', userContent, opts.temporalContext)
  if (result.data.source_confidence < CONFIDENCE_ESCALATION_THRESHOLD) {
    const escalated = await callModel('sonnet', userContent, opts.temporalContext)
    // Acumular costo de ambos intentos
    escalated.costUsd = Number((escalated.costUsd + result.costUsd).toFixed(6))
    result = escalated
  }
  return result
}

export async function extractFromText(opts: {
  text: string
  sourceUrl?: string
  ogMetadata?: { title?: string; description?: string; image?: string; siteName?: string; url?: string }
  temporalContext: string
}): Promise<ExtractionResult> {
  const lines: string[] = []
  if (opts.sourceUrl) lines.push(`URL original: ${opts.sourceUrl}`)
  if (opts.ogMetadata) {
    if (opts.ogMetadata.title) lines.push(`OG title: ${opts.ogMetadata.title}`)
    if (opts.ogMetadata.description) lines.push(`OG description: ${opts.ogMetadata.description}`)
    if (opts.ogMetadata.siteName) lines.push(`OG site: ${opts.ogMetadata.siteName}`)
  }
  if (opts.text) lines.push('---', opts.text)

  const userContent: Anthropic.MessageParam['content'] = [
    {
      type: 'text',
      text: lines.join('\n'),
    },
  ]

  let result = await callModel('haiku', userContent, opts.temporalContext)
  if (result.data.source_confidence < CONFIDENCE_ESCALATION_THRESHOLD) {
    const escalated = await callModel('sonnet', userContent, opts.temporalContext)
    escalated.costUsd = Number((escalated.costUsd + result.costUsd).toFixed(6))
    result = escalated
  }
  return result
}
