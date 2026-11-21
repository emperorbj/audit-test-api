# Design Kit

Generated from the organisation's design-knowledge repository (`fa-design-system`) on 2026-11-21.
**Do not edit files here by hand.** Regenerate with `python3 scripts/export_kit.py` from that repo.
Product-specific notes go in [PROJECT-NOTES.md](PROJECT-NOTES.md), which regeneration never touches.

## Rules for agents and developers
1. Read [PROJECT-NOTES.md](PROJECT-NOTES.md) first. It says which records apply to this product.
2. Records under **Approved** are standards. Follow them.
3. Anything marked **CANDIDATE** is not yet approved. You may use it, but say so in your PR or summary.
4. Use the semantic colour tokens (`--primary`, `--background`, `--border`, `--ring`…). Never hard-code hex values in components.
5. Need a component or pattern that is not here? Build it, then list it in your summary as a new proposal for the design repository. Do not edit kit files.
6. Before finishing UI work, go through [checklist.md](checklist.md).
7. Evidence paths in records point at the source project the knowledge came from, not at this repo. They are provenance, not files to open.

## Approved components
| Id | Summary | File |
|---|---|---|
| `data-table` | Search, sort and paginate table. Known gap: client-side only, no server paging | [components/data-table.md](components/data-table.md) |
| `dialog-family` | Action, destructive, success, processing and PIN dialogs | [components/dialog-family.md](components/dialog-family.md) |
| `dialog-shell` | Base modal: centre, side sheet, top-right. Known gap: no reduced-motion variant | [components/dialog-shell.md](components/dialog-shell.md) |
| `form-field` | Label, control, hint and error wrapper with accessible error ids | [components/form-field.md](components/form-field.md) |
| `stepper` | Consolidated horizontal and vertical stepper (target design; source has 3 implementations) | [components/stepper.md](components/stepper.md) |

## Approved patterns
| Id | Summary | File |
|---|---|---|
| `config-driven-wizard` | Multi-step wizard generated from field definitions | [patterns/config-driven-wizard.md](patterns/config-driven-wizard.md) |
| `global-toasts` | Automatic API feedback toasts. Known gaps: no field-error mapping, no technical-message guard | [patterns/global-toasts.md](patterns/global-toasts.md) |
| `mask-icon-currentcolor` | SVG mask icons that follow currentColor | [patterns/mask-icon-currentcolor.md](patterns/mask-icon-currentcolor.md) |
| `money-movement-confirmation` | Review, authorise, process, succeed | [patterns/money-movement-confirmation.md](patterns/money-movement-confirmation.md) |
| `rhf-zod-forms` | Schema-validated forms with inline errors | [patterns/rhf-zod-forms.md](patterns/rhf-zod-forms.md) |
| `session-routing` | BFF httpOnly-cookie session and route guard | [patterns/session-routing.md](patterns/session-routing.md) |

## Foundations: CANDIDATE (not yet approved)
| Id | Name | Record | Token files |
|---|---|---|---|
| `supabase-color-system` | Supabase Colour System (shadcn semantic tokens, OKLCH) | [foundations/supabase-color-system.md](foundations/supabase-color-system.md) | [tokens/supabase-theme.css](tokens/supabase-theme.css), [tokens/a11y-overrides.css](tokens/a11y-overrides.css), [tokens/tailwind-theme.css](tokens/tailwind-theme.css) |

### Using the colour tokens
Import in this order, once, at the app root:
```css
/* @import "tailwindcss";   only if using Tailwind v4 */
@import "../design-kit/tokens/supabase-theme.css";
@import "../design-kit/tokens/a11y-overrides.css";
/* @import "../design-kit/tokens/tailwind-theme.css";   only with Tailwind v4 */
```
Set `class="light"` or `class="dark"` on `<html>`. Without a class you get the root defaults, which are a slightly different dark from `.dark`. Load `a11y-overrides.css` too: it fixes upstream contrast failures (input borders, the light-mode focus ring, dark destructive text). Use `--destructive-text` when destructive colour is text, not a fill.
