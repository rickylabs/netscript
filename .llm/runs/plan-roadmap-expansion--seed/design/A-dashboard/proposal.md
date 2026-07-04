# Topic A — NetScript Dev Dashboard — Design Proposal (Opus 4.8 deep-dive)

> Depth layer. Builds on the Stage-B corpus (cited inline as `A/NN`, `B/…`, `ctx/…`) and the
> Stage-C synthesis working positions. Planning only; no framework code, no GitHub mutations.
> **Headline verdict up front, evidence below.**

## 0. Locked design headline

- **Archetype:** thin `plugins/dashboard` (ARCHETYPE-5) + fat `packages/plugin-dashboard-core`
  (ARCHETYPE-2 integration core), modeled on the `streams` / `plugin-streams-core` analog, not
  `workers`. The dashboard is a **read / aggregation / UI-serving** surface — no background
  processor, no owned DB schema at beta.6.
- **`plugin add dashboard` needs NO CLI change.** The public JSR-install path dynamically registers
  `provider.kind: 'dashboard'` from the plugin's own `scaffold.plugin.json` (`A/04 §4`). Cost is a
  correct manifest + `scaffold.ts` + an `officialSource` block for the repo E2E suite.
- **Two Aspire seams reconciled by EXTENDING Seam A** (`@netscript/aspire`): add a `command` kind
  (hard beta.6) and an `app` kind (preferred beta.6, Seam-B fallback) to `AspireResourceKind` +
  `AspireBuilder` port, so the dashboard registers its Fresh UI **and** contributes `withCommand`
  actions through `contribute()` — making "the tool that controls your plugins is itself a plugin"
  true for its Aspire presence, not just its CLI. **No `IInteractionService`** (A2): all interactive
  prompts route through command `arguments` (`InteractionInput[]`) + `confirmationMessage`.
- **Panel IA — reframed (see §9):** NOT 7 fixed panels but **cross-cutting panels** (Stack Map ·
  Service Catalog + API Explorer · Flow/Trace Waterfall · Run Inspector · Logs · Resource Control)
  **+ per-capability plugin sections** (one per installed plugin category — workers/sagas/triggers/
  streams/auth/…), each following Appwrite's **create → configure(tabs) → monitor** loop, rendered
  through a contribution seam. Plugin Control becomes the host/registry/overview, not a flat list.
- **`.withDashboardPanel` verdict:** ADOPT as a **contribution-contract seam** in
  `plugin-dashboard-core` (Directus Panel/Module precedent) so the dashboard is a **panel/L3-block
  registry consumer** other plugins contribute to, not just an author. Realized as a
  `DashboardPanelContribution` contract discovered like `AspireNSPluginContribution` (thinness-
  correct — keeps `@netscript/plugin` dashboard-agnostic), with optional `.withDashboardPanel()`
  sugar over it. **beta.6 = the seam + first-party sections (dogfooded); stable = third-party
  ecosystem + marketplace.**
- **Codegen-from-UI / AI edges:** a dashboard "Add resource" action calls the SAME
  `createPluginAdapter(...).toScaffold()` the CLI drives (Strapi precedent; #157-safe) — stable
  (beta.6 stretch if cheap); AI-on-codegen converges with flagship AI plugin **#238** (cross-epic
  edge, stable), not net-new dashboard scope. Schema-driven `db` tab off Prisma-Next = stable/
  deferred.
- **Telemetry data contract:** beta.6 consumes Aspire `/api/telemetry/*` HTTP (OTLP-JSON) behind a
  `TelemetryQueryPort` in core; the port is the swap seam onto Topic-B's query/export surface.
- **D-NSONE verdict:** **promote the missing L3 `blocks/` layer into `@netscript/fresh-ui`**;
  do NOT re-import L0–L2 (already byte-identical copy-source output); **MCP components OUT** of the
  general registry for beta.6. Precursor = one WSL Codex fresh-ui slice, ~1 week, sequenced before
  the UI panels.
- **MANDATORY Claude design-sync** replicated for the dashboard as a `.design-sync/` artifact +
  panel prototype, per eis-chat.

---

## 1. Plugin archetype — thin `plugins/dashboard` + `packages/plugin-dashboard-core`

### 1.1 Why the `streams` analog, not `workers`

`A/04 §1b` establishes `streams` as the closer reference: no background processors, no DB schema,
no contract versions, no runtime-config topics — `definePlugin(...).withType('utility')` + a single
service + telemetry. The paired `plugin-streams-core` is correspondingly small (`application`,
`builders`, `diagnostics`, `domain`, `ports`, `public`, `telemetry`, `testing`). A dashboard is
likewise a read/UI surface. It adds two axes `streams` does not need day-one: `.withService(...)`
(serve the Fresh build-console) and `.withAspire(...)` (the extension seam, §2). It does **not**
need `.withBackgroundProcessor(...)` or `.withDbSchemas(...)` at beta.6.

Confirmed on disk: `plugins/streams/scaffold.plugin.json` has `provider.kind: 'stream'`,
`category: 'plugin'`, `portRangeKey: 'PLUGIN_API'`, `pluginType: 'utility'`, `defaultRequiresDb/Kv:
false`, plus an `officialSource` block (canonicalName/pluginDir/serviceEntrypoint/servicePort). The
dashboard manifest is a near-copy with `provider.kind: 'dashboard'`.

### 1.2 What lives in core vs the thin plugin (thinness/core-centralization law)

The law (`A/04 §3`; MEMORY plugin-thinness): convention-bearing primitives and domain logic live in
`@netscript/*` core; the `plugins/*` package is thin userland glue. **Every dashboard-specific
domain model, data-source adapter, panel-orchestration use-case, and the oRPC contract belongs in
`packages/plugin-dashboard-core`.** `plugins/dashboard` owns only: the `definePlugin` manifest, the
Fresh UI (routes/islands = the build-console), the scaffold adapter, the Aspire contribution wiring,
and a contract re-export. Flagship bar still applies — thin ≠ lower quality (`specs/topic-A §2`).

```
packages/plugin-dashboard-core/            # FAT — ARCHETYPE-2 (integration core)
  src/
    domain/          ResourceGraph, ResourceNode, PanelDescriptor, RunRecord, TraceTree,
                     TraceSpan, LogRecord, ContractCatalogEntry (no impl imports; A8/A1)
    ports/           TelemetryQueryPort, AspireResourcePort, IntrospectionPort,
                     CommandInvokePort            # ports import domain only
    application/     panel orchestration use-cases: buildStackMap(), getTraceTree(),
                     listRuns(), loadCatalog(), streamLogs()  # imports domain + ports
    adapters/        aspire-otlp-http/   (TelemetryQueryPort impl — /api/telemetry/*)
                     aspire-mcp/         (AspireResourcePort via aspire MCP tools, optional)
                     netscript-graph/    (AspireResourcePort via AspireResource[] compose graph)
                     command-invoke/     (CommandInvokePort → Aspire ResourceCommandService)
    contracts/v1/    mod.ts  — DashboardContract (extends BasePluginContract), oRPC ContractProcedures
    telemetry/       self-instrumentation of the dashboard (flagship bar)
    public/mod.ts    package public surface
    testing/
  tests/contracts/dashboard-contract-base-seam_test.ts   # soundness test (mirrors workers-core)

plugins/dashboard/                          # THIN — ARCHETYPE-5
  mod.ts                # one-line re-export of dashboardPlugin (doctrine small-mod.ts)
  README.md  deno.json  cli.ts  verify-plugin.ts
  scaffold.ts           # createPluginAdapter(dashboardAdapterPlugin).toScaffold()
  scaffold.plugin.json  # provider.kind: 'dashboard', officialSource block
  contracts/v1/mod.ts   # re-export from plugin-dashboard-core — NO local redefinition
  services/src/main.ts  # serves the Fresh build-console UI + oRPC dashboard routes
  src/
    public/mod.ts       # definePlugin('@netscript/plugin-dashboard', VERSION)...withService...withAspire...build()
    adapter/plugin.ts   # NetScriptPlugin adapter (install/doctor/info/update/remove)
    adapter/resources/  # typesafe starter-resource scaffolders (#157 mandate: codegen, not templates)
    aspire/mod.ts       # AspireNSPluginContribution subclass (app + command kinds — §2)
    ui/                 # Fresh routes + islands (the build-console) built on @netscript/fresh-ui
  tests/
  .design-sync/         # MANDATORY Claude design-sync artifact (§7)
```

Folder vocabulary is doctrine-clean (`domain/ports/application/adapters/public/testing`); the
harness-authoritative top-level-sibling layout for `contracts/`, `services/` matches `streams`
on disk (`A/04 §3`; ARCHETYPE-5 vs doctrine-text nesting divergence tracked under #305/#306 — the
dashboard follows the **harness-observed** layout, which is what the CLI scaffolder emits).

### 1.3 The base oRPC `ContractProcedure` contract seam

`A/04 §2` verified `packages/plugin/src/contract-base/domain/base-contract.ts`:
`BasePluginContract` requires `readonly describe: BasePluginDescribeProcedure` (a genuine oRPC
`ContractProcedure<any, Schema<unknown, PluginCapabilities>, ErrorMap, Meta>` — the **sound**
version of the seam, not the phantom-typed one in the `plugin-service-type-unsoundness` memory) plus
an index signature `[route: string]: AnyContractRouter`.

`DashboardContract` (in `plugin-dashboard-core/contracts/v1/mod.ts`) **extends the base contract**,
adding read/command routes as oRPC contract procedures (`oc.route(...).output(<StandardSchema>)`):

| Route | Method / path | Output schema | Panel |
|---|---|---|---|
| `describe` | `GET /describe` | `PluginCapabilitiesSchema` (base) | — |
| `resources` | `GET /resources` | `ResourceGraphSchema` | Stack Map |
| `catalog` | `GET /catalog` | `ContractCatalogSchema` | Service Catalog |
| `introspection` | `GET /_netscript/introspection` | `IntrospectionSchema` | Catalog/Map |
| `traces` | `GET /telemetry/traces` | `TraceListSchema` | Flow/Trace |
| `traceById` | `GET /telemetry/traces/{traceId}` | `TraceTreeSchema` | Flow/Trace |
| `logs` | `GET /telemetry/logs` (`?follow`) | `LogPageSchema` | Logs |
| `runs` | `GET /runs` | `RunListSchema` | Run Inspector |
| `runById` | `GET /runs/{runId}` | `RunDetailSchema` | Run Inspector |
| `invokeCommand` | `POST /commands/{name}` | `CommandResultSchema` | Plugin/Resource Control |

Contract-first per AGENTS Operating Rule 2. The soundness test mirrors
`workers-core/tests/contracts/workers-contract-{base-seam,soundness}_test.ts` and is a hard
E2E-type-soundness gate (MEMORY e2e-type-soundness-non-negotiable — only the 2 accepted casts).

### 1.4 `plugin add dashboard` — confirmed no CLI change

`A/04 §4` read the installer in full. The public JSR path
(`packages/cli/src/public/features/plugins/install/install-plugin.ts`) resolves the package, reads
its `scaffold.plugin.json`, and **dynamically registers the provider `kind` into
`PluginKindRegistry` at install time**, then dispatches the plugin's own scaffolder. A brand-new
kind `'dashboard'` is installable via `netscript plugin install @netscript/plugin-dashboard` (or a
`jsr:` spec) with **no installer core change**. Post-scaffold workspace wiring
(`copyPluginSchemasToRootDb`, `ensureNetScriptConfigPlugin`, `regenerateAspireHelpers`, …) runs for
free. Two low-cost, non-blocking follow-ons: (a) an optional `--kind dashboard` /
`BARE_PLUGIN_PACKAGE_ALIASES` shortcut string; (b) an `officialSource` block so the dashboard joins
the repo's `scaffold.runtime` E2E suite alongside workers/sagas/triggers/streams. **This validates
D2 as architecturally cheap.**

---

## 2. The two Aspire surfaces reconciled

### 2.1 The gap (verified, load-bearing)

`A/02 §3` + `ctx/02` establish the two seams are structurally independent today:

- **Seam A — plugin-contribution** (`@netscript/aspire`): every plugin's Aspire integration extends
  `AspireNSPluginContribution` and returns `AspireResource[]` from `contribute()`. But
  `AspireResourceKind` is a **closed union** (`deno-service | deno-background | container | database
  | cache`) — **no `app`, no `command`** — and the `AspireBuilder` port exposes no
  `addExecutable`/`withCommand`. `grep WithCommand packages/aspire` → zero matches.
- **Seam B — app-registration** (`register-apps.mts`, generated from `appsettings.json`): calls the
  **raw Aspire SDK** — `builder.addExecutable(name,'deno',workdir,['task',…])` +
  `withHttpEndpoint` + `withOtlpExporter` + `withBrowserLogs` (the landed half of #218, `A/05`).
  `withCommand` is reachable **only** here, and only by hand-editing a generated `.mts` file.

So a plugin that wants (a) its Fresh UI as an Aspire resource with an HTTP endpoint + browser-logs
and (b) `withCommand` actions can do **neither** through `contribute()` today.

### 2.2 Verdict: extend Seam A (command kind hard, app kind preferred)

I take the **extend-Seam-A** fork (`ctx/02 §1` option a / `A/02 §3` option 1) over the raw-SDK
escape hatch, and I disagree with treating it as merely "consistent with the law." It is **required
by the flagship dogfood thesis** (D2): "the tool that controls your plugins is itself a plugin"
is only literally true if the dashboard's own Aspire presence flows through the plugin-contribution
path. The raw-SDK `register-apps.mts` route would make the dashboard's Aspire integration a
hand-edited generator exception — the opposite of dogfooding. This is a `@netscript/aspire`
framework slice (WSL Codex), sized in DDX-1.

Phasing to de-risk co-landing:

- **`command` kind — HARD beta.6.** This is what "control the full stack" *means* (restart worker,
  clear cache, run migration, rerun-from-step). Add `'command'` to `AspireResourceKind`, an
  `addCommand(name, displayName, exec, options)` (and/or a `withCommand` passthrough on
  service/app resources) to the `AspireBuilder` port, and lower it in `composeAppHost()` to the raw
  SDK `withCommand(...)` call `register-apps.mts` proves works. Command visibility defaults UI+API,
  so every dashboard action is **also** an `aspire resource <name> <cmd>` CLI call and an MCP tool
  — "one seam, three surfaces" (`A/01 §1`, `ctx/02 §2`).
- **`app` kind — PREFERRED beta.6, Seam-B fallback.** Add `'app'` so the dashboard's Fresh UI is a
  plugin-contributed resource (`addExecutable` + `withHttpEndpoint` + `withBrowserLogs`). If the
  slice slips, **fall back to registering the dashboard UI as a normal `apps.dashboard` Seam-B
  entry** (exactly how eis-chat's `apps/dashboard` registers today, `A/01 §4`) — functional, but
  leaves the dogfold incomplete. The fallback is the risk valve, not the plan.

### 2.3 A2 — no `IInteractionService`, route through command `arguments`

`A/01 §2` + drift A2: `IInteractionService` is **not exposed in the TS AppHost SDK at any version**
(13.4.6 clears the `withCommand` half of the §5 gate but not the interaction-service half — it is a
language-surface gap, not a version gap). Aspire's own docs steer to command `arguments`. **Locked
design constraint:** every "are you sure?" / parameterized action is a `withCommand` with
`commandOptions.arguments: InteractionInput[]` + `confirmationMessage` — which renders the same
dashboard prompt dialog AND works from the CLI. Result notifications ride
`ExecuteCommandResult.message`/`data` (auto-surfaced in the dashboard notification center). No code
path may assume `PromptInputAsync` et al.

---

## 3. Panel IA (the Encore-dev equivalent)

> **Read with §9.** The BaaS/admin-console corpus (`A/04`) reframes this from "7 fixed panels" into
> **cross-cutting panels (this table) + per-capability plugin sections (§9)**. The table below is
> the cross-cutting set + the Plugin Control host; the per-capability create→configure→monitor
> sections are contributed (§9.1) and specified there. Panel 5 (Plugin Control) is revised in §9.1.

Grounded in the competitor teardown (`A/03`) + BaaS/admin corpus (`A/04`) and the candidate-panel
matrices (`matrix/A/_draft-competitor-rows{,-baas}.md`). Data sources ranked by reachability today
(`ctx/01`):
`OTLP/HTTP /api/telemetry/*` (open) → NetScript's own `AspireResource[]` compose graph (cheapest for
NS-native resources) → `aspire` MCP tools (structured, dev-only) → resource-service gRPC (internal,
avoid). Every panel: auto-launched, fixed port, live-updating, code/scaffold-derived (`A/03`
cross-tool conventions).

| # | Panel | Precedent | Data source (beta.6) | Key interactions | Milestone |
|---|---|---|---|---|---|
| 1 | **Stack Map** | Encore Flow; Nitro scan | `AspireResourcePort`: NS `AspireResource[]` compose graph + `/api/telemetry/resources` (+ aspire MCP `list_resources` for non-NS resources) | live infra graph; node→detail; health color; click node → filter other panels | beta.6 core |
| 2 | **Service Catalog + API Explorer** | Encore Catalog + Explorer | `IntrospectionPort` (`/_netscript/introspection`) + each plugin's `describe`→`PluginCapabilities` (base contract) | list plugin oRPC contracts; **call endpoint, params pre-filled from Standard Schema**; typed live client | beta.6 core |
| 3 | **Flow / Trace Waterfall** | Encore tracing; Inngest; Trigger.dev | `TelemetryQueryPort`: `/api/telemetry/traces` + `/traces/{traceId}` (OTLP-JSON) | trace list → **two-panel** waterfall (timeline-left / details-right) + inline logs; renders Topic-B **Flow B** flagship trace | beta.6 core (flagship) |
| 4 | **Run Inspector** | Temporal; Inngest; Trigger.dev | spans grouped by run (`TelemetryQueryPort`) + plugin `RunRecord` | run-list (filter status/type/time, live) → run-detail (inputs/results) → step-timeline; All/Compact/JSON toggle; **Attempt badges**; **rerun-from-step** (via `command` kind) | list+detail beta.6; rerun-from-step + rich event-history **stable** |
| 5 | **Plugin Control** | (NetScript-native dogfood) | plugin registry + `doctor` + `CommandInvokePort` | installed-plugin list, health/doctor, `withCommand` actions (restart/clear/migrate/seed); `plugin-gated-view` block gates panels by installed plugin | beta.6 core |
| 6 | **Logs** | Trigger.dev; #218 | `/api/telemetry/logs?follow=true` (NDJSON stream) + Aspire browser-log capture (`withBrowserLogs`) | live structured + browser console logs; filter by resource/severity | beta.6 |
| 7 | **Resource Control** | Aspire Actions | `CommandInvokePort` → `ResourceCommandService` / MCP `execute_resource_command` | start/stop/restart resources; composite "reset stack" command | beta.6 (basic); rich orchestration stable |

Panel data all flows through the `packages/plugin-dashboard-core` ports, so the UI is source-swap-
stable. `plugin-gated-view.tsx` (an L3 block, §5) is the mechanism panels use to gate themselves on
which NetScript plugins are installed — directly on-target for a plugin-shaped dashboard.

**Cross-cutting risk to carry (`A/05` pt 5):** if any panel becomes a durable-streams consumer for
live data over the local HTTP apphost, the HTTP/1.1 ~6-connections-per-origin ceiling (electric-
http2) applies. Prefer NDJSON `?follow` polling / a single multiplexed SSE stream over many
concurrent stream subscriptions for beta.6.

---

## 4. Telemetry data contract (the handshake with Opus-B)

### 4.1 What the dashboard consumes at beta.6 — Aspire `/api/telemetry/*` HTTP first

`ctx/01` + `B/aspire-otlp-…` establish the concrete, **already-proven-in-repo** surface. NetScript
ships working code that queries this exact API:
`packages/cli/.../telemetry/(_shared)/telemetry-trace.ts.template`'s `fetchDashboardTraces()` calls
`GET https://localhost:{ASPIRE_DASHBOARD_PORT:-18888}/api/telemetry/traces`, parses OTLP-JSON
(`{ data: { resourceSpans }, totalCount }`), and reconstructs `TelemetryTrace`/`TelemetrySpan` by
`traceId`; `otel-gates.ts` asserts cross-service `parentSpanId` linkage. The dashboard's
`aspire-otlp-http` adapter **generalizes this** (it is currently hardcoded to a `triggers-api`→
`workers` demo) and repoints at the now-**documented** (Aspire 13.2+) API.

Endpoints (`B/aspire-otlp-… §3`): `/api/telemetry/{resources,logs,spans,traces}` +
`/api/telemetry/traces/{traceId}` (full trace tree by id — the best-fit precedent for our need).
`?follow=true` gives NDJSON streaming on logs/spans. **Auth:** `x-api-key`
(`Dashboard:Api:AuthMode=ApiKey` default) — AppHost-integrated mode (NetScript's scaffold mode)
enables the API automatically; NetScript already sets
`ASPIRE_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS=true` for local dev. Version 13.4.6 clears it.

**Constraints to design around:** telemetry is **in-memory only**, auto-evicted at
`MaxTraceCount=10,000` / `MaxLogCount=10,000` — no persistence across restarts, no dashboard-side
dual-write to an external backend. The dashboard treats Aspire's API as the single local-dev source;
backend-forwarding (SigNoz etc.) stays an app-level OTLP-endpoint swap. **Open verification (do not
treat as resolved):** whether `/api/telemetry/*` is declared stable-for-external-integration vs
dashboard-internal — Aspire's docs state neither (contrast Jaeger's explicit "undocumented" JSON
API). Confirm before treating as a long-term contract (open-question OQ-3).

### 4.2 The consumer contract Opus-B must co-design (the port)

Define `TelemetryQueryPort` in `plugin-dashboard-core/ports/` as the **stable seam** so panels never
know whether data comes from Aspire-HTTP (beta.6) or Topic-B's query/export surface (converges
beta.6→stable). This is the exact D1 "starts on Aspire-sourced data, converges on telemetry's
query/export surface" contract.

```ts
// plugin-dashboard-core/ports/telemetry-query-port.ts  (shape, not final)
export interface TelemetryQueryPort {
  listTraces(f: TraceFilter): Promise<TraceListPage>;         // service, time-range, status, cross-service flag
  getTrace(traceId: string): Promise<TraceTree>;              // full span tree, parent/child by parentSpanId
  listSpans(f: SpanFilter): Promise<SpanPage>;
  streamLogs(f: LogFilter): AsyncIterable<LogRecord>;         // maps to ?follow=true NDJSON
  listResourcesWithTelemetry(): Promise<ResourceTelemetrySummary[]>;
}
```

**Handshake asks to Opus-B (co-design the producer side):**
1. Topic-B's query/export surface should expose a **get-trace-tree-by-id** returning the same
   normalized `TraceTree` (or OTLP-JSON `resourceSpans` we already parse) — the single highest-value
   shape (`B/aspire-otlp-… §4`).
2. Filter grammar: service-name, time-range (epoch ms), status, and a **cross-service / grouped-run**
   flag — the dashboard's Run Inspector and Flow panel both need run-grouping.
3. Streaming: an NDJSON/SSE `follow` mode for logs and live spans (matches Aspire's `?follow`).
4. The **flagship trace (Flow B)** — eischat enqueue → workers-api → workers → oRPC callback to the
   single-writer → streams fan-out (Stage-C decision 2) — must be queryable as ONE grouped trace,
   which requires Topic-B's **span-links for the streams fan-in** + the **triggers W3C-parenting
   bugfix**. The dashboard Flow panel is the render target for exactly this; if those two land late,
   the flagship trace renders **severed**. **This is the tightest cross-topic dependency.**
5. Auth/config: the port adapter needs the dashboard base URL + api-key resolution — reuse
   `packages/aspire` `DASHBOARD_ENV_VARS` + `.netscript/e2e/aspire-start.json` resolution
   (`B/aspire-otlp-… §1`) rather than re-deriving.

---

## 5. D-NSONE — final resolution + fresh-ui promotion precursor slice

### 5.1 Verdict: promote the L3 `blocks/` layer; L0–L2 stays; MCP components OUT

I **confirm and detail** the Stage-C provisional lock, with the evidence re-verified against `A/01`,
`A/02`, `A/03`, and the eis-chat `config.json` read directly:

- **The premise is reframed, not removed (drift A1).** fresh-ui's and NS One's L0–L2 layers are the
  **same source text** — `button.tsx`, `avatar.tsx`, `stats-grid.tsx`, `sidebar-shell.tsx`,
  `tokens.css` byte-identical; mechanism = `netscript ui:add` copy-source,
  `copyOwnership: app-owned-after-copy` (`A/03` headline). "eis-chat looks more finished" is a
  used-in-a-real-app effect. **Do NOT re-import L0–L2** — there is nothing to promote there.
- **`conventions.md` is the same L0–L4 ladder** fresh-ui and the `fresh-ui-horizontal` skill already
  use, not a rival vocabulary (`A/02`). The `.design-sync/previews/*` tree is preview-card
  QA-scratch (27/41, several `[RENDER_BLANK]`) — **not** the truth chain; the real source is
  `apps/dashboard/components/{ui,blocks}/**` (`A/02` critical structural fact).
- **The real gap is fresh-ui has NO `blocks/` layer at all** (`A/01` doctrine cross-check: L3
  absent). eis-chat has 9 L3 blocks + 11 block CSS files. fresh-ui's own L0–L4 doctrine calls for
  L3; its absence is pre-existing internal debt (flag to `netscript-doctrine` independent of
  D-NSONE). **Promote the missing L3 layer** = the correct read of the owner's promotion lean, and
  it aligns with the core-centralization law for a flagship surface.
- **Directus sharpening (`A/04 §2`) — the L3 layer is now the CONTRIBUTION TARGET, not just an
  author palette.** Directus builds its own Insights dashboard on the same `Panel` primitive it
  exposes to third parties, over a closed extension taxonomy (Interface/Display/Layout/Panel/Module,
  each an SDK-contract'd `id/name/icon/component/slots/setup` shape). That is the concrete precedent
  the D-NSONE extensibility call was missing: the promoted L3 blocks are the palette that
  **contributed** dashboard panels (§9.1) compose from. This raises the bar on two DDX-0 conventions
  — the per-block `*.d.ts` (real prop types) and `*.prompt.md` are now **contribution-author-facing
  contracts**, not just internal docs, so they must be genuinely typed and complete. It also adds a
  vocabulary refinement: adopt Directus's **edit-shape vs. show-shape** split (Interface vs.
  Display) as a named distinction in the block taxonomy (form-field blocks vs. read-only/badge
  display blocks) — fresh-ui/NS One currently has no such named split (`A/04` secondary convention).
  Per-capability composed block *shapes* (a "collection/attributes/indexes" block, a "provider-
  config" block, a "compose" block) are mostly **stable-tier** — beta.6 ships the 7 generic blocks
  (§5.1) as the contribution substrate; the capability-specific block shapes follow with the
  per-capability sections.

**Block shortlist (Opus-A decides — here is the decision).** Promote the generically-dashboard
blocks as canonical L3; generalize the one product-specific one; leave chat/MCP out:

| eis-chat block | Verdict | Rationale |
|---|---|---|
| `breadcrumbs.tsx` | **Promote** | wraps `.ns-breadcrumb*` CSS already in fresh-ui `layouts.css`; pure chrome |
| `context-rail.tsx` | **Promote** | pairs with `.ns-content-rail`/`.ns-app[data-rail]` CSS already present; generic detail rail |
| `plugin-gated-view.tsx` | **Promote** | directly on-target — gates panels by installed plugin (the dashboard's core mechanism) |
| `activity-feed.tsx` | **Promote** | generic feed/timeline; reused by Logs + Run Inspector |
| `member-rail.tsx` | **Promote (generalize)** | rename to a generic `entity-rail` (list rail); member semantics are eis-chat-flavored but the composition is generic |
| `connector.tsx` | **Promote** | connection/integration-status block; maps to Stack Map node status |
| `channel-tree.tsx` | **Generalize → `tree-nav`** | Project>Channel>Session is eis-chat IA, but collapsible-tree-nav is exactly the plugin/resource tree the dashboard needs |
| `data-grid.tsx` | **Do NOT add as a block** | **naming collision** — fresh-ui already ships `DataGrid<T>` as a real typed export at `src/presentation/data-grid.tsx` (`A/01`, `A/03`). Keep the real export; the block would duplicate. Panels import the export. |
| `mod.ts` | Regenerate | barrel for the promoted set |

- **MCP components (`html-block`, `mcp-widget`, `ui-block`, `icon`): OUT of the general registry for
  beta.6.** Decision rationale: the panel IA (§3) renders **typed** telemetry/resource/run/catalog
  data via `StatsGrid`/`DataTable`/`Panel`/trace-waterfall — it does **not** render arbitrary
  MCP-UI content blocks. The dashboard *consumes* the `aspire` MCP server as a backend data source
  (`ctx/01` pt 3), which is a fetch concern, not a render concern. `icon` already exists as a
  fresh-ui primitive (`src/presentation/primitives.tsx`). **Revisit at stable** only if a "live MCP
  tool surface" panel is added (not in the beta.6 IA). This keeps the promotion scoped and avoids
  importing chat-product surface into the general framework registry (scope-creep guard, `A/03`).

### 5.2 The fresh-ui promotion precursor slice (WSL Codex framework, before beta.6)

One slice, `area:fresh-ui`, ~1 week, **sequenced before any dashboard UI panel** (they depend on the
blocks). Three parts:

1. **Scripted byte-diff of the 32 unsampled shared-name pairs** (`A/03` open item 1) — a scripted
   full-tree diff (not manual reads) to confirm no divergence before costing; 5/5 sampled were
   exact/near-exact, so this is a confirm-the-prior, ~0.5 day.
2. **Reconcile the `markdown` build-path split** (`A/01`, `A/03` open item 3): fresh-ui generates
   from `markdown.tsx.template` + `markdown-pipeline.ts`; eis-chat has a plain compiled `markdown.tsx`
   (likely copied generated output). Internal fresh-ui inconsistency independent of D-NSONE — pick
   one build approach. Small.
3. **Add the L3 `registry/blocks/` layer** with the copy-source registry model
   (`registry.manifest.ts` — `model: 'copy-based-registry'`, `copyOwnership: 'app-owned-after-copy'`,
   `registryDependencies` pointing at the L2 components each block composes) + per-block CSS +
   the `*.prompt.md` (usage) + `*.d.ts` (shape) convention. **Caveat from `A/02`:** the weak-`.d.ts`
   (`{ [k]: unknown }`) issue is scoped to the *design-sync tool's synthetic package output*, NOT
   the real source — the promoted blocks must ship **real** prop types (the real `.tsx` are already
   fully typed). ~7 blocks (6 promote + 1 generalize) — medium, ~2–3 days.

Total slice ~1 week. It is a `@netscript/fresh-ui` framework change → **WSL Codex daemon-attached**,
never a docs workflow (drift A1 action; `specs/topic-A §4`).

---

## 6. Aspire seam extension slice (WSL Codex framework, before/with beta.6)

Separate from §5, this is the `@netscript/aspire` slice from §2.2: extend `AspireResourceKind`
(`command` hard, `app` preferred), add matching `AspireBuilder` port methods, lower them in
`composeAppHost()` to the raw SDK `withCommand`/`addExecutable` calls `register-apps.mts` already
proves. Keep the capability in `@netscript/aspire` core (thinness law — command registration is a
framework capability, not per-plugin glue). Sized in DDX-1.

---

## 7. MANDATORY Claude design-sync artifact

The owner brief (§1, verbatim) requires a Claude design-sync "exactly like eis-chat had": Claude
designs the UI + a prototype implementation leveraging state-of-the-art NetScript seams. Replicate
eis-chat's `.design-sync/` (`A/02`; `config.json` read directly) for the dashboard:

```
plugins/dashboard/.design-sync/
  config.json         # pkg "@netscript/dashboard-ns-one", globalName "NSOne", shape "package",
                      # srcDir "src/ui/components", cssEntry "ds-css-flat.css",
                      # tokensGlob from @netscript/fresh-ui theme, componentSrcMap (panels+blocks),
                      # readmeHeader ".design-sync/conventions.md"
  conventions.md      # the design language — REUSE the NS One / fresh-ui L0–L4 ladder verbatim
                      # (do not fork the vocabulary); add the dashboard's panel-composition patterns
  previews/*.tsx      # Claude-authored preview cards per PANEL + promoted L3 block (real content,
                      # not floor cards — avoid eis-chat's [RENDER_BLANK] gap)
  NOTES.md            # build/re-sync recipe: deno task --cwd <dashboard> build → refresh _fresh →
                      # flatten the compiled closure (tokens + layout objects + *-ns-* utilities +
                      # component CSS — NOT tokens+ui-only, per A/02 warning) into ds-css-flat.css
```

**Lane:** the design-sync is a **Claude** deliverable (design artifacts + Fresh prototype leveraging
fresh-ui seams) — it is design/prototype, not framework `packages/`/`plugins/` source, so it is
inside the CLAUDE.md documentation-authoring-exception spirit for the design half. The **framework
wiring** it informs (the actual `plugins/dashboard/src/ui` Fresh routes) is a WSL Codex slice. The
design-sync feeds every UI panel slice (DDX-6…12) with a locked component/token contract and preview
cards, exactly as eis-chat's did. **Correct the truth-chain trap (`A/02`):** point `srcDir` at the
real component tree, never at `previews/`.

---

## 8. Push-back on Stage-C (with evidence)

1. **Seam reconciliation — I make it a HARD beta.6 requirement, not "consistent with the law."**
   Stage-C leaves the Seam-A-vs-raw-SDK fork to Opus-A. My verdict: the `command` kind is
   non-optional for beta.6 because "control the full stack" (owner §1) has no other honest seam, and
   the dogfold thesis (D2) fails if the dashboard's own Aspire presence is a hand-edited generator
   exception. Evidence: `A/01 §1` (three-surface win), `A/02 §3` (both seams lack it today),
   `specs/topic-A §2` (dogfood mandate).
2. **`app` kind gets a real fallback.** Stage-C doesn't name a risk valve for the co-land. I add:
   if the `app`-kind half slips, register the dashboard UI via Seam B (eis-chat's proven pattern,
   `A/01 §4`) so beta.6 is not gated on the fuller seam change. Keeps the flagship shippable.
3. **`data-grid` block must NOT be promoted.** Stage-C's shortlist lists `data-grid` among block
   candidates; that collides with fresh-ui's existing real `DataGrid<T>` export (`A/01`, `A/03`).
   Promoting it duplicates a shipped surface. Import the export; drop the block.
4. **MCP-component decision made, not deferred.** Stage-C left it to Opus-A "if the panel IA needs
   live MCP-content rendering." I resolve: **OUT for beta.6** — the panel IA renders typed data, and
   MCP is a *data source* not a *render target*. Removes an open fork.
5. **Flagship-trace dependency is the tightest cross-topic edge, and I name the failure mode.** If
   Topic-B's streams fan-in span-links + triggers W3C-parenting bugfix land late, the Flow panel
   renders the flagship trace **severed** — this is a co-land gate, not a soft convergence. (§4.2
   ask 4.)
6. **IA reframe (owner-expanded corpus `A/04`): "manage-through-UI" is the actual thesis, so the IA
   is a shell + per-capability sections, not 7 fixed panels.** §9 restructures. This supersedes the
   flat-list framing of DDX-10 in the first draft.

---

## 9. Manage-through-UI thesis + extensibility (BaaS/admin-console corpus `A/04`)

The dev/run-console corpus (`A/03`) sharpened *observability*. The BaaS/admin-console corpus (`A/04`)
hits Topic-A's **actual** thesis — "the dashboard IS how you drive the framework" — head-on. Three
patterns change the design; two are noted as deferred edges.

### 9.1 Per-capability manage loop + the reframed IA (Appwrite north-star)

**Decision: reframe the IA. Adopt per-capability sections; keep a flat overview only as the host.**
Appwrite proves the differentiator is **per-capability first-class sections** (Databases, Auth,
Storage, Functions, Messaging) each with (1) its own nav entry named after the primitive, (2) a
fastest-path create action (form or template gallery), (3) a **tabbed settings area** distinct from
the create form (permissions/security/config as separate tabs, not inlined), and (4) — where the
primitive produces activity — a **dedicated monitor view with its own status vocabulary** (Appwrite
splits Executions vs. Deployments; message `draft→scheduled→processing→success/failed`). A single
generic "Plugin Control" list (first-draft DDX-10) is the *weaker* read of the thesis.

So the IA becomes:

- **Cross-cutting panels** (framework-wide, dashboard-authored — the §3 table): Stack Map ·
  Service Catalog + API Explorer · Flow/Trace Waterfall · Run Inspector (all runs, all plugins) ·
  Logs · Resource Control.
- **Per-capability plugin sections** (one per **installed** plugin category, following the
  create→configure(tabs)→monitor loop): **workers · sagas · triggers · streams** at beta.6;
  **auth · db · kv · storage-shaped** at stable. Each section's monitor view **deep-links into the
  cross-cutting Run Inspector / Flow panel** filtered to that capability (no duplicated trace
  rendering — the cross-cutting panels stay the single render surface, §3 note on the HTTP/1.1
  ceiling).
- **Plugin Control (revised DDX-10)** = the **host + registry/overview + doctor** — installed-vs-
  available plugins, health, and the mount point that renders the contributed per-capability
  sections. It is no longer "the panel that lists actions"; the actions live in each capability
  section.

**beta.6 scope discipline:** ship the cross-cutting panels + **first-party per-capability sections
for the 4 core plugins** (workers/sagas/triggers/streams), each thin (monitor + basic config +
`withCommand` actions), rendered **through the contribution seam** (§9.2) so the dashboard dogfoods
its own extension API even for first-party sections. Depth per capability (rich config tabs,
Executions-vs-Deployments-style dual histories, per-capability composed block shapes) is stable.
auth/db/kv/storage sections are stable (auth is the strongest stable candidate; db gated on
Prisma-Next). Secondary Appwrite conventions worth carrying but **not beta.6 issues**: scopes-mirror-
nav for a tokens/API-keys panel + **Dev Keys** (short-lived, rotate-in-place, local-dev-only tokens
for the Aspire loop) — both stable candidates, noted not scoped.

### 9.2 `.withDashboardPanel` — the contribution seam (Directus precedent)

**Verdict: ADOPT, as a contribution-CONTRACT seam owned by `plugin-dashboard-core`, not a new core
`definePlugin` axis.** Directus's extension taxonomy (Interface/Display/Layout/Panel/Module, each a
documented SDK-contract'd `id/name/icon/component/slots/setup` shape) and — critically — the fact
that Directus's **own** Insights dashboard is built on the same `Panel` primitive it exposes to third
parties, is the exact precedent for making the NetScript dashboard a **panel/L3-block registry
consumer**, not just an author.

Realization (thinness-correct):

- Define a **`DashboardPanelContribution` contract** in `plugin-dashboard-core/contracts/v1`
  (Standard-Schema-shaped: `id`, `title`, `icon`, `capability` (which plugin category), `component`
  (the island entrypoint), `slots` (options/sidebar/actions), `setup()` (data-source wiring to the
  core ports), `commands` (withCommand refs)). This mirrors Directus's Layout/Panel export contract.
- **Discover contributions the way Aspire contributions are discovered** — a plugin that wants a
  dashboard section depends on `@netscript/plugin-dashboard-core` and exports a contribution the
  registry-generation step collects (parallel to `AspireNSPluginContribution.contribute()`). **This
  deliberately keeps `@netscript/plugin` dashboard-agnostic** — the core builder does NOT gain a
  dashboard-coupled axis; the dashboard owns its own extension contract. (Layering: core must not
  know about one specific plugin's surface — the same reason the dashboard is itself a plugin.)
- **Optional `.withDashboardPanel()` sugar** — if the owner wants the ergonomic symmetry with
  `.withService`/`.withStreamTopics`, ship it as a thin helper that *produces* the same contribution
  contract, NOT as coupling in the core builder. Sugar over the contract, at the plugin's own layer.

**Milestone split:** the **seam** (contract + discovery + the dashboard renders contributed sections
+ the 4 first-party sections dogfooding it) is **beta.6** — it is load-bearing for §9.1's reframed
IA. The **third-party ecosystem** (external plugins contributing panels) + an **in-dashboard
marketplace** (Directus reachable-from-Settings install, a stretch on `plugin add`) are **stable**.

### 9.3 Codegen-from-UI (Strapi) — a second caller of the CLI scaffolder

**Decision: adopt as a stable feature (beta.6 stretch if the resource scaffolders are cheap).**
Strapi's Content-Type Builder writes the **identical** on-disk artifacts as its `strapi generate`
CLI — dashboard and CLI are two callers of one generator. This is an almost-literal precedent for a
dashboard **"Add resource"** action that calls the exact same `createPluginAdapter(...).toScaffold()`
machinery the CLI installer already uses (`A/04 §3`, `A/04-plugin-archetype-grounding §4`). **No new
codegen engine — a second caller of the existing one**, and it must respect #157 (typesafe codegen
via factory/AST, **never string templates**; MEMORY scaffold-surface-typesafe-codegen). Scoped as
DDX-19; stable because it depends on DDX-4's `adapter/resources/` scaffolders being wired for the
resource types the dashboard would emit.

### 9.4 AI-on-codegen (Strapi AI) — cross-epic edge to #238, not dashboard scope

Strapi AI's chat / design-import / code-analysis triad all terminate in the same generated artifacts.
This is a precedent for the **flagship AI plugin (#238)** converging with §9.3's scaffold-from-UI
action (the AI plugin drives the same typesafe scaffolder), NOT net-new dashboard scope. Recorded as
a **cross-epic edge**: `epic:dev-dashboard` DDX-19 ⇄ `epic:@netscript/plugin-ai (#238)`, stable.
Reusable input taxonomy for a future dashboard-AI panel: chat-driven contract authoring, Figma/
screenshot-driven L3-block scaffolding, existing-code (Prisma schema / oRPC contract) reverse-
inference. See `open-questions.md` OQ-11.

### 9.5 Schema-driven `db` tab (Directus data-model) — stable/deferred

Directus generates Content-module CRUD screens live from the data model (model → auto CRUD, field
type → default interface, explicit override seam). Strongest precedent for a NetScript `db` tab
rendered directly off the **Prisma-Next** schema — but it is **stable/deferred**, gated on the
Prisma-Next DB-layer migration (MEMORY prisma-next-db-migration). Noted, not scoped into beta.6.
