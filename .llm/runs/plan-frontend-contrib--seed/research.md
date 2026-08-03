# Research — plan-frontend-contrib--seed

Stage-B corpus for the frontend contribution layer. Discovery ran as a 4-way Opus Explore fan-out
(prior-analysis mining · plugin/registry mechanism · fresh/fresh-ui surface · consumer state) plus
supervisor-session verification of the load-bearing upstream claims. Every claim below carries a
citation; sub-agent findings that were load-bearing were re-verified directly (marked ✔).

## 1. The limitation, as previously analyzed

The caveat — plugins cannot contribute frontend surface — has a three-run analysis lineage:

1. **plan-roadmap-expansion--seed (A-dashboard, ~2026-07-05)** — first written architecture:
   `design/A-dashboard/proposal.md:521-549` (§9.2) defines a `DashboardPanelContribution` contract
   in a `plugin-dashboard-core/contracts/v1`, discovered "the way Aspire contributions are
   discovered", explicitly keeping `@netscript/plugin` dashboard-agnostic. Filed as DDX-17
   (`epic-and-issues.md:298-313`, later issue #427). Open question OQ-12
   (`open-questions.md:94-101`): contribution-contract seam vs a first-class core `definePlugin`
   axis — never resolved.
2. **dashboard-rescope--seed (2026-07-06)** — `plan.md:105` makes the seam a cross-cutting law
   ("the dashboard is itself a plugin (dogfood), and third-party plugins contribute panels through
   the same typed axis"); #427 verdict KEEP-AS-IS (tighten) (`issues-rescope.md:548-556`).
3. **dashboard-design--orchestrator (2026-07-12)** — the definitive 437-line proposal
   `analysis/plugin-extension-architecture.md`: a 7-member `DashboardContribution` discriminated
   union (panel/route/action/ai-tool/nav/entity-tab/home-card), injection zones (Medusa-derived),
   generated-registry discovery (runtime `registerPanel()` explicitly rejected), trust tiers
   T0/T1/T2, `contributesTo: { dashboard: 'v1' }` version handshake, and — §5 — the "second half":
   contribution into the USER's app via the existing `PluginAdapter.toScaffold()` engine plus a
   missing `AppTarget` seam on `ScaffolderContext`. Appendix A is a cited teardown of TanStack
   Devtools, Nuxt DevTools, Directus, and Medusa extension models.

**Nothing shipped.** `packages/plugin-dashboard-core` does not exist; `DashboardPanelContribution`
appears in zero product source files; `find plugins -name "*.tsx"` is empty. Beta-10 shipped a
Claude Design prototype rendering the system as-if-shipped
(`dashboard-design--orchestrator/prototype/`), not code. No arch-debt entry names the gap directly;
adjacent: `arch-debt.md:1001-1011` (generated frontend route React-reference failure),
`arch-debt.md:2120-2134` (Archetype-5 contribution-folder placement).

Doctrine already anticipates the axis: `docs/architecture/doctrine/07-composition-and-extension.md:101`
lists "Frontend framework | fresh (today), future expansion" in the extension-axis table; the same
file mandates registration-over-inheritance (`:114-134`), deterministic plugin load order with
duplicate rejection (`:135-153`), and the `extension-points.ts` manifest rule R-COMP-EXT-MANIFEST
(`:255-289`).

## 2. The plugin system today (the precedent to extend)

- **Authoring DSL**: `definePlugin` fluent builder —
  `packages/plugin/src/config/builders/plugin-builder.ts:60-310`. Contribution axes
  (`packages/plugin/src/config/domain/plugin-contributions.ts:12-38`): services,
  backgroundProcessors, streamTopics, databaseSchemas, runtimeConfigTopics, contractVersions, e2e,
  telemetry, migrations, aspire, cli.doctorChecks. **No frontend axis.** `PluginType` includes an
  inert `'frontend'` enum value (`packages/plugin/src/domain/constants.ts:5-13`) with no machinery.
- **Installer manifest**: `scaffold.plugin.json`, schema
  `packages/plugin/src/protocol/manifest.ts:112-136` (+ Zod `:204-216`, `schemaVersion 1`).
  `capabilities.hasRoutes` is a bare boolean; `scaffolder.export` points at a published scaffold
  entrypoint executed in a permission-scoped subprocess. Parsed without executing plugin code
  (`parsePluginManifest`, `:240-263`).
- **`*-core` split**: `packages/plugin-<name>-core` = pure publishable contracts/domain (e.g.
  `packages/plugin-auth-core/deno.json:1-18` exports `./contracts/v1` etc.); `plugins/<name>` = the
  installable runnable plugin owning manifest + services + scaffolder.
- **Registry generation**: `netscript generate plugins`
  (`packages/cli/src/public/features/generate/plugins/generate-plugin-registries-command.ts:41-84`)
  runs Walker→Extractor→Emitter SDK ports (`packages/plugin/src/sdk/mod.ts:11-23`) and emits one
  generated module per axis at `.netscript/generated/<axis>.registry.ts`
  (`packages/plugin/src/sdk/discovery/registry-emitter.ts:14-17`), marked
  "AUTO-GENERATED / DO NOT EDIT" (`:52-54`), idempotent by construction (`:11-19`).
- **Install flow**: `installPlugin`
  (`packages/cli/src/public/features/plugins/install/install-plugin.ts:98-202`) — local-path or JSR
  descriptor, dispatches the plugin-owned scaffolder, then host wiring: appsettings, config,
  imports, workspace member, Aspire helper regeneration (`:145-192`). Plugin files land under
  `plugins/<name>` in the project (`:392-397`).
- **Codegen idempotency precedent**: `generate runtime-schemas` skips byte-identical writes and
  enforces single-owner-per-topic
  (`packages/cli/src/public/features/generate/runtime-schemas/generate-runtime-schemas.ts:107-176`).

## 3. The frontend framework surface (what a contribution layer builds on)

### 3.1 Upstream Fresh 2.3.3 primitives (✔ verified directly)

- `App<State>` composable router: `use()`, `route()`, `get/post/…`, `layout()`, `appWrapper()`,
  `fsRoutes(pattern)`, and **`mountApp(path, app)`** — sub-app composition
  (✔ `deno doc jsr:@fresh/core@2.3.3`, class App; `https://jsr.io/@fresh/core/2.3.3/src/app.ts:357`).
- Islands are build-time registered. Non-vite: **`Builder.registerIsland(specifier)`**
  (✔ `https://jsr.io/@fresh/core/2.3.3/src/dev/builder.ts:157`; islands dir crawl feeds the same
  call, `:286-295`). Vite: **`fresh({ islandSpecifiers: string[] })`** on `@fresh/plugin-vite`
  (✔ `https://jsr.io/@fresh/plugin-vite/1.0.8/src/mod.ts:56-63,211-214`) — arbitrary module
  specifiers (jsr/npm/workspace deps included) become islands. The scaffold pins
  `@fresh/plugin-vite@^1.0.8` (`packages/cli/src/kernel/adapters/scaffold/fresh-adapter.ts:145`).
  **Correction to sub-agent report**: the fresh-ui survey concluded "no existing seam" for
  dependency islands — true of NetScript's current wiring, false upstream; the seam exists on both
  build paths and is merely unused.
- `Island` runtime shape `{ file, name, exportName, fn, css[] }`
  (`https://jsr.io/@fresh/core/2.3.3/src/context.ts:88-96`).

### 3.2 `@netscript/fresh` (the wrap layer)

- `defineFreshApp` (`packages/fresh/src/runtime/server/define-fresh-app.ts:110-127`) wraps `App`,
  `staticFiles`, `app.use`, `app.fsRoutes`, with seams `middleware[]`, `preConfigure`, `configure`,
  `createApp` — middleware/route injection points exist; no island or contribution seam.
- Typed route manifest generator: `packages/fresh/src/application/route/manifest.ts` writes
  app-local `.generated/manifest.ts` + `.generated/routes.ts`; apps re-export via `router.ts` with
  `createRouteReference` (`packages/cli/src/kernel/assets/app/router.ts.template:1-49`) — the
  typed-route registry precedent.
- Vite integration: `createNetScriptVitePlugin` (`packages/fresh/src/application/vite/README.md`) —
  `@app/*` aliases, Preact dedupe, route-manifest generation. Today the scaffold's
  `vite.config.ts.template` calls bare `fresh()` (`packages/cli/src/kernel/assets/app/vite.config.ts.template:1,44`).
- `@netscript/fresh/ai` (`packages/fresh/src/runtime/ai/mod.ts:1-101`): durable-chat server+island
  seam (`createNetScriptChatConnection`, `projectChatSnapshot`, stream proxy) — the AI runtime
  plane already exists; only its mounting story is missing.

### 3.3 `@netscript/fresh-ui` (the design system)

- Dual nature: small runtime surface (root `mod.ts` helpers: Icon, DataGrid, toast, `cn` —
  `packages/fresh-ui/mod.ts:12-40`; interactive `*Namespace` compounds —
  `packages/fresh-ui/interactive.ts:22-113`) + a **copy-registry**: ~60 component/css pairs +
  islands copied into the app, app-owned afterwards (`packages/fresh-ui/registry.ts:12-60` —
  `FreshUiRegistryItem { name, kind: component|style|theme|lib, files[{source,target}], css… }`).
- CLI engine: `netscript ui add|init|list|update|remove`
  (`packages/cli/src/kernel/application/ui/registry.ts:81-196`) — copies with import rewriting to
  `@ui/ @islands/ @assets/ @lib/` targets, merges deno.json imports + a CSS aggregator, detects
  local-edit drift on update. **The closest existing thing to a frontend contribution model, and
  the reason islands work today: registry islands are copied into the app's `islands/` dir.**
- Theme system: CSS custom properties `--ns-*`; DTCG sources `tokens/semantic.tokens.json` (each
  token carries `$extensions.netscript.cssVar`), themes under `tokens/themes/`, generated
  `registry/theme/tokens.css` + Tailwind v4 bridge `theme-bridge.css` (`deno task tokens:build`);
  delivered via the `theme-seed` registry item (`packages/fresh-ui/registry.manifest.ts:141-176`);
  runtime switching via `data-theme` attribute.
- Nav/shell: `SidebarShell` + `SidebarNavItem`/`SidebarNavSection`
  (`packages/fresh-ui/registry/components/ui/sidebar-shell.tsx:8-36`) — nav is a static
  `readonly SidebarNavSection[]` prop; scaffolded layouts hardcode arrays
  (`DESIGN_NAVIGATION` in the design layout template; topbar entries in
  `packages/cli/src/kernel/assets/app/routes/_layout.tsx.template:33-74` reading the typed
  `appRoutes`).

## 4. Consumer state (the four blocked features)

- **Auth**: mature backend — oRPC contract `signin/callback/signout/session/me`
  (`packages/plugin-auth-core/src/contracts/v1/auth.contract.ts:437-459`), three adapters
  (better-auth with `organization/twoFactor/admin/apiKey` plugins —
  `packages/auth-better-auth/src/better-auth.ts:56,132-138`; workos with `organizationId` —
  `packages/auth-workos/src/workos-backend.ts:62,173`; kv-oauth full HTTP flow —
  `packages/auth-kv-oauth/src/flow.ts:69-233`). **Zero `.tsx`** anywhere in auth packages.
  Needs: sign-in page, session/me widget, sign-out, org/member management UI.
- **AI**: oRPC `chat` (SSE eventIterator) + `models`
  (`packages/plugin-ai-core/src/contracts/v1/ai.contract.ts:317-391`); **the one existing
  plugin→app frontend precedent**: `chatRouteScaffolder` emits `ai/routes/chat.tsx` into the app
  (`plugins/ai/src/adapter/resources/chat-route/chat-route.ts:33`), whose stub renders a
  `ChatIsland` consuming `@netscript/fresh/ai` (`chat-route.stub.ts:19-24`). fresh-ui already
  ships chat components (message, prompt-input, model-selector, tool-call-card,
  `src/chat/`, `src/ai/render-ui.tsx`). Owner direction (dashboard brief Axis 5): AI is
  *distributed* — contextual actions, procedures-as-tools — not one chat pane.
- **Dev dashboard**: no dashboard package/plugin exists; scaffold ships a static `/dashboard`
  route + `/design` gallery with hardcoded panel JSX and nav arrays
  (`packages/cli/src/kernel/application/scaffold/writers/app-route-seeds.ts:6-92`;
  `dashboard.tsx.template`). The 7-member dashboard contribution family is designed (see §1.3)
  but unbuilt.
- **Deploy**: sibling seed run `plan-deploy-plugin--seed` is at stage-A bootstrap (branch
  `plan/deploy-plugin`, HEAD `d7879e68`); owner-ratified intent (its `kickoff.md`, quoting the
  #824 redirect): "the plugin allow us to contribute to every layers (**even frontend soon**)
  meaning we could imagine SCAFFOLDING a cloudflare optimized project that would ships seams that
  already are cloudflare first (e.g. workers, durable object, kV, ...) same story for AWS".
  Adapter op set `plan/emit/up/down/status/logs`
  (`.llm/harness/archetypes/ARCHETYPE-7-deploy-target-adapter.md`) is what deploy panels/actions
  would surface. Needs both seams: cloud-optimized scaffolding into the app AND live
  status/logs/actions consoles.

## 5. External models (carried from prior teardown, re-cited)

`dashboard-design--orchestrator/analysis/plugin-extension-architecture.md` Appendix A (verified
2026-07-12 against vendor docs): TanStack Devtools (runtime plugin array + namespaced event bus),
Nuxt DevTools (iframe tabs + birpc), Directus (manifest permissions + V8-isolate sandbox +
marketplace compat gating), Medusa (build-time widgets + published injection-zone enum + file-based
admin routes). Synthesis adopted there and reused here: manifest + generated type-checked registry
(the "hard end" of the registration spectrum, matching how `generate plugins` already works);
injection zones as versioned contract surface; explicit contract-version handshake.

## 6. Synthesis — the design space this run must resolve

1. **Two delivery models, both with repo precedent**: *live/package-served* UI (generated registry
   imports plugin exports; islands via `islandSpecifiers`/`registerIsland`; versioned, upgradeable)
   vs *copy/scaffolded* UI (fresh-ui registry + chat-route precedent; app-owned, customizable,
   drift-managed). A correct design uses both deliberately, per contribution kind.
2. **Where the vocabulary lives** (OQ-12): thinness law says not in `@netscript/plugin`; the
   doctrine axis table says frontend is a real extension axis. Resolution space: manifest-pointer
   axis in core + typed family in a new `*-core` contract package.
3. **Generalization**: the dashboard family (7 kinds) is one *host*'s vocabulary. The user app is
   another host. The layer must define the host-agnostic base (routes, islands, components/zones,
   nav, theme) such that the dashboard family becomes an extension of it, not a sibling.
4. **Missing seams to specify** (all additive): manifest `frontend` block; `frontend` registry
   emission; vite `islandSpecifiers` feed; `defineFreshApp` mount glue; nav feed into
   `SidebarShell`/topbar; typed route references for plugin routes; CSS/theme aggregation;
   `AppTarget` on `ScaffolderContext`; CLI verbs.
5. **Trust**: user-app contributions are installed code (already runs server-side) — T0 by
   definition; dashboard T1/T2 tiers remain the dashboard run's scope.
