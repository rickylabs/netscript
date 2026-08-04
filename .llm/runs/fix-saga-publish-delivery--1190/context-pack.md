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

Research and design are locked under the milestone PLAN-EVAL waiver. The implementation now uses
the existing traced, provider-neutral queue between API and runner, supplies delayed cascades from
the same queue, and projects successful engine persistence into Prisma `saga_instances` or a named
KV fallback. Focused package/plugin/queue suites are green; real scaffold protocols remain.

## Completed

- Read issue #1190 before scoping and inspected failed 0.0.4 artifact.
- Re-baselined current main and sibling PR #1193/run evidence.
- Read required harness/PR/doctrine/CLI/Aspire skills plus tooling/RTK/JSR guidance.
- Locked plan and recorded milestone PLAN-EVAL composition waiver.
- Identified and reported a foreign #1193 `aspire/db-operation` AppHost; left untouched.

## In Progress

- Slice 4: rebase onto current main, reconcile #1193, and run static/quality/JSR gates.

## Next Steps

1. Commit and push the green delivery/projection slice.
2. Rebase onto current main and reconcile #1193 when its integration SHA is available.
3. Run quality/architecture/JSR gates.
4. Perform both serialized scaffold protocols with artifact/restart/OTEL evidence.

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
| `plugins/sagas/src/runtime/saga-{delivery,instance-projection}.ts` | new | Queue delivery, delayed scheduler, and read-model projection. |
| `plugins/sagas/services/src/**` | changed | Bounded durable enqueue and KV projection reads. |
| `packages/plugin-sagas-core/src/runtime/**` | changed | Structural scheduler port for queue-backed scheduling. |
| `packages/queue/adapters/deno-kv.adapter.ts` | changed | Await durable enqueue. |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | scoped check/lint PASS; fmt corrected | `worklog.md` |
| Fitness | focused F13 PASS; F19 pending | package/plugin/queue suites |
| Runtime | HTTP RED/GREEN PASS; scaffold GREEN NOT_RUN | `publish-http-boundary_test.ts` |
| Consumer | NOT_RUN | foreign AppHost currently active |

## Open Questions

- Exact #1193 integration SHA and when its AppHost is released.
- Whether the fresh generated client has Prisma saga delegates (both Prisma and KV projection paths are implemented).

## Drift and Debt

- Drift: #1193 did not capture the publish-hang RED; foreign AppHost blocks runtime protocol now.
- Debt: no new accepted debt; Prisma projection parity may require an entry only if exposed by tests.

## Commits

- See the draft PR's commit list + per-slice PR comments (V3 retired `commits.md`).
