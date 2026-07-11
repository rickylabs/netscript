# Web-layer pillar coverage matrix (unpublished plan artifact)

Scope: every shipped `@netscript/fresh` and `@netscript/fresh-ui` **frontend** capability that a
docs reader would build against, scored against its current docs treatment. Grounded in:

- `deno doc` over `packages/fresh/src/application/route/mod.ts`,
  `packages/fresh/src/application/query/mod.ts`, `packages/sdk/src/query/mod.ts`, and
  `packages/sdk/src/query-client/mod.ts` (shipped surface, not memory);
- the two reference apps' real call-sites — a centralized single-file typed-client module
  (`createServiceClient` per service, contracts from a shared alias, Aspire discovery) and a
  generated `routes` registry built with `createRouteReference(...$route, { id, kind })` consumed
  via `.withRoute(...)` in every page;
- the scaffold's own `routes` registry seed (`createRouteReference(routePatterns.X.$route, ...)`).

Treatment legend: **good** = shipped surface shown end-to-end with a runnable, typed example;
**thin** = mentioned or partially shown but not connected to the typed chain; **missing** = shipped
capability with no worked treatment on the page a reader would land on.

## `@netscript/fresh/route` — route contracts

| Capability | Shipped symbol(s) | Docs page | Treatment | Notes |
| --- | --- | --- | --- | --- |
| Route reference from a pattern | `createRouteReference` | `web-layer/route.md` | good | Full walkthrough; `.href()` shown. |
| Typed route contract | `defineRouteContract`, `bindRoutePattern` | `web-layer/route.md` | good | `bind()` + parse helpers shown. |
| Enum path params | `enumPathParamSchema`, `defineEnumPathParam` | `web-layer/route.md` | good | Both forms documented. |
| Pagination search schema | `paginationSearchSchema`, `fallback`, `.extend` | `web-layer/route.md` | good | `offset` derivation shown. |
| Path/search parsing | `parsePath`/`parseSearch`, `safeParse*` | `web-layer/route.md` | good | Contract + reference both expose. |
| Testing bound-contract parsing | `parsePath`/`parseSearch` under test | `web-layer/testing.md` | thin → **good (this run)** | Added a `Deno.test` exercising a bound contract's `safeParsePath`/`parseSearch`. |
| Route registry consumed by pages | `createRouteReference(...$route)` + `.withRoute` | `web-layer/interactive.md`, `web-layer/examples.md` | missing → **good (this run)** | Interactive/examples now show a typed route reference feeding a `QueryIsland`. |
| Paired page + partial | `withPartial`, `PairedRouteTarget` | `web-layer/route.md` | good | Documented; optimistic-partial combo remains a future cross-link. |

## `@netscript/fresh/query` — island data layer

| Capability | Shipped symbol(s) | Docs page | Treatment | Notes |
| --- | --- | --- | --- | --- |
| Island query hook | `useIslandQuery`, `QueryIsland` | `web-layer/query.md` | anti-pattern → **good (this run)** | queryFn was raw `fetch`; now spreads typed `queryOptions()`. |
| Polling query | `refetchInterval` | `web-layer/query.md` | anti-pattern → **good (this run)** | Same conversion for the poll example. |
| Island mutation | `useIslandMutation` | `web-layer/query.md` | anti-pattern → **good (this run)** | mutationFn was raw `fetch`; now spreads typed `mutationOptions()`, optimistic rollback preserved. |
| Infinite query | `useIslandInfiniteQuery` | `web-layer/query.md` | good | Options/result documented. |
| Live queries | `useLiveQuery`, `useLiveSuspenseQuery` | `web-layer/query.md` | good | Documented in the hooks section. |
| SSR prefetch/hydration | `dehydrateQueryClient`, `HydrationBoundary`, `QueryHydrationScript` | `web-layer/query.md` | good | Server→island handoff shown. |
| Cache-entry helpers | `hasAllCacheEntries`, `minCachedAt`, `projectCachedItemFromList` | `web-layer/query.md`, `web-layer/examples.md` | good | Loader cache-first pattern shown. |

## `@netscript/sdk` bridge — contract → client → island

| Capability | Shipped symbol(s) | Docs page | Treatment | Notes |
| --- | --- | --- | --- | --- |
| Typed service client | `createServiceClient` | `services-sdk/sdk.md`, `web-layer/fresh-ui.md` | good | Single-clients-file spine documented. |
| Frontend query utils bridge | `createServiceQueryUtils` | `web-layer/query.md` | missing → **good (this run)** | The literal bridge from a client to `useIslandQuery`/`useIslandMutation`; was absent from the query page. |
| Cache-first server factory | `createQueryFactories`, `defineServices` | `services-sdk/sdk.md` | good | KV-backed SWR variant; cross-linked from query.md. |
| Client-side invalidation | `bridgeInvalidation`, `toClientKeyPrefix` | `services-sdk/sdk.md` | good | `clientKey()` vs `key()` split explained. |
| sdk ↔ query cross-link | — | `services-sdk/sdk.md` ↔ `web-layer/query.md` | missing → **good (this run)** | Bidirectional link now closes the "hand-rolled fetch wrapper tax" loop (proposal #16). |

## `@netscript/fresh/form` — server-validated forms

| Capability | Shipped symbol(s) | Docs page | Treatment | Notes |
| --- | --- | --- | --- | --- |
| Managed form + state | `Form`, `resolveFormState`, `FormState` | `web-layer/form.md` | good | GET/failed-POST round-trip shown. |
| Schema validation | `createStandardSchemaAdapter`, `toFormErrors` | `web-layer/form.md` | good | Standard Schema v1 adapter shown. |
| CSRF + idempotency | `generateCsrfToken`, `getSubmissionHiddenInputProps` | `web-layer/form.md` | good | Both covered. |
| Form → typed service mutation (write path) | `Form` + `createServiceQueryUtils().mutationOptions()` | `web-layer/form.md` | thin → **good (this run)** | Validated payload now posts through a typed mutation, closing the read/write asymmetry (proposal #14). |

## `@netscript/fresh/interactive`, `/testing`, examples

| Capability | Shipped symbol(s) | Docs page | Treatment | Notes |
| --- | --- | --- | --- | --- |
| Suspense promise read | `usePromise`, `resolvedPromise` | `web-layer/interactive.md` | good | Documented. |
| Typed query island (islands primer) | `QueryIsland` + typed `queryOptions()` | `web-layer/interactive.md` | thin → **good (this run)** | Added a typed query-island example so the primer shows what makes NetScript islands distinct. |
| Runnable examples index | root cache helpers | `web-layer/examples.md` | thin → **good (this run)** | Added a typed route + `QueryIsland` runnable block. |
| Mock route context | `createMockRouteContext` | `web-layer/testing.md` | good | Loader/layout tests shown. |
| Defer policy fixtures | `createMockDeferPolicy` | `web-layer/testing.md` | good | Profiles documented. |

## Not in scope for this slice (owned elsewhere / already good)

- `web-layer/fresh-ui.md`, `web-layer/server.md`, `web-layer/builders.md`, `web-layer/route.md`,
  `web-layer/defer-streaming-ui.md`, `web-layer/error.md`, `web-layer/vite.md` — scored **good** on
  the typed-surface axis; no raw-`fetch`/manual-parse anti-pattern.
- Tutorial-series showcase gaps (live-dashboard pagination, workspace route-authz, storefront
  frontend chapter, chat stream-proxy callout) — audit proposals #2–#6, owned by other #660 slices.

## Highlights

- **Single highest-impact fix landed:** `web-layer/query.md` no longer teaches raw `fetch` in
  `queryFn`/`mutationFn`. All three examples now flow contract → `createServiceClient` →
  `createServiceQueryUtils` → `queryOptions()`/`mutationOptions()` → `useIslandQuery`/
  `useIslandMutation`, matching the pattern already shown one page over in `web-layer/fresh-ui.md`.
- **One honest escape hatch retained:** a single raw-`fetch` example survives under an explicit
  "endpoints without a NetScript contract" heading, so the page still shows the untyped fallback
  without presenting it as the default.
- **Read/write symmetry closed:** `web-layer/form.md` now shows the validated write path through a
  typed service mutation, and `web-layer/interactive.md`/`examples.md`/`testing.md` each connect to
  the typed route/query surface that distinguishes NetScript islands from vanilla Fresh islands.
