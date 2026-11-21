---
id: form-field
name: Form Field (label, control, hint, error)
type: component
status: approved
confidence: high
source_projects: [sagicor-business-banking-frontend]
evidence:
  - type: source_code
    path: components/ui/form-field.tsx:5-44
    note: label + control + hint/error wrapper; required asterisk aria-hidden
  - type: source_code
    path: components/ui/field-error.tsx:3-20
    note: role=alert error with predictable fieldErrorId(htmlFor)
  - type: source_code
    path: components/ui/input.tsx:3-14
    note: single exported fieldStyles shared by input, select, date, textarea
  - type: running_app
    path: /signup
    note: seen in headless-Chrome screenshots (extraction Section 7)
reuse_permission: cleared
version: 0.1.0
last_reviewed: 2026-10-20
tags: [form, accessibility, validation]
related: [rhf-zod-forms]
framework: react
variants: [required, hint]
states: [default, focus, error, disabled]
accessibility: Label bound with htmlFor; error has role=alert and an id derived from the control id, referenced by aria-describedby; asterisk aria-hidden while the control carries required/aria-required.
---

# Form Field (label, control, hint, error)

## Purpose
A single wrapper that gives every form control the same label, hint, required marker and error message, with consistent accessibility wiring.

## Anatomy and variants
- **Label:** a `<label htmlFor>`.
- **Control:** any input, select, date, phone or textarea. They all share one field-style definition, so focus and invalid states look the same.
- **Hint:** hidden while an error is showing.
- **Error:** `role="alert"`, with id `fieldErrorId(htmlFor)`.
- **`required`:** shows a visual asterisk that screen readers skip. The control itself carries `required` / `aria-required`.

## States and behavior
| State | Appearance |
|---|---|
| Default | Normal field |
| Focus | Brand border and ring |
| Error | Destructive border; message below the field |
| Disabled | Disabled styling |

## Accessibility
The predictable error id means a control can set `aria-describedby` without any extra plumbing. Errors are announced through `role="alert"`.

## Usage guidance
**Use when:** any labelled data-entry control.
**Avoid when:** controls that carry their own label, such as RadioCard and checkbox-in-label.

## Differences across source projects
Single source project so far.

## Review notes
- **Rationale:** small and accessible, and it doesn't depend on the project's visual brand. The extraction recommends it as a share candidate.
- **Visual values:** the 60px height, 16px radius and brand ring are project values, not part of the proposal.
- **Permission:** the extraction states `unknown` for the whole project. The proposal is for the behaviour and the API only.
