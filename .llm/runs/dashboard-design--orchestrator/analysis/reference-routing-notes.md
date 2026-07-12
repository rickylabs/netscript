# Reference-App Routing Notes — grounding for the dev-dashboard routing resort (Axis 2)

> Naming note: `playground-ref` and `chat-ref` are aliases for the two internal reference
> apps (mapping known to the owner). Aliased here so this analysis can live on a public repo;
> never expand these aliases in owner-facing design-prompt text.

Analyst pass for umbrella PR #685 / branch `design/ddr-s2-routing`. Analysis only — no product
code touched. This file extracts the **routing architecture** (not visual design) of the two
internal reference apps and states which patterns transfer to the revamped NetScript dev dashboard.
The locked proposal built on these notes is `routing-resort.md` (same dir).

> **Internal-name leak guard (Axis 2 rule).** The reference apps and several of their route
> segments are internal and MUST NOT appear in owner-facing Claude Design prompt text. Flagged
> terms are listed in the final section ("Do-not-leak vocabulary"). This notes file names them
> because it is an internal analysis artifact; the design prompts derived from `routing-resort.md`
> must use the neutral vocabulary given there.

Both reference apps are **Fresh 2.x** file-system-routed apps built on the same NetScript stack:
route groups `(name)`, `_layout.tsx`, `_middleware.ts`, `[param]` dynamic segments, a typed route
contract (`defineRouteContract` with zod `pathSchema`/`searchSchema`), a **codegen'd typed router**
(`.generated/routes.ts` + `.generated/manifest.ts`, surfaced via a hand-written `router.ts`), and
co-located non-route folders `(_components)` / `(_islands)` / `(_shared)`.

---

## A. Reference 1 — the playground dashboard (`/home/codex/repos/refs/playground-ref`)

All paths below are under `apps/playground/routes/(dashboard)/dashboard/` unless absolute. This app
already implements the exact list→detail→sub-detail, per-entity-URL, correlation-join experience the
prototype lacks. It is the primary model for the resort.

### A.1 Route-group layout + the three-file route convention

- **`(dashboard)` route group** adds a layout wrapper with **no URL segment**. The group layout
  `(dashboard)/_layout.tsx` mounts the whole dashboard chrome: `SidebarShell` (nav + topbar),
  `Breadcrumb`, `ThemeToggle`, `SidebarToggle`. Every dashboard route renders inside it.
- **`plugin/_layout.tsx`** is a thin inner layout (`define.layout`) that wraps the plugin subtree in
  a shell (`ns-shell ns-shell--wide`). Nested layout composition = group layout → subtree layout →
  route.
- **Per-route file triple** (one route folder, three roles):
  - `index.route.ts` — the **route contract** (`defineRouteContract({ pathSchema, searchSchema })`).
  - `index.tsx` — the page (defines slot hooks + loaders via the `definePage()` builder).
  - `index.layout.tsx` — composes the page's slots into layout (e.g. `slots.stats()` + `slots.list()`).
  Cited: `plugin/workers/jobs/index.route.ts`, `.../jobs/index.tsx`, `.../jobs/index.layout.tsx`,
  and the detail equivalents under `.../jobs/[jobId]/`.
- **Dynamic-section-as-path-param** (addressable tabs): `framework/wi-09/[section].route.ts` uses
  `enumPathParamSchema('section', WI09_SECTIONS)` with a matching `[section].layout.tsx` +
  `[section].tsx`. One route file serves many tab sections, each a real URL — the pattern to reuse
  when tabs should be deep-linkable path segments rather than `?tab=` query.

### A.2 The typed route contract (`defineRouteContract`)

Every level declares its params as zod schemas, so path/search params are typed + validated and the
loader receives `InferRouteContractPath` / `InferRouteContractSearch` types. Verbatim examples:

- List (pagination only) — `plugin/workers/jobs/index.route.ts`:
  ```ts
  export default defineRouteContract({
    searchSchema: paginationSearchSchema({ defaultSort: 'createdAt', defaultOrder: 'desc' }),
  });
  ```
- Detail (path param) — `plugin/workers/jobs/[jobId]/index.route.ts`:
  ```ts
  pathSchema: z.object({ jobId: z.string() }),
  searchSchema: paginationSearchSchema({ defaultSort: 'startedAt', defaultOrder: 'desc' }),
  ```
- Sub-detail (two path params) — `plugin/workers/jobs/[jobId]/executions/[executionId]/index.route.ts`:
  ```ts
  pathSchema: z.object({ jobId: z.string(), executionId: z.string() }),
  ```
- **Filters live in the URL search schema** — `plugin/triggers/index.route.ts` extends pagination:
  ```ts
  paginationSearchSchema({ ... }).extend({
    type: fallback(z.enum(['file','webhook','cron','schedule','kv','polling','manual','composite']).optional(), undefined),
    status: fallback(z.enum(['enabled','disabled']).optional(), undefined),
  })
  ```
  (all 8 trigger types are addressable filter values). `orders/index.route.ts` does the same with
  `search`, `status`, `userId`. **Selection AND filters are URL state, never in-memory.**

### A.3 The addressable entity trees (directory → URL → params)

| Capability | List URL | Entity URL | Sub-entity URL |
|---|---|---|---|
| Workers overview | `/dashboard/plugin/workers` | — | — |
| Jobs (Deno) | `/dashboard/plugin/workers/jobs` | `/…/jobs/:jobId` | `/…/jobs/:jobId/executions/:executionId` |
| Tasks (polyglot) | `/dashboard/plugin/workers/tasks` | `/…/tasks/:taskId` | `/…/tasks/:taskId/executions/:executionId` |
| Sagas | `/dashboard/plugin/sagas` | `/…/sagas/:sagaName` | `/…/sagas/:sagaName/:correlationId` (instance) |
| Triggers | `/dashboard/plugin/triggers` | `/…/triggers/:id` | `/…/triggers/:id/events/:eventId` |
| Domain CRUD (orders/users/products) | `/dashboard/orders` | `/dashboard/orders/:id` | `/dashboard/orders/:id/edit`, plus `/dashboard/orders/new` |

The workers→jobs→executions chain is the canonical three-level shape the improvement brief cites
(`/workers/jobs/:jobId/executions/:execId`). Streams is **not** a first-class plugin subtree in this
reference — only `framework/streamdb` + `framework/streaming` demos and the shared live-island seed
loaders `plugin/(_shared)/stream-loaders.ts` / `stream-factories.ts` exist. So the streams entity
tree in the resort is **extrapolated by analogy** to the jobs/sagas shape and flagged as such.

### A.4 Sidebar IA + breadcrumb derivation (`(dashboard)/_layout.tsx`)

- **Sidebar = a static grouped nav config** `DASHBOARD_NAVIGATION`: groups `Overview` / `Services` /
  `Plugins` / `Framework`, each with `{ href, label, icon, matchPrefix: true }`. Passed to
  `SidebarShell({ pathname, navigation })`; `matchPrefix` drives active-state by URL prefix. The
  sidebar is **derived from / mirrors the route tree**, one entry per top capability.
- **Breadcrumbs = pure pathname derivation** — `buildDashboardBreadcrumbs(pathname)`: strips the
  `/dashboard` prefix, splits on `/`, humanizes each segment, and special-cases `new`→"New",
  `edit`→"Edit", numeric id → `#<id>`. Rendered in the topbar via `<Breadcrumb items={…}/>`. No
  per-route breadcrumb config — the hierarchy IS the breadcrumb.
- **Per-capability tab nav + sibling links** — `plugin/workers/(_components)/shell.tsx`
  (`WorkersShell`) renders a segmented tab nav (Overview / Jobs / Tasks) whose hrefs come from the
  **typed router** `routes.dashboard.plugin.workers.jobs.$route.nav.makeHref({})`, plus ghost-button
  quick-links to sibling capabilities (Sagas, Triggers). Tabs are real sub-routes, not local state.

### A.5 The correlation-ID join (the spine — first-class in loaders)

The cross-primitive join is `workersQueryUtils.listExecutionsByCorrelationId({ correlationId })`,
called from multiple detail loaders on the **same key**:

- **Saga instance loader** — `plugin/sagas/(_shared)/query-loaders.ts` `sagaInstanceLoader({ path })`
  (line ~232) fetches **in parallel**: `getInstance`, `getInstanceHistory({ sagaName, correlationId })`,
  and `listExecutionsByCorrelationId({ correlationId: path.correlationId })`. The `[correlationId]`
  **path param IS the join key** — so `/…/sagas/:sagaName/:correlationId` is itself a correlation
  anchor. History timeline = the real `getInstanceHistory` API, not an invented step list.
- **Trigger event loader** — `plugin/triggers/(_shared)/query-loaders.ts` `eventDetailLoader({ path })`
  (line ~231) calls `listExecutionsByCorrelationId({ correlationId: path.eventId })` — the event id
  **is** the correlation UUID — and uses `SAGA_MESSAGE_MAP` (`plugin/(_shared)/cross-references.ts`)
  to map each action's `messageType` → `{ sagaName, extractCorrelationId(payload) }`, pre-warming the
  saga-instance detail route so the deep-link is instant.
- **Job/task routing from correlation** — `plugin/(_shared)/linked-worker-executions.ts`
  `resolveLinkedWorkerExecutions()` reads each execution's `concept` field (`'job' | 'task'`) to
  route to the correct detail route (`getJob` vs `getTask`), **zero blocking calls**. This is the
  bidirectional join: a worker execution → back to its originating trigger event.

`cross-references.ts` also resolves all cross-links through the **typed router** up front, e.g.
`routes.dashboard.plugin.sagas.$saganame.$correlationid.$route`,
`routes.dashboard.plugin.workers.jobs.$jobid.executions.$executionid.$route` — refactor-safe hrefs.

**Takeaway:** the whole "one journey, told four ways, same id" story is already routed. The resort's
job is to (a) promote the correlation id to a **first-class journey URL** and (b) make every entity
detail cross-link via the typed router, exactly as the loaders already do internally.

### A.6 Live islands over addressable routes

`plugin/(_shared)/stream-loaders.ts` seeds live islands with a dual-cache strategy: SDK direct call
(populates server `Deno.Kv` cache) + TanStack `setQueryData` → `dehydrate` shipped to the island.
The route stays server-addressable (SSR snapshot); the island only revalidates live in place. The
"pulsing/SSE" affordances the feedback asks for map onto this real substrate (per-plugin StreamDB
consumers over a streams base URL).

---

## B. Reference 2 — the production chat app (`/home/codex/repos/refs/chat-ref`)

All paths under `apps/dashboard/`. This app is the model for the **deep addressable-entity spine +
middleware guard cascade + URL-derived selection**. (Full extraction corroborated by a dedicated
read pass; citations below are file:line.)

### B.1 Root shell split — `_app.tsx` + `_layout.tsx`

- `routes/_app.tsx` — minimal HTML document (`define.page`): `<html data-theme>`, pre-paint theme
  init script, fonts, and `<body f-client-nav>` (client-side nav enabled globally at the body) with
  a skip-link + `#main-content` wrapping `<Component/>`. No nav here.
- `routes/_layout.tsx` — the **application shell** (`define.layout`, async): a three-pane
  `.ns-app` = `aside.ns-nav` │ `div.ns-main` │ context rail. Mounts brand, `ThemeToggle`, the ⌘K
  `CommandBar` island, `NewSessionButton`, server-rendered nav groups, the live `ChannelTreeIsland`
  (SSR-seeded nav tree), `AppBreadcrumbs`, and global `ActionToasts`/`NavProgress` islands. Wrapped
  in `<Partial name='page'>` so `f-client-nav` swaps only the interior and **keeps the sidebar
  mounted across navigations**. A `pathname.startsWith('/design')` escape hatch lets `/design` use
  its own chrome.

### B.2 The addressable conversation spine (the KEY pattern)

Every entity is a URL path segment — fully deep-linkable, nothing in-memory:

| URL template | Params | Route file |
|---|---|---|
| `/project/:project` | project | `project/[project]/index.tsx` |
| `/project/:project/channel/:channel` | project, channel | `.../channel/[channel]/index.tsx` |
| `/project/:project/channel/:channel/session/:session` | project, channel, session | `.../session/[session]/index.tsx` |
| `/project/:project/channel/:channel/knowledge` | project, channel | `.../knowledge/index.tsx` |
| `/project/:project/channel/:channel/knowledge/:doc` | project, channel, doc | `.../knowledge/[doc].tsx` |
| `/project/:project/channel/:channel/settings` | project, channel | `.../settings/index.tsx` |

Pages bind to the typed route via `.withRoute(routes.project.$project.channel.$channel.session.$session.$route)`
and read `ctx.params.*`. A cold GET to any URL reconstructs the whole thread server-side
(`loadSessionData(ctx.params.channel, ctx.params.session)`), so a session is bookmarkable/shareable
purely by URL. On create, the channel page **redirects into the new entity's URL**
(`channel/[channel]/index.tsx` `redirectTo: (out) => appRoutes.session.href({ path:{project,channel,session: out.sessionId} })`).
A `[param]` route and its non-param siblings can share a dir (`knowledge/index.tsx` +
`knowledge/[doc].tsx`).

### B.3 Middleware guard cascade (`_middleware.ts` = resolve-or-degrade)

`lib/route-guards.ts` documents the idiom: a `definePage()` loader **cannot** signal a non-200 (a
thrown Response/HttpError becomes a 500); the only seam Fresh honors is a subtree `_middleware.ts`
default export using `ctx.redirect()` / `ctx.next()`. So **param presence is validated in
middleware; loaders then read already-validated `ctx.params`.** Helpers:

- `guardParam(key, fallback)` — `if (!isPresent(ctx.params[key])) return ctx.redirect(fallback(ctx.params), 303); return ctx.next();`
- `guardParamIfMatched(key, fallback)` — same, but only when `key in ctx.params` (for the shared-dir case).

Middleware runs **outside-in (cascades down the nested tree)**, so a deeper guard's fallback can
read already-validated ancestor params. Per-level:

- `project/[project]/_middleware.ts` — `guardParam('project', () => appRoutes.home.href())` (blank → `/`).
- `project/[project]/channel/[channel]/_middleware.ts` — an **array**: `guardParam('channel', → project home)` + a `rememberChannel` middleware that writes a scope-memory cookie after `ctx.next()`.
- `.../session/[session]/_middleware.ts` — `guardParam('session', → channel home)`.
- `.../knowledge/_middleware.ts` — `guardParamIfMatched('doc', → knowledge home)`.

No auth guard exists yet (RBAC deferred, `#16`); the array pattern is the natural insertion point
(prepend an auth guard before the param guards).

### B.4 Selection is URL-derived; breadcrumbs rebuilt from pathname

`lib/active-channel.ts` `activeChannelFromPath(pathname)` regex-extracts `{project,channel}` from the
URL; `resolveActiveChannel` resolves scope **URL-first** (authoritative), then a validated cookie,
else `undefined` (never guesses the first channel). `_layout.tsx` nav `active` flags are pure
pathname predicates (`pathname === '/'`, `pathname.startsWith('/team')`, …). Breadcrumbs
(`components/blocks/breadcrumbs.tsx` `crumbsFor(pathname, channelName)`) rebuild the trail entirely
from the pathname + a `GLOBAL_LEAVES` map for flat sections. The view components hold **no**
selection state — ids arrive as props sourced from `ctx.params`.

### B.5 Islands vs server views (cache-first hydration)

Interactive/live pieces are co-located islands seeded by the loader: e.g.
`channel/[channel]/(_islands)/SessionsGrid.tsx` wraps rows in `<QueryIsland>` with
`initialData` = loader-seeded rows, `queryKey`, `staleTime: 15_000`, and a typed `queryFn` (no
`/api` seam) — "paint the loader-seeded rows immediately, revalidate in the background." Row hrefs
stay real entity URLs. Same for knowledge, session transcript, and the shell nav tree.

### B.6 Flat global siblings

`/settings`, `/skills`, `/team`, `/usage`, `/mcp`, `/channels/new` are **flat single-level** routes
(no entity spine), in a "Workspace" nav group, using static/global loaders. Contrast with the
param-driven spine. `routes/api/*` are handler-only endpoints.

---

## C. What transfers (and what doesn't)

| Reference pattern | Source | Transfers to the dev dashboard? |
|---|---|---|
| List→detail→sub-detail as nested `[param]` dirs, each a real URL | R1 A.3 | **Yes, 1:1.** `/workers/jobs/:jobId/executions/:execId`, `/sagas/:sagaName/:correlationId`, `/triggers/:id/events/:eventId`. The brief mandates exactly this shape. |
| `defineRouteContract` with zod `pathSchema` + `searchSchema` per level | R1 A.2 | **Yes.** Every route level declares typed params; filters/sort/page in `searchSchema.extend(fallback(...))`. |
| Filters + tabs as URL state (query for filters, path segment for nav tabs) | R1 A.2/A.4, wi-09 | **Yes.** `?status=&type=&page=&sort=`; nav tabs = sub-routes; deep tabs = `[section]` path param. |
| Sidebar = static grouped nav config mirroring the route tree, `matchPrefix` active-state | R1 A.4 | **Yes.** One entry per capability, grouped; badges from derived stats. |
| Breadcrumbs derived purely from pathname (humanize + id special-case) | R1 A.4, R2 B.4 | **Yes.** Add an entity-label resolver so `:jobId` renders a name, not `#id`. |
| Correlation-ID join across loaders (`listExecutionsByCorrelationId`, `getInstanceHistory`, `concept`→job/task, `SAGA_MESSAGE_MAP`) | R1 A.5 | **Yes — promote to a first-class journey URL** `/flow/:correlationId` + typed cross-links from every entity. |
| Typed router hrefs (`routes.*.$route.nav.makeHref` / `appRoutes.*.href({path})`) as the single link source | R1 A.4/A.5, R2 B.2 | **Yes.** Refactor-safe deep links; the resort assumes generated route refs. |
| `_middleware.ts` resolve-or-degrade guard cascade (`guardParam` per segment) | R2 B.3 | **Yes.** Bad/missing entity id → 303 up to the list. Add auth guard slot at the protected subtree root. |
| URL-derived selection (no client selection state) | R2 B.4 | **Yes.** Active capability/entity comes from `ctx.params`/pathname. |
| Cache-first island hydration over an addressable SSR route | R1 A.6, R2 B.5 | **Yes.** Live feeds (runs, deliveries, override feed, flow) = SSR snapshot + island revalidate; honors the HTTP/1.1 6-connection ceiling by preferring one multiplexed feed. |
| Root shell split `_app.tsx` (document) + `_layout.tsx` (app chrome in a `<Partial>`) | R2 B.1 | **Yes.** Persistent sidebar across `f-client-nav` swaps. |
| Scope-memory cookie (`rememberChannel`) | R2 B.3 | **Optional.** A dev dashboard rarely needs a "remembered worker"; keep selection URL-only unless a "recent entities" affordance is wanted. |
| Domain CRUD `new` / `:id/edit` routes | R1 A.3 | **Partial.** The dashboard's writes are config/override/trigger/DLQ/scaffold actions (confirm-gated, CLI-printing), not generic entity CRUD forms — reuse the route shape, not the form semantics. |
| `/dashboard/plugin/*` URL prefix | R1 | **No — flatten.** The dev dashboard is the app root; capabilities live at `/workers`, `/sagas`, … per the brief. `/plugins` becomes the registry/host, not a path ancestor of every capability. |
| Streams as a first-class plugin route subtree | R1 (absent) | **Extrapolated.** R1 has only stream *demos* + live-island loaders; the streams entity tree is designed by analogy to jobs/sagas and flagged as such in the resort. |

---

## D. Do-not-leak vocabulary (Axis 2 — keep out of owner-facing design prompts)

The following are internal and MUST be replaced with neutral wording in any Claude Design prompt
derived from `routing-resort.md`:

- Reference-app names: **`playground-ref`**, **`chat-ref`**, **playground**, **"the chat app"**.
- Their domain segments used only as internal examples: **`project` / `channel` / `session` /
  `knowledge` / `skills` / `team`**, **`wi-09`**, **RFC 13/15/16/17**, `orders`/`users`/`products`
  demo CRUD, `eis_active_channel` cookie, issue refs (`#73`, `#16`, `#11`).
- Internal file-role/codegen jargon is fine in engineering artifacts but should be paraphrased in
  design prompts (`definePage()`, `.generated/routes.ts`, `guardParamIfMatched`, `QueryIsland`).

Neutral, prompt-safe vocabulary (use these): capability sections **Workers / Sagas / Triggers /
Streams / AI / Plugins**, entities **jobs / tasks / executions / saga instances / trigger events /
stream deliveries / migrations / DLQ messages / auth sessions**, and the join key **correlation id**.
The domain flow example (Stripe webhook → PaymentWebhookSaga → reserve-inventory job → payment-events
stream) is a real NetScript data shape (per `POC-ground-truth.md`) and is prompt-safe.
