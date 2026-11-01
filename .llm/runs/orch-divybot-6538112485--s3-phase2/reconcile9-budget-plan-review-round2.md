# Independent budget PLAN-EVAL — FAIL_RESCOPE

**FAIL_RESCOPE**: the inventory-aware CSS budget plan, round 2. Your measured follow-up meets the condition I set in round 1: both proposed ceiling pairs, and even the floor derived from main's actual baseline, exceed #2503's payload. The full approved scope is incompatible with main's guard as main wrote it, and no constant change I could approve fixes that.

This is the second consecutive terminal failure on this leaf (`FAIL_PLAN`, then `FAIL_RESCOPE`). Under the leaf contract the loop ends here: no third attempt, and no new evaluator.

**Why** (`reconcile9-budget-plan.md`, "Measured follow-up")

The guard (`packages/fresh-ui/tests/publish-size.test.ts:9-10`) exists to keep the combined component CSS below #2503's payload. Measured with the guard's own algorithm:

| Tree | Raw | Gzip |
| --- | ---: | ---: |
| #2503 final (`028cfa15`, 52 files) | 270,183 | 27,152 |
| Main `0af8fd9e` (52 files) | 215,981 | 26,527 |
| Rebased parent (74 files), actual | 281,179 | 36,011 |
| Full child (90 files), estimate | 344,825 | 44,998 |

- The derived rates (3,272 raw / 401 gzip per component) give ceilings of 288,712 / 35,421 for the parent and 344,336 / 42,238 for the full scope. Both are above #2503.
- **The parent already fails on its own.** Its measured gzip of 36,011 exceeds even the derived parent ceiling of 35,421, and #2503's gzip of 27,152 by about a third.
- Nesting alone can't close that gap.
- Fitting under the guard would therefore mean changing what the guard protects. That's an owner or maintainer policy decision, not a reviewed gate extension.

**The owner needs to choose one of these** (the run must not pick)
1. **Ratify a higher budget for the approved S3 inventory.**
   - Give explicit raw and gzip constants, or per-identity rates, that knowingly exceed #2503's payload for the frozen 21 + 17 list.
   - The measured numbers above are the reference.
   - Keep the frozen-list credit, the intersection rule, the negative controls and the PR disclosure from the updated plan.
2. **Change what the guard measures.** Apps copy only the components they install. The owner could, for example, keep the absolute cap on main's baseline set and give the S3 additions their own bounded aggregate, or move to a per-install or per-collection budget. This would be a new guard design that the owner approves, then implemented and reviewed.
3. **Reduce the S3 scope that ships CSS** below #2503. This conflicts with the assignment to complete all 38 components, so it needs an explicit owner rescope of #2416's phase 2 goal.
4. **Keep main's guard as an absolute limit** and require the S3 CSS to be reduced losslessly below it. The measurements suggest this isn't achievable without dropping scope, but it's the owner's call.

**Safe stopping state** (do this, and nothing beyond it)
- **Change no budget code.** No threshold, no constant, no new credit logic, no skip or exclusion, and no flag or allowance in any form.
- **Don't push** the rebased parent `0d8cb882`. Remote parent `c5877ff8` and remote child `a9078d68` stay exactly as they are, with no force-push.
- **Preserve every backup.**
  - Keep the local old-parent branch at `c5877ff8` and the reviewed child source at `c3dba2ce`.
  - Keep the rebased parent `0d8cb882`.
  - Don't discard the canonically regenerated, uncommitted `registry.generated.ts`. Record its hash in the run's evidence and leave it in place, or commit it to a local-only backup branch.
  - Don't run the child rebase.
- **Don't start the next group.** No 11b3b, 12 or 13 work, no new component, no READY and no final report.
- **Write the decision record.**
  1. A rescope note in the parent run: `reconcile9-rescope.md`, with the table above, the derived ceilings, both verdicts and the four options.
  2. An update to the phase registry and to the `context-pack.md`, `worklog.md` and `drift.md` of both runs, marking the leaf stopped pending an owner decision.
  3. A dated lesson note.
  4. Release the evaluator lease.
- **Disclose it honestly on the draft PRs.**
  - Post a comment on #2488 and #2538 using `Refs #2416` only.
  - It should state that main's #2558 guard conflicts with the approved inventory, give the measured numbers and the owner options, and say that no budget change was made and the branches weren't advanced.
  - Don't claim the gates pass or that the owner has approved anything, and don't add labels or closing keywords.
  - Run the public audit (0 absolute paths, session identifiers or thumbprints) before posting.

**Unaffected by this verdict**
- The reviewed Desktop 11b3a source (round-1 PASS, preserved at `c3dba2ce`).
- The non-CSS preservation results, CSSOM equivalence (74 files, 1,589 rules, 0 differences) and unchanged locks.

All of it remains valid for when the owner's decision lets integration continue.

Once the owner decides, integration resumes from this state with fresh integrated gates and review. That review is a new leaf or loop the owner authorizes, not a third attempt at this one.

Still required:
- **11b3b:** the other four Desktop components.
- **12a/12b:** the declared x-extensions and the all-style harness.
- **13:** the whole-phase runtime run, the final IMPL-EVAL and green CI at the exact head.

None of these can start until the owner's decision is made.
