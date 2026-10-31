# Independent PLAN-EVAL

PASS (phase 2b detailed plan, round 2)

All four round-1 blockers are now locked in `.llm/runs/feat-fresh-ui-s3-phase2b--s3-phase2b/plan.md`. Each plan-gate check is satisfied, and implementation may begin with slice 9a.

**How each round-1 blocker was resolved:**

1. **Strict checking from the first new component** (decision 10, lines 118-123; slice 9a, line 173):
   - From 9a onward, every new identity must pass the strict base render check before it can be `shipped`: no unclassified data attributes, and no `data-x-*` without a valid declaration.
   - The reusable classification table (component, part, purpose) lands in 9a, with no permissive fallback for new identities.
   - Slice 12b extends the same checker and table to the 27 existing scopes, with no blanket exemption.
2. **Synthetic, unregistered extension fixtures** (decision 12, lines 144-156):
   - Extension fixtures are built from the real Utility provider plus declarations and declared additions. They're passed straight to the registry adapter and checker, and never enter `styles.ts` or the browser projects.
   - The real Utility path, with its explicit `[]`, must work end to end: registry metadata → `getStyleExtensions` → checker.
   - The four mutation tests, undeclared additions (including an unregistered `x` attribute), malformed declarations, a missing style/provider/adapter, a disguised base change and non-empty structural defaults are all required to fail, and the base tests keep running.
3. **Which items may declare extensions** (decision 6, lines 65-77):
   - Only a `registry:style` item that also has `meta.components`. The production adapter rejects the field on CSS support styles, themes and any other item type, with negative tests for the CSS-support and non-style cases.
   - The harness also requires the item to be in the registration table and validates every registered item through `getStyleExtensions`, treating absence as empty.
   - The portable adapter never imports test code.
4. **`name` to `maps-to` rule** (decision 7, lines 78-98):
   - Names are normalized deterministically: a hyphen is inserted at ASCII lower/digit→upper boundaries and at acronym→Capitalized-word boundaries, then everything is lowercased, and the result must be `x-` plus single-hyphenated letters and digits.
   - `maps-to` must exactly equal `data-`, `slot:` or `block:<declaring-style-item>/` + the normalized name.
   - A mismatched mapping, or two names that normalize to the same target, is rejected. Duplicate and promotion checks use the component plus the normalized name.

**Other gate checks:**
- **Research:** re-baselined against `31cc758`, and its `registry-v2` and `meta.components` claims match the tree.
- **Design checkpoint:** all seven items are in the worklog.
- **Decisions:** the 12 locked decisions have rationale.
- **Open-decision sweep:** nothing still open would force rework. Per-unit prop details are deferred safely to the reviewed slice checkpoints, inside the locked boundaries.
- **Slices:**
  - They're ordered as 9a–9c, 10a–10b, 11a–11b, 12a–12b, then 13.
  - Each names its files and the gate that proves it, under a 30-file budget.
  - 9c and 12b already name their split points.
- **Risks:** covered by the strict-checker ordering, the classification table and the adapter requirements.
- **Gate set:** scoped wrappers, quality/architecture, installed-copy, full package and browser tests with strict axe, preflight/docs/export drift, the docs build, JSR and the publish dry-run, full doc-lint attributed to the existing baseline, and all four carriers after each source commit.
- **Runtime:** one canonical `scaffold.runtime` attempt per final unit, with hosted Docker-capable runtime evidence required before READY.
- **Deferrals:** S4–S6, #2450/S6, S8, #2418, #859 and debt #2531 stay explicit.
- **JSR:** the planned public surface (`StyleExtension`/`StyleExtensionType` on `contracts`, `getStyleExtensions` on the existing `registry-v2` export) must have full documentation and add zero new diagnostics.

**For the slice reviews:**
- 9a combines the strict checker with three components, so it's the most likely slice to need a split under the 30-file rule.
- The 12a negative tests should include the specific normalization-collision and mismatched-target cases named in decision 7.
- The hosted runtime counts at `31cc758` are predecessor evidence only. Phase 2b still needs its own final-head runtime and CI proof before READY.
