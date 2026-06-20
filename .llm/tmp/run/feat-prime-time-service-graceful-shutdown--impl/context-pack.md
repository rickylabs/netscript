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

All planned implementation slices are complete. `ServeOptions` now carries `drainTimeoutMs`/`handleSignals`, shutdown contracts are exported from the root service surface, the private coordinator handles LIFO hooks/failure collection/idempotency/timeout reporting, the listener routes manual stop/external abort/OS signals through graceful `server.shutdown()`, `ServiceBuilder.onShutdown()` threads hooks into the runtime, `defineService()` disconnects capable DB clients on stop, and README lifecycle docs describe the new API.

## Completed

- Read implementation brief, approved research, approved plan, plan metadata, harness workflow docs, doctrine profile, service overlay, gate matrix, and relevant package surface.
- Confirmed branch `feat/prime-time/service-graceful-shutdown` tracks `origin/feat/prime-time/service-graceful-shutdown`.
- Added public shutdown contracts and serve option fields; scoped check/lint/fmt passed.
- Added `ServiceShutdownCoordinator` and focused unit tests; scoped check/lint/fmt plus coordinator tests passed.
- Wired `service-listener.ts` to the coordinator and added runtime tests; scoped check/lint/fmt plus runtime tests passed.
- Added `ServiceBuilder.onShutdown()` to interface/implementation and service tests; full `packages/service/tests/` passed.
- Added `defineService()` `$disconnect` shutdown hook for capable health-check clients and focused preset tests; full `packages/service/tests/` passed.
- Updated README lifecycle docs and ran final static/runtime/publish/JSR/doc/consumer/doctrine gates.

## In Progress

- Final commit/push and PR handoff.

## Next Steps

1. Commit the docs/final evidence slice.
2. Push with explicit refspec and comment PR #78 with final gate table.

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
| `packages/service/src/builder/service-builder.ts` | changed | Public `onShutdown()` builder method. |
| `packages/service/src/builder/service-builder-impl.ts` | changed | Shutdown hook storage and listener threading. |
| `packages/service/tests/service-builder_test.ts` | changed | Builder shutdown hook tests. |
| `packages/service/src/presets/define-service.ts` | changed | DB `$disconnect` shutdown hook registration. |
| `packages/service/tests/define-service_test.ts` | new | Preset DB drain tests. |
| `packages/service/README.md` | changed | Graceful shutdown and `onShutdown()` docs. |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | PASS | Final scoped check/lint/fmt and doc lint exit 0. |
| Fitness | PASS_WITH_ACCEPTED_DEBT | JSR audit exits 0 with known service slow-type warning; scoped doctrine exits 0; root arch check fails on unrelated existing debt. |
| Runtime | PASS | Final service tests pass, 31 passed. |
| Consumer | PASS | Workers and sagas service entrypoints `deno check --unstable-kv` exit 0. |

## Open Questions

- Root `deno task arch:check` remains non-green on unrelated existing repo-wide findings; scoped service doctrine check exits 0.

## Drift and Debt

- Drift: minor process drift in missing moved/absent docs and root arch-check unrelated failures, recorded in `drift.md`.
- Debt: no new architecture debt accepted.

## Commits

- ce1e901: feat(service): add shutdown contracts
- cb8936f: feat(service): add shutdown coordinator
- 7f66af2: feat(service): drain listener shutdown
- f2cfc34: feat(service): wire shutdown hooks
- add8bb2: feat(service): drain preset database clients
