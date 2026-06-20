# Context Pack: service-graceful-shutdown

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `feat-prime-time-service-graceful-shutdown--impl` |
| Branch | `feat/prime-time/service-graceful-shutdown` |
| Current phase | `implement` |
| Archetype | `ARCHETYPE-4 - Public DSL / Builder` |
| Scope overlays | `SCOPE-service` |

## Current State

Contract, coordinator, and listener slices are implemented: `ServeOptions` now carries `drainTimeoutMs`/`handleSignals`, shutdown contracts are exported from the root service surface, the private coordinator handles LIFO hooks/failure collection/idempotency/timeout reporting, and the listener routes manual stop, external abort, and OS signals through graceful `server.shutdown()`.

## Completed

- Read implementation brief, approved research, approved plan, plan metadata, harness workflow docs, doctrine profile, service overlay, gate matrix, and relevant package surface.
- Confirmed branch `feat/prime-time/service-graceful-shutdown` tracks `origin/feat/prime-time/service-graceful-shutdown`.
- Added public shutdown contracts and serve option fields; scoped check/lint/fmt passed.
- Added `ServiceShutdownCoordinator` and focused unit tests; scoped check/lint/fmt plus coordinator tests passed.
- Wired `service-listener.ts` to the coordinator and added runtime tests; scoped check/lint/fmt plus runtime tests passed.

## In Progress

- Builder `onShutdown` wiring slice.

## Next Steps

1. Add `ServiceBuilder.onShutdown()` to the public builder interface and implementation.
2. Thread registered hooks into `startServiceListener()` and extend service builder tests.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| `stop()` remains `Promise<void>` | `plan-meta.json` | Strengthen behavior without breaking callers. |
| `ServiceShutdownCoordinator` is private | `plan.md` | No plugin dependency or public subpath. |
| Signal handling default-on, `handleSignals: false` opt-out | `plan.md` | Enables service front door process shutdown and embedded hosts. |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| `.llm/tmp/run/feat-prime-time-service-graceful-shutdown--impl/worklog.md` | new | Implementation evidence. |
| `.llm/tmp/run/feat-prime-time-service-graceful-shutdown--impl/commits.md` | new | Commit log. |
| `.llm/tmp/run/feat-prime-time-service-graceful-shutdown--impl/context-pack.md` | new | Resumable context. |
| `.llm/tmp/run/feat-prime-time-service-graceful-shutdown--impl/drift.md` | new | Drift log. |
| `packages/service/src/types.ts` | changed | Added shutdown contracts and serve options. |
| `packages/service/mod.ts` | changed | Re-exported shutdown contracts. |
| `packages/service/src/builder/service-shutdown.ts` | new | Private shutdown coordinator. |
| `packages/service/tests/shutdown-coordinator_test.ts` | new | Unit and failure-path tests. |
| `packages/service/src/builder/service-listener.ts` | changed | Coordinator-backed graceful stop and signal handling. |
| `packages/service/tests/runtime_test.ts` | changed | Runtime lifecycle tests. |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | PASS | Coordinator slice check/lint/fmt exit 0. |
| Fitness | IN_PROGRESS | Coordinator test-shape and failure-path coverage added. |
| Runtime | PASS | Runtime listener tests pass for step 3; builder hook integration pending. |
| Consumer | NOT_RUN | Pending implementation. |

## Open Questions

- None blocking. Approved plan locks report visibility as internal/logged.

## Drift and Debt

- Drift: minor process drift in missing moved/absent docs, recorded in `drift.md`.
- Debt: no new architecture debt accepted.

## Commits

- ce1e901: feat(service): add shutdown contracts
- cb8936f: feat(service): add shutdown coordinator
