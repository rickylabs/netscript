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
