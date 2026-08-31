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
| 2026-08-31 | S1 publish | commit/PR | RED committed as `5f41e90dc`, explicitly pushed, and opened as draft PR #1823 with `Closes #1753`, taxonomy, and milestone 0.0.7. |
| 2026-08-31 | S2 GREEN | implementation | Added the injected list/head port, structured findings, explicit artifact exclusion, merged/outage behavior, and read-only export adapter. |
| 2026-08-31 | S2 gates | final matrix | Focused 19/19 and harness 21/21; scoped check/lint/fmt and diff hygiene all exit 0. |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| S1 behavioral RED | structured test wrapper on `validate-milestone-cluster_test.ts` | EXPECTED FAIL (exit 1) | 13 passed, 2 failed; both stale-head and missing-leaf fixtures observed `ok: true`. |
| S2 focused GREEN | structured test wrapper on `validate-milestone-cluster_test.ts` | PASS (exit 0) | 19 passed, including all five issue cases and export port coverage. |
| Milestone harness suite | `deno task harness:milestone:test` | PASS (exit 0) | 21 passed, 0 failed. |
| Scoped type check | structured check wrapper, two declared files | PASS (exit 0) | 2 selected, 0 failed batches, 0 diagnostics. |
| Scoped lint attempt | structured lint wrapper, root config | NOT A VERDICT (exit 2) | Root config excluded both `.llm` files; wrapper correctly refused all-excluded coverage. |
| Scoped lint verdict | structured lint wrapper with `docs/site/deno.json` | PASS (exit 0) | 2 selected and processed, 0 dropped, 0 diagnostics. |
| Scoped format | structured format wrapper, two declared files | PASS (exit 0) | 2 processed, 0 findings. Initial check found one test-only format change; exact-file `deno fmt` applied it before final rerun. |
| Diff hygiene | `git diff --check` | PASS (exit 0) | Empty output. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| GitHub network | N/A | injected fixtures and read-only export adapter | Tests make no live GitHub call. |
| CLI/Aspire/scaffold E2E | N/A | no affected surface | Internal validator-only change. |

## Post-slice reconcile

- S1: issue #1753 and draft PR #1823 carry `type:fix`, `area:tooling`, `priority:p1`,
  `orchestrator:internals`, exactly one `status:impl`, and milestone 0.0.7. The PR body contains
  `Closes #1753` and `Refs #574`; the RED phase comment records the real exit and commit.
- S2: no scope, label, milestone, lockfile, or parallel-leaf collision adjustment was required.
  Supervisor-dispatched separate IMPL-EVAL remains the only unfinished review gate.

## Handoff Notes

- Inspect `reconcileMilestonePrs` and the five liveness cases first. IMPL-EVAL is mandatory,
  separate, and supervisor-dispatched after this implementation handoff.
