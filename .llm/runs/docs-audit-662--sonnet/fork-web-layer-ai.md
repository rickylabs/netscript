# Fork report: web-layer / ai / fresh|fresh-ui|contracts|sdk reference

Directive: audit web-layer/ai pages + reference/{fresh,fresh-ui,contracts,sdk} for the typed
contract-route anti-pattern (raw URL/param parsing vs `createRouteReference`/typed clients).

## Typed surface inventory (via `deno doc`, ground truth)

- `packages/fresh/src/application/route/mod.ts`: `createRouteReference(routePattern)`,
  `defineRouteContract({pathSchema, searchSchema})`, `bindRoutePattern(contract, pattern)`,
  `defineEnumPathParam`. Contract exposes `.bind()`, `.parsePath`/`.safeParsePath`,
  `.parseSearch`/`.safeParseSearch`. `RouteReference` exposes `.href()`, `.Link`,
  `.getLinkProps()`, `.withPartial()`.
- `packages/fresh/src/application/query/mod.ts`: `useIslandQuery`, `useIslandMutation`,
  `useIslandInfiniteQuery`, `useLiveQuery`/`useLiveSuspenseQuery`, `QueryIsland`,
  `dehydrateQueryClient`/`hydrateFromDehydrated` for SSR→island handoff.
- `packages/sdk/src/client/mod.ts`: `createServiceClient<TContract>()` — typed oRPC client bound
  to a contract.
- `packages/sdk/src/query-client/mod.ts`: `createServiceQueryUtils(client, options)` —
  generates typed `useQuery`/`useMutation`-shaped utils **per service procedure**, i.e. the
  direct bridge between `createServiceClient` and the fresh/query island hooks above.
- `packages/sdk` root: `defineServices()` composes clients + query factories + query utils from
  one service map (see `reference/sdk/index.md`).

This client→query-utils→island-hook chain is the intended path from a typed backend contract to
a rendered island. It exists, is documented in `reference/sdk/index.md` and
`reference/contracts/index.md`, but **is never demonstrated end-to-end in the web-layer tutorial
prose** (see `query.md` finding below).

## Per-page scores

| Page | feature-coverage | anti-pattern | code:prose | showcase | evidence |
|---|---|---|---|---|---|
| web-layer/route.md | good | good | good | good | Full `createRouteReference`/`defineRouteContract`/`.bind()` walkthrough w/ runnable snippet; explicitly names the pattern vs raw parsing. |
| web-layer/server.md | good | good | good | good | Reuses the same `ordersRoute.parseSearch(new URLSearchParams(...))` typed-parse example correctly (feeding a raw `URLSearchParams` into the typed parser is the *correct* boundary usage, not an anti-pattern). |
| web-layer/builders.md | good | good | good | good | References route/query typed surfaces; no raw URL parsing found. |
| web-layer/fresh-ui.md | good | good | good | **good — best page in set** | Explicit "copy-source, concretely" section names the differentiator (immutable installed libs vs owned/editable source) head-on; `netscript ui:add` registry framing is a strong showcase model other pages should copy. |
| web-layer/index.md | good | good | good | good | Hub page, links to route/query typed pages appropriately. |
| **web-layer/query.md** | **thin** | **anti-pattern (3 hits)** | good | **thin** | Every `queryFn`/`mutationFn` example uses raw `fetch("/api/widgets")` (L137), `` fetch(`/api/docs/${id}`) `` (L183), `` fetch(`/api/todos/${todo.id}`, {method:"PATCH", body: JSON.stringify(...)}) `` (L248) instead of `createServiceClient`+`createServiceQueryUtils` from `@netscript/sdk`. Page never mentions the sdk query-utils bridge despite linking to `/web-layer/route/` in Related — the one integration that would make the typed-contract story land is absent. |
| web-layer/form.md | good | good | good | thin | `setCsrfCookie(headers, token, new URL(request.url))` (L165) is correct API usage, not an anti-pattern. Form validation uses `createStandardSchemaAdapter` (typed) — coverage good — but page doesn't connect forms to typed service mutations (`createServiceClient` write path), a missed cross-link. |
| web-layer/defer-streaming-ui.md | good | good | good | thin | Solid defer/stream coverage; doesn't tie back to typed route/query surface as a differentiator vs React Suspense/loader patterns. |
| web-layer/error.md | good | good | good | thin | Error-boundary coverage fine; no showcase framing (reads as generic Preact error-boundary docs). |
| web-layer/examples.md | thin | good | thin | thin | Only 106 lines — index/pointer page, minimal own content; doesn't showcase differentiators itself (defers to linked pages, which is fine if those pages showcase, but this page doesn't reinforce it). |
| web-layer/interactive.md | thin | good | thin | thin | 104 lines, general islands primer; doesn't reference the typed query/route integration that makes NetScript islands distinct from vanilla Fresh islands. |
| web-layer/testing.md | thin | good | good | thin | Testing helpers covered generically; no showcase of testing typed contracts specifically (e.g. testing a bound route contract's parse functions). |
| web-layer/vite.md | good | good | good | missing | Build-tooling page; no differentiator framing expected/needed here — fine as reference-adjacent. |
| ai/index.md | thin | good | thin | thin | Hub page for ai pillar; doesn't preview the durable-chat/typed-route tie-in strongly. |
| ai/chat-ui.md | good | good | good | thin | UI-focused; doesn't connect to route/query typed surface even though chat UI is exactly where `useIslandQuery`/live queries would apply. |
| **ai/durable-chat.md** | good | **anti-pattern (1 hit)** | good | good | Strong durability-model showcase (single-reducer invariant, `authorize` required-in-prod warning) — but the canonical proxy example extracts `sessionId` via `new URL(req.url).pathname.split("/").pop()!` (L80) instead of a typed dynamic-route param (Fresh `ctx.params.sessionId`, or better, a `createRouteReference("/api/chat/[sessionId]")`-bound reference). This is the single clearest "raw escape hatch where a typed surface exists" hit in the whole set — ironic given the page otherwise sells rigor hard. |
| ai/engine.md | good | good | good | good | Solid coverage of the AI engine surface. |
| ai/mcp.md | good | good | good | thin | MCP integration covered; no explicit "beats hand-rolled MCP wiring" framing. |
| reference/fresh/index.md | good | good | good (ref norm) | good | 604-line generated reference; `URLSearchParams` hits (L333, L347, L417) are all legitimate signature docs for `buildPaginationState`/`resolvePagination`/`PaginationInput` — not anti-patterns, correct API description. |
| reference/fresh-ui/index.md | good | good | good (ref norm) | good | Reference page; complements fresh-ui.md's showcase framing. |
| reference/contracts/index.md | good | good | good (ref norm) | thin | Intro states "contract vocabulary shared across package/plugin boundaries" but doesn't spell out the differentiator (typed contracts obviate manual `req.json()`/`JSON.parse` validation code) even in one sentence — a reference page can still earn a showcase sentence in its lede. |
| reference/sdk/index.md | good | good | good (ref norm) | thin | Same gap: `defineServices()` composition preset is exactly the "one command, full typed client+query stack" story but the lede doesn't say so — it's just described mechanically. |

## Concrete missing/thin typed-surface exports across this page set

1. **`createServiceQueryUtils` (sdk/query-client)** — completely absent from `web-layer/query.md`
   despite being the literal bridge from `createServiceClient` to `useIslandQuery`/`useIslandMutation`.
   Highest-impact single fix: replace all three raw-`fetch` examples in query.md.
2. **`defineServices()`** (sdk root composition preset) — mentioned only in reference/sdk, never
   walked through in a web-layer or ai tutorial page as "here's the one call that wires your whole
   typed client+query stack."
2. Typed dynamic path params for API routes (`ctx.params` or a bound `RouteReference`) — missing
   from `ai/durable-chat.md`'s canonical proxy example.
4. `withPartial` (paired page+partial route target) — documented in route.md but never shown
   combined with `useIslandMutation`'s optimistic-update pattern in query.md, which would be the
   natural place to show the whole stack (route → contract → client → query util → island hook).

## Grounding: netscript-start clone

Clone succeeded (`git clone --depth 1 https://github.com/rickylabs/netscript-start` into
`/tmp/netscript-start`). This is actually the monorepo checkout (contains `packages/`, `apps/`,
`services/`, `workers/`, `plugins/`), not a minimal playground. Concrete patterns found:

1. `apps/frontend/lib/api-clients.ts` centralizes all typed service clients in one file:
   `export const usersClient = createServiceClient<typeof usersContract>({ contract: usersContract, serviceName: 'users' })`,
   repeated per service (products, orders, workers, sagas, triggers), importing contracts from a
   shared `@contracts` alias and using `getServiceUrl` for Aspire discovery. This is the concrete
   "single source of typed clients" pattern that `web-layer/query.md` should point to instead of
   raw fetch.
2. `packages/fresh/route/contract.ts` + `packages/fresh/builders/define-page/builder.tsx` show
   `createRouteReference`/contract binding consumed directly inside page builders — confirms
   route.md's documented pattern matches real usage exactly (no drift).
3. No direct hit for `useIslandQuery` combined with `createServiceQueryUtils` inside `apps/` in a
   quick grep — the wiring exists in `packages/sdk/query-client/create-service-query-utils.ts` but
   real app call-sites weren't found in the shallow clone depth used; worth a deeper look if this
   pattern needs a literal code source for a doc rewrite (not required for this audit — the API
   shape from `deno doc` is sufficient to write a correct example).

Report ends. Feeds parent's docs-audit-662 report; not a standalone deliverable.
