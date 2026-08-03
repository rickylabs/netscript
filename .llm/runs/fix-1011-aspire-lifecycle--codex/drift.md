# Drift Log: Aspire and CLI lifecycle (#1011, #1012)

Drift is append-only.

## 2026-08-03 — Referenced service overlay is absent

- **What:** Harness activation documentation names `SCOPE-service.md`, but no `SCOPE-*` file exists
  under `.llm/harness/` in this checkout.
- **Source:** direct `rg --files .llm/harness` search at baseline `ab0fa13fe`.
- **Expected:** Load the service overlay for Aspire service work.
- **Actual:** Archetype 6 and runtime gates are available; the overlay is not.
- **Severity:** minor
- **Action:** accept for this run; do not invent replacement rules.
- **Evidence:** `plan.md` metadata and validation plan.

## 2026-08-03 — Runtime-provided supervisor route

- **What:** The user initiated this Codex session as primary harness agent, so it acts as supervisor
  rather than launching the lane-policy Fable primary.
- **Source:** current API session and user request.
- **Expected:** `planning_decisions` defaults to Fable 5 low.
- **Actual:** Codex primary supervises; separate open-model formal evaluation and opposite-family
  slice review remain mandatory.
- **Severity:** minor
- **Action:** accept and record in `supervisor.md`.
- **Evidence:** `supervisor.md` route table.

## 2026-08-03 — Canonical formal evaluator cannot authenticate

- **What:** The separate PLAN-EVAL launch through the lane-policy Claude Code + OpenRouter route
  could not authenticate.
- **Source:** isolated profile auth check and bounded evaluator launch.
- **Expected:** Qwen `qwen/qwen3.7-max` at high effort writes an independent `plan-eval.md` verdict.
- **Actual:** Claude Code returned `Not logged in · Please run /login`; no evaluator artifact was
  created and no verdict can be claimed.
- **Severity:** blocking
- **Action:** stop before product implementation; require restored profile authentication or an
  explicit owner-authorized, documented evaluator fallback/waiver.
- **Evidence:** missing `plan-eval.md`; evaluator session
  `260fb161-ad49-45b3-afad-4f44b8635b54` in the isolated profile.

## 2026-08-03 — Owner-authorized Plan-Gate waiver

- **What:** The owner explicitly waived PLAN-EVAL for this slice after reviewing the blocked launch
  and the published Codex-authored plan.
- **Source:** owner message in the supervising API thread on 2026-08-03.
- **Expected:** A separate open-model Qwen session emits `PASS` before implementation.
- **Actual:** The evaluator credential remains deliberately unavailable because issue #1087 records
  an unsafe helper-spawning route; the owner, identifying as Claude, supplied the opposite-family
  review and authorized immediate implementation.
- **Severity:** significant, owner-authorized process exception
- **Action:** proceed with S1/S2; retain the blocked-launch evidence and do not claim a synthetic
  PLAN-EVAL verdict. Automated gates, per-slice review, IMPL-EVAL handling, and close-gate evidence
  remain required.
- **Evidence:** this drift entry, PR #1088 plan artifacts, and the supervising thread waiver.

## 2026-08-03 — IMPL-EVAL route remains credential-blocked

- **What:** The required final open-model evaluator could not be launched.
- **Source:** canonical `agentic:provider-canary --live` launch for the `formal_evaluation` route.
- **Expected:** a separate Qwen evaluator reads the completed implementation and writes
  `evaluate.md` with an allowed verdict.
- **Actual:** the route returned `status=blocked`, `credential=absent`, diagnostic
  `auth_required` (`retryable=false`), with zero tool/reasoning/streaming events. No evaluator
  session or verdict artifact exists.
- **Severity:** blocking
- **Action:** do not self-certify or mark the draft ready. An explicit owner waiver for IMPL-EVAL,
  or a safely restored canonical evaluator route, is required.
- **Evidence:** provider canary invocation recorded in the PR implementation summary; absence of
  `evaluate.md` is intentional.
