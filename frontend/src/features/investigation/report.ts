// Export one investigation as a Markdown report (scope US-07, FR-15): the questions, time of
// investigation, summary, findings, evidence table, tool-call log and limitations.

import type { QueryClient } from '@tanstack/react-query'
import { auditEventQuery } from '../../api/queries'
import type { AuditEvent, InvestigationDetail } from '../../api/types'
import { citedEventIds, formatUtc } from '../../lib/format'

const LIMITATIONS = `This report was produced by an AI agent that reads audit data through read-only tools.
- Every verified fact cites the audit event(s) it is based on. Each cited event was checked to exist.
- Inferences are conclusions the agent could not prove. Treat them as leads, not findings.
- A missing record means no matching record was found in the available audit data. It is not, on its own, evidence of wrongdoing.
- The agent can only see data that the requesting user is allowed to see. Sensitive fields are redacted.
- A human should review the findings before relying on them.`

// Make text safe inside a Markdown table cell.
const cell = (text: unknown) => String(text ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ')

export async function buildReport(investigation: InvestigationDetail, queryClient: QueryClient): Promise<string> {
  const lines: string[] = []
  lines.push(`# Investigation report: ${investigation.title}`, '')
  lines.push(`- Investigation ID: \`${investigation.id}\``)
  lines.push(`- Started: ${formatUtc(investigation.created_at)}`)
  lines.push(`- Report exported: ${formatUtc(new Date().toISOString())}`, '')

  const messages = investigation.messages
  let questionNumber = 0

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i]
    if (message.sender !== 'user') continue
    questionNumber++
    const reply = messages[i + 1]?.sender === 'agent' ? messages[i + 1] : null

    lines.push(`## Question ${questionNumber}`, '', `> ${message.content}`, '')
    lines.push(`Asked: ${formatUtc(message.created_at)}`, '')

    if (!reply?.answer) {
      lines.push('_No answer was recorded for this question._', '')
      continue
    }
    const answer = reply.answer

    lines.push('### Summary', '', answer.summary, '')
    lines.push(
      answer.citations.ok
        ? `Citation check: passed (all ${answer.citations.checked_event_ids.length} cited events exist).`
        : `Citation check: **FAILED**. Missing events: ${answer.citations.missing_event_ids.join(', ') || 'none'}; facts without evidence: ${answer.citations.facts_without_evidence.length}.`,
      '',
    )

    lines.push('### Verified facts', '')
    if (answer.verified_facts.length === 0) lines.push('_None._')
    for (const fact of answer.verified_facts) lines.push(`- ${fact.claim} (${fact.event_ids.map((id) => `\`${id}\``).join(', ')})`)
    lines.push('', '### Inferences (not proven)', '')
    if (answer.inferences.length === 0) lines.push('_None._')
    for (const item of answer.inferences) lines.push(`- ${item.claim} (based on ${item.event_ids.map((id) => `\`${id}\``).join(', ') || 'no events'})`)
    lines.push('', '### Unresolved / not checked', '')
    if (answer.unresolved.length === 0) lines.push('_None._')
    for (const item of answer.unresolved) lines.push(`- ${item}`)
    lines.push('')

    // Evidence table: fetch every cited event (from cache if we already have it).
    const ids = citedEventIds([...answer.verified_facts, ...answer.inferences])
    if (ids.length > 0) {
      const events = await Promise.all(
        ids.map((id) => queryClient.fetchQuery(auditEventQuery(id)).catch(() => null)),
      )
      lines.push('### Evidence', '')
      lines.push('| Time (UTC) | Actor | Action | Resource | Outcome | Source | Event ID |')
      lines.push('|---|---|---|---|---|---|---|')
      events
        .filter((e): e is AuditEvent => e !== null)
        .sort((a, b) => a.occurred_at.localeCompare(b.occurred_at))
        .forEach((e) => lines.push(
          `| ${formatUtc(e.occurred_at)} | ${cell(e.actor)} | ${cell(e.action)} | ${cell(`${e.resource_type}/${e.resource_id}`)} | ${cell(e.outcome)} | ${cell(e.source_system)} | ${cell(e.event_id)} |`,
        ))
      const notLoaded = events.filter((e) => e === null).length
      if (notLoaded) lines.push('', `_${notLoaded} cited event(s) could not be loaded when this report was made._`)
      lines.push('')
    }

    // Tool-call log: how to reproduce the investigation.
    lines.push('### Tool-call log', '')
    const steps = reply.trace ?? []
    if (steps.length === 0) lines.push('_No tools were called._')
    steps.forEach((step, n) => {
      const result = !step.ok ? 'failed' : step.result_count === null ? '' : `, ${step.result_count} result(s)`
      lines.push(`${n + 1}. \`${step.tool}\` ${JSON.stringify(step.args)}${result}`)
    })
    lines.push('', `Answered in ${Math.round(answer.seconds)} seconds.`, '')
  }

  lines.push('## Limitations', '', LIMITATIONS, '')
  return lines.join('\n')
}

// Make the browser download text as a file.
export function downloadFile(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
