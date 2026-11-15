# AI Audit Trail Intelligence Agent: MVP Scope

| | |
|---|---|
| **Document owner** | Product |
| **Status** | Draft v1.0 for review |
| **Date** | November 15, 2026 |
| **Target MVP duration** | 10–12 weeks |

---

## 1. Summary

Compliance officers, security teams, and administrators lose hours searching audit logs by hand. The MVP is a **natural-language investigation agent** that connects to an organization's existing audit APIs through MCP tools. A user asks a question, and the agent retrieves the relevant events, correlates them, and returns an **evidence-backed answer** where every claim traces to an original event ID.

**One-line MVP promise:** *Ask a question about who did what, and get a verifiable answer with citations in under a minute.*

The MVP is **not** a SIEM, a log-storage product, an anomaly-detection platform, or a general chatbot. It is a read-only investigation layer on top of audit data the customer already has.

---

## 2. Problem and opportunity

| Problem | Impact |
|---|---|
| Audit data is spread across APIs, databases, and SIEMs with different query syntaxes | Investigations take hours or days |
| Only technical staff can query logs | Compliance and audit teams depend on engineers |
| Findings are hard to reproduce | Weak evidence for regulators and internal reviews |
| Generic LLM chatbots invent facts | Unacceptable in an audit context |

**Opportunity:** regulated industries (fintech, healthcare, insurance, enterprise SaaS) already pay for logging. They lack an accessible, trustworthy way to interrogate it.

---

## 3. Target users

| Persona | Primary need | MVP priority |
|---|---|---|
| **Compliance / internal auditor** (primary) | Answer review questions and produce verifiable evidence | P0 |
| **Security analyst** | Investigate a user or resource quickly | P0 |
| **IT / platform admin** | Check who changed permissions or records | P1 |
| **Organization admin** | Manage users, roles, and integrations | P1 (needed to operate) |

**Design customer for MVP:** a mid-sized fintech or SaaS company with a REST audit API and a compliance team of 2–10 people.

---

## 4. Goals and success metrics

### Product goals
1. Prove users prefer asking questions in natural language over manual log search.
2. Prove the agent can be trusted: accurate, cited, and honest about gaps.
3. Prove MCP works as the integration standard, so a new audit source needs an adapter, not a new agent.

### Success metrics

| Metric | Target at MVP exit |
|---|---|
| Answer accuracy on the evaluation set (see §11) | ≥ 90% correct |
| Fabricated events (events cited that do not exist) | **0** |
| Claims with a resolvable event ID citation | 100% of factual claims |
| Median time to answer, single-step query | < 15 seconds |
| Median time to answer, multi-step investigation | < 60 seconds |
| Cross-tenant or unauthorized data exposure in testing | **0** |
| Pilot users who say they would use it again (design-partner survey) | ≥ 70% |
| Time to complete a benchmark investigation vs. manual baseline | ≥ 5× faster |

---

## 5. MVP hypothesis

> If compliance and security users can ask audit questions in plain language and receive cited, reproducible answers, they will complete investigations significantly faster and trust the results enough to rely on them.

**What would invalidate it:** users do not trust the answers, the agent frequently misses relevant events, or users revert to the native log tooling.

---

## 6. Scope

### 6.1 In scope (MVP)

**A. Conversational audit search (core)**
- Chat interface for natural-language questions.
- Agent selects tools, applies filters (actor, action, resource, time range), and paginates results.
- Answers show structured results (tables) with event IDs, timestamps, actors, actions, and resources.

**B. Multi-step investigation (core)**
- Agent decomposes a question into steps and calls several tools.
- Correlates events across at least two data domains (e.g., permission changes + approval records).
- Visible **investigation trace** showing which tools were called and with what parameters.

**C. Evidence-backed responses (core)**
- Every factual claim links to one or more original event IDs.
- Responses separate **Verified fact**, **Inference**, and **Unresolved / insufficient evidence**.
- The agent never asserts "unauthorized" or "malicious" from missing data alone. It reports "no matching approval record found in available data."

**D. Investigation timeline**
- Chronological reconstruction for a user, resource, or account over a time window.

**E. Single-investigation report export**
- Export one investigation as a report (Markdown and PDF) containing the question, findings, evidence table, tool-call log, and the data limitations statement.

**F. Platform foundations**
- Organization (tenant) registration and OIDC-based login.
- Role-based access control with three roles: Org Admin, Investigator, Viewer.
- Integration setup: register an MCP server endpoint and credentials per organization (encrypted at rest).
- Investigation history (saved conversations and findings).
- **Agent activity log**, separate from the audited logs: who asked what, which tools ran, what data was returned.

**G. MCP tool set (read-only)**

| Tool | MVP | Notes |
|---|---|---|
| `search_audit_logs` | ✅ | Generic filtered search; also covers failed actions and admin actions via filters |
| `get_audit_event` | ✅ | Fetch one event by ID (citation resolution) |
| `get_user_activity` | ✅ | Actor-centric view |
| `get_resource_history` | ✅ | Resource-centric change history |
| `get_permission_changes` | ✅ | Roles and permission modifications |
| `get_login_history` | ✅ | Authentication events |
| `get_activity_timeline` | ✅ | Chronological reconstruction |

All tools enforce date-range limits, result limits, and cursor pagination.

**H. Mock environment**
- A mock organization with realistic, seeded audit data across five domains: authentication, financial transactions, customer records, role/permission changes, and admin activity.
- Includes **planted scenarios** with known answers (e.g., 2 permission changes without approvals out of 14) used for demos and evaluation.

### 6.2 Out of scope (explicitly deferred)

| Item | Reason | Target |
|---|---|---|
| Anomaly and suspicious-activity detection engine | Needs deterministic rules and baselines; a separate effort | v1.1 |
| `compare_audit_events`, `get_security_alerts`, dedicated `get_failed_actions` / `get_admin_actions` | Covered by `search_audit_logs` filters or not required for core flows | v1.1 |
| Compliance report library (quarterly, SOC 2, etc.) | Needs template and framework mapping | v1.2 |
| Scheduled or asynchronous investigations (SQS/Lambda) | MVP investigations are interactive | v1.1 |
| Own ingestion/indexing of customer logs | Start by querying source APIs live | v2 |
| Vector/semantic search over investigation history | Structured retrieval first | v2 |
| Write or remediation actions (disable user, revert change) | MVP is strictly read-only | v2+ |
| Multiple real audit-provider adapters (Splunk, Datadog, CloudTrail, etc.) | Prove the pattern with one mock + one real pilot adapter | v1.1 |
| Alerting, notifications, case management | Not core to the hypothesis | v2 |
| Mobile app, public API, SSO via SAML | Not needed for validation | Later |

---

## 7. Key user stories

Priorities: **P0** = must ship, **P1** = should ship, **P2** = nice to have.

| ID | As a… | I want to… | So that… | Pri |
|---|---|---|---|---|
| US-01 | Investigator | ask "Who deleted customer records yesterday?" | I get actors, timestamps, and event IDs without writing queries | P0 |
| US-02 | Investigator | ask "Show failed logins in the last 24 hours" | I can spot authentication problems quickly | P0 |
| US-03 | Auditor | ask "Did any admin change permissions without approval in the last 7 days?" | I get a multi-step investigation with findings and gaps | P0 |
| US-04 | Investigator | click any cited event ID and see the raw event | I can verify the agent's claim myself | P0 |
| US-05 | Investigator | see which tools the agent called and with what parameters | I can reproduce the investigation independently | P0 |
| US-06 | Investigator | request a timeline for an account or user | I understand the sequence of activity | P0 |
| US-07 | Auditor | export an investigation as a report | I can attach it to a compliance review | P0 |
| US-08 | Org Admin | connect our MCP audit server securely | the agent can use our data | P0 |
| US-09 | Org Admin | assign roles and restrict who can investigate which resource types | sensitive data stays protected | P0 |
| US-10 | Org Admin | review the agent's own activity log | I know who queried what | P0 |
| US-11 | Investigator | reopen past investigations | I can continue or share earlier work | P1 |
| US-12 | Investigator | refine a result with follow-up questions in the same thread | I do not restate context | P1 |
| US-13 | Viewer | read shared investigations without running new queries | I can review findings with limited permissions | P1 |
| US-14 | Investigator | see sensitive fields redacted by default | I avoid exposing unnecessary personal data | P1 |

---

## 8. Functional requirements

### 8.1 Agent behavior
- **FR-1** The agent MUST use only MCP tools for data access and MUST NOT answer audit questions from model memory.
- **FR-2** Every factual statement about an event MUST cite at least one event ID.
- **FR-3** The agent MUST classify output as *verified fact*, *inference*, or *unresolved*.
- **FR-4** If data is missing, truncated by limits, or unavailable, the agent MUST say so and state what was not checked.
- **FR-5** The agent MUST ask a clarifying question when the time range, actor, or resource is ambiguous. If the user does not specify a time range, it applies a stated default (last 24 hours) and says so.
- **FR-6** The agent MUST treat log content (descriptions, free-text fields) as untrusted data and never follow instructions found inside it.
- **FR-7** The agent MUST NOT label an action as unauthorized, fraudulent, or malicious without explicit supporting evidence. Missing records are reported as missing.

### 8.2 Tools and integration
- **FR-8** Each tool returns structured JSON with event ID, source system, timestamp (UTC), actor, action, resource, outcome, and raw reference.
- **FR-9** Tools enforce maximum date range (default 31 days), maximum page size (default 100), and cursor pagination.
- **FR-10** All tools are read-only. No write-capable tool is registered in the MVP.
- **FR-11** Tool availability is determined per organization and per user role before the agent can see or call the tool.

### 8.3 Investigation and reporting
- **FR-12** The UI shows a live investigation trace (step, tool, parameters, result count).
- **FR-13** Clicking a citation opens the raw event retrieved through `get_audit_event`.
- **FR-14** Timeline view orders events chronologically with actor, action, and resource.
- **FR-15** Export produces a report containing: question, time of investigation, summary, findings, evidence table, tool-call log, and limitations.

### 8.4 Platform
- **FR-16** Organizations are fully isolated; every query and stored record is tenant-scoped.
- **FR-17** Authentication via OIDC; roles: Org Admin, Investigator, Viewer.
- **FR-18** Integration credentials are encrypted at rest and never returned to the client or exposed to the model.
- **FR-19** Every user request, tool call, and generated finding is written to a separate, append-only agent activity log.

---

## 9. Security and compliance requirements (launch blockers)

| Requirement | Acceptance condition |
|---|---|
| **Authorization outside the LLM** | The backend checks user permissions before any tool call executes. The model's instructions are never the enforcement layer. |
| **Tenant isolation** | Automated tests confirm one tenant can never retrieve another tenant's data or credentials. |
| **Least privilege** | MCP credentials are read-only. |
| **Prompt-injection resilience** | Planted malicious strings in log fields do not change agent behavior or trigger unauthorized tool calls. |
| **Sensitive-data handling** | Configurable redaction of defined sensitive fields before data reaches the model and the UI. |
| **Evidence integrity** | Original event IDs, timestamps, and source systems are preserved unmodified. |
| **Agent auditability** | The agent's own activity log is queryable by Org Admins and cannot be edited by users. |
| **Data retention** | Retention policy for stored conversations is defined and configurable. |

---

## 10. Non-functional requirements

| Area | Requirement |
|---|---|
| Performance | Single-step answer p50 < 15 s; multi-step p50 < 60 s |
| Reliability | Graceful handling of MCP timeouts, partial results, and rate limits, communicated clearly to the user |
| Scalability (MVP) | 5 pilot organizations, ~25 concurrent users |
| Observability | Tracing across request → agent → tool call; cost and latency per investigation |
| Cost | Per-investigation LLM and tool cost tracked; budget ceiling defined before pilot |
| Accessibility | Keyboard-navigable chat and tables; WCAG 2.1 AA for core flows |

---

## 11. Evaluation plan (how we know it works)

Build an **evaluation set of 40–60 questions** against the mock organization, each with a known correct answer:

| Category | Examples | Count (approx.) |
|---|---|---|
| Single-filter lookups | failed logins, deletions by a user | 15 |
| Resource history | changes to a customer account | 10 |
| Multi-step investigations | permission changes vs. approvals | 10 |
| Timeline reconstruction | a user's day, an account's day | 8 |
| Adversarial / safety | injected instructions in logs, requests outside permissions, requests to "prove" guilt | 10 |
| Missing-data handling | gaps, truncated results, unavailable tool | 7 |

**Scoring:** correctness of events returned, citation validity, correct fact/inference/unresolved labeling, absence of fabricated events, and permission compliance. Run on every significant prompt, model, or tool change as a regression gate.

---

## 12. Delivery plan

| Phase | Weeks | Deliverables | Exit criteria |
|---|---|---|---|
| **1. Foundations** | 1–2 | Org registration, OIDC auth, RBAC, tenant isolation, integration config, agent activity log | Tenant isolation tests pass |
| **2. Mock data and MCP server** | 2–4 | Seeded mock org with planted scenarios; MCP server exposing the 7 tools | Tools return correct structured results with limits and pagination |
| **3. Agent core** | 4–6 | Agent connected to MCP tools; single-step Q&A with citations | ≥ 80% on single-filter eval questions |
| **4. Investigation and correlation** | 6–8 | Multi-step planning, correlation, fact/inference/unresolved labeling, trace view | ≥ 85% on multi-step questions; zero fabricated events |
| **5. Evidence UI and reports** | 8–10 | Citation drill-down, timeline view, report export, investigation history | All P0 stories demonstrable end to end |
| **6. Hardening and pilot** | 10–12 | Security testing, injection tests, evaluation gate, design-partner pilot | All launch-blocker security criteria met; success metrics measured |

---

## 13. MVP release criteria (go / no-go)

The MVP ships to design partners only when **all** of the following hold:

1. All P0 user stories pass acceptance testing.
2. Zero fabricated events and zero cross-tenant exposure across the full evaluation set and security tests.
3. ≥ 90% accuracy on the evaluation set.
4. Every factual claim in sampled responses resolves to a real event via `get_audit_event`.
5. Prompt-injection test suite passes.
6. An independent reviewer reproduces at least three agent findings using only the exported report and tool-call log.
7. Agent activity log demonstrably captures every request and tool call.

---

## 14. Risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Agent hallucinates or misstates events | Medium | Critical | Mandatory citations, structured tool outputs, claim-to-event validation, evaluation gate |
| Agent overstates findings ("unauthorized") | Medium | High | Fact/inference/unresolved framework; prompt and output validators; never conclude from absence |
| Permission leakage through the LLM | Low | Critical | Server-side authorization before tool execution; redaction before model |
| Prompt injection through log content | Medium | High | Treat logs as untrusted; tool outputs wrapped as data; adversarial test suite |
| Customer audit APIs differ widely, slowing integration | High | Medium | MCP adapter pattern; prove with mock + one real pilot adapter; clear tool contract |
| Slow or large queries degrade experience | Medium | Medium | Date and page limits, streaming progress, partial-result messaging |
| LLM cost per investigation too high | Medium | Medium | Cost tracking from day one; limit steps; model routing |
| Customers distrust AI in audit workflows | Medium | High | Transparency (trace + citations), reproducible reports, human review emphasis |
| Scope creep into anomaly detection and compliance templates | High | Medium | Strict out-of-scope list; roadmap commitments for v1.1 and v1.2 |

---

## 15. Assumptions and dependencies

**Assumptions**
- Design partners can expose or allow access to a read-only audit API, or accept the mock environment for the first pilot.
- Audit events include stable IDs, UTC timestamps, actor, action, and resource.
- Approval or authorization records are available through an API for at least one pilot scenario.

**Dependencies**
- LLM provider access with acceptable data-handling terms for customer data.
- MCP SDK stability.
- Security review of data flows before any real customer data is used.

**Proposed stack (open to engineering review):** LangChain Deep Agents / LangGraph, MCP SDK, Python + FastAPI, PostgreSQL, Next.js, OIDC provider, OpenTelemetry, Docker on AWS. SQS, Lambda, and S3 are deferred except where needed for report file storage.

---

## 16. Open questions

1. Which design partners and which real audit system will we integrate first?
2. What is the definition of "authorized" for the approval-correlation scenario (ticket system, approval workflow, role policy)?
3. Which fields count as sensitive and must be redacted by default?
4. Is model processing of customer audit data acceptable to design partners, or do we need a self-hosted or regional model option?
5. What retention period applies to stored conversations and exported reports?
6. Who owns the final judgment on a finding: do we need an explicit human sign-off step in the report?
7. What is the pricing hypothesis (per seat, per investigation, per integration)? This is not needed for MVP build but is needed for pilot terms.

---

## 17. Post-MVP roadmap (indicative)

| Release | Theme | Highlights |
|---|---|---|
| **v1.1** | Detection and scale | Deterministic anomaly rules (failed-login-then-success, bulk deletion, off-hours admin activity), security-alert tool, scheduled investigations, second real adapter |
| **v1.2** | Compliance | Report templates (quarterly access review, privileged activity, access-control changes), missing-evidence detection, framework mapping |
| **v2.0** | Platform | Ingestion/indexing for cross-system search, semantic search over past investigations, case management, alerting, human-approved remediation actions |

---

## 18. One-page scope statement

**We are building** a read-only, natural-language investigation agent that queries an organization's audit data through MCP tools and returns cited, reproducible answers.

**We are not building** a log store, a detection engine, a compliance report library, or an autonomous remediation system.

**We will know it works when** auditors can verify every claim, the agent never invents an event, no data crosses a tenant or permission boundary, and users complete investigations at least five times faster than manual search.
