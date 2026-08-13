# NetScript Dev Dashboard — Screen Spec

> Companion to `CLAUDE-DESIGN-BRIEF.md` (the contract) and `PROPOSED-COMPONENTS.md` (the palette).
> This is the **what to draw**: the locked route tree, the shell, the canonical fixture, and a
> per-screen spec.
>
> Source of the route tree and sidebar: `resources/design/dashboard/reference/dashboard-design--orchestrator/analysis/routing-resort.md`
> (**LOCKED** — adopt verbatim). Source of the per-screen content: `design-prompts/01–06` in the same
> run dir, corrected here for the NS One runtime contract and the retired-surface list. **Where they
> conflict, this spec and the brief win.**

---

## 1. The locked route tree (non-negotiable)

Path params = **entity identity**. Query params = **filters / tabs / view state**. Nothing selectable
is in-memory-only. Route groups (`(overview)`, `(capabilities)`, `(data)`, `(system)`) drive sidebar
grouping and add **no URL segment**.

```
/                                          Home / Wiring Home                          (S1)

── Overview ───────────────────────────────────────────────────────────────────────────────
/config                                    Config Resolution & Topology                (S2)
  ?node=<nodeId>
/config/nodes/[nodeId]                     Topology node detail          ?tab=wiring|telemetry
/runtime                                   Runtime Config / live override feed      ⚑ (S3)
  ?follow=1  ?scope=flags|jobs|sagas|triggers|tasks
/runtime/overrides/[overrideKey]           Override detail (value + history)
/runtime/versions/[version]                Config version snapshot + diff
/catalog                                   Service & Contract Catalog                  (S4)
  ?tab=procedures|routes  ?coverage=complete|thin  ?duality=rest|rpc|sdk  ?search=
/catalog/procedures/[procedureId]          Procedure detail (REST/RPC/SDK duality)
/flow                                      Live Flow console (causal seam chains)   ⚑ (S13)
  ?route=<path>  ?status=running|halted|failed  ?follow=1
/flow/[correlationId]                      ★ CORRELATION JOURNEY (one id, all seams)
/runs                                      Run Inspector — cross-primitive run list    (S6)
  ?kind=saga|job|task|firing|delivery  ?status=  ?from=  ?to=  ?page=  ?sort=  ?order=
/runs/[correlationId]                      Run journey (grouped executions)  ?view=all|compact|json

── Capabilities ───────────────────────────────────────────────────────────────────────────
/plugins                                   Plugin registry / host                      (S5)
  ?tab=installed|available|contributions  ?search=
/plugins/[pluginId]                        Plugin detail        ?tab=overview|axes|doctor|config
/workers                                   Workers overview (fronts Jobs / Tasks)      (S7)
/workers/jobs                              Jobs list (compiled Deno units)
  ?status=running|completed|failed|queued|pending  ?triggeredBy=schedule|cron|manual|trigger|saga
  ?page=  ?sort=  ?order=
/workers/jobs/[jobId]                      Job detail (config + recent executions)
/workers/jobs/[jobId]/executions/[executionId]      Job execution (step timeline, attempts)
/workers/tasks                             Tasks list (polyglot units)
  ?runtime=deno|python|shell|powershell|dotnet  ?status=  ?page=
/workers/tasks/[taskId]                    Task detail (runtime badge)
/workers/tasks/[taskId]/executions/[executionId]    Task execution
/sagas                                     Sagas list                                  (S8)
  ?status=active|completed|failed|pending|compensating  ?topic=  ?page=
/sagas/[sagaName]                          Saga definition detail (instances table)
/sagas/[sagaName]/[correlationId]          Saga INSTANCE     ?tab=history|executions|payload
/triggers                                  Triggers list                               (S9)
  ?type=file|webhook|schedule|cron|kv|polling|composite|manual  ?status=enabled|disabled  ?page=
/triggers/[triggerId]                      Trigger detail    ?tab=events|schedule|config
/triggers/[triggerId]/events/[eventId]     Trigger EVENT (action chain w/ linked outcomes)
/streams                                   Streams list                               (S10)
/streams/[streamId]                        Stream detail     ?tab=deliveries|subscribers|wiring
/streams/[streamId]/subscribers/[subscriberId]     Subscriber delivery detail
/ai                                        AI console (durable agent runs)           (S-ai)
  ?tab=activity|tools  ?ask=<seed>
/ai/runs/[runId]                           Agent-run detail (transcript, tool cards)

── Data ───────────────────────────────────────────────────────────────────────────────────
/migrations                                Migrations & drift        ?status=pending|applied (S11)
/migrations/[migrationId]                  Migration detail (introspect diff)
/dlq                                       Dead-Letter Queues   ?tab=queue|trigger ?backend=  (S12)
/dlq/[queueId]                             Queue detail (message table)  ?selected=<id,…>
/dlq/[queueId]/messages/[messageId]        DLQ message detail (payload, reprocess)
/auth                                      Auth Sessions       ?provider=oidc|password|api-key
  ?state=active|revoked                                                                 (authc)
/auth/sessions/[sessionId]                 Session detail (auth.* event stream)

── System ─────────────────────────────────────────────────────────────────────────────────
/extensions                                Extension management  ?tab=panels|actions|available
/extensions/[extensionId]                  Contributed-extension detail
```

**Render the URL in every mock.** Addressability is a product feature; if it isn't visible, it isn't
designed. Example: `/sagas/PaymentWebhookSaga/ch_3QK9dR2eZ?tab=history`.

---

## 2. The shell (P0 — designed once, present on every screen)

### 2.1 Sidebar (`SidebarShell`) — four groups, in this order

| Group | Item | Route | Badge (derived stat) | Tone |
| ----- | ---- | ----- | -------------------- | ---- |
| **Overview** | Home | `/` | — | — |
| | Config | `/config` | unwired nodes · **2** | warning |
| | Runtime | `/runtime` | drift · **1** | warning |
| | Catalog | `/catalog` | unbound routes · **2** | warning |
| | Live Flow | `/flow` | in-flight flows · **1** | primary |
| | Run Inspector | `/runs` | running · **9** | primary |
| **Capabilities** | Plugins | `/plugins` | doctor warnings · **1** | warning |
| | Workers | `/workers` | running executions · **4** | primary |
| | Sagas | `/sagas` | compensating · **1** | warning |
| | Triggers | `/triggers` | failed · **21** | warning |
| | Streams | `/streams` | failed deliveries · **31** | warning |
| | AI | `/ai` | running agent-runs · **1** | primary |
| **Data** | Migrations | `/migrations` | pending · **1** | warning |
| | Dead-Letter | `/dlq` | depth · **18** | warning |
| | Auth Sessions | `/auth` | active · **24** | muted |
| **System** | Extensions | `/extensions` | contributed panels · **6** | muted |

- Active state = **URL prefix match** — `/workers/jobs/reserve-inventory/executions/exec_88f` keeps
  **Workers** lit. The sidebar reads the pathname; it never holds client state.
- Zero-problem badges hide, or read success tone. Badges are live facts, never decoration.
- **Do not reintroduce a "Console" / "Consoles" group-label pair** — two near-identical adjacent labels
  is the scannability defect this rename fixes.
- Collapsible to an icon rail; mobile drawer (`SidebarToggle` island).

### 2.2 Topbar

- **Breadcrumb** derived **purely from the pathname**, with entity ids resolved to display names. **No
  constant synthetic root crumb** (the old fixed `Console /` prefix is a defect). Trails read
  `Workers / Jobs / reserve-inventory / Execution exec_88f`, `Triggers / webhook.payment / Event
  evt_2210`, `Live Flow / Journey ch_3QK9dR2eZ`.
- **Environment pill** (`ns-envbar`): `local · my-app · aspire`, with a status dot.
- **Live dot** (`ns-livedot`): subtle SSE liveness indicator; when following is paused, a "N new"
  catch-up pill.
- **Search button** → the ⌘K palette. **Theme toggle** (`ThemeToggle` island). A prominent
  **"Open Aspire Dashboard ↗"** affordance — the satellite doctrine, made visible.
- **Footer:** app name + workspace identity **only**. No version string (Axis 1).

### 2.3 ⌘K command palette (`CommandPalette`) — three sections

- **Navigate** — fuzzy over every route *and every entity name*: typing `reserve` surfaces the
  `reserve-inventory` job.
- **Act** — mutations from anywhere: "Run job reserve-inventory…", "Add plugin…", "Apply pending
  migration…". Each opens its `ns-confirm` dialog **with the exact CLI line**.
- **Recent** — last visited entities.
- Actions **contributed by plugins** carry a provenance chip naming the contributing plugin (Axis 6).

---

## 3. The canonical fixture (one incident, every screen)

**Scenario: `degraded`** (the designed default; `healthy` is a variant). Every number below is the
single source of truth. **A screen that contradicts this ledger is a defect** — including by omission
(a stat that should reconcile and doesn't).

### 3.1 The incident (the correlation spine)

```
POST /webhooks/stripe
  → trigger  webhook.payment            event evt_2210        (type: webhook)
  → saga     PaymentWebhookSaga         instance ch_3QK9dR2eZ  status COMPENSATING (step 2 of 4)
  → job      reserve-inventory          execution job_4183     attempt 2/3, RETRYING
  → stream   payment-events             message  msg_88f       fan-out 2/3 DELIVERED · 1 FAILED
                                                               (failed subscriber: analytics)
```

- **`ch_3QK9dR2eZ` is THE journey id.** The saga correlates on the Stripe charge id
  (`webhookPayload.data.object.id`). It is the id in `/flow/ch_3QK9dR2eZ`, `/runs/ch_3QK9dR2eZ`,
  `/sagas/PaymentWebhookSaga/ch_3QK9dR2eZ`, and on the AI run that investigated it. The trigger event
  `evt_2210` is a **node in that journey**, not a rival address. (Framework-side reconciliation of the
  two keys: `OPEN-QUESTIONS.md` OQ-11.)
- Journey timing: **720 ms** end-to-end so far; **72 ms** queue wait before the job picked up. No
  span-level timings anywhere — those are an Aspire out-link (`/traces/detail/{traceId}`).

### 3.2 Stack facts

| Fact | Value | Owning screen |
| ---- | ----- | ------------- |
| Plugins installed | **5** — workers, sagas, triggers, streams, auth | `/plugins` |
| Plugin update available | auth `v0.9.1 → v1.0.0` | `/plugins/auth` |
| Plugin available (not installed) | `crons` | `/plugins?tab=available`, gated groups elsewhere |
| Doctor warnings | **1** — triggers: DLQ port degraded | `/plugins?tab=doctor` |
| Topology nodes | **14**; **2 unwired** (telemetry coverage); `redis` **degraded** | `/config` |
| Unbound routes | **2** | `/catalog?tab=routes` |
| Contract procedures | **38** across 5 plugins — coverage **31 complete / 7 thin** | `/catalog` |
| Config version chain | `v41 → v42 → v43 (current)` | `/runtime` |
| Disabled overrides | **2** · override changes (24 h) **3** | `/runtime` |
| Scheduler drift | **1** — job `nightly-reconcile`, **caused by override v43** | `/workers/jobs/nightly-reconcile` |
| Pending migrations | **1** — `20260711_add_delivery_attempts` (3 applied, 4 total) | `/migrations` |
| DLQ depth | **18** — KV 4 · Redis 11 · Postgres 3 | `/dlq` |
| Auth sessions | **24 active**, 3 revoked (7 d); providers oidc / password / api-key | `/auth` |
| Contributed panels | **6** — 4 first-party capability sections + 2 third-party | `/extensions` |

### 3.3 Derived stats (counts + successRate, exactly as the framework computes them)

| Capability | Counts | successRate |
| ---------- | ------ | ----------- |
| **Workers** | total executions **1,242** = running 4 · completed 1,201 · failed 31 · queued 6 · pending 0. Jobs **11** (Deno) · Tasks **5** (polyglot) | **97 %** |
| **Sagas** | definitions **4** · instances **87** = active 3 · compensating 1 · completed 79 · failed 4 | **91 %** |
| **Triggers** | triggers **9** (all 8 types represented) · events **3,412** = processing 2 · completed 3,389 · failed 21 | **99 %** |
| **Streams** | streams **3** · subscribers **7** · deliveries (24 h) **2,904** · failed **31** | **99 %** |
| **AI** | agent runs (24 h) **31** · tool calls **118** · tool-failure **4 %** · median latency **2.9 s** · contract tools exposed **12** | — |

Sidebar "Run Inspector · running · 9" = workers running (4) + sagas active (3) + triggers processing
(2). Home "executions/hr 52" ≈ 1,242 / 24 h. Home "saga success 91 %" is the sagas successRate above.
**Every derived number must trace back to this table.**

### 3.4 Live Flow list (flows are correlations — no synthetic `fl_*` ids)

| Correlation id | Route | Status |
| -------------- | ----- | ------ |
| `ch_3QK9dR2eZ` | `POST /webhooks/stripe` | **running** (the canonical incident) |
| `ch_9M2xB7pQr` | `POST /webhooks/stripe` | **halted** |
| `ch_5TzW1kL8v` | `POST /webhooks/stripe` | completed |

**Sidebar reconciliation:** the "in-flight flows · 1" badge counts **running** flows only — the halted
and completed rows are recent history in the list, not in-flight work. The list holds 3; the badge
reads 1. This is the kind of pair that a canvas agent silently contradicts; do not.

---

## 4. Per-screen spec

Every screen: **light + dark**, the §1-of-the-brief render smoke, real URLs visible, numbers from §3.
Every mutation: **plan → diff → exact CLI equivalent (`ns-confirm`, required slot) → confirm → result**.

### S1 · `/` — Home / Wiring Home

*"Is my app wired the way I declared it, and what just happened?"*

- **AI incident narrative** (top): one synthesized paragraph joining today's warnings into a causal
  story — the override `v43` → the scheduler drift → the compensating saga. Action chips deep-link to
  entity URLs (`Open the failing run` → `/runs/ch_3QK9dR2eZ`; `Review override v43` →
  `/runtime/versions/v43`). Shows its **grounding**: which live registry calls it used, and when.
  "Ask about your app" affordance opens the assist (Axis 5).
- **KPI row** (`ns-kpi`, 4 cards with sparklines): executions/hr **52** · trigger firings/hr **142** ·
  override changes **3** · saga success **91 %**. Each clicks through to its console **with the
  matching filter in the URL**.
- **Execution-outcomes split bar** — completed / failed / retrying, from the workers ledger.
- **Six wiring facts** (`ns-statlink`): plugins loaded **5** → `/plugins`; doctor warnings **1** →
  `/plugins?tab=doctor`; unbound routes **2** → `/catalog?tab=routes`; disabled overrides **2** →
  `/runtime?scope=jobs`; pending migrations **1** → `/migrations?status=pending`; scheduler drift **1**
  → `/workers/jobs/nightly-reconcile`.
- **Quick-action strip** mirroring the top CLI verbs (Axis 3): add plugin · scaffold resource · apply
  migration · run doctor. Each opens its confirm dialog with the CLI line.
- **"Just happened" strip:** 3–5 cross-capability events, each deep-linking to its entity URL. Not an
  owned feed — a jump list.
- **Contributed panels row:** the dogfood proof. Each contributed panel names its **plugin**, its
  **mount target**, and links to `/extensions/:extensionId`. The four first-party capability sections
  appear here as contributions.
- **Provenance/freshness footer per data block:** `derived from live registry · 14:02:31 ·
  snapshot+live`.
- **States:** loading (skeleton grid) · healthy (calm, all-success) · **degraded** (default) · error
  (config unresolvable → Alert spanning the grid).

### S2 · `/config`, `/config/nodes/:nodeId` — Config Resolution & Topology

*Declared intent vs running reality.*

- **`ns-stackmap`** capability graph — 14 nodes (services / sagas / workers / triggers / streams /
  topics / db / cache), labeled SVG edges (pub/sub edges get a dashed flavor), **live-traffic overlay**
  on active edges. `redis` renders **degraded**.
- **Left:** `tree-nav` of declared intent (from the developer's own declarations).
- **Right rail** (`context-rail`): node detail — endpoints, telemetry-coverage badges (`ok` / `unwired`
  — **2 unwired**), Aspire out-links.
- **Selection is a URL** — `?node=<id>` highlights; `/config/nodes/:nodeId` is the full detail with
  `?tab=wiring|telemetry`.
- **Write (Axis 3):** an `unwired` node offers **"Wire telemetry"** → confirm + CLI line.
- **Filter by contributing plugin** (Axis 6) to see a plugin's footprint on the map.
- **Out-links:** the Aspire resource page for each infra node. **Never** a metrics chart here.

### S3 · `/runtime` ⚑ — Runtime Config Monitor & Control (flagship)

- **Live override feed** — follow toggle (`?follow=1`), "N new" catch-up pill, scope filter
  (`?scope=flags|jobs|sagas|triggers|tasks`).
- **Current-state stat grid** — flags / jobs / sagas / triggers / task overrides.
- **Version chain** (`ns-verchain`): `v41 → v42 → v43 (current)`, each version a URL
  (`/runtime/versions/:version`), each with a real **diff** (`ns-diff`).
- **Write-back is LIVE** (Axis 1 + 3 — no gating): override set / unset via `ns-confirm` printing the
  exact `netscript config override set …` line, with the config diff **shown in the dialog** before
  confirm.
- **AI assist (Axis 5):** where drift is detected, an inline suggested override, pre-filling the
  confirm dialog. It is a suggestion with visible grounding, never an auto-apply.
- **`v43` is the cause of the scheduler drift on `nightly-reconcile`** — the cross-link is the point.

### S4 · `/catalog`, `/catalog/procedures/:id` — Service & Contract Catalog

**Provenance / coverage / duality only. There is no try-it console here — that is Scalar's.**

- **Procedure table** (`DataTable`): 38 procedures — method, provenance plugin, coverage
  (complete / thin), duality chips (REST / RPC / SDK). Filters in the URL
  (`?coverage=`, `?duality=`, `?search=`).
- **Routes tab** (`?tab=routes`): route → contract binding; **2 unbound routes** flagged.
- **Not-installed plugin group** — gated with `plugin-gated-view`, teaching
  `netscript plugin add crons`. **Write:** that action is **live** and confirm-gated (Axis 1/3).
- **Out-links:** "Open in Scalar" per procedure (`/api/docs#<anchor>`).
- **Detail** (`/catalog/procedures/:procedureId`): the contract shape, its provenance, its three
  dualities, and the Scalar link. Coverage is a NetScript fact; the reference is Scalar's.

### S13 · `/flow`, `/flow/:correlationId` ★ — Live Flow (flagship #2)

**The causal seam chain. NOT a waterfall — no span bars, no time-proportional axis, ever.**

- **Three zones.** Left: live flow list (SSE) + `?route=` / `?status=` filters + Follow. Center: the
  **`ns-journey`** causal seam chain. Right: seam detail rail.
- **The chain** (the canonical incident, §3.1): each node is a **framework primitive** with its status
  and its **payload at the seam** (progressive disclosure — `<details>`), and each node deep-links to
  **its own entity route** *and* to the Aspire trace.
- **`/flow/:correlationId`** is the addressable journey. Every entity detail screen carries an
  **"Open correlation journey"** affordance pointing here.
- **Halted variant** (`ch_9M2xB7pQr`) is in the list and is designed — a halted chain reads
  differently from a running one.
- **AI assist (Axis 5):** "Diagnose" on a halted/failed seam → an inline explanation grounded in that
  seam's payload, with the exact retry/compensate CLI command.
- **Write (Axis 3):** "Replay from seam" on a failed seam — confirm + CLI.
- **Out-link:** raw timing/span detail → Aspire `/traces/detail/{traceId}`. That link is *prominent* —
  it is the honest boundary of the satellite.

### S6 · `/runs`, `/runs/:correlationId` — Run Inspector

- **Cross-primitive run list** — saga / job / task / firing / delivery. Filters, sort, pagination **all
  in the URL** (`?kind=&status=&from=&to=&page=&sort=&order=`).
- **`/runs/:correlationId`** — the same id as `/flow`, rendered as a **run**: grouped executions,
  `ns-step-timeline` with **attempt pills** (`2/3`) and a visually distinct **compensation branch**,
  and an `?view=all|compact|json` altitude toggle.
- **Correlated log strip** — read-only, bounded, **out-links to Aspire structured logs**. It is a
  pointer, not a tail: no follow mode, no filters, no search. (Boundary confirmation:
  `OPEN-QUESTIONS.md` OQ-9.)
- **Back-links are real:** an execution carries its `correlationId`; "Open trigger event" and "Open
  saga instance" both resolve.
- **AI assist:** "Explain this failure" on a failed step. **Write:** confirm-gated "Retry run".

### S5 · `/plugins`, `/plugins/:pluginId` — Plugin Control (dogfood centerpiece)

- **Registry table:** 5 installed plugins with versions; auth shows the `v0.9.1 → v1.0.0` update.
  `?tab=installed|available|contributions`.
- **Detail** (`?tab=overview|axes|doctor|config`):
  - **`ns-axismap`** — the plugin's **contribution axes** (service · aspire · dashboard panel ·
    commands · db · streams …), **as live navigation**: clicking a wired axis navigates to the surface
    that plugin contributes (Axis 6). Not a static diagram.
  - **Doctor rows** — the triggers DLQ-port warning lives here, with the `netscript plugin doctor` line
    printed (CLI transparency).
- **Writes (all live, all confirm+CLI):** add plugin · update plugin · **create from template**
  (the scaffold flow, calling the same generator the CLI does — "one generator, two callers").
- **Marketplace-lite:** the `available` tab lists installable plugins with an install action.

### S7 · `/workers/*` — Workers console

**The job/task split is the differentiator no competitor console has. Do not flatten it.**

- **`/workers`** — overview fronting **Jobs** (compiled Deno units, 11) and **Tasks** (polyglot, 5),
  each a real sub-route.
- **`/workers/jobs`** — registry + live execution feed. `?status=` and `?triggeredBy=` (schedule / cron
  / manual / trigger / saga, each with an icon). Overridden-to-DISABLED jobs render muted, linked to
  the override that disabled them.
- **`/workers/tasks`** — **runtime badges** per task: Deno · Python · Shell · PowerShell · .NET, with a
  `?runtime=` filter. "Nightly reconcile (Python task)" vs "reserve-inventory (Deno job)".
- **`/workers/jobs/:jobId`** — config + recent executions. `nightly-reconcile` carries the
  **scheduler-vs-config drift panel**, linked to override `v43` as the cause, with an AI assist that
  explains the drift and offers the override fix.
- **`/workers/jobs/:jobId/executions/:executionId`** — `ns-step-timeline`, attempt pills, I/O payloads.
  `job_4183` is here: attempt 2/3, RETRYING.
- **The manage loop:** create (scaffold a job — CLI-mirroring) → configure (tabs: schedule, retry,
  concurrency) → monitor (the execution feed) → act (run now / cancel — confirm + CLI).

### S8 · `/sagas/*` — Sagas console

- **`/sagas`** — definitions (4) + instances (87), `?status=active|completed|failed|pending|compensating`.
- **`/sagas/:sagaName`** — the definition, its steps, and its instances table.
- **`/sagas/:sagaName/:correlationId`** — the **instance**; the second param **is the correlation id**.
  - `?tab=history` — the real **instance-history stream** (from→to transitions), with the
    **compensation branch visually distinct** (warning rail, ⟲ markers). `PaymentWebhookSaga` /
    `ch_3QK9dR2eZ` is COMPENSATING at step 2 of 4.
  - `?tab=executions` — the worker executions for this correlation id (the join is real).
  - `?tab=payload` — the correlated payload.
  - **"Open full journey"** → `/flow/ch_3QK9dR2eZ`.
- **AI assist:** on the compensation branch — *why* compensation triggered, from the transition history.
- **Write:** confirm-gated **replay / compensate** (where the shipped contract exposes the route).

### S9 · `/triggers/*` — Triggers console

- **`/triggers`** — 9 triggers covering **all eight types** (file · webhook · schedule · cron · kv ·
  polling · composite · manual). `?type=` and `?status=enabled|disabled`.
- **`/triggers/:triggerId`**:
  - `?tab=events` — the firing feed.
  - `?tab=schedule` — humanized cron (`*/5 * * * *` → "Every 5 minutes") + **next-5-fires** preview
    with timezone and backfill.
  - `?tab=config` — the trigger config.
- **`/triggers/:triggerId/events/:eventId`** — the event, rendered as its **action chain**
  (`ns-achain`): each `actionResult` (`enqueueJob` / `publishSaga` / `executeTask` / `executeBatch`)
  with its status, duration, and a **deep-link to the entity it produced**. `evt_2210` fans out to the
  saga instance and the job execution — one trigger event is the whole journey in miniature.
  Each action shows **which plugin contributed it** (Axis 6).
- **Writes (live):** enable / disable (confirm + CLI) · webhook **test delivery** form (ingress
  simulation).
- **DLQ link** → `/dlq?tab=trigger` (the degraded DLQ port is the doctor warning).

### S10 · `/streams/*` — Streams console

- **`/streams`** — 3 streams, 7 subscribers, delivery stats.
- **`/streams/:streamId`** — `?tab=deliveries|subscribers|wiring`. The **fan-out** for `msg_88f`:
  2/3 delivered · 1 failed (**analytics**) — consistent with S13's chain.
- **`/streams/:streamId/subscribers/:subscriberId`** — per-subscriber delivery detail with attempt
  pills.
- **Writes:** **redeliver** a failed delivery (confirm + CLI); **wire read-model** where a subscriber's
  read-model is unwired (a scaffold action, not a static empty state).
- **Cross-link:** failed deliveries → `/dlq` with the messages pre-selected in the URL.

### S11 · `/migrations/*` — DB Migrations & Drift

- **Migration table** — 4 total, 3 applied, **1 pending** (`20260711_add_delivery_attempts`), matching
  Home's count. `?status=pending|applied`.
- **Drift alert + introspect diff** — schema-vs-database divergence, rendered as a real diff.
- **Writes (live):** **apply migration** · **seed** — confirm dialog printing the exact CLI, with the
  diff shown before confirm.
- **AI assist:** explain the drift in plain language.

### S12 · `/dlq/*` — Dead-Letter Queues

**Final shipped surface. No "preview" framing, no gating (Axis 1).**

- **Depth stat grid** — KV 4 · Redis 11 · Postgres 3 = **18**. `?tab=queue|trigger`, `?backend=`.
- **`/dlq/:queueId`** — message table with **addressable multi-select** (`?selected=msg_1,msg_2`) and
  payload disclosure.
- **`/dlq/:queueId/messages/:messageId`** — the message: payload, error, attempt history.
- **Writes (live):** **reprocess selected** — confirm naming backend + count + the exact CLI;
  **discard**.
- **AI assist:** cluster messages by failure similarity ("12 failures: schema mismatch") — a view, not
  an action.

### authc · `/auth/*` — Auth Sessions

- **Session projection table** from the auth plugin's durable stream: user, provider (oidc / password /
  api-key), state (ACTIVE / REVOKED), issued/expiry. 24 active. `?provider=`, `?state=`.
- **`/auth/sessions/:sessionId`** — the session + its live `auth.*` event stream (signin / refresh /
  revocation / oidc).
- **Write:** confirm-gated **revoke session** (+ CLI line).
- **Spine:** where an `auth.*` event triggers downstream work, it links into `/flow/:correlationId`.

### S-ai · `/ai`, `/ai/runs/:runId` — AI console (plus assists everywhere)

**Axis 5's failure mode is one generic chat pane. The console is the *durable-run* surface; the AI
capability itself is distributed across every screen above.**

- **`/ai`** — `?tab=activity|tools`.
  - KPI strip: 31 agent runs (24 h) · 118 tool calls · 4 % tool-failure · 2.9 s median latency.
  - "Ask about your app" prompt bar, **grounded in the live registry / runs / overrides** — it names its
    grounding sources.
  - Agent-run rail (durable runs: completed / running / failed).
  - `?tab=tools` — the **12 contract procedures exposed as agent tools**: the tool registry, with each
    tool's contract shown. This is the transparency surface.
- **`/ai/runs/:runId`** — turn transcript with **tool-call cards** (`ToolCallCard`), each an interactive
  chip that **deep-links to the entity it queried**. The run carries `correlationId ch_3QK9dR2eZ` and
  links into `/flow/ch_3QK9dR2eZ` and the saga instance it investigated — **AI joins the same spine**.
  Model rendered as a neutral label (`ops-model-large`).
- **Raw GenAI telemetry:** out-link to Aspire. Not rendered here.
- **Distributed assists** (retro-fitted across P1–P3 in pass P4): S13 seam diagnosis · S6 explain-failure
  · S3 override suggestion · S7 drift diagnosis · S8 compensation explanation · S11 drift explanation ·
  S12 failure clustering · Home incident narrative. Each: **grounded, inline, and it produces a
  confirm+CLI action** — never a free-floating chat bubble. Whether the shell also carries a persistent
  AI dock is **OQ-6** — do not build it until answered.

### `/extensions`, `/extensions/:extensionId` — Extension platform (Axis 6)

- **`?tab=panels|actions|available`** — everything contributed to the dashboard:
  - **panels** — the 6 contributed panels (the 4 first-party capability sections + 2 third-party),
    each showing its `DashboardPanelContribution` fields: `id`, `title`, `icon`, `capability`,
    `component`, `slots` (options / sidebar / actions), `commands`.
  - **actions** — contributed ⌘K actions and `withCommand` actions, with their provenance plugin.
  - **available** — third-party extensions installable from here.
- **`/extensions/:extensionId`** — the contribution detail: what it mounts, where, which ports its
  `setup()` wires, and a link to the contributing plugin (`/plugins/:pluginId?tab=axes`).
- **The story this screen must tell:** a contributor writes a plugin, and the dashboard *grows*. The
  four first-party sections being visible here as ordinary contributions is the proof.

---

## 5. Cross-cutting states every screen owes

| State | Requirement |
| ----- | ----------- |
| **Loading** | Skeleton (`Skeleton`) in the real layout — never a spinner over a blank page. |
| **Empty** | Teaches the loop: what this surface shows, and **the one command that produces the first data**. Nothing else. |
| **Not-installed** | `plugin-gated-view` — the capability exists, the plugin isn't installed; the empty state teaches `netscript plugin add <name>`. This is a real product state, not a preview gate. |
| **Error** | `Alert` in the content region with the failing call named and a retry. |
| **Degraded** | The default fixture. |
| **Dark** | Every screen. Contrast validated on dense tables and state pills — not an inverted filter. |
| **Reduced motion** | Every pulse/slide/tick has a `prefers-reduced-motion` fallback. |
