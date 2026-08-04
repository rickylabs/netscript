# Drift Log: MCP generated export-surface corpus

Drift is append-only.

## 2026-08-04 — Current export corpus has 35 publishable packages

- **What:** Re-baseline count differs from the issue's measured 36 flat files.
- **Source:** Current `packages/*/deno.json` and `plugins/*/deno.json` publishable-manifest walk.
- **Expected:** 36 generated flat export files in the control-run mirror.
- **Actual:** 35 publishable first-party packages and 268 export subpaths on current main.
- **Severity:** minor
- **Action:** accept; generate from current authoritative manifests and retain issue count only as historical measurement.
- **Evidence:** `research.md` R-baseline; command output in supervisor session.

## 2026-08-04 — Pre-existing lockfile change is outside slice ownership

- **What:** Worktree was dispatched with a modified `deno.lock`.
- **Source:** Raw `git status` and `git diff -- deno.lock` before any task command.
- **Expected:** Clean dispatched worktree.
- **Actual:** One added `jsr:@netscript/queue@0.0.4` dependency row under an existing package graph.
- **Severity:** minor
- **Action:** accept as user-owned working-tree state; never stage, revert, or attribute it to this PR.
- **Evidence:** baseline raw diff captured before implementation.

## 2026-08-04 — Milestone evaluator composition overrides local formal PLAN-EVAL

- **What:** Standard run-loop calls a separate local PLAN-EVAL; owner brief forbids it for this milestone PR.
- **Source:** Owner brief; `.llm/harness/workflow/milestone-run.md` evaluator protocol; orchestrator ruling D6.
- **Expected:** Separate-session local PLAN-EVAL before implementation.
- **Actual:** PLAN-EVAL is composed per milestone-run.md (orchestrator waiver); plan is still locked and recorded before source work.
- **Severity:** minor
- **Action:** accept authorized workflow override; retain draft→ready augment, OpenHands, and orchestrator pre-merge evaluation composition.
- **Evidence:** `supervisor.md`; `plan-eval.md`.
