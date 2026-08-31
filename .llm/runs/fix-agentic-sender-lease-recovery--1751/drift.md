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

## 2026-08-31 — parked-head root-suite failure was an unidentified flake

- **What:** One root-suite run at `de24161b6` reported 4,463 passed / 1 failed / 19 ignored, but its
  output was not persisted, so the failing test name cannot be recovered.
- **Expected:** A deterministic regression repeats on the identical tree, and every root-suite
  failure has a durable structured report identifying it.
- **Actual:** The supervisor ran the identical command twice at the identical head with direct exit
  capture and saved JSON reports; both returned exit 0 with 4,464 passed / 0 failed / 19 ignored.
  The totals remained 4,483, proving one result flipped rather than a test being added or removed.
- **Severity:** minor test/evidence flake; not a #1751 regression.
- **Action:** Record it as unidentified and do not speculate about its test identity. Every root
  suite from this point uses `--output <path> --pretty`; the current integrated run follows that
  rule. The sender-ownership live-host-race hypothesis is rejected because those tests use injected
  temp roots and explicitly forbid the production sender registry.
- **Evidence:** Supervisor reruns at `de24161b6`; integrated root report path in `worklog.md`.

## 2026-08-31 — current main carries a stale MCP export-surface corpus

- **What:** After fetching and merging current `origin/main`
  (`62ea359b13b292f5f4335ff77b8b9df1ecdf5ae7`) exactly once, the requested
  `deno task check:mcp-export-corpus` freshness gate exits 1.
- **Expected:** Product export surfaces and their checked-in MCP corpus agree at the integrated
  head.
- **Actual:** The checker reports `MCP export-surface corpus is stale; run deno task
  gen:mcp-export-corpus`. The other three requested generated freshness gates pass. #1751 changes
  only internal agentic tooling and run artifacts, not package export surfaces or this corpus.
- **Severity:** significant inherited gate drift, outside this leaf's declared manifest.
- **Action:** Do not regenerate or commit the corpus in #1751. Record the red gate truthfully for
  supervisor/coordinator disposition; no launcher/parser or agentic README edit is made.
- **Evidence:** `worklog.md` current-main integration table; `REAL_EXIT=1` direct capture.

## 2026-08-31 — correction: parked-head flake identified and repaired

- **What:** The preceding unidentified-flake entry is superseded. An independent 20-run focused
  audit reproduced two failures in `local-sender-lease-repair-adapter_test.ts` with `TypeError:
  Child process has already terminated`.
- **Expected:** Test cleanup is idempotent when the bounded child exits before `SIGTERM` or
  `SIGKILL`, while still awaiting its captured status on every path.
- **Actual:** Both kill guards admitted only `Deno.errors.NotFound` and rethrew the specific
  already-terminated `TypeError`.
- **Severity:** significant branch-owned test flake, measured at 2/20 focused repetitions.
- **Action:** The coordinator authorized a protected-ceiling exception limited to the teardown
  helper. Match the already-terminated error narrowly, rethrow everything else, and prove the fix
  with 50/50 focused repetitions plus persisted root-suite reports.
- **Evidence:** Coordinator audit and the protected-test diff recorded in `worklog.md`.

## 2026-08-31 — scope amendment for activation-profile provenance

- **What:** The original implementation did not persist the launch `profileHome`, so production
  repair always constructed the default session root and could not recover isolated-profile leases.
- **Expected:** The sender record binds the exact activation `CODEX_HOME`; legacy records load but
  fail closed; ownership decisions provide distinct machine-readable operator outcomes.
- **Actual:** Closing the defect requires narrow additions in the sender contract/adapters and the
  existing launch/CLI wiring that creates records and constructs the production repair adapter.
- **Severity:** significant product correction within #1751's headline recovery behavior.
- **Action:** Add provenance regressions and contract fields, persist the launch profile, resolve
  repair probes from the record, and replace the operator-facing `stale` kind with structured
  blocked/repair-required outcomes. Do not modify launcher argument parsing or the README surface
  owned by sibling #1750.
- **Evidence:** Coordinator scope amendment; focused contract RED then 52/52 GREEN in `worklog.md`.
