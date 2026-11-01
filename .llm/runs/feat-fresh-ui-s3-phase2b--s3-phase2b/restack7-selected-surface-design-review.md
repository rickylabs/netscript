**PASS**: this is the separate Button and DataGrid ownership review my earlier condition required. The boundary you propose is sound. The caller composition is valid with Button's implementation left unchanged, provided the surface limitation is disclosed rather than hidden (condition 3). I found no blockers, and the failure streak stays at 0.

**Why it holds**
- **The failure is a pairing between a surface and a role, and DataGrid owns the surface.**
  - The hovered-selected surface is DataGrid's own `color-mix(fg × hover-opacity, --ns-selected)` (`data-table.css:290-293`). On it, the global `--ns-muted-fg` measures 4.44:1 against 4.5:1.
  - Your explicit row-hover reproduction in all three engines shows it isn't a WebKit or pointer artifact. Moving the pointer away to dodge it would have been wrong, and you didn't.
- **Button is behaving to its contract.** Ghost rest is deliberately muted and its own hover is foreground (`button.css:89-97, 285-296`). Outline uses foreground at rest and on hover (lines 100–112, 265–276).
  - Button can't know the surface it sits on, and certifying muted ghost text over arbitrary tinted host surfaces isn't part of its contract.
  - Changing Button globally, or having DataGrid paint foreign `.ns-btn` selectors, would cross ownership. Rejecting both is correct.
- **The DataGrid change touches only DataGrid's own element.**
  - Composing 80% muted with 20% foreground on `.ns-data-grid__cell-label` uses existing roles, follows the CodeBlock contextual-ink pattern, and writes no tokens.
  - Mixing toward foreground can only raise contrast, so no other surface regresses.
  - The column headers and main's Utility header role are untouched.
- **The caller change follows the documented guidance.**
  - The public guidance for row actions is `ActionMenu` (`packages/fresh-ui/README.md:133-135`). The Orders target uses it and passes in all candidate audits.
  - The three bare fixture actions moving from ghost to the existing outline variant (`gap-data-table-fixture.tsx` Cell action ~45, Row action ~83, SharedTrack ~395) keeps type, size, label, handler, element and position. It's a legitimate caller choice for a selected surface.
  - Sort headers and bulk "Clear selection" stay ghost, on non-hover surfaces that pass.
- **The prototype evidence is terminal and honest** (`restack7-selected-surface-control.json`).
  - 72 actual-renderer audits with raw exit 0: 36 baseline audits, 15 of them with violations, and 36 candidate audits with 0 serious or critical findings.
  - They cover 3 engines × 2 schemes × 2 widths × the three targets (`SO-10482`, `one`, `custom`).
  - The label-only control correctly shows the remaining caller-control failures.
  - The earlier transport error isn't relied on, production bytes were unchanged during the prototype, and nothing in it is claimed as a final gate.

**Conditions you must meet**
1. **Red first, natively.**
   - Add the selected-surface accessibility regression before any CSS or fixture change.
   - Select and reset with native Space on all three targets, both directions, at the project widths.
   - Audit both non-hover and explicit row hover at the unchanged serious/critical threshold, and check row state, checkbox and opened counts.
   - Prove it fails on current source. The count follows from the arithmetic: 667 + 4 = 671 Chromium and 320 + 8 = 328 Firefox/WebKit.
2. **Keep the scope minimal.**
   - Change only the own-label rule in `data-table.css`, regenerated canonically through the carrier, and the three fixture `variant` attributes.
   - No change to `button.css`, tokens, foreign selectors, engine branches or axe filters.
   - Keep the rail tolerance of 1, the opposite-edge and missing-rail negatives, the 0.75px geometry limit and every earlier assertion.
3. **Disclose the surface limitation, as an explicit decision rather than silent acceptance.**
   - Add a short note to the DataGrid README section: on hovered selected rows, content in the global muted role can fall below AA. DataGrid compensates its own labels, and caller controls and text there should use foreground roles such as outline Button or `ActionMenu`.
   - Regenerate the docs and agent carriers that this note touches.
   - Record the role-and-surface pairing in the run's drift/debt record, owned by Fresh UI theming, as a follow-up for main's Utility role design. A tracked issue must exist before the slice 13 IMPL-EVAL. Use `Refs`, never a closing keyword.
   - This isn't an AA waiver. Current-scope axe must reach 0.
4. **Gates in order, on frozen final bytes:**
   1. the focused 60;
   2. all 24 axe-bearing WebKit cases across light/dark × 390/1280;
   3. the fresh 765 package suite;
   4. the 671 Chromium and 328 Firefox/WebKit, with 0 retries, 0 flaky and 0 axe allowances;
   5. wrappers with 0 dropped files and the broad source gates;
   6. the same source review, then the commit;
   7. the carriers, quality and publish at the actual head, and the same evidence review.

   Then the approved latest-base addendum sequence, with the public audit and exact lease before each push. Every earlier inset-source run is historical.

Still required after that:
- **11b:** Toc, AnchorNav, RuledGrid, Hero, the Desktop audit and the original Shell Toc integration.
- **12:** the declared x-extensions and the all-style harness.
- **13:** the final runtime run, the whole-phase IMPL-EVAL and green CI at the exact head.

No READY, labels or early promotions of the 19 future items.
