// Helpers de zona horaria. MVP: hardcodeado a Lima (UTC-5, sin DST).
// Cuando agreguemos selector de país, leerlo del perfil del usuario.

export const DEFAULT_TIMEZONE = 'America/Lima'
export const DEFAULT_TZ_OFFSET = '-05:00'

// Devuelve un texto descriptivo del "ahora" en la TZ dada, en español, para
// inyectar al prompt de extracción de la IA.
//   "Hoy es sábado, 9 de mayo de 2026, hora actual 17:42 (zona America/Lima, UTC-05:00)."
export function describeNow(tz = DEFAULT_TIMEZONE): string {
  const now = new Date()
  const date = new Intl.DateTimeFormat('es', {
    timeZone: tz,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now)
  const time = new Intl.DateTimeFormat('es', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now)
  return `Hoy es ${date}, hora local ${time} (zona ${tz}, UTC${DEFAULT_TZ_OFFSET}).`
}

// Construye un Date en UTC interpretando "YYYY-MM-DDTHH:mm" como hora local
// de la zona del usuario. MVP: usa offset fijo -05:00 (Lima sin DST).
export function localToUtcIso(date: string, time: string): string | null {
  const candidate = new Date(`${date}T${time}:00${DEFAULT_TZ_OFFSET}`)
  if (isNaN(candidate.getTime())) return null
  return candidate.toISOString()
}
