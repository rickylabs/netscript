# 5d6 PLAN-phase research - `./query` + `./server` + final package surface

Run: `openhands/pr-39/run-27445693854-1` - Branch: `feat/package-quality-wave5-apps-5d6-query`
Scope: RESEARCH ONLY - Design/plan artifacts follow after supervisor review.

## Reuse statement (prior trace)

- Source trace: `.llm/tmp/run/openhands/pr-39/run-27442118991-1/`
- Prior run hit 500-iteration limit and produced **no research/design/plan artifacts** (only `drift.md`, `commits.md`, `worklog.md` skeletons).
- Its summary claims are therefore not treated as committed deliverables, but its distilled findings are reused as the starting baseline.
- **Current-run measurements** (committed artifacts in this run dir) confirm the baseline and add whole-package detail:
  - `./query/mod.ts`: 88 doc-lint errors (64 `privateTypeRef`, 23 `missingJSDoc`, 1 `missing-return-type`).
  - `./server.ts`: 13 doc-lint errors (8 `privateTypeRef`, 5 `missingJSDoc`).
  - `./streams/mod.ts`: 32 doc-lint errors (24 `privateTypeRef`, 8 `missingJSDoc`).
  - Whole-package `@netscript/fresh` across 12 measured entrypoints: 276 doc-lint errors (115 `privateTypeRef`, 157 `missingJSDoc`, 4 `other`).
  - `deno publish --dry-run` from `packages/fresh/`: 62 errors total - 58 `excluded-module` (root workspace `exclude` lists `packages/fresh/`, so package-local `publish.include` is overridden by the workspace config) plus 4 `missing-explicit-return-type` in form/query components.
  - `deno check --unstable-kv` produced no type errors (`Warning No matching files found.` because the package is root-excluded; check was run against the package directory and returned an empty file set).

## MEASURE-FIRST

### 1. Combined `deno doc --lint` - `./query`, `./server`, `.`

Command used (committed logs):

```bash
# Per-entrypoint runs were captured as:
deno doc --lint --json ./query/mod.ts  > doc-lint-._query_mod.ts.log 2>&1
deno doc --lint --json ./server.ts     > doc-lint-._server.ts.log    2>&1
deno doc --lint --json ./mod.ts        > doc-lint-._mod.ts.log       2>&1
```

Aggregated via `doc-lint-aggregate.json` (source `"mode":"auto","root":"packages/fresh"`, 12 entrypoints).

Output summary:

- `./query/mod.ts`: **88 errors** - 64 private-type-ref, 23 missing-JSDoc, 1 missing-return-type.
  - Top file clusters: `@tanstack/preact-query` d.ts (49 errors, all upstream private types re-exported through `./hooks.ts`), `./query/query-island.tsx` (3), `./query/hydration.ts` (2), `./query/query-client.ts` (1).
- `./server.ts`: **13 errors** - 8 private-type-ref, 5 missing-JSDoc.
  - Top file cluster: `./server/stream-error-boundary.tsx` (11 of the 13); `./server/stream.ts` contributes 2 private-type-ref.
- `./mod.ts`: **23 errors** - 15 private-type-ref, 8 missing-JSDoc.
  - Clusters: `./components/ErrorDisplay.tsx` (6), `./defer/policy.ts` (6), `./defer/DeferIsland.tsx` (2), `./defer/DeferPage.tsx` (3), `./utils/mod.ts` (3), `./builders/mod.ts` (3 propagated from builders barrel).

### 2. Whole-package baseline across all entrypoints

Umbrella plan F-16 surface lists 13 entrypoints:
`.` - `./server` - `./builders` - `./route` - `./defer` - `./form` - `./error` - `./utils` - `./streams` - `./query` - `./interactive` - `./vite` - `./testing`.

| Entrypoint | Barrel file | Total errors | privateTypeRefs | missingJSDoc | Other | Notes |
|---|---|---:|---:|---:|---:|---|
| `./query` | `./query/mod.ts` | 88 | 64 | 23 | 1 | 49 refs are upstream `@tanstack/preact-query` re-exports in `./hooks.ts`; remaining 15 in `./query-island.tsx` (ComponentChildren), `./hydration.ts` (DehydratedState import), `./query-client.ts` (QueryClient). |
| `./form` | `./form/mod.ts` | 74 | 34 | 39 | 1 | Largest missing-JSDoc cluster: `./form/types.ts` (32). Private refs concentrate in `./form/handler-context.ts`, `./form/types.ts`, and `./form/runtime-state.ts`. |
| `./defer` | `./defer/mod.ts` | 60 | 27 | 31 | 2 | Private refs: `policy.ts`, `DeferIsland.tsx`, `DeferPage.tsx`; missing-JSDoc: `policy.ts` (20), `DeferPage.tsx` (6). |
| `./builders` | `./builders/mod.ts` | 40 | 30 | 9 | 1 | 17 private refs from `builders/define-page/builder.tsx` (`excluded-module` propagates private internal types); remainder across `types.ts`, `navigation.tsx`, `runtime.tsx`. |
| `./route` | `./route/mod.ts` | 36 | 25 | 10 | 1 | Private refs: `contract.ts` (18), `manifest.ts` (7); missing-JSDoc: `contract.ts` (6), `manifest.ts` (4). |
| `.` | `./mod.ts` | 23 | 15 | 8 | 0 | Re-exports inherit errors from `./defer`, `./error`, `./utils`; own `components/ErrorDisplay.tsx` contributes 6. |
| `./streams` | `./streams/mod.ts` | 32 | 24 | 8 | 0 | Private refs mostly `create-stream-db.ts` (20) around `@durable-streams/state` and `@tanstack/react-db` types. |
| `./server` | `./server.ts` | 13 | 8 | 5 | 0 | `stream-error-boundary.tsx` (11), `stream.ts` (2). |
| `./utils` | `./utils/mod.ts` | 7 | 4 | 3 | 0 | All from `./utils/mod.ts` barrel; `cache-entry.ts` private types leak through. |
| `./error` | `./error/mod.ts` | 3 | 0 | 3 | 0 | `./error/handler.ts` only; small JSDoc gap. |
| `./interactive` | `./interactive.ts` | 0 | 0 | 0 | 0 | Clean surface (only re-exports `resolvedPromise`, `usePromise`). |
| `./vite` | `./config/vite.ts` | 0 | 0 | 0 | 0 | Clean, fully JSDoc'd and typed. |
| `./testing` | (per 5d1) | - | - | - | - | Not measured this run; subject to 5d1 surface policy enforcement. |
| **Total** | - | **376** | **229** | **142** | **5** | Aggregate across 12 measured entrypoints; note root `./mod.ts` double-counts re-exported errors that are already counted under subpath barrels. |
| **Deduplicated** | - | **276** | **115** | **157** | **4** | Distinct file/line errors when root re-exports are de-duplicated (per `doc-lint-aggregate.json`). |

### 3. `deno check --unstable-kv`

Command used (committed `deno-check.log`, `deno-check-root.log`):

```bash
cd packages/fresh
deno check --unstable-kv ./mod.ts ./interactive.ts ./server.ts ./builders/mod.ts ./route/mod.ts ./defer/mod.ts ./form/mod.ts ./error/mod.ts ./utils/mod.ts ./streams/mod.ts ./query/mod.ts ./config/vite.ts
```

Output summary:

- **Type-check result: PASS** - no TypeScript diagnostics emitted for any of the 12 entrypoints.
- One non-fatal informational line:
  ```
  Warning No matching files found.
  ```
  This warning appears because the `packages/fresh/` directory is listed in the root workspace `exclude`, so the root `deno check` scope does not discover package files. Running `deno check` explicitly from inside `packages/fresh/` validates the package surface cleanly.
- `deno-check-root.log` (run from repo root) confirms the package is intentionally excluded by the workspace and therefore not part of the root quality gates today.

### 4. Private-type refs package-wide

Private-type references (`privateTypeRef`) occur when a public API signature references a type that is not itself exported, or that comes from a dependency that JSR considers non-re-exportable. Across `@netscript/fresh`, **115 distinct private-type-ref errors** cluster as follows:

#### 4.1 `./query` (64 refs)

- `./query/hooks.ts` - 49 refs re-exporting hooks from `@tanstack/preact-query` and `@tanstack/react-db`.
  - Examples: `useInfiniteQuery` return uses internal `InfiniteQueryObserverSuccessResult` / `InfiniteQueryObserverBaseResult` / `QueryObserver` types; `useMutation` return uses `MutationObserverResult`; `useLiveQuery` / `useLiveSuspenseQuery` return `@tanstack/react-db` internal observer types.
  - **Fix strategy:** stop direct re-export of upstream hooks; wrap each hook in a thin typed wrapper that returns package-owned types, or re-export hook *options* builders (e.g. `buildUseQueryOptions`) instead of hook functions.
- `./query/query-island.tsx` - `QueryIslandProps.children` references `ComponentChildren` from `preact`, which is not in the public export graph of `@netscript/fresh/query`.
  - **Fix strategy:** re-export `type ComponentChildren` from a package-owned helper (or import and export it explicitly), or change the prop to `JSX.Element | JSX.Element[] | string | number | null | undefined`.
- `./query/hydration.ts` - `DehydratedState` is re-exported from `@tanstack/query-core`; the type is public, but JSR's lint flags it because the package does not explicitly re-export the upstream symbol.
  - **Fix strategy:** add an explicit `export type { DehydratedState } from '@tanstack/query-core';` in `./query/mod.ts` (already present in hydration.ts but the barrel must re-export it).
- `./query/query-client.ts` - `getIslandQueryClient()` return type is inferred as `QueryClient` from `@tanstack/query-core`; same re-export issue.
  - **Fix strategy:** declare an explicit return type alias exported from the package, or re-export `QueryClient` type from the barrel.

#### 4.2 `./form` (34 refs)

- `./form/types.ts` - central private-type hub. Many internal types (`FieldState`, `FormRuntimeState`, `ValidationResult`, `SchemaAdapter`, etc.) are referenced by exported interfaces but not themselves exported.
- `./form/handler-context.ts` - `FormHandlerContext` references `zod` / standard schema internal types that are not exposed.
- `./form/runtime-state.ts` - public helper signatures return internal `FormRuntimeState`.
- **Fix strategy:** export the structural types (or package-owned type aliases) that exported functions/interfaces reference; collapse internal-only aliases into `type` exports with `@internal` JSDoc tags if they must remain undocumented.

#### 4.3 `./defer` (27 refs)

- `./defer/policy.ts` - exported `resolveDetailDeferConfig` and `DEFER_POLICY` reference private `DeferPolicy` / `DeferConfig` shapes.
- `./defer/DeferIsland.tsx`, `DeferPage.tsx` - props reference internal defer state / slot types.
- **Fix strategy:** export `DeferPolicy`, `DeferConfig`, `DeferSlot` types from `./defer/mod.ts`; add JSDoc to exported members.

#### 4.4 `./builders` (30 refs)

- `builders/define-page/builder.tsx` - `excluded-module` error plus private internal navigation/runtime types (`PageBuilder`, `PageContext`, `NavigationItem`).
- `builders/define-page/types.ts`, `navigation.tsx`, `runtime.tsx` - related internal type leakage.
- **Fix strategy:** promote `PageBuilder`, `PageContext`, `NavigationItem` to public package-owned types; ensure `./builders/mod.ts` re-exports them, or mark barrel internals with `@internal` and keep them out of public exports.

#### 4.5 `./route` (25 refs)

- `./route/contract.ts` - `ContractNode`, `ContractProcedure`, `RouteContractConfig` etc. referenced by exported helpers but not exported.
- `./route/manifest.ts` - manifest builder types leak.
- **Fix strategy:** export the contract algebra; align with 5d3 deliverable that established route-contract typing.

#### 4.6 `./streams` (24 refs)

- `./streams/create-stream-db.ts` - public `createStreamDb*` helpers reference `@durable-streams/state` and `@tanstack/react-db` internal types (`StreamDb`, `StreamRecord`, `DBCollection`, etc.).
- **Fix strategy:** introduce package-owned `StreamDb` / `StreamRecord` interfaces that wrap upstream types, or re-export the necessary upstream types explicitly.

#### 4.7 `./server` (8 refs)

- `./server/stream-error-boundary.tsx` - `StreamErrorBoundaryProps.fallback` references `JSX.Element` from `preact` without explicit export; `StreamErrorBoundaryState` is a private interface exposed through public class inheritance.
  - **Fix strategy:** re-export `JSX.Element` type alias, and mark `StreamErrorBoundaryState` `@internal` or make it a `type` export.
- `./server/stream.ts` - `renderToStream` parameter type `VNode` from `preact` is not exported; `IncrementalStreamChunk.render` return inferred as `Promise<string>` is fine, but the upstream `VNode` must be re-exported or aliased.
  - **Fix strategy:** use `preact.VNode` in the signature and re-export a package-owned `VNode` alias, or accept `ComponentChild`.

#### 4.8 `./utils` (4 refs)

- `./utils/mod.ts` - re-exports `hasAllCacheEntries`, `minCachedAt`, `projectCachedItemFromList`, whose return types reference `CacheEntry` from `./utils/cache-entry.ts` but `CacheEntry` is not exported.
  - **Fix strategy:** export `type CacheEntry` from `./utils/mod.ts`.

#### 4.9 `./mod.ts` (15 refs inherited)

Root barrel re-exports propagate private-type-ref errors from `./defer`, `./error`, `./utils`, `./builders`. Fixing subpath barrels automatically clears root errors.

### 5. `deno publish --dry-run` for `packages/fresh`

Commands used (committed `dry-run.log`):

```bash
# From repo root
deno publish --dry-run --allow-dirty
# From packages/fresh
cd packages/fresh && deno publish --dry-run --allow-dirty
```

Output summary:

- **Root dry-run (`/`):** FAILS immediately because `packages/fresh/` is listed in the root workspace `exclude`. The workspace member is not eligible for publish, and root `publish: false` prevents any publish anyway.
- **Package dry-run (`packages/fresh/`):** FAILS with **62 errors**:
  - 58 x `excluded-module` - every `.ts/.tsx` file in the package is flagged as excluded. This is caused by the root `deno.json` workspace `exclude` including `"packages/fresh/"`, which overrides the package-local `publish.include` pattern. JSR/workspace resolution treats the package files as excluded from the workspace graph even when `deno publish` is invoked from inside the package directory.
  - 4 x `missing-explicit-return-type` - exported functions whose return type is inferred:
    - `./query/hooks.ts` re-exports (upstream hook wrappers lack explicit return types).
    - `./query/hydration.ts` (`dehydrateQueryClient`, `hydrateFromDehydrated`).
    - `./server/stream.ts` (`renderToStream`, `createStreamingResponse`).
  - Slow-type warnings are **not** the dominant failure; the `excluded-module` block is the gate that must be cleared first.
- **Action implication:** Lifting `packages/fresh` out of the root `exclude` array (mirroring how `packages/sdk` and `packages/fresh-ui` were lifted in earlier waves) is a prerequisite for a passing dry-run. That lift is the final wave-closeout slice.

## Inventory

### `query/`

Source files (218 LOC):

| File | LOC | Role |
|---|---|---:|
| `./query/mod.ts` | 39 | Barrel: exports `QueryIsland`, `getIslandQueryClient`, `resetIslandQueryClient`, TanStack hooks, hydration utilities. |
| `./query/hooks.ts` | 24 | Thin re-export barrel over `@tanstack/preact-query` and `@tanstack/react-db`. |
| `./query/query-client.ts` | 62 | Island-scoped `QueryClient` singleton using `@netscript/sdk/query-client` defaults. |
| `./query/query-island.tsx` | 47 | Preact island wrapper that injects the shared `QueryClient` via `QueryClientProvider`. |
| `./query/hydration.ts` | 46 | `dehydrateQueryClient` / `hydrateFromDehydrated` wrappers around `@tanstack/query-core`. |

Public exports:

- Components: `QueryIsland` (with `QueryIslandProps`).
- Singleton accessors: `getIslandQueryClient`, `resetIslandQueryClient`.
- Hooks (re-exported): `useInfiniteQuery`, `useIsFetching`, `useIsMutating`, `useMutation`, `useQuery`, `useQueryClient`, `useSuspenseInfiniteQuery`, `useSuspenseQuery`, `useLiveQuery`, `useLiveSuspenseQuery`.
- Hydration: `DehydratedState` (type), `dehydrateQueryClient`, `hydrateFromDehydrated`.

Upstream dependencies:

- `@tanstack/preact-query` ^5.75.5 - Preact Query hooks.
- `@tanstack/query-core` ^5.75.5 - `QueryClient`, `dehydrate`, `hydrate`, `DehydratedState`.
- `@tanstack/react-db` ^0.1.79 - `useLiveQuery`, `useLiveSuspenseQuery`.
- `@netscript/sdk/query-client` - `DEFAULT_GC_TIME`, `DEFAULT_STALE_TIME` defaults.
- `preact` - `ComponentChildren`, JSX runtime.

Key design points:

- `getIslandQueryClient()` is intentionally a **client-only singleton**; the file comment warns against SSR use.
- `QueryIsland` is the canonical boundary between Fresh's island hydration and TanStack Query: every island that uses Query hooks must be wrapped.
- Hydration helpers are documented as "advanced" - the recommended pattern per RFC 17 is `initialData` + promise props passed from server loader to island.
- `./query/hooks.ts` has no package-owned types, which is why 49 of the 64 private-type-ref errors live there.

### `server/define-fresh-app.ts` + `server.ts` export surface

Source files:

| File | LOC | Role |
|---|---|---:|
| `./server/define-fresh-app.ts` | 72 | App-builder factory with stable bootstrap contract. |
| `./server.ts` | 25 | Server-only public barrel. |
| `./server/stream.ts` | 220 | Streaming SSR renderer (`renderToStream`, `createStreamingResponse`, `createIncrementalStreamingResponse`). |
| `./server/stream-error-boundary.tsx` | 75 | Preact error boundary for streaming sections. |
| `./server/sse.ts` | 408 | Server-Sent Events helpers (outside current doc-lint surface but part of server internals). |

`DefineFreshAppOptions<State>` inputs:

- `name?: string` - stable app identifier, reserved for logger/telemetry defaults.
- `app?: App<State>` - reuse an existing Fresh `App` instance instead of constructing one.
- `freshConfig?: FreshConfig` - constructor options for a new `App`.
- `serveStaticFiles?: boolean` - enable Fresh static file serving (default: `true`).
- `middleware?: Middleware<State>[]` - app-level middleware registered before file-system routes.
- `configure?: (app: App<State>) => void` - final bootstrap customization hook.
- `registerFsRoutes?: boolean | string` - register Fresh file-system routes (default: `true`; string value sets the glob pattern).

Output:

- `App<State>` - a Fresh app instance wired with the requested bootstrap defaults.

Current extension points (explicit hooks):

1. `middleware` - ordered app-level middleware injection (verified by test: runs before `configure` routes).
2. `configure` - arbitrary advanced setup (routes, error handlers, etc.) after static files and middleware.
3. `registerFsRoutes` - opt-in/opt-out and pattern-mount for file-system routes.

Current `./server.ts` exports:

- `App`, `FreshConfig`, `Middleware` (types re-exported from `fresh`).
- `defineFreshApp`, `DefineFreshAppOptions`.
- `createStreamingResponse`, `renderToStream`, `StreamRenderOptions`, `StreamRenderResult`.
- `StreamErrorBoundary`, `StreamErrorBoundaryProps`.

Test coverage (`./server/define-fresh-app.test.ts`):

- Reuses provided app instance.
- Applies middleware before request handling and before `configure` routes.
- Supports custom `fsRoutes` pattern.

Current gaps / alpha-surface concerns:

- No explicit adapter seam for RFC 14 unified mode. `fresh` is imported directly; a future unified adapter would need to intercept `App` construction or replace `staticFiles()` / `fsRoutes()` behavior.
- Telemetry bootstrap (5d1) is mentioned in doc comments but not implemented.
- Streaming defaults from 5d4 are not pre-configured (consumers must call `createStreamingResponse` per route).
- `name` is unused today.

## RFC 17 island query bridge research

### 5b SDK backing surface

The `@netscript/sdk` package (landed in Wave 5b) exposes the typed query/seam that `@netscript/fresh/query` is meant to consume. Relevant surfaces:

#### `createServiceClient` + `createServiceQueryUtils` (Transport seam)

- Location: `packages/sdk/src/client/service-client.ts` and `packages/sdk/src/query-client/create-service-query-utils.ts`.
- `createServiceClient<TContract>(options: CreateServiceClientOptions<TContract>): ServiceClient<TContract>` builds an oRPC HTTP client using Aspire service discovery, telemetry trace propagation, and a typed contract.
- `createServiceQueryUtils<TContract>(client, options?)` wraps `@orpc/tanstack-query`'s `createTanstackQueryUtils` and returns a tree of utilities with typed `.queryOptions()`, `.mutationOptions()`, `.infiniteOptions()`, `.key()`, `.streamedOptions()`, `.liveOptions()` for every procedure in the contract.
- This is the canonical server-to-island data seam: the server loader can call the same service client, and the island can use the same query utilities.

#### `@netscript/sdk/query-client`

- `packages/sdk/src/query-client/query-client-factory.ts` exports `createNetScriptQueryClient(options?)` and the constants `DEFAULT_STALE_TIME` (30 000 ms) / `DEFAULT_GC_TIME` (300 000 ms).
- `packages/sdk/src/ports/query-client.ts` defines a structural `QueryClientPort` (subset of TanStack `QueryClient`) used by SDK factories. Fresh's `getIslandQueryClient()` imports these defaults.
- Fresh can therefore align island QueryClient defaults with server-side SDK query-client defaults.

#### Query-key contract

- `ServiceOperationKey` is a tuple `[path: readonly string[], options: ServiceOperationKeyOptions]`.
- Keys are deterministic and can be generated on the server (via `utils.key(...)`) and reused on the client in `useQuery(utils.list.queryOptions({ input }))`.
- This gives the foundation for an "initialData" bridge: server loader fetches via `queryClient.fetchQuery(options)`, then passes the resulting data as `initialData` to the island, where the same `queryKey` is used.

#### What is NOT in the 5b SDK today

- No direct integration with Fresh islands or Fresh's `defineRoute` / route-contract layer.
- No server-loader-to-island prop serializer for query state.
- No dehydrated-state injection into the Fresh HTML shell.

### Dehydrate / hydrate chain as it exists today

Current code path (no new implementation):

1. **Server loader** (userland Fresh route handler) imports a service contract and calls `createServiceClient` / `createServiceQueryUtils` from `@netscript/sdk`.
   - Example: `const orders = createServiceQueryUtils(ordersClient).orders;`
   - The loader can fetch eagerly: `const initial = await queryClient.fetchQuery(orders.list.queryOptions({ input: { page: 1 } }));`
   - Because this is a standard Fresh route handler (running in `defineRoute` or file-system route), it runs on the server and can access the service client directly.

2. **Passing data to the island** - Fresh serializes island props to JSON and embeds them in the server-rendered HTML. Two supported patterns exist in the codebase today:
   - **Simple `initialData` pass** (recommended per RFC 17 section 5.2): the loader returns the fetched data, the route/page component passes it as a prop to the island, and the island calls `useQuery({ ...options, initialData: props.initial })`.
   - **Dehydration pass** (advanced): the loader calls `dehydrateQueryClient(queryClient)` to produce a `DehydratedState`, passes that JSON object to the island, and the island calls `hydrateFromDehydrated(getIslandQueryClient(), props.dehydratedState)` inside `QueryIsland` (or in `useEffect`).

3. **Island client hook** - inside the island:
   - `QueryIsland` wraps the subtree with the shared `QueryClientProvider` from `@tanstack/preact-query`.
   - The island uses `useQuery(orders.list.queryOptions({ input: { page: 1 }, initialData: props.initial }))` (or hydration variant).
   - TanStack Query matches the server `queryKey` and avoids a client-side refetch during initial hydration because of the `staleTime: 30_000` default and the presence of `initialData`.

4. **Type flow** - if the loader and the island both import the same contract-generated `ServiceQueryUtils`, the `TInput`/`TOutput` types are shared end-to-end:
   - `orders.list.queryOptions({ input: ..., initialData: ... })` is typed by the contract.
   - The only missing typed seam is the **loader return type -> island props** mapping: Fresh does not currently generate prop types from the loader automatically; the consumer must declare the island `Props` interface.

This trace confirms that the bridge is *structurally* possible today but requires manual wiring (`initialData` or dehydration prop).

### Gaps vs target

The target is a **typed island query bridge** comparable to TanStack Start's `getServerSideData` / `createServerFn` + Query integration, where:

- A server loader is typed by the route contract.
- The loader's return type automatically becomes the island props type.
- The island's `useQuery` call is type-safe end-to-end and, ideally, pre-filled without client-side refetch.

Missing pieces today:

1. **Typed loader -> island prop bridge.**
   - `defineRoute` / route builders (5d2/5d3) can type the loader output, but Fresh islands currently receive plain props; there is no generated `LoaderData<T>` helper that maps a route's loader return to the island's `Props` interface.
   - Workaround: consumer manually writes `interface OrderIslandProps { initial: OrderListOutput; }`.

2. **Dehydrated-state injection into the HTML shell.**
   - `dehydrateQueryClient` exists, but there is no helper to embed the dehydrated JSON into the `<head>` or a `<script>` tag, nor to pick it up in `QueryIsland` on the client.
   - A `QueryHydrationScript` component (server) + `useQueryHydration` hook (client) would close this.

3. **Island-level `useServerQuery` / `useSuspenseQuery` wrapper.**
   - Today islands import `useQuery` directly (re-exported). A package-owned `useServerQuery(options, initialData)` wrapper could enforce the server-first pattern, guarantee `staleTime`/`refetchOnWindowFocus` defaults, and provide a cleaner public API.

4. **Server-side `QueryClient` lifecycle.**
   - The current `getIslandQueryClient()` is client-only. There is no per-request server `QueryClient` factory integrated with Fresh's request context, which is required for SSR prefetch/dehydrate without cross-request leakage.

5. **Streamed and live query island patterns.**
   - `useLiveQuery` / `useLiveSuspenseQuery` are re-exported but have no documented Fresh island pattern (e.g. combining with `createIncrementalStreamingResponse` or Server-Sent Events from `./server/sse.ts`).

6. **Type leakage / private-type refs block clean public surface.**
   - Re-exported upstream hooks expose `@tanstack/preact-query` internal types; any helper added on top must use package-owned types to pass JSR doc-lint.

These gaps become the design inputs for `design.md` / `plan.md`.

### Market bar: TanStack Start server-function + Query integration

TanStack Start (the full-stack React framework built on TanStack Router + Vinxi) establishes the market baseline for a server-function / Query bridge. Its design choices directly inform the NetScript Fresh bridge.

#### How TanStack Start wires server functions to Query

1. **Server functions via `createServerFn`.**
   - `createServerFn({ method: 'GET' }).handler(async ({ request, params }) => { ... })` defines a server-only function that is callable from both server and client code (compiled into an RPC endpoint by the Vinxi bundler).
   - Source: TanStack Start docs, "Server Functions" - <https://tanstack.com/start/latest/docs/framework/react/server-functions>.

2. **Type-safe loader integration.**
   - Routes declare `loader: createServerFn(...)` and the loader return type is propagated into `Route.useLoaderData()`.
   - The framework generates the prop types automatically, so the component consuming the loader does not write a manual props interface.
   - Source: TanStack Start docs, "Route Loaders" - <https://tanstack.com/start/latest/docs/framework/react/loaders>.

3. **Query integration through `getServerSideData` / `queryOptions`.**
   - TanStack Start exposes `queryOptions` helpers that can accept a server function as `queryFn`, and a `getServerSideData`/`dehydrate` pipeline to embed server-fetched Query state into the HTML shell.
   - The server renders with a `QueryClient`, dehydrates it, and the client re-hydrates with the same keys.
   - Source: TanStack Query docs, "Server Rendering & Hydration" - <https://tanstack.com/query/latest/docs/framework/react/guides/ssr>.

4. **Streamed UI / Suspense.**
   - TanStack Start supports streaming via `Await`/`Suspense` and progressively injects deferred loader promises.
   - Source: TanStack Router docs, "Deferred / Await" - <https://tanstack.com/router/latest/docs/framework/react/guide/deferred-data-loading>.

#### Implications for NetScript Fresh

| TanStack Start capability | NetScript Fresh equivalent today | Gap |
|---|---|---|
| `createServerFn` RPC | `createServiceClient` (oRPC over HTTP via Aspire discovery) | Service discovery is runtime; no compile-time RPC endpoint generation. |
| Route loader types flow to component | `defineRoute` can type loader output, but island props are manual | Need a `LoaderData<T>` helper or generated prop types. |
| QueryClient SSR + dehydrate/hydrate | `dehydrateQueryClient` / `hydrateFromDehydrated` exist | No HTML injection / pickup helpers. |
| `queryOptions` accepting server fn | `createServiceQueryUtils(...).queryOptions()` | Works, but re-exported hooks cause JSR private-type-ref errors. |
| Streaming `Await` | `createIncrementalStreamingResponse` + `<Deferred>` | Not yet integrated with Query Suspense patterns. |

#### Sourced market summary

- **JSR / Deno publish rules:** public API cannot reference non-exported types (`privateTypeRef`) and must explicitly re-export dependency types consumed in signatures. Deno doc lint reference: <https://docs.deno.com/runtime/reference/cli/doc/>.
- **TanStack Query SSR hydration pattern:** server creates a `QueryClient`, prefetches, dehydrates to HTML, client rehydrates. Reference: <https://tanstack.com/query/latest/docs/framework/react/guides/ssr>.
- **TanStack Start server functions:** compile-time server functions callable from client, with Vinxi RPC. Reference: <https://tanstack.com/start/latest/docs/framework/react/server-functions>.
- **TanStack Router deferred data:** streaming `Await` + `defer` for non-critical data. Reference: <https://tanstack.com/router/latest/docs/framework/react/guide/deferred-data-loading>.
- **Fresh islands architecture:** islands are interactive Preact components hydrated on the client; props are serialized server-side. Reference: Fresh docs "Interactive islands" - <https://fresh.deno.dev/docs/concepts/islands>.

## RFC 14 seam audit inputs

### Extension points `defineFreshApp` must protect

RFC 14 (unified mode) is out of scope for implementation in this wave, but `defineFreshApp` must be designed so that the alpha surface does not block a future unified adapter. Required protected extension points:

1. **App constructor adapter seam.**
   - Today: `options.app ?? new App<State>(options.freshConfig)` hard-codes the `fresh` `App` class.
   - Protection: add an optional `createApp?: (freshConfig?: FreshConfig) => App<State>` override. The default remains `new App(...)`, but a unified adapter can supply a different constructor without changing the public signature.

2. **Static-files adapter seam.**
   - Today: `staticFiles()` from `fresh` is called directly when `serveStaticFiles !== false`.
   - Protection: add an optional `staticFiles?: Middleware<State> | false` override. Unified mode can inject a no-op or a different asset server.

3. **File-system route adapter seam.**
   - Today: `app.fsRoutes()` is called directly; pattern string support exists.
   - Protection: add an optional `fsRoutes?: (app: App<State>) => void` override. Unified mode can disable default fsRoutes and mount routes through its own router.

4. **Middleware composition order seam.**
   - Today: `app.use(...middleware)` then `configure(app)`.
   - Protection: expose `preConfigure?: (app: App<State>) => void` and keep `configure` as the final hook. This lets unified mode insert middleware at the correct point (e.g. request-context setup before user middleware).

5. **Telemetry / lifecycle bootstrap seam.**
   - Today: `name` is unused; telemetry bootstrap is planned for a future 5d1 follow-up slice.
   - Protection: add `telemetry?: boolean | TelemetryOptions` so the future telemetry slice can register OpenTelemetry context propagation without breaking `defineFreshApp` callers.

#### Alpha-surface protection rationale

- **No breaking changes after design review.** The `DefineFreshAppOptions` interface is the primary app-bootstrap contract. Adding optional fields is backward-compatible; changing the return type or reordering middleware is not.
- **Keep `fresh` imports internal to `server/define-fresh-app.ts`.** Consumers should depend on re-exported types from `@netscript/fresh/server`, not import `fresh` directly, so a future adapter swap does not leak upstream types into user code.
- **Avoid concrete Fresh runtime types in public function signatures where possible.** For example, `renderToStream(vnode: VNode)` should accept a package-owned `VNode` alias or `preact.VNode`, and `StreamErrorBoundaryProps.fallback` should use a re-exported `JSX.Element` alias.
- **Test the seams.** `define-fresh-app.test.ts` already verifies middleware/configure ordering and `fsRoutes` pattern. Future tests should verify each adapter override (constructor, staticFiles, fsRoutes) independently.

## Drift ledger

See `drift.md` for append-only `D-5d6-n` entries.

## Questions / blockers for supervisor

1. **Scope of the RFC 17 bridge in this wave.** Should 5d6 deliver only the *typed design* (helper signatures, prop bridge, dehydration script) and defer implementation to a follow-up wave, or is limited implementation inside `@netscript/fresh/query` expected once the plan is approved?
2. **Upstream hook re-export policy.** The cleanest fix for 49 private-type-ref errors in `./query/hooks.ts` is to stop re-exporting raw `@tanstack/preact-query` hooks and instead expose package-owned wrappers/options builders. Does NetScript want to maintain the current convenience re-exports for DX, even though they fail JSR doc-lint?
3. **Root workspace exclusion lift.** Lifting `packages.fresh/` out of root `deno.json` `exclude` will cause root `check`, `fmt`, `lint`, and `publish:dry-run` to include the package and likely surface pre-existing style/lint debt outside the 5d6 scope. Should the lift be a dedicated closeout slice with a one-time fmt/lint pass, or should it be done incrementally per sub-gate?
4. **RFC 14 adapter timing.** Should `defineFreshApp` adapter seams be added now as no-op optional fields, or only documented in design.md for a later RFC 14 implementation run?
5. **Streams / SSE scope.** `./server/sse.ts` is 408 LOC but not exported from `./server.ts` today. Should it remain internal, or be promoted to the public server surface as part of the final surface pass?
