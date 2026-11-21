---
id: mask-icon-currentcolor
name: Mask Icons that Follow currentColor
type: pattern
status: approved
confidence: high
source_projects: [sagicor-business-banking-frontend]
evidence:
  - type: source_code
    path: components/ui/mask-icon.tsx:8-22
    note: SVG applied as a CSS mask over a currentColor background
  - type: source_code
    path: components/dashboard/nav-icon.tsx
    note: used for all 19 navigation icons
  - type: running_app
    path: /dashboard
    note: sidebar icons seen in active and idle states in screenshots (extraction Section 7)
reuse_permission: cleared
version: 0.1.0
last_reviewed: 2026-10-20
tags: [icons, css, theming]
related: []
use_when: Single-colour SVG icons supplied as files must take the text colour (active and hover states, themes)
avoid_when: Multi-colour icons or illustrations; icons available as inline SVG components
requires_components: []
---

# Mask Icons that Follow currentColor

## Problem it solves
Lets icons that were supplied as SVG files change colour with their state without editing each file.

## Behavior
1. The SVG is applied as `mask-image` on an element.
2. That element's background is `currentColor`.
3. The icon therefore takes on the surrounding text colour, so active and hover states and themes just work.

## Required components
None. It's a small `MaskIcon` helper.

## Trade-offs and constraints
- **Single colour only.**
- **Loading:** the SVG is fetched as a separate URL.

## Accessibility considerations
Decorative icons should be `aria-hidden`. Meaningful icons need an accessible label on the parent control.

## Differences across source projects
Single source project so far.

## Review notes
- **Rationale:** the extraction recommends this technique as a share candidate.
- **What's in scope:** only the technique. The icon files themselves have `unknown` ownership and stay in the project.
