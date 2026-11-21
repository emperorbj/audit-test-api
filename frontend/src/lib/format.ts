// Show times in UTC, like the audit data itself, and say so: "2026-11-15 14:05 UTC".
export function formatUtc(iso: string): string {
  const date = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ` +
    `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())} UTC`
  )
}

// Every event ID cited in an answer (facts and inferences), each once, in order.
export function citedEventIds(claims: { event_ids: string[] }[]): string[] {
  const ids: string[] = []
  for (const claim of claims) {
    for (const id of claim.event_ids) if (!ids.includes(id)) ids.push(id)
  }
  return ids
}

// Short "how long ago" for lists: "just now", "5m ago", "3h ago", "Yesterday", "15 Nov".
export function formatRelative(iso: string): string {
  const seconds = (Date.now() - new Date(iso).getTime()) / 1000
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 172800) return 'Yesterday'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
}

// True if the time is today (UTC), to group the history list.
export function isToday(iso: string): boolean {
  return new Date(iso).toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10)
}
