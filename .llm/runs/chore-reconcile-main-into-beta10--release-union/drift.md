# Drift Log: beta.10 release union

## 2026-07-17 — Owner-authorized evaluator omission

- **What:** PLAN-EVAL and IMPL-EVAL are not dispatched in this slice.
- **Source:** Owner task directive: `Do NOT dispatch evals`.
- **Expected:** Harness normally requires separate evaluator sessions before and after implementation.
- **Actual:** `workflow/run-loop.md` §4 permits a written owner waiver; the PR is intentionally left
  draft at `status:impl-eval` without claiming a PASS verdict.
- **Severity:** significant
- **Action:** accept
- **Evidence:** task brief and `supervisor.md`.

## 2026-07-17 — OpenCode evaluator snapshot joined the release union

- **What:** The first agentic gate failed because the integration-side routing-state snapshot did
  not include main's new `adversarial_design_eval` output row.
- **Source:** Exact agentic runtime/config test command.
- **Expected:** The merged OpenCode evaluation route is visible in the routing-state CLI.
- **Actual:** Production output included it; the stale snapshot did not.
- **Severity:** minor
- **Action:** fix
- **Evidence:** `runtime/cli/routing-state_test.ts`; rerun passed 153 tests.
