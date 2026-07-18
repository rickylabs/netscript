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
| `netscript plugin new <name> --with frontend` | plugin-side skeleton (`frontend/` tree + manifest block + exports) | `generate-plugin-mod.ts` template |
| `netscript generate frontend` (in plugin dir) | phase-2 convention generator: file tree → manifest lists + deno.json exports maintenance | `tokens:build` / assets-barrel generated-file idiom |
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

## 5. E2E surface (gate wiring, for the plan)

`scaffold.runtime` suite extension (design-time note, not run by this seed): install a
frontend-contributing plugin → assert generated emissions exist and type-check → boot app →
assert contributed route serves, nav entry present, zone renders, island hydrates (Playwright,
SCOPE-frontend gates), uninstall → assert clean disappearance. This is the acceptance shape for
phase 1 (`../plan.md` §Gates).
