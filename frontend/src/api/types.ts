// The shapes of the data the backend sends. They mirror backend/app/schemas/*.py.

export type Role = 'org_admin' | 'investigator' | 'viewer'

export type User = {
  id: string
  name: string
  email: string
  role: Role
  is_active: boolean
}

export type LoginResponse = {
  access_token: string
  token_type: string
  user: User
}

export type Investigation = {
  id: string
  title: string
  created_by: string
  created_at: string // ISO time, UTC
}

// One statement plus the audit events that prove it (or that it's based on).
export type Claim = {
  claim: string
  event_ids: string[]
}

// Our code's check that every cited event really exists (ai-agent/app/agent/citations.py).
export type CitationReport = {
  ok: boolean
  checked_event_ids: string[]
  missing_event_ids: string[]
  facts_without_evidence: string[]
}

// The agent's structured answer, as saved by the backend on an agent message.
export type AgentAnswer = {
  summary: string
  verified_facts: Claim[]
  inferences: Claim[]
  unresolved: string[]
  citations: CitationReport
  seconds: number
}

// One step of the investigation trace: a tool the agent called.
export type TraceStep = {
  tool: string
  args: Record<string, unknown>
  ok: boolean
  result_count: number | null
}

export type Message = {
  id: string
  sender: 'user' | 'agent'
  content: string // the question, or the answer's summary
  answer: AgentAnswer | null // agent messages only
  trace: TraceStep[] | null // agent messages only
  created_at: string
}

export type InvestigationDetail = Investigation & {
  messages: Message[]
}

export type AuditEvent = {
  event_id: string
  occurred_at: string
  source_system: string
  domain: string
  actor: string
  actor_role: string | null
  action: string
  resource_type: string
  resource_id: string
  outcome: string
  description: string | null // untrusted text from the source system
  details: Record<string, unknown> // sensitive fields already redacted by the backend
}

export type ActivityEntry = {
  id: number
  user_id: string | null
  investigation_id: string | null
  kind: string
  detail: Record<string, unknown>
  created_at: string
}

export type ActivityPage = {
  items: ActivityEntry[]
  next_cursor: string | null
}
