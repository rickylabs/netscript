# Dev Dashboard Rescope — Per-Issue Verdicts & Replacement Bodies (drafts, owner ratifies)

Run: `dashboard-rescope--seed` · 2026-07-06. Companion to `plan.md`; mutation batch in `ratification-summary.md`.

Supervisor notes on the drafts below:
- **V2 AMENDMENT (owner feedback, 2026-07-06):** v1 over-corrected. The original seed research mandates two more pillars the verdicts below now restore: (P2) the **Appwrite-style manage-through-UI console** — the dashboard mirrors the CLI's management verbs per capability (create → configure(tabs) → monitor loop; one generator, two callers) — and (P3) **Encore-model seam-flow telemetry** — a live request journey across framework seams, never re-rendered OTLP. Verdict changes: **#418 CLOSE → REWRITE** (becomes S13 Live Flow), **#432 KEEP-defer → REWRITE (elevate to beta.7 management keystone)**, one new co-req (**DDX-23** seam-event flow plane), and management-loop addenda appended to #420, #428–#431, DDX-20, DDX-21. No v1 screen is deleted.
- Verdict tally (v2): **3 CLOSE** (#421, #422, #425), **18 REWRITE** (#400 epic + #411 #412 #413 #415 #416 #417 **#418** #419 #420 #423 #424 #426 #428 #429 #430 #431 **#432** #507), **5 KEEP** (#408, #410, #414, #427, #509 — two with tightening addenda), **6 NEW** (DDX-20 S3 flagship, DDX-21 S11, DDX-22 S12, DDX-23 flow plane, and two co-requisite DLQ API slices).
- Closures use **supersession comments, never closing keywords** — nothing here is resolved by a PR.
- The epic #400 replacement body is maintained separately in `epic-rewrite.md` (the copy embedded below is the same text at draft time; `epic-rewrite.md` wins on divergence).
- Taxonomy: all labels below come from `.github/labels.yml`; exactly one `status:` per issue; `wave:v1` → milestone `0.0.1-beta.6`, `wave:defer` → `Backlog / Triage`. Noted gaps (`area:queue`, per-capability areas) are flagged, not invented.

---

# Dev Dashboard Board Rescope — Per-Issue Disposition (beta.6, OWNER MANDATE 2026-07-06)

**Governing thesis applied to every verdict (v2, three pillars):** the dashboard (P1) renders only runtime/config/codegen state Aspire and Scalar *structurally cannot* — NetScript-primitive run-state, the override/config layer, plugin-registry wiring, contract provenance, codegen/scaffold state; (P2) **mirrors the CLI's management verbs through the UI** per capability (Appwrite loop: create → configure(tabs) → monitor; every mutation = the same contract route/scaffolder the CLI calls + CLI-equivalent CodeBlock); (P3) **follows a request live across framework seams** (Encore model — causal chain with payloads at seams, never re-rendered OTLP) — and hands off (deep-links) to Aspire for raw telemetry/process control and to Scalar for API reference/try-it.

**Label conventions used below** (from `.github/labels.yml`): epic label is `epic:dev-dashboard`; exactly one `status:`; `wave:v1` → milestone `0.0.1-beta.6`, `wave:defer` → milestone `Backlog / Triage` (or `0.0.1-stable`). There is no `area:dashboard`/`area:workers`/etc., so dashboard slices use the closest existing area labels (`area:plugins`, `area:fresh-ui`, `area:aspire`, `area:cli`, `area:config`, `area:telemetry`, `area:database`).

**Two mapping notes where I diverge from the loose labels in the integration doc, stated once:** (1) the `AspireResourceKind` `command`/`app` seam widening stays on **#411 (DDX-1)** — its original technical home — not #423; (2) the `/_netscript/*` introspection endpoint stays on **#423 (DDX-13)**, its original home, now including the runtime-config SSE subtopic. The generator `WithUrl`/`withCommand` emission + CLI deep-links consolidate on **#424 (DDX-14)**. This minimizes issue churn while preserving the integration architecture's substance.

---

## #400 — epic: NetScript Dev Dashboard — **REWRITE**

**One-line rationale:** Intent is complementary but the body bakes in duplication (flagship trace-waterfall over Aspire's own OTLP); needs the three-pillar thesis, the acceptance lines, and the rescoped screen set (S1–S13) as the authoritative slice map. **No closing keyword** (epic).

**⚠ V2:** the embedded copy below is the **v1 draft** kept for the record — `epic-rewrite.md` carries the ratified **v2** body (three pillars, S13, acceptance lines 1–3, #432 elevation) and wins on divergence. Apply from `epic-rewrite.md`.

**Replacement body:**

> ## epic: NetScript Dev Dashboard — the Aspire/Scalar satellite dev console (ships as a plugin, beta.6)
>
> ### Summary
> A DX-oriented dev dashboard shipping as `plugins/dashboard` + `packages/plugin-dashboard-core` on `@netscript/fresh-ui`. It is a **satellite of Aspire's control surface, not a rival**: it renders only NetScript-domain state that Aspire and Scalar cannot see, and deep-links back out to them for everything they already own.
>
> ### DX thesis
> Answer the question no existing tool can: *"is my NetScript app wired the way I declared it, what is my runtime doing right now at the primitive level, and where do I jump to fix it."* Aspire owns process/telemetry; Scalar owns API reference/try-it; the dashboard owns run-state, config/override resolution, plugin-registry wiring, contract provenance, and codegen/scaffold state.
>
> ### Authoritative screen set (supersedes the pass-1 DDX panel list)
> - **S1 Shell & Wiring Home** (DDX-5 #415)
> - **S2 Config Resolution & Topology Hand-off** (DDX-6 #416, rescoped)
> - **S3 Runtime-Config Monitor** ⚑ flagship (NEW #TBD)
> - **S4 Service & Contract Catalog** (DDX-7 #417, rescoped — no try-it)
> - **S5 Plugin Control** (DDX-10 #420, elevated)
> - **S6 Run Inspector + NetScript run-overlay** (DDX-9 #419, absorbs DDX-8 #418)
> - **S7–S10 Workers/Sagas/Triggers/Streams consoles** (DDX-18a–d #428–431)
> - **S11 DB Migrations & Drift** (NEW #TBD, beta.6-if-cheap)
> - **S12 Dead-Letter Queues** (NEW #TBD, later; gated on thin API slices)
>
> ### Non-duplication acceptance line (MANDATORY, gates every slice)
> No dashboard screen may render, as an owned surface: an OTLP trace waterfall, a structured/console log tail, a metrics chart, a resource start/stop/restart panel, or an OpenAPI operation list / try-it console. Each of those is Aspire's or Scalar's job and MUST be a deep-link out. Every merged panel must pass the review question **"why can't this just deep-link to Aspire/Scalar?"** with a NetScript-only answer recorded in its issue.
>
> ### Integration seams (four seams, one URL scheme)
> Aspire → dashboard: `WithUrl("NetScript Dashboard")` on every scaffolded resource + two framework `withCommand`s. Dashboard → Aspire: correlate-only `TelemetryQueryPort` (resolve traceId) then out-link to `/traces/detail/{id}`, `/structuredlogs`, `/consolelogs`, `/metrics`. Dashboard → Scalar: `/api/docs` anchors only. Data plane: owned `/_netscript/*` introspection over already-shipped oRPC contracts.
>
> ### Killed/folded surfaces (documented so they don't creep back)
> Logs panel (DDX-11 #421 → deep-link Aspire), Resource control panel (DDX-12 #422 → `withCommand` in Aspire), Trace waterfall renderer (DDX-8 #418 → folded into S6), service `/health` panel (→ Aspire State column via `withHealthCheck()`), metrics charts + GenAI view (→ Aspire).
>
> ### Dependencies
> Co-lands with `epic:telemetry-revamp` (T7 #408 query surface + traceparent stamping). Seam widening #411. Introspection mount #423. CLI/deep-links #424. Design prototype #507.

**Labels:** `type:umbrella`, `epic:dev-dashboard`, `area:plugins`, `area:fresh-ui`, `priority:p1`, `wave:v1`, `status:plan`. Milestone `0.0.1-beta.6`. **No `status:` duplication; no closing keyword.**

---

## #408 — [telemetry T7] `@netscript/telemetry/query` dashboard surface — **KEEP-AS-IS (tighten non-goals)**

**Rationale:** Infra-neutral enabling plumbing (query/export API, preserves TC-1..14 field vocabulary); not a UI. Keep, but add one non-goal so it can't drift into a renderer.

**Tightening addendum to append (non-goals):**
> **Non-goals.** This is a correlation/export API, not a display surface. It MUST NOT ship any UI, and its dashboard consumer (#413) uses it only to resolve a `traceId` for out-linking to Aspire — never to ingest OTLP for in-dashboard rendering. Do not invent parallel span/attribute names outside the #402 TC-1..14 vocabulary.

**Labels unchanged:** `type:feat`, `area:telemetry`, `epic:telemetry-revamp`, `priority:p1`, `wave:v1`, `status:*` (keep current single status). Milestone `0.0.1-beta.6`.

---

## #410 — DDX-0: fresh-ui L3 blocks promotion + copy-source registry — **KEEP-AS-IS**

**Rationale:** Pure UI-kit registry plumbing (breadcrumbs, context-rail, activity-feed, tree-nav) with byte-diff proof; zero Aspire/Scalar overlap. No change. Labels: `type:feat`, `area:fresh-ui`, `epic:dev-dashboard`, `priority:p2`, `wave:v1`, one `status:`. Milestone `0.0.1-beta.6`.

---

## #411 — DDX-1: `@netscript/aspire` `command` + `app` resource kinds — **REWRITE**

**Rationale:** This is Seam A — the exact Aspire-extension mechanism the mandate asks for. Rewrite to foreground: it enables the dashboard's `app` self-registration AND plugin-contributed `command`s (the resource-control-as-`withCommand` replacement for killed DDX-12), with the fixed framework commands shippable via Seam B in the meantime.

**Replacement body:**

> ## DDX-1: Widen the Aspire seam — `command` + `app` resource kinds (Seam A)
>
> ### Summary
> Extend `packages/aspire`'s `AspireResourceKind` union (today `'deno-service' | 'deno-background' | 'container' | 'database' | 'cache'`) with `'command'` and `'app'`, and extend `AspireNSPluginContribution` so plugins contribute resource commands through `contribute()`. This is the seam that lets the dashboard register itself as a first-class `app` resource and lets plugins surface parameterized actions inside Aspire's own chrome.
>
> ### DX thesis
> The dashboard and its actions must appear **inside Aspire** (Endpoints column, Actions menu, `aspire resource` CLI, Aspire MCP) — "one seam, three surfaces" — so the user never leaves the tool that already has their attention.
>
> ### Scope
> - Add `'command'` and `'app'` to `AspireResourceKind`; keep `AspireResource` as the closed `{name, kind, port?, metadata?}` shape (do **not** introduce C#-only `IResource`/`IResourceBuilder<T>`).
> - Extend `AspireNSPluginContribution` to admit command contributions: `withCommand(name, displayName, executeCommand, options)` where `options.arguments: InteractionInput[]` + `options.confirmationMessage` are the only TS-reachable substitute for the C#-only `IInteractionService`.
> - Register the dashboard as an `app`-kind resource (auto-launch on `aspire start`, fixed port, live updates).
>
> ### Non-goals
> - **Not** re-implementing Aspire resource start/stop/restart as a dashboard panel (that is Aspire-native; killed DDX-12). Resource control is delivered *only* as `withCommand` contributions that render in Aspire's Actions menu.
> - **Not** designing around `IInteractionService`/`PromptInputAsync` — confirmed absent from the TS AppHost SDK.
> - **Not** the generator emission itself (that is #424) — this issue is the type/seam layer in `@netscript/aspire` only.
>
> ### Acceptance criteria
> - `AspireResourceKind` includes `command` and `app`; `deno check` green across `packages/aspire` consumers.
> - A plugin can contribute a resource `command` via `contribute()` that appears in Aspire's Actions menu and is invokable from `aspire resource <name> <cmd>` and Aspire MCP.
> - The dashboard registers as an `app` resource with a resolved fixed port (single source, §5 of integration doc).
> - Fallback documented: until merged, the two fixed framework commands ship via hand-edited Seam B (`register-*.mts`).
>
> ### Dependencies
> Unblocks the parameterized-action UX and the resource-control hand-off (#422 folded here + #424). Co-requisite for S2/S5 "Open in Aspire" round-trips.

**Labels:** `type:feat`, `area:aspire`, `epic:dev-dashboard`, `priority:p1`, `wave:v1`, `status:plan`. Milestone `0.0.1-beta.6`. **Label change:** add `area:aspire` if not present; this is now flagged the beta.6 seam unlock.

---

## #412 — DDX-2: `plugin-dashboard-core` scaffold + contract seam — **REWRITE (tighten domain models)**

**Rationale:** Contract/domain scaffolding is fine, but the domain model as written (`TraceTree`/`TraceSpan` as first-class render models) foreshadows the killed waterfall. Rewrite to demote trace types to correlation-only and add the rescoped domain concepts (override/config, contract provenance, scaffold state).

**Replacement body:**

> ## DDX-2: `packages/plugin-dashboard-core` scaffold + contract seam
>
> ### Summary
> Doctrine-05 package scaffold with the domain models and ports the rescoped dashboard needs, and a `DashboardContract` extending `BasePluginContract`.
>
> ### Scope — domain models
> - **Owned/first-class:** `ResourceGraph` (capability-wiring, not infra topology), `PanelDescriptor`, `RunRecord` (cross-capability logical run), `ContractCatalogEntry` (provenance + coverage + REST/RPC duality), `RuntimeConfigChange` + `RuntimeConfigVersion`, `PluginContributionAxes`, `MigrationStatus`.
> - **Correlation-only (minimal):** `TraceRef` = `{ traceId, aspireTraceDetailUrl }`. Any `TraceSpan` type is a minimal summary for *resolving an out-link*, never a render tree.
> - Ports: `TelemetryQueryPort` (correlation-only), `AspireResourcePort`, `IntrospectionPort`, `CommandInvokePort`.
>
> ### Non-goals
> - **No `TraceTree` render model.** The dashboard never owns a span-tree/waterfall data structure — that is Aspire's Traces tab. Trace types exist only to carry a `traceId` for deep-linking.
> - No OTLP ingestion model, no `LogRecord` render buffer (logs are Aspire-owned; only a correlated strip ref survives).
>
> ### Acceptance criteria
> - Package builds and `deno check --unstable-kv` green; `deno doc --lint` passes the export map.
> - `DashboardContract extends BasePluginContract`; no phantom-typed unsoundness reintroduced.
> - `TraceRef`/trace types carry no span-children arrays.
>
> ### Dependencies
> Consumed by #413 (ports impl), #415 (shell), #417/#419/#420 and S7–S10.

**Labels:** `type:feat`, `area:plugins`, `epic:dev-dashboard`, `priority:p1`, `wave:v1`, `status:plan`. Milestone `0.0.1-beta.6`.

---

## #413 — DDX-3: `TelemetryQueryPort` + aspire-otlp-http adapter — **REWRITE**

**Rationale:** The data-source is duplication-bearing; rewrite to make the port **correlation-only** (resolve traceId → out-link) and explicitly not a renderer, and to split the owned introspection data onto #423.

**Replacement body:**

> ## DDX-3: `TelemetryQueryPort` + `adapters/aspire-query` — correlation-only
>
> ### Summary
> A single query port with one production adapter wrapping Aspire's `/api/telemetry/*`. Its **only job is correlation**: given a NetScript primitive's stamped `traceparent`, return the `traceId` (and, where cheap, a minimal span summary) so the dashboard can render an out-link to Aspire's trace-detail UI.
>
> ### DX thesis
> "Show me the raw trace for this saga step" → resolve the id, then hand off to Aspire. NetScript never re-renders OTLP.
>
> ### Scope
> - `adapters/aspire-query` consumes `/api/telemetry/{traces,traces/{traceId},logs,spans}` (Aspire ≥13.2, `x-api-key`) generalizing the existing `fetchDashboardTraces()` reference consumer.
> - Version-pinned (Aspire 13.4.6); isolated so a shape change is a one-file swap.
> - Returns `TraceRef { traceId, aspireTraceDetailUrl }` + optional minimal span summary.
> - Pairs with #408: requires `packages/telemetry` to stamp `traceparent` onto primitive internal spans.
>
> ### Non-goals
> - **Not** an OTLP renderer. Does not build a `TraceTree`, does not render waterfalls, logs, or metrics. (Those are Aspire's Traces / Structured Logs / Metrics tabs.)
> - Does not ingest `?follow=true` NDJSON for display.
> - The owned `/_netscript/*` introspection data plane is **#423**, not here.
>
> ### Acceptance criteria
> - Given a `traceparent`, the port returns a resolvable `aspireTraceDetailUrl`; a Run Inspector row's "View trace" opens Aspire's `/traces/detail/{traceId}`.
> - Swapping the adapter requires touching one file; version pin recorded.
> - `/_netscript/telemetry/coverage` reflects which primitives are wired-to-emit vs configured-but-unwired.
>
> ### Dependencies
> #408 (T7 query surface + traceparent stamping). Feeds S6 correlation.

**Labels:** `type:feat`, `area:telemetry`, `area:plugins`, `epic:dev-dashboard`, `priority:p1`, `wave:v1`, `status:plan`. Milestone `0.0.1-beta.6`.

**V2 note (add one line to the body's non-goals):** the S13 Live Flow view (#418) does **not** widen this port — the flow plane is owned seam events on #423/DDX-23; this port remains the correlation-only bridge from any flow/run node to Aspire's raw trace detail.

---

## #414 — DDX-4: `plugins/dashboard` thin plugin + E2E join — **KEEP-AS-IS**

**Rationale:** Standard `#157` typesafe-codegen plugin-installer plumbing (manifest, `definePlugin`, adapter install/doctor/info); no UI content, no overlap. Keep. Labels: `type:feat`, `area:plugins`, `area:cli`, `epic:dev-dashboard`, `priority:p2`, `wave:v1`, one `status:`. Milestone `0.0.1-beta.6`.

---

## #415 — DDX-5: Fresh build-console shell + app-registration + IA — **REWRITE**

**Rationale:** Shell/chrome is complementary, but the IA must be the rescoped 7-screen set (not the old panel list) and foreground the "orbits Aspire, never rivals it" framing (S1).

**Replacement body:**

> ## DDX-5 / S1: Dashboard Shell & Wiring Home
>
> ### Summary
> The `SidebarShell` IA + the dashboard's Aspire `app`-kind self-registration + the "wiring home" landing screen that answers "is my NetScript app wired the way I declared it, and where do I jump to fix it."
>
> ### DX thesis
> One satellite entry that orbits Aspire. Every stat surfaced is an only-NetScript fact; every card deep-links to its owning screen or out to Aspire.
>
> ### Scope
> - `sidebar-shell` + `ns-envbar` identity pill (`local · my-app · aspire`); `command-palette` (⌘K) as primary nav.
> - `stats-grid` of only-NetScript health facts: N plugins loaded / M doctor warnings, unbound routes count, disabled-override count, pending migrations, live-vs-config scheduler drift count.
> - Panels arrive through the `DashboardPanelContribution` seam (#427) — the shell is the dogfood proof the dashboard is itself a plugin.
> - Register as Aspire `app` resource (auto-launch on `aspire start`, fixed port, live updates); target of Aspire's `WithUrl "NetScript Dashboard"`.
>
> ### Non-goals
> - No resource-status grid that mirrors Aspire's Resources page; no log/trace/metric tiles. Stat cards surface NetScript-domain counts only.
> - Does not own the deep-link URL scheme definition (that's #424) — it consumes it.
>
> ### Acceptance criteria
> - Shell renders with all stat cards deep-linking to S2–S12 / Aspire root.
> - Dashboard appears as an `app` resource with `WithUrl` back-link present in Aspire Endpoints column.
> - At least one panel is injected via the `DashboardPanelContribution` seam (dogfood).
>
> ### Dependencies
> #410 (blocks), #411 (`app` kind), #423 (summary data), #424 (URL scheme), #427 (panel seam).

**Labels:** `type:feat`, `area:fresh-ui`, `area:plugins`, `epic:dev-dashboard`, `priority:p1`, `wave:v1`, `status:plan`. Milestone `0.0.1-beta.6`.

---

## #416 — DDX-6: Stack Map panel — **REWRITE**

**Rationale:** DUPLICATE-LEANING vs Aspire Resources (health-colored resource graph + node detail). Rewrite to retarget the `ns-stackmap` primitive from infra topology to a **plugin→capability→primitive wiring graph** + declared-intent-vs-running-reality (S2).

**Replacement body:**

> ## DDX-6 / S2: Config Resolution & Topology Hand-off
>
> ### Summary
> The declared-intent-vs-running-reality seam: render what the user *declared* (services/apps/dbs/plugins, saga-store backend, resource mode) and let each node jump into the matching thing Aspire is *running*. The `ns-stackmap` edge-layer primitive survives, retargeted to a capability-wiring graph.
>
> ### DX thesis
> "Which plugin's saga triggers which worker queue; which trigger fires which stream" — cross-primitive wiring Aspire's generic resource view cannot show.
>
> ### Scope
> - Left `tree-nav` of resolved declared intent (`inspectConfig` over `netscript.config`/appsettings NetScript section).
> - Center capability-wiring graph: `ns-stackmap` nodes = capabilities, edges = cross-primitive wiring (from the plugin contribution-axis map).
> - Right `context-rail` node detail: `connector` key/value rows + telemetry-coverage badge (`ok | unwired`) from the instrumentation registry overlay.
> - Selecting a config node highlights its wiring edges and the running Aspire resource it maps to.
>
> ### Non-goals
> - **NOT Aspire's Resources tab.** No resource health/state coloring as the primary axis, no process up/down, no MCP `list_resources` infra redraw. The graph is about *ownership and wiring*, not resource liveness.
>
> ### Acceptance criteria
> - Graph nodes are capabilities/plugins with cross-primitive edges; node detail foregrounds plugin ownership + wiring, not health.
> - Each node deep-links out → Aspire resource page (`WithUrl`) and → S5 for the contributing plugin, → S4 for its contracts.
> - Telemetry-coverage badge distinguishes wired-to-emit vs configured-but-unwired.
>
> ### Dependencies
> #410 (`ns-stackmap`), #423 (`/_netscript/config`, contributions), #411 (Aspire back-links). Coverage overlay beta.6-if-cheap else fast-follow.

**Labels:** `type:feat`, `area:fresh-ui`, `area:config`, `area:plugins`, `epic:dev-dashboard`, `priority:p1`, `wave:v1`, `status:plan`. Milestone `0.0.1-beta.6`.

---

## #417 — DDX-7: Service Catalog + API Explorer panel — **REWRITE**

**Rationale:** Strongest duplication vs Scalar try-it. Rewrite to delete the call-form/try-it entirely and keep only contract **provenance + coverage + REST/RPC duality**, deep-linking to Scalar for the actual reference/call (S4).

**Replacement body:**

> ## DDX-7 / S4: Service & Contract Catalog (provenance, not try-it)
>
> ### Summary
> Contract provenance and coverage *above the OpenAPI boundary* — which plugin contributed a procedure, is it installed, does it serve REST and typed RPC, and why is its Scalar page thin — then hand the actual reference/try-it to Scalar.
>
> ### DX thesis
> Scalar cannot see plugin ownership, `.describe()` coverage gaps, or REST-vs-RPC duality. The dashboard lists those and links out.
>
> ### Scope
> - `tree-nav` contract tree (plugin → namespace) with `plugin-gated-view` over not-installed plugins (teaches the install command — a concept Scalar lacks).
> - `data-table` of contracts: provenance (owning plugin/namespace), method badge (read-only chip), coverage state (thin/complete from a `.describe()`/`.method()` scan), duality (REST `/api/*` + typed `/api/rpc/*` + SDK).
> - "Fresh route wiring" tab: `DiscoveredNetScriptRoute` bound-vs-unbound page routes (inline vs `.route.ts` sidecar) with authoring form.
> - Each row → "Open in Scalar" deep-link to `/api/docs#tag/{tag}/{method}/{path}`.
>
> ### Non-goals
> - **NOT Scalar.** No endpoint operation list, no schema rendering, **no try-it / call form / param-filling console.** Deleting the pass-1 "Live API Explorer" is explicit acceptance. Scalar owns operations/schemas/try-it/auth.
>
> ### Acceptance criteria
> - No call-form ships. The only "call it" affordance is a deep-link to Scalar's operation anchor.
> - Table shows provenance + coverage + duality for every contract; unbound Fresh routes are listed with an authoring form.
> - Not-installed plugins show `plugin-gated-view` install teaching.
>
> ### Dependencies
> #423 (`/_netscript/routes`, contract registry), #424 (Scalar anchor scheme), #420 (plugin link). Optional polish: OpenAPI `externalDocs` back-links (#424).

**Labels:** `type:feat`, `area:fresh-ui`, `area:plugins`, `area:cli`, `epic:dev-dashboard`, `priority:p1`, `wave:v1`, `status:plan`. Milestone `0.0.1-beta.6`.

---

## #418 — DDX-8: Flow / Trace Waterfall panel — **REWRITE → S13 Live Flow** *(v2: was CLOSE in v1)*

**Rationale (v2):** The pass-1 *waterfall* stays dead — a two-panel span gantt is Aspire's Traces tab, unmodified. But the owner amendment + the seed research's Encore teardown confirm the underlying telemetry-integration idea was right and v1 threw it out with the rendering: Encore's per-request journey (request → response payload → DB queries → pub/sub publishes) is the single most-loved surface in the closest-analog console. Rescope #418 into **S13 Live Flow** — the same causal value, expressed as NetScript's **own seam events**, primitive-grouped, with payloads at the seams — structurally different from an OTLP waterfall and impossible for Aspire to render (it has no vocabulary for "this handler enqueued this job which advanced this saga").

**Replacement body:**

> ## DDX-8 / S13: Live Flow — request journey across framework seams (flagship #2)
>
> ### Summary
> Follow one request live through the stack: HTTP call → contract procedure (with returned payload) → job it enqueued → saga steps it advanced → stream fan-out it caused — one causal chain, grouped by primitive, streaming as it happens. Rescoped from the pass-1 trace-waterfall: the *causality* survives; the *span-bar rendering* does not.
>
> ### DX thesis
> Aspire renders spans but has no vocabulary for NetScript seams — it cannot say "this API call triggered job `reserve-inventory`, which advanced saga `order.fulfillment` to step 3, which published to `payment-events` (3 subscribers)." Only the framework knows its own seams. (Encore's dev-dash proves this is the killer surface; NetScript's version is seam-semantic, not span-cosmetic.)
>
> ### Scope
> - **Live flow list** (`activity-feed`): recent requests/flows, newest first, filterable by route/primitive/status; select one to pin its journey.
> - **Journey chain** (`ns-step-timeline`, causal not time-proportional): seam nodes — `HTTP POST /api/orders` → `contract orders.create → 201 {orderId}` → `job reserve-inventory queued → completed (attempt 1)` → `saga order.fulfillment step 2→3` → `stream payment-events → 3/3 delivered`. Each node: primitive badge, status via `STATUS_VARIANT`, expandable payload-at-seam CodeBlock (request/response/job input/step I/O), mono ids.
> - **Data (beta.6, correlation-join fidelity):** assembled by joining already-shipped streams — workers SSE (`GET /subscribe`), trigger events SSE, saga `/history`, stream deliveries — on the stamped `traceparent` (#408 T4–T7), exposed as `/_netscript/flows` SSE (#423). **No new instrumentation required to ship.**
> - **Fidelity upgrade (co-req DDX-23, beta.7):** unified seam-event envelope + HTTP request ingress/egress boundary events, so flows start at the route boundary instead of the first primitive event.
> - Per-node **"View raw trace"** out-link → Aspire `/traces/detail/{traceId}` via #413.
>
> ### Non-goals (acceptance line 3 of the epic)
> - **No span bars, no time-proportional gantt, no duration-scaled bars, no log tails.** The chain is causal/semantic; the moment raw timing or span detail matters, out-link to Aspire. This is what keeps S13 distinct from the killed waterfall.
> - No OTLP ingestion; the flow plane is owned seam events (#423/DDX-23), never `/api/telemetry/*` (#413 stays correlation-only).
>
> ### Acceptance criteria
> - One scaffold-app HTTP request produces a live flow chain with ≥3 primitive-labeled seam nodes and payloads at each seam.
> - Every node carries an Aspire out-link; no in-dashboard span render exists (E2E #426 asserts the URL, not a waterfall).
> - Flow list streams live (SSE); selecting a flow pins it while the list keeps updating.
>
> ### Dependencies
> #408/#413 (traceparent + correlation), #423 (`/_netscript/flows` join), #412 (`FlowRecord` domain model), #419 (S6 cross-links: run-centric ↔ flow-centric). DDX-23 #TBD for boundary-event fidelity.

**Labels:** `type:feat`, `area:fresh-ui`, `area:telemetry`, `area:plugins`, `epic:dev-dashboard`, `priority:p1`, `wave:v1`, `status:plan`. Milestone `0.0.1-beta.6`. **Retitle to:** `DDX-8 / S13: Live Flow — request journey across framework seams`. Cross-ref comment: the pass-1 waterfall scope is dead per the epic's acceptance line 3; S6 (#419) keeps the run-centric view, S13 is the flow-centric view.

---

## #419 — DDX-9: Run Inspector panel — **REWRITE**

**Rationale:** Strongest complementary surface (run/attempt/compensating vocabulary); carry forward wholesale AND absorb the NetScript run-overlay from the killed #418, explicitly with **no owned span bars** (S6).

**Replacement body:**

> ## DDX-9 / S6: Run Inspector (+ NetScript run-overlay, no owned waterfall)
>
> ### Summary
> The run-shaped view Aspire and Scalar have no vocabulary for: a saga instance / job attempt sequence / trigger firing / stream delivery as one logical run — "this run is a saga on step 3 of 5, currently compensating step 2, retried once." Absorbs the causal-grouping intent of the retired DDX-8.
>
> ### DX thesis
> Aspire is a black-box process; Scalar is a static schema. Only NetScript knows a "run," an "attempt," a "compensation."
>
> ### Scope
> - Filterable `entity-rail` run list (status + capability Selects, `empty-state` on zero-match) → `RunDetail` (inputs/results) → `ns-step-timeline` (marker/title/attempt-pill/duration/offset, expandable I/O CodeBlocks, All/Compact/JSON) → `RunRail` `activity-feed` + `connector` context.
> - Cross-capability `RunRecord` spanning eischat→workers→streams as one logical run; `ExecutionRecord`, `SagaTransitionRecord`, `TriggerEvent`, stream deliveries.
> - Attempt/retry vocabulary (`retrying` badge). Correlated `ns-log-stream` strip that **deep-links to Aspire logs** rather than owning them.
>
> ### Non-goals
> - **NOT Aspire's Traces waterfall.** No span bars rendered here. The only trace affordance is a "View trace" out-link to Aspire `/traces/detail/{traceId}` (reverse of Aspire's "Open in Run Inspector" `withCommand`).
> - The log strip does not own logs — it deep-links Aspire structured logs.
>
> ### Acceptance criteria
> - Run timeline is annotated with primitive semantics (queue name, attempt, saga step, trigger firing id), **grouped by primitive** — not a generic span tree.
> - "View trace" resolves a `traceId` via #413 and opens Aspire; no waterfall is rendered in-dashboard.
> - Rerun-from-step + multi-altitude event history deferred to stable.
>
> ### Dependencies
> #413 (correlation), #412 (`RunRecord`), telemetry T4–T7 (#408) for cross-service grouping fidelity.

**Labels:** `type:feat`, `area:fresh-ui`, `area:plugins`, `epic:dev-dashboard`, `priority:p1`, `wave:v1`, `status:plan`. Milestone `0.0.1-beta.6`.

**V2 note:** #418 no longer folds here — it is rescoped to S13 Live Flow (flow-centric: one request's causal journey). S6 stays the **run-centric** view (one logical run's lifecycle). Cross-link both ways: a run's originating request → S13 flow; a flow's job/saga node → S6 run detail. Drop the "absorbs #418" line from the body when applying.

---

## #420 — DDX-10: Plugin Control host + registry/overview — **REWRITE (elevate)**

**Rationale:** Complementary dogfood centerpiece. Elevate to the fleet-level plugin-wiring screen with contribution-axis map + version drift + CLI-equivalent doctor (S5).

**Replacement body:**

> ## DDX-10 / S5: Plugin Control (dogfood centerpiece)
>
> ### Summary
> "What's installed, what does each plugin wire into (routes/db/workers/streams/telemetry — 8–10 axes), is it healthy, is it version-drifted." Fleet-level plugin wiring nothing else in the toolchain shows.
>
> ### DX thesis
> Neither Aspire nor Scalar has any concept of a NetScript "plugin," its contribution axes, its doctor report, or its JSR version drift.
>
> ### Scope
> - `data-table` plugin list (status badge, version, drift indicator).
> - `detail-layout` per plugin → contribution-axis map (which axes it wires) + `connector` doctor-check rows (`ok | degraded | failed`) + version-drift row (installed → latest JSR).
> - "Run doctor" action shows its **CLI-equivalent** (`netscript plugin doctor <id>`) via CodeBlock; `plugin-gated-view` teaches install for absent plugins.
> - The mount point where per-capability sections (S7–S10) and plugin-owned `DashboardPanelContribution`s render; global `withCommand` actions.
>
> ### Non-goals
> - Not an Aspire resource-health panel; plugin doctor ≠ resource state. Version drift read is JSR/registry, not Aspire.
>
> ### Acceptance criteria
> - Every plugin shows its contribution axes + doctor rows; drift row resolves installed vs latest JSR.
> - "Run doctor" renders the exact CLI line (transparency pattern).
> - Deep-links: → S2 wiring graph filtered to the plugin, → S4 contracts contributed.
>
> ### Dependencies
> #423 (`/_netscript/plugins*`, doctor, contributions), #427 (panel seam), `deps:latest` for JSR drift. Version drift = beta.6 if the JSR read is cheap, else fast-follow.

**Labels:** `type:feat`, `area:fresh-ui`, `area:plugins`, `epic:dev-dashboard`, `priority:p1`, `wave:v1`, `status:plan`. Milestone `0.0.1-beta.6`.

**V2 management-loop addendum (append to body scope):**
> **Manage (P2, Appwrite loop):** S5 is also the management entry for the plugin capability — (a) a **marketplace-lite "Add plugin" entry**: browse first-party plugins with install state, absent ones teach + can run `netscript plugin add <id>` from the UI (same JSR installer, one generator two callers, confirm + CLI-equivalent); (b) per-plugin **"Scaffold resource" entry point** (template gallery) appearing once #432 lands (beta.7) — hidden/`plugin-gated` until then. Directus's in-app marketplace is the long-term precedent; beta.6 ships only the teach + gated-install affordance.

---

## #421 — DDX-11: Logs panel — **CLOSE**

**Rationale:** DUPLICATE-LEANING (strong). `?follow` NDJSON, level filters, browser-log capture are line-for-line Aspire Structured/Console Logs; no NetScript-specific angle stated. Killed as an owned screen.

**Closure comment (superseded, no PR keyword):**
> Killed by the beta.6 rescope. Structured/console logs + `?follow` NDJSON + level filters + `withBrowserLogs` capture are Aspire-native. `ns-log-stream` survives **only** as a correlated read-only strip inside Run Inspector (#419) that deep-links to Aspire structured logs (`{aspireBase}/structuredlogs?resource={name}`). No owned logs screen ships. Closing as superseded.

Milestone cleared; remove `wave:v1`.

---

## #422 — DDX-12: Resource Control panel — **CLOSE**

**Rationale:** DUPLICATE-LEANING vs Aspire-native start/stop/restart. Killed as a dashboard panel; reimplemented as `withCommand` contributions that appear in Aspire (seam work now on #411). The deferred composite "reset-stack" orchestration moves to a stable-wave item.

**Closure comment (superseded):**
> Killed as a dashboard panel — Aspire already exposes native resource start/stop/restart. Reimplemented as `withCommand(name, displayName, executeCommand)` contributions ("Open NetScript Dashboard", "Inspect saga run", "View plugin registry") that appear **in Aspire's** Actions menu + `aspire resource <name> <cmd>` + Aspire MCP (one seam, three surfaces). The enabling seam widening is #411. The deferred composite "reset-stack" multi-resource orchestration is refiled as a `wave:defer` stable item, not a beta.6 panel. Closing as superseded.

Milestone cleared.

---

## #423 — DDX-13: Introspection endpoint (`/_netscript/*`) — **REWRITE**

**Rationale:** Content is genuinely NetScript-only (INFRA-NEUTRAL). Rewrite to (a) enumerate the full owned data plane over already-shipped oRPC contracts, (b) add the runtime-config SSE subtopic (feeds flagship S3), (c) explicitly separate it from the borrowed telemetry plane (#413).

**Replacement body:**

> ## DDX-13: `/_netscript/*` introspection endpoint (owned domain-state plane)
>
> ### Summary
> A framework-owned read surface (Nitro `/_nitro/tasks` pattern) mounting NetScript-only domain state under a stable namespace. Most of it is **already-shipped oRPC contracts with no UI consumer** — the dashboard is the first consumer, so mounting is the work, not backend.
>
> ### Scope — paths (read-only GET + SSE for streams)
> - `/_netscript/config` — resolved `inspectConfig` (declared services/apps/dbs/plugins, saga-store backend, resource mode).
> - `/_netscript/config/runtime` + `/subscribe` (SSE) — hot-reload monitor: feature flags, disabled jobs/sagas/triggers, task overrides, versioned `current` pointer, **live change events** (from `runtime-config/application/watcher.ts`, today console-only). *(Feeds flagship S3.)*
> - `/_netscript/plugins`, `/plugins/doctor`, `/plugins/contributions` — manifests/capabilities, `PluginDoctorReport`, 8–10 contribution axes.
> - `/_netscript/workers/*` (21-route oRPC shipped), `/sagas/*` (instances + `/history`), `/triggers/*` (events + `/events/subscribe` + enable/disable + `/preview`).
> - `/_netscript/routes` (`DiscoveredNetScriptRoute` bound/unbound), `/db/status` (Prisma migration/introspect/drift), `/scheduler` (`scheduler.list()` vs declared defs), `/telemetry/coverage` (wired-vs-unwired).
> - **`/_netscript/flows` + `/flows/subscribe` (SSE) — v2, feeds S13 Live Flow:** the seam-flow read model. Beta.6 fidelity = a join over the already-listed per-primitive streams keyed on the stamped `traceparent` (no new instrumentation); DDX-23 (co-req, #TBD) upgrades to a unified seam-event envelope + HTTP boundary events.
>
> ### Non-goals
> - **Not** an OTLP/log/metric surface — those are the borrowed telemetry plane (#413) and Aspire. `/_netscript/*` never proxies `/api/telemetry/*`.
> - Namespaced under `/_netscript/` so it never collides with userland `/api/*`.
> - Mutations (trigger enable/disable, saga replay) go through existing contract routes gated behind `withCommand`/dashboard-action confirm — not new write endpoints here.
>
> ### Acceptance criteria
> - All listed paths mounted and return typed JSON; SSE subtopics stream change events.
> - Runtime-config SSE emits the watcher's existing change events (nearly free — no new backend).
> - Co-requisite gaps flagged: `TriggerDlqPort` and `queue` `DeadLetterStore` have no contract route (no route → no panel); tracked as separate co-req issues.
>
> ### Dependencies
> Feeds S1/S2/S3/S4/S5/S7–S10/S11. Co-req API issues for DLQ (filed separately).

**Labels:** `type:feat`, `area:service`, `area:config`, `area:plugins`, `epic:dev-dashboard`, `priority:p1`, `wave:v1`, `status:plan`. Milestone `0.0.1-beta.6`.

---

## #424 — DDX-14: CLI surface + auto-launch — **REWRITE**

**Rationale:** Expand to own the full hand-off surface: CLI commands, console banner, the stable deep-link URL scheme, the `WithUrl`/`withCommand` generator emission, dashboard→Aspire out-link patterns, dashboard→Scalar anchors, and the honest Scalar-has-no-callback note.

**Replacement body:**

> ## DDX-14: CLI + deep-link surface + generator emission
>
> ### Summary
> The thin CLI wrappers, the console banner, the stable deep-link URL scheme every seam targets, and the generator edits that emit `WithUrl`/`withCommand` into Aspire.
>
> ### Scope
> - **Generator emission:** in `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-apps.ts` (+ `register-services`), emit per app/service `.withUrl("http://localhost:${dashboardPort}/resource/${resourceName}", "NetScript Dashboard")` + one apphost-level entry for `/`; emit the two fixed framework `withCommand`s (`open-netscript-dashboard`, `inspect-registry`/`inspect-saga-run`) via Seam B until #411 lands.
> - **Stable URL scheme (dashboard owns):** `/`, `/resource/{name}`, `/workers|/sagas|/triggers|/streams`, `/plugins`, `/plugins/{id}`, `/config`.
> - **CLI:** `netscript dashboard open` (`--no-open`, `--resource {name}`, guard headless/CI), `netscript dashboard url` (pure print, scriptable, `--resource`/`--panel`), console banner on `netscript dev` printing both dashboard URLs. All read the single port source; exit 0 with URL on stdout.
> - **Dashboard→Aspire out-links:** `{aspireBase}/traces/detail/{id}`, `/structuredlogs?resource=`, `/consolelogs/resource/`, `/metrics/resource/`.
> - **Dashboard→Scalar:** `/api/docs` (+ operation anchor) deep-links only.
>
> ### Non-goals
> - Do **not** auto-open a browser on `netscript dev` (print URL only).
> - Do **not** re-render Aspire trace/log/metric pages or a Scalar operation list — links only.
> - **Scalar→dashboard is essentially nil:** Scalar has no plugin/callback surface. The only lever is spec-authored `externalDocs`/`x-*` on the generated OpenAPI doc (optional polish, not a load-bearing seam).
>
> ### Acceptance criteria
> - `WithUrl` link appears in Aspire Endpoints column; one click lands on the deep-linked resource view — no OTLP rendering.
> - `netscript dashboard url --panel sagas` prints a valid deep link; CI-safe print-only path works.
> - Out-link patterns resolve to live Aspire/Scalar pages.
>
> ### Dependencies
> #411 (final `withCommand` via Seam A), #415 (URL scheme consumer), #423 (`/resource/{name}` data). Optional: OpenAPI `externalDocs` emission at contract-build.

**Labels:** `type:feat`, `area:cli`, `area:aspire`, `epic:dev-dashboard`, `priority:p1`, `wave:v1`, `status:plan`. Milestone `0.0.1-beta.6`.

---

## #425 — DDX-15: Claude design-sync artifact + panel prototype — **CLOSE**

**Rationale:** Superseded-in-execution by #507 (design-sync system + full E2E prototype). Close and point to #507.

**Closure comment (superseded):**
> Superseded by #507, which delivers the `tools/design-sync/` system + a full E2E Claude Design prototype of the rescoped shell + screens. Design-sync tooling and the panel prototype now live there. Closing as superseded; no separate deliverable remains here.

Milestone cleared.

---

## #426 — DDX-16: E2E dashboard join + panel smoke — **REWRITE**

**Rationale:** Test/gate issue, but its acceptance was built around asserting the DDX-8 waterfall renders one unsevered trace. Rewrite the assertions to the rescoped reality: no owned waterfall; assert the NetScript run-overlay + deep-links + introspection panels.

**Replacement body:**

> ## DDX-16: E2E dashboard join + panel smoke (merge-readiness)
>
> ### Summary
> The `scaffold.runtime` E2E gate joining the dashboard plugin and smoke-testing the rescoped panels.
>
> ### Scope / acceptance criteria (rewritten)
> - Dashboard registers as an Aspire `app` resource and its `WithUrl "NetScript Dashboard"` link appears in the Endpoints column for scaffolded resources.
> - `/_netscript/*` introspection endpoints respond (config, plugins, workers, sagas, triggers, routes).
> - Run Inspector renders a cross-capability `RunRecord` (eischat→workers→streams) as **one logical NetScript run** with primitive-labeled steps (queue/attempt/saga-step/trigger-id) — grouped-by-primitive, **not** a generic span tree.
> - "View trace" resolves a `traceId` and produces an Aspire `/traces/detail/{id}` out-link (assert the URL, **do not** assert an in-dashboard waterfall renders).
> - Runtime-config SSE emits a change event when an override flips.
>
> ### Non-goals
> - **Do not** assert any owned trace-waterfall / logs tail / metrics chart renders — those are Aspire out-links. The T4–T7 co-land is proven by the correlated `traceId` + primitive grouping, not by an in-dashboard span render.
>
> ### Dependencies
> #408 (T7), #413 (correlation), #419 (run-overlay), #423 (introspection), #415 (shell).

**Labels:** `type:test`, `area:cli`, `area:plugins`, `epic:dev-dashboard`, `priority:p1`, `wave:v1`, `status:plan`, `gate:e2e`. Milestone `0.0.1-beta.6`.

---

## #427 — DDX-17: `DashboardPanelContribution` seam — **KEEP-AS-IS (tighten)**

**Rationale:** Pure extension-point architecture (mirrors `AspireNSPluginContribution`, keeps `@netscript/plugin` free of dashboard coupling); enables the complementary per-capability panels. Keep; add one non-goal.

**Tightening addendum (non-goals):**
> **Non-goal.** The seam admits panels but does not itself define any Aspire/Scalar-duplicating panel; contributed panels are bound by the epic's non-duplication acceptance line (no owned waterfall/logs/metrics/try-it). Keep `@netscript/plugin` free of dashboard imports.

**Labels:** `type:feat`, `area:plugins`, `epic:dev-dashboard`, `priority:p1`, `wave:v1`, one `status:`. Milestone `0.0.1-beta.6`.

---

## #428 — DDX-18a: Workers Console — **REWRITE**

**Rationale:** Complementary; rewrite as the focused S7 console with the scheduler-vs-config drift differentiator and the "21 shipped routes, build UI only" scope.

**Replacement body:**

> ## DDX-18a / S7: Workers Console
>
> ### Summary
> A focused console for the workers primitive sharing the Run Inspector shape (list→detail→step-timeline→activity-feed), scoped to jobs/tasks/executions with worker-specific controls.
>
> ### DX thesis
> "Which job ran, retried twice, failed on attempt 2 of 3, and does the live scheduler agree with what I declared" — Aspire proves the process is up; only NetScript knows the run.
>
> ### Scope
> - Job/task registry `data-table`; live execution feed (SSE `activity-feed` over `execution.*`/`job.*`/`worker.status`/`heartbeat`, `GET /subscribe` — 21 shipped oRPC routes, no backend work).
> - Workflow `ns-step-timeline` (per-step status/kind/durationMs).
> - **Scheduler-vs-config drift panel:** `scheduler.list()` runtime jobs diffed against declared defs; `connector` rows flag "config says scheduled, live scheduler disagrees" (scheduler already emits `jobScheduled`/`jobRun`/`jobError`, unsubscribed).
> - Trigger-execution action with CLI-equivalent CodeBlock.
>
> ### Non-goals
> - No log tail (Aspire); no trace waterfall (out-link to Aspire per execution); no metrics chart.
>
> ### Acceptance criteria
> - Execution + workflow views render from shipped contracts with live SSE.
> - Drift panel flags divergence between declared defs and live scheduler.
> - Deep-links: → S6 for the full cross-service run, → Aspire trace for one execution; in ← S3 (disabled job).
>
> ### Dependencies
> #419 (shared shape), #423 (`/_netscript/workers`, `/scheduler`), #413 (trace out-link). Scheduler-drift needs only an event subscriber (beta.6).

**Labels:** `type:feat`, `area:fresh-ui`, `area:plugins`, `epic:dev-dashboard`, `priority:p1`, `wave:v1`, `status:plan`. Milestone `0.0.1-beta.6`.

**V2 management-loop addendum (append to body scope):**
> **Manage (P2, Appwrite loop):** complete the workers loop — *act:* trigger-now ✅ (in scope above), **rerun a failed execution** and **cancel a running one** where the 21-route contract exposes it (verify route coverage; missing verbs are explicit gaps, not new backend), enable/disable a job via the S3 override topic (cross-link, same write route); *configure:* a per-job settings tab (schedule + active overrides, read from S3 topics — configuration in tabs, never inline in the list); *create:* "New job from template" entry appears once #432 lands (beta.7), hidden until then. All mutations: confirm + CLI-equivalent CodeBlock.

---

## #429 — DDX-18b: Sagas Console — **REWRITE**

**Rationale:** Archetypal complementary capability (`compensating` exists nowhere else). Rewrite as S8.

**Replacement body:**

> ## DDX-18b / S8: Sagas Console
>
> ### Summary
> Saga instance + transition/compensation console — `compensating` is a status no other tool has a concept of.
>
> ### DX thesis
> "This saga is on step 3 of 5, compensating step 2, retried once" — Aspire (black-box process) and Scalar (static schema) can't express it.
>
> ### Scope
> - Instance `data-table` (status badge incl. `compensating→warning`, durability tier; `GET /instances` shipped).
> - Per-instance transition/compensation timeline (`ns-step-timeline` rendering the from→to state machine; `GET /.../history` → `SagaTransitionRecord` shipped).
> - `activity-feed` of transitions.
>
> ### Non-goals
> - No owned span waterfall (out-link to S6/Aspire trace). Do not design around `IInteractionService` (confirmed absent from TS AppHost SDK) for future replay — use `withCommand` `arguments` + `confirmationMessage`.
>
> ### Acceptance criteria
> - Instances render with `compensating` state; timeline renders the from→to machine.
> - Deep-link → S6/Aspire trace for underlying spans.
> - Outbox/idempotency/retry views explicitly deferred (not yet wired).
>
> ### Dependencies
> #419, #423 (`/_netscript/sagas`), #413 (trace out-link).

**Labels:** `type:feat`, `area:fresh-ui`, `area:plugins`, `epic:dev-dashboard`, `priority:p1`, `wave:v1`, `status:plan`. Milestone `0.0.1-beta.6`.

**V2 management-loop addendum (append to body scope):**
> **Manage (P2):** *act:* gated **replay / compensate-now** actions on a stuck instance — only if the saga contract already exposes the mutation (verify; if port-only, flag as a thin co-req like the DLQ routes, do not invent a write path); Inngest's rerun-from-step is the precedent, deferred to stable as noted. *Configure:* store-backend + durability view stays read-only. *Create:* "New saga from template" via #432 (beta.7). All mutations: confirm + CLI-equivalent.

---

## #430 — DDX-18c: Triggers Console — **REWRITE**

**Rationale:** Complementary; control actions with immediate feedback no other tool offers. Rewrite as S9 (history/enable-disable/preview/webhook-test; DLQ gated on co-req API).

**Replacement body:**

> ## DDX-18c / S9: Triggers Console
>
> ### Summary
> Firing history + control actions for the triggers primitive, including file-watch (`WatchEvent`) folded in as the file-watch trigger view.
>
> ### DX thesis
> "When does this cron actually next fire given tz + backfill, and let me silence a misbehaving trigger without redeploy."
>
> ### Scope
> - Firing-history `activity-feed` (live SSE; `TriggerEvent` kinds scheduled/webhook/file-watch/queue/stream/manual; `GET /events*` + `/events/subscribe` shipped).
> - Enable/disable toggle per trigger (mutating; `POST .../enable|disable` shipped) + CLI-equivalent CodeBlock + immediate feedback.
> - Schedule-preview panel (`computeNextFireTimes`, `GET .../preview` shipped).
> - Webhook test-delivery form (`POST /webhooks/{id}/test` shipped) — ingress simulation, distinct from Scalar's app-route try-it.
> - DLQ panel **gated** on the co-requisite `TriggerDlqPort` contract route.
>
> ### Non-goals
> - Webhook test ≠ Scalar try-it (it simulates trigger ingress, not an app API call). No log/trace ownership (out-link).
>
> ### Acceptance criteria
> - History/enable-disable/preview/webhook-test all functional from shipped contracts.
> - Enable/disable shows CLI-equivalent + immediate state feedback.
> - DLQ tab renders only once the co-req route exists; otherwise hidden/`plugin-gated`.
>
> ### Dependencies
> #419, #423 (`/_netscript/triggers`), co-req: `TriggerDlqPort` contract route (filed separately). DLQ = later.

**Labels:** `type:feat`, `area:fresh-ui`, `area:plugins`, `epic:dev-dashboard`, `priority:p1`, `wave:v1`, `status:plan`. Milestone `0.0.1-beta.6`.

**V2 management-loop addendum (append to body scope):**
> **Manage (P2):** S9 was already the most manage-shaped v1 screen (enable/disable + webhook-test + preview all shipped) — it is the reference for the loop on the other consoles. v2 adds only: *create:* "New trigger from template" via #432 (beta.7); *configure:* schedule/webhook settings as a per-trigger tab rather than inline rows.

---

## #431 — DDX-18d: Streams Console — **REWRITE**

**Rationale:** Complementary (fan-out/delivery state); rewrite as S10 with the caveat to verify contract state before committing to beta.6.

**Replacement body:**

> ## DDX-18d / S10: Streams Console
>
> ### Summary
> Stream fan-out / delivery state as NetScript-primitive run-state — which subscribers received a message, delivery attempts — invisible to Aspire/Scalar. Streams is the tail of the flagship run (HTTP→workers→callback→stream fan-out).
>
> ### Scope
> - Delivery `activity-feed`; fan-out `ns-step-timeline` (per-subscriber delivery status/attempt); subscriber wiring pulled from the S2 graph.
> - Folds any stream-side watcher/delivery events.
>
> ### Non-goals
> - No trace waterfall / log tail ownership (out-link to Aspire).
>
> ### Acceptance criteria
> - **Verify contract state first:** confirm a delivery/fan-out read-model exists before committing to beta.6; if absent, ship fast-follow. Lowest-shipped of the four capabilities.
> - Deep-links: → S6 (streams as run tail), → Aspire trace.
>
> ### Dependencies
> #419, #423, #416/S2 (subscriber wiring). **Wave:** beta.6 if a delivery read-model exists; else `wave:defer` fast-follow.

**Labels:** `type:feat`, `area:fresh-ui`, `area:plugins`, `epic:dev-dashboard`, `priority:p2`, `wave:v1`, `status:plan`. Milestone `0.0.1-beta.6` (downgrade to fast-follow if contract missing). **Label change:** flag `priority:p2` (contract-state risk).

**V2 management-loop addendum (append to body scope):**
> **Manage (P2):** *act:* gated **redeliver-to-subscriber** where the delivery read-model + a redeliver route exist (same verification gate as the read-model itself; port-only = co-req flag, no invented write path); *create:* "New stream topic from template" via #432 (beta.7). Confirm + CLI-equivalent on every mutation.

---

## #432 — DDX-19: Codegen-from-UI "Add resource" action — **REWRITE (elevate to beta.7 management keystone)** *(v2: was KEEP-defer in v1)*

**Rationale (v2):** The owner amendment + the Strapi gold conclusion make this the **keystone of the management pillar**, not a nice-to-have: Strapi's Content-Type Builder proves dashboard-and-CLI-as-two-callers-of-one-generator is the pattern that makes a framework console feel like Appwrite. Every capability console's "create" cell (S5/S7–S10 template-gallery entries) lands here. Recommend promoting `wave:defer`/stable → **beta.7** (owner decision D5 in `ratification-summary.md`); scope stays exactly the one-generator law.

**Body addendum (replaces the v1 tightening addendum):**
> **V2 elevation (management keystone).** This issue is the single "create" seam for every capability console: S5 "Add plugin/Scaffold resource", S7 "New job", S8 "New saga", S9 "New trigger", S10 "New topic" — all template-gallery entries (Appwrite Functions precedent) that invoke the same `createPluginAdapter(...).toScaffold()` machinery the CLI installer uses (**one generator, two callers**, per the #157 typesafe-codegen mandate). Non-goals: does not fork the scaffolder; no string templates; generated files identical whether triggered from `netscript plugin add`/`generate` or the dashboard button (Strapi parity bar). Acceptance: a dashboard-scaffolded resource is byte-identical to the CLI-scaffolded one and the action renders its CLI-equivalent line. Future convergence (separate, stays defer): in-dashboard AI driving this same seam (`@netscript/plugin-ai` #238 — Strapi AI's chat/design-import/code-analysis triad).

**Labels:** `type:feat`, `area:plugins`, `area:cli`, `epic:dev-dashboard`, `priority:p2` (raised from p3), **wave: owner decision** — recommended `wave:v1`-next cut (beta.7; milestone to match) instead of `0.0.1-stable`.

---

## #507 — feat(design): Dev Dashboard E2E Claude Design prototype + design-sync — **REWRITE**

**Rationale:** The right venue to catch duplication before implementation. Rewrite the prototype scope from the old 7-panel set to the **rescoped S1–S12 screen set**, and make "no duplicated Aspire/Scalar surface" an explicit design-review gate.

**Replacement body:**

> ## feat(design): Dev Dashboard rescoped-screen E2E prototype + design-sync system
>
> ### Summary
> Design-only pre-step: `tools/design-sync/` (fresh-ui → Claude Design canvas converter) + a full E2E prototype of the **rescoped** screen set (S1–S10 core + S11/S12 later-wave shells), light/dark, at 100% fresh-ui parity. No `packages/`/`plugins/` source changes.
>
> ### Scope
> - Prototype: S1 shell, S2 config/topology wiring graph, **S3 runtime-config monitor**, S4 catalog (provenance, no try-it), S5 plugin control, S6 run inspector (no owned waterfall), S7–S10 capability consoles.
> - Design-sync system (emit `_ns_runtime.js`/`_ns_styles.css`; **never** `_ds_*` names — canvas clobbers those).
>
> ### Non-goals (design-review gate)
> - The prototype must **not** design any owned trace-waterfall, log tail, metrics chart, resource start/stop panel, or Scalar-style try-it/operation list. Each screen must visually answer "why isn't this a deep-link to Aspire/Scalar?" This run is where duplication is caught before DDX-implementation starts.
>
> ### Acceptance criteria
> - All rescoped screens prototyped; every hand-off point renders as an out-link affordance (Aspire/Scalar), not a rebuilt surface.
> - Design-review sign-off records the NetScript-only justification per screen.
>
> ### Dependencies
> #509 (fresh-ui quality), #410 (L3 blocks). Feeds all DDX implementation slices.

**Labels:** `type:chore`, `area:fresh-ui`, `area:tooling`, `epic:dev-dashboard`, `priority:p1`, `wave:v1`, one `status:` (keep current). Milestone `0.0.1-beta.6`.

---

## #509 — fresh-ui: registry-wide pixel-perfect UI revamp — **KEEP-AS-IS**

**Rationale:** Pure `packages/fresh-ui` component-quality work (skeleton fix, missing defaults, responsive/mobile, dark contrast, code-block syntax layer); unrelated to Aspire/Scalar scope. Keep. Labels: `type:feat`, `area:fresh-ui`, `epic:dev-dashboard`, `priority:p2`, `wave:v1`, one `status:`. Milestone `0.0.1-beta.6`.

---

# NEW ISSUES TO FILE

## NEW #TBD — DDX-20 / S3: Runtime-Config Monitor & Control ⚑ flagship *(v2: + gated write-back)*

**Rationale:** Highest-value, cheapest, most-differentiated surface (pain 5); the live override layer Aspire (infra) and Scalar (spec) can never know exists; the watcher already exists. **v2:** the management pillar makes this read-*write* — flipping a flag / disabling a job from the UI is the purest Appwrite-loop expression of "the dashboard drives the framework," and it uses the same override store the CLI/config sources feed.

**Body:**

> ## DDX-20 / S3: Runtime-Config Monitor (flagship)
>
> ### Summary
> A live view of the runtime override layer: someone just flipped feature flag `checkout-v2` to 30% rollout / disabled job `nightly-reconcile`. Pipes the existing `runtime-config/application/watcher.ts` change events into a dashboard SSE feed.
>
> ### DX thesis
> The override layer is invisible to both Aspire and Scalar; NetScript's watcher already hot-reloads it but only emits console scrollback. Surfacing it is nearly free.
>
> ### Scope
> - Live `activity-feed` (generalized, non-chat) of override changes with `data-tone` by kind.
> - Current-state `stats-grid` per topic (active flags, disabled jobs/sagas/triggers, task overrides).
> - `ns-step-timeline`-shaped version history of the `current` pointer (diff between versions: All/Compact/JSON).
> - Follow switch on the SSE tail.
> - **Write-back (v2, gated):** flip a feature flag, disable/enable a job/saga/trigger, clear a task override — from the UI, behind `confirmationMessage` + CLI-equivalent CodeBlock. **Scope condition:** ships in beta.6 only if the runtime-config store already exposes set/unset use-cases the watcher reads (verify first); if the write path is port-only, file it as a thin co-req mutation route (same pattern as the DLQ co-reqs) and ship the read surface without waiting.
> - Data: existing watcher over 5 topics + versioned `current` pointer, piped to `/_netscript/config/runtime/subscribe` (SSE) — no new backend for the read path.
>
> ### Non-goals
> - Not Aspire config/env display (that's infra config); this is NetScript runtime *overrides*. Writes never bypass the store the watcher observes — a dashboard write must round-trip as a watcher change event (one write path, observed like any other).
>
> ### Acceptance criteria
> - Flipping an override emits a live SSE event that renders in the feed; per-topic current state accurate; version diff renders.
> - If write-back ships: a UI flag-flip lands in the store, hot-reloads via the watcher, and appears in the feed as a normal change event with its CLI-equivalent recorded.
> - Deep-link: disabled entity → its capability console (S7–S10); in ← S1 stat card.
>
> ### Dependencies
> #423 (`/_netscript/config/runtime` + SSE). Watcher already exists. Write-back: runtime-config mutation route (in-scope if store use-cases exist; else co-req).

**Labels:** `type:feat`, `area:config`, `area:fresh-ui`, `area:plugins`, `epic:dev-dashboard`, `priority:p1`, `wave:v1`, `status:triage`. Milestone `0.0.1-beta.6`.

---

## NEW #TBD — DDX-21 / S11: DB Migrations & Drift

**Rationale:** Aspire shows the DB resource is up, never migration state (pain 4, frequent "why is my query failing" root cause); cheap (call existing `db status` use-case from a dashboard read API). No pass-1 home.

**Body:**

> ## DDX-21 / S11: DB Migrations & Drift
>
> ### Summary
> "Which migrations are pending vs applied, and has the schema drifted" — a panel over the existing `db status` use-case exposed via `/_netscript/db/status`.
>
> ### DX thesis
> Aspire shows the DB *resource* is up; it never shows migration state or schema drift.
>
> ### Scope
> - Migration `data-table` (applied/pending); drift `alert`; introspect diff as CodeBlock.
> - "Run migrate" and **"Run seed" (v2)** actions with CLI-equivalent (`netscript db ...`), confirm-gated — the db cells of the P2 management loop.
> - Data: Prisma migration status/introspect/drift (CLI `db status` today).
>
> ### Non-goals
> - No DB resource lifecycle/health (Aspire DB resource, `WithUrl` out-link). No query console.
>
> ### Acceptance criteria
> - Applied/pending migrations render; drift alert fires when schema drifts; introspect diff renders.
> - Deep-link → Aspire DB resource.
>
> ### Dependencies
> `/_netscript/db/status` read API (#423). **Wave:** beta.6 if the read API is trivial; else fast-follow. Note the db-init Prisma 7.x transient flake (re-run clears).

**Labels:** `type:feat`, `area:database`, `area:fresh-ui`, `area:plugins`, `epic:dev-dashboard`, `priority:p2`, `wave:v1`, `status:triage`. Milestone `0.0.1-beta.6`.

---

## NEW #TBD — DDX-22 / S12: Dead-Letter Queues (queue + trigger)

**Rationale:** Pain 4; both DLQ surfaces are currently port-only with no contract — panels are stranded without an API. File with co-req API issues; ship the thin contract slice before the panel.

**Body:**

> ## DDX-22 / S12: Dead-Letter Queues (queue + trigger)
>
> ### Summary
> "Why did messages die across KV/Redis/Postgres, show depth, let me bulk-replay." Consolidated DLQ view for the queue and trigger dead-letter surfaces.
>
> ### Scope
> - DLQ depth `stats-grid` per backend; failed-message `data-table` with reason; bulk `reprocess()` action + CLI-equivalent + `confirmationMessage`.
> - Data: `DeadLetterRecord` (reason/errorCode/payload), `depth()`, `reprocess()`; `TriggerDlqPort` (reason/attempts/replay).
>
> ### Non-goals
> - No log/trace ownership (out-link). No panel ships before its contract route exists.
>
> ### Acceptance criteria
> - Renders only once both co-req contract routes exist; bulk replay gated behind confirm.
> - In ← S9 Triggers DLQ tab; in ← S7 for queue-backed workers.
>
> ### Dependencies (BLOCKING — file co-req issues now)
> (a) `TriggerDlqPort` contract route; (b) `packages/queue` `DeadLetterStore` CLI/API. **Wave:** later.

**Labels:** `type:feat`, `area:queue`(→ use `area:service` if `area:queue` absent), `area:fresh-ui`, `area:plugins`, `epic:dev-dashboard`, `priority:p2`, `wave:defer`, `status:triage`. Milestone `Backlog / Triage`. **Label note:** no `area:queue` in taxonomy — use `area:service` + add `area:queue` to `labels.yml` first if desired.

---

## NEW #TBD — co-req: `TriggerDlqPort` contract route

**Rationale:** DLQ trigger panel (S9 tab / S12) is stranded without an oRPC contract route over `TriggerDlqPort`. Thin contract slice, ship before the panel.

**Body:**

> ## feat(triggers): `TriggerDlqPort` contract route
>
> ### Summary
> Expose the existing port-only `TriggerDlqPort` (reason/attempts/replay) as a thin oRPC contract route under `/_netscript/triggers/dlq*` so the dashboard DLQ tab has an API.
>
> ### Scope
> Contract-first: define the schema/type contract, then the route binding over the existing port. Read (list/depth) + gated replay mutation.
>
> ### Non-goals
> No UI (that's DDX-22/S9). No new DLQ storage logic — wrap the existing port.
>
> ### Acceptance criteria
> Route serves DLQ entries + depth; replay mutation gated. `deno check --unstable-kv` green.
>
> ### Dependencies
> Blocks DDX-22 #TBD and the S9 DLQ tab (#430).

**Labels:** `type:feat`, `area:service`, `epic:dev-dashboard`, `priority:p2`, `wave:defer`, `status:triage`. Milestone `Backlog / Triage`.

---

## NEW #TBD — co-req: `packages/queue` `DeadLetterStore` CLI/API

**Rationale:** Queue DLQ surface is port-only; no CLI/API means the S12 queue DLQ panel is stranded. Thin slice, ship before the panel.

**Body:**

> ## feat(queue): `DeadLetterStore` CLI + contract API
>
> ### Summary
> Expose `packages/queue`'s port-only `DeadLetterStore` (`DeadLetterRecord`, `depth()`, `reprocess()`) via a CLI command + a thin contract route under `/_netscript/queue/dlq*`.
>
> ### Scope
> Contract-first schema; route + CLI over the existing store. Read (list/depth) + gated bulk `reprocess()`.
>
> ### Non-goals
> No UI (DDX-22/S12). Wrap the existing store; no new persistence.
>
> ### Acceptance criteria
> CLI lists DLQ depth + entries; contract route serves the same; bulk reprocess gated + CLI-equivalent. Green `deno check`.
>
> ### Dependencies
> Blocks DDX-22 #TBD (S12 queue DLQ).

**Labels:** `type:feat`, `area:service`, `area:cli`, `epic:dev-dashboard`, `priority:p2`, `wave:defer`, `status:triage`. Milestone `Backlog / Triage`.

---

## NEW #TBD — DDX-23: co-req — seam-event flow plane (unified envelope + HTTP boundary events) *(v2)*

**Rationale:** S13 Live Flow ships at beta.6 in correlation-join fidelity (existing per-primitive streams joined on `traceparent` — no new instrumentation). This co-req is the beta.7 fidelity upgrade: a unified seam-event envelope so flows are first-class instead of reconstructed, and HTTP request ingress/egress boundary events so a flow starts at the route boundary rather than the first primitive event. Framework-source work → **WSL Codex slice**, never the docs/design lane.

**Body:**

> ## feat(telemetry): seam-event flow plane — unified envelope + HTTP boundary events
>
> ### Summary
> Emit a uniform seam event at each framework boundary a request crosses — HTTP ingress/egress, contract procedure invoke/return, job enqueue/complete, saga transition, stream publish/delivery — onto an owned in-process bus exposed at `/_netscript/flows/subscribe` (SSE), keyed by the stamped `traceparent`.
>
> ### Scope
> - Envelope (contract-first): `{ flowId (traceparent), seam, primitive, name, phase: start|end|error, payloadRef, attempt?, ts }` — reuses the #402 TC-1..14 attribute vocabulary; no parallel naming.
> - Emitters piggyback on the existing lifecycle event points (execution events, saga history, trigger events, stream deliveries) + new HTTP boundary hooks at the router seam.
> - Replaces the beta.6 join-layer in `/_netscript/flows` (#423) transparently — same SSE shape, higher fidelity.
>
> ### Non-goals
> - Not OTLP; not an exporter; never proxied from `/api/telemetry/*` (#413 stays correlation-only). No UI (that's S13/#418). No durable storage beyond a bounded ring buffer (dev-time surface).
>
> ### Acceptance criteria
> - One scaffold-app HTTP request yields a complete ordered seam-event chain incl. the HTTP boundary; S13 renders it with zero join heuristics.
> - `deno check --unstable-kv` green; TC vocabulary lint clean.
>
> ### Dependencies
> #408 (traceparent stamping), #423 (mount), feeds #418/S13. Co-lands sensibly with `epic:telemetry-revamp`.

**Labels:** `type:feat`, `area:telemetry`, `area:service`, `epic:dev-dashboard`, `priority:p2`, `wave:defer` (recommend pulling to beta.7 with #432), `status:triage`. Milestone `Backlog / Triage` (or beta.7 milestone if pulled).

---

# Summary of dispositions

| # | Handle | Verdict |
|---|---|---|
| 400 | epic | **REWRITE** (non-dup acceptance line; no closing keyword) |
| 408 | T7 query | KEEP (tighten non-goals) |
| 410 | DDX-0 fresh-ui L3 | KEEP |
| 411 | DDX-1 aspire kinds | **REWRITE** (Seam A: command+app) |
| 412 | DDX-2 core scaffold | **REWRITE** (demote TraceTree) |
| 413 | DDX-3 query port | **REWRITE** (correlation-only) |
| 414 | DDX-4 thin plugin | KEEP |
| 415 | DDX-5 shell | **REWRITE** (S1) |
| 416 | DDX-6 stack map | **REWRITE** (S2 wiring graph) |
| 417 | DDX-7 catalog | **REWRITE** (S4, kill try-it) |
| 418 | DDX-8 waterfall → Live Flow | **REWRITE** (v2: S13 seam-flow journey; waterfall scope stays dead) |
| 419 | DDX-9 run inspector | **REWRITE** (S6 run-centric; cross-links S13) |
| 420 | DDX-10 plugin control | **REWRITE** (S5 elevate + v2 manage loop) |
| 421 | DDX-11 logs | **CLOSE** (Aspire deep-link) |
| 422 | DDX-12 resource control | **CLOSE** (→ withCommand/#411) |
| 423 | DDX-13 introspection | **REWRITE** (owned `/_netscript/*` plane) |
| 424 | DDX-14 CLI | **REWRITE** (deep-link surface + generator emit) |
| 425 | DDX-15 design-sync | **CLOSE** (superseded by #507) |
| 426 | DDX-16 E2E smoke | **REWRITE** (no-waterfall assertions) |
| 427 | DDX-17 panel seam | KEEP (tighten) |
| 428 | DDX-18a workers | **REWRITE** (S7 + scheduler drift + v2 manage loop) |
| 429 | DDX-18b sagas | **REWRITE** (S8 + v2 gated replay) |
| 430 | DDX-18c triggers | **REWRITE** (S9, DLQ gated; v2 loop reference) |
| 431 | DDX-18d streams | **REWRITE** (S10, verify contract; v2 gated redeliver) |
| 432 | DDX-19 codegen-from-UI | **REWRITE** (v2: elevate — beta.7 management keystone, owner decision D5) |
| 507 | design prototype | **REWRITE** (rescoped screens S1–S13 + dup gate) |
| 509 | fresh-ui revamp | KEEP |
| NEW | DDX-20 Runtime-Config Monitor & Control (S3) ⚑ | FILE (beta.6 flagship; v2 + gated write-back) |
| NEW | DDX-21 DB Migrations & Drift (S11) | FILE (beta.6-if-cheap) |
| NEW | DDX-22 DLQ (S12) | FILE (wave:defer) |
| NEW | DDX-23 seam-event flow plane | FILE (v2 co-req; recommend beta.7) |
| NEW | co-req `TriggerDlqPort` route | FILE (wave:defer) |
| NEW | co-req queue `DeadLetterStore` CLI/API | FILE (wave:defer) |

**Kills documented so they don't creep back:** raw OTLP trace-waterfall / span-bar gantt (Aspire Traces — note v2: #418 survives only as the S13 seam-flow journey, which must never grow span bars), logs tail (Aspire Structured/Console Logs), metrics charts (Aspire Metrics), resource start/stop panel (Aspire Actions), Scalar-style try-it/operation list (Scalar `/api/docs`), service `/health` panel (→ Aspire State column via `withHealthCheck()`). **Taxonomy gaps noted for `labels.yml` before use:** `area:queue`, `area:workers`/`area:sagas`/`area:triggers`/`area:streams`, and a specific dashboard area label do not exist — dashboard slices reuse `area:plugins`/`area:fresh-ui`/`area:aspire`/`area:cli`/`area:config`/`area:service`/`area:database` + `epic:dev-dashboard`. Every open issue carries exactly one `status:`.