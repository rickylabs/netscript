# Drift — 5d2-builders

Append-only. Reality vs RFC/doctrine/plan divergences.

## D-5d2-1 — `RuntimeFormState` and `PageFormConfig` leak form private types through public API
- **Location**: `packages/fresh/builders/mod.ts` re-exports `RuntimeFormState`; `PageFormConfig` / `PageFormHandlerContext` use private form types.
- **Risk**: `deno doc --lint` reports 21 `private-type-ref` violations, mostly rooted in `packages/fresh/form/types.ts`.
- **Impact**: Any decomposition of builders into smaller modules will need to either (a) export the referenced form types publicly, or (b) keep form-facing types co-located with form until form has its own public cleanup pass.
- **Reused from prior trace**: yes — the private-type-ref counts and root file were already captured.

## D-5d2-2 — builders entry point is over-cap
- **Location**: `packages/fresh/builders/mod.ts` (41.5K, ~1,120 lines).
- **Risk**: single module owns public API contract, types, `definePage`/`definePartial`/`defineStatsPartial` signatures, and runtime-adjacent interfaces; hard to split without breaking consumers.
- **Impact**: decomposition must preserve `mod.ts` as a thin barrel and move implementation/implementation types into sub-modules.

## D-5d2-3 — streaming seam is tightly coupled to builder closure
- **Location**: `packages/fresh/builders/define-page/builder.tsx:362-398`.
- **Risk**: `createStreamingResponse` / `createIncrementalStreamingResponse` are imported from `server/stream.ts` and invoked inside the generated `GET` handler closure, using runtime results (`result.page`, `result.streamLayers`) produced by `executePagePipeline`.
- **Impact**: 5d4 (streaming) owns the transport implementation; 5d2 must expose a clean page-result type (`{ page, layerData, headers, status, streamLayers }`) so 5d4 can wrap without reaching into builder internals.

## D-5d2-4 — query/hydration seam for 5d6
- **Location**: `packages/fresh/builders/define-page/runtime.tsx:389-450` (layer loader invocation + deferred/stream layer wiring), `packages/fresh/builders/define-page/internal.ts:89-100` (`RuntimeLayerResolution`, `RuntimeStreamLayerResolution`).
- **Risk**: query bridge (5d6) will likely need to observe `loader` outputs and turn them into cacheable query payloads. The current code builds layer descriptors in `builder.tsx` and resolves them in `runtime.tsx` with no intermediate serializable result.
- **Impact**: 5d2 research should flag `RuntimeLayerDescriptor`, `RuntimeStreamLayerResolution`, and the `loader`/`shouldReload`/`delivery` triad as the seam 5d6 will consume.

## D-5d2-5 — missing JSDoc is concentrated in public types
- **Location**: `packages/fresh/builders/define-page/types.ts` (18 of 19 missing-jsdoc), `packages/fresh/builders/mod.ts` (1 missing-jsdoc).
- **Risk**: public API surface lacks documentation; any rename/move will multiply the doc debt if not fixed first.
- **Impact**: plan should include a JSDoc pass before or alongside decomposition.

## D-5d2-6 — `InferDefinePageLayerLoaderProps` references private helper
- **Location**: `packages/fresh/builders/define-page/types.ts:417`.
- **Risk**: public exported type references `ResolveDefinePageLayerLoaderOutput` and `DefinePageLayerProps` (the latter is public, the former is not).
- **Impact**: simplest fix is to export `ResolveDefinePageLayerLoaderOutput`; should be in plan.

## D-5d2-7 — umbrella architecture target must be honored
- **Location**: `.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/plan.md` (binding umbrella).
- **Risk**: 5d2 decomposition choices affect downstream sub-gates 5d3-5d6.
- **Impact**: keep builder changes scoped to the `definePage` DSL/page pipeline; avoid changing route contracts, server streaming, or form internals in this sub-gate.

