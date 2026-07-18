# Plan — plan-frontend-contrib--seed (generator draft)

> **Status: generator draft.** Locked = this session's recommendation with rationale; nothing is
> owner-ratified. Pending: Codex GPT-5.6 Sol adversarial pass → integration → Kimi K3 docs/API
> pass → owner review. Drafts only; no board mutations; no product code.

## Scope

Design (not implement) the frontend contribution layer: contracts, discovery/registry, host
runtime, scaffolding/CLI, DX, and four worked consumers. Deliverables are
`design/canonical/00–06` + `design/examples/{dashboard,auth,ai,deploy}` + this plan.

## Locked design decisions (D#) — rationale in the canonical docs

| # | Decision | Where |
| --- | --- | --- |
| D1 | New Archetype-1 contract package `@netscript/plugin-frontend-core` owns the vocabulary; depends on neither fresh nor fresh-ui; component refs are module specifiers (data) | 01 |
| D2 | Core `@netscript/plugin` gains only a pointer axis (`FrontendContributionRef` + `.withFrontend()` + manifest block) — resolves OQ-12: first-class axis, zero core vocabulary | 01, 06 |
| D3 | Base family v1 = route / island / zone / nav / theme; dashboard-only kinds (panel/action/ai-tool/entity-tab/home-card) are a family EXTENSION owned by the future `plugin-dashboard-core` | 01, examples/dashboard |
| D4 | Discovery = manifest pointer + generated registry (`.netscript/generated/frontend.*`) via the existing axis-emitter pipeline; runtime registration rejected (carried verdict) | 03 |
| D5 | Islands register by module specifier on both build paths (`islandSpecifiers` / `registerIsland`) — plugin authors import islands directly, zero wrapper API | 02, 04 |
| D6 | Routes mount as lazy sub-Apps via upstream `App.mountApp`; plugin-preferred `base` + host remap + generate-time collision errors | 04 |
| D7 | Two delivery models, both first-class: live (package-served, default) vs scaffolded starter (app-owned, via `AppTarget` on `ScaffolderContext`); rule: user-edits-it → scaffold, plugin-owns-it → serve | 00, 05 |
| D8 | Data path: server = typed client + `ctx.host.serviceUrl()`; client = same client via `/api/plugins/<id>/*` proxy middleware; `requires` declares the audit surface | 04 |
| D9 | `PluginHostState` is the only host-state seam plugin pages may assume (portability across app/dashboard hosts) | 04 |
| D10 | Theming: `--ns-*` semantic vars only, CSS layered (`@layer ns-plugins`) + `[data-ns-plugin]` scoping; DTCG token merge deferred | 04 |
| D11 | App surface trust = T0 (installed plugins already run server code); containment = lazy mounts, zone error boundaries, quarantine states; T1/T2 stay dashboard-scope | 04 |
| D12 | Contract versioning: `contracts/v1` subpath + `contract: 'v1'` handshake + install-time `deno check` gate + doctor + quarantine-not-crash (carried verbatim from ratified dashboard design §4) | 01, 03 |
| D13 | Scaffold templates wire the layer by default (registry import, islandSpecifiers feed, PluginZone placements, nav feed, css import) so `plugin install` produces visible surface with zero app edits | 05 |
| D14 | Explicit manifest is the contract; file-convention generator (`netscript generate frontend`) is phase-2 sugar that also maintains JSR explicit exports | 02 |

## Owner forks (F#) — decisions reserved for ratification, none silently taken

| # | Fork | Options | Seed recommendation |
| --- | --- | --- | --- |
| F1 | Core pointer axis | (a) `.withFrontend()` pointer in `@netscript/plugin` (b) manifest-only, core untouched | **(a)** — the axis is doctrine-anticipated; pointer keeps thinness |
| F2 | Route mount policy | (a) plugin base + host remap (b) forced `/plugins/<id>` namespace on app surface | **(a)** — `/auth/org` beats `/plugins/auth/org` for end users; collisions caught at generate time |
| F3 | Contract package name | (a) `@netscript/plugin-frontend-core` (b) fold into `@netscript/fresh` (c) `@netscript/frontend-core` | **(a)** — sibling-symmetric with `plugin-*-core`; keeps fresh-free contracts |
| F4 | v1 zone set | minimal 4 (`topbar.end`, `dashboard.panels`, `home.cards`, `footer`) vs larger | **minimal 4** — zones are additive-minor later |
| F5 | Theme contributions | (a) CSS overlay only (b) + DTCG token-file merge into `tokens:build` | **(a)** at v1 |
| F6 | Convention generator timing | phase 1 vs phase 2 | **phase 2** — explicit form is the contract; sugar follows proof |
| F7 | First-party dogfood set for phase 1 | one plugin (ai chat) vs four capability panels | **ai + workers** (one live route + one zone panel) — proves both surfaces cheaply |
| F8 | Milestone placement | beta.12 … beta.14 vs stable train | defer — depends on PM #510 (beta.12) and dashboard epic sequencing; note deploy epic (#823 family) wants this layer early |

## Phasing (implementation waves, post-ratification — each wave is normal run-loop work)

1. **Wave 1 — contracts + spine**: `plugin-frontend-core` (contracts/v1, defineFrontend,
   definePluginPage), pointer axis in `@netscript/plugin`, manifest block, registry emissions,
   `@netscript/fresh/plugins` glue (mount, proxy, nav, PluginZone, withPluginIslands),
   `defineFreshApp.frontend`, vite feed, scaffold template wiring, dogfood per F7.
   Gate: extended `scaffold.runtime` assertions (05 §5) + SCOPE-frontend browser gates.
2. **Wave 2 — DX + lifecycle**: `plugin new --with frontend`, `generate frontend` convention
   generator + exports maintenance, `generate frontend-wiring` adoption verb, doctor `frontend`
   check, quarantine render states, `plugin resource add --app` (`AppTarget` seam).
3. **Wave 3 — consumers**: auth frontend (starter signin + live org console + session widget),
   ai frontend (live chat + assist launcher; starter repositioned), remaining first-party panels;
   deploy + dashboard epics consume the layer in their own runs.

## Gates & validation map (per `gates/archetype-gate-matrix.md` + SCOPE-frontend)

- `plugin-frontend-core`: Arch-1 column (F-1/5/6/7/8/10/11/12/14–19), `deno doc --lint`,
  jsr-audit at publish wave.
- `packages/fresh` `./plugins`: Arch-3 column + SCOPE-frontend (route renders, browser
  validation, loading/empty/error states, responsive) + consumer-import validation.
- `packages/cli`: Arch-6 + relevant F-CLI-*; scaffold-static; extended `scaffold.runtime` E2E
  (install→render→hydrate→uninstall) at merge-readiness only.
- Plugins: Arch-5 + `quality:scan` + `arch:check` per the #745 lesson (wrappers alone are not a
  verdict).

## Risk register

| Risk | Exposure | Mitigation in design |
| --- | --- | --- |
| Vite island registration from jsr/workspace specifiers has unproven edge cases (dedupe, HMR) | Wave 1 spine | primitive verified upstream (`mod.ts:211-214`); Wave 1 starts with a spike slice; non-vite builder path is the fallback proof |
| Dep-CSS `@import` through vite | theming | copy-into-generated fallback predeclared (03 §2) |
| JSR explicit-exports friction for island/route modules | authoring | generator-maintained exports (D14); documented interim rule |
| SSE/streaming through the plugin proxy | ai example | existing stream-proxy precedent; keep proxy thin (`app.use` passthrough) |
| Route/base collisions with user apps | UX | generate-time structured errors + host remap (D6) |
| Scope creep into dashboard family | this seed | D3 boundary + out-of-scope table (00) |
| Fresh 2.x API drift (pre-3.0 churn) | spine | wrap-points concentrated in `@netscript/fresh/plugins`; upstream pin `^2.3.3` |

## Debt candidates (file on implementation, not now)

See `design/canonical/06-doctrine-fit.md §4` (token-only CSS lint, tailwind content scan, DTCG
merge, island-props check, zone caps).

## Evidence base

`research.md` (all claims cited); prior-art:
`dashboard-design--orchestrator/analysis/plugin-extension-architecture.md` (generalized by D3),
roadmap-expansion A-dashboard §9 / OQ-12 (resolved by D2), deploy-plugin kickoff (owner intent for
seam 2), doctrine 07 (axis table row made real).
