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

## 2026-08-01 — live AppHost reproduction could not be proven deterministically

- **What:** The proposed `scaffold.runtime` resident-lifecycle gate was implemented, registered,
  and type-checked, but no green full-suite execution reached it reliably.
- **Source:** S4 runtime attempts in `.llm/tmp/cli-e2e/`.
- **Expected:** Reuse the suite's detached AppHost, run `netscript db status`, then prove the same
  recorded pid/path remains alive through `aspire describe`.
- **Actual:** Attempt 1 exited 1 at the existing `behavior.service-health` gate after the proposed
  gate had accidentally been omitted from the suite's explicit allowlist. After correcting and
  verifying that registration, attempt 2 stalled in `database.init`; its Aspire subprocess tree
  was suspended (`T` state) while other agent sessions were active in this shared worktree. The
  attempt was interrupted with exit 1 and the S4 code was removed.
- **Severity:** significant
- **Action:** Do not land or claim the live gate in this slice. Retain the PR's residual-risk and
  partial acceptance wording; rerun the reproduction in an isolated environment before box 3 is
  treated as live evidence.
- **Evidence:** first suite summary `passed=44 failed=1`; second run exit 1 after interruption;
  `aspire stop` reported no surviving project-specific AppHost.
