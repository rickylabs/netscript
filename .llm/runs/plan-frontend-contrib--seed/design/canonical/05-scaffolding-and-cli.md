# Scaffolding & CLI — how contributions reach a project (draft)

> **Draft — design document only.** Verb names follow existing CLI grammar
> (`packages/cli/src/public/features/root/public-command-tree.ts`); final naming is a docs-pass
> concern.

## 1. CLI surface (additive)

| Verb | Role | Precedent |
| --- | --- | --- |
| `netscript plugin install <spec>` | unchanged UX; now also regenerates frontend emissions | existing post-install wiring (`install-plugin.ts:145-192`) |
| `netscript generate plugins` | now also emits `frontend.*` | per-axis emitter (`registry-emitter.ts`) |
| `netscript generate frontend-wiring` | idempotent adoption for EXISTING apps: vite `islandSpecifiers` feed, `router.ts` plugin-routes merge, `<PluginZone>` hints, css import | `ui:init` + `generate runtime-schemas` idempotency |
| `netscript plugin new <name> --with frontend` | plugin-side skeleton (`frontend/` tree + manifest block + **seeded deno.json exports**) | `generate-plugin-mod.ts` template |
| `netscript plugin dev` (in plugin dir) | **phase-1** (S-16): watches `frontend/`, maintains the export map, regenerates the host registry atomically, signals vite reload when island inputs change | `watch-run.ts` wake idiom |
| `netscript generate frontend` (in plugin dir) | phase-2 convention generator: file tree → manifest contribution lists (export-map maintenance is already phase-1 via `plugin dev`) | `tokens:build` / assets-barrel generated-file idiom |
| `netscript plugin resource add <plugin> <resource> --app <path>` | scaffolded-starter (copy-mode) resources into a chosen app | DDX-19 #432 one-generator-two-callers; `chatRouteScaffolder` |
| `netscript plugin doctor` | + `frontend` check | `DoctorCheckSpec` seam |
| `netscript ui *` | unchanged — fresh-ui copy-registry stays the app-owned component channel | `application/ui/registry.ts` |

## 2. Scaffold template changes (new apps get the layer by default)

All in `packages/cli/src/kernel/assets/app/`:

- `main.ts.template` — `defineFreshApp<State>({ name, frontend: frontendRegistry })` (import from
  `./.netscript/generated/frontend.registry.ts`; generated file exists from day 0, empty
  registry when no plugins contribute — zero conditional wiring).
- `vite.config.ts.template` — `fresh({ islandSpecifiers: [...pluginIslandSpecifiers] })`.
- `router.ts.template` — `plugins: pluginRoutes` merged into the exported `routes`/`appRoutes`
  (typed hrefs for contributed pages).
- `routes/_layout.tsx.template` — topbar nav consumes `pluginNavSections(frontendRegistry,
  { group: 'main' })` appended to the existing hardcoded entries; `<PluginZone
  id='app.topbar.end' />` next to `<ThemeToggle/>`.
- `routes/dashboard.tsx.template` — `<PluginZone id='app.dashboard.panels' />` under the existing
  hardcoded panels (the hardcoded `services` array stays; contributed panels append).
- `routes/index.tsx.template` — `<PluginZone id='app.home.cards' />`.
- `assets/design.css` — `@import './.netscript/generated/frontend.css'`.

The scaffolded app therefore demonstrates every zone and the nav feed **before** any plugin is
installed (empty states render nothing), and the first `plugin install` makes surface appear with
no app edits — the demo moment the DX story is built around.

## 3. Scaffolded-starter resources (copy mode) — the `AppTarget` seam

The second delivery model reuses the existing scaffolder engine end-to-end
(`PluginAdapter.toScaffold()`, `packages/plugin/src/adapter/contract.ts:305-309`; the live
precedent is `chatRouteScaffolder` emitting `routes/chat.tsx` into the app —
`plugins/ai/src/adapter/resources/chat-route/chat-route.ts:33`). What's added, carried verbatim
from the ratified prior design (§5):

- `ScaffolderContext` gains `target?: AppTarget` — `{ app: string; framework: 'fresh' }` —
  resolved against workspace members (`ensureWorkspaceMember` enumeration).
- `PluginResource` entries may declare `target: 'frontend'`; the CLI verb
  `plugin resource add … --app <path>` selects the destination.
- Generated files land in the app's own `routes/`/`islands/` and are **app-owned from that
  moment**: update flows report drift, never overwrite (the `updateUiRegistryItems` posture,
  `application/ui/registry.ts:145-166`).
- Starter templates use `ItemScaffolder` typesafe codegen (#157 law) — no string templates.

**Choosing the model** (the doc the author reads): serve it live when the plugin owns the
surface's evolution (consoles, panels, widgets); scaffold a starter when the user owns it
(sign-in pages, cloud-optimized starter routes). A plugin may ship both for the same feature —
auth does exactly this (`../examples/auth.md`).

## 4. Generated-workspace layout in a scaffolded project (after install)

```
my-app/
  .netscript/generated/
    frontend.registry.ts   frontend.islands.ts   frontend.routes.ts   frontend.css
    services.registry.ts   …existing axis registries…
  routes/  islands/  components/          ← app-owned (incl. any scaffolded starters)
  plugins/crons/                          ← installed plugin (local-source/official copy modes)
  netscript.config.*                      ← host overrides: basePaths, disabled contributions
```

## 5. Quality surface (gate wiring, for the plan — S-18)

Two layers, both specified in `../plan.md` §Gates:

- **Per-plugin test kit** (`@netscript/plugin-frontend-core/testing`, entrypoint
  **`defineFrontendTestSuite(manifest, options)`** — K-9; `plugin new --with frontend` seeds a
  `frontend_test.ts` calling it): a generated host fixture that runs schema/resolution checks,
  island-props serialization round-trip, SSR render, hydration, browser smoke (Playwright),
  a11y (axe + keyboard), base-path composition, and local-source + JSR modes. A plugin frontend
  ships with this suite green — the analog of the e2e axis plugins already declare.
- **Budgets**: per-plugin production budgets recorded in the manifest and asserted by the kit —
  initial JS bytes, async chunk count, CSS bytes, island count, zone SSR render deadline, data
  resolver deadline. Exceptions are explicit host policy, not silent convention.
- **`scaffold.runtime` extension** (merge-readiness only): install a frontend-contributing
  plugin → generated set exists + type-checks → boot → contributed route serves, nav present,
  zone renders, island hydrates → `plugin remove` → clean disappearance (empty emissions, no
  dangling imports).
