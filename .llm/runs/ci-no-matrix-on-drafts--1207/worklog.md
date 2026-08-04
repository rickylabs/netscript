# Worklog

## 2026-08-04 — research and design

- Read #1207 first; captured all six acceptance boxes.
- Swept every workflow with a `pull_request` trigger.
- Locked minimal draft set to **nothing**: draft PRs are non-mergeable and the ready event now
  materializes all required contexts.
- PLAN-EVAL row recorded as composed/not-local under milestone ruling D6.

## 2026-08-04 — implementation

- Added `ready_for_review` wherever PR activity types are enumerated.
- Guarded core CI including close-gate and required contexts, e2e classifier/scaffold/runtime/
  desktop/visibility, code quality, and surface diff with `draft == false`.
- Preserved #1152 capability-vector expressions and `ci:skip-scaffold`, `ci:skip-e2e`, and
  `ci:full` behavior unchanged for non-draft runs.
- OpenHands remains explicit-trigger-only; its added ready event is inert without an agent label.
- Existing unrelated `deno.lock` modification was present at activation and was not staged.

## Evidence

- RED baseline: #1207 owner evidence records that draft pushes on the pre-change workflows fired
  e2e suites, lint/non-code checks, and close-gate; this PR is the real draft transition vehicle.
- Compute estimate: milestone 0.0.5 has 28 PRs / 146 commits. At the harness one-slice-commit per
  push convention, ~146 draft pushes × 13 retired routinely materialized jobs = ~1,898 avoided job
  starts; up to ~2,044 when the path-filtered code-quality job also matches.
- AFTER draft PR #1212: core CI [run 30891562617](https://github.com/rickylabs/netscript/actions/runs/30891562617),
  e2e [run 30891563314](https://github.com/rickylabs/netscript/actions/runs/30891563314), and surface
  [run 30891563153](https://github.com/rickylabs/netscript/actions/runs/30891563153) all completed
  `skipped`; no jobs ran. This is the same pull-request push shape with `draft: true`.
- AFTER ready flip: core CI [run 30891612271](https://github.com/rickylabs/netscript/actions/runs/30891612271)
  materialized `deps-report` (success), `check-test` (running), `quality` (running), and
  `close-gate` (ran; expected lifecycle failure because the live-evidence DoD box was unchecked at
  event time). E2E [run 30891611877](https://github.com/rickylabs/netscript/actions/runs/30891611877)
  materialized classifier, scaffold-static, scaffold-runtime, and desktop. This proves required
  contexts and the full matrix appear on `ready_for_review`.

## Validation

- `deno test --no-lock --allow-read .github/scripts/draft-workflow-policy.test.ts` — PASS, 3/3.
- `deno test --no-lock --allow-read --allow-write --allow-env .github/scripts/ci-classify-changes.test.ts .llm/tools/validation/check-close-gate_test.ts` — PASS, 58/58.
- `deno fmt --check .github/scripts/draft-workflow-policy.test.ts` — PASS.
- `git diff --check` — PASS.
- YAML parser probe unavailable (`ruby` and `actionlint` are not installed); focused Deno policy
  tests assert the owned event/guard contract directly.
