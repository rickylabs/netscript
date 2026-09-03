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

PR #1970 now carries the pushed bounded handler-freeze repair at `d3df14bae`: the RED health-check
import failed because `Object.freeze(handler)` rejected first-party `Object.assign(..., { id })`;
GREEN keeps only `payloadSchema` immutable while preserving the callable metadata-extension seam.
Current main `e14322c511` is integrated without rebasing, its four generated-carrier conflicts are
canonically regenerated, and the generated add-job stub still exports its typed handler as default.

## Completed

- Re-read issue #1455 and the EIS-Chat canary audit.
- Re-baselined published surfaces with `deno doc` and focused source seams.
- Recorded doctrine ownership, PLAN-EVAL disposition, versioning drift, design, risks, and gates.

## In Progress

- Commit/push the current-main reconciliation, obtain exact-head hosted CI and one separate-session
  implementation evaluation, then hand off the immutable merge packet without merging.

## Next Steps

1. Commit and explicitly push the current-main reconciliation plus fresh static/quality receipts.
2. Confirm exact-head hosted CI without taking a local runtime lease.
3. Obtain exactly one separate-session IMPL-EVAL through the persisted route and hand off without
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
| Static | passed locally | focused check/test/lint/fmt, root check, and emitted samples pass |
| Fitness | passed locally | quality, architecture, docs examples, publish dry-run, and carriers pass |
| Runtime | hosted pass at `43734544f`; no new local lease | PostgreSQL and SQLite jobs passed; static/hosted work only for this continuation |
| Consumer | passed | prior compile-time and generated-registry receipts in worklog |

## Open Questions

- None.

## Drift and Debt

- Drift: enqueue validation strengthened by the new brief; v1 version decision recorded.
- Debt: no new debt planned; existing workers-core/plugin Refactor verdicts are not expanded.

## Commits

- Per-slice SHAs will be added to `worklog.md` and the PR.
