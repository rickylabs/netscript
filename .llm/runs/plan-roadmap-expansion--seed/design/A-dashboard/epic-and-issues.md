# Topic A — `dev-dashboard` epic + sub-issues (draft text only — NO GitHub mutations)

> ## ⚠️ MILESTONE AUTHORITY — reconciled 2026-07-05 (post-ratification)
>
> **GitHub milestones are the single source of truth for this roadmap.** This doc was authored with
> topic-local milestone estimates *before* the owner-ratified **beta.3 / beta.4 re-forecast**
> (recorded in [`BETA34-FORECAST.md`](../../BETA34-FORECAST.md)). Since then:
>
> 1. **Every milestone now exists.** `0.0.1-beta.1`…`0.0.1-beta.8` + `0.0.1-stable` are all live.
>    beta.1 (2026-07-03) and beta.2 (2026-07-04) have **shipped**; **beta.3 is the next cut**, then
>    beta.4. Any "milestone does not exist yet / owner must create it" note below is **obsolete**.
> 2. **Live train (authoritative):** **beta.3** = deploy compose + deploy-e2e gate + issue-closure
>    guardrail + workers health-check fix (#393 / #394 / #387 / #376) · **beta.4** = AI flagship
>    parity + doctrine backstop (#388 / #459) · **beta.5** = telemetry T1/T2 + road-to-stable
>    S2/S4/S5/S6 + deploy S9–S12 + AI anchor #219 · **beta.6** = dashboard DDX + telemetry T3–T8 +
>    AI generative-UI/MCP · **beta.7** = AI depth seams + docs cut · **beta.8** = desktop ·
>    **stable** = deferred tail. (This topic's DDX issues sit at **beta.6**, matching the live train.)
>
> **Where a milestone tag in the body below differs from the issue's current GitHub milestone,
> GitHub wins.** Do not re-file or re-milestone from this doc without checking the live issue first.

> Decomposed per **panel / layer / CLI surface** per the owner's "one Fable/agent per feature/layer/
> CLI option" build model (`specs/topic-A §1`). Labels per netscript-pr taxonomy. Milestone
> `0.0.1-beta.6` (core) / `0.0.1-stable` (depth) — **note: `0.0.1-beta.6` milestone does not exist
> yet; owner must create it at ratification** (Stage-C owner fork 1; drift C1). All issues carry
> exactly one `status:` (= `status:plan` in this planning run) and land under `epic:dev-dashboard`.

## Epic issue — `dev-dashboard`

- **Title:** `epic: NetScript Dev Dashboard — Aspire-extension dev console (ships as a plugin, beta.6)`
- **Labels:** `type:umbrella`, `epic:dev-dashboard`, `area:plugins`, `area:aspire`, `area:fresh-ui`,
  `area:telemetry`, `priority:p1`, `status:plan`, `wave:v1`
- **Milestone:** `0.0.1-beta.6`
- **Body gist:** The killer feature — an Encore-dev-equivalent local dev console for NetScript,
  delivered as an installable official plugin (`plugin add dashboard`) that dogfoods the plugin
  system. Thin `plugins/dashboard` + `packages/plugin-dashboard-core`; UI on `@netscript/fresh-ui`;
  live data from Aspire `/api/telemetry/*` converging on the telemetry-revamp query/export surface
  (co-land beta.6). **No closing keyword** (epic closes by hand when children land). Cross-epic dep:
  `epic:telemetry-revamp` (query/export + streams fan-in span-links + triggers W3C bugfix).

## DAG (dependency edges)

```
FOUNDATION (framework, WSL Codex) ──────────────────────────────────────────────
  DDX-0  fresh-ui L3 blocks promotion (precursor)   ─┐
  DDX-1  @netscript/aspire seam ext (command|app)   ─┤
  DDX-2  plugin-dashboard-core scaffold + contract  ─┤
                                                      │
CORE LAYER ───────────────────────────────────────────┼──────────────────────────
  DDX-3  TelemetryQueryPort + aspire-otlp-http adapter (needs DDX-2; soft dep: TELE query/export)
  DDX-4  plugins/dashboard thin manifest + scaffold + E2E   (needs DDX-2)
  DDX-13 Introspection endpoint /_netscript/*               (needs DDX-2, DDX-4)
  DDX-15 Claude design-sync artifact + panel prototype (Claude) (needs DDX-0)
                                                      │
UI SHELL ─────────────────────────────────────────────┼──────────────────────────
  DDX-5  Fresh build-console shell + app-registration + IA  (needs DDX-0, DDX-4, DDX-15)
                                                      │
EXTENSIBILITY SEAM (proposal §9) ─────────────────────┼──────────────────────────
  DDX-17 DashboardPanelContribution seam (.withDashboardPanel) (needs DDX-2, DDX-5)
                                                      │
CROSS-CUTTING PANELS (one agent each) ────────────────┼──────────────────────────
  DDX-6  Stack Map            (needs DDX-5, DDX-3?/graph-port, DDX-13)
  DDX-7  Service Catalog+API Explorer (needs DDX-5, DDX-13)
  DDX-8  Flow / Trace Waterfall  ★flagship (needs DDX-5, DDX-3, TELE **T4 triggers W3C bugfix + T5 streams fan-in span-links + T6 oRPC span-creation + T7 telemetry/query**)
  DDX-9  Run Inspector (all plugins) (needs DDX-5, DDX-3; rerun-from-step needs DDX-1)
  DDX-10 Plugin Control HOST/registry (needs DDX-5, DDX-1, DDX-17)
  DDX-11 Logs                (needs DDX-5, DDX-3, DDX-1 app/browser-logs)
  DDX-12 Resource Control    (needs DDX-5, DDX-1)
  DDX-14 CLI surface + auto-launch (needs DDX-4)
                                                      │
PER-CAPABILITY SECTIONS (contributed; one agent each) ─┼──────────────────────────
  DDX-18 workers/sagas/triggers/streams sections (18a-d) (needs DDX-17, DDX-5, DDX-3, DDX-1)
  DDX-19 Codegen-from-UI "Add resource" [STABLE] (needs DDX-4, DDX-17; ⇄ #238)
                                                      │
MERGE-READINESS ──────────────────────────────────────┴──────────────────────────
  DDX-16 E2E: scaffold.runtime dashboard join + panel + section smoke (needs all beta.6 core)
```

Critical path to a shippable beta.6 flagship: **DDX-0 + DDX-2 → DDX-3/DDX-4 → DDX-5 → DDX-8** with
the **telemetry-revamp** fan-in-links/triggers-bugfix co-land. DDX-1 gates the "control" panels
(10/12) and rerun-from-step (9).

---

## Foundation slices (framework — WSL Codex)

### DDX-0 — fresh-ui L3 `blocks/` promotion (D-NSONE precursor)
- **Labels:** `type:feat`, `area:fresh-ui`, `gate:jsr`, `epic:dev-dashboard`, `priority:p1`, `status:plan`, `wave:v1`
- **Milestone:** `0.0.1-beta.6`
- **Acceptance:**
  - Scripted full-tree byte-diff of the 32 unsampled fresh-ui⇄eis-chat shared-name pairs; divergences
    (if any) recorded, none silently promoted. **This diff is the LD-2 proving gate** — it is what
    lets the plan claim "L0–L2 identical, do NOT re-import"; a non-identical pair is recorded as DDX-0
    drift, not silently promoted.
  - `markdown` build-path split reconciled to one approach (template+codegen **or** compiled).
  - `registry/blocks/` added with copy-source model (`copyOwnership: app-owned-after-copy`,
    `registryDependencies`), per-block CSS, and **real** `*.d.ts` + `*.prompt.md` per block.
  - Promoted set: `breadcrumbs`, `context-rail`, `plugin-gated-view`, `activity-feed`, `connector`,
    `entity-rail` (generalized from `member-rail`), `tree-nav` (generalized from `channel-tree`).
    `data-grid` NOT added (collides with existing `DataGrid<T>` export). MCP components NOT added.
  - `netscript ui:add <block>` copies a block + its L2 `registryDependencies`; fresh-ui gates green.
  - **`gate:jsr`:** the new `registry/blocks/` subpath(s) are added to `@netscript/fresh-ui`'s
    `exports` map; `deno task doc:lint` clean on the full export set (not just `mod.ts`) and
    `deno publish --dry-run` green.
- **Dep:** none. **Blocks:** DDX-5 and all panels; DDX-15.

### DDX-1 — `@netscript/aspire` seam extension (`command` + `app` kinds)
- **Labels:** `type:feat`, `area:aspire`, `epic:dev-dashboard`, `priority:p1`, `status:plan`, `wave:v1`
- **Milestone:** `0.0.1-beta.6`
- **Acceptance:**
  - `AspireResourceKind` gains `'command'` (hard) and `'app'` (preferred); `AspireBuilder` port gains
    matching methods; `composeAppHost()` lowers them to raw-SDK `withCommand`/`addExecutable`
    +`withHttpEndpoint`+`withBrowserLogs`.
  - `contribute()` can register a command whose `commandOptions.arguments` (`InteractionInput[]`) +
    `confirmationMessage` render the dashboard prompt dialog AND work from `aspire resource <name>
    <cmd>` (visibility default UI+API). **No `IInteractionService` reference anywhere** (A2).
  - `app`-kind path registers a Fresh app with HTTP endpoint + browser-logs via `contribute()`.
  - `ContributionRegistry` duplicate/collision behavior preserved; arch:check green.
  - **Fallback documented:** if `app` kind slips, dashboard UI registers via Seam B `apps.dashboard`.
- **Dep:** none. **Blocks:** DDX-10, DDX-12, DDX-9 (rerun), DDX-11 (browser-logs), DDX-5 (app kind).

### DDX-2 — `packages/plugin-dashboard-core` scaffold + contract seam
- **Labels:** `type:feat`, `area:plugins`, `gate:jsr`, `epic:dev-dashboard`, `priority:p1`, `status:plan`, `wave:v1`
- **Milestone:** `0.0.1-beta.6`
- **Acceptance:**
  - Package created using canonical doctrine-05 role folders
    (`domain/ports/application/adapters/middleware/registry/diagnostics/presentation/testing`) with
    two **documented** divergences: self-instrumentation lives under `middleware/` (doctrine-05's
    telemetry example) — the earlier `telemetry/` folder naming was drift and is corrected; and
    `public/mod.ts` is the harness-observed CLI-scaffolder public-surface layout (ARCHETYPE-5 vs
    doctrine-text, tracked #305/#306), not doctrine-05's `mod.ts`-only surface. arch:check is the
    enforcing gate; no forbidden imports.
  - Domain models: `ResourceGraph`, `PanelDescriptor`, `RunRecord`, `TraceTree`, `TraceSpan`,
    `LogRecord`, `ContractCatalogEntry`.
  - Ports: `TelemetryQueryPort`, `AspireResourcePort`, `IntrospectionPort`, `CommandInvokePort`.
  - `contracts/v1/mod.ts` defines `DashboardContract` **extending `BasePluginContract`** (base
    `describe` + the §1.3 routes) as oRPC `ContractProcedure`s with Standard-Schema outputs.
  - `tests/contracts/dashboard-contract-base-seam_test.ts` soundness test green (only the 2 accepted
    casts; MEMORY e2e-type-soundness).
  - **`gate:jsr`:** `deno task doc:lint` clean on the full export map, `deno publish --dry-run` green,
    and the `exports` map matches the shipped subpaths.
- **Dep:** none. **Blocks:** DDX-3, DDX-4, DDX-13, and every panel (via ports/contract).

---

## Core layer

### DDX-3 — `TelemetryQueryPort` + `aspire-otlp-http` adapter
- **Labels:** `type:feat`, `area:telemetry`, `area:plugins`, `epic:dev-dashboard`, `priority:p1`, `status:plan`, `wave:v1`
- **Milestone:** `0.0.1-beta.6`
- **Acceptance:**
  - Adapter consumes `/api/telemetry/{traces,traces/{id},logs,spans,resources}` (OTLP-JSON), auth via
    `DASHBOARD_ENV_VARS` + `.netscript/e2e/aspire-start.json` base-URL resolution.
  - Generalizes `telemetry-trace.ts.template`'s `fetchDashboardTraces()` (currently hardcoded to a
    `triggers-api`→`workers` demo) — filters by service/time/status; reconstructs `TraceTree` by
    `parentSpanId`; `streamLogs` maps to `?follow=true` NDJSON.
  - Port is the source-swap seam: a second adapter can target Topic-B's query/export surface with **no
    panel change**. Contract co-designed with Opus-B (see `open-questions.md` OQ-1).
- **Dep:** DDX-2. **Soft dep:** `epic:telemetry-revamp` query/export. **Blocks:** DDX-8, DDX-9, DDX-11, DDX-6.

### DDX-4 — `plugins/dashboard` thin plugin (manifest + scaffold + E2E join)
- **Labels:** `type:feat`, `area:plugins`, `area:cli`, `gate:jsr`, `epic:dev-dashboard`, `priority:p1`, `status:plan`, `wave:v1`
- **Milestone:** `0.0.1-beta.6`
- **Acceptance:**
  - `scaffold.plugin.json` with `provider.kind: 'dashboard'`, `category: 'plugin'`,
    `portRangeKey: 'PLUGIN_API'`, `pluginType: 'utility'`, `defaultRequiresDb/Kv: false`, +
    `officialSource` block (canonicalName `dashboard`, serviceEntrypoint, servicePort).
  - `src/public/mod.ts` `definePlugin('@netscript/plugin-dashboard', VERSION).withType('utility')
    .withService(...).withAspire('./src/aspire/mod.ts').withContractVersions([...]).build()`;
    `mod.ts` one-line re-export.
  - `scaffold.ts` = `createPluginAdapter(dashboardAdapterPlugin).toScaffold()`; `adapter/plugin.ts`
    implements install/doctor/info/update/remove; `adapter/resources/` emits **typesafe codegen**
    glue (#157 mandate — no string templates).
  - `contracts/v1/mod.ts` re-exports from core (no redefinition). `verify-plugin.ts` present.
  - **`netscript plugin install @netscript/plugin-dashboard` works with no CLI core change** (confirm
    dynamic-kind registration path); joins `scaffold.runtime`/`scaffold.plugins` E2E.
  - **`gate:jsr`:** `deno task doc:lint` clean on the full export map, `deno publish --dry-run` green,
    `exports` matches shipped subpaths; JSR-safe asset embedding (import attributes, never
    `readTextFile`/`fromFileUrl`) per MEMORY.
- **Dep:** DDX-2. **Blocks:** DDX-5, DDX-13, DDX-14.

### DDX-13 — Introspection endpoint (`/_netscript/*`)
- **Labels:** `type:feat`, `area:cli`, `area:plugins`, `epic:dev-dashboard`, `priority:p2`, `status:plan`, `wave:v1`
- **Milestone:** `0.0.1-beta.6`
- **Acceptance:** a machine-readable JSON dev endpoint (Nitro `/_nitro/tasks` pattern, `A/03 §6`)
  listing scaffolded plugins, routes, background jobs, stream topics, contract versions — consumed by
  the Fresh dashboard for Stack Map + Catalog. Derived from scaffold/registry, not hand-authored.
- **Dep:** DDX-2, DDX-4. **Blocks:** DDX-6, DDX-7.

### DDX-15 — MANDATORY Claude design-sync artifact + panel prototype (Claude lane)
- **Labels:** `type:feat`, `area:fresh-ui`, `area:docs`, `epic:dev-dashboard`, `priority:p1`, `status:plan`, `wave:v1`
- **Milestone:** `0.0.1-beta.6`
- **Acceptance:** `plugins/dashboard/.design-sync/` (config.json, conventions.md reusing NS One/
  fresh-ui L0–L4, previews per panel + promoted block with **real** content, NOTES.md with the
  compiled-closure re-sync recipe) + a Fresh prototype of the panel shell leveraging fresh-ui seams.
  Truth chain points at the real component tree, never `previews/` (`A/02` trap).
- **Dep:** DDX-0. **Blocks:** DDX-5 and panels (component/token contract). **Lane:** Claude (design/
  prototype); framework wiring is WSL Codex (DDX-5).

---

## UI shell + panels (one agent per surface)

### DDX-5 — Fresh build-console shell + app-registration + IA
- **Labels:** `type:feat`, `area:fresh`, `area:fresh-ui`, `epic:dev-dashboard`, `priority:p1`, `status:plan`, `wave:v1`
- **Milestone:** `0.0.1-beta.6`
- **Acceptance:** SidebarShell-based 7-panel IA on `@netscript/fresh-ui` + promoted L3 blocks;
  dashboard registered as an Aspire resource (DDX-1 `app` kind, or Seam-B fallback) with
  `withHttpEndpoint` + `withBrowserLogs`; auto-launch on `aspire start`, fixed local port, live
  updates; routing/islands wired to core ports. Consumes DDX-15 design-sync contract.
- **Dep:** DDX-0, DDX-4, DDX-15 (soft: DDX-1 app kind). **Blocks:** DDX-6…12.

### DDX-6 — Stack Map panel
- **Labels:** `type:feat`, `area:fresh`, `area:aspire`, `epic:dev-dashboard`, `priority:p1`, `status:plan`, `wave:v1` · **beta.6**
- **Acceptance:** live code-derived resource/plugin-contribution graph (Encore-Flow analog);
  `AspireResourcePort` (NS compose graph + `/api/telemetry/resources`, + MCP `list_resources` for
  non-NS resources); node→detail; health color; node click cross-filters panels.
- **Dep:** DDX-5, DDX-13, `AspireResourcePort`.

### DDX-7 — Service Catalog + API Explorer panel
- **Labels:** `type:feat`, `area:fresh`, `area:plugins`, `epic:dev-dashboard`, `priority:p1`, `status:plan`, `wave:v1` · **beta.6**
- **Acceptance:** auto-generated oRPC-contract catalog from each plugin's `describe`→
  `PluginCapabilities` + introspection; **live API Explorer** — call an endpoint, params pre-filled
  from the Standard Schema (Encore's highest-value interaction, `A/03 §1`).
- **Dep:** DDX-5, DDX-13.

### DDX-8 — Flow / Trace Waterfall panel ★flagship
- **Labels:** `type:feat`, `area:fresh`, `area:telemetry`, `epic:dev-dashboard`, `priority:p1`, `status:plan`, `wave:v1` · **beta.6**
- **Acceptance:** trace list → two-panel waterfall (timeline-left / details-right) + inline logs, via
  `TelemetryQueryPort`; renders the **Flow B** flagship grouped trace (eischat enqueue → workers-api
  → workers → oRPC callback → streams fan-out) as ONE trace.
  - **Co-land gate — hard deps on `epic:telemetry-revamp` by ID (all four):** **T4** (triggers
    W3C-parenting bugfix), **T5** (streams fan-in span-links), **T6** (oRPC callback span-creation —
    today a silent no-op; the tracing-plugin only enriches an already-active span), **T7**
    (`@netscript/telemetry/query` surface DDX-3's second adapter targets). Missing **any** one and the
    flagship trace renders severed (T4/T5), span-less at the oRPC hop (T6), or unqueryable (T7).
  - **Acceptance FAILS if the oRPC-callback span exists / is queryable only via a mock or a hand-
    injected span** — the real workers→oRPC→streams hop must produce a genuine child span that T7's
    query surface returns, proving T6 landed rather than being stubbed for the demo.
- **Dep:** DDX-5, DDX-3, **`epic:telemetry-revamp` → T4, T5, T6, T7 (all hard)**.

### DDX-9 — Run Inspector panel
- **Labels:** `type:feat`, `area:fresh`, `area:telemetry`, `epic:dev-dashboard`, `priority:p1`, `status:plan`, `wave:v1`
- **Milestone:** list+detail **beta.6**; rerun-from-step + rich All/Compact/JSON event-history **0.0.1-stable**
- **Acceptance (beta.6):** run-list (filter status/type/time, live) → run-detail (inputs/results) →
  step-timeline waterfall; Attempt badges. **(stable):** rerun-from-step via DDX-1 command; multi-
  altitude history toggle (Temporal pattern, `A/03 §2`).
- **Dep:** DDX-5, DDX-3; rerun → DDX-1.

### DDX-10 — Plugin Control HOST + registry/overview (revised per proposal §9.1)
- **Labels:** `type:feat`, `area:fresh`, `area:plugins`, `area:aspire`, `epic:dev-dashboard`, `priority:p1`, `status:plan`, `wave:v1` · **beta.6**
- **Revised scope (was "flat action list"):** now the **host/registry/overview** — installed-vs-
  available plugin list + health/doctor + the **mount point that renders contributed per-capability
  sections** (DDX-17/DDX-18). `plugin-gated-view` block gates sections by installed plugin. The
  per-capability *actions* move into each section (DDX-18); this issue owns the host + overview +
  doctor + global commands.
- **Acceptance:** overview lists installed/available plugins with health; doctor surfaced; contributed
  sections mount here via the DDX-17 seam; global `withCommand` actions via `CommandInvokePort`;
  interactive params via command `arguments` (A2).
- **Dep:** DDX-5, DDX-1, DDX-17.

### DDX-11 — Logs panel
- **Labels:** `type:feat`, `area:fresh`, `area:telemetry`, `epic:dev-dashboard`, `priority:p2`, `status:plan`, `wave:v1` · **beta.6**
- **Acceptance:** live structured logs (`/api/telemetry/logs?follow=true` NDJSON) + Aspire browser-log
  capture (`withBrowserLogs`, #218); filter by resource/severity. Prefer single multiplexed stream
  (HTTP/1.1 6-conn ceiling, `A/05`).
- **Dep:** DDX-5, DDX-3; browser-logs → DDX-1.

### DDX-12 — Resource Control panel
- **Labels:** `type:feat`, `area:fresh`, `area:aspire`, `epic:dev-dashboard`, `priority:p2`, `status:plan`, `wave:v1`
- **Milestone:** basic start/stop/restart **beta.6**; composite/orchestration **0.0.1-stable**
- **Acceptance:** resource start/stop/restart via `CommandInvokePort` → `ResourceCommandService` /
  MCP `execute_resource_command`; composite "reset stack" command (stable).
- **Dep:** DDX-5, DDX-1.

### DDX-14 — CLI surface + auto-launch
- **Labels:** `type:feat`, `area:cli`, `epic:dev-dashboard`, `priority:p2`, `status:plan`, `wave:v1` · **beta.6**
- **Acceptance:** dashboard auto-launches on the dev run at a fixed port (competitor convention,
  `A/03`); optional `netscript dashboard` command + optional `--kind dashboard` /
  `BARE_PLUGIN_PACKAGE_ALIASES` shortcut (low-cost, non-blocking, `A/04 §4`).
- **Dep:** DDX-4.

### DDX-16 — E2E: dashboard join + panel smoke (merge-readiness)
- **Labels:** `type:test`, `gate:e2e`, `area:plugins`, `epic:dev-dashboard`, `priority:p1`, `status:plan`, `wave:v1` · **beta.6**
- **Acceptance:** `scaffold.runtime` adds `dashboard` alongside workers/sagas/triggers/streams;
  install→generate→type-check→Aspire start→panel-endpoint smoke green; cleanup on `--cleanup`.
  - **Flagship co-land assertion:** the smoke drives the DDX-8 Flow B trace end-to-end and asserts it
    renders as ONE unsevered trace with a real oRPC-callback child span returned by the
    `@netscript/telemetry/query` surface — i.e. it fails if telemetry **T4/T5/T6/T7** did not land.
- **Dep (explicit — the full beta.6 set, not a range):** DDX-0, DDX-1, DDX-2, DDX-3, DDX-4, DDX-5,
  DDX-6, DDX-7, DDX-8, DDX-9(list+detail), DDX-10(host), DDX-11, DDX-12(basic), DDX-13, DDX-14,
  DDX-15, DDX-17, DDX-18a-d; **cross-epic hard: `telemetry-revamp` T4, T5, T6, T7.**

---

## Extensibility + manage-through-UI slices (proposal §9)

### DDX-17 — `DashboardPanelContribution` seam (`.withDashboardPanel`)
- **Labels:** `type:feat`, `area:plugins`, `gate:jsr`, `epic:dev-dashboard`, `priority:p1`, `status:plan`, `wave:v1` · **beta.6**
- **Acceptance:**
  - `DashboardPanelContribution` contract in `plugin-dashboard-core/contracts/v1` (Standard-Schema:
    `id/title/icon/capability/component/slots{options,sidebar,actions}/setup()/commands`) — shaped
    like Directus's Layout/Panel export.
  - **Discovery mirrors `AspireNSPluginContribution`**: a plugin depending on
    `@netscript/plugin-dashboard-core` exports a contribution the registry-generation step collects.
    **`@netscript/plugin` gains NO dashboard-coupled axis** (thinness/layering).
  - The dashboard shell (DDX-5) renders contributed sections at the DDX-10 host mount point.
  - Optional `.withDashboardPanel()` sugar = thin helper producing the same contract, at the
    plugin's layer, NOT core coupling. arch:check green; contribution soundness test.
  - **`gate:jsr`:** the `DashboardPanelContribution` contract is part of `plugin-dashboard-core`'s
    published `contracts/v1` subpath — `deno task doc:lint` clean, `deno publish --dry-run` green.
- **Dep:** DDX-2 (contract seam), DDX-5 (mount). **Blocks:** DDX-18, DDX-10, DDX-19.
- **Note:** third-party ecosystem + in-dashboard marketplace are **stable** follow-ons, not this issue.

### DDX-18 — First-party per-capability sections (workers/sagas/triggers/streams)
- **Labels:** `type:feat`, `area:fresh`, `area:plugins`, `epic:dev-dashboard`, `priority:p1`, `status:plan`, `wave:v1` · **beta.6**
- **Model:** one agent per capability (owner's one-agent-per-feature model) → 4 parallel sub-slices
  (18a workers, 18b sagas, 18c triggers, 18d streams).
- **Acceptance (per section, thin at beta.6):** each installed core plugin renders a section via the
  DDX-17 contribution seam following **create → configure(tabs) → monitor**: a monitor view (deep-
  links into cross-cutting Run Inspector/Flow filtered to that capability), basic config tab, and
  `withCommand` actions (A2 arguments). Dogfoods DDX-17 for first-party plugins. Depth (rich config
  tabs, dual histories, capability-specific composed blocks) is **stable**.
- **Dep:** DDX-17, DDX-5, DDX-3, DDX-1. auth/db/kv/storage sections = **stable** (separate issues).

### DDX-19 — Codegen-from-UI "Add resource" action (Strapi precedent)
- **Labels:** `type:feat`, `area:cli`, `area:plugins`, `epic:dev-dashboard`, `priority:p2`, `status:plan`, `wave:defer`
- **Milestone:** `0.0.1-stable` (beta.6 stretch if DDX-4 resource scaffolders are cheap to expose)
- **Acceptance:** a dashboard "Add resource" action calls the **same**
  `createPluginAdapter(...).toScaffold()` machinery the CLI installer uses, landing **identical**
  CLI-reproducible artifacts — **#157-safe (typesafe factory/AST codegen, NEVER string templates)**.
  One generator, two callers. No new codegen engine.
- **Dep:** DDX-4 (`adapter/resources/` scaffolders), DDX-17.
- **Cross-epic edge:** AI-on-codegen convergence with **`epic:@netscript/plugin-ai (#238)`** (stable)
  — the AI plugin drives the same scaffolder (chat / Figma-import / code-analysis inputs). Not
  net-new dashboard scope; cross-ref only. See open-questions OQ-13 (=OF-12).

## Milestone summary

> **Slice count: 23** — DDX-0…16 (17) + DDX-17 (1) + DDX-18a-d (4) + DDX-19 (1). `DDX-18` is 4
> parallel sub-slices (18a-d), so the epic totals 23 issues, well under the harness `< 30` bound.

| Milestone | Slices |
|---|---|
| **0.0.1-beta.6 (core)** | DDX-0, DDX-1, DDX-2, DDX-3, DDX-4, DDX-5, DDX-6, DDX-7, DDX-8, DDX-9(list+detail), DDX-10(host), DDX-11, DDX-12(basic), DDX-13, DDX-14, DDX-15, DDX-16, **DDX-17 (contribution seam), DDX-18a-d (workers/sagas/triggers/streams sections — thin)** |
| **0.0.1-stable (depth)** | DDX-9 rerun-from-step + rich history; DDX-12 composite orchestration; **DDX-18 auth/db/kv/storage sections + per-capability depth (rich config tabs, dual histories, capability-specific composed blocks); DDX-19 codegen-from-UI (⇄ #238 AI-on-codegen); third-party panel ecosystem + in-dashboard marketplace; schema-driven db tab (Prisma-Next-gated); tokens/API-keys + Dev Keys panel;** MCP-content panel (if adopted); saved views/prefs |

## Owner-facing forks (carry to ratification)

1. **`0.0.1-beta.6` milestone must be created** before issue-filing (AGENTS milestone obligation;
   Stage-C fork 1). Same for beta.7 (Topic C/D).
2. **`epic:dev-dashboard` label** must be added to `.github/labels.yml` (netscript-pr: add-first,
   never delete-live). **Same file is currently missing the entire `wave:*` block** (F1-05): add
   `wave:v1`, `wave:v1-min`, `wave:defer` before filing — every draft here uses `wave:v1`/`wave:defer`.
   `wave:v2` is **not** canonical and has been removed from the drafts.
3. **Cross-epic co-land contract with `telemetry-revamp`** — DDX-8's flagship trace depends on
   telemetry's streams fan-in span-links + triggers W3C-parenting bugfix landing at beta.6. Confirm
   the two epics are scheduled to co-land, not sequenced.
