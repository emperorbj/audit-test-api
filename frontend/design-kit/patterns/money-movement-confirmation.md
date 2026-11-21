---
id: money-movement-confirmation
name: Review, Authorise, Process, Succeed
type: pattern
status: approved
confidence: medium
source_projects: [sagicor-business-banking-frontend]
evidence:
  - type: source_code
    path: hooks/use-payment-flow.ts:9-21
    note: state machine edit -> pin -> processing -> done
  - type: source_code
    path: components/transfers/transfer-view.tsx:204-214
    note: review panel, PIN, processing and success dialogs composed
  - type: source_code
    path: components/bills/airtime-panel.tsx, components/payroll/payroll-view.tsx
    note: same flow reused by bills and payroll
reuse_permission: cleared
version: 0.1.0
last_reviewed: 2026-10-20
tags: [money-movement, confirmation, state-machine, payments]
related: [dialog-family]
use_when: Irreversible financial or high-impact actions
avoid_when: Reversible settings changes
requires_components: [dialog-family]
---

# Review, Authorise, Process, Succeed

## Problem it solves
Makes moving money safe and easy to follow. The user always sees what will happen, confirms it on purpose, and gets a clear result.

## Behavior
A small state machine runs each step:

| State | What the user sees |
|---|---|
| edit | The form, then a review panel |
| pin | A PIN dialog |
| processing | A processing dialog |
| done | A success dialog with a follow-up action |

The same hook is reused for transfers, bills and airtime, and payroll.

## Required components
`dialog-family` (PIN, processing, success)

## Trade-offs and constraints
- **Simulated processing:** in the source project, processing is a timer rather than real backend status. A shared version must define real pending, failure and retry states.
- **Error states:** failure states after authorisation weren't observed.

## Accessibility considerations
The processing state is announced through `role="status"` and `aria-busy`, and each PIN digit has its own label.

## Differences across source projects
Single source project so far.

## Review notes
- **Rationale:** a clear structure. The extraction recommends it as a share candidate.
- **Confidence:** medium. The structure was read in code, but the screens weren't visually verified, and the exact review-panel content is inferred.
