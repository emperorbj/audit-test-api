---
id: supabase-color-system
name: Supabase Colour System (shadcn semantic tokens, OKLCH)
type: foundation
status: proposed
confidence: high
source_projects: [supabase-ui-oss]
evidence:
  - type: source_code
    path: github.com/supabase/supabase@4ead4b092ee7e5ad4def2cd295b14492db12720b/packages/ui/build/css/source/semantic.css
    note: every semantic colour derived in OKLCH from a few theme inputs (hue, surface, chroma, contrast)
  - type: source_code
    path: github.com/supabase/supabase@4ead4b092ee7e5ad4def2cd295b14492db12720b/packages/ui/build/css/themes/light.css
    note: light theme inputs; primary overridden to oklch(0.525 0.12 157.5) for AA text
  - type: source_code
    path: github.com/supabase/supabase@4ead4b092ee7e5ad4def2cd295b14492db12720b/packages/ui/build/css/themes/dark.css
    note: dark theme inputs; root defaults mirror dark
  - type: source_code
    path: github.com/supabase/supabase@4ead4b092ee7e5ad4def2cd295b14492db12720b/packages/config/css/theme.css
    note: Tailwind v4 @theme inline mapping of semantic tokens to bg-/text-/border- utilities
  - type: documentation
    path: github.com/supabase/supabase/LICENSE
    note: Apache License 2.0; redistribution allowed with licence and change notices
reuse_permission: pending
version: 0.1.0
last_reviewed: null
tags: [color, tokens, theming, dark-mode, oklch, shadcn]
related: []
token_group: color
---

# Supabase Colour System (shadcn semantic tokens, OKLCH)

> **Candidate, not a standard.** It fills the empty colour slot in `shared/foundations/`. The 11 approved components and patterns already use shadcn semantic names (`--primary`, `--background`, `--border`, `--ring`…), so they work with these tokens without changes.

## What it is
Supabase's open-source UI theme, cut down to its **semantic layer**:
- A small set of inputs per theme (`--hue`, `--surface`, `--chroma`, `--contrast`, `--elevation-step`…).
- shadcn-compatible tokens derived from those inputs in OKLCH.
- Light and dark themes. Root defaults match dark. Switch with `.light` / `.dark` or `[data-theme]` on `<html>`.
- Changing `--hue` re-tints the whole system. Status colours (warning, destructive, info) stay clamped to their colour families.

## What was removed from upstream, and why
| Removed | Reason |
|---|---|
| `--brand-*` stepped scales, `--border-brand-default` | Supabase's fixed brand palette. Upstream itself says functional UI uses `--primary`, not brand. |
| `--secondary-*`, `--warning-*`, `--destructive-*` stepped HSL scales | Legacy marketing scales, not needed by the semantic layer. |
| `--code-block-*`, `--code-token-*` | Supabase docs syntax highlighting. |
| Radix colour scales (`packages/config/css/colors.css`) | 400+ variables, not used by the semantic tokens. |
| Font `Circular` | Proprietary, licensed typeface. Not covered by Apache-2.0. Typography is out of scope here. |
| Logo, wordmark, the name "Supabase" in UI | Trademarks. Not covered by the code licence. |

## Resolved values (measured)
Computed from the formulas, with alpha tokens composited on `--background`.

| Token | Light | Dark |
|---|---|---|
| `--background` | `#fdfdfd` | `#131413` |
| `--foreground` | `#030303` | `#edefee` |
| `--card` | `#ffffff` | `#181a19` |
| `--muted-foreground` | `#464646` | `#bcbdbc` |
| `--tertiary-foreground` | `#696969` | `#989a99` |
| `--primary` (text and indicators) | `#0e7e4e` | `#4acd8b` |
| `--primary-solid` (button fill) | `#0e7e4e` | `#006338` |
| `--warning` | `#ac5800` | `#f2af48` |
| `--destructive` | `#ab413e` | `#b54a46` |
| `--info` | `#6c5eba` | `#9b8ff0` |
| `--border` (on bg) | `#e9e9e9` | `#232524` |
| `--input` (on bg) | `#d9d9d9` | `#303231` |

## Accessibility check (WCAG 2.1 AA)
These pass in both themes:
- Text pairs, at 4.5:1 or better: foreground, muted, tertiary and primary text on background, plus every `*-foreground` on its fill.
- Dark-mode focus ring: 3.55:1.

**Upstream failures, fixed in the `a11y-overrides.css` layer below:**

| Pair | Upstream | Override | Result |
|---|---|---|---|
| `--input` border / background (non-text, needs 3:1) | 1.40 light, 1.42 dark | alpha 45% light, 40% dark | 3.28, 3.48 |
| `--ring` / background, light | 1.64 | `var(--primary)` | 5.01 |
| Destructive used as **text** on background, dark | 3.55 | new `--destructive-text`, L 0.65 | 5.35 (5.08 on card) |

The overrides sit in their own file, so upstream values stay untouched and easy to diff.

## Constraints
- **Browser support:** relative colour syntax (`oklch(from …)`) needs Chrome/Edge 119+, Safari 18+, Firefox 128+. Older browsers get no colour for derived tokens. Check the product's browser matrix.
- **Licence:** Apache-2.0. Keep the attribution header in every copied file. The header also states that the files were modified.
- **Tailwind:** the mapping file is for Tailwind v4 (`@theme inline`). Without Tailwind, use the CSS variables directly.

## Review notes
- **Permission is `pending`, not `cleared`.** The code licence is permissive, but a human must confirm the organisation is comfortable shipping another company's recognisable green as a product colour. If not, change `--hue` (one line) and keep the rest of the system.
- **`source_projects`:** `supabase-ui-oss` is an external open-source source, not an archived client project, so there is no `projects/` module for it.
- **Contrast** values were computed from the formulas, not measured in a browser. Spot-check them in the first product that uses this.

---

## Kit files
`scripts/export_kit.py` copies each block below into `design-kit/tokens/<file>`. Edit the CSS here, never in a project's copy.

<!-- kit-file: supabase-theme.css -->
```css
/*
 * Supabase colour system: semantic layer.
 * CANDIDATE (status: proposed), from fa-design-system proposal `supabase-color-system`.
 *
 * Source: https://github.com/supabase/supabase @ 4ead4b092ee7e5ad4def2cd295b14492db12720b
 *   packages/ui/build/css/source/semantic.css
 *   packages/ui/build/css/themes/light.css
 *   packages/ui/build/css/themes/dark.css
 * Copyright Supabase, Inc. Licensed under the Apache License, Version 2.0:
 *   http://www.apache.org/licenses/LICENSE-2.0
 * MODIFIED: brand/secondary/status stepped scales, code-block tokens and the
 * brand border were removed; comments shortened. Formulas and values unchanged.
 */

:root {
  /* Hue inputs: --primary-hue is the spot colour; --surface-hue tints neutrals. */
  --hue: 157.5;
  --primary-hue: var(--hue);
  --surface-hue-offset: 0;
  --surface-hue: calc(var(--primary-hue) + var(--surface-hue-offset));
  /* Root defaults mirror the dark theme. */
  --chroma: 0.016;
  --surface: 0.17;

  --foreground-lightness: 0.95;
  --muted-foreground-level: 0.8;
  --tertiary-foreground-level: 0.65;

  /* Global contrast knob, 0 to 1 (0.5 = baseline). */
  --contrast: 0.5;
  --contrast-delta: calc((var(--contrast) - 0.5) / 0.5);
  --contrast-up: max(0, var(--contrast-delta));
  --contrast-down: max(0, calc(var(--contrast-delta) * -1));
  --contrast-text-floor: 0.9;
  --contrast-border-floor: 0.05;
  --contrast-text: calc(1 - (1 - var(--contrast-text-floor)) * var(--contrast-down));
  --contrast-border-linear: calc(
    var(--contrast-border-floor) + (1 - var(--contrast-border-floor)) * var(--contrast)
  );
  --contrast-border: calc(var(--contrast-border-linear) * var(--contrast-border-linear));

  /* Surface elevation: higher surfaces step lightness by --elevation-step * ratio. */
  --elevation-1: 1;
  --elevation-2: 1.5;
  --elevation-3: 2;
  --elevation-4: 3;
  --tone-span: calc(var(--foreground-lightness) - var(--surface));
  --elevation-step: calc(var(--tone-span) * 0.04);
  --surface-overlay-unit: calc(
    var(--elevation-step) / max(var(--tone-span), calc(var(--tone-span) * -1))
  );
  --muted-alpha: calc(var(--surface-overlay-unit) * var(--elevation-1));
  --accent-alpha: calc(var(--surface-overlay-unit) * var(--elevation-2));
  --tertiary-alpha: calc(var(--surface-overlay-unit) * var(--elevation-3));

  /* Status hues: anchored to amber / red / violet, pulled slightly toward --primary-hue. */
  --brand-hue-reference: 157.5;
  --status-hue-pull: 0.15;
  --warning-hue: clamp(
    65,
    calc(75 + (var(--primary-hue) - var(--brand-hue-reference)) * var(--status-hue-pull)),
    95
  );
  --destructive-hue: clamp(
    12,
    calc(25 + (var(--primary-hue) - var(--brand-hue-reference)) * var(--status-hue-pull)),
    42
  );
  --info-hue: clamp(
    272,
    calc(288 + (var(--primary-hue) - var(--brand-hue-reference)) * var(--status-hue-pull)),
    302
  );
  --expressive-chroma: 0.14;
  --warning-lightness: 0.8;
  --destructive-lightness: 0.55;
  --info-lightness: 0.7;

  /* shadcn semantic pairs */
  --background: oklch(var(--surface) calc(var(--chroma) * 0.5) var(--surface-hue));
  --foreground-chroma: calc(var(--chroma) * 0.55);
  --foreground: oklch(
    calc(var(--surface) + var(--tone-span) * var(--contrast-text)) var(--foreground-chroma)
      var(--surface-hue)
  );
  --foreground-contrast: oklch(var(--surface) calc(var(--chroma) * 0.55) var(--surface-hue));

  --card: oklch(from var(--background) calc(l + var(--elevation-step) * var(--elevation-1)) c h);
  --card-foreground: var(--foreground);
  --popover: oklch(from var(--background) calc(l + var(--elevation-step) * var(--elevation-2)) c h);
  --popover-foreground: var(--foreground);

  /* --primary = readable ink; --primary-solid = button plate; --primary-bright = rings/selected chrome. */
  --primary: oklch(0.76 0.15 var(--primary-hue));
  --primary-bright: oklch(from var(--primary) max(l, 0.7) max(c, 0.15) h);
  --button-fill-hover-delta: 0.04;
  --primary-hover: oklch(
    from var(--primary)
      calc(
        l + var(--button-fill-hover-delta) * var(--tone-span) /
          max(var(--tone-span), calc(var(--tone-span) * -1))
      )
      c h
  );
  --primary-bright-hover: oklch(
    from var(--primary-bright)
      calc(
        l + var(--button-fill-hover-delta) * var(--tone-span) /
          max(var(--tone-span), calc(var(--tone-span) * -1))
      )
      c h
  );
  --primary-foreground: oklch(
    min(var(--surface), var(--foreground-lightness)) calc(var(--chroma) * 0.45) var(--primary-hue)
  );

  --primary-solid: oklch(0.43627 0.11 var(--primary-hue));
  --primary-solid-hover: oklch(
    from var(--primary-solid)
      calc(
        l + var(--button-fill-hover-delta) * var(--tone-span) /
          max(var(--tone-span), calc(var(--tone-span) * -1))
      )
      c h
  );
  --primary-solid-foreground: oklch(0.95 0.00275 var(--primary-hue));

  --secondary: oklch(
    from var(--background) calc(l + var(--elevation-step) * var(--elevation-3)) c h
  );
  --secondary-foreground: var(--foreground);
  --tertiary: oklch(from var(--foreground) l c h / var(--tertiary-alpha));
  --tertiary-foreground-mix: calc(
    var(--tertiary-foreground-level) + (1 - var(--tertiary-foreground-level)) * var(--contrast-up) -
      var(--tertiary-foreground-level) * 0.5 * var(--contrast-down)
  );
  --tertiary-foreground: oklch(
    calc(var(--surface) + var(--tone-span) * var(--tertiary-foreground-mix))
      var(--foreground-chroma) var(--surface-hue)
  );
  --muted: oklch(from var(--foreground) l c h / var(--muted-alpha));
  --muted-foreground-mix: calc(
    var(--muted-foreground-level) + (1 - var(--muted-foreground-level)) * var(--contrast-up) -
      var(--muted-foreground-level) * 0.5 * var(--contrast-down)
  );
  --muted-foreground: oklch(
    calc(var(--surface) + var(--tone-span) * var(--muted-foreground-mix)) var(--foreground-chroma)
      var(--surface-hue)
  );
  --accent: oklch(from var(--foreground) l c h / var(--accent-alpha));
  --accent-foreground: var(--foreground);

  /* Controls: --field = sunk text entry; --control-raised = raised chooser (select). */
  --field-alpha: 0.015;
  --field: oklch(0 0 0 / var(--field-alpha));
  --control-raised: oklch(1 0 0 / calc(var(--muted-alpha) * 0.65));
  --control: var(--control-raised);

  --warning: oklch(var(--warning-lightness) var(--expressive-chroma) var(--warning-hue));
  --warning-hover: oklch(
    from var(--warning)
      calc(
        l + var(--button-fill-hover-delta) * var(--tone-span) /
          max(var(--tone-span), calc(var(--tone-span) * -1))
      )
      c h
  );
  --destructive: oklch(
    var(--destructive-lightness) var(--expressive-chroma) var(--destructive-hue)
  );
  --destructive-hover: oklch(
    from var(--destructive)
      calc(
        l + var(--button-fill-hover-delta) * var(--tone-span) /
          max(var(--tone-span), calc(var(--tone-span) * -1))
      )
      c h
  );
  /* On-fill text flips dark/light around L 0.62. */
  --warning-foreground: oklch(
    from var(--warning) clamp(0.12, calc((0.62 - l) * 100), 0.99) calc(c * 0.08) h
  );
  --destructive-foreground: oklch(
    from var(--destructive) clamp(0.12, calc((0.62 - l) * 100), 0.99) calc(c * 0.08) h
  );
  --info: oklch(var(--info-lightness) var(--expressive-chroma) var(--info-hue));
  --info-foreground: oklch(
    from var(--info) clamp(0.12, calc((0.62 - l) * 100), 0.99) calc(c * 0.08) h
  );

  --border-destructive: oklch(from var(--destructive) l c h / 30%);
  --border-warning: oklch(from var(--warning) l c h / 30%);
  --border-info: oklch(from var(--info) l c h / 30%);
  --border-primary-bright: oklch(from var(--primary-bright) l c h / 30%);

  --border: oklch(
    from var(--foreground) l calc(c * 0.54) h / calc(2% + 20% * var(--contrast-border))
  );
  --input: oklch(
    from var(--foreground) l calc(c * 0.5) h / calc(3% + 38% * var(--contrast-border))
  );
  --border-control-hover: oklch(
    from var(--foreground) l calc(c * 0.5) h / calc(12% + 58% * var(--contrast-border))
  );
  --ring: oklch(from var(--primary-bright) l c h / 55%);
}

[data-theme='light'],
.light {
  --hue: 157.5;
  --surface-hue-offset: 180;
  --chroma: 0;
  --surface: 0.995;
  --elevation-step: 0.024;
  --contrast: 0.53;
  --foreground-lightness: 0.1;
  --muted-foreground-level: 0.65;
  --tertiary-foreground-level: 0.5;
  --primary: oklch(0.525 0.12 var(--primary-hue));
  --primary-foreground: oklch(0.99 0.00275 var(--primary-hue));
  --primary-solid: var(--primary);
  --primary-solid-foreground: var(--primary-foreground);
  --primary-solid-hover: var(--primary-hover);
  --warning-hue: 58;
  --warning-lightness: 0.55;
  --destructive-lightness: 0.52;
  --info-lightness: 0.54;
}

[data-theme='dark'],
.dark {
  --hue: 157.5;
  --chroma: 0.005;
  --surface: 0.19;
  --elevation-step: 0.025;
  --contrast: 0.5;
  --foreground-lightness: 0.95;
  --muted-foreground-level: 0.8;
  --tertiary-foreground-level: 0.65;
  --field-alpha: 0.12;
}
```

<!-- kit-file: a11y-overrides.css -->
```css
/*
 * WCAG 2.1 AA fixes on top of supabase-theme.css. NOT from Supabase.
 * CANDIDATE (status: proposed), from fa-design-system proposal `supabase-color-system`.
 * Load AFTER supabase-theme.css. Values verified by formula; see the proposal.
 */

:root,
[data-theme='dark'],
.dark {
  /* Input borders: 1.42:1 upstream -> 3.48:1 (non-text contrast, SC 1.4.11). */
  --input: oklch(from var(--foreground) l calc(c * 0.5) h / 40%);
  /* Destructive as TEXT on background/card: 3.55:1 upstream -> 5.35:1. */
  --destructive-text: oklch(0.65 var(--expressive-chroma) var(--destructive-hue));
}

[data-theme='light'],
.light {
  /* Input borders: 1.40:1 upstream -> 3.28:1. */
  --input: oklch(from var(--foreground) l calc(c * 0.5) h / 45%);
  /* Focus ring: 1.64:1 upstream -> 5.01:1. */
  --ring: var(--primary);
  /* Destructive fill already reads at 5.83:1 as text in light mode. */
  --destructive-text: var(--destructive);
}

@media (prefers-contrast: more) {
  :root {
    --contrast: 0.8;
  }
}
```

<!-- kit-file: tailwind-theme.css -->
```css
/*
 * Tailwind v4 mapping for supabase-theme.css (semantic subset of
 * supabase/supabase packages/config/css/theme.css, Apache-2.0, modified:
 * Radix scales, brand scales and legacy aliases removed).
 * CANDIDATE (status: proposed). Only needed if the project uses Tailwind v4.
 * Usage: @import "tailwindcss"; @import "./supabase-theme.css";
 *        @import "./a11y-overrides.css"; @import "./tailwind-theme.css";
 */

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-hover: var(--primary-hover);
  --color-primary-bright: var(--primary-bright);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary-solid: var(--primary-solid);
  --color-primary-solid-hover: var(--primary-solid-hover);
  --color-primary-solid-foreground: var(--primary-solid-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-tertiary: var(--tertiary);
  --color-tertiary-foreground: var(--tertiary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-field: var(--field);
  --color-control-raised: var(--control-raised);
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-destructive-text: var(--destructive-text);
  --color-info: var(--info);
  --color-info-foreground: var(--info-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-border-control-hover: var(--border-control-hover);
  --color-border-destructive: var(--border-destructive);
  --color-border-warning: var(--border-warning);
  --color-border-info: var(--border-info);
}
```
