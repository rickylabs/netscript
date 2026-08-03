# Drift Log: OMB S4 OpenAPI projection domain

Drift is append-only.

## 2026-08-04 — Milestone PLAN-EVAL composition

- **What:** The standard local formal PLAN-EVAL session is replaced by the milestone-run composed
  evaluation path.
- **Source:** User directive citing `.llm/harness/workflow/milestone-run.md` § Evaluator protocol and
  orchestrator ruling D6.
- **Expected:** Ordinary `run-loop.md` launches a separate local PLAN-EVAL before implementation.
- **Actual:** No local PLAN-EVAL is spawned or awaited; the plan is locked and implementation begins
  in the same run. Draft→ready augment review, OpenHands, and the orchestrator pre-merge gate compose
  evaluation.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `plan-eval.md`; `worklog.md` Plan Gate row.

## 2026-08-04 — Supervisor route assignment

- **What:** The owner assigned the current Codex session as the PR implementation supervisor.
- **Source:** User task contract.
- **Expected:** Canonical primary `planning_decisions` route is Fable 5 low.
- **Actual:** Current Codex session owns planning/merge authority; implementation and opposite-family
  review still use their bound routes.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `supervisor.md`.
