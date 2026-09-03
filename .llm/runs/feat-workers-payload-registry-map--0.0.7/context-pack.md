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

PR #1970 is in a bounded hosted-runtime repair at head `14bdf2f98`. The schema-backed contract,
literal registry, downstream migrations, documentation carriers, and generated-format repair are
implemented. Both current hosted runtime tiers reach the Flow-B fixture and then time out starting
Aspire because its legacy handler rewrite does not recognize #1455's schema-first generated job.

## Completed

- Re-read issue #1455 and the EIS-Chat canary audit.
- Re-baselined published surfaces with `deno doc` and focused source seams.
- Recorded doctrine ownership, PLAN-EVAL disposition, versioning drift, design, risks, and gates.

## In Progress

- Validate and push the schema-first Flow-B fixture repair, then hand back an immutable merge packet.

## Next Steps

1. Prove the generated callback is async after fixture rewriting.
2. Run exact PostgreSQL and SQLite runtime suites with cleanup.
3. Record Tier-A/CI receipts, push the immutable head, and update PR #1970.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| One Standard Schema supplies type and runtime validation | parent plan + brief S1 | No type-only fallback. |
| Literal objects precede Maps | parent plan §4 + brief S2 | Preserve existing runtime exports. |
| v1 wire contract stays unchanged | `drift.md` | Typed opt-in is compile-only. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | passed at `14bdf2f98` | hosted core/quality/static-scaffold checks green |
| Fitness | passed at `14bdf2f98` | hosted code-quality green; prior local receipts in worklog |
| Runtime | repair in progress | both hosted suites share the schema-first fixture mismatch |
| Consumer | passed | prior compile-time and generated-registry receipts in worklog |

## Open Questions

- None.

## Drift and Debt

- Drift: enqueue validation strengthened by the new brief; v1 version decision recorded.
- Debt: no new debt planned; existing workers-core/plugin Refactor verdicts are not expanded.

## Commits

- Per-slice SHAs will be added to `worklog.md` and the PR.
