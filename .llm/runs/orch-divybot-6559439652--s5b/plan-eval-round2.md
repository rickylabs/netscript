**Verdict: FAIL_PLAN.** This is cycle 2 of 2. One narrow correction remains; the other six round-one findings are resolved.

I re-ran the token join under the plan's own locked rules: look up Scheme → Theme set → Density, bind `SF:` roles to Theme set only, expand `|` alternatives and `N..M` ranges per `/` segment, and require every expansion to exist. Across all 87 contracts:
- No role resolves to more than one collection, so the lookup order is unambiguous.
- `chart/1..5` resolves in Scheme. The `SF:` roles resolve in Theme set, except the `prose/h4/tracking` gap the plan already records.
- **Two items fail, not one.** Besides `prose` → `prose/h4/tracking`, `app-shell` also fails. Its role `space/page/padding-x|y` (`layout-blocks/1.ts:126`) expands under the plan's rule to `space/page/padding-x` and `space/page/y`. Density has `space/page/padding-x` and `space/page/padding-y`, but no `space/page/y`.

So the plan's claim that strict full generation fails only on the prose defect is wrong for the current baseline. The grammar would report a false defect on `app-shell`, and `--items` subsets would wrongly exclude it.

**Required correction (Locked decision 1).** Define the alternative grammar exactly. When an alternative inside a segment is shorter than its first sibling and has no `-`, it replaces the final `-`-delimited suffix of that sibling. So `padding-x|y` becomes `padding-x` and `padding-y`, and `h2|h3|h4` and `size|line|tracking` stay whole-segment. Add `app-shell` as a positive control and keep `prose/h4/tracking` as the only expected strict failure on this baseline. Whatever the rule, it must be data-derived and must not fall back to a looser match.

Resolved and confirmed:
- Strict full generation fails before any output on the pre-existing prose gap, and `--items` subsets are labelled partial.
- The seven identity joins are exact and cite their evidence, and the 22 runtime-only contracts stay in coverage.
- Variants use `values` only, part-scoped axes stay set properties, contracts with no attributes become a single component, and the 1,024/8,192 bounds sit above the current 720 maximum and roughly 2.7k total.
- Code Connect uses `.figma.ts` templates with the virtual `figma` module and `figma.code`, no generated files are committed, and publishing stays an owner-run `npx` command with no dependency changes.
- Receipts record their provenance, fixture receipts can't produce publication output, and the plan makes no cryptographic editor claim.
- Slice 2 lists about 21 files, under the 30-file limit.
- The standalone CI workflow is recorded in drift and is an explicit extra condition for READY.
- Scope, deferral (S6 is #2419), the N/A jsr-audit and the owner's Refs-only/no-label rules are all intact.

Optional, not blocking: name the issue that owns the `prose/h4/tracking` defect (#2538 or #2559) under Deferred scope.

**How to close this:** the feature-tier policy says the evaluator edits a fixable plan on cycle two, but the owner requires a read-only evaluator, so I made no edits. The supervisor should add the correction above word for word; it's a one-paragraph change. I can then confirm PASS in this same session without another full cycle. If the owner prefers not to, the plan-gate escalation rule (two FAIL_PLAN cycles) sends this to them.

I edited no files, committed nothing, launched no agents and posted no comments. My checks ran from `$TMPDIR` scratch scripts only.
