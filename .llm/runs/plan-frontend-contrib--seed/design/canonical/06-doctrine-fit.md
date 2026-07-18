# Doctrine Fit — archetypes, gates, layering, debt (draft)

> **Draft — design document only.**

## 1. Package/change map with archetypes

| Surface | Change | Archetype | Overlay |
| --- | --- | --- | --- |
| `packages/plugin-frontend-core` | **new** — contracts/v1 + `defineFrontend` + `definePluginPage` sugar | ARCHETYPE-1 (small contract) | SCOPE-frontend |
| `packages/plugin` | additive: `FrontendContributionRef` pointer axis, builder method, manifest block, `CONTRIBUTION_AXES` | ARCHETYPE-4 (DSL/builder — existing) | — |
| `packages/fresh` | new `./plugins` subpath: mount glue, `PluginZone`, nav feed, api proxy, `withPluginIslands`; `defineFreshApp.frontend` option | ARCHETYPE-3 (runtime behavior — existing) | SCOPE-frontend |
| `packages/cli` | generate emissions, `frontend-wiring`, `plugin new --with frontend`, resource-add `--app`, doctor check, template updates | ARCHETYPE-6 (CLI/tooling — existing) | SCOPE-frontend |
| `plugins/ai`, `plugins/auth`, deploy plugin (future) | consumers: `frontend/` trees | ARCHETYPE-5 (plugin) | SCOPE-frontend |

Implementation is a **cross-cutting wave** (like the plugin system itself); each slice lands under
its surface's archetype gate set (`gates/archetype-gate-matrix.md`) — F-1…F-19 per column, plus
SCOPE-frontend browser/route/state gates for everything user-visible.

## 2. Layering laws honored (doctrine 07)

- **Thinness**: `@netscript/plugin` learns a pointer, no vocabulary (§0 of the ratified dashboard
  design; OQ-12 resolution recorded in `01-contracts.md`). `plugin-frontend-core` depends on
  neither `fresh` nor `fresh-ui`.
- **Registration over inheritance** (`07-composition-and-extension.md:114-134`): contributions
  are data registered against an axis; no cross-package subclassing anywhere in the design.
- **Deterministic order + duplicate rejection** (`:135-153`): resolution rules in
  `03-discovery-and-registry.md §3`.
- **Extension-axis discipline** (`:101-112`): typed identifier (`framework: 'fresh'`), factory
  (registry build), registration mechanism (manifest pointer) — the axis table's "Frontend
  framework" row becomes real.
- **R-COMP-EXT-MANIFEST** (`:255-289`): `@netscript/fresh` and `packages/plugin` extension-points
  manifests gain the new registries; `plugin-frontend-core` documents its single axis in its
  `mod.ts` docs (one-axis package, manifest optional per the rule's 2+ threshold).
- **Wrap, don't reinvent**: every mount primitive is upstream Fresh (research.md §3.1);
  tokens/nav/route-refs are existing NetScript surfaces.

## 3. Public-surface / JSR posture

- `plugin-frontend-core` publishes `.`, `./contracts/v1`, `./testing` — versioned-subpath
  contract evolution (v2 additive path), `deno doc --lint` publish bar, isolatedDeclarations
  discipline like sibling `*-core` packages.
- Plugin packages publishing frontends must export `./frontend` + island/route modules
  explicitly (JSR has no wildcard exports) — maintained by the phase-2 generator; documented as
  the author-facing rule until then.
- Text-import doctrine applies: any starter templates ship as string constants, never text
  imports (`jsr-text-import-lineage` standing doctrine).

## 4. Known debt to record on implementation (candidates, not yet filed)

| Candidate | Why deferred |
| --- | --- |
| `--ns-*`-only CSS lint for plugin theme files | needs a lint rule; v1 is documentation + review |
| Tailwind content-scan extension to plugin packages | vite/tailwind config reach; plain CSS suffices v1 |
| DTCG token-file merge from plugins into `tokens:build` | owner fork F5 deferred |
| Island props serializability static check | upstream Fresh constraint; no static gate exists |
| Zone occupancy caps / conflicts UI | dashboard-run inspector covers observability first |

## 5. Precedence honored (what this design reuses rather than invents)

| Reused | Source |
| --- | --- |
| 7-member dashboard family, zones, handshake, quarantine, trust tiers | `dashboard-design--orchestrator/analysis/plugin-extension-architecture.md` (generalized, not replaced) |
| Per-axis generated registry + markers + idempotency | `packages/plugin/src/sdk/discovery/registry-emitter.ts`, `generate-runtime-schemas.ts` |
| Manifest pointer idiom | `scaffolder.export` (`packages/plugin/src/protocol/manifest.ts`) |
| Copy-registry ownership + drift semantics | `packages/cli/src/kernel/application/ui/registry.ts` |
| Plugin→app file generation | `plugins/ai/.../chat-route/` + `PluginAdapter.toScaffold()` |
| Typed route references | `@netscript/fresh/route` + `router.ts.template` |
| Token system | `packages/fresh-ui/tokens/*` + `theme-bridge.css` |
| Nav data model | `sidebar-shell.tsx` `SidebarNavItem`/`SidebarNavSection` |
| External-model teardown (TanStack/Nuxt/Directus/Medusa) | prior design Appendix A |
