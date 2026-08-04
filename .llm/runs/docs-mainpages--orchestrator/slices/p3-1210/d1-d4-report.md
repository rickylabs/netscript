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

## Batch 3 (D3+D5)

Worktree `/home/codex/repos/ns-deepdives`, branch `docs/web-layer-deep-dives` (on top of the audited
`24dbcaaa7`). Pushed with explicit refspec; no PR opened.

Commits:

- `66195fe20` docs(web-layer): deepen forms into a mechanism deep-dive
- `c3b6e3059` docs(web-layer): deepen deferred rendering into a policy deep-dive

Both slices **deepen existing pages** rather than adding sub-pages, per the S1 inventory §2 verdicts
(`form.md` → "Deepen → D3", `defer-streaming-ui.md` → "Deepen → D5"). Sidebar and `index.md` nav are
unchanged; every leaf already had an entry.

### D3 — `docs/site/web-layer/form.md` (order 5, 373 → 491 lines)

Structure:

1. **Opening** — a form is a round trip, and the round trip is the work.
2. **What bare Fresh makes you write** — a real Fresh 2 `define.handlers({ GET, POST })` module
   matching the idiom already audited in `resources.md` (`{ data: … }`,
   `define.page<typeof handler>`): hand-mapped Zod issues into an invented `Record<string, string[]>`,
   five accessibility facts re-derived per field, CSRF entirely yours, `items[0].productId` as a
   hand-rolled encoding. Then the four named costs.
3. **One call, four installs** — the load-bearing mechanism, from `builder/mod.tsx`: `withForm`
   appends a **layer**, a **method handler** at `method ?? 'POST'`, a **CSRF header resolver**
   (absent when `csrf: false`), and `config.form`. Plus the two inference sites (`schema` → `mutate`
   input; `mutate` return → `NoInfer<TOutput>` in `redirectTo`/`onSuccess`/`invalidate`).
4. **The submission pipeline** — the nine ordered stages from `form-support.ts` with their span
   names (`{spanName}.parse|intent|mutate|invalidate|redirect`, default `form.{id}`), the verbatim
   CSRF-failure message, `redirectTo` shadowing `onSuccess`, the forced
   `Cache-Control: no-store, no-cache, must-revalidate` on both the 303 and a returned `Response`,
   and the structural POST-reply detection that makes value preservation work with no session store.
5. **`RuntimeFormState`** — all 17 members grouped by purpose; `initialValues` rebased after a
   successful submit (`state.ts:91`); what is deliberately absent (no `status`, no `pending`).
6. **Fields, constraints, and the markup they generate** — the four prop bags, `controlProps` as a
   **method**, and the two verified boundaries below.
7. **Collections and intents** — descriptor button builders, `IntentButtonProps` with
   `formNoValidate: true`, `applyCollectionKeyOperation` keeping per-row identity, and the
   `onIntent` trap.
8. **CSRF** — double-submit cookie with the real cookie attributes, constant-time compare, what
   `csrf: false` removes, and the module's own "easy to replace after a future security review".
9. **Idempotency: an id, not a guarantee** — corrects the previous page's overclaim.
10. **Progressive enhancement** — `createFormEnhancementSnapshot` / `useFormEnhancement` / `Form` /
    `FormRegion`, and the `never`-typed handler slots.
11. **Server round trip or island mutation** — the split the tutorials settled, framed as page event
    vs widget event, with the enhanced-`withForm` middle path named.
12. **The narrower helper surface** — `FormState`/`resolveFormState` as the older, smaller model.
13. **What to watch for**, then corrected API summary tables and the related grid.

Four corrections to previously-shipped content, each proven rather than asserted:

| Correction | Proof |
|---|---|
| `<Form state={resolveFormState(...)}>` (the old page's own example) does not compile — `Form`'s `state` is `FormStateLike = RuntimeFormState \| FormEnhancementSnapshot`, and `FormState` has none of the 14 required members | `deno check` on the extracted fence: `TS2322 … missing the following properties from type 'FormEnhancementSnapshot<ContactValues>': id, action, method, initialValues, and 10 more` |
| `controlProps` is a **method**, and spreading it onto an intrinsic element fails on `role` (`ControlProps` says `string`, Preact says `AriaRole`) | `deno check` failure; `role={undefined}` after the spread and individually-named props both compile. `@netscript/fresh-ui`'s `registry/components/ui/control-props.ts` exists for exactly this |
| Zod-derived constraints are **partial**: no `min`/`max`/`step` for numbers, no `pattern` for `.regex()` | runtime control over `createZodAdapter(schema).getConstraints()`, plus a dump of the Zod 4.4.3 check kinds (`greater_than`, `less_than`, `multiple_of`, `string_format:regex`) the extractor does not read |
| The submission id is an identifier, not deduplication — `idempotency.ts` is two constants and a `randomUUID`, and nothing stores or compares ids | source read; the module's own comment says later phases "can add idempotency storage without changing page contracts" |

Also corrected: the "one form per page" claim was rewritten to the verifiable one — each `withForm`
writes `handlers[method]`, so two `POST` forms collide on the handler slot while both regions still
render.

### D5 — `docs/site/web-layer/defer-streaming-ui.md` (order 6, 241 → 375 lines)

Structure:

1. **Opening** — deferring is easy; deciding *when* to fill in is what goes wrong.
2. **What bare Fresh makes you write** — the island `useEffect` freshness check and the server-side
   fire-and-forget `fetch`, then the three costs: the stale window as a magic number in two files,
   server prewarm and client refetch not knowing about each other, and no vocabulary for
   "how should this region behave".
3. **`Deferred`** — props, the verbatim `Deferred requires a single render-function child.` throw as
   a **render-time** failure, and the built-in `ns-deferred-error` shell.
4. **`DeferPage` is a decision maker, not a data loader** — plus the two prop shapes that are easy to
   get wrong (`component` is rendered content, `ctx` is a structural three-field slice), and a
   callout for the two silent misconfigurations (falsy `component` reads as a cache miss; no
   `cachedAt` means a refresh on every render).
5. **You rarely write `DeferPage` yourself** — points at D4's mapping table rather than repeating it,
   and adds the two layer switches that belong here (`delivery: 'stream'`,
   `staleReloadMode: 'blocking'` vs `'background'`).
6. **The policy engine** — the four profiles with their real numbers, read through the two columns
   that actually differ, then the resolution precedence.
7. **The client decision** — the eight-branch table with its stable reasons.
8. **The transport underneath** — hidden `method='GET'` form + `requestSubmit()`, the shared/partial
   search-param split, and the `queueMicrotask` prewarm with `X-Defer-Prewarm: 1` and its
   re-entrancy guard. The Suspense-ready and request-not-connection boundaries are *referenced* to
   D4's section anchors rather than restated, per the slice brief.
9. **Observability** — the three span emitters and the two diagnostic pairings.
10. **What to watch for**, then the streams half (unchanged), an expanded API table, related grid.

Load-bearing claims proven by runtime control rather than by reading:

| Claim | Control result |
|---|---|
| A legacy `staleStrategy` overrides a profile's prewarm fields | `resolveDeferPolicy('low-bandwidth', undefined, 'server-prewarm')` → `prewarmOnStale: true`, against the profile's `false`. This is the path `staleReloadMode: 'background'` takes, so a layer can contradict the profile it names |
| `staleTimeOverrideMs` beats the policy object's `staleTimeMs` | `resolveDeferPolicy({ profile:'balanced', staleTimeMs: 5_000 }, 60_000, undefined).staleTimeMs` → `60000` |
| The eight decision branches and their reasons | all eight exercised: `fresh-cache`, `server-revalidating`, `policy-background-refresh`, `stale-cache`, `full-miss`, `missing-freshness`, `partial-hit`, `partial-miss` |
| `staleTimeMs: 0` disqualifies the server-revalidating skip | `decideDeferClientAction({ staleTimeMs: 0, hasCachedData: true, serverRevalidating: true, policy: force-refresh })` → `submit` / `policy-background-refresh` |
| `resolveDetailDeferConfig` | `(true)` → `{ staleTime: 30000, policy: 'background-refresh' }`; `(false)` → `{ staleTime: 0, policy: { profile:'background-refresh', skipClientWhenServerPrewarm:false } }` |

One correction to previously-shipped content: the old page's `DeferPage` example passed
`component={cachedOrders}` typed `unknown`, which both fails `deno check`
(`TS2322: Type 'unknown' is not assignable to type 'DeferPageRenderable'`) and misrepresents the
prop — `component` is the region already rendered, which is why the page runtime passes
`renderLayerComponent(descriptor.component, data)` into it.

### Tutorial cross-links (one each)

- `tutorials/storefront/06-storefront-ui.md` — after the checkout-mutation bullets: adding to a cart
  is a widget event, a checkout that collects an address and navigates is a page event → link to
  `/web-layer/form/`.
- `tutorials/live-dashboard/04-definePage-QueryIsland.md` — in the "This is the dense part" callout
  that already enumerates `staleTime` / `staleReloadMode`: what `'balanced'` and those two decide
  between them → link to `/web-layer/defer-streaming-ui/`.

### Gate results

| Gate | Command | Result |
|---|---|---|
| Site build | `cd docs/site && deno task build` | PASS — 607 files |
| Site links | `cd docs/site && deno task check:links` | PASS — 31662 internal links across 217 pages, all resolve |
| Caveat refs | `cd docs/site && deno task check:caveats` | PASS — 27 markers across 22 pages |
| Extracted D3 examples | `deno check --unstable-kv --no-lock --config <scratch>/deno.json probe5-formpage.tsx probe6-collection.tsx` | PASS |
| Extracted D5 example | `deno check … probe7-deferpage.tsx` | PASS |
| Negative controls | `deno check …` on `<Form state={resolveFormState(...)}>`, on a bare `controlProps()` spread, and on `component={unknown}` | all three fail as documented |
| Defer policy control | `deno run --allow-env … control-policy.ts` | 13 controls, results in the table above |
| Form runtime control | `deno run --allow-env … control-form.ts` | constraint map, `formDataToRawValues`/`normalizeFormValues`, collection intent round trip, CSRF compare |
| Zod check-kind dump | `deno run --allow-env … control-zodkinds.ts` | Zod 4.4.3 kinds recorded in the table above |
| Lock hygiene | `git checkout HEAD -- deno.lock` before each commit; `git status` | clean — only docs files in both commits |

Anchors used in cross-references were verified against the built HTML ids
(`#deferred-loader-composition-the-page-runtime-drives-the-partial`,
`#what-the-runtime-actually-does-today`), not guessed.

Scratch fixtures under `.llm/tmp/p3b3/` removed; nothing added under `packages/`.

### Escalation

The two D3 findings are framework defects the docs merely expose, so they were filed as
[#1249](https://github.com/rickylabs/netscript/issues/1249) (`type:fix`, `area:fresh`,
`priority:p2`, `status:triage`, Backlog / Triage) with both controls, the Zod 4 check-kind table, and
a suggested fix for each. The issue records that `form.md`'s prose should be simplified back once
they land.

### Notes for the evaluator

- Validation is generator-side only per the CLAUDE.md documentation-authoring exception; a separate
  opposite-family session still owes a per-page verdict.
- The scratch config used for extracted-example checks sets `jsx: "precompile"` /
  `jsxImportSource: "preact"` — the same compiler options `packages/fresh/deno.json` and the
  scaffolded app use — so the `controlProps` failure is a consumer-facing result, not a config
  artifact.
- The benchmark's only CONFIRMED peer story for D3 (SvelteKit form actions) informed the framing —
  server-validated round trip with progressive enhancement as the default, island mutation as the
  exception — but no competitor is named in the page, matching the register of the other deep-dives.

## Batch 3 fix round

Audit: `.llm/runs/docs-mainpages--orchestrator/slices/deepdives-audit/audit.md` `## Batch 3 audit` —
verdict FAIL_FIX, five items (G1-F1…G1-F4 plus the G2-F1 example rebuild). Each was re-verified
against source before being applied; none was rebutted.

Commit `445dfbf37`, pushed to `docs/web-layer-deep-dives`.

### Per-finding disposition

| Finding | Verified how | Disposition |
|---|---|---|
| **G1-F1** the intent branch does not skip validation | `validation/pipeline.ts:237` — `parseFormSubmission` awaits `adapter.safeParse(values)` before returning, and `form-support.ts:97` inspects `parsed.intent` only afterwards. My own step 2 already said the parse stage runs `schema.safeParse`, so step 4 contradicted it | **Accepted.** Step 4 now reads "The schema has already been evaluated during parsing, but this branch returns before the validation result is enforced." |
| **G1-F2** sixteen members, not seventeen | `awk '/^export interface RuntimeFormState/,/^}/' … \| grep -c 'readonly '` → **16**. The "17" came from the S1 inventory, which counted `readonly` *occurrences*: the `formErrors: readonly string[]` line contains two. My own grouping table already listed 4+2+3+2+5 = 16 | **Accepted.** "Seventeen" → "Sixteen"; the table was already correct. |
| **G1-F3** `onSuccess`'s `message` is not readable from `RuntimeFormState` | `awk '/^export function resolveRuntimeFormState/,/^}/' … \| grep -nE 'message\|status\|output'` returns only the `data.status === 'success'` discriminator reads at lines 25 and 28 — `message` and `output` never appear, and neither is in the returned object | **Accepted.** The paragraph now states that no success flag or message exists in the props, names `nextValues` as what does survive, and directs readers to a redirect or an application-owned channel. |
| **G1-F4** only `'server-prewarm'` overrides the prewarm fields | `policy.ts:158` — `hasLegacyStrategy = staleStrategy !== undefined && staleStrategy !== 'none'`, and `LegacyStaleStrategy` is `'none' \| 'server-prewarm'`. `'none'` is also `DeferPage`'s default, so the overbroad sentence was wrong in the common case | **Accepted, and extended.** The bullet now names `'server-prewarm'` explicitly, states that `'none'` (the default) leaves policy and profile intact, and — per the audit's own control (`low-bandwidth` + explicit `false` flags + `server-prewarm` → both `true`) — records that when it does apply it beats an explicitly-set `prewarmOnMiss`/`prewarmOnStale`, not just the profile. |
| **G2-F1** the bare-Fresh defer example bypasses the partial mechanism it credits to Fresh | Same class as batch 2's G2-F1. `DeferIsland.tsx:216-236` shows the ordinary shape — a hidden `method='GET'` form with `f-partial` / `f-client-nav` and `requestSubmit()` — which is available to any bare-Fresh author | **Accepted.** The island now holds a form ref, calls `requestSubmit()` when stale, and returns the hidden `f-partial` form; the raw `fetch(...).text()` and the invented hand-owned swap are gone. The lead-in now says Fresh gives you the transport and withholds the decision, a new line states "The swap itself is fine — Fresh owns it", and the second cost reads "client partial submission". The three costs are unchanged in substance: the stale window is still a magic number in two files, prewarm and submission still do not know about each other, and there is still no policy vocabulary. |

Nothing was rebutted. The one "refetch" left on the page (line 13, "a refetch is correct but
visible") describes the general freshness tradeoff in the opening, not the bare-Fresh mechanism, and
was deliberately left.

### Gate results after the fix

| Gate | Command | Result |
|---|---|---|
| Site build | `cd docs/site && deno task build` | PASS — 607 files |
| Site links | `cd docs/site && deno task check:links` | PASS — 31662 internal links across 217 pages, all resolve |
| Caveat refs | `cd docs/site && deno task check:caveats` | PASS — 27 markers across 22 pages |
| Rebuilt bare-Fresh example | `deno check --unstable-kv --no-lock --config <scratch>/deno.json probe-bare-defer.tsx` | PASS — `f-partial` / `f-client-nav` on a `<form>` and `formRef.current?.requestSubmit()` all type-check under Fresh's JSX augmentation (`import 'fresh/runtime'`). The previous raw-fetch version was never checkable, so this is strictly better evidence |
| Vento leakage | grep for unrendered `{{ … }}` in both built pages | none — the `style` object was hoisted to a const to avoid the double-brace collision |
| Rendered spot-check | `grep -c requestSubmit` / `grep -c "Sixteen readonly members"` in `_site` | 2 / 1 |
| Lock hygiene | `git checkout HEAD -- deno.lock`; `git status` | clean — only the two intended docs files in the commit |

The G1 fixes were prose-only, so no previously-checked NetScript example changed; the D3/D5 example
fixtures from the first round remain valid. Scratch fixtures deleted; nothing added under
`packages/`.

## Batch 4 (D2+D8+D9)

Final phase-3 batch. Three slices, three commits, pushed to `docs/web-layer-deep-dives`.

| Slice | Commit | Touches |
|---|---|---|
| D2 — layers, layout, slots | `929372637` | **new** `web-layer/layers.md`; `builders.md`, `index.md`, `live-dashboard/04` |
| D8 — response shaping | `d140195e3` | **new** `web-layer/response.md`; `builders.md`, `index.md`, `layers.md` |
| D9 — the app seam | `927ca34aa` | `web-layer/server.md` (deepened); `live-dashboard/01` |

Per the S1 inventory verdicts: D2 and D8 are net-new content carved out of `builders.md` (which keeps
its chain overview and gains two pointers), D9 is a deepening of `server.md` in place. Sidebar order
16 and 17, continuing the 13/14/15 deep-dive block.

### What each page carries that nothing else did

**D2 — `/web-layer/layers/`.** The thesis is the resource/layer split: resources are a sequential
`for…of`, layers are a `Promise.all`. Everything else follows from that one contrast — layers cannot
read each other (`ctx.layerData` is `{}` for the whole of a layer loader), a page costs its slowest
region rather than the sum, and shared values belong in the resource store. Then the loader return
contract (`TProps | CacheEntryLike<TProps> | null | undefined`), the automatic cache-entry unwrap, the
12-field layer config table, slot placement, `slots.<id>.data`, the four layer hooks, and
`InferDefinePageLayerLoaderProps` including its cache-entry-aware inference. Deferred-region config
(`partial`, `staleTime`, `staleReloadMode`, `policy`, `params`) is named and delegated to
`partials.md#deferred-loader-composition-…` and `defer-streaming-ui.md` rather than restated.

**D8 — `/web-layer/response/`.** Framed as *what `build()` synthesises*, not as five method
descriptions: three page shapes (no handler / a `ctx.render()` GET / a streaming GET), the three
verbatim guard errors, and the trap that `withForm` appends a CSRF header resolver — so every form
page has a synthesised GET requiring `ctx.render()`, and adding `withHandler('GET')` to one reports a
`withHeader()` conflict for a method the author never called. Plus `withMeta` as a post-layer resolver
with its 7-field descriptor, the three `withHeader` overloads and their per-name merge order,
`withStatus` being per-page rather than per-request, `withPolicy` as a layer-overridable default, and
the three `build()` shapes.

**D9 — `/web-layer/server/`.** The bootstrap becomes an order rather than an option list:
app → `preConfigure` → static files → middleware → `configure` → fs routes, with all ten options
tabulated and both reserved ones (`telemetry`, `name`) marked. Three facts that were documented
nowhere: `configure` is *not* last (fs routes come after it), `app.fsRoutes()` inserts what the Fresh
**builder** collected — so islands/route discovery is `vite.config.ts`, not `main.ts` — and the
`@app/utils.ts` re-export is what binds `State` to every page. The `@netscript/sdk/cache` side effect
is referenced to `query-bridge.md#the-import-that-makes-any-of-this-work`, not restated.

### Bare-Fresh contrasts

All three are type-checked, and all three credit Fresh with what Fresh actually does — the batch-2/3
audit failure mode.

- **D2**: `define.handlers` with a `Promise.all`, `define.page` composing three regions. The prose
  states outright that `Promise.all` is the right tool and that nothing in the snippet is wrong; the
  costs claimed are the ones that appear as the page grows — no per-region identity to hang a
  fallback/stale window/refresh URL on, a three-file edit to add a region, concurrency as manual
  bookkeeping with no per-region spans to check it, and one slow region gating the paint. It also
  states that `routes/_layout.tsx` receives a single `{ Component }` (verified against the scaffold
  template), so it is chrome and not a placement grid.
- **D8**: `ctx.render(vnode, init)` with a `ResponseInit` — explicitly called "direct and, for one
  page, entirely adequate". The three costs are structural, not ergonomic: shaping forces
  `define.page` → `define.handlers`, headers have no merge point for a region to contribute to, and
  `<Head>` is placement rather than resolution. The builder's guard errors are presented as a
  consequence of synthesising GET, **not** as a bare-Fresh deficit — in bare Fresh no combination is
  illegal.
- **D9**: `new App().use(staticFiles()).use(mw).fsRoutes()`, with the lead-in conceding the hand-rolled
  version is also short. The argument is that the ordering rules live only in whoever wrote the file,
  plus the one genuinely missing thing (the cache-provider registration).

### Source verification

Every claim was read from `packages/**` on this branch, and the behavioural ones were executed. Two
scratch runtime probes (16 + 25 controls) and a scratch consumer app for type-checking; all three
removed, nothing added under `packages/`.

| Control | Result | Used on |
|---|---|---|
| `.withLayer('x', C)` with no loader | renders **empty string** | D2 warning callout |
| same, with a `fallback` | renders the fallback, not the component | D2 |
| loader returns `{}` | renders `<C />` with no props | D2 ("an empty object is data") |
| loader returns `null` | renders nothing | D2 |
| two loaders, 40 ms and 10 ms | `a:start,b:start,b:end,a:end` — overlap | D2 "layers run concurrently" |
| two resources, same timings | `r1:start,r1:end,r2:start,r2:end` — serial | D2 contrast paragraph |
| loader returns `{ data, cachedAt }` | component receives `data`'s shape | D2 cache-entry section |
| `staleReloadMode:'blocking'` + stale entry | renders the **fallback** | D2 stale table |
| same, entry still fresh | renders the data | D2 stale table |
| no `withLayout` | layers emit in declaration order | D2 |
| `withLayout` + `slots.a.data` | placement is independent; `.data` carries props | D2 |
| `ctx.layerData` inside a layer loader | `{}` | D2 "layers cannot read each other" |
| `delivery:'stream'` without `withStreaming()` | renders **inline**, does not defer | D2 |
| `delivery:'blocking'` with a `partial` | renders inline | D2 |
| duplicate layer id | second loader never runs; first element emitted twice | D2 watch-for |
| `withMeta` descriptor | exactly the 7 documented tags; resolver sees full `layerData` | D8 meta table |
| plain page | `{ page, default, handler }`, `handler === undefined` | D8 build table |
| three `withHeader` overloads + `withStatus(207)` | status 207; `x-one` = the later map's value | D8 merge order |
| `withStatus` without `ctx.render` | `definePage() requires ctx.render() when withHeader() or withStatus() is used.` | D8 verbatim |
| `withHandler('GET')` + `withStatus` | `…cannot combine withHandler("GET") with withHeader() or withStatus().` | D8 verbatim |
| `withHandler('GET')` + `withStreaming` | `…cannot combine withHandler("GET") with withStreaming().` | D8 verbatim |
| all three at once | the **streaming** message wins | D8 watch-for |
| `withHandler('POST')` + `withStatus` | handlers `["POST","GET"]`, no throw | D8 "only GET is affected" |
| `withForm` alone | handlers `["POST","GET"]`; GET throws without `ctx.render` | D8 callout |
| `withForm` + `withHandler('GET')` | reports the **withHeader/withStatus** conflict | D8 callout |
| custom handler | `ctx.resource()` resolves; `ctx.layerData` `{}`; no layer loader fires | D8 custom-handler section |
| `build()` / `build('/p')` / `build({routePattern})` | `{page,default,handler}` vs `+ nav, route, hooks`; `route.href({path:{id:'7'}})` → `/orders/7` | D8 build section |
| `defineFreshApp` hook order | `preConfigure > use > use > configure > fsRoutes()` | D9 numbered list |
| `app` + `createApp` both passed | `createApp` called **0** times | D9 watch-for |
| `staticFiles:false`, `fsRoutes:'/mount'` | only `fsRoutes(/mount)` | D9 options table |
| `fsRoutes` as a function | second argument is always `undefined` | D9 watch-for |
| `middleware: []` | no middleware `use` | D9 step 4 |

Source-only (read, not executed): the streaming GET passes the page's headers and status to
`createStreamingResponse` (`builder/mod.tsx`); `promoteRouteConfig` / `promoteRouteContractConfig`
both set `defaultRoutePattern`, so a routed page's bare `build()` returns the routed shape
(`builder/route-support.ts:50,93`); `gcTime` appears on `DefinePageLayerConfigFor` and in no runtime
read path; `App.fsRoutes` is documented as *"Insert file routes collected in `Builder` at this point"*
(`deno doc jsr:@fresh/core`); the `@app/utils.ts` and `main.ts` shapes are the CLI scaffold templates
verbatim.

### One claim withdrawn during authoring

An early D8 draft said a single-argument `withHeader('x-thing')` silently sets an empty value, based on
`resolveHeaderDescriptor`'s `value ?? ''`. A negative control showed the public overload set makes that
call a **compile error** (`TS2769`, no overload matches — a bare string is neither `HeadersInit` nor a
resolver), so the fallback is unreachable from typed code. The page now states the opposite: the
overloads are declared separately, so the string form requires its value. The watch-for bullet was
replaced with the per-name merge hazard, which is real.

### Gate results

| Gate | Command | Result |
|---|---|---|
| Site build | `cd docs/site && deno task build` | PASS — 613 files |
| Site links | `cd docs/site && deno task check:links` | PASS — 32387 internal links across 219 pages, all resolve |
| Caveat refs | `cd docs/site && deno task check:caveats` | PASS — 27 markers across 22 pages |
| Extracted D2 examples | `deno check --unstable-kv --no-lock --config <scratch>/deno.json ex.tsx` | PASS — layered page + layout, `slots.data` layout, hooks, both `InferDefinePageLayerLoaderProps` forms, cache-entry loader, shorthand vs config form, `loader: () => ({})` |
| Extracted D8 examples | same | PASS — meta/header/status page, 404 page, POST + shaping, three-overload page, `build()` shapes, export destructuring |
| Extracted D9 examples | `deno check … d9.tsx` | PASS — bare-Fresh `main.ts`, mounted app, concise-arrow `preConfigure`/`configure`, the `@app/utils.ts` module, generated `main.ts` |
| Bare-Fresh contrasts | same config | PASS — `define.middleware` / `define.handlers` / `define.page`, `ctx.render(vnode, init)` with `<Head>`, `new App().use(staticFiles()).fsRoutes()` |
| Negative control | `deno check` on `withHeader('x-thing')` | fails as documented (TS2769) |
| Vento leakage | grep for unrendered `{{` in all three built pages | 0 |
| Anchors | verified against built ids, not guessed | `#the-import-that-makes-any-of-this-work`, `#the-loader-half-a-read-not-a-fetch`, `#the-policy-engine`, `#three-authoring-forms-one-generated-binding`, `#deferred-loader-composition-the-page-runtime-drives-the-partial`, `#composing-the-runtime-server` |
| Lock hygiene | `git checkout HEAD -- deno.lock` before each commit; `git status` | clean — docs files only in all three commits |

The scratch consumer used `jsx: "precompile"` / `jsxImportSource: "preact"`, matching
`packages/fresh/deno.json` and the scaffolded app, so the results are consumer-facing rather than
config artifacts. `packages/fresh`'s own `isolatedDeclarations` setting was deliberately *not* applied —
it is a publish constraint on the package, not on app code, and applying it would have failed examples
that are correct in an app.

### Cross-links added

- `builders.md` — a layers pointer beside the existing resources pointer, and a response-shaping
  pointer under "Handlers and methods"; both added to its Related grid.
- `index.md` — layers and response bullets in the leaf list.
- `layers.md` ↔ `response.md` mutual Related cards.
- `server.md` — a query-bridge Related card (the cache registration link).
- `live-dashboard/04` step 3 — first tutorial contact for layers now links `/web-layer/layers/`, with
  the concurrency fact stated inline.
- `live-dashboard/01` — the `defineFreshApp` link was pointing at the pillar hub `/web-layer/`; it now
  targets `/web-layer/server/#composing-the-runtime-server`, the section that explains it.

Main pages (quickstart, concepts) untouched, as scoped.

### Open items for the evaluator

- **Observability defect worth a fix, not a doc.** The layer span records
  `delivery ?? 'blocking'` while the defer decision reads `delivery ?? 'defer'`, so a layer that omits
  `delivery` and declares a `partial` **defers but traces as `blocking`**
  (`runtime/mod.tsx` — attribute at the span call, decision at `shouldDefer`). D2 documents the
  discrepancy in "What to watch for" and points readers at `page.layer.has_partial` instead. Not filed
  as an issue this batch; flagging for triage alongside #1249.
- **`gcTime` is accepted and inert** on `DefinePageLayerConfigFor`. Documented as such rather than
  silently omitted, since the type invites it.
- Validation here is generator-side only per the CLAUDE.md documentation-authoring exception; a
  separate opposite-family session still owes a per-page verdict for `layers.md`, `response.md`, and
  the `server.md` deepening.

## Batch 4 fix round

Audit: `.llm/runs/docs-mainpages--orchestrator/slices/deepdives-audit/audit.md` `## Batch 4 audit` —
verdict FAIL_FIX, five findings (G1-F1, G1-F2, G2-F1, G2-F2, G4-F1). Each was re-verified against
source before being applied; none was rebutted. All five were prose defects — **no code fence
changed**, so the batch-4 example fixtures remain valid.

Commit `cf21cb52c`, pushed to `docs/web-layer-deep-dives`.

### Per-finding disposition

| Finding | Verified how | Disposition |
|---|---|---|
| **G1-F1** cache registration is triggered by the module import, not by calling `defineFreshApp` | `runtime/server/mod.ts` re-exports `./define-fresh-app.ts`, whose module body has `import '@netscript/sdk/cache'`; `packages/sdk/src/cache/mod.ts` calls `setCacheProvider(cacheQuery)` at evaluation. So importing `/server` for *anything* — `createStreamingResponse`, a type — registers the provider, and a module that hand-rolls `new App()` while importing `/server` still has it | **Accepted.** Both `server.md` sites rewritten: the contrast now ends "A bare Fresh entry point that never imports `@netscript/fresh/server` bypasses it. Calling `defineFreshApp` is not itself the trigger; evaluating the `/server` module is." The watch-for bullet now names the subpath evaluation as the trigger and states that `new App()` in a `/server`-importing module keeps the registration. |
| **G1-F2** `withMeta` accepts a sync **or** async resolver | `DefinePageMetaResolverFor` (`catalog.ts:244-249`) returns `DefinePageMetaDescriptor \| Promise<DefinePageMetaDescriptor>`. Runtime control: a synchronous resolver rendered `<title>Orders (A)</title>`, an async one `<title>Async (A)</title>` — both read `ctx.layerData` | **Accepted.** "registers an async function" → "registers a resolver — synchronous or asynchronous". The page's own example was already synchronous, so the text had contradicted its own fence. The after-layers claim was confirmed correct and is unchanged. |
| **G2-F1** Fresh middleware **is** a header composition point | `Context.next: () => Promise<Response>`. Three runtime controls on a real `App`: middleware added `x-tenant` alongside the handler's own header; middleware replaced the handler's `cache-control: max-age=60` with `no-store`; middleware appended `set-cookie: csrf=abc; Path=/`. My "Headers have no merge point" was simply wrong | **Accepted.** Replaced with "**Headers do not merge at the component-region level.**" — the handler assembles them in `ResponseInit`, middleware adds or replaces them around `await ctx.next()`, and the only thing no seam reaches is a rendered component. The `Set-Cookie` example is kept but re-attributed to needing an agreed handler or middleware seam rather than to an absent one. |
| **G2-F2** the reserved `name` option is not a present-day advantage | `define-fresh-app.ts` never reads `options.name`; `server.md` itself marks it **Reserved** in the options table and the callout. Counting it as a bare-Fresh cost contradicted the page two screens later. (The sentence also carried a drafting error — "no `Set-Cookie`-free way" was nonsense in that position) | **Accepted.** Sentence removed; "Two things are also silently absent" → "One thing is also silently absent", leaving the cache registration as the single genuine gap. `name` remains documented as a reserved seam in the options table and the callout only. |
| **G4-F1** "Adding a region is a three-file edit" is unsupported | `layers.md`'s bare-Fresh example is one route module showing a handler and a page component; nothing in it identifies three files | **Accepted.** Replaced with "**Adding a region couples several sites in the route module.**" — the `Promise.all`, the returned data shape, and the JSX change together, with the type inferred from the whole handler rather than declared per region. |

Nothing was rebutted.

### One scope extension, deliberate

G1-F1 was scoped to `server.md`, but `query-bridge.md:325` (batch 3, previously PASS) carried the
same claim — *"Bypassing `defineFreshApp` bypasses the registration. Hand-rolling `new App()` … leaves
the provider unset"* — and is the page `server.md` cross-links **on exactly this point**. Fixing only
one would have left two mutually-referential pages asserting opposites, so the query-bridge bullet was
corrected identically: the trigger is the import; what loses the registration is an entry point that
never imports the subpath, or a test exercising a loader in isolation. The bullet's test-setup remedy
(`import '@netscript/sdk/cache'`, `setCacheProvider`, `resetCacheProvider`) is unchanged and was
already correct. Flagging for the auditor since it touches a previously-passed page.

### Issue #1255 (span-attribute defect)

Not linked from the page. No page in `docs/site/web-layer/` links a GitHub issue (verified by grep
across all 16), batch 3 handled #1249 the same way — behaviour described in prose, defect tracked in
the issue — and Gate 3 of this batch explicitly scans changed lines for issue/PR/harness vocabulary
leakage. Instead the `layers.md` watch-for bullet was sharpened to carry the honest boundary without
the reference: "**The `delivery` span attribute currently misreports its default.** … That is a
reporting discrepancy rather than a difference in behaviour, and it is expected to be corrected —
until it is, read `page.layer.has_partial` alongside it." That marks it as a defect in flight rather
than designed semantics, which was the intent of the request.

### Gate results after the fix

| Gate | Command | Result |
|---|---|---|
| Site build | `cd docs/site && deno task build` | PASS — 613 files |
| Site links | `cd docs/site && deno task check:links` | PASS — 32387 internal links across 219 pages, all resolve |
| Caveat refs | `cd docs/site && deno task check:caveats` | PASS — 27 markers across 22 pages |
| Meta-resolver control | `deno run` on a scratch fixture in `packages/fresh` | sync and async resolvers both render, both read `layerData` |
| Middleware header controls | same fixture, real `App().handler()` | add, replace, and `Set-Cookie` append all succeed around `await ctx.next()` |
| Changed examples | `git diff -U0` over `docs/site/web-layer/` | no code fence changed — the four `definePage`/`new App` hits in the diff are inline backticked prose. Batch-4 `deno check` fixtures remain valid, so they were not re-run |
| Vento leakage | grep for unrendered `{{` in all four built pages | 0 |
| Removed-claim sweep | grep across `_site/web-layer/` for each withdrawn phrase | "three-file edit", "Headers have no merge point", "registers an async function", "bypassing", "Set-Cookie-free" — **0 pages each** |
| Fixed-wording sweep | grep for each replacement in the built HTML | all five present on their pages |
| Lock hygiene | `git checkout HEAD -- deno.lock`; `git status` | clean — only the four intended docs files in the commit |

Scratch fixture under `.llm/tmp/p3b4fix/` and its `packages/fresh` copy removed; nothing added under
`packages/`.

## Benchmark page

Worktree `/home/codex/repos/ns-deepdives`, branch `docs/tutorial-benchmark` (off `77c034c33` main,
carrying merged deep-dives #1241 and the remapped main pages). Commit `c33f633a2`, pushed with
explicit refspec. No PR opened.

New page: `docs/site/explanation/compared.md` — "How NetScript's path compares", order 8, the eighth
explanation essay. `explanation/` was the right home over `web-layer/`: the page is understanding-
oriented and framework-wide, and it inherits the zone's `prev`/`next` + `order` convention rather
than the deep-dives' bare `order`.

### Structure

1. **Opening + scope callout** — this compares *paths*, not features; nothing here claims a peer
   cannot build what NetScript builds. Points at `/why/` as the short version.
2. **What the canonical flows emphasize** — one subsection each for Next.js, Nuxt, SvelteKit, and
   Laravel/Rails, each with live URLs, then an `apiTable` summarizing all five and a synthesis: all
   five render something within minutes and all five teach **one process**, with data access as a
   step inside it and operational concerns at the end or absent.
3. **Where NetScript's path diverges** — the four divergences as the brief specified (contract
   before the page, workspace-not-app, durable runtime not longer handler, observed graph from the
   first run), each *linking* rather than restating: `/explanation/contracts/`, `/concepts/`,
   `/quickstart/`, `/why/`, `/orchestration-runtime/`, `/explanation/durability-model/`,
   `/durable-workflows/`, `/explanation/aspire/`, `/observability/`. Plus a "web layer inherits the
   same ordering" paragraph linking six deep-dives (`resources`, `layers`, `form`, `partials`,
   `defer-streaming-ui`, `query-bridge`), and a "what the ordering costs" list.
4. **What peers do better today** — six plainly-stated items from the undersell analysis: in-browser
   learning (SvelteKit's tutorial, Nuxt's online starters) with NetScript having no equivalent; time
   to a rendered screen; Rails' generators; the batteries-included breadth; a day-one deployment
   answer; ecosystem depth. Closes with a callout saying outright when a peer is the better choice.
5. **Where to go next** + related grid + `nextPrev`.

### Truth-layer discipline

Only `benchmark-verification.md` CONFIRMED grades were carried; everything graded WRONG was
re-fetched live (2026-08-04) and rewritten to current truth, and two claims the verification left
**UNVERIFIABLE** were fetched rather than published on the benchmark's word.

| Verification grade | What the page does |
|---|---|
| Laravel §1.4 **WRONG** (dead URL, chapters that do not exist) | Re-fetched `laravel.com/learn/getting-started-with-laravel`: 13 lessons, Chirper, **deployment is lesson 4**, ending at basic registration + login/logout. The claimed "Notifications & Email" and "Authorization/`ChirpPolicy`" chapters are absent and are **not** repeated — and no negative claim is made about them either. `bootcamp.laravel.com` and the 404 `laravel.com/docs/getting-started` are not cited; `laravel.com/docs/installation` is. |
| Rails §1.4 **WRONG** (app domain changed) | Re-fetched: a **Product store**, `Product`/`ProductsController`, **23** sections, authentication via `bin/rails generate authentication`, Kamal. No Article/Comment/blog claim survives. |
| Nuxt §1.2 **WRONG** (ordering) | Re-fetched the real sidebar: **18** sections in exact order. The page states outright that presentation concerns precede Data Fetching and State Management — the opposite of the benchmark's condensed 7-step ordering. |
| Next.js **PARTIALLY CONFIRMED** (chapter numbers off by one) | The off-by-one is sidestepped entirely: **no chapter is cited by number**. Content and order are CONFIRMED, so the 16-chapter arc is described in prose. Canonical `/docs/app/getting-started/installation` used, per the verification. |
| Next.js cross-linking **UNVERIFIABLE** | Fetched the Fetching Data chapter: it does link to the route-handlers reference. Claim narrowed from the benchmark's "every chapter" to what one verified sample supports. |
| Rails generators (unverified in both docs) | Fetched the actual commands. The initial draft's "one command emits model, migration, controller, views" was **wrong** — the guide uses *separate* model and controller generators plus a third for authentication. Corrected before commit. |
| SvelteKit **CONFIRMED** | Cited as-is, on the canonical `svelte.dev/tutorial` (not the 308-redirecting `learn.svelte.dev`). |

**Every external URL curl-verified 200 with no redirect** before publishing (10 URLs), and the
built HTML was grepped to confirm the rendered set is exactly those 10.

Command names were also narrowed to fetched evidence: `laravel new` and bare `rails new` were
dropped in favor of `create-next-app`, `npm create nuxt@latest`, and `bin/rails new`.

### Nav / cross-link wiring

- `explanation/compared.md` front matter: `order: 8`, `prev` → aspire, `next` → Capabilities. The
  `/explanation/` lane is folder-derived (`_data.ts` `navLanes` → `roots: ["/explanation/"]`, sorted
  by `order`), so the sidebar picks it up with no hand-maintained list to edit.
- `explanation/aspire.md` — `next` and its `nextPrev` re-pointed from Capabilities to the new page,
  keeping the zone's chain unbroken.
- `explanation/index.md` — "Seven topics" → "Eight", one `featureGrid` card, one `learningPath` step.
- `why.vto` — **one** cross-link, appended to the §3 "Compare the center of gravity" table as "the
  longer comparison". No other main-page edit.

### Register

No competitor bashing (each flow is described on its own terms, and the closing callout names when a
peer is the better choice); no superlatives, pricing, or marketing claims (swept); no `jsr:`
specifiers at all — the page carries no code; no filler ("simply" removed on review).

### Gate results

| Gate | Command | Result |
|---|---|---|
| Site build | `cd docs/site && deno task build` | PASS — 617 files (was 613: +1 page, +derived) |
| Site links | `cd docs/site && deno task check:links` | PASS — 32773 internal links across 220 pages (was 219), all resolve |
| Caveat refs | `cd docs/site && deno task check:caveats` | PASS — 27 markers across 22 pages |
| External URLs | `curl -sIL` over all 10 cited URLs | all **200**, no redirect |
| Vento leakage | grep `{{` in the four built pages | 0 each |
| Lock hygiene | `git checkout HEAD -- deno.lock`; `git status` | clean — only the four intended docs files in the commit |

### Notes for the evaluator

- Validation is generator-side only per the CLAUDE.md documentation-authoring exception; a separate
  opposite-family session still owes a per-page verdict.
- The one judgement call worth reviewing: `explanation/index.md` was edited (count, grid, path)
  because leaving "Seven topics" against an eight-page folder is visible drift. It is an
  `explanation/` sibling, not a main page, so it is inside the "wire nav per siblings" instruction.
- `competitive-benchmark.md` §2/§3 (undersell + differentiator analysis) were used only for framing
  the "what peers do better" and "where NetScript diverges" sections; per the verification's own
  bottom line those general characterizations hold, and no §1.4 or §1.2 detail was cited from the
  benchmark without re-fetching.
