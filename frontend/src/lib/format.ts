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
