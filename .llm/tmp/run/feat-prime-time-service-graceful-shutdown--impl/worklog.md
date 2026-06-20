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
| 2026-06-20 | 5 | preset DB drain | `defineService()` now registers `$disconnect` for capable DB clients; focused preset tests cover capable and non-capable clients. |
| 2026-06-20 | 6 | docs and final gates | Updated README lifecycle docs and ran final static, runtime, publish, JSR, consumer, doc-lint, and doctrine gates. |

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
| Root `deno task arch:check` fails on unrelated existing repo debt; scoped `packages/service` doctrine check exits 0. | minor | yes |

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
| check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/service --ext ts` | PASS | slice 5 rerun exit 0; 20 files selected, 0 findings. |
| lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/service --ext ts` | PASS | slice 5 rerun exit 0; 20 files selected, 0 findings. |
| fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/service --ext ts` | PASS | slice 5 rerun exit 0; 20 files selected, 0 findings. |
| check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/service --ext ts` | PASS | final rerun exit 0; 20 files selected, 0 findings. |
| lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/service --ext ts` | PASS | final rerun exit 0; 20 files selected, 0 findings. |
| fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/service --ext ts` | PASS | final rerun exit 0; 20 files selected, 0 findings. |
| doc lint | `deno doc --lint packages/service/mod.ts` | PASS | exit 0; checked 1 file. |
| publish dry-run | `rtk proxy deno task publish:dry-run` from `packages/service` | PASS | exit 0; dry run complete with pre-existing `--allow-slow-types` warning covered by accepted service debt. |
| root arch check | `rtk proxy deno task arch:check` | FAIL | exit 1; unrelated repo-wide doctrine failures outside `packages/service`. See drift. |
| scoped doctrine check | `deno run --allow-read .llm/tools/fitness/check-doctrine.ts --root packages/service` | PASS | exit 0; FAIL=0 WARN=1 INFO=0. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| F-1..F-18 applicable set | NOT_RUN | Pending final gate pass. | Manual evidence to be filled after implementation. |
| F-1 file size | PASS | New/changed service source files are below the 500 LOC hard cap; scoped doctrine check has no service failures. | |
| F-3 layering | PASS | New private coordinator stays under `src/builder`; no plugin dependency introduced. | |
| F-5 public surface | PASS | Additive package-owned shutdown types and `onShutdown()` method only; no new subpath. | |
| F-6 JSR publishability | DEBT_ACCEPTED | `packages/service` publish dry-run exits 0 with existing `--allow-slow-types`; debt entry `packages/service — T4 slow-type publish carve-out` remains open. | |
| F-7 doc-score | PASS | New public types and `onShutdown()` have TSDoc examples; `deno doc --lint packages/service/mod.ts` exits 0. | |
| F-10 test shape | PASS | Unit, runtime, failure-path, and preset tests added; `packages/service/tests/` exits 0 with 31 tests. | |
| F-14 console-log lint | PASS | Scoped lint exits 0; new service code uses `@netscript/logger`, no `console.*`. | |
| F-15/F-18 exports | PASS | No upstream re-export and no new sub-barrel/subpath; root export remains curated. | |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| listener lifecycle | NOT_RUN | Pending runtime tests. | No Aspire/scaffold gate per approved plan. |
| coordinator unit | PASS | `rtk proxy deno test --allow-all packages/service/tests/shutdown-coordinator_test.ts` exit 0; 4 passed, 0 failed. | Covers LIFO, failure collection, idempotency, timeout. |
| listener lifecycle | PASS | `rtk proxy deno test --allow-all packages/service/tests/runtime_test.ts` exit 0; 10 passed, 0 failed. | Covers in-flight drain, listener closure, external abort, signal install/remove, repeated serve/stop. |
| service test suite | PASS | `rtk proxy deno test --allow-all packages/service/tests/` exit 0; 29 passed, 0 failed. | Covers builder hook stop/signal/failure/timeout behavior plus existing service tests. |
| service test suite | PASS | `rtk proxy deno test --allow-all packages/service/tests/` exit 0; 31 passed, 0 failed. | Adds `defineService()` `$disconnect` capable/non-capable DB coverage. |
| service final suite | PASS | `rtk proxy deno test --allow-all packages/service/tests/` final exit 0; 31 passed, 0 failed. | |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| -------- | ------ | -------- | ----- |
| `plugins/workers/services` | NOT_RUN | Pending final consumer check. | |
| `plugins/sagas/services` | NOT_RUN | Pending final consumer check. | |
| `plugins/workers/services` | PASS | `deno check --unstable-kv plugins/workers/services/src/main.ts plugins/sagas/services/src/main.ts` exit 0. | Checked with sagas entrypoint in one command. |
| `plugins/sagas/services` | PASS | `deno check --unstable-kv plugins/workers/services/src/main.ts plugins/sagas/services/src/main.ts` exit 0. | Checked with workers entrypoint in one command. |

## Handoff Notes

- Inspect `packages/service/src/builder/service-shutdown.ts` and listener tests first; those prove the runtime contract.
- Root `deno task arch:check` remains non-green due unrelated existing repo debt; scoped `packages/service` doctrine gate passes and no touched service files are implicated.

Final verdict: slice `service-graceful-shutdown` implementation is complete and ready for IMPL-EVAL, with the root architecture gate caveat recorded as unrelated existing repo debt.
