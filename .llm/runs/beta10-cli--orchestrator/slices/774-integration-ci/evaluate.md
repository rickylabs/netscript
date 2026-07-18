# IMPL-EVAL (official, opposite-family) — PR #787 / issue #774

- Evaluator: Claude Fable 5 (low), route `review_codex`, session separate from the Codex GPT-5.6-Sol
  generator (`019f6c7a…`), PLAN-EVAL (`aa9cc799…`), slice-review (`c8f83551…`), and the
  generator-arranged eval session (`319e284e…`). Date: 2026-07-16.
- Subject: worktree `/home/codex/repos/b10-774-ci`, branch `ci/774-integration-branch-ci`,
  head `06768adb`, impl commit `e5924b48`, base `feat/beta10-integration` @ `2b7d0f81`.
- Scope evaluated: `git diff 2b7d0f81..e5924b48` (two workflow files + tracked run artifacts only;
  no `deno.lock`, no package/plugin/task churn).

## Verdict

`PASS`

## Findings

1. **Trigger widening is a strict superset (PASS).** `ci.yml` `pull_request.branches` changed
   `[main, "feat/package-quality"]` → `[main, "feat/**", "epic/**"]`. `feat/package-quality`
   matches `feat/**`, so no previously covered base is dropped; `push:` is untouched. No workflow
   that previously ran on PRs to `main` loses coverage — the diff only adds bases.
2. **e2e-cli applicability gate preserves the classify/skip policy (PASS).** The widening is a
   job-level `if` using `startsWith(base.ref, 'feat/')` / `'epic/'` (correct: job `if` cannot glob),
   with `workflow_dispatch`, `base.ref == 'main'`, and the `e2e-cli-gate` label opt-in all retained.
   `.github/scripts/ci-classify-changes.ts` and its test are untouched by the diff, so docs-only /
   `ci:skip-e2e` / `ci:skip-scaffold` / `ci:full` precedence is intact; docs-only PRs still
   short-circuit the expensive fleet inside `scaffold-static`/`scaffold-runtime`.
3. **Lane-visibility jobs are safe (PASS).** Both are `if: always() && github.event_name ==
   'pull_request'`, `needs` all lanes, write only `$GITHUB_STEP_SUMMARY`, pass every dynamic value
   through `env:` + `printf` (no untrusted interpolation), request no extra permissions, add no
   third-party actions, `timeout-minutes: 5`. The only failure mode is runner-level; they cannot
   spuriously fail the build on lane logic. The scaffold summary correctly distinguishes
   "skipped by policy" (classifier `run_* == false`) from "not scheduled" (classify skipped) from
   "ran (result)".
4. **No always()-masking of branch protection (PASS).** I fetched the live ruleset:
   `main-branch-protection` id **18459345**, `enforcement: active`, targets `~DEFAULT_BRANCH`,
   `required_status_checks` = `quality`, `check-test`, `deps-report`. Neither `lane-visibility` job
   is a required check, so an always()-success job cannot satisfy protection while its dependencies
   fail. The corrected `ci.yml` header claim ("`quality` required on `main` by the active
   `main-branch-protection` ruleset") is therefore verified true by direct API evidence, matching
   the run dir's recorded audit.
5. **Live proof on the impl commit (PASS).** Check-runs on `e5924b48` (PR #787 → integration
   branch): `check-test`, `quality`, `deps-report`, `close-gate` all `completed/success`;
   `classify changes`, `scaffold-static`, `scaffold-runtime` success; both `core CI lane
   visibility` and `scaffold CI lane visibility` success. (An earlier attempt's scaffold jobs show
   `cancelled` — concurrency supersession, expected.) The fix is self-demonstrating on its own PR.
6. **Process finding (recorded, non-blocking).** The generator's supervisor arranged its own
   "IMPL-EVAL PASS" (`evaluate.md` in the run dir, session `319e284e…`, committed at `06768adb`
   "record the #774 implementation verdict") before this official evaluation existed. That session
   was model-separate but generator-arranged; per protocol the supervisor-triggered opposite-family
   pass — this document — is the official IMPL-EVAL. The self-arranged artifact's technical content
   was spot-checked and is consistent with my independent findings, but it must not be cited as the
   authorizing verdict.
7. **Observation (pre-existing, out of scope).** Ruleset 18459345 also requires `deps-report`,
   whose substantive step is `continue-on-error: true` — a required check that effectively cannot
   fail on freshness. Pre-existing before this PR and explicitly informational by design; noted for
   a future branch-protection hygiene pass, not a defect of #787.

## Issue #774 asks vs delivery

| Ask | Status |
| --- | --- |
| Widen ci.yml triggers to integration branches | Done (`feat/**`, `epic/**`), coverage-superset. |
| Report-only branch-protection audit for `quality`/`check-test` required | Done and independently re-verified (ruleset 18459345 requires both, plus `deps-report`); no settings changed. |
| Lane-visibility surfacing | Done via two dependency-free `$GITHUB_STEP_SUMMARY` jobs, classifier-output-authoritative. |

## Evidence commands

- `git diff 2b7d0f81..e5924b48` in `/home/codex/repos/b10-774-ci`.
- `GET /repos/rickylabs/netscript/rulesets` and `/rulesets/18459345` (token via
  `resolveGithubToken`).
- `GET /repos/rickylabs/netscript/commits/e5924b48/check-runs` (15 runs, outcomes above).
