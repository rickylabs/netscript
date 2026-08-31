# Context Pack: milestone cluster state liveness

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-harness-cluster-state-liveness--1753` |
| Branch | `fix/harness-cluster-state-liveness` |
| Current phase | RED committed next |
| Archetype | N/A — internal harness tooling |
| Scope overlays | none |

## Current State

Baseline and issue contract are verified. The current validator proves only internal artifact
consistency. Both injected liveness fixtures now fail behaviorally: the focused structured wrapper
captured exit 1 with 13 passing tests and the stale-head/missing-leaf tests both observing `ok: true`.
No validator implementation has been edited.

## Completed

- Read harness, tooling, PR, run-loop, lane, plan-gate, and milestone-run authorities.
- Read issue #1753 in full and checked the live 0.0.7 open-PR surface.
- Confirmed exact requested branch/base and authorized collision-safe boundary.
- Recorded PLAN-EVAL: N/A with a concrete scoped-fix rationale.
- Proved both issue regressions RED against injected, network-free fixtures.

## In Progress

- Commit and publish Slice 1 RED before any validator implementation.

## Next Steps

1. Commit the failing reproduction before implementation.
2. Push explicitly and open the draft PR with issue/taxonomy/milestone metadata.
3. Implement GREEN, run captured gates, push/comment, and stop for supervisor IMPL-EVAL.

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

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | EXPECTED FAIL | focused wrapper exit 1; 13 pass / 2 intentional RED failures |
| Fitness | N/A | no package/plugin surface |
| Runtime | N/A | pure validator logic |
| Consumer | NOT_RUN | focused harness suite planned |

## Drift and Debt

- Drift: none.
- Debt: none.

## Commits

- See the draft PR commit list and per-slice comments after Slice 1.
