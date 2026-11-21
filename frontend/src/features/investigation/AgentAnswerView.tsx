// One answer from the agent: summary, then facts / inferences / unresolved, each claim with
// its evidence (scope §6.1 C, FR-2, FR-3). Below: the evidence and the investigation steps.
//
// Colour rules from PROJECT-NOTES.md: the three kinds are told apart by a marker AND text,
// not only by colour, and nothing here uses "danger red" (missing data is not wrongdoing).

import { useState } from 'react'
import type { AgentAnswer, Claim, TraceStep } from '../../api/types'
import { citedEventIds } from '../../lib/format'
import { LogoMark } from '../../components/brand/Logo'
import { EvidenceView } from './EvidenceView'
import { TraceView } from './TraceView'

type Props = {
  answer: AgentAnswer
  trace: TraceStep[]
  onOpenEvent: (eventId: string) => void
}

function CitationChips({ ids, onOpenEvent }: { ids: string[]; onOpenEvent: (id: string) => void }) {
  if (ids.length === 0) return null
  return (
    <span className="chips">
      {ids.map((id) => (
        <button key={id} type="button" className="chip" onClick={() => onOpenEvent(id)}
          aria-label={`Open event ${id}`}>
          {id}
        </button>
      ))}
    </span>
  )
}

function ClaimList({ claims, onOpenEvent }: { claims: Claim[]; onOpenEvent: (id: string) => void }) {
  return (
    <ul className="claims">
      {claims.map((claim, i) => (
        <li key={i}>
          <p>{claim.claim}</p>
          <CitationChips ids={claim.event_ids} onOpenEvent={onOpenEvent} />
        </li>
      ))}
    </ul>
  )
}

// The result of our code's citation check, as a small badge (and details if it failed).
function CitationBadge({ answer }: { answer: AgentAnswer }) {
  const report = answer.citations
  return report.ok ? (
    <span className="badge badge--ok">
      <span aria-hidden="true">✓</span> {report.checked_event_ids.length} citations verified
    </span>
  ) : (
    <span className="badge badge--warning">
      <span aria-hidden="true">!</span> Citation check failed
    </span>
  )
}

function CitationProblems({ answer }: { answer: AgentAnswer }) {
  const report = answer.citations
  if (report.ok) return null
  return (
    <div className="notice notice--warning" role="note">
      <p><strong>Check this answer carefully.</strong> Our automatic citation check found problems:</p>
      <ul>
        {report.missing_event_ids.length > 0 && (
          <li>Cited events that don't exist: {report.missing_event_ids.join(', ')}</li>
        )}
        {report.facts_without_evidence.length > 0 && (
          <li>{report.facts_without_evidence.length} fact(s) without a cited event</li>
        )}
      </ul>
    </div>
  )
}

export function AgentAnswerView({ answer, trace, onOpenEvent }: Props) {
  const [panel, setPanel] = useState<'evidence' | 'steps' | null>(null)
  const eventIds = citedEventIds([...answer.verified_facts, ...answer.inferences])
  const toggle = (name: 'evidence' | 'steps') => setPanel(panel === name ? null : name)

  return (
    <article className="answer" aria-label="Agent answer">
      <header className="answer__head">
        <span className="answer__who"><LogoMark size={18} /> Audit Agent</span>
        <CitationBadge answer={answer} />
        <span className="answer__time">{Math.round(answer.seconds)} s</span>
      </header>

      <p className="answer__summary">{answer.summary}</p>
      <CitationProblems answer={answer} />

      {answer.verified_facts.length > 0 && (
        <section className="finding">
          <h3><span className="marker marker--fact" aria-hidden="true" /> Verified facts</h3>
          <ClaimList claims={answer.verified_facts} onOpenEvent={onOpenEvent} />
        </section>
      )}

      {answer.inferences.length > 0 && (
        <section className="finding">
          <h3><span className="marker marker--inference" aria-hidden="true" /> Inferences <span className="finding__note">not proven</span></h3>
          <ClaimList claims={answer.inferences} onOpenEvent={onOpenEvent} />
        </section>
      )}

      {answer.unresolved.length > 0 && (
        <section className="finding">
          <h3><span className="marker marker--unresolved" aria-hidden="true" /> Unresolved</h3>
          <ul className="claims">
            {answer.unresolved.map((item, i) => <li key={i}><p>{item}</p></li>)}
          </ul>
        </section>
      )}

      <footer className="answer__foot">
        <div className="answer__tabs" role="group" aria-label="More about this answer">
          {eventIds.length > 0 && (
            <button type="button" className="tab" aria-expanded={panel === 'evidence'} onClick={() => toggle('evidence')}>
              Evidence <span className="tab__count">{eventIds.length}</span>
            </button>
          )}
          <button type="button" className="tab" aria-expanded={panel === 'steps'} onClick={() => toggle('steps')}>
            Investigation steps <span className="tab__count">{trace.length}</span>
          </button>
        </div>
        {/* Evidence is only fetched when opened. */}
        {panel === 'evidence' && <EvidenceView eventIds={eventIds} onOpenEvent={onOpenEvent} />}
        {panel === 'steps' && <TraceView steps={trace} />}
      </footer>
    </article>
  )
}
