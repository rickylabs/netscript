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
