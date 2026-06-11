# Worklog — Sub-wave 5a: `@netscript/service`

## Bootstrap

- Forked `feat/package-quality-wave5-apps-5a-service` from umbrella tip `09f4845`
  (mandate said dfab7a4; 09f4845 = docs/handover commit atop it — drift D-1).
- Worktree: `.worktrees/wave5-apps-5a-service`; run dir created.

## Measure-first

- `.llm/temp/measure-5a-service.ts` (raw deno via `Deno.Command`, bypasses rtk) →
  `measure-5a.json`. check PASS; doc-lint 23 (14 ptr / 8 ret / 1 jsdoc); dry-run FAIL
  = 8 slow-types + 6 excluded-module; 0 tests. Matches umbrella re-baseline exactly,
  except excluded-module ×6 now root-caused to root `deno.json` exclude (drift D-2).

## Research

See `research.md`. Highlights: full ptr decomposition; telemetry `src/orpc/_types.ts`
identified as the template for `StandardHandlerPlugin` removal; RFC 14 §5.3 seam =
router-as-input + `build()` preserved; consumer census shows zero users of `build()`,
`addHealthCheck`, `addReadinessCheck`, or the `ServiceBuilder` type name.

## Design

**Public surface (after 5a, single `.` entrypoint):**

- Layer 1 primitives: `createHealthHandler`, `createLivenessHandler`,
  `createReadinessHandler`, `healthChecks`, `HealthCheck`, `HealthResponse`,
  `HealthHandlerOptions`; `createRPCPlugins`, `createRPCHandler`,
  `createOpenAPIHandler`, `createNotFoundHandler`, `createErrorHandler`,
  `RPCHandlerConfig`; `createOpenAPISpec`, `createScalarDocs`, `createScalarJs`,
  `OpenAPIConfig`, `ScalarDocsOptions`
- Layer 2 builder: `createService`, `ServiceBuilder` (interface), `ServiceConfig`
- Layer 3 preset: `defineService`, `DefineServiceOptions`
- Types module: `ServiceRouter`, `ServiceApp`, `RunningService`, `FetchHandler`,
  `ServiceHandlerPlugin`, `ServiceMiddleware`, `CorsOptions`, `Database`,
  `DbContext`, `ContextFactory`, `ServiceHandler`
- Sibling re-export kept: `LoggerMiddlewareOptions` (from `@netscript/logger`)

**Domain vocabulary:** service, router (oRPC, input), builder, preset
(`defineService`), primitives (handler factories), running service (serve handle),
diagnostics (internal DB-connectivity UX).

**Ports / seams:** router is always an input (RFC 14 unified-mode seam); `build()`
returns a non-listening `ServiceApp` (mountable); `serve({signal})` is the only place
`Deno.serve` is touched; logger + telemetry consumed via `@netscript/*` siblings;
oRPC interop via structural types only (telemetry precedent).

**Constants:** ENGINE_CONFIGS (diagnostics, internal), default port/env names
(`PORT`, `DB_PROVIDER`, `NETSCRIPT_DEBUG`, `DENO_ENV`) — keep as documented constants
in src/, not magic strings at call sites.

**Commit slices:** 15 (plan §4). Slice 2 is an intentionally transient rename-only
slice (lesson: rename slices transient). Slice 15 = root-exclude lift + full sweep.

**Deferred scope:** plan §8.

**Contributor path:** README quickstart (defineService) → builder recipes →
docs/architecture (layered surface + seam notes) → tests as living examples
(doctest runner mirrors README).

## Hand-off

Artifacts ready for PLAN-EVAL (separate session): research.md, plan.md (PROPOSED, not
locked), drift.md, context-pack.md, measure-5a.json. No implementation performed.

## Implementation

### Slice 1/15 — D-10 standardize deno.json

| Field | Evidence |
| --- | --- |
| Commit | `0785a8f` — `Standardize service package metadata for publish gates` |
| Changed | `packages/service/deno.json` now declares description, MIT license, local check/test/lint/fmt/publish tasks, and publish include/exclude metadata that keeps `mod.ts`, future `src/`, docs, README, and `assets/scalar.min.js` in the package. |
| Gate | `deno check --unstable-kv packages/service/mod.ts` via raw `Deno.Command` from repo root: PASS exit 0, known `No matching files found` warning while root `deno.json` still excludes `packages/service/` until slice 15. Package-local rerun with `--config packages/service/deno.json` produced the same exit-0 warning, consistent with drift D-2. |
| Concept of done | Metadata-only slice; no source files created. Publish metadata preserves D-9 asset inclusion and prepares D-11 root-exclude lift. |
| Drift | none |

PLAN-EVAL advisory fold-ins started in this slice: research records Aspire as N/A for this package, and plan exit gates now name jsr-audit publishability target `>=7/10`.

### Slice 2/15 — D-1 move sources under `src/`

| Field | Evidence |
| --- | --- |
| Commit | `d9897c0` — `Move service sources under src without behavior changes` |
| Changed | `builders/service-builder.ts` moved to `src/builder/service-builder.ts`; `primitives/*` moved to `src/primitives/*`; `presets/define-service.ts` moved to `src/presets/define-service.ts`; root `mod.ts`, preset import, and Scalar asset URL were updated for the new paths. |
| Gate | `deno check --unstable-kv packages/service/mod.ts` via raw `Deno.Command`: PASS exit 0 with known root-exclude warning. A `--no-config` probe reached the moved files and failed only on unresolved bare imports, as expected without `packages/service/deno.json` imports. |
| Concept of done | Every moved file remains reachable from `mod.ts`. No new behavior files or speculative folders were added; `src/` now contains only the planned builder, primitives, and presets roles. |
| Drift | none |

### Slice 3/15 — D-3/D-4/D-6 package-owned public types

| Field | Evidence |
| --- | --- |
| Commit | `88e0cc0` — `Add service public structural types` |
| Changed | Added `packages/service/src/types.ts` and exported its public structural contracts from `mod.ts`: `ServiceRouter`, `ServiceApp`, `RunningService`, `FetchHandler`, `ServiceHandlerPlugin`, `ServiceMiddleware`, `CorsOptions`, `Database`, `DbContext`, `ContextFactory`, and supporting context/result types. |
| Gate | `deno check --unstable-kv packages/service/mod.ts` via raw `Deno.Command`: PASS exit 0 with known root-exclude warning. Root formatter cannot target service while excluded; new code was manually wrapped to root style and final slice 15 owns the authoritative fmt gate. |
| Concept of done | New file is reachable from the public surface, contains only named public vocabulary required by D-3/D-4/D-6, avoids upstream type exports, and gives later slices one file to copy when adding structural mirrors. |
| Drift | none |

### Slice 4/15 — D-6 handlers use structural contracts

| Field | Evidence |
| --- | --- |
| Commit | `b62dfbe` — `Replace handler leaks with service structural contracts` |
| Changed | `src/primitives/handlers.ts` no longer imports `@orpc/server/standard`; `RPCHandlerConfig.plugins` and `createRPCPlugins()` use `ServiceHandlerPlugin`; `createRPCHandler()` and `createOpenAPIHandler()` return `FetchHandler`; `createNotFoundHandler()` and `createErrorHandler()` return package-owned handler types. Added `ServiceErrorHandler` to `src/types.ts` and the root barrel. |
| Gate | `deno check --unstable-kv packages/service/mod.ts` via raw `Deno.Command`: PASS exit 0 with known root-exclude warning. |
| Concept of done | Handler public signatures are now package-owned and copyable from one file; finite error strings remain centralized inside the handler factories until diagnostics/logger slices. |
| Drift | none |

### Slice 5/15 — D-6 OpenAPI explicit returns

| Field | Evidence |
| --- | --- |
| Commit | `aabcde2` — `Add explicit OpenAPI primitive return contracts` |
| Changed | `src/primitives/openapi.ts` now uses `ServiceRouter` and explicit `ServiceHandler` returns for `createOpenAPISpec`, `createScalarDocs`, and `createScalarJs`; removed the Hono `Context` public return dependency; named OpenAPI/Scalar defaults and cache-control string constants. |
| Gate | `deno check --unstable-kv packages/service/mod.ts` via raw `Deno.Command`: PASS exit 0 with known root-exclude warning. |
| Concept of done | OpenAPI primitive signatures are package-owned, and finite default/cache vocabulary now lives in one file for copyable extension. Scalar asset inclusion remains unchanged for D-9. |
| Drift | none |

### Slice 6/15 — D-6 health explicit returns

| Field | Evidence |
| --- | --- |
| Commit | `65c6512` — `Add explicit health primitive return contracts` |
| Changed | `src/primitives/health.ts` now returns `ServiceHandler` from health, liveness, and readiness factories; added/exported `HEALTH_STATUS` and `HealthStatus` so finite health vocabulary is named rather than repeated as raw strings. |
| Gate | `deno check --unstable-kv packages/service/mod.ts` via raw `Deno.Command`: PASS exit 0 with known root-exclude warning. |
| Concept of done | Health primitives stay reachable from `mod.ts`, use one file as the extension pattern for new health states/handlers, and preserve runtime response shapes. |
| Drift | none |

### Slice 7/15 — D-2/D-3/D-5 builder interface and mirror types

| Field | Evidence |
| --- | --- |
| Commit | `ff9ca2d` — `Expose service builder as structural interface` |
| Changed | `ServiceBuilder` is now an exported interface; concrete implementation is internal `ServiceBuilderImpl`. Builder public methods use `CorsOptions`, `DbContext`, `Database`, `ContextFactory`, `ServiceMiddleware`, `ServiceHandler`, `ServiceApp`, and `ServiceRouter`. Renamed `addHealthCheck`/`addReadinessCheck` to `withHealthCheck`/`withReadinessCheck` with no shims. Root barrel exports `type ServiceBuilder`. |
| Gate | `deno check --unstable-kv packages/service/mod.ts` via raw `Deno.Command`: PASS exit 0 with known root-exclude warning. Consumer grep for removed method names found no TypeScript service consumers; the only hit was unrelated C# template text `AddHealthChecks`. |
| Concept of done | Builder extension path is one file: add the interface method and mirror implementation method together. Constructor path is only `createService()`, preserving the DSL entrypoint and zero-consumer rename rule. |
| Drift | none |

### Slice 8/15 — D-4/D-8 stoppable serve runtime

| Field | Evidence |
| --- | --- |
| Commit | `58e7d1e` — `Add stoppable service runtime handle` |
| Changed | Added/exported `ServeOptions`; `ServiceBuilder.serve()` now accepts `{ port, signal }` and returns `RunningService` with `{ app, addr, stop() }`. `Deno.serve` is wired with an internal `AbortController`, external abort propagation, and awaited `server.finished` stop semantics. Serve banner now uses `createServiceLogger`; `createErrorHandler()` logs through `@netscript/logger`; builder/handler runtime paths are console-free. |
| Gate | `deno check --unstable-kv packages/service/mod.ts` via raw `Deno.Command`: PASS exit 0 with known root-exclude warning. `Select-String` over builder + handlers for `console.` returned no matches. |
| Concept of done | Runtime lifecycle now has an explicit handle and cancellation path; logger usage is centralized in the affected runtime/error paths. |
| Drift | none |

### Slice 9/15 — D-7 diagnostics extraction

| Field | Evidence |
| --- | --- |
| Commit | `d33d6d1` — `Extract service database diagnostics behind logger` |
| Changed | Moved engine configs, endpoint resolution, TCP probing, retry loop, Prisma root-cause extraction, and formatted database diagnostics into internal `src/diagnostics/database-connectivity.ts`. `define-service.ts` now delegates via `createDatabaseConnectivityStartupHook()` and drops to 143 lines. Diagnostics emit through `@netscript/logger` while preserving the multi-line troubleshooting block. |
| Gate | `deno check --unstable-kv packages/service/mod.ts` via raw `Deno.Command`: PASS exit 0 with known root-exclude warning. `Select-String packages/service/src/**/*.ts -Pattern 'console\\.'`: 0 matches. Line counts: `define-service.ts` 143, diagnostics module 395. |
| Concept of done | The diagnostics module is reachable from the preset startup hook, not exported through the public barrel, and names database engine/env vocabulary in one internal file. |
| Drift | none |

### Slice 10/15 — D-13 `defineService()` returns `RunningService`

| Field | Evidence |
| --- | --- |
| Commit | `53b646a` — `Return running service from defineService` |
| Changed | `defineService()` now returns `Promise<RunningService>` from `builder.withHealth().serve()`. Preset router and db context signatures use `ServiceRouter`, `DbContext`, `Database`, and `RunningService`; local `AnyRouter` and explicit `any` context typing were removed. |
| Gate | `deno check --unstable-kv packages/service/mod.ts` via raw `Deno.Command`: PASS exit 0 with known root-exclude warning. Focused search in preset found no remaining `AnyRouter`, explicit `any`, `Promise<void>`, or `ensureLogging` implementation references. |
| Concept of done | Preset users now get the same lifecycle stop handle as builder users, while existing await-and-ignore consumers remain valid. |
| Drift | none |

### Slice 11/15 — documented `mod.ts` barrel

| Field | Evidence |
| --- | --- |
| Commit | `104f215` — `Document service barrel as public contract` |
| Changed | Rewrote root `mod.ts` module docs to explain the three-layer surface, `build()`/`serve()` seam, structural mirror types, and the first-party `LoggerMiddlewareOptions` sibling re-export. Barrel remains export-only and is 130 lines. |
| Gate | `deno check --unstable-kv packages/service/mod.ts` via raw `Deno.Command`: PASS exit 0 with known root-exclude warning. |
| Concept of done | A reader can understand the service public surface and extension path from the root barrel without it becoming executable logic. |
| Drift | none |

### Slice 12/15 — D-12 README and docs scaffold

| Field | Evidence |
| --- | --- |
| Commit | `ca090b0` — `Add service package documentation surface` |
| Changed | Added `packages/service/README.md` (234 lines, 14+ sections) plus `docs/getting-started.md`, `docs/concepts.md`, and `docs/architecture.md`. README covers install, quick start, entrypoint, public surface, builder, preset, lifecycle, build-without-listening, health, RPC/OpenAPI, database context, logging/diagnostics, permissions, testing, docs links, see also, and license. |
| Gate | `deno check --unstable-kv packages/service/mod.ts` via raw `Deno.Command`: PASS exit 0 with known root-exclude warning. README line count: 234. |
| Concept of done | Docs are reachable from the README and publish include map; examples use current `RunningService` stop semantics and no deprecated builder names. |
| Drift | none |

### Slice 13/15 — D-12 doctest runner and unit tests

| Field | Evidence |
| --- | --- |
| Commit | `86426fa` — `Add service doctest and unit coverage` |
| Changed | Added README example guard `tests/_fixtures/readme-examples_test.ts`; unit tests for builder chain, custom health checks, health primitives, not-found/error handlers, and type assignability. Added `@std/assert` package import and corresponding `deno.lock` entry. |
| Gate | `deno test --config packages/service/deno.json --allow-all packages/service/tests`: exit 1 `No test modules found` while root exclude still hides `packages/service/` before slice 15. `deno check --unstable-kv packages/service/mod.ts`: PASS exit 0 with known root-exclude warning. |
| Concept of done | Test files are public-surface consumers and will become active when slice 15 lifts the root exclude. No test helper imports another test. |
| Drift | none |

### Slice 14/15 — A3 runtime lifecycle and failure tests

| Field | Evidence |
| --- | --- |
| Commit | `101e790` — `Add service runtime lifecycle tests` |
| Changed | Added `tests/runtime_test.ts` covering ephemeral `serve({ port: 0 })`, `/health` round-trip, clean `stop()`, external AbortSignal shutdown, invalid port start failure, startup-hook failure, clean stop after handler error, and assigned listener address shape. |
| Gate | `deno test --config packages/service/deno.json --allow-all packages/service/tests`: exit 1 `No test modules found` while root exclude still hides `packages/service/` before slice 15. `deno check --unstable-kv packages/service/mod.ts`: PASS exit 0 with known root-exclude warning. |
| Concept of done | Runtime tests exercise A3 success, cancellation, start-failure, and shutdown-after-error paths through the public builder surface. |
| Drift | none |

### Slice 15/15 — D-11 final validation sweep

| Field | Evidence |
| --- | --- |
| Commit | `100ab31` — `Lift service into root quality gates` |
| Changed | Root `deno.json` no longer excludes `packages/service/` from root package/plugin check, lint, or fmt wrappers. Public handler callback interfaces expose service-native and Hono-compatible call signatures so plugin Hono apps can keep passing health handlers directly to `app.get()`. Runtime tests normalize `0.0.0.0` listener addresses to `127.0.0.1` for Windows clients. |
| Gates | `deno check --unstable-kv packages/service/mod.ts`: PASS. `deno task check`: PASS, 1367 files, 12 batches, 0 findings. `deno task lint`: PASS, 875 files, 0 findings. `deno task fmt:check`: PASS, 875 files, 0 findings. `deno test --config packages/service/deno.json --allow-all packages/service/tests`: PASS, 17 passed / 0 failed. `deno doc --lint packages/service/mod.ts`: PASS, checked 1 file. `deno publish --dry-run --allow-dirty` from `packages/service`: PASS with 0 slow types and 0 excluded-module errors. Consumer gate equivalent: `deno check --unstable-kv plugins/workers/services/src/main.ts plugins/sagas/services/src/main.ts plugins/streams/services/src/main.ts`: PASS. |
| JSR audit | `deno run --allow-read --allow-run --allow-env tools/fitness/audit-jsr-package.ts --root packages/service --text`: PASS target, publishability 8/10 (target >=7/10). Audit artifact: `jsr-audit-service.json`. The tool reports one WARN because it parses the dry-run banner line "Checking for slow types..." as a warning; raw `deno publish --dry-run --allow-dirty` reports success with no slow-type warnings. |
| Non-locked context | `deno task arch:check` remains red on repo-wide pre-existing failures outside this unit (58 FAIL / 91 WARN, mostly CLI/plugin abstract-class and Jest-style test findings). Not a locked service exit gate in plan §5; recorded here for evaluator context. |
| Concept of done | `@netscript/service` is reachable from root quality wrappers, publishable as a JSR package, covered by public-surface tests, and compile-checked through plugin service consumers. |
| Drift | D-4 — root check wrapper task names differ from locked-plan text; used available `deno task check` plus focused plugin consumer check. |

## Final Gate Table — `@netscript/service` A4 ∪ A3

| Gate | Result | Evidence |
| --- | --- | --- |
| Surface / F-1 | PASS | Single `.` entrypoint in `packages/service/deno.json`; root `mod.ts` is documented and barrel-only. |
| F-5 canonical entrypoint | PASS | `packages/service/mod.ts` exists and `deno doc --lint packages/service/mod.ts` exits 0. |
| F-6 JSR config | PASS | `name`, `version`, `description`, `license`, `exports`, and publish include/exclude are present in `packages/service/deno.json`. |
| F-7 publish dry-run | PASS | `deno publish --dry-run --allow-dirty` from `packages/service` exits 0 with no slow types or excluded modules. |
| F-13 runtime | PASS | Runtime tests boot `serve({ port: 0 })`, GET `/health` 200, stop cleanly, abort via external signal, reject invalid config/startup failure, and stop after handler error. |
| Root check/lint/fmt | PASS | `deno task check`, `deno task lint`, and `deno task fmt:check` all exit 0 after lifting `packages/service/`. |
| Consumer compile | PASS | Focused plugin service check over workers/sagas/streams `main.ts` exits 0. |
| JSR audit | PASS | Package audit target met at 8/10; README 235 lines, docs folder present, module tag present, description 99 chars, 6 test files. |
| Lock hygiene | PASS | No lock files/caches deleted; no `deno cache --reload` run. `deno.lock` dependency changes were introduced in slice 13 for `@std/assert` tests. |
