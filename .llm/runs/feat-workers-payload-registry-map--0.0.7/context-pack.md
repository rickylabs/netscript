# Context Pack: workers payload registry map remainder

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-workers-payload-registry-map--0.0.7` |
| Branch | `feat/workers-payload-registry-map` |
| Current phase | `implement` |
| Archetype | 3 — Runtime/Behavior; 5 — Plugin; bounded Archetype-6 fixture |
| Scope overlays | service contract and generated application boundary |

## Current State

PR #1970 has the bounded schema-first Flow-B fixture repair at `c182fead3` and current-main
integration at `6e654b1bd`. Integrated workspace check, emitted-sample check, quality, architecture,
JSDoc-example, workers resource, and generated-carrier gates all pass. A final receipt commit will
be pushed and left immutable for the hosted dual-provider runtime verdict.

## Completed

- Re-read issue #1455 and the EIS-Chat canary audit.
- Re-baselined published surfaces with `deno doc` and focused source seams.
- Recorded doctrine ownership, PLAN-EVAL disposition, versioning drift, design, risks, and gates.

## In Progress

- Push the receipt-only immutable head and collect current hosted runtime receipts.

## Next Steps

1. Push the receipt head and collect exact PostgreSQL and SQLite hosted runtime verdicts.
2. Run the review-thread gate and update PR #1970 with the immutable merge packet.
3. Hand off without merging the PR.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| One Standard Schema supplies type and runtime validation | parent plan + brief S1 | No type-only fallback. |
| Literal objects precede Maps | parent plan §4 + brief S2 | Preserve existing runtime exports. |
| v1 wire contract stays unchanged | `drift.md` | Typed opt-in is compile-only. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | passed locally | root check and emitted samples pass on integrated tree |
| Fitness | passed locally | quality, architecture, docs examples, carriers pass |
| Runtime | hosted rerun pending | local host proxy failure is separated in worklog |
| Consumer | passed | prior compile-time and generated-registry receipts in worklog |

## Open Questions

- None.

## Drift and Debt

- Drift: enqueue validation strengthened by the new brief; v1 version decision recorded.
- Debt: no new debt planned; existing workers-core/plugin Refactor verdicts are not expanded.

## Commits

- Per-slice SHAs will be added to `worklog.md` and the PR.
