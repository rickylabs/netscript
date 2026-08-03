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
