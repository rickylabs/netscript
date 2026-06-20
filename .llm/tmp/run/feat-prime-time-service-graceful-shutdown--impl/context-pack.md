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

Contract slice is implemented: `ServeOptions` now carries `drainTimeoutMs`/`handleSignals`, and shutdown contracts are exported from the root service surface.

## Completed

- Read implementation brief, approved research, approved plan, plan metadata, harness workflow docs, doctrine profile, service overlay, gate matrix, and relevant package surface.
- Confirmed branch `feat/prime-time/service-graceful-shutdown` tracks `origin/feat/prime-time/service-graceful-shutdown`.
- Added public shutdown contracts and serve option fields; scoped check/lint/fmt passed.

## In Progress

- Shutdown coordinator slice.

## Next Steps

1. Implement `ServiceShutdownCoordinator` and focused unit tests.
2. Run coordinator gates, commit, push with explicit refspec, append commits, and comment PR #78.

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

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | PASS | Contract slice check/lint/fmt exit 0. |
| Fitness | NOT_RUN | Pending implementation. |
| Runtime | NOT_RUN | Pending implementation. |
| Consumer | NOT_RUN | Pending implementation. |

## Open Questions

- None blocking. Approved plan locks report visibility as internal/logged.

## Drift and Debt

- Drift: minor process drift in missing moved/absent docs, recorded in `drift.md`.
- Debt: no new architecture debt accepted.

## Commits

- 5dfe353: feat(service): add shutdown contracts
