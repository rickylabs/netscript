# S1 — Page-builder API inventory for per-API deep-dive sub-pages

Run: `docs-mainpages--orchestrator` / slice `p3-1210` (NetScript #1210 phase 3, docs deep-dives).
Analysis-only. Source of truth: `/home/codex/repos/ns-tutsweep` (`docs/tutorials-sweep`; `packages/` is
unmodified vs `main`). Every symbol below was read from `packages/**` source or `deno doc` output —
no symbol is quoted from memory.

Verification commands used:

```bash
cd packages/fresh && deno doc --json ./src/application/{builders,route,query,form,defer}/mod.ts
# plus direct reads of the barrels and builder/runtime implementation files listed per section
```

---

## 0. Verified API surface (ground truth)

### 0.1 `@netscript/fresh/builders`

Barrel: `packages/fresh/src/application/builders/mod.ts`. Three runtime functions only:

| Symbol | Signature (verbatim from barrel) |
| --- | --- |
| `definePage` | `definePage<TState = EmptyRecord>(): PageRootBuilder<TState>` |
| `definePartial` | `definePartial<TProps extends object, TContext, THandler = undefined>(options: DefinePartialOptions<TProps, TContext, THandler>): DefinedPartialRoute<TContext, THandler>` |
| `defineStatsPartial` | `defineStatsPartial<TProps extends object, TContext, THandler = undefined>(options: DefineStatsPartialOptions<TProps, TContext, THandler>): DefinedPartialRoute<TContext, THandler>` |

Plus `export type * from './define-page/page-compat.ts'` and
`InferDefinePageLayerLoaderProps`.

**The real builder chain** — enumerated from
`packages/fresh/src/application/builders/define-page/builder/mod.tsx` (line numbers are current
`main`). This is the authoritative list; there are **19** chain methods plus `createNav` and `build`:

| Method | Impl line | Effect on config |
| --- | --- | --- |
| `withResource(key, factory)` | 206 | appends one `RuntimeResourceDescriptor` to `config.resources` |
| `withResources(factories)` | 221 | `Object.entries(factories)` → many descriptors appended in object order |
| `withParams({ path?, search? })` | 239 | sets both `pathSchema` and `searchSchema` |
| `withPathParams(schema)` | 265 | sets `pathSchema` |
| `withSearchParams(schema)` | 276 | sets `searchSchema` |
| `withRoute(route)` | 448 | promotes `THasConfiguredRoute → true` via `promoteRouteConfig` |
| `withRouteContract(contract)` | 454 | promotes to routed via `promoteRouteContractConfig` |
| `withPolicy(policy)` | 289 | sets `config.policy` |
| `withTelemetry(telemetry)` | 292 | sets `config.telemetry` |
| `withLayer(id, component, layerConfig?)` | 295 | appends `RuntimeLayerDescriptor`; third arg is a loader **or** a `{ loader }` config (`resolveLayerConfig`) |
| `withForm(id, component, formConfig)` | 313 | appends a layer **and** a method handler **and** a CSRF header resolver **and** sets `config.form` |
| `withHandler(method, handler)` | 388 | sets `config.handlers[method]` |
| `withLayout(layout)` | 397 | sets `config.layout` |
| `withMeta(resolver)` | 400 | sets `config.meta` |
| `withHeader(nameOrHeadersOrResolver, value?)` | 403 | appends a header descriptor (3 overload shapes) |
| `withStatus(status)` | 416 | sets `config.status` |
| `withStreaming()` | 419 | sets `config.streaming = true` |
| `createNav(routePattern?)` | 425 | returns a typed nav helper |
| `build()` / `build(pattern)` / `build(options)` | 430–447 | 3 overloads; unrouted vs routed result |

Guard rails encoded in the builder (`builder/mod.tsx` 135, 169, 176) — these are documentable
failure modes, quoted verbatim:

- `'definePage() cannot combine withHandler("GET") with withStreaming().'`
- `'definePage() cannot combine withHandler("GET") with withHeader() or withStatus().'`
- `'definePage() requires ctx.render() when withHeader() or withStatus() is used.'`

**Not builder methods** (a live docs trap — `withPartial` reads like one):

- `withPartial(partialRoute)` is on `PageRouteReference`
  (`page-compat/route-types.ts:213`), i.e. `route.withPartial(...)`, returning
  `PagePairedRouteTarget` with `href()`, `partialHref()`, `getLinkProps()` →
  `PagePartialLinkProps` carrying `'f-partial'`.
- `withFormSpan` is internal telemetry (`form/runtime/telemetry.ts`), used by
  `builder/form-support.ts`. Not public.

**Resource resolution semantics** — `define-page/runtime/handlers.ts:33–64`, verbatim structure:

```ts
const resourceStore: Record<string, unknown> = {};
const resources = resourceStore as DefinePageResourcesOf<TTypes>;
const baseRuntimeCtx = createRuntimeContextBase(ctx, config, resources, controller.signal, path, search);
for (const descriptor of config.resources) {
  resourceStore[descriptor.key] = await withOptionalSpan(
    config, `page.resource.${descriptor.key}`,
    { 'page.route': ctx.url.pathname, 'page.resource.key': descriptor.key },
    async () => await descriptor.factory(runtimeCtx),
  );
}
```

The load-bearing facts for the docs:

1. Path/search parse **first**, then resources, then layers. One pass per request.
2. Resources resolve **sequentially in declaration order**, each awaited, each into a **shared
   store** — so resource *N* can read resources 1..N-1 through `ctx.resource(key)`
   (`runtime/context.ts:112` `resolveResource` throws on an unknown key; `context-types.ts:126-129`
   types `resources` and `resource<TKey>(key)`).
3. That shared store **is** the request-scoped dedup: a session/tenant/user fetched once as a
   resource is visible to every layer loader and to the layout, with no second fetch and no prop
   drilling.
4. Every resource is individually span-wrapped as `page.resource.<key>`, so dedup is *observable*.
5. Layers refine on top: `withLayer(id, Component, loader)` loaders receive the same context and
   return that layer's props. Resources = shared, layers = per-region refinement.

### 0.2 `@netscript/fresh/route`

Barrel `packages/fresh/src/application/route/mod.ts` — 7 runtime exports plus `export type * from
'./types.ts'`:

`createRouteReference(routePattern, metadata?)`, `bindRoutePattern(contract, routePattern,
metadata?)`, `defineRouteContract(options = {})`, `enumPathParamSchema(paramName, values)`,
`defineEnumPathParam(paramName, values)`, `fallback(schema, defaultValue)` → `z.ZodCatch<TSchema>`,
`paginationSearchSchema(options = {})`.

`defineRouteContract` returns `{ pathSchema, searchSchema, createNav, bind, parsePath,
safeParsePath, parseSearch, safeParseSearch }`. `PageRouteReference` additionally carries `nav`,
`$href`, `href()`, `getLinkProps()`, a bound `Link` component, and `withPartial()`.

Navigation hooks (`define-page/navigation/`): `usePagePath`, `usePageRoute`, `usePageSearch`,
`createDefinePageHooks`, plus `useCurrentRoute/useCurrentPath/useCurrentSearch`,
`useDefinePageContext/State/Resources/Resource/Layers/Layer/Slots`,
`useRequiredDefinePageLayer`, `getLinkProps`, `getBoundLinkProps`, `Link`, `createRouteNav`.

`defineEnumPathParam` and `fallback` are **undocumented today** (see §2).

### 0.3 `@netscript/fresh/query`

Barrel `packages/fresh/src/application/query/mod.ts`. 15 hooks in `hooks.ts`:

- island-namespaced: `useIslandQuery`, `useIslandSuspenseQuery`, `useIslandInfiniteQuery`,
  `useIslandSuspenseInfiniteQuery`, `useIslandMutation`
- canonical aliases: `useQuery`, `useSuspenseQuery`, `useInfiniteQuery`,
  `useSuspenseInfiniteQuery`, `useMutation` (`useQuery` is literally
  `return useIslandQuery(options)`, `hooks.ts:186-190`)
- ambient: `useQueryClient`, `useIsFetching`, `useIsMutating`
- live: `useLiveQuery(queryFactory, deps?)`, `useLiveSuspenseQuery(...)` → `IslandLiveQueryResult`
  with `{ data, status?, details }`

Provider/client: `QueryIsland`, `getIslandQueryClient`, `resetIslandQueryClient`.
Hydration: `dehydrateQueryClient`, `hydrateFromDehydrated`, `HydrationBoundary`,
`QueryHydrationScript`, `DEFAULT_QUERY_HYDRATION_SCRIPT_ID`.
The barrel states the import-discipline rule verbatim: *"Island code should import from
`@netscript/fresh/query`, NOT from `@tanstack/preact-query` directly."*

### 0.4 SDK side that feeds pages (`@netscript/sdk`)

`createQueryFactory(resource, contract, client, defaultOptions = {})` and
`createQueryFactories(factories)` (`packages/sdk/src/query/query-factory.ts`). Each action method is
callable and carries: `invalidate()`, `key(props)` → `readonly [string, TAction, string]`,
`prefetch()`, `getCachedData()`, `getCachedEntry()`, `queryOptions(props, options?)`,
`mutationOptions(options?)`, `clientKey(props?)`.

**Two intentionally non-merged key tiers** — the single most teachable SDK fact:

```ts
// server tier — packages/sdk/src/ports/query-key.ts
createActionQueryKey(resource, action, input) // => [resource, action, JSON.stringify(input)]
// client tier — packages/sdk/src/query/query-factory.ts
clientKey = (props?) => props ? [resource, action, { input: props }] as const
                             : [resource, action] as const;
```

Server keys are serialized (KV-storable, prefixed `cache_query`); client keys stay structured so
TanStack prefix-matching works. `packages/sdk/src/query-client/key-bridge.ts` documents them as
"intentionally not merged" and supplies `toClientKeyPrefix()` / `bridgeInvalidation()`.

`getCachedEntry(queryKey)` is a **pure server-side KV read** — no fetch, no revalidation (contrast
`query()`, which does SWR with in-flight dedupe). Returns `CachedEntry<T> { data, cachedAt }`. Per
`query-client/types.ts`, verbatim: *"Server-to-client hydration flows through `initialData` props,
not through the options factory. The server loader calls `getCachedEntry()` and passes the result as
island props."* So `cachedAt` → `initialDataUpdatedAt`.

`queryOptions` is **not codegen'd per procedure** — it is built at runtime by looping
`Object.keys(contract)`. Scaffolds only codegen the factory wiring
(`packages/cli/src/kernel/assets/app/lib/example-service.ts.template`).

Dependency direction is one-way: fresh imports sdk, never the reverse.
`define-fresh-app.ts` performs a bare `import '@netscript/sdk/cache';` purely for the cache-provider
registration side effect — a genuinely surprising fact worth a callout.

### 0.5 `@netscript/fresh/form`, `/defer`, `/server`

- **form**: `RuntimeFormState<TValues>` (`form/_internal/runtime-types.ts:7`) — 17 readonly members
  including `fields: FieldDescriptorMap<TValues>`, `constraints`, `formProps`, `csrfInputProps`,
  `fieldErrors`, `formErrors`, `hasErrors`, `submitted`, `intent`, `submissionId`, `csrfToken`.
  Runtime helpers: `Form`, `FormRegion`, `useFormEnhancement`, `createFormEnhancementSnapshot`,
  `applyCollectionStrategy`, `getSubmissionHiddenInputProps`, `resolveFormState`,
  `generateSubmissionId`, `parseFormIntent`/`submitIntent`/`collectionIntent`/
  `applyIntentOperation`, CSRF sextet (`generateCsrfToken`/`readCsrfToken`/`setCsrfCookie`/
  `verifyCsrfToken`/`CSRF_COOKIE_NAME`/`CSRF_FIELD_NAME`), `createStandardSchemaAdapter`,
  `buildPaginationState`/`resolvePagination`, `toFormErrors`/`firstFieldError`.
- **defer**: `Deferred<T>` (`DeferredProps { promise, fallback?, children, errorFallback? }`;
  Suspense-based, throws `'Deferred requires a single render-function child.'`), `DeferPage`
  (14 props incl. `action`, `partial`, `name`, `cachedAt`, `staleTime`, `policy`, `staleStrategy`),
  `DeferComponent`, `sanitizeDeferSearchParams`, `buildDeferFormState`, and the policy module:
  4 profiles `'balanced' | 'aggressive-first-paint' | 'background-refresh' | 'low-bandwidth'`,
  `resolveDeferPolicy`, `decideDeferClientAction`, `resolveDetailDeferConfig`, `DEFER_POLICY`
  (`{ header: 'balanced', detail: 'background-refresh' }`), `DEFER_STALE_MS`
  (`{ crud: 30_000, forceRefresh: 0 }`), `DETAIL_FORCE_REFRESH_POLICY`, plus five telemetry
  emitters.
- **server**: `defineFreshApp<State>(options = {})` with 10 options (`name`, `app`, `freshConfig`,
  `createApp`, `staticFiles`, `middleware`, `preConfigure`, `configure`, `fsRoutes`, `telemetry`).
  Also `renderToStream`, `createStreamingResponse`, `StreamErrorBoundary`.

---

## 1. Proposed sub-page list (Web Layer manual)

Nine deep-dives. Each is one API or one coherent cluster.

### D1 — `withResource` / `withResources`: the request-scoped resource graph

- **Symbols**: `withResource`, `withResources`, `ctx.resource(key)`, `ctx.resources`,
  `useDefinePageResource`, `useDefinePageResources`, `resolveResource`, the
  `page.resource.<key>` span.
- **Bare-Fresh ceremony replaced**: in a bare Fresh 2 app you write `define.handlers({ async GET(ctx)
  {...} })` in `routes/x.tsx`, fetch the session yourself, stuff it into `ctx.state` (declared in a
  hand-maintained `State` interface in `utils.ts`), add a `routes/_middleware.ts` to pre-populate
  anything shared, then prop-drill the result from `define.page()` down through each child
  component. Two components needing the same user means either two fetches or a hand-rolled
  request-scoped memo (a `WeakMap` keyed on `ctx.req`). Ordering between dependent fetches is
  manual `await` sequencing inside one handler. None of it is typed end-to-end — `ctx.state` is
  whatever the interface claims.
- **Patterns to teach**:
  1. *Cross-layer request dedup* — declare `session` once; every layer loader and the layout read it
     via `ctx.resource('session')`. Show the resource store (`handlers.ts:36`) and the
     `page.resource.session` span emitted exactly once as the proof.
  2. *Per-layer refinement* — resources are the shared substrate, `withLayer` loaders are the
     per-region narrowing. Show the same `session` resource feeding a header layer and a table layer
     with different derived props.
  3. *Ordered, dependent resources* — the `for...of` loop means resource 2 can `ctx.resource('1')`.
     Teach the ordering contract explicitly and show the throw from `resolveResource` when the key
     does not exist yet.
  4. *Auth/context-aware queries* — resource factory calls the SDK with the request's auth context;
     the same factory shape works for tenant scoping. Pair with `withPolicy`.
  5. `withResources({...})` for the independent-batch case, and why it is still sequential.
- **Cross-links**: `web-layer/builders.md#builder-methods`, tutorial
  `tutorials/live-dashboard/04-definePage-QueryIsland.md` (the canonical `withResource` teach),
  `tutorials/workspace/05-route-authz.md` (authz flavor), D2, D7.

### D2 — `withLayer` / `withLayout` / slots: composing a page from regions

- **Symbols**: `withLayer`, `withLayout`, `DefinePageLayerConfig`, `DefinePageLayerLoader`,
  `resolveLayerConfig`, `normalizeLayerComponent`, `InferDefinePageLayerLoaderProps`,
  `DefinePageSlots`, `useDefinePageLayer`, `useRequiredDefinePageLayer`, `useDefinePageSlots`,
  `createDefinePageHooks`.
- **Bare-Fresh ceremony replaced**: `routes/_layout.tsx` + `_app.tsx` files, manual `<Component />`
  slot placement, per-region data fetched in the one route handler and threaded down as props, and
  no way to type a "region" independently of the page.
- **Patterns**: loader-shorthand vs `{ loader }` config; slot-function layouts
  (`(slots) => <main>{slots.panel()}</main>`); typed layer access via `route.hooks.use*()` instead of
  prop drilling; inferring layer props with `InferDefinePageLayerLoaderProps`.
- **Cross-links**: `builders.md#the-builder-chain`, `live-dashboard/04`, D1, D5.

### D3 — `withForm` and `RuntimeFormState`: server-validated forms

- **Symbols**: `withForm`, `RuntimeFormState` (all 17 members), `FormConfig`,
  `createZodAdapter`/`createStandardSchemaAdapter`, `resolveRuntimeFormState`,
  `mergeInitialFormValues`, `Form`, `FormRegion`, `useFormEnhancement`, intents
  (`parseFormIntent`, `submitIntent`, `collectionIntent`, `applyIntentOperation`), collections
  (`CollectionDescriptor`, `CollectionItem`, `applyCollectionStrategy`), CSRF sextet, idempotency
  (`generateSubmissionId`, `SUBMISSION_ID_FIELD_NAME`).
- **Bare-Fresh ceremony replaced**: a bare Fresh form is a `POST` handler that calls
  `await ctx.req.formData()`, converts entries by hand, runs `schema.safeParse`, maps Zod issues onto
  a `Record<string, string>` you invent, re-renders with `ctx.render({ values, errors })`, and
  re-populates every `<input defaultValue>` and `aria-describedby`/`aria-invalid` manually. CSRF is
  entirely yours: generate a token, set a cookie, hide a field, compare on POST. Repeat-submit
  protection is yours. Array/collection fields (add/remove/reorder row) are a hand-rolled
  index-encoding scheme. Nothing is typed against the schema.
- **Patterns**: one call installs layer + handler + CSRF header resolver (show
  `builder/mod.tsx:313-386`); `fields` descriptors as the prop source of truth
  (`{...state.fields.email.controlProps}`); constraints derived from the schema so HTML validation
  and server validation agree; intent buttons for collections; `csrf: false` escape hatch and what
  you give up; progressive enhancement via `useFormEnhancement` with the no-JS path intact.
- **Cross-links**: `web-layer/form.md#primary-path-defining-a-form-page-with-definepagewithform`,
  `how-to/build-a-server-validated-form.md`. **No tutorial covers this** — see §3.

### D4 — Partials: `definePartial`, `defineStatsPartial`, `route.withPartial`

- **Symbols**: `definePartial`, `defineStatsPartial`, `DefinePartialOptions`,
  `DefineStatsPartialOptions`, `DefinedPartialRoute` (`{ config, handler?, page, default }`),
  `route.withPartial(partialRoute)`, `PagePairedRouteTarget`, `PagePartialLinkProps`,
  `PageErrorPrimitives`, `errorComponent`/`errorTitle`.
- **Bare-Fresh ceremony replaced**: a bare Fresh partial is a second route file exporting
  `config = { skipAppWrapper: true, skipInheritedLayouts: true }`, a handler that renders
  `<Partial name="...">` with a name string you must keep in sync with the consuming page, an anchor
  with a hand-written `f-partial={...}` URL built by string concatenation, and a hand-written
  try/catch producing an ad-hoc error shell. The name string and the URL are two independent
  stringly-typed couplings that silently break on rename.
- **Patterns**: loader + component + built-in error shell in one definition; `defineStatsPartial`
  as the context-free variant (`query: () => Promise<TProps>`) for counters/KPI strips;
  `route.withPartial()` producing `href` **and** `f-partial` from one typed source via
  `getLinkProps()` — the rename-safety story; deferred-loader composition: the partial's `loader`
  is the same shape `DeferPage.partial` targets, so a partial is simultaneously the
  Fresh-navigation target and the defer-refresh target (bridge into D5).
- **Cross-links**: `builders.md#partials`, `route.md#paired-page-and-partial-routes`.
  **No tutorial covers this** — see §3.

### D5 — Deferred rendering: `Deferred`, `DeferPage`, and the policy engine

- **Symbols**: `Deferred`, `DeferredProps`, `DeferPage`, `DeferPageProps`, `DeferComponent`,
  `resolveDeferPolicy`, `decideDeferClientAction`, `DeferPolicyProfile` (4 profiles),
  `DEFER_POLICY`, `DEFER_STALE_MS`, `DETAIL_FORCE_REFRESH_POLICY`, `resolveDetailDeferConfig`,
  `withStreaming`, `renderToStream`, `StreamErrorBoundary`, the defer telemetry emitters.
- **Bare-Fresh ceremony replaced**: bare Fresh gives you `<Suspense>` and nothing above it. Cached
  first paint plus background refresh means: store the payload yourself, stamp your own `cachedAt`,
  compare it to your own stale window in the handler, decide server-prewarm vs client-refetch in
  ad-hoc `if`s duplicated per page, and hand-fire the revalidation `fetch`. There is no shared
  vocabulary, so two pages drift into two different freshness behaviors.
- **Patterns**: `Deferred` (promise-prop, single render-function child, `errorFallback`) vs
  `DeferPage` (cache-aware region backed by a partial route); the decision matrix from
  `decideDeferClientAction` (`prewarmOnMiss` / `prewarmOnStale` / `clientRefreshOnFreshCache` /
  `skipClientWhenServerPrewarm`); picking a profile by page role (`DEFER_POLICY.header` =
  `balanced`, `.detail` = `background-refresh`); why detail pages need
  `DETAIL_FORCE_REFRESH_POLICY` (`skipClientWhenServerPrewarm: false` — comment: *"Keep immediate
  consistency for linked resources after first client nav"*); deferred-loader composition with D4;
  observability via the prewarm/cache-read/client-decision spans.
- **Cross-links**: `web-layer/defer-streaming-ui.md#deferring-a-page-region-with-a-policy`,
  `live-dashboard/04` (`Deferred` only). `DeferPage` has **no tutorial coverage**.

### D6 — Route contracts: `defineRouteContract`, `bindRoutePattern`, `createRouteReference`

- **Symbols**: `defineRouteContract`, `bindRoutePattern`, `createRouteReference`,
  `paginationSearchSchema`, `fallback`, `enumPathParamSchema`, `defineEnumPathParam`,
  `withRoute`, `withRouteContract`, `createNav`, `Link`/`getLinkProps`/`getBoundLinkProps`,
  `usePageRoute`/`usePagePath`/`usePageSearch`.
- **Bare-Fresh ceremony replaced**: bare Fresh route params are `ctx.params.id: string` and
  `ctx.url.searchParams.get('page')` returning `string | null`. Pagination means parsing, clamping,
  defaulting, and computing `offset` inline in every handler. Links are template literals —
  `` `/orders/${id}?page=${page}` `` — with no compile-time check that the pattern still exists or
  that the params match.
- **Patterns**: contract-once/bind-many; `paginationSearchSchema()` computing `offset` for you;
  `fallback(schema, default)` as the `z.catch()` idiom for never-throwing search params;
  `defineEnumPathParam` for segment enums with a direct `.parse()` returning `null` instead of
  throwing; `route.href()`/`Link` as the rename-safe navigation surface; contract-free
  `createRouteReference('/orders/[id]')` when a schema is overkill.
- **Cross-links**: `route.md#route-contracts`, `#search-params-and-pagination`,
  `live-dashboard/04`, `storefront/06`, `workspace/05`.

### D7 — The query bridge: SDK factories → loader → island

- **Symbols**: SDK `createQueryFactory`/`createQueryFactories`, `queryOptions`, `mutationOptions`,
  `key`, `clientKey`, `getCachedEntry`, `getCachedData`, `prefetch`, `invalidate`,
  `createActionQueryKey`, `toClientKeyPrefix`, `bridgeInvalidation`, `isCacheEntryStale`; fresh
  `QueryIsland`, `getIslandQueryClient`, `dehydrateQueryClient`, `hydrateFromDehydrated`,
  `QueryHydrationScript`, `HydrationBoundary`.
- **Bare-Fresh ceremony replaced**: a bare Fresh island fetches with hand-written URLs and
  hand-declared response types, invents its own `queryKey` array (drifting between the prefetching
  loader and the consuming island — the classic silent cache miss), and hydrates by JSON-stringifying
  loader data into a `<script>` tag it wrote itself. Cache invalidation after a mutation is a
  hardcoded key literal in a second file.
- **Patterns**: the two key tiers and why they are deliberately not merged (quote `key-bridge.ts`);
  `getCachedEntry` → `initialData` + `cachedAt` → `initialDataUpdatedAt` (quote the
  `query-client/types.ts` comment verbatim); the dehydrate/hydrate route when the loader needs a
  full client cache instead of one entry; `bridgeInvalidation` for post-mutation invalidation
  without literal keys; the import-discipline rule (import from `@netscript/fresh/query`, never
  `@tanstack/preact-query`); `useQuery` is an alias of `useIslandQuery` — when to name which.
- **Cross-links**: `query.md#server-prefetch-and-hydration`, `#cache-entries-at-the-loader`,
  `live-dashboard/03-sdk-cache-first-query.md`, `storefront/06` (`useIslandQuery`).

### D8 — Response shaping: `withHandler`, `withHeader`, `withStatus`, `withMeta`, `withStreaming`

- **Symbols**: those five, plus `resolveHeaderDescriptor`, `DefinePageMetaResolver`, `build()`
  overloads, and the three verbatim guard-rail errors from §0.1.
- **Bare-Fresh ceremony replaced**: hand-written `define.handlers({ GET(ctx) { const res =
  ctx.render(); res.headers.set(...); return res } })` per route, `<Head>` juggling for meta, and
  no framework opinion about which combinations are legal.
- **Patterns**: the three `withHeader` overloads; why `withHandler('GET')` is mutually exclusive
  with `withHeader`/`withStatus`/`withStreaming` (the builder throws — document the message so the
  error is searchable); `ctx.render()` being required; the three `build()` shapes (unrouted vs
  `build('/path')` vs `build({ routePattern })`) and what `route`/`nav`/`hooks` you gain.
- **Cross-links**: `builders.md#handlers-and-methods`, `#building-a-page`, `server.md`.

### D9 — `defineFreshApp` and the app seam

- **Symbols**: `defineFreshApp`, all 10 `DefineFreshAppOptions`, `FreshAppFactory`,
  `FreshAppFsRoutes`, `FreshAppTelemetryOptions`, `renderToStream`, `createStreamingResponse`,
  `StreamErrorBoundary`.
- **Bare-Fresh ceremony replaced**: hand-written `main.ts` — `new App()`, `.use(staticFiles())`,
  ordered `.use()` middleware, `await fsRoutes(app, {...})`, `.listen()` — repeated per app with the
  ordering rules living in your head.
- **Patterns**: baseline bootstrap with sane defaults; the seams (`createApp`, `staticFiles: false`,
  `fsRoutes: false | string`, `preConfigure` vs `configure` ordering); **the side-effect import**:
  `defineFreshApp` does `import '@netscript/sdk/cache'` so the KV cache provider is registered —
  which is what makes `getCachedEntry` work in D7 without any wiring. That causal link is currently
  documented nowhere and is the highest-value single paragraph in this whole inventory.
- **Cross-links**: `server.md#composing-the-runtime-server`, `live-dashboard/01-scaffold.md`, D7.

---

## 2. What already exists in `docs/site/web-layer/*`

13 top-level files + 4 in `how-to/`. Verdict per file:

| File | Lines | Shape | Verdict |
| --- | --- | --- | --- |
| `index.md` | 88 | prose + nav cards, 0 fences | **Keep**; add D1–D9 to the nav grids. Already the best ceremony-replacement framing in the set. |
| `builders.md` | 258 | 39 table rows, 6 fences | **Deepen + split.** Flagship API documented as a table with no before/after. Becomes the hub for D1/D2/D3/D4/D8. |
| `route.md` | 197 | reference listing | **Deepen** → D6. Missing `fallback`, `enumPathParamSchema`, `defineEnumPathParam` entirely. |
| `query.md` | 463 | mixed, best worked examples | **Deepen only** → D7. Already has ceremony framing at L131/L371; needs the two-key-tier and `getCachedEntry`→`initialDataUpdatedAt` material. |
| `form.md` | 373 | most tutorial-like reference | **Deepen** → D3. Has the decision section; lacks the bare-Fresh POST-handler comparison and collections/intents depth. |
| `defer-streaming-ui.md` | 241 | reference | **Deepen** → D5. Policy engine (`decideDeferClientAction`, the 4 profiles) is under-explained. |
| `server.md` | 187 | prose + light reference | **Deepen** → D9. Missing all 10 options and the cache side-effect. |
| `interactive.md` | 159 | short conceptual | **Keep**, cross-link to D7. |
| `error.md` | 199 | reference (33 rows) | **Out of scope** for S1; note `PageErrorPrimitives` overlaps D4. |
| `testing.md` | 227 | reference | **Keep**; add a "testing a page definition" pointer from D1/D3. |
| `vite.md` | 211 | pure reference | Out of scope. |
| `fresh-ui.md` | 308 | prose, 2 fences, 0 tables | Out of scope; outlier in tone. |
| `examples.md` | 153 | pointer page | **Keep**; add D-page links. |
| `how-to/index.md` | 12 | stub | **Fix** — no recipe list beside 3 real recipes. |
| `how-to/build-a-server-validated-form.md` | 107 | true tutorial | Feeds D3 as the "do" companion. |
| `how-to/customize-fresh-ui.md` | 397 | tutorial/prose | **Defect**: lines 261/264/267 emit stray H1 headings mid-document, polluting anchors/TOC. Fix opportunistically. |
| `how-to/build-a-desktop-frontend.md` | 159 | recipe | No page-builder symbols. Out of scope. |

**Net-new vs deepen**: every D-page has a host file. D1, D2, D4, D8 are net-new *content* carved out
of `builders.md`; D3, D5, D6, D7, D9 are deepenings of an existing page. No page is created from
nothing, which keeps the sidebar stable.

---

## 3. Gap table: API → tutorial coverage today → proposed deep-dive

Tutorial corpus: `docs/site/tutorials/` — 6 tracks (`live-dashboard`, `chat`, `storefront`,
`workspace`, `erp-sync`, `eis-chat`), ~8.4k lines. **`eis-chat/` is 5 stub files of 5 lines each and
must be treated as absent.**

| API | Tutorial coverage today | Reference coverage | Deep-dive |
| --- | --- | --- | --- |
| `definePage` | Deep — `live-dashboard/04` (382 lines, canonical), `05`; applied in `chat/03`, `storefront/06`, `workspace/05` | `builders.md` table | hub |
| `withResource` / `withResources` | Taught in `live-dashboard/04`, reused in `05`, `chat/03`, `storefront/06`. **Dedup and ordering semantics never explained** | table row | **D1** |
| `withLayer` / `withLayout` | `live-dashboard/04`+`05`, reused elsewhere | table row | **D2** |
| `withForm` | **ZERO** | `form.md` + 1 how-to | **D3** |
| `RuntimeFormState` | **ZERO** | `form.md`, `builders.md` | **D3** |
| `definePartial` | **ZERO** | `builders.md` only | **D4** |
| `defineStatsPartial` | **ZERO** | `builders.md` only | **D4** |
| `route.withPartial` | **ZERO** | `route.md` only | **D4** |
| `Deferred` | `live-dashboard/04` only (single site, moderate) | `defer-streaming-ui.md` | **D5** |
| `DeferPage` | **ZERO** | `defer-streaming-ui.md` | **D5** |
| defer policy profiles | **ZERO** | thin | **D5** |
| `defineRouteContract` | Moderate — `live-dashboard/04`, `storefront/06`, `workspace/05` | `route.md` | **D6** |
| `createRouteReference` / `bindRoutePattern` | Incidental | `route.md` | **D6** |
| `paginationSearchSchema` | Incidental | `route.md` | **D6** |
| `fallback`, `enumPathParamSchema`, `defineEnumPathParam` | **ZERO** | **ZERO** — fully undocumented | **D6** |
| `QueryIsland` | Deep — all 6 live tracks; `live-dashboard/05` deepest | `query.md` | **D7** |
| `useIslandQuery` | `storefront/06` (primary), `chat/03`. **Absent from the flagship live-dashboard track** | `query.md` | **D7** |
| `useLiveQuery` family | Thin | `defer-streaming-ui.md` | **D7** |
| dehydration / `getCachedEntry` | `live-dashboard/03` (cache-first) | `query.md` | **D7** |
| SDK `queryOptions` / `clientKey` / two key tiers | **ZERO** | **ZERO** | **D7** |
| `withHandler`/`withHeader`/`withStatus`/`withMeta`/`withStreaming` | **ZERO** | table rows only | **D8** |
| builder guard-rail errors | **ZERO** | **ZERO** | **D8** |
| `defineFreshApp` | Scaffold-level mention in `live-dashboard/01`, `storefront/01`, `workspace/01` — **never explained** | `server.md` | **D9** |
| `@netscript/sdk/cache` side-effect import | **ZERO** | **ZERO** | **D9** |

**Headline gaps.** (a) The entire forms-and-partials half of the builder chain — `withForm`,
`withPartial`, `definePartial`, `defineStatsPartial`, `DeferPage`, `RuntimeFormState` — has **zero
tutorial coverage** and reference-only docs. (b) Ceremony-replacement framing exists in only four
places repo-wide (`index.md` intro, `query.md` L131/L371, `interactive.md` typed-query-island,
`fresh-ui.md` why-copy-source); the seven most reference-shaped files never show the bare-Fresh code
being replaced. `builders.md` is the most conspicuous offender. (c) Three route helpers and the whole
SDK key-tier story are undocumented anywhere.

---

## 4. Slice proposal

Nine authoring slices, commit-sized, ordered so each lands on top of vocabulary the previous one
established. Per the documentation-authoring exception in `CLAUDE.md`, these are Markdown-only —
no `packages/`/`plugins/` source. Each slice: commit → push → PR comment, with `worklog.md` +
`context-pack.md` updated in the same commit. Docs-only diff ⇒ apply `ci:skip-e2e` and
`ci:skip-scaffold` to the draft PR.

| # | Slice | Deep-dives | Touches | Rationale for position |
| --- | --- | --- | --- | --- |
| **S1a** | Resource graph | D1 | `builders.md` + new page | Highest-value gap; every later slice references `ctx.resource()`. Establishes the dedup vocabulary. |
| **S1b** | Layers, layout, slots | D2 | `builders.md` + new page | Immediately after D1 — "shared substrate vs per-region refinement" is one idea told in two halves. |
| **S2** | Route contracts | D6 | `route.md` | Prerequisite for D4 (paired routes) and D8 (`build()` overloads). Also closes 3 fully-undocumented helpers. |
| **S3** | Partials | D4 | `builders.md`, `route.md` + new page | Needs D6's `withPartial` typing and D2's region framing. Closes a zero-coverage cluster. |
| **S4** | Deferred rendering + policy | D5 | `defer-streaming-ui.md` | Builds directly on S3 — `DeferPage.partial` targets a D4 partial. |
| **S5** | Forms | D3 | `form.md` + new page | Largest single zero-coverage surface; self-contained, so it can run in parallel with S3/S4 if lanes allow. |
| **S6** | Query bridge (SDK → loader → island) | D7 | `query.md` | Deepest existing page; deepening beats rewriting. Depends on nothing above. |
| **S7** | Response shaping | D8 | `builders.md` + new page | Small; closes the builder chain. Cheap slice, good recovery point. |
| **S8** | App seam | D9 | `server.md` | Last: the cache side-effect paragraph only lands once D7 has explained `getCachedEntry`. |
| **S9** | Nav + hygiene | — | `index.md`, `examples.md`, `how-to/index.md`, `how-to/customize-fresh-ui.md` | Must be last (links all nine pages). Also fixes the stray-H1 anchor defect and the 12-line how-to stub. |

**Suggested order**: S1a → S1b → S2 → S3 → S4 → S5 → S6 → S7 → S8 → S9.
**Parallelizable if lanes allow**: {S5}, {S6} are independent of the S2→S3→S4 chain and of each
other. S9 is a hard join point.

**Cross-cutting authoring rule for every slice** (this is the phase-3 thesis): each deep-dive opens
with the bare-Fresh ceremony — actual files, actual wiring, named concretely — before showing the
NetScript call. Gap (b) above says this framing is currently missing from seven of thirteen pages;
adding pages without it would deepen the problem rather than fix it.

**Verification bar per slice**: `deno task doc-lint` is not applicable (Markdown), so the gate is
(i) every symbol named in the page exists in the barrel or source at the cited path, (ii) every code
fence type-checks against the real signatures recorded in §0, (iii) xrefs resolve. Validation stays
in a separate opposite-family session per the documentation-authoring exception — this inventory and
the resulting pages do not self-certify.
