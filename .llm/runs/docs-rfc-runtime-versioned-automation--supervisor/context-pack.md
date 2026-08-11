# Context Pack — docs-rfc-runtime-versioned-automation--supervisor

Resume here. State as of 2026-08-11: **PLAN-EVAL PASS (cycle 9)**; D-8 + D-9 applied; RFC produced;
awaiting owner ratification (PR #1446 draft).

- **What this run is**: research + architecture RFC for runtime-versioned workers/tasks/triggers
  (operator capability on a running stack). No implementation. Draft PR #1446 vs main.
- **Identity/overrides**: Fable 5 medium supervisor (D-1); final PLAN-EVAL Codex Sol xhigh (D-2);
  owner directives D-3 (cockpit downstream of #890/#922 cut), D-4 (complete redesign in scope), D-5
  (no compat/migration — clean break + cleanup inventory), D-6 (parent hypotheses).
- **Evidence**: `evidence/legacy-capability-map.md` (legacy trees were dead wiring; polyglot engine
  real, no control plane) and `evidence/current-state-matrix.md` (H1–H6 confirmed; P1 pointer race
  20/20; P3 runtime-schemas writes 0; P4 RuntimeTask rejected by executor; P5 deno+shell execute).
  Both supervisor-reviewed (A1) with verbatim spot-checks.
- **Deliverable**: `rfcs/0000-runtime-versioned-automation.md` — two-plane architecture; families
  task@1/trigger@1 (no task schedule — scheduled trigger is the only operator cron); immutable
  revisions + transactional activation-set epochs + fleet admission; three-package ownership
  (automation-core contracts / automation-runtime behavior+adapters / thin connector plugin) —
  LOCKED; T1 honesty contract; TM1–TM9; cleanup inventory; slices A0–A8 with files+gates; E2E model
  incl. outage test 8; P-1..P-6 staged items (P-6 = DevTools RFC per D-9; §8.2 = two decided
  operator surfaces).
- **Eval state**: seven Sol·xhigh cycles (same dedicated evaluator thread `019fef2b-…03fc`, worktree
  ns-rfc-plan-eval). C1 9 findings → C3 6 → C4 5 → C5 2 → C6 "no unresolved runtime architecture
  decision remains" (bookkeeping only) → C7 one Design-vocabulary line + progress narratives (this
  fix). Every finding of every cycle is fixed in-tree; the final pass closes on the reconciled
  record; on PASS the RFC is produced and the owner ratifies.

- **Hard rules**: draft PR only; no issue filing; no ready-for-review until owner ratifies; never
  write in ns-1443 worktree or netscript-start-ref.
