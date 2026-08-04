# Drift Log: StreamDB wrapper type preservation

Drift is append-only.

## 2026-08-04 — Milestone evaluation composition

- **What:** No duplicate local formal PLAN-EVAL or IMPL-EVAL is launched.
- **Source:** Owner W5-V2 brief; `workflow/milestone-run.md` evaluator protocol; orchestrator ruling D6.
- **Expected:** Normal `run-loop.md` launches separate local formal evaluator sessions.
- **Actual:** Evaluation composes the PR draft→ready augment and milestone orchestrator pre-merge gate.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `plan-eval.md`, `supervisor.md`, plan gate row

## 2026-08-04 — Foreign lock state at bootstrap

- **What:** `deno.lock` contains one unstaged queue dependency addition before W5-V2 work.
- **Source:** Opening raw `git status` and `git diff -- deno.lock`.
- **Expected:** Clean baseline.
- **Actual:** One foreign insertion for `jsr:@netscript/queue@0.0.4`.
- **Severity:** minor
- **Action:** accept and exclude
- **Evidence:** Explicit-path staging is required for every slice; final commit-range audit must show no lock change.
