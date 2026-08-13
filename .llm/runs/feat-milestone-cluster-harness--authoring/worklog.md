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
- `evidence set` — immutable-head manifest that decides whether command receipts are sufficient.

### Ports

- `GateReceiptStore` — atomic durable CI adapter and lifecycle-memory worker adapter.
- `GateProcessRunner` — direct argv execution; raw exit is authoritative.
- `MilestoneStateValidator` — pure intake/inventory/DAG/cluster invariant validator.

### Constants

- Topic lanes: `docs`, `internals`, `fixes`, `features`.
- Receipt states: `CLAIMED`, `RUNNING`, `PASS`, `FAIL`, `TIMED_OUT`, `SPAWN_FAILED`,
  `INTERRUPTED`, `SKIPPED`, `NOT_RUN`.
- WIP: two implementations/lane, one evaluator/lane, one global expensive gate, one release writer.

### Contributor path

- Milestone coordinator instantiates the five cluster templates and validates Step 0 before launch.
- Workers call allowlisted gate IDs through the receipt broker; CI calls the same runner and uploads
  atomic JSON. New gate IDs require a catalog entry and negative test.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 1 | bootstrap + audits | document review | run dir |
| 2 | cluster profile and templates | profile contract tests | exact list in `plan.md` slice 1 |
| 3 | receipt envelope and wrapper honesty | focused Deno tests | exact list in `plan.md` slice 2 |
| 4 | CI receipt adoption | workflow contract tests | exact list in `plan.md` slice 3 |
| 5 | evaluator lifecycle hardening | workflow contract tests | exact list in `plan.md` slice 4 |
| 6 | integration and skill sync | root and doctrine gates | exact list in `plan.md` slice 5 |

### Deferred Scope

- Product-facing release mechanics remain owned by `netscript-release`.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-13 | 1 | active | Three independent read-only audits delegated. |

## Gate Results

| Gate | Result | Evidence |
| --- | --- | --- |
| PLAN-EVAL cycle 1 | FAIL_PLAN | Opus 5 high session `d23e5024-b47b-4e1c-b4a1-b853717d5708`; plan amended before source work |
| PLAN-EVAL cycle 2 | PASS_PLAN | same separate evaluator session against `2435b4edd`; no blockers |
| focused tests | NOT_RUN | implementation not started |
| root gates | NOT_RUN | implementation not started |
