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
