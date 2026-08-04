# Drift Log: custom workers job registry generation (#1234)

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-08-04 — Composed evaluator waiver

- **What:** Standalone local PLAN-EVAL and IMPL-EVAL sessions are replaced by composed milestone
  evaluation.
- **Source:** User directive; `.llm/harness/workflow/milestone-run.md` evaluator protocol and ruling
  D6.
- **Expected:** Ordinary harness runs use an independent formal evaluator session.
- **Actual:** This milestone PR records `composed per milestone-run.md (orchestrator waiver)` and
  locks the plan before implementation in the same run.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `plan-eval.md`, `plan.md`, and PR phase comments.

## 2026-08-04 — Foreign lockfile modification

- **What:** The worktree began with a one-line `deno.lock` addition unrelated to this run.
- **Source:** Raw `git status` and `git diff` before research.
- **Expected:** Clean implementation worktree.
- **Actual:** `deno.lock` is modified by an unknown owner and must remain untouched.
- **Severity:** minor
- **Action:** accept
- **Evidence:** Baseline diff adds `jsr:@netscript/queue@0.0.4`; every commit and final PR diff must
  exclude `deno.lock`.
