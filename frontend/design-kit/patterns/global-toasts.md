---
id: global-toasts
name: Automatic API Feedback Toasts
type: pattern
status: approved
confidence: medium
source_projects: [sagicor-business-banking-frontend]
evidence:
  - type: source_code
    path: components/shared/providers.tsx:20-47
    note: mutation cache toasts response.message / error.message; query errors toast; errors de-duplicated by message
  - type: source_code
    path: components/ui/sonner.tsx:9-11
    note: richColors, top-right, close button
reuse_permission: cleared
version: 0.1.0
last_reviewed: 2026-10-20
tags: [feedback, toast, api]
related: [rhf-zod-forms]
use_when: The backend returns user-ready messages
avoid_when: Messages may be technical or sensitive (the source dev backend puts OTP codes in messages)
requires_components: []
---

# Automatic API Feedback Toasts

## Problem it solves
Every API call gives the same kind of success and error feedback, without per-form toast code.

## Behavior
- **Mutations:** the global mutation handler toasts the backend's message on both success and failure.
- **Queries:** query errors toast too.
- **Duplicates:** repeated errors with the same message are shown once.

## Required components
A toaster (sonner in the source project).

## Trade-offs and constraints
- **Copy quality** depends entirely on the backend.
- **Leak risk:** technical or sensitive text can leak. The source dev backend exposes OTP codes in its messages.

## Accessibility considerations
Toasts must sit in a live region and must not be the only place an error appears for form fields.

## Differences across source projects
Single source project so far.

## Review notes
The extraction classes this as an *improvement to a common pattern*. **Required before approval:**
1. Map backend field errors onto the form fields.
2. Add a guard or allow-list so technical messages aren't shown to users.
