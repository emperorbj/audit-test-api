---
id: stepper
name: Stepper (horizontal and vertical)
type: component
status: approved
confidence: high
source_projects: [sagicor-business-banking-frontend]
evidence:
  - type: source_code
    path: components/auth/signup-steps.tsx, components/auth/journey-progress.tsx
    note: two horizontal bar implementations
  - type: source_code
    path: components/caipo/registration-stepper.tsx, components/shared/step-marker.tsx
    note: vertical stepper (done/current/upcoming, completed steps clickable)
  - type: running_app
    path: /signup, /dashboard/onboarding
    note: seen in headless-Chrome screenshots (extraction Section 7)
reuse_permission: cleared
version: 0.1.0
last_reviewed: 2026-10-20
tags: [stepper, progress, wizard]
related: [config-driven-wizard]
framework: react
variants: [horizontal, vertical]
states: [done, current, upcoming]
accessibility: Wrapped in a labelled nav; current step marked aria-current="step".
---

# Stepper

## Purpose
Shows progress through a multi-step flow.

## Anatomy and variants
- **Horizontal:** compact bars, used for short flows such as sign-up.
- **Vertical:** a list of steps with markers, used for long wizards.
  - The final step reads "Finish".
  - Below `lg` it collapses to a "Step x of y" line.

## States and behavior
| State | Marker |
|---|---|
| Done | Check |
| Current | Highlighted |
| Upcoming | Muted |

In the vertical variant, completed steps can be clicked to revisit them.

## Accessibility
The stepper sits in a `nav` with an `aria-label`, and the current step has `aria-current="step"`.

## Usage guidance
**Use when:** flows with 3 or more steps.
**Avoid when:** single-page forms.

## Differences across source projects
Within the one source project there are **three separate implementations**.

## Review notes
- **What this proposes:** a *consolidated* stepper (one horizontal and one vertical), as the extraction recommends. It does not propose any of the existing implementations as-is.
- **New id:** `stepper`, because it doesn't match one existing component. The project record is `step-indicators`.
