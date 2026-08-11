# Context Pack — docs-rfc-runtime-versioned-automation--supervisor

Resume here. State as of 2026-08-11 (post PLAN-EVAL cycle 1 fix).

- **What this run is**: research + architecture RFC for runtime-versioned workers/tasks/triggers
  (operator capability on a running stack). No implementation. Draft PR #1446 vs main.
- **Identity/overrides**: Fable 5 medium supervisor (D-1); final PLAN-EVAL Codex Sol xhigh (D-2);
  owner directives D-3 (cockpit downstream of #890/#922 cut), D-4 (complete redesign in scope),
  D-5 (no compat/migration — clean break + cleanup inventory), D-6 (parent hypotheses).
- **Evidence**: `evidence/legacy-capability-map.md` (legacy trees were dead wiring; polyglot
  engine real, no control plane) and `evidence/current-state-matrix.md` (H1–H6 confirmed;
  P1 pointer race 20/20; P3 runtime-schemas writes 0; P4 RuntimeTask rejected by executor;
  P5 deno+shell execute). Both supervisor-reviewed (A1) with verbatim spot-checks.
- **Deliverable**: `docs/architecture/rfc/rfc-0001-runtime-versioned-automation.md` — two-plane
  architecture; families task@1/trigger@1 (no task schedule — scheduled trigger is the only
  operator cron); immutable revisions + transactional activation-set epochs + fleet admission;
  three-package ownership (automation-core contracts / automation-runtime behavior+adapters /
  thin connector plugin) — LOCKED; T1 honesty contract; TM1–TM9; cleanup inventory; slices
  A0–A8 with files+gates; E2E model; P-1..P-4 staged RFCs.
- **Eval state**: cycle 1 FAIL_PLAN → fix cycle (3 edits silently no-opped, drift D-7); cycle 2
  FAIL_PLAN (old text + new findings) → corrected fix set applied with per-edit verification and
  pushed. **Two-FAIL protocol stop reached: owner escalation pending** — owner authorizes cycle 3
  (resume thread `019fef2b-…03fc` in `/home/codex/repos/ns-rfc-plan-eval`) or reviews directly.
- **Hard rules**: draft PR only; no issue filing; no ready-for-review until owner ratifies;
  never write in ns-1443 worktree or netscript-start-ref.
