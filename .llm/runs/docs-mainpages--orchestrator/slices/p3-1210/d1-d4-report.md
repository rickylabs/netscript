# P3 slices D1 + D4 — exemplar deep-dives

Worktree: `/home/codex/repos/ns-deepdives`, branch `docs/web-layer-deep-dives` (off
`8dbc16bee`, phase-2 tutorial sweep). Pushed with explicit refspec; no PR opened.

Commits:

- `9f2c236fe` docs(web-layer): add the withResource deep-dive
- `4480edb39` docs(web-layer): add the partials deep-dive

## D1 — `docs/site/web-layer/resources.md` (order: 13)

Structure:

1. **Opening** — three regions, one request, three round trips; what `withResource` is.
2. **What bare Fresh makes you write** — the four-step ceremony (hand-maintained `State`
   interface, `routes/_middleware.ts`, one `define.handlers` GET body, prop drilling), with a
   real Fresh 2 snippet (`define.middleware`, `{ data: … }`, `define.page<typeof handler>`), then
   the three named costs: the state bag is a promise not a proof; sharing across a boundary means
   a hand-rolled `WeakMap` memo; ordering lives in one function.
3. **The mechanism** — the verbatim resolution loop from
   `builders/define-page/runtime/handlers.ts`, and the four facts that follow: params parse first
   (so resources are URL-aware), sequential in declaration order, shared store =
   request-scoped dedup, `page.resource.<key>` span per resource. Includes the verbatim runtime
   throw `definePage() could not resolve resource "…"` (from `runtime/context.ts:resolveResource`)
   read as "not yet", not only "not there".
4. **Pattern 1 — one resource, every layer**: the dedup exemplar; resources as shared substrate vs
   layers as per-region refinement.
5. **Pattern 2 — auth/context-aware queries**: `session` → `settings` ordered dependency, tenant
   scoping, pairing with `withPolicy`.
6. **Pattern 3 — URL-aware resources**: `ctx.search` already parsed; request boundary = cache
   boundary; links to the live-dashboard chapter that does this.
7. **Pattern 4 — `withResources`**: grouping convenience, *not* concurrency (still awaited one at a
   time); use `Promise.all` inside one factory to overlap, which also keeps the trace honest.
8. **Reading resources elsewhere** table (`ctx.resource` / `hooks.useResource(key)` /
   `useDefinePageResource`) — hook name verified against
   `define-page/navigation/mod.ts:createDefinePageHooks`.
9. **What to watch for** — a resource is not a cache; sequential by design; declaration order is
   API; span names are keys.
10. Related card grid.

## D4 — `docs/site/web-layer/partials.md` (order: 14)

Structure:

1. **Opening** — a partial serves two jobs (partial navigation, deferred region refresh) through
   three pieces.
2. **What bare Fresh makes you write** — named Fresh 2 mechanics: `config = { skipAppWrapper,
   skipInheritedLayouts }`, `<Partial name>` from `fresh/runtime`, `f-partial` anchors under an
   `f-client-nav` ancestor (attribute verified in `packages/fresh-ui/src/presentation/data-grid.tsx`),
   per-file try/catch error markup — then the two stringly-typed couplings that break on rename.
3. **`definePartial`** — the returned `DefinedPartialRoute` quartet, the framework-defaults-win
   config merge, the `errorHandler`/`ErrorDisplay` shell with the verbatim default title
   `Failed to load ${name}`, `errorComponent` receiving `PageErrorPrimitives`; the two things it
   does not do (`TContext` is yours; it does not know its own URL).
4. **`defineStatsPartial`** — context-free `query`; points at the real scaffold template
   `routes/partials/examples/<service>-summary.tsx`.
5. **`route.withPartial()`** — `PagePairedRouteTarget`, `getLinkProps` → `PagePartialLinkProps`
   with `f-partial`, `href`/`partialHref`, the `partialPath`/`partialSearch`/
   `partialPreserveSearchParams` escape hatches; the rename-safety argument.
6. **Deferred-loader composition** — the load-bearing section: a layer with `partial` makes
   `runtime/mod.tsx` render a `DeferPage` for you. Mapping table (partial → `partial`; action →
   current pathname; `partialName` defaulting to the layer id; `fallback`; `staleTime` + cache-entry
   loader result → `cachedAt`; `staleReloadMode: 'background'` → `staleStrategy: 'server-prewarm'`;
   layer `policy` falling back to page `withPolicy`; `params` → partial-only search params), plus
   the `delivery: 'stream'` opt-out.
7. **What the runtime actually does today** — the honest boundary, mirroring `Deferred.tsx`'s own
   doc comment (Suspense-ready, becomes progressive once streaming delivery lands), and the
   transport truth: refresh is a hidden-form `requestSubmit()` re-request plus fire-and-forget
   server prewarm tagged `X-Defer-Prewarm: 1` — no push channel; live-after-settle regions belong
   to streams/live queries. (No long-poll claim was made: nothing in `packages/fresh` supports one,
   so the verified transport facts are stated instead.)
8. **What to watch for** — defaults win the merge; `name` is the one coupling types do not close;
   export `page`/`default`, not the object; stats partials get no context; a partial may carry a
   `handler`.
9. Related card grid.

## Verification

- Every symbol, default, and error string was read from `packages/fresh` source
  (`builders/define-partial.tsx`, `builders/define-page/{runtime/handlers.ts,runtime/mod.tsx,
  runtime/context.ts,catalog.ts,builder/mod.tsx,page-compat/route-types.ts,navigation/mod.ts}`,
  `defer/{Deferred.tsx,DeferPage.tsx,DeferIsland.tsx,policy.ts}`,
  `diagnostics/error/handler.ts`) plus the CLI scaffold templates.
- Example snippets extracted to repo-root scratch files (`scratch-d1.tsx`, `scratch-d4.tsx`, deleted
  before commit — nothing added under `packages/`) and type-checked:
  `deno check --unstable-kv --no-lock ./scratch-d1.tsx` and `./scratch-d4.tsx` — both clean. Only
  the illustrative bare-Fresh snippets are unchecked, by nature.
- `cd docs/site && deno task build` — exit 0, 603 files.
- `deno task docs:links` — `docs=102 broken-links=0 broken-anchors=0 orphans=0`, OK.
- `deno.lock` restored after the build touched it; final `git status` shows docs-only changes.

## Cross-links added

Into the deep-dives (first point of contact, one each):

- `tutorials/live-dashboard/04-definePage-QueryIsland.md` → `/web-layer/resources/` (Step 2,
  `.withResource` paragraph) and → `/web-layer/partials/` (Step 3, the `partial`/`partialName` layer).
- `tutorials/storefront/06-storefront-ui.md` → `/web-layer/resources/` (Step 4 intro).
- `tutorials/chat/03-chat-ui.md` → `/web-layer/resources/` (Step 2 intro).

Reference wiring:

- `web-layer/index.md` — both pages added to the "How a page is put together" leaf list.
- `web-layer/builders.md` — resources pointer after the builder-methods table; partials pointer in
  the Partials section; `Request-scoped resources` card added to the Related grid.
- `web-layer/route.md` — paired-route section → `/web-layer/partials/`.
- `web-layer/defer-streaming-ui.md` — `DeferPage` section → `/web-layer/partials/`.
- Out from each new page: builders, route, query, defer-streaming-ui, error, testing, and the
  live-dashboard chapter, via the standard `comp.cardsGrid` Related block.

## Notes for the evaluator

- Validation is generator-side only per the CLAUDE.md documentation-authoring exception; a separate
  opposite-family session still owes a per-page verdict.
- Benchmark material was not cited on either page: the D1/D4 argument is carried by the concrete
  bare-Fresh ceremony, so no CONFIRMED/WRONG competitor claim was needed.

## Fix round 1

Audit: `.llm/runs/docs-mainpages--orchestrator/slices/deepdives-audit/audit.md` — verdict FAIL_FIX.
Every finding was re-verified against source before being applied; none was rebutted, and one was
found to understate the problem (see G1-F1 below).

Commits: `0fc50f7cf` (resources.md + live-dashboard ch.4), `99c62f27b` (partials.md +
live-dashboard ch.5). Pushed to `docs/web-layer-deep-dives`.

### Per-finding disposition

| Finding | Verified how | Disposition |
|---|---|---|
| G1-F1 declaration order is compile-time, not runtime-only | Own negative control: swapped dependent resources → `TS2339: Property 'tenantId' does not exist on type 'never'`, exit 1. Type state confirmed at `types.ts:DefinePageWithResource` + `DefinePageBuilder.withResource` | **Accepted, and extended.** The audit says the typed chain rejects the swap; a second control showed the *typo* case (`ctx.resource('sesion')` whose value is never destructured) type-checks **clean** — `never` only errors at the first property access. The page now says exactly that, so the runtime guard keeps a real job (erased/dynamic/cast access) instead of being presented as the primary detector. The earlier "misspell the key and it is a compile error" claim was also wrong and is fixed. |
| G1-F2 span gating + "once per request" | `runtime/context.ts:25-50` (`telemetryEnabled` → `config.telemetry?.enabled !== false`); `prepareRequestState` call sites: `runtime/mod.tsx:102` (page pipeline) and `builder/mod.tsx:128` (every `withHandler()` method handler) | **Accepted.** Wording is now "resolved once while the page pipeline prepares", with an explicit "where the guarantee stops" paragraph naming the custom-handler second preparation. Span sentence notes telemetry gating; kept the fact that telemetry is on unless `withTelemetry({ enabled: false })`, which the audit's phrasing left ambiguous. |
| G1-F3 manual route reference ≠ rename safety | `route/_internal/contract-runtime.ts` pairing; the page's own example uses `createRouteReference('/partials/…')`, a literal | **Accepted.** Replaced with: the reference centralizes typed URL construction, the literal is not rename-tracked, and the generated `routes` tree (`packages/cli/.../router.ts.template` re-exporting `.generated/routes.ts`) is what makes a moved route file a compile error. |
| G1-F4 "converge on one declaration" | `runtime/mod.tsx:165-223` — `partialName ?? descriptor.id`, no cross-check against `definePartial`'s `name` | **Accepted.** Now "colocated in one layer configuration … colocated is not verified". |
| G1-F5 URL change ≠ cache invalidation | `handlers.ts:33-61` builds a fresh store per preparation | **Accepted.** Rewrote the paragraph and the "a resource is not a cache" bullet. |
| G2-F1 `ctx.render({ … })` is not the data API | `deno doc --filter Context jsr:@fresh/core@2.3.3` → `render(vnode: VNode<any> \| null, init, config)` | **Accepted.** Prose now matches the page's own (already correct) `{ data: … }` snippet and names the VNode signature. |
| G2-F2 `WeakMap` keyed on `ctx.req` cannot reach a sibling partial | Partial navigation is a separate HTTP request → separate `Request` identity | **Accepted.** The memo's reach is now stated as one request, with the partial case called out as needing a real cross-request cache. |
| G2-F3 partial error handling is optional UX | `define-partial.tsx` wraps the loader by choice; a partial route is its own response | **Accepted.** Bare-Fresh bullet reworded; the "takes down the response it was rendered into" claim removed. |
| G3-F1 missing live-dashboard ch.5 link | `rg` confirmed no match | **Accepted.** Added at the "no `withPolicy`, no `partial`, no `staleTime`" contrast in Step 3 — the point where the chapter is explicitly reasoning about partial-refreshed vs pushed regions. |
| G4 prose replacements | — | **Accepted.** Four `Pattern N —` headings renamed to the audit's explanatory headings; intro reframed on the lifecycle contract; "Four facts follow…" → "The loop establishes four observable properties:"; "Count the couplings." → "This version has four independent couplings."; boundary-section intro replaced. Substance adopted; sentences written in the page's own register rather than pasted verbatim. |
| G4 cross-page "once per request" inheritance | live-dashboard ch.4 L100 and the builder-chain table row | **Accepted (scope note).** Two phrases in the phase-2 tutorial were narrowed to "once per page render" so the tutorial and the deep-dive do not contradict each other. No other phase-2 prose was touched. |

Nothing was rebutted. One audit detail is cosmetic and was ignored: several evidence paths in the
audit are misspelled (`define-page/mod.tsx` for `define-page/builder/mod.tsx`,
`application/components/DeferPage.tsx` for `application/defer/DeferPage.tsx`,
`application/policy.ts` for `application/defer/policy.ts`). The cited line ranges and content match
the real files, so the findings stand.

### Gate results after the fix

| Gate | Command | Result |
|---|---|---|
| Site build | `cd docs/site && deno task build` | PASS (exit 0, 603 files) |
| Doc links | `deno task docs:links` | PASS — `docs=102 broken-links=0 broken-anchors=0 orphans=0` |
| Changed examples | `deno check --unstable-kv --no-lock ./scratch-fix.tsx` (dependent-resource chain, paired route reference, `definePartial`) | PASS (exit 0) |
| Ordering negative control | `deno check --unstable-kv --no-lock ./scratch-order.tsx` (swapped dependent resources) | Expected FAIL (exit 1, `TS2339 … type 'never'`) |
| Typo control | `ctx.resource('sesion')` with the value passed through untouched | PASS (exit 0) — the finding behind the extended G1-F1 wording |
| Lock hygiene | `git checkout HEAD -- deno.lock`; final `git status` | Clean — only the four intended docs files; the stray `jsr:@netscript/queue@0.0.4` lock line is not in either commit |

All scratch fixtures were deleted; nothing was added under `packages/`.

---

## Batch 2 (D6+D7)

Worktree `/home/codex/repos/ns-deepdives`, branch `docs/web-layer-deep-dives`.
Commits `903538321` (D6) and `df1327f5e` (D7), pushed. Draft PR #1241 carries them.

### D6 — route contracts (`903538321`)

`docs/site/web-layer/route.md` rewritten in place from a reference listing into the
resources.md/partials.md deep-dive shape. `builders.md` and `web-layer/index.md` re-pointed.

Closes the three helpers the inventory recorded as undocumented anywhere (`fallback`,
`enumPathParamSchema`, `defineEnumPathParam`) and replaces implied semantics with verified ones:

| Claim | Verified how |
|---|---|
| Every `paginationSearchSchema` base field is `.catch()`-wrapped, so the base parse has no failure path | `search-params.ts:135-152`; runtime control: `parse({page:'banana',limit:'-4',sortOrder:'sideways'})` → `{page:1,limit:25,sortBy:'',sortOrder:'desc',offset:0}` |
| Extended fields are *not* caught — the one way the schema throws — which is what `fallback()` is for | runtime control: `.extend({status: z.enum([...])}).safeParse({status:'nope'}).success === false`; with `fallback(...)` → `status:'open'` |
| `offset` is derived output, `Math.max(page-1,0)*limit` | `addPaginationOffset`, `search-params.ts:48-55` |
| Repeated params take the first value | `firstSearchParamValue` preprocess; control: `{page:['2','9']}` → `page:2` |
| `enumPathParamSchema` narrows the parsed path to its one key and drops other segments | `contract-runtime.ts:126-149`; control: `safeParse({status:'open',id:'42'})` → `{status:'open'}` |
| `href()` serializes the whole parsed search state, including derived `offset` and empty `sortBy` | `normalizeBaseSearch` uses `searchSchema.safeParse({})` as the base (`link.tsx:124-142`); control: `href({path:{status:'open'},search:{page:2}})` → `/orders/open?page=2&limit=25&sortBy=&sortOrder=desc&offset=25` |
| `preserveSearchParams` only preserves when the rendering route pattern matches the target | `link.tsx:130` — guarded on `navigationContext?.routePattern === routePattern` |
| A contract-free `createRouteReference` does **not** validate search | `contract-runtime.ts:367-372` — `parseSearch` is `toSearchParamInput`, `safeParseSearch` always `{success:true}`; control confirmed `?page=banana` parses clean |
| `$href` is `undefined` for any pattern containing `[` | `hasDynamicRouteSegments`; control: `/orders` → `/orders`, `/orders/[id]` → `undefined` |
| Routes-tree accessor derivation (`$id`, `$slugAll`, `$pathOptional`, skipped `index`/`_app`/`_layout`/`(group)`, trailing `$route`) | `manifest.ts:120-200` (`toRouteKeySegment`, `inferRouteKeyPath`) |
| Rename safety is scoped to generated accessors only | `renderNetScriptRoutesModule` + `writeNetScriptRouteManifestSync`; the page states a hand-written pattern literal is **not** rename-tracked (consistent with the audited partials.md wording) |
| Form A/B/C conflict messages quoted verbatim | `manifest.ts:373-379` (build error), `manifest-page-module.ts:372-375` (warning), `route-support.ts:77-83` (`$route` throw) |
| `$route` and `withRoute()`'s reference check are runtime guards that fire **at module load** | `DefinePageRouteContractInput.$route?: string` (`types.ts:139`) is optional; `builder/mod.tsx:448-461` promotes eagerly in the chain |

### D7 — the query bridge (`df1327f5e`)

New page `docs/site/web-layer/query-bridge.md` (order 15). `query.md` gains a pointer plus one
correction; `web-layer/index.md` gains the leaf.

New page rather than a query.md deepening because query.md (463 lines) documents the
`createServiceQueryUtils` client-only path and explicitly punts the cache-first
`createQueryFactories` variant to the SDK pillar — that punt is exactly D7's subject. Matches the
D1/D4 precedent of carving a deep-dive out rather than growing a 700-line page.

Undocumented material now covered: the factory's five provider-backed vs four pure methods (with the
`getCacheProvider()` error message quoted, which itself names the split); the two key tiers and the
`cache_query` KV prefix; `getCachedEntry` as a pure read against the callable's SWR path; and the
`import '@netscript/sdk/cache'` in `define-fresh-app.ts:6` that makes any of it work.

**Three compile-time boundaries established by running the type checker, not by reading types:**

| Boundary | Control |
|---|---|
| `initialDataUpdatedAt` is documented in `query-client/types.ts` as the route for `cachedAt`, but is absent from `IslandQueryOptions` | `TS2353: … 'initialDataUpdatedAt' does not exist in type 'IslandQueryOptions<…>'`. The same literal without that line checks clean. Consequence stated on the page: a KV entry's real age cannot age the hydrated entry. |
| `createNetScriptQueryClient()` returns a real `QueryClient` typed as the narrower `QueryClientPort` | `TS2551` (no `prefetchQuery`, only `fetchQuery`) and `TS2345` (not assignable to `dehydrateQueryClient`). The page shows the working form **with** the `as unknown as IslandQueryClient` bridge and names the cost. |
| `IslandQueryResult` declares seven members; `isRefetching`/`isFetching` exist at runtime only | `TS2339: Property 'isRefetching' does not exist on type 'IslandQueryResult<…>'` |
| Dehydrated state *does* carry per-query age | ran `dehydrateQueryClient` on a seeded client → each query carries `dataUpdatedAt` plus a `dehydratedAt` stamp. This is the mechanical basis for the dehydrate-vs-props table rather than a restatement of the JSDoc. |

Honest guidance the page lands on — "props by default; dehydrate when one island needs several
prefetched queries, or when entry age has to survive the trip" — is grounded in `hydration.ts` and
`hydration-script.tsx` module docs *plus* the three boundaries above, and in the `HydrationBoundary`
`useEffect` timing vs the tutorial's render-time `hydrateFromDehydrated` call.

Benchmark citation: none. SvelteKit's confirmed `load`/`$types` story is a peer for the *loader*
half, but the two-tier cache handoff has no confirmed peer claim in `benchmark-verification.md`, so
nothing was cited rather than reaching for the WRONG-marked sections.

### Source-side defects found (docs lane — recorded, not fixed)

1. `getIslandQueryClient()` (`query-client.ts`) carries `@throws {Error} If called during
   server-side rendering outside island hydration`, but the body has no throw — it lazily constructs
   a module-scoped client. `query.md` had repeated the JSDoc in prose **and** in a callout; both are
   corrected to describe the real behaviour (no guard exists; the per-request-client guidance
   stands). The JSDoc itself is a framework-source fix and stays out of this lane.
2. `initialDataUpdatedAt` is a documented contract (`query-client/types.ts`) with no typed path
   through `@netscript/fresh/query`. Either `IslandQueryOptions` should declare it or the SDK
   comment should stop promising it.
3. `createNetScriptQueryClient()`'s `QueryClientPort` return type makes the package's own
   dehydration recipe untypeable without a cast.
4. Cross-page drift: live-dashboard ch.4's island snippet destructures `isRefetching`, and its
   `dehydratedQuery` resource calls `prefetchQuery` on the port — both fail `deno check` against the
   declared types. Not touched (phase-2 tutorial prose, outside this batch's scope); flagged for the
   audit.

### Gate results

| Gate | Command | Result |
|---|---|---|
| Site build | `cd docs/site && deno task build` | PASS — 606 files (was 603; +1 page, +2 derived) |
| Site links | `cd docs/site && deno task check:links` | PASS — 31659 internal links across 217 pages, all resolve |
| Caveat refs | `cd docs/site && deno task check:caveats` | PASS — 27 markers across 22 pages, all resolve |
| Repo doc links | `deno task docs:links` | PASS — `docs=102 broken-links=0 broken-anchors=0 orphans=0` |
| D6 examples | `deno check --unstable-kv --no-lock ./scratch-d6.tsx` | PASS (contract+bind+parse, pagination, `fallback`+`extend`, `defineEnumPathParam`, `href` with a function search update, bound `Link`) |
| D6 runtime controls | `deno run ./scratch-verify-d6.ts` | 13 controls, all as documented (table above) |
| D7 examples | `deno check --unstable-kv --no-lock ./scratch-d7b.tsx` | PASS (factory over a structural contract, `withResource`+`getCachedEntry` page, island `queryOptions`+`initialData`, dehydration resource with the bridge, `bridgeInvalidation`) |
| D7 negative controls | same file, three variants | Expected FAIL — TS2353, TS2551+TS2345, TS2339 (table above) |
| Lock hygiene | `git checkout HEAD -- deno.lock`; `git status` | Clean — only the intended docs files in both commits; the pre-existing stray `jsr:@netscript/queue@0.0.4` lock line is in neither |

All scratch fixtures deleted; nothing added under `packages/`.

**Gate note for the evaluator.** `deno task docs:links` scans `.llm/harness`,
`docs/architecture/doctrine`, `.agents/skills`, and the four root surface files — it does **not**
cover `docs/site/`. Its `docs=102` is unchanged by any web-layer page and is therefore not evidence
about this batch. The load-bearing link gate for these pages is `cd docs/site && deno task
check:links` (against the built `_site`), recorded above. The Batch 1 report cites `docs:links` as
its link evidence; that citation is vacuous for the same reason, though the Batch-1 pages do pass
the site checker in the current build.

### Notes for the evaluator

- Validation is generator-side only per the CLAUDE.md documentation-authoring exception; a separate
  opposite-family session still owes a per-page verdict.
- Two Vento collisions were hit and worked around rather than escaped: `templateEngine: [vento, md]`
  parses `{{` inside fenced code, so JSX attribute object literals (`path={{ … }}`,
  `dangerouslySetInnerHTML={{ … }}`) break the build. Both examples were rewritten to hoist the
  object into a const. There is no `{{ echo }}` precedent anywhere in `docs/site/`.

## Batch 2 fix round

Audit: `.llm/runs/docs-mainpages--orchestrator/slices/deepdives-audit/audit.md` `## Batch 2 audit` —
verdict FAIL_FIX, four items. Each was re-verified against source before being applied; none was
rebutted, and item 1 was found to understate the defect.

Commit `24dbcaaa7`, pushed to `docs/web-layer-deep-dives`.

### Per-finding disposition

| Finding | Verified how | Disposition |
|---|---|---|
| **G1-F1** `clientKey(input?)` does not distinguish supplied-from-omitted | `query-factory.ts:171-175` uses `props ? … : …`. Own runtime control against a stub-client factory: `clientKey(0)`, `clientKey('')`, `clientKey(false)` → `["orders","list"]`; `clientKey({limit:20})` → full key; `queryOptions(0).queryKey` → `["orders","list",{"input":0}]` | **Accepted, and extended.** The audit frames this as falsy inputs. The control also showed the **no-input** case diverges: `queryOptions(undefined).queryKey` hashes as `["orders","list",{}]` while `clientKey()` returns `["orders","list"]` — so the gap hits the ordinary case, not just `0`/`false`/`''`. The page now states the truthiness rule, separates prefix-matching (`invalidateQueries` — still correct) from exact-key operations (`setQueryData`/`getQueryData`/`cancelQueries({exact:true})` — silently wrong), and directs readers to `queryOptions(input).queryKey` for an exact key. Table row and key-tier code comment corrected to match. |
| **G2-F1** D7 invents manual island serialization | Fresh transports serializable island props itself; the manual `<script>` + `getElementById` bridge was mine, not something a bare-Fresh author writes | **Accepted.** Bare-Fresh example replaced with `<OrdersIsland initialOrders={data.orders} />` and a normal island prop signature. The invented XSS cost is deleted. The remaining three seams are stated as the audit specifies (service response contract, request/input construction, query key), plus one fair addition kept: the handler's `fetch` and the island's `fetch` are two independent round trips with no shared freshness policy — that is the cache-coordination gap the rest of the page is about, and it is not an artifact of the invented mechanism. |
| **G2-F2** route-group 404 claim unsupported | `manifest.ts:161` `shouldSkipRouteSegment` drops `/^\(.*\)$/` segments from `inferRoutePattern`, which the same page already documented at the routes-tree table | **Accepted.** Sentence now reads "move it into a different URL-bearing directory", with an explicit parenthetical that a Fresh route group alone does not change the URL. Self-contradiction removed. |
| **G4** D7 opening transition prosecutorial | — | **Accepted.** "Four costs, and each of them is a bug that ships quietly" replaced with the audit's transition; "an XSS hole waiting" removed with the example it belonged to. The three remaining cost paragraphs were left in the page's own register rather than pasted verbatim. |

Nothing was rebutted.

### SDK escalation

G1-F1 is an SDK behaviour defect the docs merely expose, and the audit noted an SDK-side fix would be
preferable. Agreed and filed as a comment on
[#1245](https://github.com/rickylabs/netscript/issues/1245#issuecomment-5181005061) (the existing
"island query types reject the package's own documented patterns" issue — same family, so no fourth
issue was opened). The comment carries the runtime control, the asymmetric impact, a
`props === undefined` fix, and the `toClientKeyPrefix()` migration for the prefix call sites that
would lose `clientKey()`'s current no-argument behaviour. It also records that this page's wording
should be simplified back once the SDK is corrected.

No shipped example is currently broken by the defect: the live-dashboard tutorial uses
`clientKey()` only for prefix invalidation and `clientKey(input)` only with object inputs.

### Gate results after the fix

| Gate | Command | Result |
|---|---|---|
| Site build | `cd docs/site && deno task build` | PASS — 606 files |
| Site links | `cd docs/site && deno task check:links` | PASS — 31659 internal links across 217 pages, all resolve |
| Caveat refs | `cd docs/site && deno task check:caveats` | PASS — 27 markers across 22 pages |
| Changed example | `deno check --unstable-kv --no-lock ./scratch-fix2.tsx` (rewritten bare-Fresh island prop + `useQuery` with `initialData`) | PASS |
| `clientKey` control | `deno run ./scratch-clientkey.ts` | 8 controls, results in the table above |
| Lock hygiene | `git checkout HEAD -- deno.lock`; `git status` | Clean — only the two intended docs files in the commit |

Scratch fixtures deleted; nothing added under `packages/`.
