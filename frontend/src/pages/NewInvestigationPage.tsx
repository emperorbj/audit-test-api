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
import { LogoMark } from '../components/brand/Logo'

// The example questions from the scope (US-01, US-02, US-03).
const EXAMPLES = [
  { tag: 'Records', question: 'Who deleted customer records in the last 7 days?' },
  { tag: 'Logins', question: 'Show failed logins in the last 24 hours' },
  { tag: 'Permissions', question: 'Did any admin change permissions without approval in the last 7 days?' },
]

export function NewInvestigationPage() {
  const user = useCurrentUser()
  const navigate = useNavigate()
  const toast = useToast()
  const start = useStartInvestigation()
  const [asked, setAsked] = useState<string | null>(null)

  if (!canAsk(user.role)) {
    return (
      <div className="empty-state">
        <h1>Investigations</h1>
        <p className="muted">Pick an investigation on the left to read it. Viewers can read investigations but can't ask new questions.</p>
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
    <div className="empty-state">
      <span className="empty-state__icon" aria-hidden="true"><LogoMark size={34} /></span>
      <h1>What do you want to investigate?</h1>
      <p className="muted">
        Ask about who did what in your audit logs. Every fact in the answer links to the original event.
      </p>
      <div className="examples" role="group" aria-label="Example questions">
        {EXAMPLES.map((example) => (
          <button key={example.question} type="button" className="example" onClick={() => ask(example.question)}>
            <span className="example__tag">{example.tag}</span>
            <span>{example.question}</span>
          </button>
        ))}
      </div>
      <QuestionForm onAsk={ask} busy={start.isPending} />
    </div>
  )
}
