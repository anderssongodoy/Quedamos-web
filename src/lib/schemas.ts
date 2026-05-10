import { z } from 'zod'

// =============================================================================
// Tipos de plan + estados — alineados con los enums de la DB
// =============================================================================
export const planTypeEnum = z.enum([
  'restaurant',
  'cafe',
  'cinema',
  'event',
  'concert',
  'activity',
  'birthday',
  'meetup',
  'walk',
  'casual_meeting',
  'class_workshop',
  'match',
  'short_trip',
  'other',
  'unknown',
])
export type PlanTypeEnum = z.infer<typeof planTypeEnum>

export const sourceTypeEnum = z.enum(['image', 'link', 'text', 'manual'])
export const voteValueEnum = z.enum(['yes', 'maybe', 'no'])
export const participantStatusEnum = z.enum(['invited', 'maybe', 'going', 'not_going'])

// =============================================================================
// Salida estructurada que devuelve Claude para una captura/texto/link
// =============================================================================
// La salida de un LLM es ruidosa: a veces devuelve más ítems de la cuenta, un
// título demasiado largo, un confidence fuera de rango o un type inválido. En
// lugar de rechazar todo el JSON (lo que mata el job entero), saneamos cada
// campo: recortamos, deduplicamos, descartamos basura y clampeamos.
const asStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []

const nullableTrimmed = (max: number) =>
  z.preprocess((v) => {
    if (typeof v !== 'string') return null
    const t = v.trim()
    return t.length === 0 ? null : t.slice(0, max)
  }, z.string().nullable())

export const aiExtractionSchema = z.object({
  type: planTypeEnum.catch('unknown'),
  title: z.preprocess((v) => {
    const t = typeof v === 'string' ? v.trim().slice(0, 120) : ''
    return t.length === 0 ? 'Plan sin título' : t
  }, z.string()),
  summary: nullableTrimmed(500),
  location_name: nullableTrimmed(200),
  address: nullableTrimmed(300),
  date_candidates: z.preprocess(
    (v) =>
      Array.from(new Set(asStringArray(v).filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s)))).slice(0, 5),
    z.array(z.string()),
  ),
  time_candidates: z.preprocess(
    (v) =>
      Array.from(new Set(asStringArray(v).filter((s) => /^\d{2}:\d{2}$/.test(s)))).slice(0, 5),
    z.array(z.string()),
  ),
  requirements: z.preprocess(
    (v) =>
      asStringArray(v)
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .map((s) => s.slice(0, 200))
        .slice(0, 10),
    z.array(z.string()),
  ),
  warnings: z.preprocess(
    (v) =>
      asStringArray(v)
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .map((s) => s.slice(0, 200))
        .slice(0, 10),
    z.array(z.string()),
  ),
  source_confidence: z.preprocess((v) => {
    const n = typeof v === 'number' ? v : Number(v)
    if (!Number.isFinite(n)) return 0
    return Math.min(1, Math.max(0, n))
  }, z.number()),
  missing_fields: z.preprocess(
    (v) =>
      asStringArray(v)
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .map((s) => s.slice(0, 40))
        .slice(0, 10),
    z.array(z.string()),
  ),
})
export type AiExtraction = z.infer<typeof aiExtractionSchema>

// =============================================================================
// Inputs de la API HTTP
// =============================================================================
export const createPlanFromTextSchema = z.object({
  text: z.string().min(2).max(8000),
})
export type CreatePlanFromText = z.infer<typeof createPlanFromTextSchema>

export const createPlanFromLinkSchema = z.object({
  url: z.string().url(),
})
export type CreatePlanFromLink = z.infer<typeof createPlanFromLinkSchema>

// PATCH /api/plans/[id] — el creador edita la ficha tras la extracción
export const updatePlanSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).nullable().optional(),
  type: planTypeEnum.optional(),
  location_name: z.string().max(200).nullable().optional(),
  address: z.string().max(300).nullable().optional(),
  starts_at: z.string().datetime().nullable().optional(),
  status: z.enum(['draft', 'voting', 'confirmed', 'cancelled', 'archived']).optional(),
  requirements: z.array(z.string().max(200)).max(20).optional(),
  warnings: z.array(z.string().max(200)).max(20).optional(),
})
export type UpdatePlan = z.infer<typeof updatePlanSchema>

// POST /api/plans/[id]/options — agregar/reemplazar opciones de votación
export const planOptionInputSchema = z.object({
  option_type: z.enum(['date_time', 'location', 'custom']),
  starts_at: z.string().datetime().nullable().optional(),
  location_name: z.string().max(200).nullable().optional(),
  address: z.string().max(300).nullable().optional(),
  label: z.string().max(120).nullable().optional(),
})
export type PlanOptionInput = z.infer<typeof planOptionInputSchema>

// POST /api/plans/[id]/confirm — el creador confirma la opción ganadora
export const confirmPlanSchema = z.object({
  winning_option_id: z.string().uuid(),
})
export type ConfirmPlan = z.infer<typeof confirmPlanSchema>

// =============================================================================
// Inputs de invitados (vista pública /p/[token])
// =============================================================================
export const guestJoinSchema = z.object({
  name: z.string().trim().min(1).max(60),
})
export type GuestJoin = z.infer<typeof guestJoinSchema>

export const guestVoteSchema = z.object({
  option_id: z.string().uuid(),
  vote: voteValueEnum,
})
export type GuestVote = z.infer<typeof guestVoteSchema>

export const guestRsvpSchema = z.object({
  status: participantStatusEnum,
})
export type GuestRsvp = z.infer<typeof guestRsvpSchema>

export const guestCommentSchema = z.object({
  body: z.string().trim().min(1).max(2000),
})
export type GuestComment = z.infer<typeof guestCommentSchema>

// =============================================================================
// Webhook interno: invocación del worker IA desde la upload route
// =============================================================================
export const processJobMessageSchema = z.object({
  job_id: z.string().uuid(),
})
export type ProcessJobMessage = z.infer<typeof processJobMessageSchema>
