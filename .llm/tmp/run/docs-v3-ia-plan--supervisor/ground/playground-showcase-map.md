# Playground Showcase Map — Grounding Report

Source: `github.com/rickylabs/netscript-start` @ `master` (commit `6ba9ba0`), cloned to
`C:\Users\chaut\.claude\jobs\09e4d4aa\tmp\netscript-start`. Showcase app: `apps/playground`.
This is READ-ONLY grounding for the docs-v3 overhaul (tutorial tracks + integration how-tos).

> Important framing: `netscript-start` is **the full NetScript monorepo**, not a standalone
> consumer. `apps/playground` is the Fresh UI/SDK consumer; the backend it consumes
> (`contracts/`, `services/`, `sagas/`, `workers/`, `triggers/`, `database/`, `config/`,
> `dotnet/AppHost`) lives in sibling top-level dirs and is wired in via relative `imports`
> in `apps/playground/deno.json`. For docs, treat the playground as "the consumer surface"
> and the siblings as "the backend a real app would define."

---

## (1) Exec summary (5 lines)

1. The playground is an **e-commerce operations dashboard** (Users / Products / Orders) plus a
   **durable-workflow control plane** (Workers/jobs+tasks, Sagas, Triggers/webhooks), built on
   Fresh 2 + Preact + Tailwind v4 + Vite, consuming NetScript via the `@netscript/fresh`,
   `@netscript/sdk`, and `@netscript/fresh-ui` packages.
2. The dominant integration pattern is **contract-first → typed SDK client → server query-factory
   (KV cache-first) → Fresh `definePage` layer builder → island with TanStack Query hydration**,
   repeated for every domain and plugin.
3. **Real-time** is done with per-plugin **StreamDB** consumers (`@plugins/*/streams`) +
   `useLiveQuery` over durable streams, seeded server-side and dehydrated into islands.
4. The backend models the domain with **oRPC contracts whose Zod schemas are generated from
   Prisma** (`@database/zod`), implemented as `defineService` apps, orchestrated by a **.NET
   Aspire AppHost** that injects service URLs via `services__{name}__{protocol}__{index}` env vars
   resolved by `@netscript/sdk/discovery`.
5. There is **no user-auth** surface in the playground (only HMAC-verified inbound webhooks);
   auth is the clearest doc/feature gap relative to the marketing copy.

---

## (2) Directory map of `apps/playground`

```
apps/playground/
├─ deno.json              # import map: @netscript/* + @plugins/* relative paths, npm deps, Fresh/Vite
├─ main.ts                # defineFreshApp<State>; registers @netscript/kv/redis adapter FIRST
├─ client.ts              # CSS entry for HMR
├─ router.ts              # re-exports generated .generated/{manifest,routes}.ts (typed route tree)
├─ vite.config.ts         # createNetScriptVitePlugin() from @netscript/fresh/vite
├─ utils.ts               # createDefine<State>(); State = Record<string,never>
├─ assets/                # tokens.css, styles.css, components.css, layouts.css (ns-* design system)
├─ components/
│  ├─ ui/mod.ts           # local re-export barrel of @netscript/fresh-ui primitives
│  ├─ live-runtime-overview.tsx, StreamFallbackCard.tsx, TimelineProbe.tsx
│  └─ dashboard/{orders,products}/shared.tsx
├─ islands/               # client islands
│  ├─ Defer.ts            # re-exports DeferComponent from @netscript/fresh/defer
│  ├─ {Workers,Sagas,Triggers}LiveIsland.tsx   # StreamDB + useLiveQuery live monitors
│  ├─ OrderItems.tsx, FormsLab{ClientMode,HybridSummary}.tsx, PluginShowcase.tsx, CodeTabs.tsx
│  ├─ ThemeToggle.tsx, SidebarToggle.tsx, Toast.tsx, TriggerButton.tsx
├─ lib/
│  ├─ api-clients.ts      # createServiceClient + createQueryFactories for all services + plugins
│  ├─ live-overview.ts    # composite cross-service query (users+products+orders stats)
│  ├─ {orders,products,users}-{list,form,detail}.ts  # input builders + query helpers (+ *.test.ts)
│  ├─ order-item-options.ts, format.ts, utils.ts
├─ routes/
│  ├─ _app.tsx, _layout.tsx, index.tsx (marketing landing), health.ts
│  ├─ api/products/options.ts          # a plain JSON API route
│  ├─ (dashboard)/                     # route group (shell layout)
│  │  ├─ _layout.tsx
│  │  └─ dashboard/
│  │     ├─ index.tsx                  # ops dashboard home (DeferPage live overview)
│  │     ├─ {users,products,orders}/   # CRUD: index/[id]/new/[id]/edit + (_components|_islands|_shared)
│  │     │     index.route.ts          # defineRouteContract (search/path zod schema)
│  │     │     index.tsx               # definePage().withLayer(...).withForm(...).build()
│  │     │     (_islands)/*Island.tsx  # QueryIsland + useQuery/useMutation
│  │     │     (_shared)/query-loaders.ts  # cache-first getCachedEntry loaders
│  │     ├─ framework/                 # framework feature labs
│  │     │     forms/      (RFC15 server/client/hybrid form strategy lab)
│  │     │     streamdb/   (RFC16 multi-plugin StreamDB control plane)
│  │     │     tanstack/   (TanStack Query hydration/collection lab — 6 sections)
│  │     │     streaming/  (streaming demo)
│  │     │     wi-09/      ([section] dynamic route w/ Deferred panels)
│  │     └─ plugin/                    # durable-workflow control plane
│  │           _layout.tsx, (_shared)/{stream-factories,stream-loaders,cross-references,...}.ts
│  │           sagas/    index + [sagaName] + [sagaName]/[correlationId]  (+ live partial)
│  │           triggers/ index + [id] + [id]/events/[eventId]
│  │           workers/  index + jobs/[jobId]/executions/[executionId] + tasks/[taskId]/...
│  └─ partials/                        # Fresh partial routes (definePartial) mirroring above tree
│        dashboard/**/{list,stats,detail,header,live}.tsx
└─ static/favicon.ico
```

Route conventions worth documenting:
- **Co-located segments** use Fresh route groups: `(_components)` (server components),
  `(_islands)` (client), `(_shared)` (loaders/types/constants). `*.route.ts` = route contract,
  `*.tsx` = page builder, `*.layout.tsx` = layout shell.
- **Partial routes** under `routes/partials/**` are `definePartial({ name, loader, component })`
  endpoints that the page layers target via `f-partial` for cache-first / deferred refresh.

---

## (3) Feature-integration matrix  (feature → file → pattern)

| Feature / subpath | Representative file | Pattern |
| --- | --- | --- |
| **App bootstrap** `@netscript/fresh/server` | `apps/playground/main.ts` | `export const app = defineFreshApp<State>({ name: 'playground' })`; registers `@netscript/kv/redis` adapter **before** any `getKv()` |
| **Vite plugin** `@netscript/fresh/vite` | `apps/playground/vite.config.ts` | `createNetScriptVitePlugin()` |
| **Route contract** `@netscript/fresh/route` | `routes/(dashboard)/dashboard/orders/index.route.ts` | `defineRouteContract({ searchSchema: paginationSearchSchema({...}).extend({ search: fallback(z.string(),''), status: fallback(...) }) })`; also `enumPathParamSchema`, `InferRouteContractSearch` |
| **Page builder** `@netscript/fresh/builders` (80 imports — dominant) | `routes/(dashboard)/dashboard/orders/index.tsx` | `definePage().withRoute(routes.dashboard.orders.$route).withPolicy('balanced').withTelemetry({spanName}).withLayer('list', Comp, { loader, partial, partialName, fallback, layerDeps, staleTime, staleReloadMode }).withLayout(slots => …).withMeta(…).build()`. Layers = independently-loaded/cached slots. |
| **Form builder** `@netscript/fresh/form` + `definePage().withForm` | `routes/(dashboard)/dashboard/orders/new.tsx` | `.withResource('productOptions', loader).withForm('form', Comp, { schema, initial, onIntent, mutate, redirectTo })`; `redirectTo` wraps `withToast(...)`. `hooks.useResource('productOptions')`. |
| **Forms strategy lab** `Form`/`FormRegion`/`applyCollectionStrategy` | `routes/(dashboard)/dashboard/framework/forms/index.tsx` | same `<Form state={props}>` seam in **server / client / hybrid** modes; collection rows w/ `addButtonProps`/`removeButtonProps`/`reorderButtonProps` + `applyCollectionStrategy(props, strategy)`; `createFormEnhancementSnapshot` for client islands |
| **Partial route** `definePartial` | `routes/partials/dashboard/plugin/sagas/live.tsx` | `definePartial({ name, loader, component })` → `{ config, page }` |
| **Defer (streaming SSR)** `@netscript/fresh/defer` | `routes/(dashboard)/dashboard/index.tsx`, `wi-09/(_components)/summary-panel.tsx`, `islands/Defer.ts` | `<DeferPage action partial name component fallback cachedAt staleTime ctx />`; also `Deferred`, `DeferComponent` |
| **SDK service client** `@netscript/sdk/client` | `apps/playground/lib/api-clients.ts` + `services/orders/src/routers/v1.ts` | `createServiceClient<typeof ordersContract>({ contract, serviceName: 'orders' })` → typed `.list()/.update()/...`; plugins add `routerName` |
| **SDK query factories** `@netscript/sdk/query` | `lib/api-clients.ts` | `createQueryFactories({ orders: { contract, client }, … })` → per-procedure `.queryOptions()/.mutationOptions()/.clientKey()/.key()/.getCachedEntry()` (KV-backed SWR) |
| **SDK query client** `@netscript/sdk/query-client` | `routes/.../plugin/(_shared)/stream-loaders.ts`, `tanstack/(_islands)/TanStackQueryLab.tsx` | `createNetScriptQueryClient()`, `bridgeInvalidation(resource, action)`, `toClientKeyPrefix(...)` |
| **SDK cache** `@netscript/sdk/cache` | `routes/.../plugin/workers/(_shared)/query-loaders.ts` | `cacheQuery.setCachedData(key, item, ttl)` for fire-and-forget entity pre-warming |
| **SDK discovery** `@netscript/sdk/discovery` | `framework/streamdb/(_islands)/StreamDBDemo.tsx` | `getServiceUrl('triggers-api')` → resolves Aspire `services__{name}__{protocol}__{index}` env (browser uses `VITE_`-prefixed mirror) |
| **Fresh query (TanStack)** `@netscript/fresh/query` (island runtime) | `orders/(_islands)/OrdersQueryIsland.tsx`, `TanStackQueryLab.tsx` | `<QueryIsland>` wrapper + `useQuery/useMutation/useQueryClient/useLiveQuery/useSuspenseQuery`; `getIslandQueryClient`, `hydrateFromDehydrated`, `dehydrateQueryClient`, `DehydratedState` |
| **Plugin StreamDB** `@plugins/{workers,sagas,triggers}/streams` | `routes/.../plugin/(_shared)/stream-factories.ts`, `islands/SagasLiveIsland.tsx` | `createSagasStreamDB({ baseUrl })` → `.collections.sagaInstance` consumed by `useLiveQuery(q => q.from({...}))`; `.preload()` / `.close()` lifecycle |
| **Streams base URL** `@netscript/plugin-streams-core` | `stream-loaders.ts` | `getStreamsUrl()` |
| **Plugin contracts** `@plugins/{workers,sagas,triggers}/contracts` | `lib/api-clients.ts` | `createServiceClient<typeof workersContract>({ serviceName:'workers-api', routerName:'workers' })` |
| **Fresh UI** `@netscript/fresh-ui` + `/interactive` | `components/ui/mod.ts`, `SagasLiveIsland.tsx`, `orders/new.tsx` | primitives (`Card`, `Badge`, `Button`, `DataTable`, `Alert`, `EmptyState`, `FormField`, `Input`, `Select`, `Sheet`); `withToast(href, {type,title,message})`; `Sheet.Root/Content/Close` from `/interactive` |
| **Errors** `@netscript/fresh/error` | `partials/dashboard/users/[id]/detail.tsx` | `extractErrorData(...)` + `safe()` (from `@netscript/sdk`) |
| **Contracts** `@contracts` | `lib/api-clients.ts`, islands | imports `ordersContract/usersContract/productsContract` + inferred types `OrdersV1`/`UpdateOrdersV1` |
| **KV adapter** `@netscript/kv/redis` | `main.ts` | side-effect import registering Redis/Garnet KV before `getKv()` |

### Backend defining patterns (sibling dirs the playground consumes)

| Backend feature | File | Defining pattern |
| --- | --- | --- |
| **Contract** | `contracts/versions/v1/orders.contract.ts` | plain object of oRPC procedures: `export const ordersContract = { list: baseContract.route({method:'GET'}).input(zod).output(zod), getById, create, update, delete, getByUserId, … }`; Zod schemas imported from `@database/zod` (Prisma-generated); `baseContract` (`contracts/shared.ts`) carries shared typed errors |
| **Service** | `services/orders/src/main.ts` + `routers/v1.ts` | `await defineService(router, { name, version, port, db:{netscript}, openapi:{title,description}, debug })`; router = `v1.orders.$context<{db}>()` with handlers; DB via `db.getClient()` from `@database`; does service-to-service calls via `createServiceClient` and publishes saga events via `createSagaPublisher` |
| **Worker job** | `workers/jobs/process-payment.ts` | `defineJobHandler` from `@netscript/plugin-workers-core`; Zod payload schema; returns `createSuccessResult/createFailureResult`; publishes saga messages via `createSagaPublisher` from `@netscript/plugin-sagas/runtime`. ~25 jobs in `workers/jobs/` |
| **Saga** | `sagas/order-saga.ts` | `defineSaga` + `send` from `@netscript/plugin-sagas-core`; typed `SagaState`; event-driven step progression (OrderCreated→payment→inventory→shipment) with compensation; events over Redis bus, commands to Workers API over HTTP. ~8 sagas |
| **Trigger / webhook** | `triggers/payment-status-webhook.ts` | `defineWebhook(handler, { id, path, verifier:'hmac-sha256', secretEnv, metadata })` from `@netscript/plugin-triggers-core/builders`; handler returns `[enqueueJob(localJob('...'), { payload })]`. Also `defineFileWatch(handler, { id, paths, patterns, on:['create'], stabilityThreshold })` (e.g. `triggers/product-import.ts`, watching `.data/incoming/products` for `products_*.csv`) and scheduled triggers |
| **Topic config** | `config/{sagas,workers,triggers}/topics/*.ts` | per-domain topic registries (orders, products, users, webhooks, data-import/export, maintenance) — the message-bus routing config |
| **Database** | `database/mod.ts` → `database/postgres/mod.ts`; `database/zod.ts`; `database/<engine>/schema/models/*.prisma` | Prisma (active engine **postgres**, pluggable: mssql/mysql `.bak`); per-model `.prisma` files for orders/products/users + plugin schemas (sagas/workers); `@database/zod` exposes generated Zod schemas consumed by contracts; engine swap via `deno task db:use <engine>` |
| **Aspire AppHost** | `dotnet/AppHost/Program.cs` + `appsettings.json` + `dotnet/packages/NetScript.Aspire.Hosting/**` | convention-driven: `DistributedApplication.CreateBuilder(args).AddNetScriptApp().Build().Run()`; the `NetScript.Aspire.Hosting` extension auto-registers services/plugins/frontends from `appsettings.json`, wires Postgres/Garnet, and injects `services__{name}__{protocol}__{index}` (+ `VITE_`-mirrored) discovery env vars. **Topology:** Postgres 18 (persisted `data/postgres`), Garnet 1.1.x (Redis-compatible KV+queue+pubsub, :6379); Deno services users :3000 / products :3001 / orders :3002 (orders has `ServiceReferences:[users,products]`); plugin APIs workers-api :8091 / sagas-api :8092 / triggers-api :8093 (each SSE), streams :4437; background processors `workers/bin/combined.ts`, `sagas/bin/combined.ts`, triggers processor |
| **Service discovery** | `packages/sdk/discovery/service-discovery.ts` | `getServiceUrl(serviceName, protocol='http')` reads `services__{name}__{protocol}__{index}` server-side; browser reads `VITE_services__{name}__http__0`. This is how `serviceName` in `createServiceClient` resolves to a URL. |
| **Auth** | — | **ABSENT** as a user-auth surface. Only inbound webhook HMAC verification (`verifier:'hmac-sha256'`, `secretEnv`). No login/session/RBAC in the playground or services. |

---

## (4) Realistic tutorial-track example-app candidates (grounded in what the playground does)

The playground proves these app shapes are real and idiomatic — safe to base tutorials on:

1. **"Orders Operations Dashboard" (the canonical end-to-end track).** Users + Products + Orders
   CRUD with list/detail/create/edit, pagination + filters via `defineRouteContract`, cache-first
   server loaders, optimistic status mutations in islands. This is the spine: contract → service →
   SDK client → query factory → `definePage` layers → island. Directly mirrors `dashboard/orders`.
2. **"Add a background job + saga" track (durable workflows).** Order fulfillment: a `defineWebhook`
   payment trigger → `enqueueJob` → `defineJobHandler` → `createSagaPublisher` → `defineSaga` step
   machine with compensation. Grounded in `triggers/payment-status-webhook.ts` +
   `workers/jobs/process-payment.ts` + `sagas/order-saga.ts`. The StreamDB control plane
   (`framework/streamdb`) is the "watch it happen live" payoff chapter.
3. **"Real-time monitor with StreamDB" track.** Build a live table island: `createXStreamDB` +
   `useLiveQuery` + server seed loader (`stream-loaders.ts`) + dehydrate/hydrate. Grounded in
   `islands/SagasLiveIsland.tsx`.
4. **"Forms, three ways" how-to (server / client / hybrid).** One Zod contract, three interaction
   strategies, collection fields with reorder/duplicate. Grounded in `framework/forms`. Great for a
   "progressive enhancement" doc.
5. **"TanStack Query integration" how-to.** SSR prefetch → dehydrate → island hydrate → useQuery
   initialData → optimistic mutation → TanStack DB collection mirror → `bridgeInvalidation`.
   Grounded in `TanStackQueryLab.tsx` (already structured as 6 teaching sections).
6. **"Polyglot / Aspire orchestration" how-to.** `defineService` + .NET Aspire AppHost +
   `getServiceUrl` discovery + Vite env mirroring. Grounded in `services/orders` + `dotnet/AppHost`
   + `packages/sdk/discovery`.

Domain confirmation: **e-commerce** (Users/Products/Orders, shipping fields, order status flow
`pending→processing→shipped→delivered`, payment webhooks, inventory reservation, CSV product
import/export). Not a generic CRUD app — the durable-workflow plugins are first-class.

---

## (5) Diagram-worthy flows

1. **Contract-to-UI lifecycle (the hero diagram).**
   `Prisma model → @database/zod → oRPC contract (contracts/v1) → defineService handler (services/*)
   → Aspire injects services__* URL → createServiceClient(serviceName) → createQueryFactories
   (KV cache-first SWR) → definePage layer loader (getCachedEntry) → partial/island → QueryIsland +
   useQuery(initialData) → optimistic useMutation → bridgeInvalidation`.
2. **Order fulfillment saga (sequence diagram).**
   `Payment webhook (HMAC verify) → enqueueJob(process-payment-webhook) → defineJobHandler →
   createSagaPublisher(PaymentCompleted) → order-saga step machine (Redis events / Workers API
   commands) → reserve-inventory → create-shipment → OrderCompleted`, with the compensation branch
   on `PaymentFailed`.
3. **Page-layer rendering model.** A `definePage` with multiple `withLayer` slots, each with its own
   loader + partial + fallback + `staleTime`/`staleReloadMode`, rendered through `withLayout(slots)`
   — show server cache-first vs partial-refresh vs island-hydration lanes side by side.
4. **StreamDB live data path.** `Durable stream (getStreamsUrl) → createXStreamDB({baseUrl}) →
   .collections.X → useLiveQuery → island table`, with the server-seed/dehydrate prewarm path.
5. **Service-discovery / runtime-config topology.** Aspire AppHost as the single model emitting
   `services__{name}__{protocol}__{index}` (server) and `VITE_services__*` (browser) consumed by
   `getServiceUrl`/`getStreamsUrl`.

---

## (6) Doc gaps the showcase reveals

- **`@netscript/fresh/builders` is the most-used surface (80 imports) yet conceptually heaviest.**
  `definePage().withLayer/.withForm/.withResource/.withLayout/.withMeta/.withPolicy/.withTelemetry`,
  the `slots` model, `layerDeps`, `staleReloadMode: 'background'`, and `hooks.useResource/useSearch/
  useRoute/useSlots` need a dedicated conceptual page + reference. This is the playground's core idea
  and is likely under-documented.
- **The "layer + partial + island" triad** (server component layer, `definePartial` route, hydrated
  island all targeting the same query key/cache) is the signature NetScript pattern and has no
  obvious single explainer. The cache-first `getCachedEntry` → partial-fallback → SWR background
  reload contract deserves its own how-to.
- **Service discovery / runtime config.** The `services__{name}__{protocol}__{index}` env convention
  and its `VITE_`-mirrored isomorphic form are load-bearing but invisible; `getServiceUrl`/
  `getStreamsUrl` and how `serviceName` in `createServiceClient` resolves needs explicit docs.
- **StreamDB plugin consumers.** `createXStreamDB`, `.collections.*`, `.preload()/.close()`,
  `useLiveQuery`, and the dual server-seed + dehydrate strategy (`stream-loaders.ts`) are advanced
  and under-explained.
- **Query-factory ↔ TanStack bridge.** `bridgeInvalidation`, `toClientKeyPrefix`, `clientKey()` vs
  `key()`, `getCachedEntry`, and dehydrate/hydrate interplay (`@netscript/fresh/query` +
  `@netscript/sdk/query-client`) is a whole integration story shown only in the tanstack lab.
- **Forms strategy modes.** server/client/hybrid + `applyCollectionStrategy` + collection field
  button props are a rich API with only the lab as reference.
- **Auth is missing.** Marketing copy (`routes/index.tsx`) touts "auth middleware" as a solved
  problem, but the playground has **no user auth** — only webhook HMAC. Docs should either ground an
  auth tutorial in a real package or stop implying the playground demonstrates it.
- **Polyglot tasks.** Workers expose both "jobs" and "tasks"; the dashboard shows a `task.type` and
  the .NET Aspire host implies non-TS resources, but the playground's job handlers are all TS — the
  polyglot story (non-TS tasks) is asserted in the UI but not demonstrated in playground code, so
  any "polyglot" doc must source examples from elsewhere in the monorepo, not `apps/playground`.
- **`withPolicy` values** (`'balanced'` seen) are undocumented enums worth surfacing.
