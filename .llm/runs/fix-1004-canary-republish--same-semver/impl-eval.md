# IMPL-EVAL — fix-1004-canary-republish--same-semver

Evaluator: Opus 5 supervisor (owner-waived open-model lane, 2026-08-01)

Commit under review: `6a18245a7` (plan/harness commits `f248e411d`, `a739beb74`).

## What the diff actually does — verified, not taken on report

- `.github/workflows/release-canary.yml`: adds optional `republish-version`; renames the cut step to
  `id: cut` gated on `inputs.republish-version == ''`; adds a `Verify same-semver canary republish`
  step gated on the inverse; adds a `Resolve canary context` step (`id: canary`) that yields
  `version`/`tag` from the input in republish mode and from `steps.cut` otherwise, with `branch`
  empty in republish mode; tightens the branch-delete condition with
  `inputs.republish-version == ''`. The readiness → provision → dry-run → preflight → publish →
  dispatch → await → status chain is untouched.
- `.llm/tools/release/canary.ts`: `--republish-version` flag; `validateRepublishVersion` requires
  canonical `<target>-canary.N` on the same train; `verifyCanaryRepublishTree` runs
  `git status --porcelain` (rejects a dirty tree), then compares `v<V>^{tree}` to `HEAD^{tree}` and
  names both SHAs on mismatch; `main()` returns after the guard in republish mode, so no bump, no
  commit, no tag, no push.
- Tests: 4 new unit tests (canonical/foreign version, clean-match command sequence, dirty rejection,
  tree-mismatch message) and 8 new workflow-shape assertions including a guard-precedes-publish
  ordering assertion. Non-vacuous — the dirty case is driven through the injected runner.

## PLAN-EVAL finding closed

The single FAIL item is fixed: the guard now requires a clean working tree before comparing trees,
which is what makes the byte-identity claim true under `deno publish --allow-dirty`
(`publish-workspace.ts:66`). `drift.md` records the change rather than hiding it.

## Gates re-run by the evaluator, not copied from the slice

| Gate | Command | Result |
| --- | --- | --- |
| Type-check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/release --ext ts` | PASS — 32 files, 0 diagnostics |
| Lint | `run-deno-lint.ts --root .llm/tools/release --ext ts` | PASS — 32 files, 0 occurrences |
| Format | `run-deno-fmt.ts --root .llm/tools/release --ext ts` | PASS — 0 findings |
| Tests | `deno test --allow-read --allow-run --allow-net .llm/tools/release/canary_test.ts .llm/tools/release/release-canary-workflow_test.ts` | PASS — 14/14 |

Scaffold runtime E2E deliberately not run: no scaffold output, plugin scaffolding, DB wiring or
Aspire helper generation is touched.

## Acceptance (issue #1004)

| Gate | Verdict | Evidence |
| --- | --- | --- |
| Complete a partial canary at the **same** `canary.N` | MET, structurally | Republish mode skips the cut, supplies the existing `version`/`tag` to the unchanged chain, creates and deletes no refs. Proven by unit + workflow-shape tests; **not** proven by a live dispatch. |
| Retry publishes only missing members, logs `Skipping, already published` | MET, by unchanged path + precedent | The republish branch reaches the identical `run-publish.ts` → `publishWorkspace` call; the skip behaviour is Deno/JSR's, documented in `netscript-release` with the beta.10 run pair. No live publish is claimed by this PR. |
| Content differing from the tag is refused | MET | `verifyCanaryRepublishTree` rejects both a dirty tree and a tag/HEAD tree mismatch, with unit tests for each and both SHAs in the error. |

## Verdict

PASS — with a human release-owner review required before merge.

The code is correct and the gates are green, but two of the three acceptance gates are evidenced
structurally rather than by a live run, and this changes the production release workflow. A live
proof is not obtainable outside an actual partial canary publish. The PR stays a draft for the
release owner.
