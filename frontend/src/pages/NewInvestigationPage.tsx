// Start an investigation: type (or pick) a first question. The investigation is created
// with the question as its title, then the agent answers it.
// Viewers can't ask questions, so they see a short explanation instead.

import { useState } from 'react'
import { useNavigate } from 'react-router'
import { AskFailedError, useStartInvestigation } from '../api/queries'
import { friendlyError } from '../api/errors'
import { canAsk, useCurrentUser } from '../auth/AuthContext'
import { AgentThinking } from '../components/agent-thinking/AgentThinking'
import { useToast } from '../components/ui/Toaster'
import { QuestionForm } from '../features/investigation/QuestionForm'

// The example questions from the scope (US-01, US-02, US-03).
const EXAMPLES = [
  { area: 'Customer records', question: 'Who deleted customer records in the last 7 days?' },
  { area: 'Authentication', question: 'Show failed logins in the last 24 hours' },
  { area: 'Permissions', question: 'Did any admin change permissions without approval in the last 7 days?' },
]

// What the three parts of every answer mean (scope FR-3).
const ANSWER_PARTS = [
  { kind: 'fact', name: 'Verified fact', text: 'Proven by audit events. Each one links to the original record.' },
  { kind: 'inference', name: 'Inference', text: 'A likely conclusion the data does not prove. Treat it as a lead.' },
  { kind: 'unresolved', name: 'Unresolved', text: 'What could not be checked, and why. Missing data is not wrongdoing.' },
]

export function NewInvestigationPage() {
  const user = useCurrentUser()
  const navigate = useNavigate()
  const toast = useToast()
  const start = useStartInvestigation()
  const [asked, setAsked] = useState<string | null>(null)

  if (!canAsk(user.role)) {
    return (
      <div className="start">
        <p className="start__eyebrow">Read-only access</p>
        <h1 className="start__title">Pick an investigation to read</h1>
        <p className="start__lead">Viewers can read every investigation and its evidence, but can't ask new questions.</p>
      </div>
    )
  }

  function ask(question: string) {
    setAsked(question)
    start.mutate(question, {
      onSuccess: (investigation) => navigate(`/investigations/${investigation.id}`),
      onError: (error) => {
        // The investigation was created but the agent failed: open it, so they can try again.
        if (error instanceof AskFailedError) {
          toast.error(friendlyError(error.reason))
          navigate(`/investigations/${error.investigationId}`)
        } else {
          toast.error(friendlyError(error)) // creating the investigation itself failed
        }
      },
    })
  }

  if (start.isPending && asked) {
    return (
      <div className="chat">
        <div className="chat__messages">
          <div className="chat__column">
            <div className="bubble bubble--user">{asked}</div>
            <AgentThinking />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="start">
      <p className="start__eyebrow">New investigation</p>
      <h1 className="start__title">Ask about your audit logs</h1>
      <p className="start__lead">
        The agent searches the logs with read-only tools and answers with evidence you can check.
      </p>

      <QuestionForm onAsk={ask} busy={start.isPending} size="large"
        placeholder="e.g. Who changed roles for the finance team this week?" />

      <section className="start__section" aria-labelledby="suggested">
        <h2 id="suggested" className="start__label">Suggested</h2>
        <ul className="suggestions">
          {EXAMPLES.map((example) => (
            <li key={example.question}>
              <button type="button" className="suggestion" onClick={() => ask(example.question)}>
                <span className="suggestion__area">{example.area}</span>
                <span className="suggestion__text">{example.question}</span>
                <span className="suggestion__go" aria-hidden="true">→</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="start__section" aria-labelledby="how">
        <h2 id="how" className="start__label">How answers are structured</h2>
        <dl className="legend">
          {ANSWER_PARTS.map((part) => (
            <div key={part.kind} className="legend__item">
              <dt><span className={`marker marker--${part.kind}`} aria-hidden="true" /> {part.name}</dt>
              <dd>{part.text}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}
