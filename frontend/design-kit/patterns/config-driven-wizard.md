---
id: config-driven-wizard
name: Configuration-driven Multi-step Wizard
type: pattern
status: approved
confidence: high
source_projects: [sagicor-business-banking-frontend]
evidence:
  - type: source_code
    path: components/onboarding/onboarding-wizard.tsx:38-119
    note: step list derived from earlier answers; save and exit; locked after submit
  - type: source_code
    path: lib/onboarding/business-types.ts, lib/onboarding/schemas.ts
    note: field definitions as data (FieldDef) and Zod schemas generated from the same data
  - type: source_code
    path: components/onboarding/fields/config-field.tsx
    note: renders any FieldDef (text, number, date, select, textarea, toggle, chips, address, upload)
  - type: source_code
    path: hooks/use-onboarding-draft.ts:16
    note: draft persisted in localStorage
  - type: running_app
    path: /dashboard/onboarding
    note: several steps seen at desktop and 390px (extraction Section 7)
reuse_permission: cleared
version: 0.1.0
last_reviewed: 2026-10-20
tags: [wizard, schema-driven, forms, onboarding]
related: [stepper, rhf-zod-forms, form-field]
use_when: Many similar variants of one long process (e.g. onboarding branches by entity type)
avoid_when: Short, fixed flows where a hand-built form is simpler
requires_components: [stepper, form-field]
---

# Configuration-driven Multi-step Wizard

## Problem it solves
A process with many branches (16+ in the source project) without building one screen per branch.

## Behavior
- **Steps from data:** the step list comes from the user's earlier answers.
- **One definition per field:** each field is declared once as data (`FieldDef`). The UI and the Zod validation schema are both generated from that definition.
  - `FieldDef` covers: required, hint, rule, options, format, min/max and min/max length.
- **Navigation:** a vertical stepper. Completed steps can be revisited.
- **Saving:** "Save & exit" keeps a draft between visits.
- **After submit:** the wizard is locked.

## Required components
- `stepper`
- `form-field`
- A field renderer that maps `FieldDef` types to controls

## Trade-offs and constraints
- **Draft storage:** the draft lives only in the browser (`localStorage`). A shared version should define server-side drafts.
- **Uploads:** only file metadata is kept.

## Accessibility considerations
- Chip groups use `role="group"` with `aria-pressed`.
- File inputs are labelled.
- Required asterisks are `aria-hidden`.

## Differences across source projects
Single source project so far.

## Review notes
- **Rationale:** the extraction recommends this, together with the onboarding field kit, as a share candidate.
- **What's in scope:** only the mechanism.
- **What's excluded:** the Barbados KYC/KYB field content, document rules and review lanes are client business logic. They are `restricted` and stay out.
