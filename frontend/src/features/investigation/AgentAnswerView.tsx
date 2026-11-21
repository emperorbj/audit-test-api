// One answer from the agent: summary, then facts / inferences / unresolved, each claim with
// its evidence (scope §6.1 C, FR-2, FR-3). Below: the evidence and the investigation trace.
//
// Colour rules from PROJECT-NOTES.md: the three kinds are told apart by an icon AND text,
// not only by colour, and nothing here uses "danger red" (missing data is not wrongdoing).

import { useState } from 'react'
import type { AgentAnswer, Claim, TraceStep } from '../../api/types'
import { citedEventIds } from '../../lib/format'
import { EvidenceView } from './EvidenceView'
import { TraceView } from './TraceView'
import { LogoMark } from '../../components/brand/Logo'

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

function CitationCheck({ answer }: { answer: AgentAnswer }) {
  const report = answer.citations
  if (report.ok) {
    return (
      <p className="notice notice--ok">
        <span aria-hidden="true">✓</span> All {report.checked_event_ids.length} cited events were found in the audit
        data, and every fact has evidence.
      </p>
    )
  }
  return (
    <div className="notice notice--warning" role="note">
      <p><span aria-hidden="true">⚠</span> <strong>Check this answer carefully.</strong> Our automatic citation check found problems:</p>
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
  const [showEvidence, setShowEvidence] = useState(false)
  const eventIds = citedEventIds([...answer.verified_facts, ...answer.inferences])

  return (
    <article className="answer" aria-label="Agent answer">
      <header className="answer__head">
        <LogoMark size={22} /> Audit Agent
        <span className="muted small">answered in {Math.round(answer.seconds)} s</span>
      </header>
      <p className="answer__summary">{answer.summary}</p>

      <CitationCheck answer={answer} />

      {answer.verified_facts.length > 0 && (
        <section className="finding finding--fact">
          <h3><span aria-hidden="true">✓</span> Verified facts</h3>
          <ClaimList claims={answer.verified_facts} onOpenEvent={onOpenEvent} />
        </section>
      )}

      {answer.inferences.length > 0 && (
        <section className="finding finding--inference">
          <h3><span aria-hidden="true">≈</span> Inferences <span className="muted small">(not proven)</span></h3>
          <ClaimList claims={answer.inferences} onOpenEvent={onOpenEvent} />
        </section>
      )}

      {answer.unresolved.length > 0 && (
        <section className="finding finding--unresolved">
          <h3><span aria-hidden="true">?</span> Unresolved / not checked</h3>
          <ul className="claims">
            {answer.unresolved.map((item, i) => <li key={i}><p>{item}</p></li>)}
          </ul>
        </section>
      )}

      <div className="answer__extras">
        {eventIds.length > 0 && (
          <div>
            <button type="button" className="btn btn--secondary btn--sm" aria-expanded={showEvidence}
              onClick={() => setShowEvidence(!showEvidence)}>
              {showEvidence ? 'Hide evidence' : `Show evidence (${eventIds.length} events)`}
            </button>
            {/* Only fetch the events when the user opens the evidence. */}
            {showEvidence && <EvidenceView eventIds={eventIds} onOpenEvent={onOpenEvent} />}
          </div>
        )}

        <details className="disclosure">
          <summary>
            Investigation steps ({trace.length} tool call{trace.length === 1 ? '' : 's'} · {Math.round(answer.seconds)} s)
          </summary>
          <TraceView steps={trace} />
        </details>
      </div>
    </article>
  )
}
