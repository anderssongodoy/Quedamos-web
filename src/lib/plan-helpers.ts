import type { Plan, PlanType } from '@/lib/db-types'

export const PLAN_TYPE_LABEL: Record<PlanType, { es: string; emoji: string }> = {
  restaurant: { es: 'Restaurante', emoji: '🍽️' },
  cafe: { es: 'Café', emoji: '☕' },
  cinema: { es: 'Cine', emoji: '🎬' },
  event: { es: 'Evento', emoji: '🎉' },
  concert: { es: 'Concierto', emoji: '🎵' },
  activity: { es: 'Actividad', emoji: '✨' },
  birthday: { es: 'Cumpleaños', emoji: '🎂' },
  meetup: { es: 'Meetup', emoji: '👥' },
  walk: { es: 'Paseo', emoji: '🚶' },
  casual_meeting: { es: 'Reunión', emoji: '🪑' },
  class_workshop: { es: 'Taller', emoji: '📚' },
  match: { es: 'Partido', emoji: '⚽' },
  short_trip: { es: 'Viaje corto', emoji: '🧳' },
  other: { es: 'Otro', emoji: '📌' },
  unknown: { es: 'Sin clasificar', emoji: '🤔' },
}

export function planLabel(type: Plan['type']): { es: string; emoji: string } {
  return PLAN_TYPE_LABEL[type ?? 'unknown']
}

export function shortShareText(plan: Pick<Plan, 'title' | 'location_name' | 'starts_at'>): string {
  const parts = [plan.title ?? 'Plan'].filter(Boolean) as string[]
  if (plan.location_name) parts.push(`📍 ${plan.location_name}`)
  if (plan.starts_at) {
    const d = new Date(plan.starts_at)
    parts.push(
      `🗓️ ${d.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })} ${d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`,
    )
  }
  return parts.join('\n')
}
