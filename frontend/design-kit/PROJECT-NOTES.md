# Project Notes: Audit Agent frontend

Hand-written and specific to this product. `export_kit.py` never overwrites this file. Update it when the product or the kit changes.

**Product:** AI audit-trail investigation agent. Investigators and auditors ask questions in chat and get evidence tables, a live investigation trace, citations, and an exportable report (see `../../audit-agent-mvp-scope.md`).
**Stack today:** Vite + React 19 SPA, react-hook-form, zod, TanStack Query, axios. No Tailwind, no component library, no router yet.
**Hard requirement:** WCAG 2.1 AA for core flows. Chat and tables must be keyboard navigable (scope §10).

## Colour
Use the **CANDIDATE** `supabase-color-system` tokens. Import both `tokens/supabase-theme.css` and `tokens/a11y-overrides.css` from `src/index.css`. Only add `tailwind-theme.css` if Tailwind v4 is adopted. Replace the Vite starter variables in `src/index.css` (`--text`, `--accent`, …) with the semantic tokens.

Audit-specific colour rules:
- **Never use destructive red to mean "suspicious" or "unauthorized".** The agent must not make those claims from missing data (scope FR-7). Use neutral or `info` styling for "no matching record found". Keep `--destructive` for destructive actions and real errors.
- Fact / inference / unresolved labels need text or an icon as well as colour.

## Which kit records apply
| Record | Fit | Notes for this product |
|---|---|---|
| `form-field` | **Use** | Org registration, integration config, settings. |
| `rhf-zod-forms` | **Use** | Libraries are already installed. |
| `dialog-shell` | **Use** | Add the missing reduced-motion variant here, then propose it back. |
| `dialog-family` | **Use, partly** | Use action, destructive, success and processing. **Skip PIN**: there is no PIN step in this product. |
| `data-table` | **Use, with a gap** | Evidence tables need **server-side cursor paging** (FR-9: page size 100, cursor). The approved record is client-side only. Build cursor paging and propose it as a revision. |
| `global-toasts` | **Use, with gaps** | Needs a guard so raw backend or LLM error text never reaches a toast, plus mapping of field errors to forms. |
| `stepper` | **Maybe** | Only if org onboarding or integration setup becomes multi-step. |
| `config-driven-wizard` | **Maybe** | Same as `stepper`. |
| `mask-icon-currentcolor` | **Use** | Icons that follow the theme colour. |
| `session-routing` | **Adapt, needs a decision** | The record assumes a Next.js server (BFF). This is a static Vite SPA. Keep the rule "no tokens in JS-readable storage": have the FastAPI backend set an httpOnly, SameSite cookie after OIDC login, and guard routes client-side. Needs engineering and security sign-off. |
| `money-movement-confirmation` | **Do not use** | Banking-specific. |

## Needed but not in the kit (propose back after building)
- Chat / conversation layout, keyboard accessible, with streaming answers.
- Live investigation trace: step, tool, parameters, result count (FR-12).
- Citation chip with drill-down to the source event.
- Timeline view of events.
- Fact / inference / unresolved labelling for findings.
- Report export flow (Markdown and PDF) with a limitations statement.
- Partial-result and limit-reached messaging (date range or page caps hit).
