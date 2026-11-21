// Shows one raw audit event, fetched fresh from the backend (scope US-04, FR-13):
// the auditor can check the agent's claim against the original record.

import { useAuditEvent } from '../../api/queries'
import { friendlyError } from '../../api/errors'
import { Dialog } from '../../components/ui/Dialog'
import { formatUtc } from '../../lib/format'

type Props = {
  eventId: string | null // null = closed
  onClose: () => void
}

export function EventDialog({ eventId, onClose }: Props) {
  const event = useAuditEvent(eventId)

  return (
    <Dialog open={eventId !== null} onClose={onClose} title={`Event ${eventId ?? ''}`} wide>
      {event.isPending && <p role="status">Loading the event…</p>}
      {event.isError && <p role="alert" className="form-error">{friendlyError(event.error)}</p>}
      {event.data && (
        <>
          <dl className="event-fields">
            <dt>Time</dt><dd>{formatUtc(event.data.occurred_at)}</dd>
            <dt>Actor</dt>
            <dd>{event.data.actor}{event.data.actor_role && <span className="muted"> ({event.data.actor_role})</span>}</dd>
            <dt>Action</dt><dd><code>{event.data.action}</code></dd>
            <dt>Resource</dt><dd><code>{event.data.resource_type}</code> / <code>{event.data.resource_id}</code></dd>
            <dt>Outcome</dt><dd>{event.data.outcome}</dd>
            <dt>Domain</dt><dd>{event.data.domain}</dd>
            <dt>Source system</dt><dd>{event.data.source_system}</dd>
            <dt>Event ID</dt><dd><code>{event.data.event_id}</code></dd>
          </dl>

          {event.data.description && (
            <section className="event-section">
              <h3>Description</h3>
              {/* Written by the source system, not by us: it may contain anything. */}
              <p className="muted small">Text from the source system, shown as recorded. Not verified.</p>
              <blockquote className="event-description">{event.data.description}</blockquote>
            </section>
          )}

          <section className="event-section">
            <h3>Details</h3>
            <p className="muted small">Sensitive fields are redacted.</p>
            <pre className="code-block">{JSON.stringify(event.data.details, null, 2)}</pre>
          </section>
        </>
      )}
    </Dialog>
  )
}
