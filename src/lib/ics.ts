// Generador mínimo de iCalendar (.ics) — sin libs externas.
// Compatible con Google Calendar, Apple Calendar, Outlook.

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function formatICalUtc(date: Date) {
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  )
}

function escapeICalText(s: string) {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

export interface IcsEvent {
  uid: string
  title: string
  description?: string | null
  location?: string | null
  startsAt: Date
  durationMinutes?: number
  url?: string | null
}

export function buildIcs(event: IcsEvent): string {
  const dtStart = formatICalUtc(event.startsAt)
  const dtEnd = formatICalUtc(
    new Date(event.startsAt.getTime() + (event.durationMinutes ?? 90) * 60_000),
  )
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Quedamos//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.uid}@quedamos.app`,
    `DTSTAMP:${formatICalUtc(new Date())}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeICalText(event.title)}`,
  ]
  if (event.description) lines.push(`DESCRIPTION:${escapeICalText(event.description)}`)
  if (event.location) lines.push(`LOCATION:${escapeICalText(event.location)}`)
  if (event.url) lines.push(`URL:${event.url}`)
  lines.push('END:VEVENT', 'END:VCALENDAR')
  return lines.join('\r\n')
}
