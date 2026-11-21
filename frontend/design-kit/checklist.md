# UI Done Checklist

Go through this before calling any UI work finished.

## Accessibility (WCAG 2.1 AA)
- [ ] Every control has a visible label bound with `htmlFor` (see `form-field`).
- [ ] Errors use `role="alert"` and are linked with `aria-describedby`.
- [ ] Everything is keyboard reachable; focus order matches visual order; focus ring is visible.
- [ ] Dialogs trap focus, close on Escape, and return focus to the trigger.
- [ ] Text contrast is at least 4.5:1; borders and icons that carry meaning at least 3:1.
- [ ] Colour is never the only signal (pair status colours with text or an icon).
- [ ] Motion respects `prefers-reduced-motion`.
- [ ] Tables have header cells and an accessible name; sortable headers say their sort state.

## States
- [ ] Loading: skeleton or spinner with an accessible label. No layout jump when data arrives.
- [ ] Empty: explains why it is empty and what to do next.
- [ ] Error: plain-language message, a retry where useful, no raw technical text.
- [ ] Partial results or limits reached are stated, not hidden.
- [ ] Disabled and busy states on buttons that start async work (no double submit).

## Consistency
- [ ] Only semantic colour tokens. No hard-coded hex or Tailwind palette colours.
- [ ] Both `.light` and `.dark` checked.
- [ ] Reused kit components instead of near-duplicates.
- [ ] Any new reusable component or pattern is listed in the summary as a proposal.

## Known gaps in approved records
Plan around these. Do not assume they are solved.
- `data-table`: Search, sort and paginate table. Known gap: client-side only, no server paging
- `dialog-shell`: Base modal: centre, side sheet, top-right. Known gap: no reduced-motion variant
- `stepper`: Consolidated horizontal and vertical stepper (target design; source has 3 implementations)
- `global-toasts`: Automatic API feedback toasts. Known gaps: no field-error mapping, no technical-message guard
