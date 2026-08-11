# Context Pack — docs-rfc-runtime-versioned-automation--supervisor

Resume here. State as of 2026-08-11 (post PLAN-EVAL cycle 1 fix).

- **What this run is**: research + architecture RFC for runtime-versioned workers/tasks/triggers
  (operator capability on a running stack). No implementation. Draft PR #1446 vs main.
- **Identity/overrides**: Fable 5 medium supervisor (D-1); final PLAN-EVAL Codex Sol xhigh (D-2);
  owner directives D-3 (cockpit downstream of #890/#922 cut), D-4 (complete redesign in scope), D-5
  (no compat/migration — clean break + cleanup inventory), D-6 (parent hypotheses).
- **Evidence**: `evidence/legacy-capability-map.md` (legacy trees were dead wiring; polyglot engine
  real, no control plane) and `evidence/current-state-matrix.md` (H1–H6 confirmed; P1 pointer race
  20/20; P3 runtime-schemas writes 0; P4 RuntimeTask rejected by executor; P5 deno+shell execute).
  Both supervisor-reviewed (A1) with verbatim spot-checks.
- **Deliverable**: `docs/architecture/rfc/rfc-0001-runtime-versioned-automation.md` — two-plane
  architecture; families task@1/trigger@1 (no task schedule — scheduled trigger is the only operator
  cron); immutable revisions + transactional activation-set epochs + fleet admission; three-package
  ownership (automation-core contracts / automation-runtime behavior+adapters / thin connector
  plugin) — LOCKED; T1 honesty contract; TM1–TM9; cleanup inventory; slices A0–A8 with files+gates;
  E2E model; P-1..P-4 staged RFCs.
- **Eval state**: cycles 1–2 FAIL_PLAN (cycle-2 partly caused by silently no-opped edits, D-7) →
  protocol escalation; **owner authorized cycle 3** (with the D-8 study added first); cycle 3
  FAIL_PLAN with 6 narrowed findings (5 prior findings PASS) → all six fixed: §5.3-8 outage
  availability contract + pinned-lookup classes + revision cache; §5.5 bounded secret guarantee;
  cleanup table completed (triggers enabled-state full surface, Windows env files,
  NETSCRIPT_TASKS_DIR readers); gate letters + release classes on every roadmap row; study got
  isolation/control-plane/cockpit matrix rows + narrowed negatives + citation rule; artifacts/PR
  reconciled. Owner then ordered **cycle 4**: FAIL_PLAN, 5 further-narrowed findings (outage
  contract made singular = indefinite last-good + idle-and-loud cold start + §13 test 8; CLI
  DI/deploy-flag cleanup rows; C/P gate letters completed; study evidence contract repaired, 15-row
  count + Windmill isolation citation; artifacts+fmt reconciled) → all fixed; cycle 5 is the
  deciding pass, after which the RFC is produced for the owner on PASS.
- **S6 (D-8)**: competitive architecture study landed
  (`evidence/competitive-architecture-study.md`), integrated as RFC §14.1 + §13.1 benchmark gates +
  P-5; overbroad wording corrected. Cycle 3 authorized by owner.
- **Hard rules**: draft PR only; no issue filing; no ready-for-review until owner ratifies; never
  write in ns-1443 worktree or netscript-start-ref.
