# Routing Resort — the LOCKED routing hierarchy for the revamped dev dashboard (Axis 2)

> Naming note: `playground-ref` and `chat-ref` are aliases for the two internal reference
> apps (mapping known to the owner). Aliased here so this analysis can live on a public repo;
> never expand these aliases in owner-facing design-prompt text.

Analyst pass for umbrella PR #685 / branch `design/ddr-s2-routing`. Analysis only. This is the
**locked proposal**: the complete routing hierarchy the revamped dashboard prototype MUST adopt.
Grounded in `reference-routing-notes.md` (same dir), which extracts the two internal reference apps
with file citations. This hierarchy will be LOCKED into the final Claude Design prompts — a design
agent should be able to adopt it verbatim.

> **Prototype today (the flat list being replaced):** one hash router, **15 sibling routes**, no
> nesting, no entity URLs — a selected run/saga/flow/plugin has no address (`screen-catalog.md §
> "Routing reality"`). **Target:** an enterprise routing hierarchy — capability groups → list →
> entity detail → sub-entity detail, every selection/tab/filter addressable, breadcrumbs derived
> from the tree, and a first-class correlation-journey URL.

> **Internal-name leak guard (Axis 2).** This doc names the reference apps and their internal
> segments for engineering traceability. The Claude Design prompts derived from it MUST use the
> neutral vocabulary in `reference-routing-notes.md § D`. Reference-app names, `project/channel/
> session`, `wi-09`, RFC numbers, and demo-CRUD names must NOT appear in owner-facing prompt text.

---

## 1. Locked design principles (each steals a verified reference pattern)

| # | Principle | Stolen from (see reference-routing-notes) |
|---|---|---|
| P1 | **Every entity and sub-entity is a URL path segment.** Selection is never in-memory. A job execution, saga instance, trigger event, stream delivery, DLQ message each has a bookmarkable/shareable address. | R1 A.3, R2 B.2 |
| P2 | **Each route level declares a typed contract** (`defineRouteContract` with zod `pathSchema` + `searchSchema`). Path params = identity; search params = filters/sort/page/view-state. | R1 A.2 |
| P3 | **Filters, sort, pagination, and lightweight view-toggles live in the query string** via `paginationSearchSchema().extend({ …fallback(…) })` — non-throwing, defaulted, `preserveSearchParams` on links. | R1 A.2, A.6 |
| P4 | **Navigational tabs are real routes** — a nested `[section]` enum path segment when the tab owns nested content/breadcrumb; a `?tab=` search param only for in-place view toggles. | R1 A.1 (`wi-09/[section]`), A.6 |
| P5 | **Breadcrumbs are derived purely from the pathname** (humanize segment; resolve entity ids to display names; special-case `new`/`edit`). No per-route breadcrumb config. | R1 A.4, R2 B.4 |
| P6 | **Sidebar mirrors the route tree** — a static grouped nav config, `matchPrefix` active-state, per-item badge from a derived stat. | R1 A.4 |
| P7 | **The correlation id is a first-class journey URL** `/flow/:correlationId`, joining trigger→saga→job/task→stream; every entity detail cross-links to it. | R1 A.5 |
| P8 | **All cross-links go through a typed route registry** (`routes.*.$route.nav.makeHref` / `appRoutes.*.href({path})`) — refactor-safe, never string-concatenated. | R1 A.4/A.5, R2 B.2 |
| P9 | **Dynamic segments are guarded by `_middleware.ts` (resolve-or-degrade)**: a missing/invalid id 303-redirects up to the nearest valid list; guards cascade outside-in. | R2 B.3 |
| P10 | **Root shell split:** `_app.tsx` (document) + `_layout.tsx` (persistent app chrome in a `<Partial>`), so the sidebar survives `f-client-nav` swaps. Live data = SSR snapshot + island revalidate. | R2 B.1/B.5, R1 A.6 |

---

## 2. The full route tree (every route, every param)

The dashboard is the app root — **no `/dashboard/plugin` URL prefix** (that reference prefix is
flattened; the brief mandates `/workers/jobs/:jobId/executions/:execId`). Route groups `(overview)`,
`(capabilities)`, `(data)`, `(system)` add **no URL segment** — they attach group layouts and drive
sidebar grouping only. Search params are listed as `?key` after each route. `[param]` = dynamic
path segment.

```
/                                          Home / Wiring Home                         (S1)
                                             ?scenario=healthy|degraded  (dev prop; not persisted)

── (overview) ────────────────────────────────────────────────────────────────────────────
/config                                    Config Resolution & Topology              (S2)
  ?node=<nodeId>                             (highlighted node; deep-linkable selection)
/config/nodes/[nodeId]                     Topology node detail                       (S2 detail)
  ?tab=wiring|telemetry
/runtime                                   Runtime Config / live override feed        (S3)
  ?follow=1  ?scope=flags|jobs|sagas|triggers|tasks
/runtime/overrides/[overrideKey]          Override detail (current value + history)   (S3 detail)
/runtime/versions/[version]               Config version snapshot + diff (v41→v42→…)  (S3 detail)
/catalog                                   Service Catalog / contract coverage        (S4)
  ?tab=procedures|routes  ?coverage=complete|thin  ?duality=rest|rpc|sdk  ?search=
/catalog/procedures/[procedureId]         Procedure detail (REST/RPC/SDK duality)     (S4 detail)
/flow                                      Live Flow console (causal seam chains)      (S13)
  ?route=<path>  ?status=running|halted|failed  ?follow=1
/flow/[correlationId]                      ★ CORRELATION JOURNEY (one id, all seams)   (S13 detail)
/runs                                      Run Inspector — cross-primitive run list    (S6)
  ?kind=saga|job|task|firing|delivery  ?status=  ?from=<ms>  ?to=<ms>  ?page=  ?sort=  ?order=
/runs/[correlationId]                      Run journey (grouped executions, inspector) (S6 detail)
  ?view=all|compact|json

── (capabilities) ────────────────────────────────────────────────────────────────────────
/plugins                                   Plugin registry / host                     (S5)
  ?tab=installed|available|contributions  ?search=
/plugins/[pluginId]                        Plugin detail (contribution-axis map=nav)   (S5 detail)
  ?tab=overview|axes|doctor|config

/workers                                   Workers overview                           (S7)
/workers/jobs                              Jobs list (compiled Deno units)            (S7)
  ?status=running|completed|failed|queued|pending  ?triggeredBy=schedule|cron|manual|trigger|saga
  ?page=  ?sort=  ?order=
/workers/jobs/[jobId]                      Job detail (config + recent executions)    (S7 detail)
  ?status=  ?page=  ?sort=  ?order=
/workers/jobs/[jobId]/executions/[executionId]
                                           Job execution detail (step timeline, attempts)  (S7 leaf)
/workers/tasks                             Tasks list (polyglot units)                (S7)
  ?runtime=deno|python|shell|powershell|dotnet  ?status=  ?page=
/workers/tasks/[taskId]                    Task detail (runtime badge)                (S7 detail)
/workers/tasks/[taskId]/executions/[executionId]
                                           Task execution detail                       (S7 leaf)

/sagas                                     Sagas list                                 (S8)
  ?status=active|completed|failed|pending|compensating  ?topic=  ?page=
/sagas/[sagaName]                          Saga definition detail (instances table)   (S8 detail)
  ?status=  ?page=
/sagas/[sagaName]/[correlationId]          Saga INSTANCE (history + linked executions) (S8 leaf)
  ?tab=history|executions|payload
/triggers                                  Triggers list                              (S9)
  ?type=file|webhook|schedule|cron|kv|polling|composite|manual  ?status=enabled|disabled  ?page=
/triggers/[triggerId]                      Trigger detail (schedule preview, chains)   (S9 detail)
  ?tab=events|schedule|config
/triggers/[triggerId]/events/[eventId]     Trigger EVENT (action chain w/ linked outcomes) (S9 leaf)
/streams                                   Streams list                               (S10)
  ?status=  ?page=
/streams/[streamId]                        Stream detail (fan-out timeline)           (S10 detail)
  ?tab=deliveries|subscribers|wiring
/streams/[streamId]/subscribers/[subscriberId]
                                           Subscriber delivery detail                  (S10 leaf)

/ai                                        AI console (durable agent runs)            (S-ai)
  ?tab=activity|tools  ?ask=<seed>
/ai/runs/[runId]                           Agent-run detail (transcript, tool cards)   (S-ai detail)
                                             — joined to the correlation spine (links to /flow/:id)

── (data) ────────────────────────────────────────────────────────────────────────────────
/migrations                                Migrations                                 (S11)
  ?status=pending|applied
/migrations/[migrationId]                  Migration detail (introspect diff)          (S11 detail)
/dlq                                       Dead-Letter Queues                         (S12)
  ?tab=queue|trigger  ?backend=kv|redis|postgres
/dlq/[queueId]                             Queue detail (message table)                (S12 detail)
  ?selected=<messageId,…>   (multi-select for reprocess; addressable)
/dlq/[queueId]/messages/[messageId]        DLQ message detail (payload, reprocess)     (S12 leaf)
/auth                                      Auth Sessions                              (authc)
  ?provider=oidc|password|api-key  ?state=active|revoked
/auth/sessions/[sessionId]                 Session detail (auth.* event stream)        (authc detail)

── (system) ────────────────────────────────────────────────────────────────────────────────
/extensions                                Extension management (Axis 6 — NEW surface)
  ?tab=panels|actions|available
/extensions/[extensionId]                  Contributed-extension detail
```

**Total:** all 15 prototype screens preserved as list/console roots, plus **~22 new entity-detail
and sub-entity levels** they lacked, plus one new Axis-6 `/extensions` surface. Detail levels follow
the reference's verified shapes exactly (jobs→executions, sagas→instance-by-correlation,
triggers→events, mirrored to tasks, streams, DLQ, auth, runtime, config, catalog, ai, migrations).

### 2.1 Notes on specific levels

- **Workers overview `/workers`** is a landing that fronts the Jobs/Tasks tabs (each a real
  sub-route, per R1 `WorkersShell`). Jobs vs tasks is a hard split (`concept: 'job'|'task'`); tasks
  carry a **runtime badge** and a `?runtime=` filter (Deno/Python/Shell/PowerShell/.NET) — the
  differentiator from `POC-ground-truth.md §3`.
- **Saga instance `/sagas/:sagaName/:correlationId`** — the second path param **is the correlation
  id** (R1 A.5). Its `history` tab is the real `getInstanceHistory` stream; `executions` tab is
  `listExecutionsByCorrelationId`. "Open full journey" → `/flow/:correlationId`.
- **Trigger event `/triggers/:triggerId/events/:eventId`** — `eventId` **is** the correlation UUID.
  The event's action chain (`actionResults[]`) renders each action with a deep-link to the entity it
  produced (`enqueueJob`→job execution, `publishSaga`→saga instance via SAGA_MESSAGE_MAP,
  `executeTask`→task execution). This is the mini-fan-out from `POC-ground-truth.md §2`.
- **AI runs `/ai/runs/:runId`** carry a `correlationId`; the run detail links into
  `/flow/:correlationId` and into the specific saga/execution it investigated — AI joins the same
  spine (Axis 5). Distributed-AI affordances (fix-this, explain-failure, override-suggest) are
  **in-panel actions on other routes**, not their own routes — routing only needs the durable-run
  address here.
- **`/extensions`** is the Axis-6 management surface (installed contributed panels/actions +
  third-party available). It cross-links with `/plugins/:pluginId?tab=axes`, whose
  **contribution-axis map is clickable navigation** into the capability sections a plugin contributes.
- **DLQ multi-select** (`/dlq/:queueId?selected=…`) keeps the reprocess selection addressable so a
  confirm-gated "Reprocess selected" (naming backend + count + CLI) is shareable/reloadable.

---

## 3. Sidebar IA (groups, order, badges)

Derived directly from the tree (P6). A single static grouped nav config, `matchPrefix` active-state,
each item's badge sourced from a **derived stat** (`POC-ground-truth §3–§5`: counts + successRate,
kept internally consistent across screens). Group order top→bottom:

| Group | Item | Route | Badge (source) | Tone |
|---|---|---|---|---|
| **Overview** | Home | `/` | — | — |
| | Config | `/config` | unwired-node count | warning if >0 |
| | Runtime | `/runtime` | disabled-override count / drift | warning if drift |
| | Catalog | `/catalog` | unbound-route count | warning if >0 |
| | Live Flow | `/flow` | active-flow count | primary |
| | Run Inspector | `/runs` | running count | primary |
| **Capabilities** | Plugins | `/plugins` | doctor-warning count | warning if >0 |
| | Workers | `/workers` | running executions | primary |
| | Sagas | `/sagas` | compensating count | warning if >0 |
| | Triggers | `/triggers` | processing / failed count | warning if failed>0 |
| | Streams | `/streams` | failed-delivery count | warning if >0 |
| | AI | `/ai` | running agent-runs | primary |
| **Data** | Migrations | `/migrations` | pending count | warning if >0 |
| | Dead-Letter | `/dlq` | total depth | warning if >0 |
| | Auth Sessions | `/auth` | active sessions | muted |
| **System** | Extensions | `/extensions` | contributed-panel count | muted |

- **Active-state** = URL prefix match (`matchPrefix: true`), so `/workers/jobs/:jobId/...` keeps
  "Workers" lit. Selection is URL-derived (P1/P5) — the sidebar reads `pathname`, never client state.
- **Badges are facts NetScript uniquely computes** (Axis-1: no future-beta prose; every count is a
  live derived stat). Zero-problem badges hide or read success tone.
- This preserves the prototype's three-group intent (Console / Consoles / Data) but renames to the
  cleaner **Overview / Capabilities / Data / System** and moves Plugins to head Capabilities as the
  registry/host (per the manage-through-UI reframe in `proposal.md §9.1`).

---

## 4. Breadcrumb + URL-state conventions

### 4.1 Breadcrumbs (P5)
Derived from the pathname in the root `_layout.tsx`, exactly like the reference
`buildDashboardBreadcrumbs` (R1 A.4): split the path, build cumulative hrefs, humanize each segment.
**Two adaptations for the dev dashboard:**
1. **Resolve entity ids to display names.** The reference renders a raw `jobId`/`sagaName` literally.
   The revamp passes an optional `labelForSegment(segment, params, loaderData)` resolver so
   `/sagas/PaymentWebhookSaga/ch_3QK9…` renders `Sagas / PaymentWebhookSaga / ch_3QK9…` with the
   instance short-id, and `/workers/jobs/reserve-inventory` shows the job's display name. Fall back
   to the raw segment (or `#<id>` for numeric) when no label is loaded — same special-casing as the
   reference (`new`→"New", `edit`→"Edit").
2. **Group segments are invisible** (route groups add no URL), so breadcrumbs never show
   `(capabilities)` etc.

Example trails:
- `/workers/jobs/reserve-inventory/executions/exec_88f` → **Workers / Jobs / reserve-inventory / Execution exec_88f**
- `/triggers/webhook.payment/events/evt_2210` → **Triggers / webhook.payment / Event evt_2210**
- `/flow/ch_3QK9dR2eZ` → **Live Flow / Journey ch_3QK9dR2eZ**

### 4.2 What lives in the path vs the query
| State | Mechanism | Example |
|---|---|---|
| Entity identity / selection | **path param** | `/sagas/:sagaName/:correlationId` |
| Navigational tab that owns nested content/breadcrumb | **path segment** (sub-route or `[section]` enum) | `/workers/jobs` vs `/workers/tasks` |
| In-place view tab (no nested URLs) | **`?tab=`** search param, `fallback` default | `/streams/:id?tab=subscribers` |
| Altitude / render mode | **`?view=`** | `/runs/:id?view=json` |
| Filters (status/type/runtime/provider/backend/coverage/duality) | **`?<filter>=`** enum, `fallback(...optional(), undefined)` | `/triggers?type=webhook&status=enabled` |
| Free-text search | **`?search=`** string, `fallback(z.string(), '')` | `/catalog?search=payment` |
| Pagination / sort | **`?page=&limit=&sort=&order=`** (`paginationSearchSchema`; `offset` auto-derived) | `/workers/jobs?page=2&sort=startedAt&order=desc` |
| Live "follow" toggle | **`?follow=1`** | `/runtime?follow=1`, `/flow?follow=1` |
| Multi-select (DLQ reprocess) | **`?selected=<id,…>`** | `/dlq/kv-main?selected=msg_1,msg_2` |

**Rule of thumb (P4):** if a tab has its own child routes or deserves a breadcrumb crumb, it is a
**path segment**; otherwise it is a **`?tab=`** query param so it stays a lightweight, shareable view
toggle. All query links use `preserveSearchParams` so flipping one key keeps the rest of the filter
state (R1 A.6).

### 4.3 Everything addressable (the Axis-2 acceptance bar)
A selected run, saga instance, trigger event, stream delivery, plugin, DLQ message, config node,
override, version, procedure, auth session, and AI run **each has a URL**. A filtered+sorted list
state is a URL. A chosen tab is a URL. A correlation journey is a URL. Nothing that a user can select
is in-memory-only — this is the direct inverse of the prototype's "selection state is in-memory
only" gap (`screen-catalog.md`).

---

## 5. Correlation-journey routes (P7 — the spine, made addressable)

The correlation id is the join key already proven in the reference loaders
(`listExecutionsByCorrelationId` + `getInstanceHistory` + `SAGA_MESSAGE_MAP` + `concept`→job/task;
reference-routing-notes R1 A.5). The resort promotes it to first-class URLs:

- **`/flow/:correlationId`** — the canonical **journey**. Renders the causal seam chain for one id:
  `trigger event → saga instance(s) → job/task executions → stream deliveries`, resolved by the same
  joins the reference uses. Each seam node deep-links to its own entity detail route **and** to the
  Aspire trace (out-link — never an owned waterfall, per the standing constraint). This is the
  addressable form of prototype S13's causal seam chain.
- **`/runs/:correlationId`** — the **inspector** counterpart: the same id's executions grouped as a
  run, with step timelines and an `?view=all|compact|json` altitude toggle (prototype S6). Flow and
  Runs are two renderings of one id and cross-link.
- **Entry points from every entity** (all via the typed router, P8):
  - saga instance `/sagas/:sagaName/:correlationId` → journey uses **the URL param** directly.
  - trigger event `/triggers/:triggerId/events/:eventId` → journey uses **`eventId`** (the UUID).
  - job/task execution → journey uses **`execution.correlationId`** (bidirectional back-link via the
    `isTriggerCorrelation()` UUID test, R1 A.5).
  - AI run `/ai/runs/:runId` → journey uses the run's `correlationId`.
- **Canonical example flow** (real NetScript shape, prompt-safe, `POC-ground-truth §1`): a Stripe
  webhook → `PaymentWebhookSaga` (correlates on `data.object.id`) → `reserve-inventory` job → 
  `payment-events` stream fan-out — **the same correlation id on S6/S8/S9/S10/S13** and every
  out-link resolvable.

**Guard:** `/flow/[correlationId]/_middleware.ts` and `/runs/[correlationId]/_middleware.ts` guard
the id's presence and 303-degrade to `/flow` / `/runs` (P9).

---

## 6. Guard / middleware conventions (P9)

One `_middleware.ts` per dynamic segment, using a `guardParam(key, fallbackToParentList)` helper
(the reference's resolve-or-degrade idiom; R2 B.3). Missing/invalid id → 303 up to the nearest valid
list. Guards cascade outside-in, so a deeper guard trusts already-validated ancestor params.

| Segment | Guard file | Degrades to |
|---|---|---|
| `[jobId]` | `/workers/jobs/[jobId]/_middleware.ts` | `/workers/jobs` |
| `[executionId]` | `/workers/jobs/[jobId]/executions/[executionId]/_middleware.ts` | `/workers/jobs/:jobId` |
| `[taskId]`, `[executionId]` | mirrored under `/workers/tasks/...` | task list / task detail |
| `[sagaName]` → `[correlationId]` | `/sagas/[sagaName]/_middleware.ts`, `/sagas/[sagaName]/[correlationId]/_middleware.ts` | `/sagas`, `/sagas/:sagaName` |
| `[triggerId]` → `[eventId]` | under `/triggers/...` | `/triggers`, `/triggers/:triggerId` |
| `[streamId]` → `[subscriberId]` | under `/streams/...` | `/streams`, `/streams/:streamId` |
| `[correlationId]` | `/flow/[correlationId]`, `/runs/[correlationId]` | `/flow`, `/runs` |
| `[pluginId]`, `[migrationId]`, `[queueId]`→`[messageId]`, `[sessionId]`, `[runId]`, `[nodeId]`, `[overrideKey]`, `[version]`, `[procedureId]`, `[extensionId]` | one guard each | their parent list |

- **Auth guard slot:** the dev dashboard is local-first (unsecured anonymous in dev), but the root
  `_middleware.ts` is the documented insertion point for an auth guard **prepended** before param
  guards if a protected deployment is ever added (R2 B.3 note). Not enabled by default.
- **No scope-memory cookie.** The reference's "remember last channel" cookie is chat-specific;
  keep selection purely URL-derived (reference-routing-notes C, "Optional"). A "recent entities"
  affordance, if wanted, is a `⌘K`-palette feature, not routing state.

---

## 7. Mapping table — old flat route → new location(s)

| # | Old flat route (hash) | Screen | New root | New entity/sub-entity levels added |
|---|---|---|---|---|
| 1 | `#/home` | S1 | `/` | — |
| 2 | `#/config` | S2 | `/config` | `/config/nodes/:nodeId` (+ `?node=` selection) |
| 3 | `#/runtime` | S3 | `/runtime` | `/runtime/overrides/:overrideKey`, `/runtime/versions/:version` |
| 4 | `#/flows` | S13 | `/flow` | `/flow/:correlationId` (★ journey) |
| 5 | `#/catalog` | S4 | `/catalog` | `/catalog/procedures/:procedureId` (+ `?tab=procedures\|routes`) |
| 6 | `#/plugins` | S5 | `/plugins` | `/plugins/:pluginId` (+ `?tab=axes` contribution-map nav) |
| 7 | `#/runs` | S6 | `/runs` | `/runs/:correlationId` (+ `?view=all\|compact\|json`) |
| 8 | `#/workers` | S7 | `/workers` | `/workers/jobs`, `/workers/jobs/:jobId`, `/workers/jobs/:jobId/executions/:executionId`; `/workers/tasks`, `/workers/tasks/:taskId`, `/workers/tasks/:taskId/executions/:executionId` |
| 9 | `#/sagas` | S8 | `/sagas` | `/sagas/:sagaName`, `/sagas/:sagaName/:correlationId` |
| 10 | `#/triggers` | S9 | `/triggers` | `/triggers/:triggerId`, `/triggers/:triggerId/events/:eventId` |
| 11 | `#/streams` | S10 | `/streams` | `/streams/:streamId`, `/streams/:streamId/subscribers/:subscriberId` |
| 12 | `#/ai` | (new) | `/ai` | `/ai/runs/:runId` |
| 13 | `#/migrations` | S11 | `/migrations` | `/migrations/:migrationId` |
| 14 | `#/dlq` | S12 | `/dlq` | `/dlq/:queueId`, `/dlq/:queueId/messages/:messageId` |
| 15 | `#/authc` | (new) | `/auth` | `/auth/sessions/:sessionId` |
| — | (none — new for Axis 6) | — | `/extensions` | `/extensions/:extensionId` |

All 15 originals map 1:1 to a root; the resort is **purely additive** below each root plus one new
Axis-6 surface. No screen is dropped or merged.

---

## 8. Fresh 2.x idiom adaptation notes (steal → adapt)

For a design/impl agent adopting this on today's NetScript (Fresh 2.x + `@netscript/fresh/route`).
Each decision names the reference pattern it steals and how it is adapted.

| Decision | Steals | Adaptation for the revamp |
|---|---|---|
| **Root shell split** `_app.tsx` (document + theme-init + `f-client-nav`) + `_layout.tsx` (sidebar + topbar + breadcrumb + ⌘K + `ns-envbar`) wrapped in `<Partial name='page'>` | R2 B.1 | Reuse verbatim; the persistent-sidebar-across-nav behavior is exactly the console feel the prototype's ⌘K palette + envbar already imply. Keep the `pathname.startsWith('/design')`-style escape hatch only if a design sandbox route is added. |
| **Route groups for sidebar sections** `(overview)/(capabilities)/(data)/(system)` | R1 A.1 (`(dashboard)` group) | Groups add no URL segment; use them to attach a group `_layout.tsx` where a section needs shared chrome, and to keep the file tree readable. URLs stay flat (`/workers`, not `/capabilities/workers`). |
| **Per-capability shell with tab nav** (overview/jobs/tasks tabs as sub-routes + sibling quick-links) | R1 A.4 (`WorkersShell`) | Each capability root imports a shell component (not a framework `_layout`) that renders its tab nav via typed-router hrefs. Mirror for sagas/triggers/streams (their tabs are `?tab=` where content isn't separately nested). |
| **Route contract per level** `defineRouteContract({ pathSchema, searchSchema })` | R1 A.2 | Every `index.route.ts`/`[param].route.ts` declares zod `pathSchema` for identity and `searchSchema = paginationSearchSchema(...).extend({ …fallback(...) })` for filters. Use `enumPathParamSchema` when a tab is an enum path segment (saga instance `history\|executions\|payload` may be `[section]` if it grows nested content). |
| **Filters/sort/page in the query string** with non-throwing `fallback()` defaults + auto-`offset` | R1 A.2/A.6 | Adopt the exact 8 trigger-type enum, saga status enum (`active\|completed\|failed\|pending\|compensating`), task `runtime` enum, DLQ `backend` enum, auth `provider/state` enums from `POC-ground-truth`. Links use `preserveSearchParams`. |
| **Addressable tabs as `[section]` path param** | R1 A.1 (`wi-09/[section]`) | Use for tabs that own nested content/breadcrumb; use `?tab=` for lightweight toggles (§4.2 rule). |
| **Breadcrumb from pathname** + entity-label resolver | R1 A.4, R2 B.4 | Extend the reference's segment-humanizer with a `labelForSegment` resolver so ids render as names (the reference shows raw ids — a real weakness to fix). |
| **Sidebar = static grouped nav + `matchPrefix`** | R1 A.4 | Add per-item **badges from derived stats** (the reference has none). Badges are Axis-1-clean live facts. |
| **Correlation join → journey URL** `listExecutionsByCorrelationId` + `getInstanceHistory` + `SAGA_MESSAGE_MAP` + `concept` | R1 A.5 | Promote from loader-internal joins to a first-class `/flow/:correlationId` (and `/runs/:correlationId`) route; every entity detail cross-links via the typed router. This is the single biggest upgrade over both the prototype AND the reference (which joins but has no journey URL). |
| **Typed route registry for all hrefs** (`routes.*.$route.nav.makeHref` / `appRoutes.*.href`) | R1 A.4/A.5, R2 B.2 | Assume a codegen'd route registry; never string-concat links. Cross-links (`enqueueJob`→execution, `publishSaga`→instance) resolve through it. |
| **`_middleware.ts` resolve-or-degrade guards** | R2 B.3 | One `guardParam` per dynamic segment, 303 to parent list. Root middleware reserved as the auth-guard insertion slot (off by default for local dev). |
| **Cache-first island hydration over addressable SSR routes** | R1 A.6, R2 B.5 | Live feeds (override feed, live flow, run inspector, stream deliveries, AI activity) = SSR snapshot + island revalidate. Prefer one multiplexed feed/NDJSON `?follow` over many concurrent subscriptions (HTTP/1.1 6-connection ceiling, `proposal.md §3`). |
| **`new` / `:id/edit` domain-CRUD routes** | R1 A.3/A.8 | **Reuse the route *shape*, not the form semantics.** The dashboard's writes are config-override / trigger-enable / DLQ-reprocess / migrate / scaffold actions — each **confirm-gated and printing its exact CLI equivalent** (the NetScript signature, Axis 3). Model them as confirm dialogs / action routes, not generic entity edit forms. Scaffold-from-UI ("Add resource", "create from template") calls the same `createPluginAdapter(...).toScaffold()` the CLI uses (`proposal.md §9.3`). |
| **Flatten the `/dashboard/plugin` prefix** | R1 (rejected) | Capabilities live at `/workers`, `/sagas`, … (brief-mandated shape). `/plugins` is the registry/host, not a path ancestor. |
| **Streams entity tree** | R1 (absent) | Extrapolated by analogy to jobs/sagas (`/streams/:streamId/subscribers/:subscriberId`); flag to impl that the reference has only stream *demos* + live-island loaders, so the streams detail data-shape should be confirmed against `plugin-streams-core` at build time. |

---

## 9. Adoption checklist for the design agent (lock)

1. Build the sidebar from §3 verbatim (groups, order, badges, `matchPrefix`).
2. Every screen in the §7 map exists at its new root; every entity/sub-entity detail level in §2
   exists and is deep-linkable.
3. Breadcrumbs derive from the pathname (§4.1) and resolve ids to names.
4. Filters/tabs/sort/page/selection are all in the URL (§4.2/§4.3) — never in-memory.
5. `/flow/:correlationId` is the journey; every entity detail has an "Open correlation journey"
   affordance (§5), and out-links to Aspire/Scalar for anything the satellite doctrine forbids owning.
6. Writes are confirm-gated + CLI-printing action routes (§8, Axis 3), not CRUD edit forms.
7. Use ONLY the neutral vocabulary in `reference-routing-notes.md § D` in any owner-facing prompt
   text — no reference-app names, no `project/channel/session`, no `wi-09`/RFC/demo-CRUD leakage.

This hierarchy is LOCKED for the final Claude Design prompts.
