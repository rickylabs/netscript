# Context Pack: milestone cluster state liveness

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-harness-cluster-state-liveness--1753` |
| Branch | `fix/harness-cluster-state-liveness` |
| Current phase | implementation complete; supervisor review pending |
| Archetype | N/A — internal harness tooling |
| Scope overlays | none |

## Current State

The required RED was committed first as `5f41e90dc` and published on draft PR #1823. GREEN now
reconciles through an injected list/head source, returns compact structured findings, explicitly
excludes coordinator artifacts and merged leaves, fails closed without a source, and accepts a
read-only JSON export through `--github-prs`. All final declared gates are green.

## Completed

- Read harness, tooling, PR, run-loop, lane, plan-gate, and milestone-run authorities.
- Read issue #1753 in full and checked the live 0.0.7 open-PR surface.
- Confirmed exact requested branch/base and authorized collision-safe boundary.
- Recorded PLAN-EVAL: N/A with a concrete scoped-fix rationale.
- Proved both issue regressions RED against injected, network-free fixtures.
- Opened draft PR #1823 with `Closes #1753`, taxonomy labels, and milestone 0.0.7.
- Implemented and tested stale head, missing leaf, coordinator exclusion, merged leaf, unavailable
  source, and read-only export behavior.
- Captured focused 19/19, full harness 21/21, scoped check/lint/fmt, and diff-check exits at 0.

## In Progress

- Commit and explicitly push the GREEN slice, update PR evidence, then stop for supervisor review.

## Next Steps

1. Commit and explicitly push the GREEN implementation/evidence slice.
2. Update draft PR #1823 with exact gate evidence.
3. Stop without dispatching IMPL-EVAL; the supervisor owns that separate session.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Inject list/head source | issue #1753 / brief | Tests never call GitHub. |
| Read-only JSON CLI adapter | hard boundary | Avoids `deno.json` and agentic-tree edits. |
| Structured findings fail `ok` | issue contract | Mutable drift remains machine-readable. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| own run directory | new | Harness bootstrap and launch evidence. |
| `.llm/tools/harness/validate-milestone-cluster.ts` | changed | reconciliation port, findings, and export CLI adapter |
| `.llm/tools/harness/validate-milestone-cluster_test.ts` | changed | injected RED/GREEN and edge-case coverage |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS | focused 19/19; harness 21/21; check/lint/fmt exit 0 |
| Fitness | N/A | no package/plugin surface |
| Runtime | N/A | pure validator logic |
| Consumer | PASS | read-only export supplies listing and head reads; no network in tests |

## Drift and Debt

- Drift: none.
- Debt: none.

## Commits

- `5f41e90dc` — required behavioral RED; see draft PR #1823 and its phase comment.
- GREEN commit pending at the time of this context update.
