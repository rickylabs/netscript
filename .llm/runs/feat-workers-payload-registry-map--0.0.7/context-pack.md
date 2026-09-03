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

PR #1970 is resuming from authoritative remote head `43734544f`, whose hosted PostgreSQL and SQLite
runtime lanes passed. The coordinator-prepared handler-freeze repair is staged and independently
proved: the RED health-check import fails because `Object.freeze(handler)` rejects first-party
`Object.assign(..., { id })`; GREEN keeps only `payloadSchema` immutable while preserving the
callable metadata-extension seam. The generated add-job stub still exports its typed handler as
default.

## Completed

- Re-read issue #1455 and the EIS-Chat canary audit.
- Re-baselined published surfaces with `deno doc` and focused source seams.
- Recorded doctrine ownership, PLAN-EVAL disposition, versioning drift, design, risks, and gates.

## In Progress

- Commit and push the bounded handler-freeze repair, then reconcile `origin/main` at `e14322c511`.

## Next Steps

1. Commit/push the handler-freeze RED→GREEN slice with its run-artifact receipts.
2. Merge current main without wholesale shared-file replacement and regenerate canonical carriers.
3. Run exact static/quality/CI gates, obtain one separate-session IMPL-EVAL, and hand off without
   merging the PR.

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
| Runtime | hosted pass at `43734544f`; no new local lease | PostgreSQL and SQLite jobs passed; static/hosted work only for this continuation |
| Consumer | passed | prior compile-time and generated-registry receipts in worklog |

## Open Questions

- None.

## Drift and Debt

- Drift: enqueue validation strengthened by the new brief; v1 version decision recorded.
- Debt: no new debt planned; existing workers-core/plugin Refactor verdicts are not expanded.

## Commits

- Per-slice SHAs will be added to `worklog.md` and the PR.
