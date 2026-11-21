---
id: session-routing
name: BFF Session and Route Guarding
type: pattern
status: approved
confidence: medium
source_projects: [sagicor-business-banking-frontend]
evidence:
  - type: source_code
    path: proxy.ts:17-37
    note: redirects signed-out users to /login?next=, unfinished-setup users to setup, signed-in users away from auth pages
  - type: source_code
    path: components/shared/providers.tsx:22-25
    note: 401 clears session and redirects with toast
  - type: documentation
    path: README.md (API integration)
    note: JWT in httpOnly cookie set by route handlers; API proxied through app/api/v1/[...path]
reuse_permission: cleared
version: 0.1.0
last_reviewed: 2026-10-20
tags: [auth, security, routing, bff]
related: []
use_when: Web apps that call an authenticated API through their own server (backend-for-frontend)
avoid_when: Static or public marketing pages
requires_components: []
---

# BFF Session and Route Guarding

## Problem it solves
Protects the app, keeps tokens away from client JavaScript, and sends each user to the right place for their state.

## Behavior
- **Token storage:** the JWT lives in an httpOnly cookie, set by server route handlers. API calls go through a server proxy route.
- **Route guard redirects:**
  - Signed-out users go to `/login?next=…`.
  - Users with unfinished setup go to setup.
  - Signed-in users are sent away from auth pages.
- **Expired sessions:** a 401 clears the session, redirects, and shows a toast. 401s are not retried.

## Required components
None.

## Trade-offs and constraints
The guard checks only the token's expiry, not its signature. The backend must verify every request.

## Accessibility considerations
The redirect toast must be announced. Sonner provides a live region.

## Differences across source projects
Single source project so far.

## Review notes
- **Rationale:** the extraction calls this a sound security posture for API-backed Next.js apps.
- **Before approving:** get a security reviewer's sign-off. This is an engineering pattern rather than a visual one.
