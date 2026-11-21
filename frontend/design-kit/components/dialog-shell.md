---
id: dialog-shell
name: Dialog Shell (center, side sheet, top-right)
type: component
status: approved
confidence: medium
source_projects: [sagicor-business-banking-frontend]
evidence:
  - type: source_code
    path: components/ui/dialog.tsx:9-77
    note: placement center/right/top-right, dismissible option, scale/opacity or slide transitions
reuse_permission: cleared
version: 0.1.0
last_reviewed: 2026-10-20
tags: [dialog, modal, sheet]
related: [dialog-family]
framework: react
variants: [center, right, top-right]
states: [open, closed]
accessibility: Built on an accessible dialog primitive (Base UI Dialog) - focus trap, Esc to close, title and description wired.
---

# Dialog Shell

## Purpose
One base modal that every dialog and side sheet is built on.

## Anatomy and variants
- **Placement:**
  - `center`
  - `right`: a full-height side sheet, 523px in the source project
  - `top-right`
- **`dismissible`:** when false, clicking outside does nothing.

## States and behavior
- **Rendering:** a portal plus a backdrop.
- **Transitions:**
  - Centred dialogs scale and fade over 100–150ms with ease-out.
  - Side sheets slide in.

## Accessibility
The primitive provides the focus trap, Esc to close, and the title and description wiring.

**Gap:** there is no `prefers-reduced-motion` variant yet. The extraction recommends adding one.

## Usage guidance
**Use when:** any modal or detail sheet.
**Avoid when:** non-blocking feedback. Use toasts for that.

## Differences across source projects
Single source project so far.

## Review notes
- **Rationale:** the extraction recommends the shell and its dialog family together as a share candidate. Used directly in 12 files.
- **Confidence:** medium. Verified in code only; these dialogs weren't visually checked.
- **Before approving:** decide whether reduced-motion support is required.
