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
- AFTER draft push and ready-flip run URLs: to be added from this PR's Actions history.

## Validation

- `deno test --no-lock --allow-read .github/scripts/draft-workflow-policy.test.ts` — PASS, 3/3.
- `deno test --no-lock --allow-read --allow-write --allow-env .github/scripts/ci-classify-changes.test.ts .llm/tools/validation/check-close-gate_test.ts` — PASS, 58/58.
- `deno fmt --check .github/scripts/draft-workflow-policy.test.ts` — PASS.
- `git diff --check` — PASS.
- YAML parser probe unavailable (`ruby` and `actionlint` are not installed); focused Deno policy
  tests assert the owned event/guard contract directly.
