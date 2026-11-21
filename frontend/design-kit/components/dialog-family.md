---
id: dialog-family
name: Dialog Family (action, success, processing, PIN)
type: component
status: approved
confidence: medium
source_projects: [sagicor-business-banking-frontend]
evidence:
  - type: source_code
    path: components/shared/action-dialog.tsx:10-22
    note: form/confirm dialog, optional onSubmit renders a form
  - type: source_code
    path: components/shared/success-dialog.tsx:14-22
    note: success result with primary and optional secondary action
  - type: source_code
    path: components/shared/processing-dialog.tsx:10-22
    note: role=status with aria-busy
  - type: source_code
    path: components/shared/pin-dialog.tsx:11-60
    note: submit disabled until all PIN digits entered
  - type: source_code
    path: components/dashboard/sign-out-dialog.tsx:26-42
    note: destructive confirmation (Cancel outline + danger button, pending label)
reuse_permission: cleared
version: 0.1.0
last_reviewed: 2026-10-20
tags: [dialog, confirmation, destructive-action]
related: [dialog-shell, money-movement-confirmation]
framework: react
variants: [action, success, processing, pin]
states: [idle, pending, busy, complete]
accessibility: Inherits dialog-shell; processing dialog uses role=status with aria-busy; PIN digits individually labelled.
---

# Dialog Family

## Purpose
Standard dialog contents for confirming, showing a result, waiting, and authorising.

## Anatomy and variants
| Dialog | What it does |
|---|---|
| Action | A title, a body and a footer. With `onSubmit` it renders as a form. Optional divided header. |
| Destructive action | An Action dialog with Cancel (outline) and a danger-filled button. |
| Success | A hero illustration, a message, a primary action and an optional secondary action. |
| Processing | An in-progress status. |
| PIN | An OTP-style PIN entry to authorise an action. |

## States and behavior
- **Pending:** the primary button shows a "…ing" label and is disabled.
- **PIN:** submit stays disabled until every digit is entered.

## Accessibility
- **Processing:** announced through `role="status"` and `aria-busy`.
- **PIN:** each digit has its own label.

## Usage guidance
**Use when:** confirmations, results of irreversible actions, and authorisation steps.
**Avoid when:** simple informational messages. Use toasts.

## Differences across source projects
Single source project so far.

## Review notes
- **Rationale:** a coherent set built on one primitive. Used in 22, 15, 4 and 4 files.
- **Destructive variant:** only sign-out was confirmed to use it.
- **Project-specific visuals:** the success hero illustration is client artwork. Leave it out of any shared version.
