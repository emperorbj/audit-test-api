// One investigation: the conversation, the question box, and report export.

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useAskQuestion, useInvestigation } from '../api/queries'
import { friendlyError } from '../api/errors'
import { canAsk, useCurrentUser } from '../auth/AuthContext'
import { AgentThinking } from '../components/agent-thinking/AgentThinking'
import { Button } from '../components/ui/Button'
import { AgentAnswerView } from '../features/investigation/AgentAnswerView'
import { EventDialog } from '../features/investigation/EventDialog'
import { QuestionForm } from '../features/investigation/QuestionForm'
import { buildReport, downloadFile } from '../features/investigation/report'
import { formatUtc } from '../lib/format'

export function InvestigationPage() {
  const { id = '' } = useParams()
  const user = useCurrentUser()
  const queryClient = useQueryClient()
  const investigation = useInvestigation(id)
  const ask = useAskQuestion(id)
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null)
  const [openEventId, setOpenEventId] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const messageCount = investigation.data?.messages.length ?? 0

  // Scroll to the newest message when one arrives or while waiting.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messageCount, pendingQuestion])

  if (investigation.isPending) return <p role="status" className="page-pad muted">Loading the investigation…</p>
  if (investigation.isError) return <p role="alert" className="page-pad form-error">{friendlyError(investigation.error)}</p>

  const data = investigation.data

  function onAsk(question: string) {
    setPendingQuestion(question)
    ask.mutate(question, { onSettled: () => setPendingQuestion(null) })
  }

  async function exportMarkdown() {
    setExporting(true)
    try {
      const report = await buildReport(data, queryClient)
      downloadFile(`investigation-${data.id}.md`, report)
    } finally {
      setExporting(false)
    }
  }

  function printReport() {
    // Prints what is on screen (open the Evidence / Steps tabs first to include them).
    // The Markdown export always includes the evidence table and the tool-call log.
    window.print()
  }

  return (
    <div className="chat">
      <header className="chat__header">
        <div>
          <h1>{data.title}</h1>
          <p className="muted small">Started {formatUtc(data.created_at)} · {data.id}</p>
        </div>
        {data.messages.length > 0 && (
          <div className="chat__actions no-print">
            <Button variant="secondary" size="sm" onClick={exportMarkdown} busy={exporting} busyLabel="Preparing…">
              Export Markdown
            </Button>
            <Button variant="secondary" size="sm" onClick={printReport}>Print / Save as PDF</Button>
          </div>
        )}
      </header>

      <div className="chat__messages">
        <div className="chat__column">
          {data.messages.length === 0 && !pendingQuestion && (
            <p className="muted">No questions in this investigation yet.</p>
          )}

          {data.messages.map((message) =>
            message.sender === 'user' ? (
              <div key={message.id} className="bubble bubble--user">
                <span className="sr-only">Question: </span>{message.content}
              </div>
            ) : message.answer ? (
              <AgentAnswerView
                key={message.id}
                answer={message.answer}
                trace={message.trace ?? []}
                onOpenEvent={setOpenEventId}
              />
            ) : (
              <p key={message.id}>{message.content}</p>
            ),
          )}

          {pendingQuestion && (
            <>
              <div className="bubble bubble--user">{pendingQuestion}</div>
              <AgentThinking />
            </>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {canAsk(user.role) ? (
        <div className="chat__input no-print">
          <QuestionForm onAsk={onAsk} busy={ask.isPending} placeholder="Ask a follow-up question…" />
        </div>
      ) : (
        <p className="chat__input muted small no-print">You can read this investigation. Viewers can't ask questions.</p>
      )}

      <EventDialog eventId={openEventId} onClose={() => setOpenEventId(null)} />
    </div>
  )
}
