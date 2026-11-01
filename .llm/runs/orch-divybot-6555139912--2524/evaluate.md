# IMPL-EVAL: Issue #2524 / draft PR #2558

**Verdict: PASS.** Push the sign-off commit, then confirm the required remote checks at that exact head before READY. The full runtime and container cleanup remain **UNPROVEN** (not PASS); the owner accepted that for this non-release run.

- **Evaluator:** Anthropic family, separate from the OpenAI implementation. Requested model claude-opus-5-5 at effort high. The model reports itself as Opus 5.5; effort can't be observed.
- **Mode:** read-only. No repository writes, commits, pushes or comments.
- **Scope reviewed:** baseline `6a1d84a6e04c0d39df3926528e0380e267316aee` against the working tree, including the staged carrier change.

## What I checked myself

| Item | Result | Evidence |
| --- | --- | --- |
| Change surface | PASS | Every non-run change is under `packages/`: 46 CSS sheets, 2 CLI test files, `publish-size.test.ts` and the staged `registry.generated.ts`. No lock or dependency diff. |
| Source manifest | PASS, checked independently | `sha256sum` on all 50 entries in `source-hashes.json` matches the working tree. The 6 CSS files missing from the manifest (`alert`, `detail-layout`, `filter-form`, `inline-notice`, `pagination`, `textarea`) are the unchanged single-root sheets. |
| Root count | PASS | The Utility root appears 54 times across 52 component/island/layout files (badge and avatar have 2 each), plus 2 in the excluded theme preset. Matches the claimed 528 → 54. |
| Specificity | PASS | The root is one compound selector, `:root:is(A, B, C)`. `&` resolves to `:is(:root:is(A, B, C))`, which has the same specificity: (0,1,0) plus the highest of A, B, C. No alias-list widening is possible. |
| Rule order and cascade | PASS | In badge, the unscoped `.ns-badge__dot` stays between two Utility blocks, so only contiguous runs were grouped. Legacy `:root[data-theme]:not(...)` roots are untouched. |
| Media nesting | PASS | Nested `@media` sits at the original position inside the root. Checked in card (reduced motion) and toast (`max-width: 640px` with `:has()`). |
| Rule-contract tool design | PASS | The browser parses each stylesheet and the tool expands nesting before comparing. Substituting `&` as text is exact here because the parent is a single compound selector. Any bare declarations left after nested rules would show up as a difference, so "0 differences over 1161 records" also rules out declaration hoisting on Chrome versions before 130. |
| Budget test design | PASS | It walks every registry CSS file except the theme folder, requires a non-empty inventory, requires the shipped key set to equal the authored set, and requires each shipped file to be byte-identical before the raw and gzip steps. CompressionStream uses the platform gzip. |
| Budget runs in CI | PASS | `fresh-ui-quality.yml`'s "Fresh UI tests" step runs the package `test` task (`tests/**/*.ts`, private lock, `--frozen`, Deno 2.9.7). `jsr:@std/fs@1` follows the convention of 3 existing tests and is already in the lockfile. |
| QueryResult regression | PASS | Page, standalone-island and five resource variant combinations must contain the full shared `QUERY_RESULT_TEMPLATE` and the success return, with exactly one `function QueryResult(`. The resource test also rejects leftover `{{queryResult` placeholders. The checks compare against the shared constant, so they catch drift even when golden hashes are updated alongside it. |

## Recorded evidence I reviewed but couldn't rerun

Test execution was denied in this session, so I could not rerun any test.

- **Package tests:** `fresh-ui-tests.json` shows 338 passed, 0 failed, 0 ignored, exit 0. `size-tests.json` shows 4/4 passed. `query-tests.json` shows 25/25 passed.
- **Negative controls:**
  - `size-negative.json`: the baseline CSS fails both steps (raw 270183 > 220000, gzip 27152 > 27000).
  - `query-negative.json`: changing "No value" to "Missing value" in the resource output fails the new assertion.
- **Browser evidence:**
  - `rule-contract.json`: 52 files, 1161 records, 0 differences on Chromium 153.
  - `utility-parity.json`: identical HTML input hashes, 4 scenes × 597000 comparisons with no differences, and identical screenshot hashes.
  - `legacy-parity.json`: no errors.
  - `browser-tests.json`: 60 expected, 0 skipped, 0 unexpected.
- **Carrier and root checks:** `carrier-equivalence.json` shows 199 assets (46 CSS changed, 153 identical) with matching inventory. `check-tasks.json` shows all 14 root `check:*` tasks exiting 0.
- **Not reviewed in detail:** quality/architecture, release preflight and JSR audit receipts are private.

## Process

- **Plan:** PLAN-EVAL N/A is justified in `plan.md` and was committed in the plan commit before implementation.
- **Design checkpoint:** present in `worklog.md`, and slice 2 follows it.
- **Debt and doctrine:** no doctrine violation is introduced (CSS selector restructuring plus test-only TypeScript), and no new debt is required.
- **Owner overrides honored:** `Refs #2524` with no closing keyword, no labels, draft PR. Protocol rule 14 is n/a because this is not a release cut.
- **Runtime:** the requested command ran and exited 1 at Aspire preflight because the Docker daemon is unavailable. Runtime and container cleanup are correctly recorded as UNPROVEN. The 25 entries of unproven ownership were left untouched.

## Non-blocking findings (optional, none required for PASS)

1. **Alias coverage claim.** The plan says "adding all root aliases", but computed-style parity rendered only `studio` + `flavor=utility`. The `studio-utility` and bare-`studio` aliases are covered only by the byte-identical root selector and the CSSOM contract. That is enough to show the behaviour is the same, but either add a note in `drift.md` or word the final PR body to match.
2. **Browser coverage is Chromium-only, and this is the first `&` nesting in shipped component CSS** (baseline had none).
   - The new floor is Chrome 112, Safari 16.5 and Firefox 117. Baseline already depends on `:has()` (Firefox 121) for some Utility rules, so the practical floor barely moves.
   - The failure mode does change: a browser without nesting now drops a file's whole Utility block instead of individual rules.
   - Consider stating the floor in the PR body. No code change is needed.
3. **Tight gzip headroom.** 26527 against a 27000 limit leaves 473 bytes (1.8%), so the next component's CSS will probably trip it. That is how a budget should work, but a hint in the failure message about where to change the limit would help. The measurement is deterministic only while CI stays on Deno 2.9.7.
4. **Theme-folder filter.** The budget test matches its theme-skip regex against the absolute path. A checkout inside a folder named `theme` would empty the inventory. It would fail loudly (non-empty and equality assertions), not pass by accident. Filtering on the relative path would be more robust.
5. **Stale PR body.** `pr-body.md` and the live PR body still say "Implementation and validation are in progress". Update both at delivery.
6. **Run-artifact hygiene.**
   - `compare-rule-contract.mjs` is a reusable helper sitting in the run directory and imports from `tools/fresh-ui-browser/node_modules`. Fine as an evidence script, but AGENTS puts reusable helpers in `.llm/tools/`.
   - `worklog.md` and `context-pack.md` have many missing spaces ("Allfourcanonical", "areUNPROVEN", "Every14rootcheck:*"), which hurts resumability.
   - `legacy-parity.json` records no comparison count, browser or input hashes.

## Before READY

Make the normal push of the sign-off commit and refresh the PR body. Then confirm the required checks at that exact head are green or skipped by policy. At minimum that includes the Fresh UI Quality "Fresh UI tests" step, which is now the CI home of the CSS budget, and the CLI test workflow. Keep runtime marked as UNPROVEN in the final report. Cockpit owns the merge.

Transport metadata confirms observed model `claude-opus-5-5`; requested effort was high.
Raw transport and session metadata remain private. No effort attestation claimed.
