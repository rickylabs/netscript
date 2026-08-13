# Worklog — milestone cluster harness

## Design

- 2026-08-13 — Three read-only audits split the change into independent cluster-contract,
  receipt-contract, and evaluator-lifecycle slices. No source implementation began before this
  design checkpoint.
- 2026-08-13 — Chose `milestone-cluster-state.json` as the single mutable control plane;
  `milestone-status.md` is generated, never independently authored.
- 2026-08-13 — Chose one generic receipt envelope around existing tools, not replacement check,
  lint, fmt, test, or E2E parsers.
- 2026-08-13 — Owner expanded Step 0: the coordinator must first sweep unmilestoned, Backlog, and
  later milestones, move release-critical and coherent high-value work into the target milestone,
  then freeze and validate the complete inventory and dependency DAG.

### Public Surface

- Harness profile and templates under `.llm/harness/`.
- Internal skills under `.agents/skills/`.
- Repo-native gate receipt CLI under `.llm/tools/`.

### Domain Vocabulary

- `cluster` — coordinator plus exclusive topic orchestrators and read-only watchers.
- `gate receipt` — immutable-head command verdict with timestamps, exit status, and artifact paths.
- `release lease` — one recorded release captain, main SHA, and phase; no heavyweight lock manager.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 1 | bootstrap + audits | document review | run dir |
| 2 | cluster profile and templates | profile contract tests | harness + skills |
| 3 | gate receipts and CI adoption | focused Deno tests | tools + workflows |
| 4 | evaluator/label hardening | workflow contract tests | Actions + agentic tests |

### Deferred Scope

- Product-facing release mechanics remain owned by `netscript-release`.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-13 | 1 | active | Three independent read-only audits delegated. |

## Gate Results

| Gate | Result | Evidence |
| --- | --- | --- |
| PLAN-EVAL | PENDING | separate session after design integration |
| focused tests | NOT_RUN | implementation not started |
| root gates | NOT_RUN | implementation not started |
