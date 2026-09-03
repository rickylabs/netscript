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

PR #1970 is in implementation repair after a supervisor audit of head `feb55c046`. The
schema-backed contract and literal registry are implemented; the repair migrates all named
first-party consumers, fixes the standalone validation example, and aligns workers doctor with the
literal registry format.

## Completed

- Re-read issue #1455 and the EIS-Chat canary audit.
- Re-baselined published surfaces with `deno doc` and focused source seams.
- Recorded doctrine ownership, PLAN-EVAL disposition, versioning drift, design, risks, and gates.

## In Progress

- Commit and push the repair plus RED→GREEN gate receipts for evaluator handoff.

## Next Steps

1. Commit and push the repair.
2. Update PR #1970 with the repair receipt.
3. Hand off to the separate evaluator session.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| One Standard Schema supplies type and runtime validation | parent plan + brief S1 | No type-only fallback. |
| Literal objects precede Maps | parent plan §4 + brief S2 | Preserve existing runtime exports. |
| v1 wire contract stays unchanged | `drift.md` | Typed opt-in is compile-only. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | pending | RED first |
| Fitness | pending | doctrine/archetypes selected |
| Runtime | pending | invalid payload must currently reach handler |
| Consumer | pending | widened generated/trigger payload must leave `@ts-expect-error` unused |

## Open Questions

- None.

## Drift and Debt

- Drift: enqueue validation strengthened by the new brief; v1 version decision recorded.
- Debt: no new debt planned; existing workers-core/plugin Refactor verdicts are not expanded.

## Commits

- Per-slice SHAs will be added to `worklog.md` and the PR.
