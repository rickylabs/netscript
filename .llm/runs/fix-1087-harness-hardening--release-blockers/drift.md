# Drift Log: release-blocking harness hardening

## 2026-08-03 — owner-assigned supervisor route

- **What:** This Codex API session is both supervisor and implementation lane instead of the
  canonical Fable orchestrator entry.
- **Source:** User assignment and current runtime identity.
- **Expected:** `planning_decisions` defaults to Fable 5 low.
- **Actual:** The owner addressed the existing Codex session with a concrete branch/worktree slice.
- **Severity:** significant
- **Action:** accept for this run; retain separate open-model PLAN/IMPL evaluation and
  opposite-family substantive slice review.
- **Evidence:** `supervisor.md` route table.

## 2026-08-03 — bootstrap evaluator child surface must be disabled

- **What:** The canonical local Qwen evaluator cannot safely receive the default Claude `Agent`
  tool before #1087 is implemented.
- **Source:** issue #1087 and the current `claude-print.ts` argument list.
- **Expected:** PLAN-EVAL uses the normal bound local Qwen preset.
- **Actual:** The route/model remain canonical, but bootstrap PLAN-EVAL must use a session-scoped
  Claude configuration denying `Agent`; the evaluator needs only read/search/Bash for the Plan-Gate.
- **Severity:** significant
- **Action:** temporary safety restriction; remove the bootstrap-only configuration after #1087's
  guarded child request surface lands.
- **Evidence:** `research.md` findings 1-3; `worklog.md` decision log.
