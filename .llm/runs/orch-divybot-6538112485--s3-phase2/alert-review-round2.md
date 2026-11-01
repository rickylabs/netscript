PASS (slice 7c2b Alert corrective round, not the final IMPL-EVAL)

The default tone-label blocker is fixed, and I found no regressions.

- **Default and localized labels:**
  - `alert.tsx:50-57` maps all six tones to the ledger's labels (Note, Info, Success, Warning, Error, Important).
  - When `title` is `undefined`, the `title` part shows `toneLabel?.trim()`, or the default if that's blank (lines 87 and 113). A custom title replaces it.
- **Hidden label (`title={false}`/`null`):** the `title` part still renders, using the class `.ns-alert__sr-label`. That class is a self-contained clip rule inside the relatively positioned root (`alert.css:118-128`), so the localized tone stays available to screen readers. Tone no longer depends on colour and the hidden icon alone.
- **Contract:** B1 documents the `title` default and the hidden fallback, and adds the `toneLabel` text prop with its blank fallback (`src/contracts/catalog/feedback/1.ts:40-44, 74-78`).
- **Glyphs:** `circle-check` (success) and `circle-alert` (destructive) now match the review.
  - They're added to `ICON_PATHS` (`src/presentation/primitives.tsx:65-66`) under the existing Lucide/Feather notice, whose header now names them.
  - They're listed in the Z1 Icon enum (`catalog/foundations/1.ts:25-26`), so the name-set check still holds.
- **Label type:** `.ns-alert__title` now uses body size with `--ns-weight-label`, which exists, as the ledger specifies.
- **Unchanged:** visibility, dismissal, controlled refusal, native attributes and `onClose`, the strong-emphasis rule colours and the registry dependency are as before.

I couldn't see the focused-test, wrapper and quality runs, which you say are still completing. Those, plus the unit tests, fixtures and browser matrix you describe (all 12 tone and emphasis combinations with default labels, the clipped localized label in the accessibility snapshot, and the custom, `false`, `null` and blank cases), need to pass before sign-off.

Non-blocking: `title=''` (an empty string) renders an empty visible title with no tone text. You could treat a blank string title like `undefined`, as `toneLabel` already does.
