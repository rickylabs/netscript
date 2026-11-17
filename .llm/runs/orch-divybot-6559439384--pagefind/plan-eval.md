# PLAN-EVAL cycle 2: #2453 Pagefind reproducibility (feature tier)

**Verdict: PASS.** All five corrections from cycle 1 are now in the plan, and none of the checklist boxes is still open. Implementation may begin.

**Evaluator:** the same independent, separate-family, read-only session (Anthropic Opus 5.5, high effort). I edited no files and touched nothing on GitHub.
**Head evaluated:** source `1e4e58f`, plus the run-only commit `c027397` and the uncommitted run-directory updates. No implementation code exists yet.

## The five corrections

| # | Gap from cycle 1 | Where it is fixed | Status |
|---|---|---|---|
| 1 | How the sort works | `plan.md` "Locked decisions": a new composed `docs/site/_plugins/pagefind.ts` sorts the full page list (`allPages`) in place by URL, comparing code points, then registers the existing Pagefind plugin. It explains that sorting the per-processor filtered copy would do nothing, and that the base-path step downstream inherits the new order. `research.md` agrees, and it matches Lume's `core/processors.ts` (lines 29–34). | Fixed |
| 2 | Proof that results don't depend on page order | Slice 2 adds `_plugins/pagefind-fixture.ts` and `_plugins/pagefind_test.ts`, plus a `test:pagefind` task in `docs/site/deno.json` (already in slice 2's file list). The test runs the real Lume processors and native 1.6.0 on ordered and shuffled input and compares every output byte. The fixture-plus-test layout copies an existing pattern: `markdown-render_test.ts` spawns `markdown-render-fixture.ts`. | Fixed |
| 3 | Frozen command and removal of the old pin | Slice 2 gate: `deno run --frozen --unstable-temporal -A https://deno.land/x/lume@v2.5.4/cli.ts`, run from `docs/site` (the URL returns 200), plus a check that `docs/site/deno.lock` no longer contains `pagefind@1.3.0`. | Fixed |
| 4 | The undecided "if appropriate / only for" choices | Slice 3 and "Open decisions": the bounded mode is deleted from `tools/docs-site/check-reproducible.ts`, `tools/docs-site/README.md` is updated, and no artificial comparator tests are added. | Fixed |
| 5 | The classifier test that pins the bounded flag | Slice 3 now names `.github/scripts/ci-classify-changes.test.ts`, which will require the strict invocation. It is added to the write surface in `supervisor.md`, and `drift.md` records the expansion. | Fixed |

The risk of downstream byte changes from the in-place sort is now in the risk register. The mitigation is to compare every non-Pagefind output (HTML, Markdown twins, `llms` indexes) against a captured baseline from main. The plan also states this as a locked decision.

## Non-blocking notes for the supervisor

These are clarifications, not plan failures; the plan doesn't need to come back to me for them.

1. **Contradiction about `quality:gate`.** The "Gates" section still says the root quality/architecture scan "applies only if packages/plugins touched (not planned)". "Open decisions" and `drift.md` say the root `quality:gate` is required. The later, explicit decision governs, so the scan is required. Fix the stale line in "Gates" so the IMPL evaluator doesn't read a conflict.
2. **Timing of the baseline hashes.** Capture the non-Pagefind hash manifest from `1e4e58f` before any slice-2 source edit, and record its SHA-256 the same way as `baseline-strict.md`. Otherwise the downstream-bytes comparison has nothing to compare against.
3. **Negative control for the shuffle test.** If the fixture can also run the shuffled case with sorting turned off, have it show that the outputs differ. That proves the test can detect the problem it targets, matching the 1.6.0 reverse-order probe in `research.md`. Without that, a fixture that ends up passing input in the same order both times would pass without testing anything.
4. **Which build is frozen.** The frozen Lume command proves the lock is complete. The `lume` task itself (used by `build` and by the strict checker) still runs without `--frozen`. The IMPL evaluator should confirm that strict-check builds resolve only 1.6.0 from the reviewed lock, with no bypass of the 24-hour dependency-age limit.

## Checklist

- [x] Research is present and re-baselined on main: `research.md` (verified in cycle 1, with the processor-semantics finding added).
- [x] Decisions are locked: `plan.md` "Locked decisions".
- [x] Open-decision sweep: none left open. Mode deletion, test policy and the scan requirement are decided.
- [x] Commit slices: three, ordered, each under 30 files, each naming its files and the gate that proves it.
- [x] Risk register, including the in-place ordering risk.
- [x] Gate set selected: docs overlay, full Utility browser suite, strict two-build check, frozen build, shuffle test, classifier and workflow tests, `quality:gate` (see note 1), and the CLI end-to-end run at readiness.
- [x] Deferred scope is explicit.
- [x] jsr-audit: not applicable (docs build, tooling and workflow only; no `packages/` or `plugins/`).

**PASS**
