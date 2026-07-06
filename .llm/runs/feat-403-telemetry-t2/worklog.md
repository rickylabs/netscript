# Worklog — #403 telemetry T2 (ports/adapters restructure)

Branch `feat/403-telemetry-t2` off origin/main f88847d0 (contains T1/#402). Tier-B impl agent.
Baseline before work: scoped check clean (61 files), `deno doc --lint` full export set clean (8),
`deno publish --dry-run` Success, 17 tests pass.

## Slice 1 — structure move (kill `core/`, relocate `runtime/`, delete dead `sse.ts`)
- `src/core/types.ts` → `src/domain/types.ts` (vendor-neutral contract).
- `src/core/{span,span-utils,tracer}.ts` → `src/application/`.
- `src/core/mod.ts` deleted; new `src/application/mod.ts` barrel (domain types + span lifecycle + tracer).
- `src/runtime/` → `src/application/registry/` (registry lifecycle is application per doctrine target map).
- Deleted dead `src/instrumentation/sse.ts` (447 ln, zero consumers repo-wide; open-question #8 default=delete).
- Rewired every `../core/mod.ts`, `../runtime/mod.ts`, `./src/core/types.ts` import; `./tracer` facade → application barrel.
- Evidence: scoped check clean (60 files); `deno test` 17/17 pass incl. T1 TC-1..14 convention tests.

## Slice 2 — subpath surface (`./otel`, `./query`, `./testing`, real `./registry`, barrel, rewrite-map)
- `src/ports/tracer-provider-port.ts` (+mod): `TracerProviderPort` + `TelemetryProviderDescriptor` (narrow: descriptor + register; tracer access stays on the global provider, so no cast-bearing getTracer on the port).
- `src/adapters/otel/`: `otel-deno.ts` (real `OtelDenoTracerProvider` binding to Deno's global provider via `@opentelemetry/api`, `isActive()`), `otel-sdk.ts` (documented scaffold; `register()` throws `TelemetryProviderNotImplementedError`), `mod.ts` re-exports ports+both adapters → backs `./otel`.
- `src/application/query/`: read-model `types.ts` (`TelemetrySpan`/`TelemetryTrace`/`TelemetryLog`/`TelemetryResource`/filters) + `mod.ts` (`TelemetryQuery` contract + `createTelemetryQuery` scaffold rejecting with `TelemetryQueryNotConfiguredError`) → backs `./query`.
- `src/testing/`: `InMemorySpanRecorder` (implements domain `Tracer`, captures `RecordedSpanSnapshot`s; cast-free overload resolution) + `createInMemorySpanRecorder` → backs `./testing`. + 3 recorder tests.
- `./registry` given a real root facade `registry.ts` (matches tracer/config/context facade pattern) instead of pointing straight at the internal mod.
- Root `mod.ts` barrel completed: primary tracing surface (`getTracer`/`withSpan`/`withSpanSync`/`createSpan`/`getActiveSpan`/`getActiveContext`/`isTracingEnabled`/`TracerNames`) + W3C (`getParentContextFromHeaders`/`injectContext`). Attributes stay on `./attributes` (F-5 surface discipline).
- `deno.json`: added `./otel`/`./query`/`./testing`, repointed `./registry`→`registry.ts`, expanded `check` task.
- `packages/cli/.../workspace-mutator.ts` rewrite-map: added root `@netscript/telemetry` + `/orpc`,`/otel`,`/query`,`/registry`,`/testing`.
- Evidence: scoped check clean (70 files); `deno doc --lint` full 11-entrypoint export set clean; `deno publish --dry-run` Success; telemetry 20/20 tests + cli mutator 9/9 pass; fmt clean. No new `as`/`any` casts.
