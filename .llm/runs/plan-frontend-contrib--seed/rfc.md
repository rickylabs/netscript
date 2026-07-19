# RFC — NetScript Frontend Contribution Layer: plugins that ship UI

> **AUTHORITY BANNER (2026-07-19): the board is FILED — GitHub wins on conflict.** Epic **#922**,
> children **#923–#946** (FCB-1..24 mapping in `FILING-LOG.md`). The FCB-n / FCL-EPIC tags below
> are the planning record, not the live board.

| | |
| --- | --- |
| **Status** | **Proposed** — full pipeline complete (generator → GPT-5.6 Sol·high adversarial, 20/20 integrated → Kimi K3 docs story, 17/17 integrated → rev 3); board filed under owner authorization (2026-07-19); forks (§9) still open for arbitration |
| **Tracking** | Refs #427 (dashboard panel seam) · #432 (add-to-app scaffold flow) · #400 (dev-dashboard epic, beta.13) · **Epic #922, children #923–#946** (`FILING-LOG.md`) · sibling RFC: deploy-plugin lane (#891, epic #892) |
| **Run record** | `.llm/runs/plan-frontend-contrib--seed/` — research, plan (D1–D16 / forks), canonical design 00–06, 4 worked examples, docs-story forecast, both review-triage records |
| **Evidence base** | Upstream verified in-source: `App.mountApp` (@fresh/core 2.3.3 app.ts:357), `Builder.registerIsland` (dev/builder.ts:157), `fresh({ islandSpecifiers })` (@fresh/plugin-vite 1.0.8 mod.ts:211-214); repo precedent: axis registry emitter, `scaffolder.export` pointer, fresh-ui copy-registry + `--ns-*` tokens, ai chat-route scaffolder; prior art: `dashboard-design--orchestrator/analysis/plugin-extension-architecture.md` |

---

## Abstract

Today a NetScript plugin contributes services, workers, schemas, streams, migrations, and Aspire
wiring — but **not one pixel of frontend**. There is no `.tsx` under `plugins/`, the scaffolded
app's nav is a hardcoded array, and four announced features are blocked on the same missing axis:
the **dev dashboard** (plugin panels), **auth** (sign-in, session, org UI), **ai** (chat and
distributed assist surfaces), and the new **deploy plugin** (cloud consoles + cloud-first
scaffold seams).

This RFC makes a plugin a **full-stack unit**:

```
plugins/crons/frontend/        # ordinary Fresh code: routes/, islands/, components/, theme.css
  mod.ts                       # one defineFrontend() declaration — the whole contract
netscript plugin install @acme/plugin-crons
  → /crons/calendar serves · nav entry appears · dashboard panel renders · island hydrates
  → zero app edits
```

Contributions are **data** (schema-first contracts in `@netscript/plugin-frontend-core`),
discovered like every existing axis (manifest pointer + generated, type-checked registry in
`.netscript/generated/`), and mounted through thin wrappers over upstream Fresh 2.3 primitives
that already exist. Two delivery models are first-class: **live** (package-served, versioned —
consoles, panels, widgets) and **scaffolded starter** (app-owned, customizable — sign-in pages,
cloud-first seams). The dev dashboard's ratified 7-kind contribution family becomes a sibling
payload family on the same envelope — one discovery pipeline, many hosts.

## 1. Motivation

| Today | Consequence |
| --- | --- |
| No frontend axis in `PluginContributions`; `PluginType 'frontend'` is an inert enum | A "frontend" plugin cannot ship frontend |
| Scaffolded nav/panels are hardcoded arrays in templates | Installing a plugin changes nothing visible; every surface is app-maintained |
| fresh-ui is copy-only; islands are discovered only in the app's `islands/` dir | Plugin UI has no delivery path at all — the ai plugin resorts to scaffolding a stub `chat.tsx` into the app |
| The dashboard extension architecture (beta-10) was designed dashboard-only and never built | Each future host would re-invent discovery, versioning, and trust |

The blocked consumers are not hypothetical: auth has a complete oRPC surface
(`signin/callback/signout/session/me`) with zero UI; ai has a durable-chat runtime plane
(`@netscript/fresh/ai`) with only a scaffold-time stub; the deploy redirect explicitly demands
"contribute to every layer (even frontend soon)"; the dashboard epic (#400, beta.13) needs the
seam this RFC generalizes.

## 2. The proposed decision and its rationale

**Decision (D1–D16, locked at generator level and twice-reviewed):** build one host-agnostic
frontend contribution layer with these load-bearing choices —

1. **Contract-first, framework-free vocabulary.** New Archetype-1 package
   `@netscript/plugin-frontend-core` holds serializable types + schemas only (no fresh/preact
   deps); all runtime helpers live in `@netscript/fresh/plugins`. *Rationale:* keeps the
   registry statically emittable and the contracts JSR-clean; enforced by the adversarial pass
   (S-5).
2. **Envelope + family versioning.** A stable `FrontendManifestEnvelope` carries
   `(family, major)`-versioned payloads; the `app` family v1 has five kinds (route / island /
   zone / nav / theme); the dashboard family is a sibling payload, not a widened union.
   *Rationale:* adding union members breaks strict old validators — the naive "additive union"
   was disproved in review (S-7).
3. **Pointer-thin core.** `@netscript/plugin` learns only
   `.withFrontend({ export, framework })`; the handshake is derived from the module at generate
   time. *Rationale:* resolves the long-open OQ-12 thinness tension with zero core vocabulary
   and no dual source of truth (K-10).
4. **Generated registry, never runtime mutation.** `netscript generate plugins` emits a
   transactional replace-set (`frontend.registry.ts`, `frontend.islands.ts`,
   `frontend.routes.ts`, `frontend.css`, `frontend.gateway.ts`, `frontend.check.ts`) — staged,
   type-checked (the check module imports every referenced module), atomically swapped;
   deterministic empty emissions make removal clean. *Rationale:* mirrors the shipped per-axis
   emitter; the check module gives the install gate real teeth (S-11).
5. **Wrap upstream, don't reinvent.** Routes mount as lazy sub-Apps via `App.mountApp` in a
   post-fsRoutes composition phase with generated literal loaders + a route-module normalizer;
   islands register by module specifier on both build paths; nav feeds the existing
   `SidebarShell` model; theming is `--ns-*` tokens under a host-owned CSS layer order.
   *Rationale:* every primitive verified in upstream source; the ordering and normalization
   subtleties were review findings (S-1, S-2) and are Wave-0 proofs before contracts freeze.
6. **A deny-by-default procedure gateway, not a proxy.** Client-side data access goes through a
   generated route table derived from `requires.procedures` × the plugin's contract metadata —
   no wildcard forwarding, server-side auth, no blind credential forwarding, streaming only
   where declared. *Rationale:* a generic forwarding proxy is a confused-deputy surface (S-6);
   the shipped AI stream proxy shows the safe pattern.
7. **Two delivery models with a rule.** If the user will edit it, scaffold it (starter via a new
   `AppTarget` on `ScaffolderContext` — the existing `toScaffold()` engine); if the plugin owns
   it, serve it live. Starters never fabricate backend surface (S-13 law).
8. **Honest trust and containment.** App surface is T0 (installed plugins already run server
   code); containment = host-side data-phase catch + client boundaries + route `onError`; SSR
   render throws are documented page failures, not false "isolation" (S-4). Dashboard T1/T2
   iframe tiers remain the dashboard epic's scope.
9. **DX is the bar.** The authoring surface (one `defineFrontend`, ordinary Fresh files, string
   label shorthands, contract defaulting, tooling-owned export maps, `netscript plugin dev`)
   was fixed first and defended through both review passes; a docs-forecast stage (Kimi K3)
   wrote the public guide + references against the API and its 17 findings were folded back in.

## 3. Public API design (implementation-level)

### 3.1 What a plugin author writes

```ts
// plugins/crons/frontend/mod.ts — the whole declaration
import { defineFrontend } from '@netscript/plugin-frontend-core';

export default defineFrontend({
  // contract defaults to { family: 'app', major: 1 }
  pluginKind: 'crons',
  base: '/crons',
  routes: [{
    kind: 'route', id: 'calendar', path: '/calendar', module: './routes/calendar.tsx',
    nav: { label: 'Cron calendar', icon: 'calendar', group: 'main' },  // string → MessageRef
  }],
  islands: [{ kind: 'island', id: 'cron-calendar', module: './islands/CronCalendar.tsx' }],
  zones: [{ kind: 'zone', id: 'next-fires', zone: 'app.dashboard.panels', module: './components/NextFiresCard.tsx' }],
  theme: { kind: 'theme', id: 'theme', css: ['./theme.css'] },
  requires: { procedures: ['crons.list', 'crons.nextFires'] },
});
```

```ts
// plugins/crons/src/public/mod.ts — one added builder call
.withFrontend({ export: './frontend', framework: 'fresh' })
```

Pages/islands are ordinary Fresh modules; islands are imported and rendered directly (the build
registers their specifiers); `definePluginPage` (from `@netscript/fresh/plugins`) types
`ctx.host` / `ctx.client` / `ctx.redirect`; `pluginApi(ctx.client)` returns the plugin's gateway
base (`/api/plugins/<mountId>` — a pinned contract constant).

### 3.2 Contract surface (`@netscript/plugin-frontend-core/contracts/v1`)

- `FrontendManifestEnvelope` `{ contract: FamilyRef, pluginKind, base?, contributions,
  requires?, budgets? }`; multi-family = an array of envelopes.
- `app` family kinds: `RouteContribution` (literal-loader mounted, `_layout` rejected v1),
  `IslandContribution` (serializable props law), `ZoneContribution`, `NavContribution`
  (discriminated `route`/`href`/`external` targets, MessageRef labels), `ThemeContribution`
  (one per plugin, `--ns-*` only).
- **Identity quartet**: `packageName` / `pluginKind` / `installationId` / `mountId` — all
  generated keys (base path, CSS scope, gateway prefix, route-ref namespace) derive from
  `mountId`.
- **`HostSurfaceDescriptor`**: hosts publish zones, nav groups, reserved paths, and supported
  `(family, major)` windows; diagnoses distinguish unknown zone (error) vs known-but-unmounted
  (info) vs capacity-rejected vs quarantine (window mismatch / load failure).
- **Context split**: server `PluginRequestContext` (serviceUrl, principal *port*, CSP nonce,
  abort) vs serializable `PluginClientContext` (locale/direction/timeZone, subject summary,
  capabilities) — the island boundary is typed, not folklore.
- `./testing`: `defineFrontendTestSuite(manifest, options)` — schema, props round-trip, SSR,
  hydration, browser smoke, a11y, base-path, local+JSR modes; asserts the envelope's `budgets`.

### 3.3 Host wiring (scaffolded by default)

```ts
// app/main.ts
export const app = defineFreshApp<State>({ name: 'my-app', frontend: frontendRegistry });
// app/vite.config.ts
fresh({ islandSpecifiers: [...pluginIslandSpecifiers] })
// app markup
<PluginZone id='app.dashboard.panels' />
```

CLI: `plugin install/update/remove` regenerate transactionally; `plugin new --with frontend`
scaffolds the tree + exports; `netscript plugin dev` owns the watch/regenerate/reload loop;
`plugin doctor` prints the five-state diagnosis taxonomy; `plugin resource add <plugin>
<resource> --app <path>` lands app-owned starters; `generate frontend-wiring` adopts existing
apps idempotently.

### 3.4 Consumers (worked in the run's `design/examples/`)

| Consumer | v1 shape |
| --- | --- |
| Dev dashboard | workers/sagas/triggers/streams each ship a zone panel + console route into the *scaffolded app's* `/dashboard` now; the dashboard host later consumes the same registry under `/plugins/<mountId>` with its own family |
| Auth | live: `/auth/account` + topbar session widget over the real 5 procedures; starter: sign-in/callback pages; org console is gated on a named `auth-org` backend capability (does not exist yet — no invented APIs) |
| AI | live: durable-session chat route (specialized stream proxy, not the gateway) + assist launcher island behind a capability check; starter chat page remains the eject path |
| Deploy | core console publishes deploy-family zones; each target adapter contributes its own panels (core imports no target); cloud-first starters (`cloudflare-edge` etc.) via AppTarget |

## 4. Plan — waves and gates

**Wave 0 — five disposable proofs before any contract freezes** (the adversarial pass's central
demand): P1 mount ordering/layout/basePath · P2 literal loaders + route normalization · P3
dependency-island matrix (clean cache × local/JSR × dev/prod, Preact identity, CSS, edit loop) ·
P4 SSR containment fixtures · P5 gateway threat model + stream abort.

**Wave 1** — contracts + spine (envelope/schemas, identity, transactional emissions +
`frontend.check.ts`, mount glue, host descriptor, scaffold wiring, workers dogfood).
**Wave 1b** — the gateway (own reviewed wave). **Wave 2** — DX + lifecycle (`plugin new/dev`,
doctor taxonomy, quarantine states, AppTarget starters, test kit + budgets, adoption verb).
**Wave 3** — consumers (auth v1, ai chat, remaining panels; dashboard + deploy epics consume the
layer in their own runs).

Gates: per-archetype F-* columns + SCOPE-frontend browser gates; `deno task quality:scan` +
`arch:check` on every `packages/**`/`plugins/**` slice; the per-plugin test kit; extended
`scaffold.runtime` (install → render → hydrate → remove) at merge-readiness.

## 5. Proposed board (placeholders — NOT filed; filing is a later supervisor-coordinated step)

**Epic FCL-EPIC** — `Epic: Frontend contribution layer` · labels `type:umbrella`,
`epic:frontend-contrib`, `area:fresh`, `area:plugins` · milestone Backlog / Triage (owner
schedules later). Children (`[frontend-contrib S<n>] …`, each `Part of #FCL-EPIC`):

| ID | Wave | Slice |
| --- | --- | --- |
| FCB-1 | 0 | P1 proof: mounted sub-app ordering, layouts, basePath, two plugins |
| FCB-2 | 0 | P2 proof: literal lazy loaders + `normalizeFreshRouteModule` |
| FCB-3 | 0 | P3 proof: dependency-island build matrix (local/JSR, dev/prod, HMR, CSS, Preact identity) + plugin-vite pin policy |
| FCB-4 | 0 | P4 proof: SSR failure-containment fixtures |
| FCB-5 | 0 | P5 proof: gateway threat model + SSE abort/reconnect on one real procedure |
| FCB-6 | 1 | `@netscript/plugin-frontend-core` contracts/v1 (envelope, families, identity, schemas, `defineFrontend`) |
| FCB-7 | 1 | `@netscript/plugin` pointer axis (`.withFrontend`, manifest block, `CONTRIBUTION_AXES`) |
| FCB-8 | 1 | Registry emissions: transactional replace-set + `frontend.check.ts` + install/update/remove regeneration |
| FCB-9 | 1 | `@netscript/fresh/plugins`: composition phase, mount glue, normalizer, `PluginZone`, nav feed, `definePluginPage`/`pluginApi` |
| FCB-10 | 1 | Scaffold template wiring + `HostSurfaceDescriptor` + vite `islandSpecifiers` feed |
| FCB-11 | 1 | Workers dogfood: zone panel + console route + island |
| FCB-12 | 1b | Generated deny-by-default procedure gateway |
| FCB-13 | 2 | `plugin new --with frontend` (tree, manifest, seeded exports, `frontend_test.ts`) |
| FCB-14 | 2 | `netscript plugin dev` (watch, export-map maintenance, atomic regen, reload signal) |
| FCB-15 | 2 | Doctor `frontend` check + five-state taxonomy + orphan detection |
| FCB-16 | 2 | Quarantine render states + provenance chrome |
| FCB-17 | 2 | `AppTarget` on `ScaffolderContext` + `plugin resource add --app` |
| FCB-18 | 2 | `./testing` kit (`defineFrontendTestSuite`) + budgets enforcement |
| FCB-19 | 2 | `generate frontend-wiring` adoption verb for existing apps |
| FCB-20 | 3 | Auth v1 frontend (account route, session widget, starter signin/callback) |
| FCB-21 | 3 | AI frontend (durable chat route + specialized proxy, assist launcher) |
| FCB-22 | 3 | Sagas/triggers/streams dashboard-zone panels |
| FCB-23 | 3 | `auth-org` backend capability (prerequisite for the org console — contract + adapters) |
| FCB-24 | 3 | Convention generator (`generate frontend`) — file-tree → manifest lists |

## 6. Migration / supersession map (proposed dispositions — no closes in this RFC)

| Item | Disposition |
| --- | --- |
| #427 `DashboardPanelContribution` seam (DDX-17) | **KEEP, re-baseline**: the dashboard family becomes a sibling payload on this RFC's envelope; discovery/registry/doctor arrive from FCB-6/8 — the dashboard epic implements kinds + host, not pipeline |
| #432 add-to-app scaffold flow (DDX-19) | **KEEP, re-baseline**: its engine is FCB-17 (`AppTarget`); the dashboard "second caller" story is unchanged |
| Dev-dashboard epic #400 (beta.13) | **CONSUMER**: starts on this layer's pipeline + four dogfood panels instead of inventing discovery |
| Deploy lane (`plan/deploy-plugin`, sibling RFC) | **CONSUMER**: its frontend row = `defineFrontend` consoles + AppTarget cloud starters; adapter panels dogfood the zone mechanism |
| ai `chat-route` scaffolder | **REPOSITIONED**: remains as the starter/eject path; the live chat route (FCB-21) becomes the default |
| OQ-12 (core axis vs contract seam, roadmap-expansion A-dashboard) | **RESOLVED** by the pointer-axis decision (§2.3) |
| Prior-run arch-debt `generated-ts-frontend-react-reference` | Expected fix-adjacent in Wave 1 template work; verified by the extended `scaffold.runtime` gate |
| Existing apps (already scaffolded) | Non-breaking: layer arrives via `generate frontend-wiring` (idempotent opt-in); new scaffolds get it by default |

## 7. Security model (summary)

T0 trust on the app surface (installed plugins already execute server-side); the gateway is the
only client-reachable data path — deny-by-default generated routes, server-side auth via the
principal port, no blind credential forwarding, CSRF/origin checks, limits/timeouts/abort,
manual redirects, response-header allowlist, per-invocation audit line; `requires` is the
auditable grant surface; CSS confined by layer order + `[data-ns-plugin]` scoping + per-plugin
portal roots; quarantine-not-crash rendering for contract drift; T1/T2 sandbox tiers deferred to
the dashboard epic by design.

## 8. Review trail

Three-stage pipeline, generator ≠ reviewer sessions throughout: **Stage 2** — GPT-5.6 Sol·high
adversarial review, 20 findings (7 blockers), all verified against upstream jsr sources; 20/20
accepted and integrated (`adversarial-sol.md`, `adversarial-triage.md`). **Stage 3** — Kimi K3
docs-forecast (public guide + API references written as-if-shipped), 17 K-notes; 17/17 accepted
and integrated (`design/docs-story/`, `docs-story-triage.md`). The Wave-0 proof gates exist
because review demanded mechanism proof before contract freeze — the RFC inherits that
discipline rather than claiming false certainty.

## 9. Open forks for owner arbitration

| # | Fork | Options | Seed recommendation |
| --- | --- | --- | --- |
| F1 | Core pointer axis | (a) `.withFrontend()` pointer in `@netscript/plugin` (b) manifest-only, core untouched | **(a)** — doctrine-anticipated axis, zero vocabulary |
| F2 | Route mount default | (a) plugin-preferred base + host remap (b) forced `/plugins/<mountId>` namespace | **(a)** — `/auth/account` beats `/plugins/auth/account`; collisions caught deterministically |
| F3 | Contract package name | (a) `@netscript/plugin-frontend-core` (b) fold into `@netscript/fresh` (c) `@netscript/frontend-core` | **(a)** — symmetric with `plugin-*-core`, fresh-free contracts |
| F5 | Theme scope v1 | (a) CSS overlay only (b) + DTCG token merge | **(a)** |
| F7 | Wave-1 dogfood set | (a) workers only (b) workers + ai (c) all four | **(a) then (b)** |
| F8 | Milestone placement | beta.12 … beta.14 vs stable | defer — sequenced against PM #510 (beta.12), dashboard #400 (beta.13), deploy epics |
| F9 | SSR zone isolation | accept the v1 containment contract / fund an isolated-render protocol | **accept v1**; protocol only on demonstrated need |

(F4 zones and F6 generator timing were removed from the fork list — review resolved them as
technical facts, not preferences.)

---

<sub>**Provenance.** Seed run `plan-frontend-contrib--seed` on `plan/frontend-contrib`; this
document condenses the run's normative record (`design/canonical/00–06` rev 3, `plan.md`,
`design/examples/`, `design/docs-story/`). Where this RFC and the run docs conflict, the run
docs win until ratification, then GitHub wins. Refs #427 #432 #400 — no closing keywords; the
epic and sub-issues above are placeholders filed only after owner ratification.</sub>
