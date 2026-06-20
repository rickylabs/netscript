# Worklog: service-graceful-shutdown

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `feat-prime-time-service-graceful-shutdown--impl` |
| Branch | `feat/prime-time/service-graceful-shutdown` |
| Archetype | `ARCHETYPE-4 - Public DSL / Builder` |
| Scope overlays | `SCOPE-service` |

## Design

### Public Surface

- `ServeOptions.drainTimeoutMs` and `ServeOptions.handleSignals` - listener shutdown controls.
- `ShutdownReason`, `ShutdownContext`, `ShutdownHook`, `ShutdownHookOutcome`, `ShutdownReport` - package-owned graceful shutdown contracts.
- `ServiceBuilder.onShutdown(hook)` - fluent teardown hook registration.
- `RunningService.stop(): Promise<void>` - strengthened to graceful, idempotent drain without changing the signature.

### Domain Vocabulary

- `ShutdownReason` - finite shutdown trigger vocabulary: `signal`, `manual`, `startup-failure`.
- `ShutdownContext` - reason plus optional OS signal passed to hooks.
- `ShutdownHook` - async or sync teardown callback.
- `ShutdownHookOutcome` - per-hook success/failure record.
- `ShutdownReport` - internal/logged shutdown summary.
- `ServiceShutdownCoordinator` - package-private lifecycle coordinator for idempotent drain, timeout accounting, hook execution, and report construction.

### Ports

- None introduced. The slice uses Deno's existing `HttpServer`, `AbortController`, `AbortSignal`, and signal APIs directly at the listener edge.

### Constants

- `DEFAULT_DRAIN_TIMEOUT_MS` - `30_000`.
- `SHUTDOWN_REASONS` - `signal`, `manual`, `startup-failure`.
- Signal set - POSIX `SIGINT`/`SIGTERM`, Windows `SIGINT`/`SIGBREAK`.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Contracts | `run-deno-check.ts --root packages/service --ext ts`; lint; fmt | `packages/service/src/types.ts`, `packages/service/mod.ts` |
| 2 | Shutdown coordinator | check/lint/fmt; `deno test --allow-all packages/service/tests/shutdown-coordinator_test.ts` | `packages/service/src/builder/service-shutdown.ts`, `packages/service/tests/shutdown-coordinator_test.ts` |
| 3 | Listener graceful stop + signals | check/lint/fmt; `deno test --allow-all packages/service/tests/runtime_test.ts` | `packages/service/src/builder/service-listener.ts`, `packages/service/tests/runtime_test.ts` |
| 4 | Builder `onShutdown` wiring | check/lint/fmt; `deno test --allow-all packages/service/tests/` | `packages/service/src/builder/service-builder.ts`, `packages/service/src/builder/service-builder-impl.ts`, `packages/service/tests/service-builder_test.ts` |
| 5 | Preset DB drain | check/lint/fmt; `deno test --allow-all packages/service/tests/` | `packages/service/src/presets/define-service.ts`, focused service tests |
| 6 | Docs + publish surface | `deno task publish:dry-run`; jsr-audit/manual fitness evidence | `packages/service/README.md`, public docs |

### Deferred Scope

- Refactor `plugins/streams/services/src/main.ts` away from hand-rolled signal handling - different unit.
- Plugin runtime composition-root shutdown wiring - separate plugin slices.
- Auth/RBAC - separate `service-auth-seam` slice.

### Contributor Path

A developer adding another listener lifecycle feature starts at `packages/service/src/builder/service-listener.ts` for Deno edge mechanics, uses `packages/service/src/builder/service-shutdown.ts` for drain policy, adds public knobs in `packages/service/src/types.ts`, then wires fluent registration through `ServiceBuilder` and `ServiceBuilderImpl`.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-06-20 | bootstrap | pre-flight | Read brief, approved plan, plan-meta, harness/doctrine/profile/gate docs. Correct branch/tracking confirmed; unrelated OpenHands request files are dirty and left untouched. |
| 2026-06-20 | 1 | contracts | Added shutdown contracts and extended `ServeOptions`; scoped check/lint/fmt passed. |
| 2026-06-20 | 2 | coordinator | Added private shutdown coordinator and unit tests for LIFO order, failure collection, idempotency, and timeout handling. |
| 2026-06-20 | 3 | listener | Wired listener stop/external abort/OS signals through the coordinator; added runtime tests for in-flight drain and signal listener hygiene. |
| 2026-06-20 | 4 | builder wiring | Added `ServiceBuilder.onShutdown()`, threaded hooks into the listener, and covered stop/signal/failure/timeout behavior in service tests. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Preserve `RunningService.stop(): Promise<void>` | Back-compatible strengthened behavior; shutdown report remains internal/logged. | `plan-meta.json` locked decision |
| Keep coordinator package-private | Avoid plugin dependency and keep listener focused on edge mechanics. | `plan.md` implementation seam |
| Register signal handling by default with opt-out | Service front door owns graceful process shutdown while embedding hosts can disable it. | `plan.md` locked scope |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| `.claude/04-services.md` and `.claude/06-infrastructure.md` referenced by overlay are absent in this worktree. | minor | yes |
| Slice-specific `plan-eval.md` is absent; supervisor `plan-eval-summary.md` records `service-graceful-shutdown` PASS. | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| ---- | ---------------- | ------ | ----- |
| check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/service --ext ts` | PASS | exit 0; 17 files selected, 0 findings. |
| lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/service --ext ts` | PASS | exit 0; 17 files selected, 0 findings. |
| fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/service --ext ts` | PASS | exit 0; 17 files selected, 0 findings. |
| check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/service --ext ts` | PASS | slice 2 rerun exit 0; 19 files selected, 0 findings. |
| lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/service --ext ts` | PASS | slice 2 rerun exit 0; 19 files selected, 0 findings. |
| fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/service --ext ts` | PASS | slice 2 rerun exit 0; 19 files selected, 0 findings. |
| check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/service --ext ts` | PASS | slice 3 rerun exit 0; 19 files selected, 0 findings. |
| lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/service --ext ts` | PASS | slice 3 rerun exit 0; 19 files selected, 0 findings. |
| fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/service --ext ts` | PASS | slice 3 rerun exit 0; 19 files selected, 0 findings. |
| check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/service --ext ts` | PASS | slice 4 rerun exit 0; 19 files selected, 0 findings. |
| lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/service --ext ts` | PASS | slice 4 rerun exit 0; 19 files selected, 0 findings. |
| fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/service --ext ts` | PASS | slice 4 rerun exit 0; 19 files selected, 0 findings. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| F-1..F-18 applicable set | NOT_RUN | Pending final gate pass. | Manual evidence to be filled after implementation. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| listener lifecycle | NOT_RUN | Pending runtime tests. | No Aspire/scaffold gate per approved plan. |
| coordinator unit | PASS | `rtk proxy deno test --allow-all packages/service/tests/shutdown-coordinator_test.ts` exit 0; 4 passed, 0 failed. | Covers LIFO, failure collection, idempotency, timeout. |
| listener lifecycle | PASS | `rtk proxy deno test --allow-all packages/service/tests/runtime_test.ts` exit 0; 10 passed, 0 failed. | Covers in-flight drain, listener closure, external abort, signal install/remove, repeated serve/stop. |
| service test suite | PASS | `rtk proxy deno test --allow-all packages/service/tests/` exit 0; 29 passed, 0 failed. | Covers builder hook stop/signal/failure/timeout behavior plus existing service tests. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| -------- | ------ | -------- | ----- |
| `plugins/workers/services` | NOT_RUN | Pending final consumer check. | |
| `plugins/sagas/services` | NOT_RUN | Pending final consumer check. | |

## Handoff Notes

- Inspect `packages/service/src/builder/service-shutdown.ts` and listener tests first; those prove the runtime contract.
