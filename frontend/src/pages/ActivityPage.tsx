// The agent's own activity log (Org Admins only, scope US-10, FR-19): who asked what,
// which tools ran, logins. Read-only: nobody can change or delete these entries.
// Server-side cursor paging: "Load more" fetches the next 50 (design kit data-table gap).

import { useState } from 'react'
import { Link } from 'react-router'
import { useActivityLog, useUsers } from '../api/queries'
import { friendlyError } from '../api/errors'
import type { ActivityEntry } from '../api/types'
import { Button } from '../components/ui/Button'
import { DataTable, type Column } from '../components/ui/DataTable'
import { FormField } from '../components/ui/FormField'
import { formatUtc } from '../lib/format'

const KINDS = [
  { value: '', label: 'Everything' },
  { value: 'question', label: 'Questions' },
  { value: 'answer', label: 'Answers (with tools used)' },
  { value: 'agent_error', label: 'Agent errors' },
  { value: 'audit_log_search', label: 'Audit log searches' },
  { value: 'login', label: 'Logins' },
]

// How one row's kind is shown in the table.
const KIND_NAMES: Record<string, string> = {
  question: 'Question', answer: 'Answer', agent_error: 'Agent error',
  audit_log_search: 'Audit log search', login: 'Login',
}

// A one-line description of what happened, from the entry's details.
function describe(entry: ActivityEntry): string {
  const d = entry.detail as Record<string, any>
  switch (entry.kind) {
    case 'question':
      return `“${d.question}”`
    case 'answer':
      return `${d.trace?.length ?? 0} tool call(s) · ${Math.round(d.seconds ?? 0)} s · citations ${d.citations_ok ? 'verified' : 'NOT verified'}`
    case 'agent_error':
      return d.error ?? 'The agent failed'
    case 'audit_log_search':
      return `${d.result_count ?? 0} result(s) · filters ${JSON.stringify(d.filters ?? {})}`
    case 'login':
      return 'Logged in'
    default:
      return JSON.stringify(d)
  }
}

export function ActivityPage() {
  const [kind, setKind] = useState('')
  const log = useActivityLog(kind)
  const users = useUsers()

  const userName = (id: string | null) =>
    id ? users.data?.find((u) => u.id === id)?.name ?? id : 'System'

  const rows = log.data?.pages.flatMap((page) => page.items) ?? []

  const columns: Column<ActivityEntry>[] = [
    { key: 'time', header: 'Time (UTC)', render: (e) => <span className="nowrap">{formatUtc(e.created_at)}</span> },
    { key: 'user', header: 'User', render: (e) => userName(e.user_id) },
    { key: 'kind', header: 'What', render: (e) => KIND_NAMES[e.kind] ?? e.kind },
    { key: 'detail', header: 'Details', render: (e) => <span className="activity__detail">{describe(e)}</span> },
    {
      key: 'investigation', header: 'Investigation',
      render: (e) => e.investigation_id ? <Link to={`/investigations/${e.investigation_id}`}>Open</Link> : '—',
    },
  ]

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h1>Activity log</h1>
          <p className="muted">Everything users and the agent did, newest first. Entries can't be edited or deleted.</p>
        </div>
      </header>

      <div className="filters">
        <FormField id="kind" label="Show">
          <select id="kind" className="field" value={kind} onChange={(e) => setKind(e.target.value)}>
            {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
          </select>
        </FormField>
      </div>

      {log.isPending && <p role="status" className="muted">Loading the activity log…</p>}
      {log.isError && <p role="alert" className="form-error">{friendlyError(log.error)}</p>}
      {log.data && (
        <>
          <DataTable title="Activity log" rows={rows} columns={columns} rowKey={(e) => e.id}
            emptyText="Nothing recorded yet." pageSize={0} />
          {log.hasNextPage && (
            <Button variant="secondary" onClick={() => log.fetchNextPage()}
              busy={log.isFetchingNextPage} busyLabel="Loading…" className="load-more">
              Load more
            </Button>
          )}
        </>
      )}
    </div>
  )
}
