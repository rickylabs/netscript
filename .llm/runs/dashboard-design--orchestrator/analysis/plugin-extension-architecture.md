# Dynamic Plugin/Extension System — Architecture Proposal (Axis 6)

> Naming note: `playground-ref` and `chat-ref` are aliases for the two internal reference
> apps (mapping known to the owner). Aliased here so this analysis can live on a public repo;
> never expand these aliases in owner-facing design-prompt text.

> Dashboard-design revamp run, plugin-system investigation slice. Analysis only — no product
> code changed. Grounds the Axis-6 brief (`../improvement-brief.md`) and the S5/home
> "contributed panels" seeds (`../screen-catalog.md`) in the existing plugin system and the
> prior A-dashboard architecture (`.llm/runs/plan-roadmap-expansion--seed/design/A-dashboard/
> proposal.md` §9, `…/analysis/A-dashboard/04-plugin-archetype-grounding.md`), and in four
> external extension models (TanStack Devtools, Nuxt DevTools, Directus, Medusa). Sections 1–5
> are the architecture; §6 is the numbered list of UI surfaces the Claude Design prompts must
> showcase. Milestone tags: **[beta.10]** vs **[stable]** throughout.

## 0. Headline

The missing seam is a **frontend contribution contract family** owned by
`packages/plugin-dashboard-core` (never by `@netscript/plugin` — thinness law), discovered the
same way `AspireNSPluginContribution` and `netscript generate plugins` registries already work
(build-time generated registry from plugin manifests, not runtime mutation), rendered through
a **trust-tiered host** (first-party = islands; third-party = sandboxed iframe panels with a
postMessage RPC bridge, Nuxt/Directus precedent), versioned by an explicit
`contributesTo: { dashboard: 'v1' }` contract-version handshake surfaced as the same
version-drift row S5 already designs. The *second half* of the story — a plugin contributing
to the USER'S app frontend (generate files, wire config, add deps) — is not a new engine: it
is the existing `createPluginAdapter(...).toScaffold()` + `PluginResource` scaffolder surface
(`packages/plugin/src/adapter/contract.ts`), exposed in the dashboard as the Axis-3 writes
story (one generator, two callers — DDX-19 #432).

---

## 1. Contracts — the contribution contract family

### 1.1 Where contracts live and the idiom they follow

All contribution contracts live in `packages/plugin-dashboard-core/contracts/v1/` as
Standard-Schema-shaped types + schemas, published on the package's `contracts/v1` subpath
(`gate:jsr`, per #427 acceptance). They follow the `BasePluginContract` idiom
(`packages/plugin/src/contract-base/domain/base-contract.ts`): real typed seams, schema-first,
re-exported (never redefined) by contributing plugins. `@netscript/plugin` gains **no**
dashboard-coupled axis; optional `.withDashboardPanel()`/`.withDashboard()` sugar is a thin
helper at the plugin's own layer that *produces* these contracts (prior proposal §9.2, ADOPT
verdict — unchanged here, extended to a family).

### 1.2 The family

One discriminated union, seven members. Every member shares a base:

```ts
// plugin-dashboard-core/contracts/v1/contribution.ts  (sketch — shapes, not final)
export interface DashboardContributionBase {
  /** Stable id, namespaced by plugin: 'crons/next-fires'. */
  readonly id: string;
  readonly title: string;
  readonly icon?: string;                    // fresh-ui icon name
  /** Which capability section hosts it (workers|sagas|triggers|streams|auth|<plugin-id>). */
  readonly capability?: string;
  /** Contract version handshake — the ONLY compat gate (see §4). */
  readonly contributesTo: { readonly dashboard: 'v1' };
  /** Declared needs; drives permission prompt + sandbox policy (see §3). */
  readonly requires?: {
    readonly ports?: readonly string[];      // core ports: 'telemetry-query', 'runs', …
    readonly procedures?: readonly string[]; // own-contract oRPC procedures it calls
    readonly commands?: readonly string[];   // Aspire withCommand refs it may invoke
  };
}

export type DashboardContribution =
  | DashboardPanelContribution      // embeddable panel (home strip, section grids)
  | DashboardRouteContribution      // full page under /plugins/:pluginId/…
  | DashboardActionContribution     // ⌘K command + contextual action
  | DashboardAiToolContribution     // contract procedure exposed as an agent tool
  | DashboardNavContribution        // sidebar node under a capability group
  | DashboardEntityTabContribution  // extra tab on an entity-detail screen
  | DashboardHomeCardContribution;  // stat/summary card on the wiring home
```

Per-member sketches (each `kind`-discriminated):

```ts
/** DDX-17 (#427) — unchanged shape, extended with sandbox/provenance fields. */
export interface DashboardPanelContribution extends DashboardContributionBase {
  readonly kind: 'panel';
  /** Island entrypoint (first-party trust tier) OR iframe entry html (third-party). */
  readonly component: string;
  readonly slots?: { options?: string; sidebar?: string; actions?: string };
  /** Data wiring against core ports — runs host-side, never in the sandbox. */
  readonly setup?: (ctx: PanelSetupContext) => PanelDataBinding;
  readonly commands?: readonly string[];           // withCommand refs rendered as actions
  readonly injectionZones?: readonly InjectionZone[]; // where it may ALSO embed (Medusa model)
}

export interface DashboardRouteContribution extends DashboardContributionBase {
  readonly kind: 'route';
  /** Mounted under the plugin's namespace: /plugins/:pluginId/<path>. Deep-linkable (Axis 2). */
  readonly path: string;                            // e.g. 'crons/calendar'
  readonly component: string;
  readonly nav?: { group: string; order?: number }; // auto sidebar entry (Medusa routes model)
}

export interface DashboardActionContribution extends DashboardContributionBase {
  readonly kind: 'action';
  readonly command: string;                         // ⌘K label: 'Backfill cron window…'
  /** Contexts where it also appears as a contextual action (entity kinds / routes). */
  readonly contexts?: readonly string[];            // ['trigger-detail', 'dlq-message']
  /** Confirm-gated execution: an oRPC procedure ref or an Aspire command ref. */
  readonly invoke: { procedure: string } | { aspireCommand: string };
  /** MANDATORY NetScript signature: exact CLI equivalent printed in the confirm dialog. */
  readonly cliEquivalent: string;
}

export interface DashboardAiToolContribution extends DashboardContributionBase {
  readonly kind: 'ai-tool';
  /** oRPC contract procedure exposed to the AI console's tool registry (Axis 5). */
  readonly procedure: string;                       // 'crons.nextFires'
  readonly description: string;                     // tool description for the model
  readonly readOnly: boolean;                       // writes require the action confirm flow
}

export interface DashboardNavContribution extends DashboardContributionBase {
  readonly kind: 'nav';
  readonly group: 'console' | 'consoles' | 'data' | string;
  readonly route: string;                           // ref to a route contribution id
  readonly order?: number;
}

export interface DashboardEntityTabContribution extends DashboardContributionBase {
  readonly kind: 'entity-tab';
  /** Which entity detail it extends — the routing hierarchy's entity kinds (Axis 2). */
  readonly entity: 'run' | 'saga' | 'job' | 'trigger' | 'stream' | 'plugin' | 'flow';
  readonly component: string;
  /** Tab receives the entity's correlation id — the spine is the data contract. */
}

export interface DashboardHomeCardContribution extends DashboardContributionBase {
  readonly kind: 'home-card';
  /** Card feeds ONE only-NetScript fact + deep-link, matching DDX-5 stat-card law. */
  readonly stat: { procedure: string; deepLink: string };
}
```

**Injection zones** (Medusa's strongest idea, already cited by #427): a published, versioned
enum of named zones — `home.after-kpis`, `home.contributed-strip`, `plugin.detail.before-doctor`,
`entity.<kind>.detail.sidebar`, `flows.seam-detail.footer`, … — that panel contributions may
target. Zones are part of the v1 contract surface, so adding zones is additive (minor) and
removing/renaming one is breaking (§4). The S5 contribution-axis map (`ns-axismap`) gains a
frontend axis per contribution kind, and the injection-zone inspector (§6.3) makes zones
visible/debuggable.

### 1.3 Sugar at the plugin layer

```ts
// plugins/crons/src/public/mod.ts — authoring ergonomics, still just the contract
export const cronsPlugin = definePlugin('@acme/plugin-crons', VERSION)
  .withType('utility')
  .withService(…)
  .build();

// plugins/crons/dashboard/mod.ts — the discovered contribution module (see §2)
export const dashboard = defineDashboardContributions({
  contributesTo: { dashboard: 'v1' },
  panels: [nextFiresPanel], routes: [calendarRoute],
  actions: [backfillAction], aiTools: [nextFiresTool],
});
```

`defineDashboardContributions` is exported by `@netscript/plugin-dashboard-core/contracts/v1` —
depending on it is the plugin's opt-in; core `definePlugin` never learns the vocabulary.

---

## 2. Discovery — generated registry, not runtime mutation

### 2.1 Reconcile with what exists

Three discovery mechanisms already exist and the design reuses two:

1. **Manifest** — `plugins/*/scaffold.plugin.json` (verified: `plugins/streams/scaffold.plugin.json`
   has `schemaVersion`, `capabilities`, `scaffolder.export`, `provider.kind`). Extend the schema
   with a `dashboard` block: `{ "dashboard": { "export": "./dashboard", "contractVersion": "v1",
   "trust": "third-party" } }`. The manifest is the *pointer + static facts* (cheap to read at
   install/doctor time without executing plugin code), mirroring how `scaffolder.export` points
   at the scaffold entrypoint today.
2. **Generated registry** — `netscript generate plugins`
   (`packages/cli/src/public/features/generate/plugins/generate-plugin-registries-command.ts`)
   already walks project source with SDK Walker/Extractor/Emitter ports and writes registries
   under `.netscript/generated/`. Dashboard contributions become **one more emission**: a
   `dashboard-contributions.ts` registry module importing every installed plugin's `dashboard`
   export and emitting a typed `DashboardContributionRegistry`. Regenerated by `plugin add`
   (which already runs post-scaffold wiring — `04-plugin-archetype-grounding.md` §4) and by
   `netscript generate plugins`. This mirrors `AspireNSPluginContribution` discovery exactly, as
   #427 requires.
3. **Runtime registration** — rejected as the primary path (no `registerPanel()` global at app
   startup). Runtime mutation would defeat type-checking the registry, break the generated-
   workspace `deno check` gate, and make provenance/permissions unauditable. The ONE runtime
   element kept: the dashboard service reads the generated registry at boot and serves it via a
   `GET /contributions` oRPC route (extends the `DashboardContract` table in the prior proposal
   §1.3) so the UI, the doctor, and the AI tool registry consume one source of truth.

### 2.2 Flow

```
plugin add @acme/plugin-crons
  → JSR resolve → read scaffold.plugin.json (dashboard block present)
  → plugin's own scaffolder runs (createPluginAdapter(...).toScaffold())
  → post-scaffold wiring (existing) + regenerate dashboard-contributions registry (new emission)
  → deno check of generated workspace (existing gate) — a type-broken contribution FAILS INSTALL
  → dashboard hot-reloads registry → panel appears with provenance chip + permission prompt (§3)
```

Uninstall reverses it; `plugin doctor` gains a `dashboard` check (contract-version handshake,
zone validity, component entry resolvable) via the existing `DoctorCheckSpec` seam
(`packages/plugin/src/adapter/contract.ts`). **[beta.10]** = manifest block + registry emission +
`/contributions` route. **[stable]** = marketplace-sourced discovery (Directus model) where the
registry read happens against a remote index before install.

---

## 3. Sandboxing — trust tiers, staged

### 3.1 What the references do

- **Nuxt DevTools**: module tabs are either lightweight declarative views or **iframes** owning
  their own page, talking to the host over an RPC bridge (birpc over WebSocket/postMessage);
  the host provides a UI kit so iframe tabs still look native.
- **Directus**: app extensions (panels/modules) run same-window Vue components — but API
  extensions run in **isolates with explicit `permissions` declared in package.json**, and the
  marketplace only lists sandboxed extensions by default. Trust is a spectrum, enforced at the
  registry.
- **TanStack Devtools**: same-window panels wired to a framework-agnostic **event bus** — the
  contribution never touches host internals directly; all data flows through named events.
- **Medusa**: no sandbox — widgets/routes are compiled into the admin bundle at build time;
  safety comes from the build step and code review, not isolation.

### 3.2 NetScript trust model (staged recommendation)

| Tier | Who | Render | Data path | Milestone |
|---|---|---|---|---|
| T0 first-party | `@netscript/plugin-*` | Fresh **island**, same window, composes fresh-ui L3 blocks | direct core-port bindings via `setup()` | **[beta.10]** |
| T1 verified third-party | signed/marketplace-listed | island, same window, but data ONLY through the event-bus/port bindings declared in `requires` (TanStack discipline) | mediated | **[stable]** |
| T2 unverified third-party | any JSR package | **sandboxed iframe** (`sandbox="allow-scripts"`, no same-origin), served from the plugin's own service route; postMessage RPC bridge exposes exactly the `requires`-declared procedures; host renders the chrome (title bar, provenance chip, actions) | mediated + prompted | **[stable]** (design shown now) |

Key law: **`setup()` data bindings and command invocation always execute host-side.** A T2 panel
never holds credentials; it receives data frames and posts intents; every write intent still
routes through the confirm-with-CLI dialog rendered BY THE HOST (a sandboxed panel cannot fake
or suppress the confirm). Permission prompt at install/first-render enumerates `requires.*`
(Directus-style manifest permissions), and the grant is recorded per plugin — visible in the
extension manager (§6.1) and revocable. Server-rendered (no-JS) contributions are a free T0
subset: a panel whose `component` is a plain Fresh route partial — cheapest possible authoring.

**Why not iframe-everything at beta.10:** the dashboard's own four capability sections dogfood
the seam (#427/#415 acceptance) and are first-party; iframe overhead + RPC bridge is real
engineering that pays off only when unverified code exists. The DESIGN however shows all three
tiers now (Axis 1 — final product), especially the T2 chrome.

---

## 4. Versioning — the handshake and the drift row

1. **Contract version**: `contracts/v1` is the published subpath; contributions declare
   `contributesTo: { dashboard: 'v1' }`. The dashboard host supports a declared window of
   contract versions (v1 only at beta.10). Additive evolution (new zones, new optional fields,
   new union members) stays within v1; breaking changes cut `contracts/v2` and the host runs
   both during a deprecation window (Directus's extension-host versioning, done the JSR way —
   versioned subpaths instead of a runtime shim).
2. **Compat gates**: (a) install-time — registry regeneration type-checks the contribution
   against the host's contract types, so an incompatible plugin fails `plugin add` with a real
   diagnostic, not a blank panel; (b) doctor — the dashboard `DoctorCheckSpec` re-validates
   handshake + zones on every `plugin doctor`; (c) render-time — unknown/failed contributions
   render a **quarantined panel state** (provenance chip + "contract v2 required, host has v1" +
   the fix CLI line), never a crash of the host shell.
3. **Drift surfacing** ties directly to the S5 version-drift row (installed → latest JSR via
   `deps:latest`, #420): the extension manager shows THREE version facts per plugin — package
   drift (installed vs latest JSR), **contract drift** (contributesTo vs host window), and peer
   drift (`peerDependencies.@netscript/plugin` vs workspace, already in scaffold.plugin.json).
   Each drifted row carries its remediation CLI (`netscript plugin update <id>`).
4. **[stable]**: marketplace listings filter by host-contract compatibility before install
   (Directus marketplace precedent), so drift becomes rare instead of merely visible.

---

## 5. Frontend contribution to USER apps — the second half

A plugin must also be able to contribute to any existing frontend app in the user's workspace:
generate files (routes/islands/components), wire config, add deps. **This engine exists.**

- `PluginAdapter.toScaffold()` (`packages/plugin/src/adapter/contract.ts:305-309`) already
  turns a `NetScriptPlugin` into a `ScaffolderContext → ScaffoldResult` scaffolder; `InstallSpec`
  already carries `dependencySpecifier` (add deps), `configParams` (wire config), `wiringEntry`
  (generated host wiring), and `starterResources` (generate files via `ItemScaffolder`s — #157
  typesafe factory/AST codegen, never string templates).
- The gap is **target selection**: today scaffolders emit into the workspace root/plugin
  workspace; the frontend-contribution seam adds an `AppTarget` to `ScaffolderContext`
  (`{ app: 'apps/web', framework: 'fresh' }`) so a `PluginResource` can declare
  `target: 'frontend'` resources — e.g. a `crons` plugin shipping a drop-in
  `<CronCalendarIsland/>` + its route + the client-SDK wiring into the user's chosen app.
  Resolution of eligible apps reuses workspace-member enumeration the installer already does
  (`ensureWorkspaceMember`). **[beta.10]** = the `AppTarget` seam + first-party proof (one
  plugin shipping one frontend resource); **[stable]** = multi-framework adapters beyond Fresh.
- **Dashboard exposure (the Axis-3 writes story, DDX-19 #432):** the dashboard's "Add to app"
  flow is a SECOND CALLER of the same scaffolder — template gallery → pick target app → preview
  the exact file list (`ScaffoldResult` is data, so a dry-run diff preview is free) → confirm
  dialog printing `netscript plugin resource add crons calendar --app apps/web` → generated
  files byte-identical to the CLI path (Strapi parity bar, #432 acceptance). The same preview
  surface serves dashboard-panel scaffolding: "Develop your panel" (§6.7) scaffolds a
  contribution skeleton via `netscript plugin new --with dashboard-panel`.

Layering note: nothing here touches `@netscript/plugin` beyond the additive `AppTarget` on
`ScaffolderContext` (a `packages/plugin/src/scaffold` change — WSL Codex framework slice, per
CLAUDE.md lane rules; this document only specifies it).

---

## 6. What the DESIGN must show (input to the Claude Design prompts)

Numbered, concrete, all rendered as FINAL product (Axis 1 — no gating prose):

1. **Extension Manager** (evolved S5): plugin table with per-plugin contribution-axis map
   (`ns-axismap` gains frontend axes: panels/routes/actions/AI-tools/nav/tabs/home-cards),
   trust-tier badge (first-party / verified / sandboxed), THREE-fact version block (package,
   contract, peer drift) each with remediation CLI, doctor rows including the new `dashboard`
   check, granted-permissions list with revoke.
2. **Marketplace-lite "Add plugin"** (#420 manage loop): browsable gallery (installed/available,
   compat-filtered), install flow = confirm + `netscript plugin add <id>` CLI line, post-install
   toast deep-linking to the newly contributed surfaces ("crons added 2 panels, 1 route,
   3 ⌘K actions — view").
3. **Injection-zone inspector**: a dev overlay toggle that outlines every zone on the current
   screen with its zone id + occupancy ("home.after-kpis — 1/3 slots, crons/next-fires"), and a
   zone-map screen listing all zones → contributions → provenance. This is the debuggability
   surface none of the four references ship well (Medusa zones are docs-only) — a differentiator.
4. **Provenance chips everywhere**: every contributed panel/tab/card/action carries a compact
   chip (plugin icon + id + trust tier); clicking opens the extension-manager detail. The home
   "Contributed panels" strip becomes live zone `home.contributed-strip` with these chips.
5. **Permission prompt + sandboxed-panel chrome**: first-render prompt enumerating
   `requires.ports/procedures/commands` with allow/deny; T2 panels render inside host chrome
   (title bar, chip, "sandboxed" glyph); a **quarantined state** for contract-drifted or
   crashed panels (panel-shaped error card with fix CLI, host shell unaffected).
6. **Contributed ⌘K actions + contextual actions**: palette section "From plugins" with
   provenance; entity-detail contextual action rows; every invocation lands in the standard
   confirm-with-CLI dialog (host-rendered even for sandboxed contributors).
7. **"Develop your panel" DX loop**: scaffold-from-UI entry (template gallery →
   `netscript plugin new --with dashboard-panel` CLI line), then a dev-mode panel slot showing
   the local contribution hot-reloading (badge: "dev · watching plugins/my-panel"), with an
   inline contract-validation lint strip (zone valid, schema valid, requires declared) — the
   Nuxt-DevTools-grade authoring loop.
8. **Entity-tab + home-card contributions in situ**: one entity detail (e.g. a trigger firing)
   showing a third-party tab alongside first-party tabs, and the wiring home showing a
   contributed stat card that deep-links into a contributed route — proving the routing
   hierarchy (Axis 2) namespaces plugin routes (`/plugins/crons/calendar`).
9. **AI tool registry with contributed tools** (Axis 5 tie-in): the AI console's tool list
   showing first-party + plugin-contributed tools with provenance chips and read/write badges;
   a transcript where the agent calls a contributed tool.
10. **Frontend "Add to app" flow** (Axis 3 tie-in): pick resource template → pick target app →
    file-diff preview (exact generated file list) → confirm with CLI equivalent → success state
    linking the generated files — the visible proof of the one-generator-two-callers law.

## 7. Milestone split (summary)

**[beta.10]**: contract family v1 (panel/route/action/ai-tool/nav/entity-tab/home-card) in
`plugin-dashboard-core/contracts/v1`; manifest `dashboard` block; registry emission in
`generate plugins` + `/contributions` route; T0 island rendering + zones; version handshake +
doctor check + quarantined state; `AppTarget` scaffolder seam with one first-party proof;
dashboard second-caller scaffold flows (#432 elevated). **[stable]**: T1/T2 sandbox runtime
(iframe + RPC bridge), marketplace with compat filtering, signing/verification, contracts/v2
window machinery, multi-framework frontend targets. The DESIGN shows all of it as shipped.

---

## Appendix A — External models studied (mechanism notes + sources)

Verified 2026-07-12 against current docs; each row is (contract · discovery · isolation ·
comms · versioning).

**TanStack Devtools** (`@tanstack/devtools`, 0.12.x) — `TanStackDevtoolsPlugin`
`{ name, id?, defaultOpen?, render(el, props), destroy? }`: contribution gets a bare
`HTMLDivElement` (framework adapters allow JSX via portal). Discovery is a pure runtime
`plugins: []` array on the devtools core — no manifest, no registry. No isolation (same-window
Solid shell). Comms: typed `EventClient<TEventMap>` — events namespaced
`'${pluginId}:${suffix}'` over window `CustomEvent`s, optional WebSocket/SSE bridge to a
dev-server bus. Versioning: none (0.x); prod safety via a no-op client outside
`NODE_ENV=development`. Docs: https://tanstack.com/devtools/latest/docs/plugin-configuration ,
https://tanstack.com/devtools/latest/docs/event-system .
→ **Taken:** the namespaced-event/mediated-data discipline (our T1 tier + host-side
`setup()` bindings). **Rejected:** runtime-array registration (untyped, unauditable — §2.3).

**Nuxt DevTools** — `ModuleCustomTab { name, title, icon?, view, category? }` with
`view: { type: 'iframe', src, permissions? } | { type: 'launch', actions } | vnode`; "the only
way to contribute to the DevTools view is via iframe". Discovery: modules call
`addCustomTab()` / hook `devtools:customTabs` at dev time. Comms: birpc three-way (devtools app
⇄ dev server ⇄ browser client), `extendServerRpc<ClientFns, ServerFns>('namespace', …)` +
`useDevtoolsClient()` in the iframe; a shared TS interface file IS the channel contract.
Versioning: informal (kit-as-dependency convention; iframe boundary decouples UI stacks).
Docs: https://devtools.nuxt.com/module/guide , https://devtools.nuxt.com/module/utils-kit .
→ **Taken:** iframe + typed RPC bridge as the T2 sandbox mechanism; the launch/lazy-start
pattern for heavy panels; a host UI kit so sandboxed panels still look native (fresh-ui flat
CSS served to the iframe). **Rejected:** iframe-only for ALL contributions (kills the
first-party island dogfood).

**Directus extensions** — taxonomy interface/display/layout/panel/module (app) +
hook/endpoint/operation (API) + bundle. `definePanel({ id, name, icon, component, minWidth,
minHeight, options, preview })`; `defineModule({ id, name, icon, routes, preRegisterCheck })`.
Discovery: npm packages with a `directus:extension` package.json manifest
(`type/path/source/host`) + `EXTENSIONS_PATH` folder. Isolation: app extensions same-window
Vue; API extensions opt into **V8 isolates** with manifest-declared `requestedScopes`
(`request.methods/urls`, `log`, `sleep`); the marketplace lists only app + sandboxed API
extensions by default. Comms: props/composables (`useApi()`, `useStores()`) app-side;
capability imports from a virtual `directus:api` module in the sandbox. Versioning:
`host` minimum-semver field + marketplace compat gating. Docs:
https://directus.com/docs/guides/extensions/overview ,
https://directus.com/docs/guides/extensions/api-extensions/sandbox .
→ **Taken:** manifest-declared permissions (`requires` block, §1.2/§3.2), host-version
handshake surfaced as drift (§4), marketplace-gates-on-sandbox (T2 listing rule),
options-schema-driven panel config. **Adapted:** their `host` semver becomes an explicit
contract-version handshake on a JSR-versioned subpath (stronger than semver-range matching,
whose `^` caveat bit Directus).

**Medusa admin extensions** — widgets: a `.tsx` default-export component +
`export const config = defineWidgetConfig({ zone, id? })`; zones are a published string enum
(`product.details.before`, `order.details.side.after`, …:
https://docs.medusajs.com/resources/admin-widget-injection-zones); UI routes are file-based
(`src/admin/routes/<path>/page.tsx` + `defineRouteConfig({ label, icon })`). Discovery:
build-time file convention compiled into the admin SPA; plugins ship the same tree and can
declare NEW zones for others to target. Isolation: none (same React tree, host UI kit).
Comms: typed props (`DetailWidgetProps<AdminProduct>`) + JS SDK. Versioning: build-time TS
against framework types only. Docs:
https://docs.medusajs.com/learn/fundamentals/admin/widgets ,
https://docs.medusajs.com/learn/fundamentals/admin/ui-routes .
→ **Taken:** the published injection-zone enum + entity-detail typed props (our entity-tab
contract passing the correlation spine) + file/registry build-time compilation into a
type-checked bundle (our generated-registry `deno check` gate is exactly Medusa's build-time
compat model, made explicit). **Improved on:** zones are docs-only in Medusa — we ship the
injection-zone inspector (§6.3); Medusa has no permission or provenance story — we add both.

**Cross-cutting synthesis** (why the §0 headline shape): registration hardens left-to-right
across the four (runtime array → dev-time hook → package manifest → build-time convention);
NetScript takes the hard end (manifest + generated, type-checked registry) because `generate
plugins` already works that way. Isolation: only Directus has a permissioned sandbox and only
Nuxt has a UI isolation boundary — combining them (manifest permissions + iframe/RPC for
untrusted tier) is the T2 design. Compat: only Directus has an explicit host contract; our
`contributesTo` handshake + drift row generalizes it.
