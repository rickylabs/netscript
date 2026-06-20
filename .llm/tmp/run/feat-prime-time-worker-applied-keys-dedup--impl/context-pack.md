# Context Pack: worker-applied-keys-dedup

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `feat-prime-time-worker-applied-keys-dedup--impl` |
| Branch | `feat/prime-time/worker-applied-keys-dedup` |
| Current phase | `implement` |
| Archetype | `ARCHETYPE-3 - Runtime / Behavior` |
| Scope overlays | `SCOPE-service` |

## Current State

Implementation run initialized from the PLAN-EVAL-passed slice brief. Source changes have not yet
started.

## Completed

- Read harness/doctrine/tooling/PR instructions and the approved slice plan artifacts.
- Confirmed branch `feat/prime-time/worker-applied-keys-dedup` tracks
  `origin/feat/prime-time/worker-applied-keys-dedup`.
- Created implementation run artifacts.

## In Progress

- Inspecting current worker, core, trigger, KV, and test surfaces before edits.

## Next Steps

1. Implement core contract and resolver.
2. Implement KV store and dispatcher gates.
3. Wire producer/composition, add tests, run gates, commit/push/comment by slice.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| Worker idempotency is required | `plan.md` | Production must not silently fall back to no-op/in-memory. |
| Store uses shared `getKv()` | `plan.md` | Same durable KV handle as worker runtime state. |
| Queue remains read-only | `research.md` | Consumer-side applied-key dedup is the defect site. |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| `.llm/tmp/run/feat-prime-time-worker-applied-keys-dedup--impl/*` | new | Harness implementation artifacts. |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | NOT_RUN | Source changes not yet implemented. |
| Fitness | NOT_RUN | Source changes not yet implemented. |
| Runtime | NOT_RUN | Source changes not yet implemented. |
| Consumer | NOT_RUN | Source changes not yet implemented. |

## Open Questions

- None currently.

## Drift and Debt

- Drift: none.
- Debt: no new debt accepted.

## Commits

