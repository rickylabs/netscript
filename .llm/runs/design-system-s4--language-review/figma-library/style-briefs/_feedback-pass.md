# Feedback style pass, plus swap-defect fixes (per style)

Builder protocol: `_builder-protocol.md`, plus `_budget-protocol.md` (Correction section): at most 3 builders and about 3 calls per minute. On a refusal, back off and resume.

## Scope per style
1. **Restyle the Feedback base sets for the style.** Clone, then restyle, following the protocol. The ids are in `ledger-feedback.json`:
   - Alert, Inline notice, Toast;
   - Progress (linear), Progress circular, Spinner;
   - Skeleton, Skeleton preset, Empty state.
2. **Source of the style's look,** in this order:
   1. the style's existing sets: its Badge, Card, Dialog and Menu show its language for tone, surface and border;
   2. the style's `style-briefs/<theme>.md`;
   3. the theme's DESIGN.md (`docs/design-system/themes/<theme>/DESIGN.md` on main);
   4. its crafted frames.
3. **Rules:**
   - **Callout and alert header (owner):** one label (icon plus tone label or custom title), with the icon box equal to the label's line height on the first line, and the body on the label's text column.
   - **Tones:** status tones per the theme, with red only for destructive.
   - **Dark** is designed, never inverted.
4. **Swap test, review, strip and PNGs:** to `review/styles/<theme>/feedback*.png`.
5. **Sweep the style's own earlier sets.** Swap the base Empty state and Skeleton inside its Table and Data table, plus any Alert, Spinner or Progress, to the new style sets.
6. **Fix the style's swap-test defects** listed in `state.json` → `ownerNotes` (2026-10-31 entries) for that style, inside its own sets only.
7. **Update the archetype screens.** On page "Screens · Archetypes" (`514:94470`, see `ledger-screens.json`), in that style's group only, swap the remaining base Feedback instances to the style's new sets. Re-shoot only the screens that change, to `review/screens/<theme>/`.
8. **Ledger:** append to `ledger-feedback-<theme>.json`.
