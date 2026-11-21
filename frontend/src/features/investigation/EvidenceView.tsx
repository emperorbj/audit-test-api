// The events behind an answer, as a table or as a timeline (scope §6.1 A and D, FR-14).
// Each cited event is fetched from the backend, so this shows the ORIGINAL records.

import { useState } from 'react'
import { useQueries } from '@tanstack/react-query'
import { auditEventQuery } from '../../api/queries'
import type { AuditEvent } from '../../api/types'
import { formatUtc } from '../../lib/format'

type Props = {
  eventIds: string[]
  onOpenEvent: (eventId: string) => void
}

export function EvidenceView({ eventIds, onOpenEvent }: Props) {
  const [view, setView] = useState<'table' | 'timeline'>('table')
  const results = useQueries({ queries: eventIds.map((id) => auditEventQuery(id)) })

  const loading = results.some((r) => r.isPending)
  const events = results.map((r) => r.data).filter((e): e is AuditEvent => e !== undefined)
  const failed = results.filter((r) => r.isError).length
  const byTime = [...events].sort((a, b) => a.occurred_at.localeCompare(b.occurred_at))

  return (
    <div className="evidence">
      <div className="segmented" role="group" aria-label="Evidence view">
        <button type="button" aria-pressed={view === 'table'} onClick={() => setView('table')}>Table</button>
        <button type="button" aria-pressed={view === 'timeline'} onClick={() => setView('timeline')}>Timeline</button>
      </div>

      {loading && <p role="status" className="muted">Loading {eventIds.length} events…</p>}
      {failed > 0 && <p role="alert" className="notice notice--warning">{failed} cited event(s) could not be loaded.</p>}

      {!loading && view === 'table' && (
        <div className="data-table__scroll">
          <table>
            <caption className="sr-only">Evidence: the audit events cited in this answer</caption>
            <thead>
              <tr>
                <th scope="col">Time (UTC)</th>
                <th scope="col">Actor</th>
                <th scope="col">Action</th>
                <th scope="col">Resource</th>
                <th scope="col">Outcome</th>
                <th scope="col">Event ID</th>
              </tr>
            </thead>
            <tbody>
              {byTime.map((event) => (
                <tr key={event.event_id}>
                  <td className="nowrap">{formatUtc(event.occurred_at)}</td>
                  <td>{event.actor}</td>
                  <td><code>{event.action}</code></td>
                  <td><code>{event.resource_id}</code></td>
                  <td>{event.outcome}</td>
                  <td>
                    <button type="button" className="chip" onClick={() => onOpenEvent(event.event_id)}>
                      {event.event_id}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && view === 'timeline' && (
        <ol className="timeline">
          {byTime.map((event) => (
            <li key={event.event_id} className="timeline__item">
              <span className="timeline__time">{formatUtc(event.occurred_at)}</span>
              <span>
                <strong>{event.actor}</strong> <code>{event.action}</code> on <code>{event.resource_id}</code>
                {event.outcome !== 'success' && <span className="muted"> ({event.outcome})</span>}
              </span>
              <button type="button" className="chip" onClick={() => onOpenEvent(event.event_id)}>
                {event.event_id}
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
