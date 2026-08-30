# Drift Log: #1751 stale sender lease recovery and resume rejection propagation

Drift is append-only.

## 2026-08-31 — owner-provided planning route

- **What:** The Research + Plan generator is the already-launched OpenAI GPT-5.6 Sol high session,
  rather than the canonical Claude `planning_decisions` lane.
- **Source:** `codex-thread-ids.md`; owner launched this Codex worktree/session and requested the
  harness Research + Plan phase.
- **Expected:** Lane policy normally routes planning decisions to native Claude Opus 5 high.
- **Actual:** Codex/Sol high authored the plan.
- **Severity:** minor
- **Action:** accept for plan generation; retain the required native opposite-family Fable 5 medium
  PLAN-EVAL and future review/evaluation pairings.
- **Evidence:** `supervisor.md` route table and override.

## 2026-08-31 — RTK binary unavailable

- **What:** The repo skill expects `rtk` on PATH, but the host returned `rtk: command not found`.
- **Source:** Bootstrap attempt to list the run/templates and inspect Git through RTK.
- **Expected:** `rtk` v0.38.0 available for exploratory read-heavy commands.
- **Actual:** Focused raw read-only commands were required.
- **Severity:** minor
- **Action:** accept for this plan-only session. Keep authoritative Git raw and future gate verdicts
  on structured wrappers; do not represent raw exploratory output as a durable gate receipt.
- **Evidence:** `worklog.md` Bootstrap/Re-baseline entries.
