# D1/D4 deep-dives documentation audit

- **Lane:** opposite-family `docs_audit` (Codex reviewing a Claude-authored changeset)
- **Worktree:** `/home/codex/repos/ns-deepdives`
- **Branch:** `docs/web-layer-deep-dives`
- **Changeset:** `8dbc16bee..HEAD` (`9f2c236fe`, `4480edb39`)
- **Method:** evidence only. Claims were checked against source and Fresh 2.3.3 types; examples were independently extracted and type-checked. No product or documentation files were edited.
- **Verdict:** **FAIL_FIX**

The implementation descriptions are substantially grounded in the runtime, and both required repository documentation commands pass. The changeset is not ready, however: it presents a normally compile-time-detected resource ordering error as runtime-only, describes two bare-Fresh mechanisms incorrectly, overstates manual route-reference rename safety, and omits the requested contextual cross-link from live-dashboard chapter 5.

## Gate 1 — API and mechanism accuracy: FAIL

### Evidence

Resource resolution was compared directly with:

- `packages/fresh/src/application/builders/define-page/runtime/handlers.ts:33-61`: path/search parsing precedes resources; one store is created for that pipeline execution; descriptors run in a sequential `for...of`; each factory is awaited; the span name is `page.resource.<key>`.
- `packages/fresh/src/application/builders/define-page/runtime/context.ts:31-50,112-149`: telemetry-disabled execution does not create a span; missing resources throw; `ctx.resource()` is a synchronous accessor.
- `packages/fresh/src/application/builders/define-page/mod.tsx:206-238`: `withResource` appends a descriptor and `withResources` appends `Object.entries()` in enumeration order.
- `packages/fresh/src/application/builders/define-page/runtime/mod.tsx:102,256-269`: the prepared runtime context is supplied to layers, layout, metadata, and headers.
- `packages/fresh/src/application/builders/define-page/builder/state.ts:54-63`, `types.ts:271-292`, and `internal.ts:23-29`: each factory's type state exposes only resources registered earlier in the fluent chain.

Partial behavior was compared directly with:

- `packages/fresh/src/application/builders/define-partial.tsx:20-30,55-123`: `definePartial` constructs the named Fresh `Partial`, installs its handler/page/config, and `defineStatsPartial` delegates after querying stats.
- `packages/fresh/src/application/builders/define-page/runtime/mod.tsx:165-223`: a deferred layer is mapped to `DeferPage`, including action, partial route/params/name, component/fallback, freshness policy, layer/page policy, and context.
- `packages/fresh/src/application/components/DeferPage.tsx:104-150,154-275` and `DeferIsland.tsx:110-235`: background prewarm and client-nav partial form wiring match the described mechanism.
- `packages/fresh/src/application/components/Deferred.tsx:79-94`: the boundary is Suspense-shaped but the current Fresh runtime is non-streaming.
- `packages/fresh/src/application/policy.ts:110-208`: the named policy profiles and their timing behavior are source-backed.
- `packages/fresh/src/application/route/_internal/contract-runtime.ts:292-349`: route-reference partial props supply the `href` and `f-partial` target, but a literal route reference remains a literal string.

Independent example checks:

| Page | Extracted examples | Command | Result |
|---|---|---|---|
| `resources.md` | Bare-Fresh handler/layout; one resource shared by layers; dependent resources | `deno check --unstable-kv --config packages/fresh/deno.json packages/fresh/tests/type-fixtures/deepdives_resources_audit_type.tsx` | PASS (exit 0) |
| `partials.md` | Bare-Fresh partial route; `definePartial` plus `defineStatsPartial`; deferred partial layer | `deno check --unstable-kv --config packages/fresh/deno.json packages/fresh/tests/type-fixtures/deepdives_partials_audit_type.tsx` | PASS (exit 0) |
| Resource-order negative control | Swapped the dependent resource declarations from the page | `deno check --unstable-kv --config packages/fresh/deno.json packages/fresh/tests/type-fixtures/deepdives_resources_swapped_audit_type.tsx` | Expected failure (exit 1), `TS2339: Property 'tenantId' does not exist on type 'never'` |

All temporary fixtures were deleted after the checks.

### Findings

1. **Blocking — declaration-order failure is not runtime-only in the documented fluent API.** `resources.md:108-116,141-144,174-176,238-239` says swapping dependent declarations is a runtime mistake and that types cannot protect the order. The negative control proves that the ordinary typed chain rejects the swap at compile time. A runtime missing-key error is still possible after type erasure, unsafe casts, or dynamic access, but that is not what the page demonstrates.

   Replace the relevant explanation with:

   > Declaration order is part of both the runtime and type contract. Each factory can read only resources registered earlier in the fluent chain, so the normal typed builder rejects a swapped dependency. The runtime missing-key check remains a defensive guard for erased, dynamic, or otherwise unsafe access.

2. **Blocking — “once per request” and span wording is absolute beyond the source contract.** `resources.md:104-106,240` says every resource appears once per request as a span. Spans exist only when telemetry is enabled. Also, `prepareRequestState()` is invoked independently by the page pipeline and by custom method handlers; a custom GET handler that returns data and then renders the page can execute resource preparation again. The demonstrated guarantee is once per pipeline preparation/page render, not unconditionally once for the lifetime of an HTTP request.

   Replace the claim with:

   > Resources resolve once during each page-pipeline preparation. When telemetry is enabled, every resolution is wrapped in a `page.resource.<key>` span. Custom method handlers prepare their own request state, so do not treat this as a cross-handler memoization guarantee.

3. **Blocking — literal route references do not prove rename safety.** `partials.md:141-143` says moving or renaming the partial route becomes a compile error. Its example calls `createRouteReference('/partials/dashboard/stats')`; moving the route file does not update or invalidate that literal. Generated manifest accessors may provide a stronger link, but the shown mechanism does not.

   Replace the paragraph with:

   > The route reference types the partial path and parameters at the call site and centralizes URL construction. A manually created reference still contains a route-pattern literal, so a filesystem rename is not automatically detected; use generated route accessors where rename tracking is required.

4. **Material — “one declaration” overstates partial coupling closure.** `partials.md:178-180` says layer id, partial name, and route converge on one declaration, but they remain three independently supplied fields. The page correctly acknowledges the remaining name-string coupling later at `partials.md:211-212`.

   Replace with:

   > The page builder colocates the layer id, partial name, and route reference in one layer configuration. It does not prove that `partialName` matches the name passed to `definePartial`.

5. **Material — URL changes do not invalidate a request cache.** `resources.md:192-194` calls the request boundary a cache boundary and says changing the URL invalidates the resource. A fresh store is constructed for every pipeline preparation regardless of whether the URL changed.

   Replace with:

   > Parsed path and search values are available before resources resolve. The resource store is rebuilt for every page-pipeline preparation; a URL change causes another request, but it is not a cache-key invalidation mechanism.

## Gate 2 — bare-Fresh ceremony claims: FAIL

### Evidence

The repository pins `jsr:@fresh/core@2.3.3`. The installed package was inspected with `deno info --json jsr:@fresh/core@2.3.3` and `deno doc` filters for `HandlerFn`, `Context`, `PageProps`, `Partial`, and `RouteConfig`. The cached 2.3.3 sources show:

- A Fresh 2 handler may return `{ data }`; `Context.render()` accepts JSX output, not an arbitrary data bag.
- `Context.state` is request-local and is shared through the middleware/layout processing of that request.
- A partial navigation issues a separate HTTP request and identifies the replacement region using matching `f-partial`/`Partial` names.
- `skipAppWrapper` and `skipInheritedLayouts` are real route config options; the examples' optimized partial-route config is valid.

### Findings

1. **Blocking — `ctx.render({ ... })` is not the Fresh 2 data API.** `resources.md:34` says bare Fresh requires passing values through a `ctx.render({ ... })` data bag. Fresh 2.3.3 rejects non-JSX input to `Context.render`; handler data is returned as `{ data: ... }`, as the page's own sample correctly does.

   Replace with:

   > In bare Fresh, a route handler can return `{ data: ... }` for its route component, while middleware can place request-scoped values on `ctx.state` for inherited layouts and downstream handlers.

2. **Blocking — a `WeakMap` keyed by `ctx.req` cannot share data with a sibling partial request.** `resources.md:63-66` groups an error boundary, layout, and sibling partial route under a single `WeakMap<Request, ...>` memo. The first two can participate in the same request; partial navigation creates another `Request`, so it cannot hit that key.

   Replace with:

   > A request-keyed memo can deduplicate work among middleware, layouts, handlers, and error handling that share one request. A separately fetched partial route needs to reload the value or use an explicitly cross-request cache/session store.

3. **Material — region-specific partial error handling is optional UX, not mandatory Fresh mechanics.** `partials.md:31-32` says the route must catch loader errors or the broken region takes down the response it was rendered into. The partial is its own response, and uncaught errors follow Fresh's normal route error path. Catching errors locally is useful when a region-specific fallback is desired, but it is not mandatory ceremony.

   Replace with:

   > If the partial needs a region-specific error surface, catch or normalize loader failures in this route; otherwise the failed partial request follows Fresh's normal route error path.

## Gate 3 — cross-links, navigation, and build: FAIL

### Evidence

- `cd docs/site && rtk proxy deno task build` — PASS (exit 0), 603 files generated; both `/web-layer/resources/` and `/web-layer/partials/` were emitted.
- `rtk proxy deno task docs:links` from the repository root — PASS (exit 0): `docs=102 broken-links=0 broken-anchors=0 orphans=0`.
- Contextual links exist in storefront chapter 6 (`06-storefront-ui.md:263`), live-dashboard chapter 4 (`04-definePage-QueryIsland.md:105,159`), and chat chapter 3 (`03-chat-ui.md:56`), and resolve to the new pages.
- `rg -n "web-layer/(resources|partials)" docs/site/tutorials/live-dashboard/05-live-stream.md` returned no match.
- Front matter matches the sibling web-layer convention (`layout: layouts/base.tsx`, title, Vento/Markdown engines), with consecutive navigation orders 13 and 14 after the existing order-12 page. The generated sidebar includes both pages.

### Finding

1. **Blocking — the requested live-dashboard chapter 5 cross-link is missing.** A global sidebar entry is not the requested chapter-level handoff. Add a contextual link from `docs/site/tutorials/live-dashboard/05-live-stream.md` to the relevant new deep-dive (most naturally `/web-layer/partials/` where the chapter discusses incremental region refresh).

## Gate 4 — prose quality and register: FAIL

### Evidence

`docs/site/explanation/contracts.md` uses a thesis → mechanism → implications/tradeoffs progression. The new pages are generally direct and technically motivated, but `resources.md` switches to a numbered “four patterns” checklist and several transition sentences claim more certainty than the mechanisms support.

### Findings and exact replacements

1. **Material — checklist structure weakens the explanatory register.** Replace `resources.md:15-18` with:

   > The important contract is the request lifecycle: resources resolve before layers, later factories can consume earlier values, and every page region reads the same request-owned store.

   Rename the four headings as follows:

   - `Pattern 1 — one resource, every layer` → `Shared substrate, local props`
   - `Pattern 2 — auth- and context-aware queries` → `Dependent resources encode request scope`
   - `Pattern 3 — URL-aware resources` → `Parsed route state enters before resources`
   - `Pattern 4 — withResources for independent values` → `Grouping independent factories`

2. **Minor — filler transition.** Replace `resources.md:93`:

   > The loop establishes four observable properties:

   Then revise the fourth property to use the compile-time/runtime distinction in Gate 1.

3. **Minor — imperative flourish.** Replace `partials.md:64`:

   > This version has four independent couplings:

4. **Minor — indirect boundary setup.** Replace `partials.md:191-192` with:

   > Two runtime boundaries prevent “deferred” from implying server push or progressive delivery:

## Canonical documentation gate log

| Gate | Commands / source | Scope | Result | Findings | Proceeded |
|---|---|---|---|---|---|
| Documentation links | `rtk proxy deno task docs:links` | Repository docs | PASS | No broken links, anchors, or orphans | Yes |
| Site build | `cd docs/site && rtk proxy deno task build` | Full docs site | PASS | 603 files generated | Yes |
| Internal-wording grep | Focused `rg` over changed Markdown for issue/PR/harness/internal-run language | `8dbc16bee..HEAD` docs | PASS | No internal implementation/process wording found | Yes |
| Versionless-specifier scan | Focused `rg`/diff inspection for newly added `jsr:@netscript/*` imports | Changed docs/code blocks | PASS | No new versionless package specifier | Yes |
| Command/API accuracy sampling | Runtime/type source reads; six positive examples and one negative type-state control | Both new deep-dives | FAIL | Incorrect order, span/lifetime, Fresh render, cross-request memo, and rename-safety claims | Yes; findings are source-proven |
| Template/generated drift | Diff classification | Documentation-only changeset | N/A | No template/generated asset pair in scope | Yes |
| Nav/front matter | Sibling front matter, generated site, sidebar inspection | New pages | PASS | Orders 13/14 and sibling conventions match | Yes |
| Prose quality | Comparison with `explanation/contracts.md` | Both new deep-dives | FAIL | Checklist framing and overconfident transitions; exact replacements supplied | Yes |
| Cross-page contradiction | Tutorial links and claims compared with both deep-dives and runtime | Storefront ch.6, dashboard ch.4-5, chat ch.3 | FAIL | Dashboard ch.5 contextual link absent; “once per request” tutorial wording inherits the overclaim | Yes |

## Required fix set

1. Correct resource order/type-state, span gating, and pipeline-lifetime language.
2. Correct bare-Fresh `{ data }`, request-local memoization, and optional partial error-surface language.
3. Qualify manual route-reference rename safety and the remaining partial-name coupling.
4. Add the live-dashboard chapter 5 contextual link.
5. Apply the focused prose replacements above, then rerun the docs build, link gate, and extracted-example checks.

## Worktree hygiene

No commits were created. Temporary audit fixtures were removed. The audited worktree remains modified only by the pre-existing `deno.lock` addition of `jsr:@netscript/queue@0.0.4`; the audit did not alter it.

## Re-audit

- **Re-audit changeset:** `0fc50f7cf` + `99c62f27b` on `docs/web-layer-deep-dives`
- **Method:** current prose was re-read against the live source; focused type controls, the docs build, and the link gate were rerun independently. Temporary type fixtures were removed after use.
- **Final verdict:** **FAIL_FIX**

The fixes close twelve of the thirteen numbered findings. One sentence still contradicts the newly documented page-pipeline lifetime, so the accuracy gate remains narrowly red.

### Evidence-path corrections

The generator's cosmetic corrections are valid. Three paths in the initial audit omitted their real subdirectories; the authoritative files are:

- `packages/fresh/src/application/builders/define-page/builder/mod.tsx` — not `define-page/mod.tsx` for the `withResource` / `withResources` builder implementation.
- `packages/fresh/src/application/defer/DeferPage.tsx` — not `application/components/DeferPage.tsx`.
- `packages/fresh/src/application/defer/policy.ts` — not `application/policy.ts`.

Those citation errors did not change the initial mechanism findings, but these corrected paths supersede the earlier evidence paths.

### Per-finding disposition

| Prior finding | Status | Re-audit evidence |
|---|---|---|
| G1-F1 — declaration-order failure described as runtime-only | **FIXED** | `resources.md:109-113,125-126,159-160,190-193,256-257` now distinguishes the typed and runtime boundaries. Three focused controls confirmed it: passing a misspelled-key `never` through untouched passed (exit 0); reading `.tenantId` from that misspelled value failed with `TS2339` (exit 1); and reading `.tenantId` from a known-but-later `session` resource also failed with `TS2339` (exit 1). This precisely covers both sides of the boundary. |
| G1-F2 — unconditional once-per-request and span claims | **NOT-FIXED** | Span gating is fixed at `resources.md:115-117`; custom-handler/page-pipeline lifetime is correctly explained at `resources.md:128-132` and summarized at `resources.md:251-257`; live-dashboard ch.4 is corrected at `04-definePage-QueryIsland.md:99-105,230`. However, `resources.md:195-198` still says the authoritative value is “resolved once at the top of the request.” A request can run handler preparation and page preparation separately, as the page now explains itself. Replace that phrase with “resolved once during the page-pipeline preparation.” |
| G1-F3 — literal route references claimed automatic rename safety | **FIXED** | `partials.md:144-152` explicitly says manual `createRouteReference` literals remain stale after a move, then limits rename tracking to Vite-generated accessors. `application/vite/README.md:62-82` and `application/route/manifest.ts:415-489` confirm the generated `routes` tree is derived from discovered filesystem routes. |
| G1-F4 — three partial identifiers claimed to converge on one verified declaration | **FIXED** | `partials.md:187-191` says the values are colocated but not verified and explicitly preserves the `partialName` ↔ `definePartial` name coupling. |
| G1-F5 — URL change described as cache invalidation | **FIXED** | `resources.md:209-212` now states that every page-pipeline preparation rebuilds the store and that a URL change causes another request/store rather than invalidating a URL-keyed cache. |
| G2-F1 — bare Fresh described as `ctx.render({ data })` | **FIXED** | `resources.md:34-38` now uses a `{ data: ... }` handler return and explicitly says `Context.render()` accepts a VNode, matching Fresh 2.3.3. |
| G2-F2 — `WeakMap<Request, ...>` claimed to span a partial request | **FIXED** | `resources.md:66-71` confines request-keyed memoization to one request and explicitly requires a cross-request cache/session store for separately fetched partials. |
| G2-F3 — local partial error shell described as mandatory Fresh mechanics | **FIXED** | `partials.md:31-33,65-70` now distinguishes Fresh's normal route error path from an optional region-specific fallback. |
| G3-F1 — live-dashboard chapter 5 contextual cross-link missing | **FIXED** | `05-live-stream.md:154-160` now links to `/web-layer/partials/` and explains why request-driven regions use partials while pushed regions do not. Chapter 4 retains both deep-dive links. |
| G4-F1 — numbered “Pattern 1–4” checklist framing | **FIXED** | `resources.md:15-20` now leads with the lifecycle contract; headings at `134`, `167`, `200`, and `217` are mechanism-led rather than numbered patterns. |
| G4-F2 — filler “four facts ... whole contract” transition | **FIXED** | `resources.md:98` now says “The loop establishes four observable properties,” followed by the corrected properties. |
| G4-F3 — “Count the couplings” flourish | **FIXED** | `partials.md:65` now introduces the four independent couplings directly. |
| G4-F4 — indirect deferred-boundary setup | **FIXED** | `partials.md:200-207` now opens directly with the two runtime boundaries and preserves the current non-streaming qualification. |

### Re-run commands

| Check | Command | Result |
|---|---|---|
| Misspelled key, `never` passed through untouched | `deno check --unstable-kv --config packages/fresh/deno.json packages/fresh/tests/type-fixtures/deepdives_reaudit_never_passthrough_type.ts` | **PASS**, exit 0 |
| Misspelled key, first property access | `deno check --unstable-kv --config packages/fresh/deno.json packages/fresh/tests/type-fixtures/deepdives_reaudit_never_property_type.ts` | **Expected failure**, exit 1, `TS2339: Property 'tenantId' does not exist on type 'never'` |
| Known-but-later resource, first property access | `deno check --unstable-kv --config packages/fresh/deno.json packages/fresh/tests/type-fixtures/deepdives_reaudit_swapped_property_type.ts` | **Expected failure**, exit 1, `TS2339: Property 'tenantId' does not exist on type 'never'` |
| Site build | `cd docs/site && rtk proxy deno task build` | **PASS**, exit 0, 603 files generated |
| Documentation links | `rtk proxy deno task docs:links` | **PASS**, exit 0, zero broken links, anchors, or orphans |

### Final disposition

**FAIL_FIX.** Change the single remaining phrase in `resources.md:195-198` from “resolved once at the top of the request” to “resolved once during the page-pipeline preparation.” No other prior finding remains open. Because this is the second audit FAIL cycle, the harness doc-audit profile's supervisor-escalation rule now applies.

**Final verdict after supervisor fix `05e0581d6`: PASS.** `resources.md:196` now says “resolved once during the page-pipeline preparation,” closing G1-F2 and the final open finding.

## Batch 2 audit

- **Audit changeset:** `903538321` + `df1327f5e` on `docs/web-layer-deep-dives`
- **Scope:** rewritten `web-layer/route.md`, new `web-layer/query-bridge.md`, the `query.md` JSDoc-drift correction, and their nav/cross-links.
- **Method:** opposite-family evidence-only audit. Public surfaces were inspected with `deno doc`, runtime claims were compared with `packages/fresh` and `packages/sdk`, focused tests and type controls were executed independently, and the site-local build/link gates were rerun. No docs or product source was edited.
- **Verdict:** **FAIL_FIX**

### Gate 1 — mechanism and API accuracy: FAIL

Most of both pages is unusually well aligned with the implementation. D6's contract/reference/generated-tree model, pagination fallbacks, derived offset, enum helpers, href serialization, same-route preservation rule, manifest accessor derivation, three authoring forms, runtime guards, and paired partial references all match source. D7's provider-backed versus pure helpers, separate server/client key tiers, cache-only `getCachedEntry`, SWR behavior, hydration timestamp limitation, narrow `QueryClientPort`, hydration timing, process-global cache registration, and `getIslandQueryClient()` JSDoc drift also match source.

Independent controls:

- `deno doc --filter` was run for `defineRouteContract`, `createRouteReference`, `paginationSearchSchema`, `defineEnumPathParam`, `createQueryFactories`, `createNetScriptQueryClient`, `IslandQueryOptions`, and `IslandQueryResult`.
- Route controls: `contract.test.ts` (11 pass); `search-params.test.tsx` (7 pass); `manifest.test.ts` + `manifest-page-module.test.ts` (22 pass); `navigation.test.tsx` + builder tests (22 pass). The first builder-test attempt lacked Fresh's required `DENO_DEPLOYMENT_ID` env permission; the evidence rerun used `--allow-env` and passed.
- Query/cache controls: `cache-query_test.ts` + `cache-provider_test.ts` (4 pass); `hydration-script.test.tsx` (2 pass).
- D7 negative control 1: adding `initialDataUpdatedAt` to `IslandQueryOptions<number>` failed as claimed with `TS2353`.
- D7 negative control 2: calling `prefetchQuery` on `createNetScriptQueryClient()` failed with `TS2551`, and passing the returned `QueryClientPort` to `dehydrateQueryClient` failed with `TS2345`.
- D7 negative control 3: reading `isRefetching` and `isFetching` from `IslandQueryResult<number>` failed with two `TS2339` diagnostics.
- All temporary type fixtures were removed.

#### Finding

1. **Blocking — `clientKey(input?)` does not distinguish every supplied input from omission.** `query-bridge.md:91,349-350` says a supplied input produces `[resource, action, { input }]` and only an omitted input produces the prefix. The implementation at `packages/sdk/src/query/query-factory.ts:171-175` uses `props ? ... : ...`, so any falsy procedure input is treated as omitted. An independent runtime control produced:

   ```text
   clientKey(0)     -> ["orders","list"]
   clientKey(false) -> ["orders","list"]
   queryOptions(0).queryKey -> ["orders","list",{"input":0}]
   ```

   Until the SDK implementation is fixed, replace the table/bullet wording with:

   > `clientKey(input?)` returns the full structured key for truthy inputs and the action prefix when input is omitted or otherwise falsy. For procedures accepting `0`, `false`, or `''`, use `queryOptions(input).queryKey` when an exact key is required.

   This is an SDK behavior defect exposed by the docs, not merely a prose preference. If the implementation is corrected to test `props === undefined`, the page's intended wording becomes accurate.

### Gate 2 — bare-Fresh contrast fairness: FAIL

#### Findings

1. **Blocking — D7 invents manual island serialization and attributes the resulting XSS risk to bare Fresh.** `query-bridge.md:23-73,296-299` inserts a hand-written JSON `<script>`, reads it with `document.getElementById`, and calls that “what bare Fresh makes you write.” Fresh islands already accept serializable props from a server-rendered page; Fresh owns their transport and escaping. The native comparison is `<OrdersIsland initialOrders={data.orders} />`, not a manual script bridge. NetScript's real added value here is the contract-derived service client/query factory, shared key construction, cache policy, and hydration helpers—not basic server-to-island prop serialization.

   Replace the bare-Fresh example and cost setup with a normal island prop:

   ```tsx
   export default define.page<typeof handler>(({ data }) => (
     <OrdersIsland initialOrders={data.orders} />
   ));

   // islands/OrdersIsland.tsx
   export default function OrdersIsland(
     { initialOrders }: { initialOrders: { items: Order[] } },
   ) {
     const query = useQuery({
       queryKey: ['orders', 20, 0],
       queryFn: () => fetch('/api/v1/orders/list?limit=20&offset=0').then((r) => r.json()),
       initialData: initialOrders,
     });
     return <OrdersTable orders={query.data?.items ?? []} />;
   }
   ```

   Then state the fair remaining seams:

   > Fresh transports serializable island props for you. What it does not provide is a service-contract-derived response type and query function, a shared query-key factory, or coordination between the server cache and the browser QueryClient.

   Remove the claim that the manual script's escaping failure is a bare-Fresh cost.

2. **Material — moving a Fresh route under a route group does not make its links 404.** `route.md:61-63` lists “move it under a group” among URL-breaking changes, while the same page correctly says at `route.md:231-240` that `(group)` directories are dropped from generated paths. Fresh route groups are URL-neutral.

   Replace the sentence with:

   > Rename the file, move it into a different URL-bearing directory, or add a segment, and every hand-written link still compiles and ships—it just 404s. Moving it under a Fresh route group alone does not change the URL.

### Gate 3 — cross-links, navigation, and site gates: PASS

Evidence:

- `cd docs/site && rtk proxy deno task build` — **PASS**, exit 0, 606 files generated; `/web-layer/route/` and `/web-layer/query-bridge/` were emitted.
- `cd docs/site && rtk proxy deno task check:links` — **PASS**, exit 0: `31659 internal links across 217 pages — all resolve`.
- The site-local `check:links` task is the verdict source for this batch. Root `deno task docs:links` was intentionally not used because it does not scan the built site; that coverage gap should remain recorded in the run.
- `query-bridge.md` uses the sibling front-matter convention and follows resources/partials at navigation order 15. The Web Layer hub links it; `query.md` links to it and back through the related cards; the new page links to query, resources, SDK, server, islands, and the live-dashboard chapter. `builders.md` links into the rewritten generated-routes section.
- Changed-line scans found no leaked issue/PR/harness vocabulary and no bare `jsr:@netscript/*` specifiers.
- The audit build briefly added an exact `jsr:@fresh/core@2.3.3` lock entry; it was removed while preserving the pre-existing `jsr:@netscript/queue@0.0.4` change.

### Gate 4 — prose register: FAIL

`route.md` is otherwise close to the thesis → mechanism → boundary register of `explanation/contracts.md`: it distinguishes the three route objects, develops observable behavior, and ends with precise limitations. `query-bridge.md` is strongest after its bare-Fresh section, especially where it names the cache tiers and compile boundaries.

The opening contrast is both technically unfair and more prosecutorial than the reference register: “Four costs, and each of them is a bug that ships quietly” and “an XSS hole waiting” turn an invented mechanism into sales copy. Apply the Gate 2 replacement, then replace the transition at `query-bridge.md:60` with:

> Fresh carries the value into the island, but three coordination seams remain: the service response contract, the request/input construction, and the TanStack query key.

No rewrite of either page is warranted; this is a focused correction to one opening section plus the two precise API statements above.

### Batch 2 gate log

| Gate | Commands / source | Scope | Result | Findings | Proceeded |
|---|---|---|---|---|---|
| Mechanism/API accuracy | `deno doc --filter ...`; focused Fresh route/builder tests; SDK cache tests; Fresh hydration tests; three negative type fixtures; direct `clientKey` runtime control | D6 + D7 + `query.md` correction | **FAIL** | D6 mechanisms and all three claimed D7 compile boundaries verified; falsy `clientKey` inputs contradict the documented exact-key rule | Flagged for generator/SDK owner |
| Bare-Fresh fairness | Fresh 2 island/route mechanics; source and existing consumer patterns | Both deep-dives' comparison sections | **FAIL** | Manual island JSON transport is invented; Fresh route groups do not change URL paths | Flagged with exact replacements |
| Cross-links/nav | `cd docs/site && deno task build`; `cd docs/site && deno task check:links`; generated output and front matter | Full site and changed cross-links | **PASS** | 606 files; 31,659 links across 217 pages resolve; nav order 15 correct | Proceeded |
| Prose register | Comparison with `docs/site/explanation/contracts.md` | `route.md`, `query-bridge.md`, changed `query.md` prose | **FAIL** | D7's opening is checklist-like and accusatory; focused replacement supplied | Flagged for generator |

### Batch 2 verdict

**FAIL_FIX.** Correct the `clientKey` falsy-input boundary (in docs or, preferably, SDK source), replace the invented bare-Fresh island serialization with ordinary serializable island props, remove the route-group 404 claim, and normalize the D7 opening transition. The remaining route, query-factory, cache, hydration, compile-boundary, JSDoc-drift, link, and navigation claims pass this audit.

### Batch 2 re-audit

- **Fix commit:** `24dbcaaa7`
- **Per-finding disposition:**

| Batch 2 finding | Status | Re-audit evidence |
|---|---|---|
| G1-F1 — `clientKey(input?)` documented as an exact key for every supplied input | **FIXED** | `query-bridge.md:89,112,347-355` now states the implementation's truthiness boundary, separates prefix invalidation from exact-key operations, and directs exact-key callers to `queryOptions(input).queryKey`. The runtime control reproduced every documented shape: `clientKey()` / `clientKey(0)` / `clientKey(false)` → `['orders','list']`; `queryOptions(undefined).queryKey` → `['orders','list',{}]`; `queryOptions(0).queryKey` → `['orders','list',{input:0}]`. The page also identifies the SDK-side correction path; issue `#1245` owns that source fix. |
| G2-F1 — invented manual JSON script presented as bare-Fresh island transport | **FIXED** | `query-bridge.md:25-71` now uses ordinary serializable island props, explicitly credits Fresh with transport and escaping, removes the invented script/XSS cost, and retains the real distinction: the server and client fetches remain independent and have no shared freshness policy. |
| G2-F2 — moving a route under a Fresh route group claimed to cause a 404 | **FIXED** | `route.md:61-64` now limits breakage to URL-bearing moves and explicitly says `(group)` directories are dropped from the URL, matching the manifest's `shouldSkipRouteSegment` behavior and the page's generated-tree table. |
| G4-F1 — D7 opening used checklist-like, accusatory framing | **FIXED** | `query-bridge.md:55-71` now uses the requested mechanism-led transition (“three coordination seams remain”) and follows it with the response-contract, request/input, query-key, and freshness boundaries without the prior sales-copy language. |

**Final Batch 2 verdict after `24dbcaaa7`: PASS.** All four Batch 2 findings are fixed; no open accuracy, bare-Fresh fairness, cross-link/navigation, or prose-register finding remains.

## Batch 3 audit

- **Changeset:** `24dbcaaa7..c3b6e3059` (`66195fe20` + `c3b6e3059`)
- **Audit mode:** opposite-family `docs_audit`, evidence-only; source and controls were read/run independently of generator claims.

### Gate 1 — mechanism/API accuracy: FAIL

Most of both deep-dives is unusually exact. Source inspection confirmed the four `withForm` installs; handler ordering; state rebasing; field/collection descriptors; CSRF and submission-id boundaries; `FormStateLike`; all eight client defer decisions; profile values; hidden-form transport; prewarm headers and recursion guard; telemetry; streaming-layer bypass; blocking/background layer mapping; and the Suspense-ready, non-streaming boundary.

Independent controls also confirmed the five previously shipped defects the pages call out:

- `ControlProps` is not assignable to Preact `InputHTMLAttributes<HTMLInputElement>` because `role?: string` is wider than `AriaRole` (`TS2322`).
- `FormState<object>` is not assignable to `FormStateLike<object>` (`TS2322`).
- `unknown` is not assignable to `DeferPageRenderable` (`TS2322`).
- `generateSubmissionId()` only creates a UUID and the runtime only round-trips it; no deduplication store or comparison exists.
- Against Zod 4.4.3, the live adapter produced string length, URL pattern, array bounds, nested item constraints, and optionality, but no regex pattern or numeric min/max/step—the page's derivation table is accurate.

The load-bearing defer precedence control produced:

```text
low-bandwidth + server-prewarm                         -> prewarmOnMiss=true, prewarmOnStale=true
low-bandwidth + explicit false flags + server-prewarm -> prewarmOnMiss=true, prewarmOnStale=true
low-bandwidth + none                                   -> prewarmOnMiss=true, prewarmOnStale=false
```

This proves the specific layer claim: `staleReloadMode: 'background'` maps to `server-prewarm` and overrides both policy prewarm fields. It also exposes one overgeneralization below.

Findings:

- **G1-F1 — intent validation is executed, not skipped.** `form.md:147-154` first says `parseFormSubmission` runs `schema.safeParse`, then says “Validation never runs for this branch.” `validation/pipeline.ts` awaits `adapter.safeParse(values)` before `createWithFormHandler` inspects the intent. The intent branch bypasses the **validation gate** and ignores that result; validation itself has already run. Replace the last sentence with: “The schema has already been evaluated during parsing, but this branch returns before the validation result is enforced.”
- **G1-F2 — `RuntimeFormState` has sixteen members, not seventeen.** `form.md:174-184` enumerates 4 + 2 + 3 + 2 + 5 members, matching `_internal/runtime-types.ts`: sixteen. Replace “Seventeen” with “Sixteen.”
- **G1-F3 — `onSuccess.message` cannot be rendered from `RuntimeFormState`.** `form.md:191-193` says the message “comes back … which you render yourself.” `reply.success` preserves `message`, but `resolveRuntimeFormState` does not copy `message` (or `status`/`output`) into the component state. Replace with: “`RuntimeFormState` exposes no success flag or message today. `nextValues` can rebase the rendered values after success; use a redirect or an application-owned feedback channel for a visible success message.”
- **G1-F4 — only `server-prewarm`, not every legacy strategy value, overrides the prewarm flags.** `defer-streaming-ui.md:187-190` says “A legacy `staleStrategy` overrides both prewarm fields.” In `resolveDeferPolicy`, `'none'` is treated as no legacy override; only `'server-prewarm'` forces both fields to `true`. Replace the lead sentence with: “The legacy `staleStrategy: 'server-prewarm'` value overrides both prewarm fields; `'none'` leaves the policy/profile values intact.” The following `staleReloadMode: 'background'` example is correct.

### Gate 2 — bare-Fresh contrast fairness: FAIL

The form comparison is fair: Fresh supplies the request/render primitives, while parsing, schema-error projection, CSRF, repeatable-field identity, and the application mutation remain consumer work. The defer comparison correctly says Fresh does not supply a named cache-freshness policy, but its example invents avoidable transport work.

- **G2-F1 — the bare-Fresh example bypasses the partial mechanism it just credits to Fresh.** `defer-streaming-ui.md:27-43` acknowledges `f-partial` / `f-client-nav`, then uses raw `fetch(...).text()` and says the consumer owns the HTML swap. A normal Fresh implementation can render a hidden GET form carrying `f-partial`, call `requestSubmit()` when stale, and let Fresh perform the named partial swap—the same transport shape `DeferPage` uses. Replace the raw fetch/text/swap portion with a form ref plus `requestSubmit()`, return that hidden `f-partial` form from the island, and change “client refetch” in the cost discussion to “client partial submission.” The real contrast remains intact: bare Fresh still leaves the stale window, server-prewarm/client-submit coordination, and policy vocabulary to the application.

### Gate 3 — cross-links and navigation: PASS

- `storefront/06-storefront-ui.md` links to `/web-layer/form/`; the built target exists.
- `live-dashboard/04-definePage-QueryIsland.md` links to `/web-layer/defer-streaming-ui/`; the built target exists.
- Both pages retain sibling front matter (`layout`, `templateEngine`) and the existing web-layer order (`form` 5, defer/streaming 6); these were in-place pages, so no new nav entry was required.
- Site build: **PASS**, 607 files generated.
- Site link gate: **PASS**, 31,662 internal links across 217 pages all resolve.
- Changed-line internal-wording and versionless-specifier scans found no public leakage or new bare pinnable `jsr:@netscript/*` specifier.

### Gate 4 — prose register: PASS

The mechanism-led explanations, contract boundaries, tables, and decision guidance are consistent with `explanation/contracts.md`. The two “What to watch for” sections are compact consequence summaries rather than filler checklists, and the server-round-trip versus island-mutation guidance is concrete. No prose-only rewrite is warranted; the Gate 1 and Gate 2 replacements above are accuracy/fairness corrections.

### Batch 3 gate log

| Gate | Commands / source | Scope | Result | Findings | Proceeded |
|---|---|---|---|---|---|
| Mechanism/API accuracy | Focused reads of `define-page/builder/mod.tsx`, `form-support.ts`, form runtime/schema/descriptor sources, `Deferred.tsx`, `DeferPage.tsx`, `DeferIsland.tsx`, `policy.ts`, telemetry, and define-page runtime; `deno eval --no-lock` policy + Zod controls; three `deno check --no-lock` negative fixtures; focused form/defer tests | All changed D8/D9 mechanism and API claims, especially policy precedence and Zod 4 derivation | **FAIL** | Three form inaccuracies and one overbroad legacy-strategy sentence; advertised defect controls otherwise reproduced | Flagged with exact replacements |
| Bare-Fresh fairness | Fresh 2 partial attributes/runtime behavior, current page examples, and `DeferPage`'s own ordinary hidden-form transport | Both “What bare Fresh makes you write” sections | **FAIL** | Defer example unnecessarily uses raw HTML fetch/swap instead of Fresh partial submission | Flagged with exact replacement shape |
| Cross-links/nav | `cd docs/site && deno task build`; `cd docs/site && deno task check:links`; built targets, front matter, orders, changed-line scans | Changed pages and two tutorial cross-links; full generated site | **PASS** | 607 files; 31,662 links across 217 pages resolve | Proceeded |
| Prose register | Comparison with `docs/site/explanation/contracts.md` | `form.md`, `defer-streaming-ui.md`, and added tutorial transitions | **PASS** | No filler or prose-only checklist finding | Proceeded |

Test note: the first combined focused test command passed all 29 form/Deferred tests but the `DeferIsland` module setup lacked `--allow-env`; rerunning that file with `--allow-env` passed all 4 tests. This was a command-permission correction, not a product failure.

### Batch 3 verdict

**FAIL_FIX.** Correct G1-F1 through G1-F4 and rebuild the bare-Fresh defer example per G2-F1. The remaining form runtime, defer-policy, transport, observability, streaming, composition, cross-link/navigation, and prose-register claims pass.

### Batch 3 re-audit

- **Fix commit:** `445dfbf37`
- **Per-finding disposition:**

| Batch 3 finding | Status | Re-audit evidence |
|---|---|---|
| G1-F1 — intent branch said validation never runs | **FIXED** | `form.md:147-156` now distinguishes evaluation from enforcement: `parseFormSubmission` has already run `schema.safeParse`, while the intent branch returns before the validation result is enforced. This matches `validation/pipeline.ts` and `form-support.ts` ordering. |
| G1-F2 — `RuntimeFormState` member count was seventeen | **FIXED** | `form.md:173-185` now says sixteen, and its grouped table totals sixteen, matching the sixteen interface members in `_internal/runtime-types.ts`. The prior count came from counting the interface's descriptive “readonly” wording as well as its members. |
| G1-F3 — page claimed a component can render `onSuccess.message` | **FIXED** | `form.md:192-197` now says `RuntimeFormState` exposes neither a success flag nor success message, identifies that `resolveRuntimeFormState` omits `message`, `status`, and `output`, preserves the real `nextValues` rebasing behavior, and recommends a redirect or application-owned feedback channel. |
| G1-F4 — every legacy `staleStrategy` value said to override prewarm flags | **FIXED** | `defer-streaming-ui.md:197-207` now limits the override to `'server-prewarm'`, states that `'none'` is `DeferPage`'s default and preserves policy/profile values, and accurately notes that the active override beats even explicitly false `prewarmOnMiss` / `prewarmOnStale` values. This matches the independent precedence control. |
| G2-F1 — bare-Fresh contrast invented raw HTML fetch/swap work | **FIXED** | `defer-streaming-ui.md:25-78` now credits Fresh for the transport, renders a hidden GET form with `f-partial` / `f-client-nav`, and calls `requestSubmit()` on staleness—the same shape used in `DeferIsland.tsx`. An independent fixture passed `deno check --no-lock` with Fresh's JSX augmentation (an explicit return type was added only to satisfy this repository's unrelated workspace-wide `isolatedDeclarations` rule). The remaining contrast is fair: freshness and server/client coordination are still application policy. |

**Final Batch 3 verdict after `445dfbf37`: PASS.** All five Batch 3 findings are fixed; no open mechanism/API-accuracy, bare-Fresh fairness, cross-link/navigation, or prose-register finding remains.

## Batch 4 audit

- **Changeset:** `445dfbf37..927ca34aa` (`929372637` + `d140195e3` + `927ca34aa`)
- **Audit mode:** opposite-family `docs_audit`, evidence-only; every load-bearing control was rerun independently.

### Gate 1 — mechanism/API accuracy: FAIL

Independent source inspection and a four-control runtime fixture confirmed the central claims:

- Resources resolve through the sequential `for…of` in `runtime/handlers.ts`; layers start through `Promise.all` in `runtime/mod.tsx`. The timing trace showed resource 2 starting only after resource 1 ended, while the fast layer started and ended before the slow layer ended.
- `.withLayer('static', Component)` with no loader emitted no component markup. The runtime's `data ? renderLayerComponent(...) : null` boundary is accurately documented, including `{}` versus `null`/`undefined`.
- A CSRF-enabled `withForm` appends a header resolver, causes `build()` to synthesize `GET`, and conflicts with an explicit `withHandler('GET')` using the documented `withHeader() or withStatus()` error.
- With both `app` and `createApp`, the existing app won and the factory was not called. `configure` ran before the custom `fsRoutes` callback, and the callback's pattern argument was `undefined`.
- The negative checker control `definePage().withHeader('x-thing')` produced `TS2769`, exactly matching the corrected overload claim at `response.md:170-172`.
- The rest of the layer, layout/slot, header ordering, status, streaming, build-result, prepared-handler, app-option, and route/cache surfaces match the implementation. The focused package suites also passed all 29 tests.

Findings:

- **G1-F1 — cache registration is caused by the module import, not by invoking `defineFreshApp`.** `server.md:83-87` says registration is an import side effect, then concludes “bypassing `defineFreshApp` bypasses it.” `server.md:199-201` likewise says importing `@netscript/fresh/server` registers it, then says constructing the app another way is what breaks it. `runtime/server/define-fresh-app.ts` imports `@netscript/sdk/cache` at module evaluation; `runtime/server/mod.ts` re-exports that module. A caller can import `/server` and construct `new App()` manually while still receiving the registration. Replace both conclusions with: “A bare Fresh entry point that never imports `@netscript/fresh/server` bypasses the registration. Calling `defineFreshApp` is not itself the trigger; evaluating the `/server` module is.”
- **G1-F2 — `withMeta` accepts a synchronous or asynchronous resolver.** `response.md:121` says it “registers an async function.” `PageMetaResolver` returns `PageMetaDescriptor | Promise<PageMetaDescriptor>`, and the page's own example is synchronous. Replace “registers an async function” with “registers a resolver—synchronous or asynchronous.” The claim that it runs after layers is correct.

### Gate 2 — bare-Fresh contrast fairness: FAIL

All three contrasts type-check under a consumer-style Fresh 2 config. An independent fixture checked the layers handler/page, the `ctx.render(vnode, ResponseInit)` response example, and the `App().use(...).fsRoutes()` bootstrap together with Fresh's JSX augmentation. The layers comparison is mechanically fair, and the server comparison fairly identifies application-owned ordering and the missing `/server` import side effect. Two contrast claims still overreach:

- **G2-F1 — Fresh middleware is a header composition point.** `response.md:60-63` says everything contributing a header must be assembled by the same handler and “Headers have no merge point.” Fresh middleware can `await ctx.next()`, then set or clone/replace response headers; app/route middleware is the ordinary cross-route composition seam for cache directives, tenant tags, and cookies. It is fair to say that component regions cannot directly contribute response headers, but not that Fresh has no merge point. Replace the paragraph with: “**Headers do not merge at the component-region level.** The handler can assemble them in `ResponseInit`, and Fresh middleware can add or replace headers around `await ctx.next()`. A rendered component itself cannot contribute a response header, so region-owned concerns need an agreed handler or middleware seam.”
- **G2-F2 — the reserved `name` option is not a current advantage over bare Fresh.** `server.md:82-84` counts the absence of a way to say the app is `dashboard` as a bare-Fresh cost, while `server.md:110,140-145` correctly says `defineFreshApp.name` is accepted but unread. Bare Fresh can also hold an application name in a constant/config value; neither path currently changes logging. Remove that sentence from the contrast and leave `name` documented as a reserved compatibility seam, not present-day functionality.

### Gate 3 — cross-links and navigation: PASS

- `/web-layer/layers/` and `/web-layer/response/` are linked from the Web Layer hub and `builders.md`; their related cards cross-link the relevant resources, partials, defer, form, route, and tutorial pages.
- Live-dashboard chapter 4 lands at `/web-layer/layers/`; chapter 1 lands at the `#composing-the-runtime-server` anchor on `/web-layer/server/`.
- New pages follow sibling front matter and occupy the next navigation orders, 16 and 17.
- `cd docs/site && deno task build`: **PASS**, 613 files generated.
- `cd docs/site && deno task check:links`: **PASS**, 32,387 internal links across 219 pages all resolve.
- Changed-line scans found no issue/PR/harness vocabulary leakage and no new bare pinnable `jsr:@netscript/*` specifier.

### Gate 4 — prose register: FAIL

The three pages mostly match `explanation/contracts.md`: they lead with a concrete boundary, expose implementation consequences, distinguish current behavior from reserved seams, and use “What to watch for” as compact failure guidance rather than filler. One conspicuous sentence is both inaccurate and checklist-like:

- **G4-F1 — “Adding a region is a three-file edit” is unsupported by the example.** `layers.md:64-66` shows the handler data shape and JSX in one route module and does not identify three files. Replace the heading and sentence with: “**Adding a region couples several sites in the route module.** The handler's `Promise.all`, returned data shape, and JSX must change together; the type tying them together is inferred from the whole handler rather than declared per region.”

No broader prose rewrite is warranted.

### Batch 4 gate log

| Gate | Commands / source | Scope | Result | Findings | Proceeded |
|---|---|---|---|---|---|
| Mechanism/API accuracy | Focused reads of define-page builder/runtime/types/rendering, form synthesis, `define-fresh-app.ts`, server barrel, and SDK cache registration; four independent runtime controls; `withHeader` negative `deno check`; focused package tests | D2, D8, D9 and changed pointers | **FAIL** | Module-import trigger misstated; `withMeta` sync resolver excluded by wording | Flagged with exact replacements |
| Bare-Fresh fairness | Three consumer-config `deno check --no-lock` fixtures; Fresh `Context.next`/render surface; contrasts against current NetScript behavior | Layers, response, and server contrasts | **FAIL** | Middleware omitted as a header seam; reserved app name presented as present-day value | Flagged with exact replacements |
| Cross-links/nav | `cd docs/site && deno task build`; `cd docs/site && deno task check:links`; generated targets/anchor, front matter, orders, changed-line scans | Full changed set and generated site | **PASS** | 613 files; 32,387 links across 219 pages resolve; orders 16/17 | Proceeded |
| Prose register | Comparison with `docs/site/explanation/contracts.md` | `layers.md`, `response.md`, `server.md`, and changed transitions | **FAIL** | Unsupported “three-file edit” checklist claim | Flagged with exact replacement |

Validation hygiene: the independent fixtures were removed after execution. Validation added no new source change. The source worktree retains only its pre-existing `deno.lock` addition for `jsr:@netscript/queue@0.0.4`.

### Batch 4 verdict

**FAIL_FIX.** Correct G1-F1, G1-F2, G2-F1, G2-F2, and G4-F1. The load-bearing layer/resource concurrency, empty-layer, form/GET conflict, header-overload, app-construction/order, function-form `fsRoutes`, consumer type-check, cross-link/navigation, and remaining prose claims pass.

### Batch 4 re-audit

- **Fix commit:** `cf21cb52c`
- **Per-finding disposition:**

| Batch 4 finding / extension | Status | Re-audit evidence |
|---|---|---|
| G1-F1 — cache registration attributed to invoking `defineFreshApp` | **FIXED** | `server.md:82-88,200-204` now says evaluation of `@netscript/fresh/server` is the trigger, explicitly distinguishes the module import from the function call, and correctly notes that hand-rolling `new App()` while still importing `/server` keeps the registration. |
| G1-F2 — `withMeta` described as async-only | **FIXED** | `response.md:121-124` now says the resolver may be synchronous or asynchronous and retains the correct after-layers timing. |
| G2-F1 — bare Fresh said to have no header merge point | **FIXED** | `response.md:60-65` now credits handler `ResponseInit` and Fresh middleware around `await ctx.next()` as header-composition seams, while limiting the real gap to rendered component regions. |
| G2-F2 — reserved `name` option presented as current value over bare Fresh | **FIXED** | `server.md:82-88` removes the app-name contrast entirely; `name` remains accurately documented later as accepted but unread. |
| G4-F1 — unsupported “three-file edit” claim | **FIXED** | `layers.md:64-66` now describes the actual coupling among the handler's `Promise.all`, returned data shape, and JSX within the route module. |
| Scope extension — identical call-trigger claim in `query-bridge.md` | **NOT-FIXED** | `query-bridge.md:325-331` now has the correct import-trigger boundary and agrees with `server.md`, but its lead-in at `query-bridge.md:304-319` still says “`defineFreshApp` performs a bare side-effect import” and that bringing up the app “through `defineFreshApp` registers” the provider “as a side effect of the bootstrap.” The function performs no import when called; its containing module imports `@netscript/sdk/cache` during evaluation. The related-card text at `query-bridge.md:369` also says the `defineFreshApp` bootstrap registers the cache. Replace those remaining call/bootstrap formulations with module-evaluation language so the section does not contradict its own corrected bullet. |

Additional scope checks:

- `layers.md:334-338` accurately labels the delivery-span default as a reporting discrepancy, states that behavior is unaffected, and gives `page.layer.has_partial` as the current trace workaround.
- No `#1255` reference or other new issue/PR/process vocabulary appears in the public changes; the defect remains described as product behavior without internal tracker leakage.

**Final Batch 4 verdict after `cf21cb52c`: FAIL_FIX.** G1-F1, G1-F2, G2-F1, G2-F2, and G4-F1 are fixed. The `query-bridge.md` scope extension remains partially inconsistent at lines 304-319 and 369; correct those remaining call-trigger formulations before PASS.

**Final Batch 4 verdict after `f8e21635a`: PASS.** The three residual `query-bridge.md` formulations now consistently attribute cache-provider registration to evaluation of the `@netscript/fresh/server` subpath, not invocation of `defineFreshApp`; all Batch 4 findings and the scope extension are fixed.

## Benchmark page audit

- **Changeset:** `c33f633a2^..c33f633a2` on `docs/tutorial-benchmark`
- **Audit mode:** opposite-family `docs_audit`, evidence-only. The auditor fetched every cited external URL and judged the live pages rather than relying on the generator's refresh report.

### Gate 1 — external claim accuracy: FAIL

All eleven unique external URLs present in `compared.md` returned HTTP 200 through `curl -L --compressed` (the unversioned Nuxt introduction is a small client redirect to `/docs/4.x/getting-started/introduction`). Live-source inspection confirmed the load-bearing claims named in the brief:

- Nuxt 4.5.1 exposes eighteen Getting Started topics in exactly the documented order; Views, Assets, Styling, Routing, SEO and Meta, and Transitions precede Data Fetching and State Management. Its installation page provides a StackBlitz browser starter and `npm create nuxt@latest`.
- Laravel's current official course has thirteen lessons, builds Chirper, and places “Deploying your app” fourth—after the first route and before MVC/database/model work. Registration, login/logout, and the closing next-steps lesson are present.
- Rails' current Getting Started guide builds a product store across twenty-three numbered sections. It separately runs `bin/rails generate model Product name:string`, `bin/rails generate controller Products index --skip-routes`, and `bin/rails generate authentication`; the authentication generator creates User and Session models plus the required controllers and views.
- SvelteKit's live docs establish filesystem routing, generated `$types`, universal versus server-only `load`, server form actions, validation, and `use:enhance`; its browser tutorial exposes Basic and Advanced tracks for both Svelte and SvelteKit.
- Next's live dashboard course teaches direct database queries from Server Components, React Server Actions, and links its API-layer discussion to Route Handlers.

Findings:

- **G1-F1 — the current Next.js course does not close with deployment.** `compared.md:35-39` calls the dashboard course sixteen chapters but replaces its actual final chapter, Chapter 16 “Next Steps,” with “a closing deployment chapter.” The live sequence is Chapters 1–15 from Getting Started through Adding Metadata, followed by Next Steps. Deployment belongs to the separate Pages Router course surfaced elsewhere in the page data. Replace the end of the sequence with “metadata, and a closing next-steps chapter.”
- **G1-F2 — the current Rails guide does not end at Kamal deployment.** `compared.md:108` says the remaining sections end at Kamal deployment. Deployment is section 22; section 23 is “What's Next?”. Replace “ending at Kamal deployment” with “including Kamal deployment before a closing what's-next section.” The surrounding Product-store, generator, authentication, and breadth claims are accurate.

### Gate 2 — fairness: FAIL

The comparison is otherwise notably fair. It limits the benchmark to canonical learning flows, explicitly rejects capability-based superiority claims, concedes the peers' browser learning, first-screen speed, generators, breadth, deployment guidance, and ecosystem depth, and states when a peer is the better choice. NetScript's four divergences link to their full internal explanations instead of re-presenting them as unsupported comparison copy.

One claim undercuts that fairness:

- **G2-F1 — “NetScript … does not ship a deployment story” is both obsolete and harsher than the evidence.** `compared.md:216-218` contrasts Laravel Cloud/Kamal with an assertion that NetScript ships no deployment story. NetScript is correctly described as not being a hosted platform, but the repository now documents and ships `netscript deploy deno-deploy <op>`, generated Deno Deploy/Compose/bare-metal workflow starters, Aspire-backed target routers, and manual deployment recipes. Replace the sentence with: “NetScript is not a hosted platform: it ships deployment commands, starter workflows, and recipes, but choosing and provisioning the hosting platform remains yours.” Link “deployment commands” to `/orchestration-runtime/how-to/deploy/` (or the narrower Deno Deploy how-to).

### Gate 3 — internal accuracy, cross-links, and nav: FAIL

The four principal divergence claims match the current internal docs and source:

- `explanation/contracts.md` confirms that one contract projects handler input/output, the derived client, OpenAPI, and UI consumption without a separate generator step; the quickstart inspects the contract before the page.
- `netscript init` scaffolds the Deno workspace containing contracts, `services/<name>`, `apps/<name>`, plugin workspace/runtime surfaces, and Aspire orchestration; `--no-aspire` is a real public CLI option.
- The saga/workflow material models checkpointed state and compensation as first-class runtime behavior.
- The generated AppHost supplies the resource graph, OTLP endpoint, and Aspire dashboard from the first orchestrated run, while the linked observability page accurately separates automatic runtime spans from the scaffold's no-op custom job-tool helpers.

The web-layer summary also agrees with the already-audited resources, parallel layers, server forms, partial/defer policy, and query-bridge pages. Nav/front matter is coherent: `compared.md` is explanation order 8; the hub now lists eight topics; the reading path includes it; both front matter and `nextPrev` move Aspire → Compared → Capabilities; `/why/` links back to it.

Automated evidence:

- `cd docs/site && deno task build`: **PASS**, 617 files generated.
- `cd docs/site && deno task check:links`: **PASS**, 32,773 internal links across 220 pages.
- Changed-line scans found no versionless pinnable `jsr:@netscript/*` specifier and no issue/PR/harness/generator/process vocabulary leakage.

Gate 3 nevertheless fails on the same internally false deployment statement recorded as G2-F1. The source worktree retained only its pre-existing `deno.lock` modification; the audit introduced no source change.

### Gate 4 — prose register: FAIL

The page otherwise matches the explanation siblings: it opens with a bounded thesis, interprets evidence rather than dumping a checklist, gives each divergence a named conceptual consequence, acknowledges costs, and closes with useful onward paths. One counting inconsistency breaks the register:

- **G4-F1 — “all four” refers to five frameworks.** `compared.md:17-20` names Next.js, Nuxt, SvelteKit, Laravel, and Rails and then says NetScript diverges from “all four”; `compared.md:99` heads a five-row table “The property all four share.” If the intended unit is five frameworks, replace both with “all five.” If the intended unit is four flow families, explicitly name that grouping before using the count; the current table still needs a five-framework heading.

### Benchmark gate log

| Gate | Command(s) | Scope | Result | Findings | Proceeded |
|---|---|---|---|---|---|
| External claim accuracy | `curl -L --compressed --max-time 40 -A 'Mozilla/5.0 docs-audit' -sS -o <file> -w '%{http_code}' <url>` over all eleven unique URLs; focused live-page reads of the resulting HTML and canonical pages | Next.js Learn + installation; Nuxt introduction + installation; SvelteKit routing/load/form actions/tutorial; Laravel course + installation; Rails Getting Started | **FAIL** | Next ends with Next Steps, not deployment; Rails has What's Next after Kamal deployment | Flagged with exact replacements |
| Fairness | Comparative read against each live peer flow and the page's own strengths/cost sections | Full `compared.md` | **FAIL** | NetScript's shipped deployment surfaces are denied | Flagged with fair replacement and internal link |
| Internal accuracy / links / nav | Focused reads of contracts, quickstart, CLI scaffold/source, durability, Aspire, observability, and web-layer pages; `cd docs/site && deno task build`; `cd docs/site && deno task check:links`; changed-line leakage/specifier scans | Four divergences, web-layer paragraph, new page/front matter, explanation hub, Aspire chain, `/why/` link | **FAIL** | Core claims/nav pass; deployment statement contradicts shipped docs/source | Flagged; no source edits |
| Prose register | Comparison with `docs/site/explanation/contracts.md` and explanation siblings | New page and hub transition | **FAIL** | “all four” used for five frameworks in two places | Flagged with exact normalization |

### Benchmark page verdict

**FAIL_FIX.** Correct G1-F1, G1-F2, G2-F1/G3-F1, and G4-F1. The Laravel, Nuxt, SvelteKit, Rails generator/authentication, Next server-data, four internal-divergence, strengths/concessions, navigation, build, link, specifier, and leakage checks otherwise pass.

### Benchmark page re-audit

- **Fix commit:** `260201d32`

| Benchmark finding | Status | Re-audit evidence |
|---|---|---|
| G1-F1 — Next.js dashboard course said to close with deployment | **FIXED** | `compared.md:35-39` now ends the sixteen-chapter sequence with “a closing next-steps chapter.” A fresh fetch of `/learn/dashboard-app/next-steps` returned 200 and identifies the page as “Next Steps” / “Next.js Dashboard Course Conclusion.” No unsupported Pages Router explanation was added. |
| G1-F2 — Rails guide said to end at Kamal deployment | **FIXED** | `compared.md:108` now says the guide includes Kamal deployment before a closing what's-next section, accurately preserving section 22 followed by section 23. A fresh fetch of the canonical Rails guide returned 200. |
| G2-F1/G3-F1 — NetScript said not to ship a deployment story | **FIXED** | `compared.md:216-219` now draws the accurate boundary: NetScript is not a hosted platform, but ships deployment commands, starter workflows, and recipes; platform choice and provisioning remain user-owned. “deployment commands” links to `/orchestration-runtime/how-to/deploy/`, whose current text documents the shipped surfaces and the honest limit that NetScript does not directly generate a Dockerfile, Compose file, or finished cloud stack. |
| G4-F1 — “all four” used for five frameworks | **FIXED** | `compared.md:17-20` explicitly names Laravel and Rails as the batteries-included pair and says “all five”; the five-row table heading at line 99 also says “all five.” The separate “Four consequences” count correctly refers to NetScript's four divergences and remains unchanged. |

**Final Benchmark page verdict after `260201d32`: PASS.** All four findings are fixed; no external-accuracy, fairness, internal-accuracy/navigation, or prose-register finding remains.
