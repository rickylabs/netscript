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

The current-surface investigation is complete and the public contract is committed independently at
`f655c3405`. Draft PR #1938 is open. No TypeScript or test file has changed. The owner explicitly
accepted the plan and authorized implementation without PLAN-EVAL.

## Completed

- Read issue #1455 and comments in full.
- Inspected the published baseline with `deno doc` across all affected entrypoints.
- Identified package archetypes, anti-pattern checks, existing debt, and required gates.
- Locked exact public shapes, compatibility decisions, generator output, runtime-validation
  boundary, RED proof, and commit slices in `plan.md`.
- Opened the draft PR from the plan-only commit.

## In Progress

- Defect-specific consumer-site RED proof for trigger-core `enqueueJob`.

## Next Steps

1. Commit the consumer-site RED fixture and record its failure SHA/evidence.
2. Implement core type/schema/contract binding until that fixture turns GREEN.
3. Update both generator paths and schema-backed first-party fixtures without changing #1451
   operational semantics.
4. Run scoped, workspace, publish, architecture, documentation, and quality gates.
5. Obtain fresh IMPL-EVAL and only then decide whether every acceptance box supports issue closure.

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
