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

## 2026-08-31 — PLAN-EVAL cycle 2 PASS residuals R1/R2 corrected before Slice 4

- **What:** Cycle 2 (`plan-eval-cycle-2.md`, `PASS`) found two record-keeping residuals, not plan
  gaps: R1 — `plan.md`'s Open-Decision Sweep claimed the F1 wiring files were "declared in the
  Intended File Manifest **and Slice 4**", but `worklog.md`'s Slice 4 files row still omitted
  `runtime/contract.ts`, `runtime/planner.ts`, and both test files. R2 — five remaining spots
  (D5 rationale, Scope bullet, Risk Register row, Dependencies, worklog Slice 7) still described
  #1774 as in-flight/conflicted after it had already shipped (`a3ddcbb59`).
- **Expected:** Slice 4's file row and the Open-Decision Sweep sentence describe the same set;
  #1774 referenced consistently as shipped throughout, matching the F3 fix already applied to R13.
- **Actual:** Both were stale record-keeping, not incorrect decisions — cycle 2 explicitly judged
  neither blocks implementation.
- **Severity:** minor (mandatory-before-Slice-4 per cycle 2's own instruction, but not plan-reopening)
- **Action:** corrected before dispatching Slice 1 — `worklog.md` Slice 4 row now lists all four
  wiring files; the Open-Decision Sweep sentence now describes the actual current state; all six
  stale #1774 wording spots re-anchored to shipped state.
- **Evidence:** `plan-eval-cycle-2.md` R1/R2; this commit's diff.

R3 (optional — a Risk Register row for the isolated-CODEX_HOME profile-home hazard) is not applied:
cycle 2 judged the hazard already closed structurally by the amended D2/truth table, and the row
would be documentation-only. Left for Slice 4's author to add if useful, not required.
