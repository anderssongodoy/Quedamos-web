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
export const aiExtractionSchema = z.object({
  type: planTypeEnum,
  title: z.string().min(1).max(120),
  summary: z.string().max(500).nullable(),
  location_name: z.string().max(200).nullable(),
  address: z.string().max(300).nullable(),
  date_candidates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).max(5),
  time_candidates: z.array(z.string().regex(/^\d{2}:\d{2}$/)).max(5),
  requirements: z.array(z.string().max(200)).max(10),
  warnings: z.array(z.string().max(200)).max(10),
  source_confidence: z.number().min(0).max(1),
  missing_fields: z.array(z.string().max(40)).max(10),
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
