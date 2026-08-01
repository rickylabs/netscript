# Drift Log: preserve resident AppHost during database CLI operations

## 2026-08-01 — issue cause is a lead, not the established mechanism

- **What:** Repository control flow proves an explicit unconditional `aspire stop` targets the
  resident AppHost path. No repository or live-fixture evidence establishes the issue's separate
  claim that Aspire implicitly retires the resident identity when the short-lived AppHost exits.
- **Source:** `packages/cli/src/kernel/adapters/database/operation-runner.ts`; issue #1011.
- **Expected:** Issue text attributes termination to same-project identity retirement.
- **Actual:** The CLI itself definitely sends the destructive stop command in `finally`, including
  after a non-zero DB operation.
- **Severity:** significant
- **Action:** fix the proven explicit ownership defect; preserve a rescope trigger if later live
  evidence shows start/identity retirement independently kills the resident host.
- **Evidence:** research findings 1, 2, and 7.

## 2026-08-01 — canonical local PLAN-EVAL authentication unavailable

- **What:** A separate Claude Code + OpenRouter session launched with the bound open Qwen evaluator
  model but failed before evaluation with `Not logged in`.
- **Source:** `claude-print` session `aa3c6460-8788-4e0d-b4c3-9b04fc11eb17`.
- **Expected:** The local `claude-openrouter` profile supplies a usable OpenRouter credential.
- **Actual:** No usable credential was available to the isolated profile; zero evaluator tokens
  were consumed and no `plan-eval.md` was written.
- **Severity:** significant
- **Action:** pause at the Plan-Gate and request credential restoration; do not self-evaluate,
  substitute a prohibited closed model, or begin implementation.
- **Evidence:** evaluator output: `authentication_failed` / `Not logged in`.
