# Drift Log: Merge-aware canary payload derivation (#1166)

Drift is append-only.

## 2026-08-03 — Owner-opened supervisor route

- **What:** The active supervisor is Codex rather than the canonical Fable primary.
- **Source:** User-opened implementation-supervisor session and `workflow/lane-policy.md`.
- **Expected:** `planning_decisions` primary routes to Fable 5 low.
- **Actual:** Codex supervises; the lane policy documents Codex as the planning fallback family.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `supervisor.md`; implementation, opposite-family review, and formal evaluation remain
  separate canonical sessions.

## 2026-08-03 — Local formal evaluator credential absent

- **What:** The canonical Claude Code + OpenRouter Qwen PLAN-EVAL route could not launch.
- **Source:** `agentic:provider-canary --live` structured result.
- **Expected:** A separate Qwen 3.7 Max evaluator turn writes `plan-eval.md` before implementation.
- **Actual:** `auth_required`; selected provider credential absent, process not started, and tool,
  reasoning, and streaming event counts all zero.
- **Severity:** significant
- **Action:** defer pending owner/environment action
- **Evidence:** `worklog.md`; no `plan-eval.md` exists and no verdict is claimed. The cloud
  OpenHands route was not used because the OpenHands skill prohibits substituting it for a local run.

## 2026-08-03 — Milestone orchestrator waives per-PR local PLAN-EVAL

- **What:** The `release-0.0.5--orchestration` supervisor approved the locked plan and authorized
  implementation without a local per-PR formal evaluator.
- **Source:** Written orchestrator steer citing `.llm/harness/workflow/milestone-run.md` § Evaluator
  protocol for a milestone run.
- **Expected:** The generic single-run loop would require a separate PLAN-EVAL PASS or written waiver.
- **Actual:** This PR is a delegated milestone slice. Evaluation composes draft→ready augment review,
  label-triggered OpenHands, and the orchestrator's pre-merge gate; a local evaluator per PR is
  explicitly waived as waste.
- **Severity:** minor
- **Action:** accept
- **Evidence:** User/orchestrator steer in this session; `worklog.md` PLAN-EVAL row marked
  `COMPOSED / WAIVED`. L1, L4, and `Refs #1166` handling were approved as written.
