# Drift Log: randomized scaffold default ports

## 2026-08-04 — Milestone composed PLAN-EVAL

- **What:** No local formal PLAN-EVAL is spawned for this per-PR milestone slice.
- **Source:** Owner instruction; `milestone-run.md` evaluator protocol; orchestrator ruling D6.
- **Expected:** Generic run-loop uses a separate formal PLAN-EVAL before implementation.
- **Actual:** The row is `composed per milestone-run.md (orchestrator waiver)`; the plan is locked
  and implementation proceeds in this run. Independent review/evaluation remains required before
  ready-merge.
- **Severity:** minor / authorized
- **Action:** accept
- **Evidence:** `supervisor.md`, `plan.md` D6, `plan-eval.md`.

## 2026-08-04 — Live issue comment count differs from brief

- **What:** The owner brief says to read three comments; the live GitHub API reports and returns two.
- **Expected:** Three live issue comments.
- **Actual:** Two owner comments, both read in full; no missing evidence was inferred.
- **Severity:** minor
- **Action:** record
- **Evidence:** live issue API metadata (`comments: 2`) and fetched comment list.

## 2026-08-04 — Inherited lockfile modification

- **What:** The provided worktree started with `deno.lock` modified before this run wrote files.
- **Expected:** Clean branch at bootstrap.
- **Actual:** Branch commit equals `origin/main`; only `deno.lock` was dirty.
- **Severity:** minor
- **Action:** preserve and exclude from every commit; verify no run-caused delta is added.
- **Evidence:** bootstrap raw `git status --short --branch`.

