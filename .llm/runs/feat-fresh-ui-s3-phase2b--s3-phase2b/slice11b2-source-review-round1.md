**PASS**: Docs 11b2 source review, round 1 (RuledGrid X8 and Hero X9). That's the 23 frozen source and carrier paths and the 9 build artifacts on the `f1889578` working tree. I found no blockers, and the failure streak stays at 0.

**Why it holds**
- **RuledGrid** (`packages/fresh-ui/registry/components/ui/ruled-grid.tsx`, `ruled-grid.css`)
  - The root owns `data-columns` and `data-variant` after the spread. `RuledGrid.Cell` strips both (lines 32–39).
  - The frame has no handler, role or tabindex. Slots render only when supplied, and the arrow is `aria-hidden`. There's no Card or L2 import.
  - The complementary container ranges `(width <= 767px)` and `(767px < width <= 1100px)` cover fractional widths, with the declared column count above 1100 (lines 31–39).
  - In the middle band, the `:nth-child(n)` reset matches the specificity of the desktop `Nth` removals and comes later in the source, so it wins. That fixes the missing middle border you reproduced red-first, and stale 3n/4n rules can't survive. The narrow band clears every inline-end rule.
  - Logical properties throughout. `minmax(0, 1fr)`, `min-inline-size: 0` and `overflow-wrap: anywhere` keep long content contained.
  - Feature has a 32px gap and only the card's top hairline.
- **Hero** (`hero.tsx`, `hero.css`)
  - It's one `section` with the necessary `layout` query target. Rank is set by string `headingLevel`, and typography follows presentation only.
  - `aside` renders when `aside` or `paths` is present, with `path-stack` inside it.
  - `data-breakpoint` appears only when forced. Automatic rules are scoped to `:not([data-breakpoint])`, so forced modes bypass them.
  - The bands match the approved table: 17:9 with gap 80 capped at 1120, 1.5:1 with gap 40 in the middle band, and a single column with gap 32, 20px padding and the title role in narrow mode.
  - Selector chains of direct owned parts, with each nested Hero as its own named container, stop an outer Hero from restyling nested content.
  - Equal-specificity overrides resolve by source order as intended: forced mobile and automatic narrow both win over centered alignment.
- **Catalog, registry and installation:** the explicit normalization of unshipped X8/X9 placeholders is closed in the typed catalog and JSON, and the canonical registry, style, collection, native, legacy and CLI projections include both items. A real `ui:add` proves TSX and CSS fidelity, compile, lint and SSR. No token, dependency or lock change.
- **Evidence is current and sufficient:**
  - full package 801/0/0 under the normal environment;
  - full Chromium 767 including touch;
  - affected Firefox/WebKit 256;
  - dedicated docs 140;
  - focused 28 Chromium plus 56 Firefox/WebKit, all with 0 retries, 0 flaky, 0 skipped, 0 new allowances and 0 page or console errors;
  - fractional 767.5 and 1100.5 plus every integer edge, LTR and RTL, against an independent native query probe, and the real Shell `docs` layout with a rail at 1280.
- **Red-first controls and failures are retained honestly.** The border and containment controls exited 1 as intended. The dark WebKit contrast failure (1.81) in the browser fixture is archived as a failed run, and it was fixed only by switching the fixture's caller to the existing `Button`, with no component, token, rule or allowance change. Interrupted runs aren't counted.
- **The other gates:**
  - wrappers: 9 source plus 4+1 browser checks, 0 dropped;
  - working-tree quality, explicitly not post-commit;
  - preflight, docs accuracy and export drift;
  - native publish with 0 slow types;
  - site build with 260 HTML pages and 135 registry files;
  - doc-lint at the exact 123 + 1 with 0 new / 0 removed under #2531;
  - review threads with 0 unanswered.

**Non-blocking**
- **Typography literals.** RuledGrid uses literal font sizes from the ledger (16/24, 14/22, 13/20, 11/16, 18/20). Where an existing text role matches exactly, prefer it, so slice 12's other styles can vary them. Existing components set precedent for literals, so this doesn't block.
- **Arrow direction.** The arrow glyph `↗` doesn't mirror in RTL. Consider a logical or mirrored treatment, or record it as the ledger's LTR intent.
- **Runtime guard on `headingLevel`.** It's type-safe, but an invalid value from untyped JavaScript would produce an invalid `h*` tag. A runtime fallback to `'1'` would be cheap.

**Authorized next steps, in order**
1. The source commit with its run context, and no attribution footer.
2. The four canonical carriers, with the actual delta inspected.
3. Quality and native publish at the actual head.
4. The same evidence review.
5. The public audit.
6. Verify the remotes, the exact-lease push, the #2538 comment referencing #2416 only, and the reconcile note.

Do this before 11b3.

Still required after that:
- **11b3:** the actual six-component Desktop audit.
- **12:** the production declared x-extensions and the all-style harness.
- **13:** the whole-phase runtime run, the same final IMPL-EVAL and green CI at the exact head.

Runtime and required CI are still unproven. No READY, labels, closing keywords, merge or early promotions of the 19 future items.
