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
