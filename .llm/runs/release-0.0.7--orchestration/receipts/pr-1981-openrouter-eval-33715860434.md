# Recovered evaluator artifact

Source: https://github.com/rickylabs/netscript/actions/runs/33715860434
Artifact: openhands-agent-33715860434-1 (9878828721), _temp/openhands/33715860434-1/summary.md.
Recovered read-only on 2026-09-03. The summary uploader failed; this preserves the actual separate-session verdict without changing the evaluated PR head. Effort is not attested by OpenHands.

# IMPL-EVAL Session — PR #1981 `fix(release): wait for README service health before probing`

**Verdict (stable):** PASS

**Evaluated head:** `bdb5de2bd14173b36276f59048a444f8873985bc` · **True PR base:** merge-base `632528888ad033f0e23dfd4f6718d089bfe3eeab` (the run-supplied trusted base marker `e14322c511bbf26018c617c12f639474b6092c32` is 4 commits ahead of the true base — a stale-marker artifact, not a PR regression; the real delta is 3 commits: `09d9d2edf` test-scope, `8704b0571` fix, `bdb5de2bd` handoff docs).

## Summary

The PR repairs the exact Canary 9 incident: production run `33712927776` proved commands 1–10 passed, then the unbounded command-11 health curl made no progress for 900113 ms and exited 143. The fix prints and executes `aspire wait users --status healthy --timeout 60 --apphost aspire/apphost.mts` as the new command 11, resolves the users endpoint only after that readiness command succeeds, bounds the public curl argv at `--max-time 15` with `--fail-with-body --show-error` (outer layers at 20 s child / 25 s wrapper), and uploads both cleanup wrapper and child receipts in the production workflow artifact list.

The three locked plan decisions (D1 readiness argv, D2 curl flags/bound, D4 receipt-backed port capture) are each implemented and individually pinned by focused tests. Plan-gate is correctly recorded as `PLAN-EVAL: N/A` (bounded incident repair, no architecture choice, no package/API change). The false-done risk that matters for this class of change — the endpoint being treated as ready merely because it is allocated — is directly negated by the strongest new test, which runs all 12 expected command indices through the real `executeReadmeQuickstartCommand` and asserts the resolver is invoked exactly once, only after the `aspire wait users` spawn.

## Changes (PR delta, true base → head)

- `README.md` — printed quickstart: new `aspire wait users … --apphost aspire/apphost.mts` line before the health request; curl now prints `--fail-with-body --show-error --max-time 15`.
- `packages/cli/e2e/src/domain/readme-quickstart.ts` — domain markers/argv now include the users-wait command and bounded curl; expected-command tuple/cardinality updated to 12.
- `packages/cli/e2e/src/domain/cli-surface.ts` — new stable gate IDs `readme.quickstart.11-aspire-wait-users`, `readme.quickstart.12-curl-health`.
- `packages/cli/e2e/src/application/gates/quickstart/readme-command.ts` — port capture (`resolveResourceUrlsFromAppHost`) now occurs only after the users-readiness spawn; bounded curl child (20 s) inside wrapper (25 s).
- `packages/cli/e2e/suites/quickstart/readme-quickstart-suite.ts` — suite ordering/cardinality updated.
- `packages/cli/e2e/tests/domain/readme-quickstart_test.ts` — argv literal, shell-quoting-rejection, and receipt-backed-port tests.
- `packages/cli/e2e/tests/application/readme-command_test.ts` — full-tuple run test pinning resolver ordering and exact argvs; env-persistence test.
- `packages/cli/e2e/tests/presentation/readme-quickstart-suite_test.ts` — suite drift test.
- `.llm/tools/release/release-canary-workflow_test.ts` — new "production README E2E uploads both durable cleanup receipts" test pinning both exact artifact paths.
- `.github/workflows/e2e-cli-prod.yml` — upload list now includes `.llm/tmp/gate-receipts/readme.quickstart/cleanup.aspire-stop.receipt.json` and `cleanup.aspire-stop.json`; paths verified against the write sites in `runtime-gates.ts` (`` `${repoRoot}/.llm/tmp/gate-receipts/${suiteId}/…` ``).

No source changes were made by this evaluator session (read-only evaluation, per protocol).

## Validation

- Focused trio `readme-quickstart_test.ts` + `readme-command_test.ts` + `readme-quickstart-suite_test.ts`: **14 passed / 0 failed, exit 0**.
- Full-tuple test (`README walker captures the users port only after the printed readiness command`): passes, asserts `resolverCalls === [{appHost, resourceName: 'users'}]` and exact `aspire wait users …` / `curl …` argvs.
- `release-canary-workflow_test.ts`: the PR's new receipt-upload test **passes**; the other 6 tests pass; the 1 failure ("stable workflow recovery …") is **pre-existing and environment-shaped** — reproduced identically at merge-base `632528888` in a temp worktree (same `NotCapable: Requires --allow-run permissions to spawn subprocess with LD_LIBRARY_PATH…` error at the same assertion site `release-canary-workflow_test.ts:453`), unrelated to the README surface.
- `deno check` on all 9 changed TS files: exit 0. Scoped `deno lint`: clean (exit 0).
- `deno fmt --check`: the only two flagged files (`README.md`, `e2e-cli-prod.yml`) are flagged **identically at merge-base** (BASE_FMT_RC=1, HEAD_YML_RC=1) — pre-existing formatting posture, not introduced by this PR; all 8 changed TS files are format-clean.
- Workflow YAML: parses clean (`YAML_OK`).
- Printed command list verified by direct import (12 tuples, command 11 = users wait, command 12 = bounded curl).

## Responses to review comments / issue comments

- No GitHub review threads exist on PR #1981 (empty `pr-review-comments.json`).
- Prior PR comment by rickylabs: "Independent exact-head IMPL-EVAL: **PASS** at `bdb5de2bd…` … No blocking findings; #1881/#863/#1712 correctly remain open for post-merge published-canary proof." — My findings are consistent with that independent evaluation: no blocking findings; the pre-existing release-canary test failure at line 453 is environmental (subprocess permission in this sandbox), not a PR defect.
- Prior PR comment by rickylabs (IMPLEMENTATION PACKET): "PASS: focused structured check/test/lint/fmt (22/22 tests), exact 12-command gate listing and suite listing, workflow YAML parse, agent-docs carrier, and quality:ga[te]" — my independent runs of the same focused trio and gates concur (14/14 on the trio; typecheck/lint clean; YAML clean).
- Issue closure posture is correct: #1881, #863, epic #1712 are referenced, not closed, pending fresh hosted published-version proof.

## Public surface

No package/public-API change: the only surface touched is the root README's printed quickstart (a docs contract) and the private E2E gate that executes it verbatim. The nested E2E workspace stays outside the published doctrine denominator, per the recorded plan.

## Lock hygiene / doctrine

- `deno.lock`: **untouched** in the PR delta (no dependency change → no lock churn).
- `packages/` is in **Keep** doctrine state (per plan): kernel/surface split preserved, no new package API, no new abstraction introduced (reuses `AspireCommandRunner` and the existing endpoint resolver).

## Architecture debt

- `.llm/harness/debt/arch-debt.md`: **no delta** between true base and head (git diff is empty for this path) — no new debt recorded, no debt discharge required.

## Remaining risks (non-blocking)

1. The repair's runtime efficacy (the 60-second `users` wait actually unblocking the health request in a fresh hosted production run) is intentionally deferred to a coordinator-owned published-canary run after merge. This is the only residual uncertainty and is explicitly out of scope per the plan's non-scope section.
2. `README.md` and `e2e-cli-prod.yml` carry pre-existing `deno fmt` posture drift (flagged identically at merge-base) — pre-existing, not a PR defect, and out of this incident-repair's locked scope.
3. The one failing release-canary test in this sandbox is environmental (LD_LIBRARY_PATH / `--allow-run` subprocess permission message), pre-existing at the merge-base; it does not exercise the PR surface.

OPENHANDS_VERDICT: PASS
