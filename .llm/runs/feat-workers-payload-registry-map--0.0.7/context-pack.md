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
All exact-head static/quality checks pass. Both hosted runtime reports pass the #1455 worker path but
stop at current-main's stale retired-showcase browser probe, already owned by PR #1958. The one
native Fable evaluator launch was quota-blocked before producing a verdict.

## Completed

- Re-read issue #1455 and the EIS-Chat canary audit.
- Re-baselined published surfaces with `deno doc` and focused source seams.
- Recorded doctrine ownership, PLAN-EVAL disposition, versioning drift, design, risks, and gates.

## In Progress

- Persist and push the exact-head CI/evaluator receipts, then hand off the immutable blocked packet
  without merging or duplicating PR #1958's CLI correction.

## Next Steps

1. Land PR #1958's owning browser/island acceptance correction into main, then reconcile it here and
   rerun hosted runtime without taking a local lease.
2. Run one fresh native Fable/medium IMPL-EVAL when Anthropic allowance is available; do not dispatch
   a model fallback or duplicate evaluator.
3. Hand off a green/evaluated merge packet without merging the PR.

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
| Runtime | #1455 path passes; overall blocked externally | both DB reports stop only at stale current-main browser probe owned by PR #1958 |
| Consumer | passed | prior compile-time and generated-registry receipts in worklog |

## Open Questions

- None; blockers have explicit owners and reproduction evidence.

## Drift and Debt

- Drift: enqueue validation strengthened by the new brief; v1 version decision recorded.
- Debt: no new debt planned; existing workers-core/plugin Refactor verdicts are not expanded.

## Commits

- Per-slice SHAs will be added to `worklog.md` and the PR.
