# Worklog: milestone cluster state liveness

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-harness-cluster-state-liveness--1753` |
| Branch | `fix/harness-cluster-state-liveness` |
| Archetype | N/A — internal harness tooling |
| Scope overlays | none |

## Design

### Public Surface

- `validateMilestoneCluster` — validates internal artifacts and reconciles them with injected live PR state.
- `parseValidateCliArgs` — accepts the run directory and read-only PR export path.

### Domain Vocabulary

- `MilestonePrSource` — port that lists open milestone PRs and reads one PR's current head/state.
- `LiveMilestonePr` — PR number, issue allocation, lane, base, head, state, and explicit role.
- `ReconciliationFinding` — compact stale-head, missing-leaf, or unavailable-source evidence.

### Ports

- `MilestonePrSource.listOpenMilestonePrs` — supplies the authoritative open milestone set.
- `MilestonePrSource.readPrHead` — supplies the authoritative head/state for an allocated PR.

### Constants

- PR roles: `leaf`, `coordinator-artifact`.
- PR states: `open`, `merged`, `closed`.
- finding kinds: `stale-head`, `missing-leaf`, `source-unavailable`.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | RED proves stale allocated heads and entirely absent live leaves are currently silent | captured focused test, expected non-zero | test + run artifacts |
| 2 | GREEN reconciles through the injected port and covers exclusion/merged/outage cases | focused/full harness tests + scoped wrappers | validator + test + run artifacts |

### Deferred Scope

- GitHub API client and export producer — outside this collision-safe leaf; the validator consumes a
  read-only source/export.
- Status renderer changes — findings belong to validator JSON, not the generated activity view.

### Contributor Path

Add a reconciliation rule beside the source-normalization helper in
`validate-milestone-cluster.ts`, then add an injected fixture case in
`validate-milestone-cluster_test.ts`.

## PLAN-EVAL

N/A — this is a mechanical two-file correction with the exact failure modes, seam, boundaries,
negative cases, and gates fixed by issue #1753 and the supervisor brief.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-31 | bootstrap | research/plan | Baseline, issue, validator, tests, and live milestone surface inspected; intended files locked. |
| 2026-08-31 | S1 RED | focused test | Captured exit 1: 13 passed, both new reconciliation tests failed because actual `ok` remained `true`. |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| S1 behavioral RED | structured test wrapper on `validate-milestone-cluster_test.ts` | EXPECTED FAIL (exit 1) | 13 passed, 2 failed; both stale-head and missing-leaf fixtures observed `ok: true`. |

## Handoff Notes

- IMPL-EVAL is mandatory, separate, and supervisor-dispatched after the implementation handoff.
