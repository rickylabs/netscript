# 5d6 PLAN-phase design — `./query` + `./server` + final package surface

Run: `openhands/pr-39/run-27467331167-1` · Branch: `feat/package-quality-wave5-apps-5d6-query`
Scope: **PLAN ONLY** — design decisions, final surface policy, and RFC seam protection. Zero implementation.

---

## Reuse statement

All MEASURE-FIRST numbers come from the committed run artifacts in this directory. No new `deno doc --lint`, `deno check`, or `deno publish --dry-run` was executed.

- `research.md` (430 lines) — baseline inventory, private-type-ref clusters, RFC 17/14 analysis, market comparison.
- `doc-lint-aggregate.json` — 276 distinct errors across 12 entrypoints: 115 `privateTypeRef`, 157 `missingJSDoc`, 4 other.
- Per-module `doc-lint-*.log` files — file-level diagnostics; largest surfaces: `./query/mod.ts` (~83 KB), `./config/vite.ts` (~38 KB), `./form/mod.ts`, `./defer/mod.ts`, `./streams/mod.ts` (~28–32 KB each).
- `dry-run.log` — 62 errors: 58 `excluded-module` caused by root workspace `exclude`, 4 `missing-explicit-return-type`.
- `drift.md` — existing `D-5d6-1` through `D-5d6-6` retained and extended below.

---

## Design goals

1. **RFC 17 typed island query bridge** — define a server-loader → island-props → client-hook seam that is type-safe end-to-end over the 5b SDK `createServiceClient` / `createServiceQueryUtils` factories, without leaking upstream `@tanstack/preact-query` private types into the public JSR surface.
2. **`defineFreshApp` extension points** — protect the alpha bootstrap surface for a future RFC 14 unified adapter by adding backward-compatible optional seams (constructor, static files, file-system routes, pre-configure hook, telemetry bootstrap) while keeping the existing public return type `App<State>` stable.
3. **Final package surface (F-16)** — lock the 13 entrypoints, enforce the curated root-barrel policy, eliminate remaining private-type-refs package-wide, and clear the over-cap file list.
4. **Wave closeout** — lift `packages/fresh` out of root workspace `exclude`, get combined doc-lint to 0, pass `deno publish --dry-run` including slow types, add Aspire/consumer-import runtime proof, and include `packages/fresh` in the root quality-gate excludes-union.

---

## 1. RFC 17 typed island query bridge

### 1.1 Principles

- **Do not re-export raw upstream hooks.** `@tanstack/preact-query` and `@tanstack/react-db` hook return types expose internal observer/result types that JSR flags as `privateTypeRef`. The public `@netscript/fresh/query` surface will expose package-owned wrappers/options builders instead.
- **Prefer `initialData` over full dehydration for the 80% path.** Fresh already serializes island props to JSON. Passing `initialData` from the server loader matches TanStack Start's `getServerSideData` pattern with the least machinery.
- **Dehydration helpers remain for advanced cases** but are promoted through a `QueryHydrationScript` component that emits/picks up `DehydratedState` from the HTML shell.
- **Type flow is the contract.** The server loader and the island both import the same contract-generated `ServiceQueryUtils`. The only bridge type we add is a helper that maps a loader-return shape to island props (`IslandData<TLoader>`).

### 1.2 Public surface design

```text
@netscript/fresh/query exposes:

- QueryIsland            (component)
- QueryIslandProps       (type)
- getIslandQueryClient   () => QueryClient
- resetIslandQueryClient () => void

- createQueryOptionsFor  (contract utils helper — design TBD with supervisor)
- useIslandQuery         (package-owned hook wrapper)
- useIslandMutation      (package-owned hook wrapper)
- useIslandInfiniteQuery (package-owned hook wrapper)
- QueryOptions           (package-owned options type alias)
- MutationOptions        (package-owned options type alias)
- InfiniteQueryOptions   (package-owned options type alias)

- DehydratedState        (type alias over @tanstack/query-core)
- dehydrateQueryClient   (queryClient) => DehydratedState
- hydrateFromDehydrated  (queryClient, DehydratedState) => void
- QueryHydrationScript   (component that emits <script type="application/json">)
- HydrationBoundary      (component that reads the script on the client)

- VNode / ComponentChild alias if needed for JSX signatures (see §3)
```

### 1.3 Server-loader → island-props type bridge

Design two small type helpers rather than runtime magic:

```ts
// From @netscript/fresh/query (types only)
export type LoaderData<TLoader extends (...args: any[]) => any> =
  Awaited<ReturnType<TLoader>>;

export type InitialDataFor<TQueryOptions extends { queryKey: unknown; initialData?: unknown }> =
  TQueryOptions["initialData"];
```

Usage in user code:

```ts
// routes/orders.tsx
import { defineRoute } from "@netscript/fresh/route";
import { ordersUtils } from "~/services/orders.ts";

export default defineRoute({
  async loader({ request }) {
    const initial = await ordersUtils.list.queryOptions({ input: { page: 1 } }).queryFn();
    return { initial };
  },
  component({ data }) {
    return <OrderIsland initial={data.initial} />;
  },
});

// islands/OrderIsland.tsx
import type { LoaderData } from "@netscript/fresh/query";
import { ordersLoader } from "~/routes/orders.tsx";

interface OrderIslandProps {
  initial: LoaderData<typeof ordersLoader>["initial"];
}
```

This keeps Fresh's prop-serialization model intact while giving consumers a typed mapping helper.

### 1.4 Dehydration flow (advanced path)

For consumers who want full QueryClient dehydration instead of per-island `initialData`:

1. Server loader creates a per-request `QueryClient` via `createNetScriptQueryClient()` from `@netscript/sdk/query-client`.
2. Server prefetches via `queryClient.fetchQuery(...)`.
3. Server calls `dehydrateQueryClient(queryClient)` to produce `DehydratedState`.
4. Server renders `<QueryHydrationScript state={dehydratedState} />` inside `<head>`.
5. Island (client-side) renders inside `<QueryIsland>`.
6. `HydrationBoundary` reads the `<script>` tag, calls `hydrateFromDehydrated(getIslandQueryClient(), state)`.

This is explicitly the advanced path; the recommended path remains `initialData`.

### 1.5 `createQueryFactories` + `createServiceClient` Transport seam

The 5b SDK gives NetScript a typed service client and a query-utils tree:

```ts
import { createServiceClient, createServiceQueryUtils } from "@netscript/sdk";

const ordersClient = createServiceClient<OrdersContract>({ service: "orders" });
const ordersUtils = createServiceQueryUtils(ordersClient);
```

`@netscript/fresh/query` does **not** wrap these; it consumes them. The design decision is:

- `@netscript/sdk` owns the Transport seam and contract algebra.
- `@netscript/fresh/query` owns the **island-scoped consumption layer**: singleton `QueryClient`, hydration, and package-owned hook signatures that take the SDK's `.queryOptions()` / `.mutationOptions()` output.

This split preserves layering: Fresh depends on SDK, not vice versa.

### 1.6 Hook wrapper strategy to retire 49 upstream private-type-ref errors

Replace `./query/hooks.ts` direct re-exports with thin typed wrappers:

```ts
// query/hooks.ts
import {
  useQuery as useTanstackQuery,
  useMutation as useTanstackMutation,
  useInfiniteQuery as useTanstackInfiniteQuery,
  // ...
} from "@tanstack/preact-query";
import type {
  UseQueryOptions,
  UseMutationOptions,
  UseInfiniteQueryOptions,
  // package-owned aliases over @tanstack/query-core types
} from "./query-types.ts";

export function useIslandQuery<TOutput, TError, TData = TOutput>(
  options: UseQueryOptions<TOutput, TError, TData>,
): QueryObserverResult<TData, TError> { // package-owned return alias
  return useTanstackQuery(options);
}
```

Return types are explicit package-owned aliases or direct re-exports of upstream public result types that are themselves exported from `@tanstack/query-core`. If a return type is still private, the wrapper narrows to a package-owned subset (e.g., `{ data; error; isLoading; isSuccess; isError; status }`).

**Open decision for supervisor:** Do we keep backward-compatible aliases `useQuery`, `useMutation`, etc. that simply delegate to `useIslandQuery`? The plan assumes yes, gated behind a slice that verifies no `privateTypeRef` regression.

---

## 2. `defineFreshApp` extension points / alpha-surface protection

### 2.1 Current contract

```ts
export interface DefineFreshAppOptions<State> {
  name?: string;
  app?: App<State>;
  freshConfig?: FreshConfig;
  serveStaticFiles?: boolean;
  middleware?: Middleware<State>[];
  configure?: (app: App<State>) => void;
  registerFsRoutes?: boolean | string;
}

export function defineFreshApp<State>(
  options?: DefineFreshAppOptions<State>,
): App<State>;
```

### 2.2 Proposed optional seams (backward-compatible)

```ts
export interface DefineFreshAppOptions<State> {
  // ... existing fields ...

  /** Adapter seam: replace `new App<State>()` construction. */
  createApp?: (freshConfig?: FreshConfig) => App<State>;

  /** Adapter seam: override static-files middleware. `false` disables it. */
  staticFiles?: Middleware<State> | false;

  /** Adapter seam: override file-system route mounting. */
  fsRoutes?: (app: App<State>, pattern?: string) => void;

  /** Lifecycle hook called before middleware/static/fsRoutes; for adapter setup. */
  preConfigure?: (app: App<State>) => void;

  /** Telemetry bootstrap seam; `true` uses defaults, object enables configuration. */
  telemetry?: boolean | TelemetryOptions;
}
```

Default behavior is unchanged:

```ts
options.preConfigure?.(app);
if (options.app) app = options.app;
else app = options.createApp?.(options.freshConfig) ?? new App<State>(options.freshConfig);
if (options.staticFiles !== false) app.use(options.staticFiles ?? staticFiles());
if (options.middleware) app.use(...options.middleware);
if (options.registerFsRoutes !== false) {
  const pattern = typeof options.registerFsRoutes === "string" ? options.registerFsRoutes : undefined;
  options.fsRoutes?.(app, pattern) ?? app.fsRoutes(pattern);
}
options.configure?.(app);
```

### 2.3 RFC 14 unified-mode protection rationale

- `createApp` lets a unified adapter inject a different `App` implementation.
- `staticFiles` lets unified mode serve assets through its own asset pipeline.
- `fsRoutes` lets unified mode disable Fresh's file-system router and mount routes via the unified router.
- `preConfigure` gives the adapter a guaranteed insertion point before user middleware.
- `telemetry` reserves a field for the 5d1 telemetry bootstrap slice without a later signature change.

All additions are optional; existing callers compile without modification.

### 2.4 Server.ts export audit

Current `./server.ts` exports are retained; additions are limited to types required by the new seams:

```text
@netscript/fresh/server exports:

- App, FreshConfig, Middleware (types from fresh)
- defineFreshApp, DefineFreshAppOptions
- createStreamingResponse, renderToStream, StreamRenderOptions, StreamRenderResult
- StreamErrorBoundary, StreamErrorBoundaryProps
- TelemetryOptions (new type, stub/alpha)
```

`./server/sse.ts` remains **internal** for this wave (see §5 Questions).

---

## 3. Final package surface (F-16) and private-type-ref retirement

### 3.1 F-16 entrypoint lock

The 13 sanctioned entrypoints (unchanged from umbrella plan):

| Entrypoint | Barrel | Status target |
|---|---|---|
| `.` | `mod.ts` | curated root, no kitchen-sink |
| `./server` | `server.ts` | clean |
| `./builders` | `builders/mod.ts` | clean |
| `./route` | `route/mod.ts` | clean |
| `./defer` | `defer/mod.ts` | clean |
| `./form` | `form/mod.ts` | clean |
| `./error` | `error/mod.ts` | clean |
| `./utils` | `utils/mod.ts` | clean |
| `./streams` | `streams/mod.ts` | clean |
| `./query` | `query/mod.ts` | clean |
| `./interactive` | `interactive.ts` | already clean |
| `./vite` | `config/vite.ts` | clean |
| `./testing` | `testing.ts` | per 5d1 |

### 3.2 Private-type-ref retirement map

| Cluster | Count | Resolution |
|---|---|---|
| `./query/hooks.ts` upstream re-exports | 49 | wrap hooks with package-owned signatures |
| `./query/query-island.tsx` | 2 | alias `ComponentChildren` / `VNode` |
| `./query/hydration.ts` | 2 | explicit return types, alias `DehydratedState` |
| `./query/query-client.ts` | 1 | explicit return type |
| `./server/stream-error-boundary.tsx` | 6 | alias `JSX.Element`, expose `StreamErrorBoundaryState` as type export or mark `@internal` |
| `./server/stream.ts` | 2 | explicit `renderToStream`/`createStreamingResponse` return types, alias `VNode` |
| `./utils/mod.ts` | 4 | export `type CacheEntry` |
| `./builders/mod.ts` / define-page | 21 | follow 5d2 design; export helper types, decompose over-cap files |
| `./defer/*` | 14 + inherited | follow 5d4 design; export policy types, move telemetry to shared convention |
| `./form/*` | 11 + inherited | follow 5d5 design; export public form types |
| `./streams/create-stream-db.ts` | 24 | wrap upstream types with package-owned `StreamDb` / `StreamRecord` interfaces |
| `./config/vite.ts` | 3 | export public config types |
| **Total distinct** | **115** | **0 after all slices** |

### 3.3 Over-cap files

Umbrella target: **0 over-cap files**. Files currently over the layer cap (per `docs/architecture/doctrine/09-anti-patterns-and-fitness-functions.md` F-1) include `server/sse.ts` (408 LOC) and several files above the 250-line guidance. The plan retires these by decomposition, not by suppressing the lint:

- `server/sse.ts` → split into `server/sse/` modules if promoted; if kept internal, refactor into `server/_internal/sse/`.
- `server/stream.ts` (220 LOC) → stays under cap; add explicit return types only.
- `query/*`, `defer/*`, `form/*` → resolved by the per-cluster slices.

### 3.4 Root barrel policy

`mod.ts` remains a **curated** re-export surface:

- Re-export only the primary public symbols from each subpath (not deep internals).
- No new public symbols are added at root in this wave.
- Root errors clear automatically once subpath barrels are clean.

---

## 4. RFC 14 seam audit conclusions

### 4.1 Seams to protect in `defineFreshApp`

See §2.2. The adapter seams are added as optional fields now so that the public `DefineFreshAppOptions` interface does not need a breaking change when RFC 14 is implemented.

### 4.2 Seams to protect in `./query`

- The bridge must not depend on a specific Fresh island serialization format. `initialData` and `QueryHydrationScript` are both JSON-serializable, so a unified mode can inject state through the same channels.
- Hook wrappers must depend only on `@tanstack/query-core` public types and the 5b SDK contract, not on Fresh-specific types.

### 4.3 Seams to protect in server streaming

- `renderToStream` should accept a package-owned `VNode` alias or `preact.VNode` so that a future adapter can swap the renderer without changing consumer call sites.
- `StreamErrorBoundaryProps.fallback` should use a re-exported `JSX.Element` alias.

### 4.4 What is NOT implemented

RFC 14 unified mode itself is **out of scope**. Only the alpha-surface protection is delivered: optional seams, type aliases, and documented extension points.

---

## 5. Questions / blockers for supervisor

1. **Hook re-export policy.** Should we keep convenience aliases `useQuery`, `useMutation`, etc. that delegate to `useIslandQuery`? Keeping them improves DX but requires extra verification that they do not reintroduce `privateTypeRef`.
2. **Dehydration implementation scope.** Is `QueryHydrationScript` + `HydrationBoundary` in scope for 5d6 implementation, or should the plan expose only the type contract and defer components to a follow-up wave?
3. **Root workspace exclusion lift.** Confirm that 5d6 closeout owns the one-time lift of `packages/fresh` from root `deno.json` `exclude` and the resulting root fmt/lint/check pass.
4. **SSE public surface.** Should `./server/sse.ts` be promoted to `@netscript/fresh/server` exports, or remain internal for this wave?
5. **`createQueryFactories` wrapper.** Does `@netscript/fresh/query` need a thin `createQueryFactories(contract, transportOptions)` helper, or should consumers import `createServiceClient` / `createServiceQueryUtils` directly from `@netscript/sdk`?
6. **Telemetry options shape.** Is the `telemetry?: boolean | TelemetryOptions` seam sufficient, or should we align with a specific 5d1 telemetry config schema now?

---

## 6. Risk register

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Wrapping all upstream hooks still leaks a private observer type | medium | high | Use package-owned result subsets; test with `deno doc --lint` per slice. |
| R2 | Lifting root workspace exclusion surfaces legacy fmt/lint debt | high | medium | Scope the lift to its own closeout slice; use `.llm/tools/run-deno-*.ts` with explicit excludes. |
| R3 | `defineFreshApp` optional seams change default behavior | low | high | Add unit tests verifying defaults; no implementation of adapter logic. |
| R4 | Over-cap `server/sse.ts` decomposition grows slice count | medium | medium | Keep SSE internal unless supervisor promotes it. |
| R5 | Cross-cluster private-type-refs in `./builders`/`./defer`/`./form` depend on prior 5d2–5d5 landings | medium | high | Plan explicitly lists dependencies and re-measure points. |

---

## 7. Design checkpoint

- [x] RFC 17 bridge typed from server loader through island props to client hook.
- [x] Hook wrapper strategy chosen to retire upstream `privateTypeRef` errors.
- [x] `defineFreshApp` extension points documented and backward-compatible.
- [x] RFC 14 seams audited; only alpha-surface protection in scope.
- [x] F-16 entrypoints locked; root barrel policy defined.
- [x] Private-type-ref retirement map traces each cluster to a resolution.
- [x] Risk register and supervisor questions captured.
