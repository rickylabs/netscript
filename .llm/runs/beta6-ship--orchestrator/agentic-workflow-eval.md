# Agentic Workflow Eval — beta6-ship--orchestrator (pilot)

Living evaluation of the epic #574 agentic runtime system, maintained by the beta-6 shipping
orchestrator (session `fb43bc3e`).

## Drift

- **D1 (2026-07-11, bootstrap)**: External evaluator dispatch (OpenHands PLAN-EVAL/IMPL-EVAL
  sessions) is owner-waived for this run. Fallback: supervisor performs substantive
  opposite-family-informed review per slice; GPT-5.6 review lane used where launchable.
- **D2 (2026-07-11, bootstrap)**: Launch checkout `netscript-beta6-orchestrator` was a detached-HEAD
  shared checkout; work moved to worktree `beta6-ship-orchestrator` under `netscript-547-lffix`.
  The default worktree baseline was stale (`f7898dba`); `git fetch origin main` did not advance
  `refs/remotes/origin/main` (known ls-remote/fetch refspec gotcha) — reset to `b13ca0fa` by
  explicit sha.

## Blockers + fallbacks

- **B1**: `refs/remotes/origin/main` stale after `git fetch origin main` in fresh worktree.
  Fallback: `git ls-remote origin main` for truth + `git reset --hard <sha>`.

## Good mechanics

- (accruing)

## Improvements

- (accruing)
