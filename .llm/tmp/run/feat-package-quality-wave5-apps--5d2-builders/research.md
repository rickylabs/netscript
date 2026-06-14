# 5d2 builders — PLAN-phase research

> Run dir: `.llm/tmp/run/feat-package-quality-wave5-apps--5d2-builders/`
> Authority: `.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/plan.md` + `handover-5d2-plan.md`
> Trigger: phase 1 of 2 (RESEARCH ONLY). Zero implementation.

## 1. Reuse from prior trace

Trace reused: `.llm/tmp/run/openhands/pr-35/run-27442040668-1/summary.md`
Findings reused:
- Builders directory structure and key public entry points (`builders/mod.ts`, `define-page/mod.ts`).
- Top over-cap files by bytes (preliminary list; re-measured below).
- Streaming is **not** in `builders/define-page/streaming.tsx`; streaming primitives live in `packages/fresh/server/stream.ts`.
- Public exports: `definePage`, `definePartial`, `defineStatsPartial`, and type helpers.
- Internal dependency seams: `builder.tsx` → `server/stream.ts`, `defer/DeferPage.tsx`, `form/types.ts`, `route/contract.ts`.

## 2. MEASURE-FIRST

### 2.1 Byte-size baseline

```text
packages/fresh/builders/define-page.test.tsx              45,816  (largest, test)
packages/fresh/builders/mod.ts                            41,369  (largest, source)
packages/fresh/builders/define-page/builder.tsx           38,406
packages/fresh/builders/define-page/types.ts              22,448
packages/fresh/builders/define-page/navigation.tsx        20,575
packages/fresh/builders/define-page/runtime.tsx           18,450
packages/fresh/builders/define-partial.test.tsx            5,721
packages/fresh/builders/define-page/search-params.ts       4,580
packages/fresh/builders/define-page/internal.ts            3,228
packages/fresh/builders/define-partial.tsx                 3,164
packages/fresh/builders/define-page/mod.ts                   228
TOTAL source (incl tests)                                203,985
TOTAL source (excl tests)                                152,448
```

- Files over 20K (source): `mod.ts` 41.4K, `builder.tsx` 38.4K, `types.ts` 22.4K, `navigation.tsx` 20.6K.
- `runtime.tsx` is close at 18.4K.
- No `define-page/streaming.tsx` exists; streaming is provided by `packages/fresh/server/stream.ts`.

### 2.2 Documentation lint (`deno doc --lint packages/fresh/builders/mod.ts`)

```text
Error categories:
  private-type-ref: 21
  missing-jsdoc:    19
  Total errors:     40
```

Key private-type-ref issues inside builders:
- `InferDefinePageLayerLoaderProps` references private `ResolveDefinePageLayerLoaderOutput` and `DefinePageLayerProps`.

Issues leaking from form package into builders public surface:
- `RuntimeFormState` references private `FormValues`, `FormFieldErrors`.
- Multiple missing JSDoc on `RuntimeFormState` members.

### 2.3 Type-check baseline

- `deno check` on `packages/fresh/builders/mod.ts` emits only a "Warning No matching files found" due to root `deno.json` excluding `packages/fresh/`.
- Using `.llm/tools/run-deno-check.ts --root packages/fresh/builders --ext ts,tsx`:
  - files selected: 11
  - batches: 1
  - failures: 0
  - type errors: 0

So the builders code type-checks cleanly; the documentation surface is the primary quality gap.

## 3. Public symbol map

### 3.1 `packages/fresh/builders/mod.ts`

Exports (re-exports from submodules):
- `definePage` (function, from `define-page/mod.ts`)
- `definePartial` (function, from `define-partial.tsx`)
- `defineStatsPartial` (function, from `define-partial.tsx`)
- Type helpers from `define-page/types.ts` (partial list):
  - `DefinePageTypeCarrier`, `AnyDefinePageTypeState`, `DefinePageTypeState`
  - `DefinePagePath`, `DefinePageSearch`, `DefinePageParams`, `DefinePageLayerData`
  - `DefinePageWithRoute`, `DefinePageWithLayer`, `DefinePageWithForm`
  - `DefinePageRouteFor`
  - `DefinePageLayerContextBase`, `DefinePageLayerContext`
  - `DefinePageLayoutContextBase`, `DefinePageLayoutContext`
  - `DefinePageResourceFactoryFor`, `DefinePageResourceFactory`
  - `DefinePageLayerLoaderFor`, `DefinePageLayerLoader`, `InferDefinePageLayerLoaderProps`
  - `DefinePageLayerConfigFor`, `DefinePageLayerConfig`
  - `DefinePageRouteNav`, `DefinePageRouteNavFor`
  - `DefinePageBuildOptions`
  - `DefinePageMethodHandlerFor`, `DefinePageFormConfigFor`, `DefinePageMethodHandler`
  - `DefinePageSlot`, `DefinePageSlots`, `DefinePageSlotsFor`
  - `DefinePageRuntimeContextBase`
  - `DefinePageMetaDescriptor`, `DefinePageMetaResolverFor`, `DefinePageMetaResolver`
  - `DefinePageHeaderResolverFor`, `DefinePageHeaderResolver`
  - `DefinePageLayoutFor`, `DefinePageLayout`
  - `DefinePageHandlersFor`, `DefinePageHandlers`
  - `DefinePageDefinitionFor`, `DefinePageDefinition`
  - `DefinePageRoutedDefinitionFor`, `DefinePageRoutedDefinition`
  - `DefinePageBuildResultFor`, `DefinePageBuildResult`

### 3.2 `packages/fresh/builders/define-page/mod.ts`

Exports:
- `types.ts` (re-exports all type symbols)
- `builder.tsx` (re-exports `definePage`, builder interfaces)
- `search-params.ts` (re-exports `searchParamsToInput`, `PaginationSearchSchema`, `fallback`, `paginationSearchSchema`)
- `navigation.tsx` (re-exports hooks/components below)

### 3.3 `packages/fresh/builders/define-page/builder.tsx`

Exports:
- `DefinePageBuilder<TState>` interface
- `DefinePageRootBuilder<TState>` interface
- `definePage()` overloads / implementation

### 3.4 `packages/fresh/builders/define-page/navigation.tsx`

Exports:
- Types: `TypedRouteTarget`, `TypedRoutePathOf`, `TypedRouteSearchOf`, `InferRoutePath`, `InferRouteSearch`, `CurrentRouteState`, `FreshLinkAttributes`, `FreshPartialLinkAttributes`, `DefinePageHooks`, `TypedRoutePathInput`, `RouteSearchUpdate`, `GetLinkPropsInput`, `BoundGetLinkPropsInput`, `LinkProps`, `BoundLinkProps`
- Functions: `wrapWithNavigationContext`, `useCurrentRoute`, `useCurrentPath`, `useCurrentSearch`, `usePageRoute`, `usePagePath`, `usePageSearch`, `createDefinePageHooks`, `getLinkProps`, `getBoundLinkProps`, `Link`, `createRouteNav`

### 3.5 `packages/fresh/builders/define-page/search-params.ts`

Exports:
- `searchParamsToInput`
- `PaginationSearchSchema<TShape>` class
- `fallback`
- `paginationSearchSchema`

### 3.6 `packages/fresh/builders/define-page/types.ts`

Core type catalog (see 3.1 re-export list). Highlights:
- `DefinePageTypeState` — the carrier of route params/search/layer data.
- `DefinePageBuildOptions` — build-time options.
- `DefinePageHandlersFor` — GET/POST/etc handler contract.
- `DefinePageDefinitionFor` / `DefinePageRoutedDefinitionFor` — the ultimate page-definition shape.
- `InferDefinePageLayerLoaderProps` — utility type that currently triggers `private-type-ref` lint.

### 3.7 `packages/fresh/builders/define-partial.tsx`

Exports:
- `PARTIAL_ROUTE_CONFIG`
- `DefinedPartialRoute<TContext, THandler>`
- `DefinePartialOptions<TContext, THandler>`
- `definePartial<TContext, THandler>(...)`
- `DefineStatsPartialOptions<TContext, TConfig>`
- `defineStatsPartial<TContext, TConfig>(...)`

### 3.8 Internal-only (`packages/fresh/builders/define-page/internal.ts`)

Not exported from public surface; used by builder/runtime. Contains runtime-context helpers and internal type guards.

## 4. Streaming touchpoints (5d4)

Streaming primitives are imported in `builder.tsx` from `../../server/stream.ts`:
- `createStreamingResponse`
- `createIncrementalStreamingResponse`
- `renderToStream`

Call-site mapping:
- `builder.tsx` invokes these to produce page responses and partial/incremental updates.
- Search command: `grep -n "createStreamingResponse\|createIncrementalStreamingResponse\|renderToStream" packages/fresh/builders/define-page/builder.tsx`

TODO: enumerate exact line numbers and argument shapes.

## 5. Island / hydration seam (5d6 query bridge)

TODO: identify where `builder.tsx`/`runtime.tsx` inject serialized runtime context into HTML, where islands consume it, and where the TanStack Query bridge will plug in.

## 6. DSL market bar

### 6.1 TanStack Start route/loader API

TODO: summarize `createRoute`, `getRouteApi`, `createFileRoute`, `loader`/`routeOptions.loader` patterns and how `definePage` matches or differs.

### 6.2 Next.js App Router conventions

TODO: summarize `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `generateMetadata`, server components, and async server component data fetching; compare with `definePage`.

### 6.3 Remix data APIs

TODO: summarize `loader`/`action`, `useLoaderData`, `useActionData`, `Form`, `Meta`/`Links` functions, nested routing; compare with `definePage`.

### 6.4 What `definePage` must match or beat

TODO: synthesis of the above into a concise bar for the decomposition design.

## 7. Dependencies / internal seams

Direct internal imports observed:
- `builder.tsx` → `../../server/stream.ts`
- `builder.tsx` → `../../defer/DeferPage.tsx`
- `builder.tsx` → `../form/types.ts`
- `builder.tsx` → `../route/contract.ts`
- `builder.tsx` → `./runtime.tsx`, `./types.ts`, `./internal.ts`, `./navigation.tsx`
- `runtime.tsx` → `./types.ts`, `./internal.ts`
- `navigation.tsx` → `./types.ts`, `preact`, `@preact/signals`, `fresh/runtime`
- `define-partial.tsx` → `../route/contract.ts`, `../route/types.ts`

External dependencies:
- `zod` (search-param schemas)
- `preact` / `@preact/signals`
- `fresh` (Fresh core)
- `preact-render-to-string`

## 8. Gaps / TODO for phase 2

- Complete streaming call-site enumeration with line numbers.
- Map island/hydration serialization seam.
- Complete DSL market bar section.
- Produce decomposition candidates based on byte-size + cohesion (types, builder, navigation, runtime, partials, search-params).
- Cross-check public symbols against umbrella architecture targets.

## 9. Drift ledger

See `drift.md` in this directory for entries `D-5d2-n`.
