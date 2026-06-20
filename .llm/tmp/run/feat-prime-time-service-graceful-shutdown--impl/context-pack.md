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

Contract and coordinator slices are implemented: `ServeOptions` now carries `drainTimeoutMs`/`handleSignals`, shutdown contracts are exported from the root service surface, and the private coordinator handles LIFO hooks, failure collection, idempotency, and timeout reporting.

## Completed

- Read implementation brief, approved research, approved plan, plan metadata, harness workflow docs, doctrine profile, service overlay, gate matrix, and relevant package surface.
- Confirmed branch `feat/prime-time/service-graceful-shutdown` tracks `origin/feat/prime-time/service-graceful-shutdown`.
- Added public shutdown contracts and serve option fields; scoped check/lint/fmt passed.
- Added `ServiceShutdownCoordinator` and focused unit tests; scoped check/lint/fmt plus coordinator tests passed.

## In Progress

- Listener graceful stop and signal wiring slice.

## Next Steps

1. Wire `ServiceShutdownCoordinator` into `service-listener.ts`.
2. Add runtime tests for graceful in-flight drain, listener closure, signal-listener install/remove behavior, hook failure collection, and drain timeout.

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

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | PASS | Coordinator slice check/lint/fmt exit 0. |
| Fitness | IN_PROGRESS | Coordinator test-shape and failure-path coverage added. |
| Runtime | IN_PROGRESS | Coordinator unit tests pass; listener integration pending. |
| Consumer | NOT_RUN | Pending implementation. |

## Open Questions

- None blocking. Approved plan locks report visibility as internal/logged.

## Drift and Debt

- Drift: minor process drift in missing moved/absent docs, recorded in `drift.md`.
- Debt: no new architecture debt accepted.

## Commits

- ce1e901: feat(service): add shutdown contracts
