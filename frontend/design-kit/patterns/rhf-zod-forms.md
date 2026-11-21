---
id: rhf-zod-forms
name: Schema-validated Forms (React Hook Form + Zod)
type: pattern
status: approved
confidence: medium
source_projects: [sagicor-business-banking-frontend]
evidence:
  - type: source_code
    path: lib/validation/auth.ts, lib/onboarding/schemas.ts
    note: Zod schemas per form/step
  - type: source_code
    path: components/auth/profile-form.tsx
    note: zodResolver, noValidate, inline errors
  - type: source_code
    path: lib/api/client.ts:5-21
    note: backend errors routed to toasts
reuse_permission: cleared
version: 0.1.0
last_reviewed: 2026-10-20
tags: [form, validation]
related: [form-field, global-toasts]
use_when: All data-entry forms
avoid_when: Trivial single toggles that save immediately
requires_components: [form-field]
---

# Schema-validated Forms

## Problem it solves
Consistent client-side validation and inline error display across every form.

## Behavior
- One Zod schema per form or step, connected through React Hook Form's resolver.
- Forms use `noValidate`, so the browser's own error bubbles don't appear.
- Errors show under the fields on submit, then fields re-validate as they change.
- Required fields show an asterisk.
- Backend errors appear as toasts.

## Required components
`form-field`

## Trade-offs and constraints
- **Gap:** backend *field* errors aren't mapped onto fields; they only appear as a toast. Decide whether a shared version should map them.

## Accessibility considerations
Uses `form-field` wiring: `aria-invalid`, `aria-describedby`, and error ids announced through `role="alert"`.

## Differences across source projects
Single source project so far.

## Review notes
- **Rationale:** a consistent validation model. The extraction recommends it as a share candidate.
- **Stack:** specific to React, React Hook Form and Zod. Decide whether the standard should name the libraries or only the behaviour.
