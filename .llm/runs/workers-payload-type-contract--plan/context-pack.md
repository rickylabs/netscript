# Context Pack: workers payload type contract

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `workers-payload-type-contract--plan` |
| Branch | `feat/workers-payload-type-contract` |
| Current phase | `implement` |
| Archetype | workers-core/triggers-core: 3; workers plugin: 5 |
| Scope overlays | none |

## Current State

The public contract is committed independently at `f655c3405`. Draft PR #1938 carries RED
`8e7cf697c` and bounded GREEN `4903a6afc`. The selected job definition now binds trigger-core
enqueue payloads at compile time without changing runtime expressions.

## Completed

- Read issue #1455 and comments in full.
- Inspected the published baseline with `deno doc` across all affected entrypoints.
- Identified package archetypes, anti-pattern checks, existing debt, and required gates.
- Locked exact public shapes, compatibility decisions, generator output, runtime-validation
  boundary, RED proof, and commit slices in `plan.md`.
- Opened the draft PR from the plan-only commit.

## In Progress

- Evidence commit, PR body update, and ready-for-review transition.

## Next Steps

1. Commit and push the GREEN/gate receipts.
2. Update PR #1938 with RED/GREEN evidence and the honest remaining scope.
3. Mark the PR ready so the repository's E2E/CI evaluation runs.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Standard Schema is the single payload definition | `plan.md` §1 and §5 | Inference plus handler-boundary validation |
| Definition selects enqueue payload | `plan.md` §3 | `NoInfer` makes options a checking position |
| Literal registry object precedes runtime Maps | `plan.md` §4 | Prevents application-boundary widening |
| Broad service contract remains default | `plan.md` §1 and §6 | Typed client opts into generated payload map |
| Schema-less declarations are source-breaking | `plan.md` §2 and §6 | Required to prevent producer/consumer drift |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/workers-payload-type-contract--plan/plan.md` | new, committed | Contract authority at `f655c3405` |
| `.llm/runs/workers-payload-type-contract--plan/*.md` | new, pending commit | Harness identity, context, research, and progress only |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | pending | Runs after RED/GREEN source slices |
| Fitness | pending | Doctrine/archetypes selected; quality and architecture gates queued |
| Runtime | pending | Handler-boundary validation tests planned |
| Consumer | pending | RED compile proof is the first implementation slice after PLAN-EVAL |

## Open Questions

- None; the owner accepted plan commit `f655c3405` as authoritative.

## Drift and Debt

- Drift: none recorded.
- Debt: existing workers plugin private-type-ref allowance only; no new debt planned.

## Commits

- See draft PR #1938 and the commit receipts in `worklog.md`.
