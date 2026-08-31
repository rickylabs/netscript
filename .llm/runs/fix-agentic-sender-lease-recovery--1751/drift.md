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

## 2026-08-31 — root lint config excludes the internal agentic surface

- **What:** Slice 1's first structured lint invocation selected the two owned `.llm/tools/agentic`
  files, but Deno's root `lint.exclude` drops `.llm/`; the wrapper correctly refused an
  all-excluded verdict with exit 2.
- **Expected:** The plan's scoped lint command processes `.llm/tools/agentic` and returns a real
  covered verdict.
- **Actual:** The no-config command cannot cover this internal surface. An explicit checked-in
  root-local JSON config (`jsr-package-settings.json`) made Deno apply its default lint rules to the
  same two files; the structured wrapper then processed 2/2 files with zero findings and exit 0.
- **Severity:** minor tooling/evidence drift; no source or contract decision changes.
- **Action:** Record both results. Future slices must continue to use an explicit config (or amend
  the plan/tooling in-scope before claiming a full agentic lint verdict); an all-excluded result is
  never a pass.
- **Evidence:** Slice 1 gate table in `worklog.md`.

## 2026-08-31 — Slice 7 full-agentic lint is blocked outside the declared manifest

- **What:** The required structured lint gate over all 173 `.llm/tools/agentic` TypeScript files,
  using the explicit config required by the earlier lint-exclusion drift, exited 1 with 14 findings
  across 9 files.
- **Expected:** Slice 7 requires the full agentic lint gate to pass before commit and push.
- **Actual:** None of the findings is in the Slice 6/7 manifest. They are in
  `wsl/wsl-foundation.ts`, `wsl/wsl-foundation-lib.ts`, `claude/remote-model-launcher.ts`,
  `claude/hybrid-launcher_test.ts`, `opencode/opencode-boundary-plugin.ts`,
  `opencode/opencode-preflight.ts`, `runtime/controller.ts`,
  `runtime/adapters/codex-profile-adapter.ts`, and `openhands/phase-eval-workflow_test.ts`.
- **Severity:** significant gate drift; the required final lint verdict cannot be made green within
  the approved file ceiling.
- **Action:** Stop before the full test gate, commit, push, or PR comment. The coordinator must
  either land the unrelated lint repairs elsewhere and resume this slice, or explicitly rescope the
  manifest. No unrelated source was edited here.
- **In-scope correction:** The same gate pass exposed a formatting-only import-layout defect in the
  already-declared Slice 6 file `codex/codex-resume.ts`; it was formatted, and the repeated full
  agentic format wrapper passed over 173/173 files with exit 0.
- **Evidence:** `worklog.md` Slice 7 blocked-gate rows; structured lint `REAL_EXIT=1`, structured
  format rerun `REAL_EXIT=0`.
