# Context Pack: saga publish delivery (#1190)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-saga-publish-delivery--1190` |
| Branch | `fix/saga-publish-delivery` |
| Current phase | `implement` |
| Archetype | `3 - Runtime / Behavior`; `5 - Thin Plugin` |
| Scope overlays | `service` |

## Current State

Research and design are locked under the milestone PLAN-EVAL waiver. Current code has API-local
engine execution, an idle runner, and a disconnected `saga_instances` read model. Implementation
will use the existing traced, provider-neutral queue between API and runner, then project after
successful engine persistence.

## Completed

- Read issue #1190 before scoping and inspected failed 0.0.4 artifact.
- Re-baselined current main and sibling PR #1193/run evidence.
- Read required harness/PR/doctrine/CLI/Aspire skills plus tooling/RTK/JSR guidance.
- Locked plan and recorded milestone PLAN-EVAL composition waiver.
- Identified and reported a foreign #1193 `aspire/db-operation` AppHost; left untouched.

## In Progress

- Slice 1: HTTP-boundary RED regression and first implementation commit/draft PR.

## Next Steps

1. Add and demonstrate the HTTP RED fixture against the old runtime-bound handler.
2. Implement bounded queue publisher and runner delivery ownership.
3. Add projection and public lifecycle/scheduler contract coverage.
4. Run scoped gates, reconcile #1193, then perform both serialized scaffold protocols.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| Queue `sagas` is the delivery seam | `plan.md` D1 | Redis/Garnet and Deno KV, traced by default. |
| HTTP 2xx means durable enqueue | `plan.md` D2 | Runner delivery proven independently. |
| Engine store is canonical | `plan.md` D5 | `saga_instances` is a projection. |
| PLAN-EVAL is composed | owner directive; `plan.md` D6 | No local evaluator spawn/wait. |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| `.llm/runs/fix-saga-publish-delivery--1190/*` | new | Activated harness run and locked design. |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | plan PASS; implementation NOT_RUN | `worklog.md` |
| Fitness | PENDING_SCRIPT | `plan.md` |
| Runtime | RED carried; GREEN NOT_RUN | issue #1190 / failed scaffold |
| Consumer | NOT_RUN | foreign AppHost currently active |

## Open Questions

- Exact #1193 integration SHA and when its AppHost is released.

## Drift and Debt

- Drift: #1193 did not capture the publish-hang RED; foreign AppHost blocks runtime protocol now.
- Debt: no new accepted debt; Prisma projection parity may require an entry only if exposed by tests.

## Commits

- See the draft PR's commit list + per-slice PR comments (V3 retired `commits.md`).

