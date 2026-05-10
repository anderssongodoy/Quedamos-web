import { NextResponse, type NextRequest } from 'next/server'
import { processJobMessageSchema, type AiExtraction } from '@/lib/schemas'
import type { Json } from '@/lib/db-types'
import { getSupabaseService } from '@/lib/supabase/service'
import { r2GetBuffer } from '@/lib/r2'
import { extractFromImage, extractFromText } from '@/lib/extract'
import { scrapeOpenGraph } from '@/lib/og-scrape'
import { serverEnv } from '@/lib/env'
import { describeNow, localToUtcIso } from '@/lib/timezone'

export const runtime = 'nodejs'
export const maxDuration = 60 // tope para Hobby; en Pro puede subir

function pickMediaType(buf: Buffer): 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' {
  // signatures
  if (buf[0] === 0xff && buf[1] === 0xd8) return 'image/jpeg'
  if (buf[0] === 0x89 && buf[1] === 0x50) return 'image/png'
  if (buf.slice(0, 4).toString() === 'RIFF') return 'image/webp'
  if (buf.slice(0, 6).toString().startsWith('GIF8')) return 'image/gif'
  return 'image/jpeg' // default
}

function buildStartsAt(extraction: AiExtraction): string | null {
  const date = extraction.date_candidates[0]
  if (!date) return null
  const time = extraction.time_candidates[0] ?? '19:00'
  return localToUtcIso(date, time)
}

function buildOptionsFromExtraction(planId: string, extraction: AiExtraction) {
  const out: {
    plan_id: string
    option_type: 'date_time'
    starts_at: string
    label: string | null
  }[] = []
  for (const date of extraction.date_candidates.slice(0, 3)) {
    const times =
      extraction.time_candidates.length > 0 ? extraction.time_candidates : ['19:00']
    for (const time of times.slice(0, 3)) {
      const iso = localToUtcIso(date, time)
      if (!iso) continue
      out.push({
        plan_id: planId,
        option_type: 'date_time',
        starts_at: iso,
        label: null,
      })
    }
  }
  return out
}

export async function POST(request: NextRequest) {
  // Verificar shared secret entre upload y worker
  const presentedSecret = request.headers.get('x-quedamos-worker-secret')
  if (!presentedSecret || presentedSecret !== serverEnv.workerSecret) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  let body: { job_id: string }
  try {
    body = processJobMessageSchema.parse(await request.json())
  } catch (err) {
    return NextResponse.json(
      { error: 'invalid_body', detail: err instanceof Error ? err.message : 'parse' },
      { status: 400 },
    )
  }

  const supabase = getSupabaseService()

  // Optimistic lock: solo procesar si está pending o failed (reintento)
  const { data: claimed, error: claimErr } = await supabase
    .from('processing_jobs')
    .update({
      status: 'processing',
      started_at: new Date().toISOString(),
    })
    .eq('id', body.job_id)
    .in('status', ['pending', 'failed'])
    .select(
      'id, plan_id, plan_source_id, attempts',
    )
    .maybeSingle()

  if (claimErr) {
    return NextResponse.json({ error: 'lock_failed', detail: claimErr.message }, { status: 500 })
  }
  if (!claimed) {
    return NextResponse.json({ status: 'already_processed' }, { status: 200 })
  }

  // Incrementar attempts en una segunda llamada (no atomic ideal pero suficiente acá)
  await supabase
    .from('processing_jobs')
    .update({ attempts: (claimed.attempts ?? 0) + 1 })
    .eq('id', claimed.id)

  // Cargar la fuente
  const { data: source, error: srcErr } = await supabase
    .from('plan_sources')
    .select('id, source_type, source_url, storage_key, raw_text, image_url')
    .eq('id', claimed.plan_source_id)
    .single()
  if (srcErr || !source) {
    await supabase
      .from('processing_jobs')
      .update({
        status: 'failed',
        error_message: `source not found: ${srcErr?.message ?? ''}`,
        finished_at: new Date().toISOString(),
      })
      .eq('id', claimed.id)
    return NextResponse.json({ error: 'source_not_found' }, { status: 404 })
  }

  // Contexto temporal del request — Claude lo usa para resolver "este sábado" o "9 de mayo"
  const temporalContext = describeNow()

  let result: Awaited<ReturnType<typeof extractFromImage>>
  try {
    if (source.source_type === 'image') {
      if (!source.storage_key) throw new Error('image source sin storage_key')
      const { buffer } = await r2GetBuffer(source.storage_key)
      const mediaType = pickMediaType(buffer)
      result = await extractFromImage({
        imageBase64: buffer.toString('base64'),
        mediaType,
        temporalContext,
      })
    } else if (source.source_type === 'link') {
      if (!source.source_url) throw new Error('link source sin url')
      const og = await scrapeOpenGraph(source.source_url)
      // Si no hay metadata útil ni texto, igual mandamos a Claude con la URL para que infiera.
      result = await extractFromText({
        text: '',
        sourceUrl: source.source_url,
        ogMetadata: og,
        temporalContext,
      })
      // Guardar OG en plan_sources.metadata_json
      await supabase
        .from('plan_sources')
        .update({ metadata_json: og as unknown as Json })
        .eq('id', source.id)
    } else if (source.source_type === 'text') {
      if (!source.raw_text) throw new Error('text source vacío')
      result = await extractFromText({ text: source.raw_text, temporalContext })
    } else {
      throw new Error(`source_type no soportado: ${source.source_type}`)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await supabase
      .from('processing_jobs')
      .update({
        status: 'failed',
        error_message: message,
        finished_at: new Date().toISOString(),
      })
      .eq('id', claimed.id)
    return NextResponse.json({ error: 'extraction_failed', detail: message }, { status: 500 })
  }

  const extraction = result.data
  const startsAt = buildStartsAt(extraction)

  // Actualizar plan con datos extraídos
  const { error: planUpdErr } = await supabase
    .from('plans')
    .update({
      title: extraction.title,
      description: extraction.summary,
      type: extraction.type,
      location_name: extraction.location_name,
      address: extraction.address,
      starts_at: startsAt,
      requirements: extraction.requirements,
      warnings: extraction.warnings,
      missing_fields: extraction.missing_fields,
      ai_confidence: extraction.source_confidence,
      source_url: source.source_url,
    })
    .eq('id', claimed.plan_id)
  if (planUpdErr) {
    await supabase
      .from('processing_jobs')
      .update({
        status: 'failed',
        error_message: `plan update: ${planUpdErr.message}`,
        finished_at: new Date().toISOString(),
      })
      .eq('id', claimed.id)
    return NextResponse.json({ error: 'plan_update_failed' }, { status: 500 })
  }

  // Crear opciones de votación si hay candidatos
  const options = buildOptionsFromExtraction(claimed.plan_id, extraction)
  if (options.length > 0) {
    await supabase.from('plan_options').insert(options)
  }

  // Cerrar el job con métricas
  await supabase
    .from('processing_jobs')
    .update({
      status: 'completed',
      model_used: result.modelUsed,
      input_tokens: result.usage.input_tokens,
      output_tokens: result.usage.output_tokens,
      cache_creation_tokens: result.usage.cache_creation_input_tokens,
      cache_read_tokens: result.usage.cache_read_input_tokens,
      cost_usd: result.costUsd,
      output_json: extraction as unknown as Json,
      finished_at: new Date().toISOString(),
    })
    .eq('id', claimed.id)

  return NextResponse.json({
    status: 'completed',
    plan_id: claimed.plan_id,
    confidence: extraction.source_confidence,
    model_used: result.modelUsed,
    cost_usd: result.costUsd,
  })
}
