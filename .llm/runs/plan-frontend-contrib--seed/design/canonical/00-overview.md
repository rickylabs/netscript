# Frontend Contribution Layer — Overview (canonical design, v1 draft)

> **Draft — design document only. No GitHub mutations, no product code.** Produced by
> `plan-frontend-contrib--seed`. Rev 2: the GPT-5.6 Sol adversarial pass is integrated (20/20
> findings accepted — `../../adversarial-sol.md`, dispositions in `../../adversarial-triage.md`);
> pending the Kimi K3 docs pass and owner ratification. Mechanisms marked [P1]–[P5] in the docs
> are Wave-0 proof gates (`../../plan.md`) — verified-API-unproven-behavior is stated as such.

## The one-paragraph story

A NetScript plugin becomes a **full-stack unit**: the same `plugins/<name>` package that today
contributes services, workers, schemas, and Aspire wiring gains a `frontend/` directory that
contributes **pages, islands, zone components, nav entries, and theme CSS** to any NetScript Fresh
host app. Contributions are declared as data (schema-first contracts in
`@netscript/plugin-frontend-core/contracts/v1`), discovered exactly like every other axis
(manifest pointer + `netscript generate plugins` emitting a type-checked registry into
`.netscript/generated/`), and mounted through thin wrappers over upstream Fresh 2.3 primitives
that already exist: `App.mountApp()` for routes, `islandSpecifiers`/`registerIsland` for islands,
`app.use()` for the data proxy. A plugin author writes ordinary Fresh code — the same
`routes/`-and-`islands/` idiom as an app — and one `defineFrontend()` export. Nothing is invented
that Fresh, the plugin SDK, or the fresh-ui token system doesn't already provide.

## Why now (the four blocked consumers)

| Consumer | Blocked need | Worked example |
| --- | --- | --- |
| Dev dashboard | plugin-contributed panels/consoles instead of hardcoded JSX | `../examples/dashboard.md` |
| Auth | sign-in flow, session widget, org/member management UI | `../examples/auth.md` |
| AI | chat + distributed AI surfaces mounted from the plugin, not hand-scaffolded | `../examples/ai.md` |
| Deploy (new) | cloud-specific consoles + cloud-first scaffold seams | `../examples/deploy.md` |

## Design principles (locked)

1. **DX is the contract.** The authoring experience is specified first (`02-authoring-dx.md`) and
   every mechanism decision is scored against it. A plugin author writes Fresh code they already
   know; the contribution layer is one declaration file, not a framework to learn.
2. **Contract first, mechanism second.** All shapes are Standard-Schema-validated types in a small
   contract package (`@netscript/plugin-frontend-core`, Archetype 1). The registry, CLI, host
   glue, and dashboard consume the contracts; none of them define vocabulary.
3. **Wrap, don't reinvent.** Every mount path is an existing upstream primitive:
   `App.mountApp(path, app)` (jsr @fresh/core 2.3.3 `src/app.ts:357`),
   `fresh({ islandSpecifiers })` (@fresh/plugin-vite 1.0.8 `src/mod.ts:211-214`),
   `Builder.registerIsland` (core `src/dev/builder.ts:157`), `app.use(path, mw)`,
   `createRouteReference` (`@netscript/fresh/route`), `--ns-*` semantic tokens.
4. **Generated registry, never runtime mutation.** Discovery is a build-time emission
   (`.netscript/generated/frontend.*`), the same Walker→Extractor→Emitter idiom as every existing
   axis (`packages/plugin/src/sdk/discovery/registry-emitter.ts`). `deno check` of the generated
   workspace is the install-time compat gate: a type-broken contribution fails `plugin install`
   with a real diagnostic. No `registerPanel()` globals (carried verdict from
   `dashboard-design--orchestrator/analysis/plugin-extension-architecture.md` §2).
5. **Two delivery models, chosen per contribution, both first-class.**
   - **Live** (default): the app imports the plugin's published frontend modules; updates ship
     with the package version. For consoles, panels, widgets — surface the plugin *operates*.
   - **Scaffolded starter** (opt-in): files are generated into the app and become app-owned —
     the fresh-ui copy-registry / `chatRouteScaffolder` precedent
     (`plugins/ai/src/adapter/resources/chat-route/chat-route.ts:33`). For surfaces the user is
     *expected to customize* (a sign-in page, a cloud-optimized starter route).
   The rule of thumb: **if the user will edit it, scaffold it; if the plugin owns it, serve it.**
6. **One envelope, many families, many hosts.** The user app and the dev dashboard are both
   hosts. The `app` family (routes, islands, zones, nav, theme) and the dashboard's richer
   family (entity tabs, ⌘K actions, AI tools, home cards — future `plugin-dashboard-core`) are
   **sibling payload families on one shared envelope**, sharing discovery, identity, and
   host-surface negotiation (rev 2, S-7: a widened union is not additively evolvable). This
   generalizes — rather than duplicates — the ratified dashboard architecture.
7. **Thinness preserved, axis first-class.** `@netscript/plugin` gains only a *pointer*
   (`frontend: { export, framework, contract }`) — the same shape as `scaffolder.export` in the
   installer manifest. The typed vocabulary lives in `plugin-frontend-core`. This resolves
   OQ-12 (`plan-roadmap-expansion--seed/design/A-dashboard/open-questions.md:94-101`) by taking
   both horns: first-class axis, zero core vocabulary.
8. **Trust is explicit but not theatrical.** An installed plugin already executes server-side
   code; its frontend on the *app* surface is trusted (T0). The `requires` declaration
   (ports/procedures) is kept for auditability, the doctor, and the dashboard's future T1/T2
   tiers — enforcement stays in the dashboard run's scope.

## Architecture at a glance

```
plugins/crons/
  frontend/
    mod.ts            ← defineFrontend(...) — the one declaration (02-authoring-dx.md)
    routes/*.tsx      ← ordinary Fresh route modules
    islands/*.tsx     ← ordinary Fresh islands (one component per file)
    components/*.tsx  ← SSR zone components
    theme.css         ← --ns-* overlays only
  scaffold.plugin.json  ← + "frontend": { "export": "./frontend", "framework": "fresh", "contract": "v1" }
  deno.json             ← + explicit exports for ./frontend and island/route modules (generator-maintained)

            │  netscript plugin install / netscript generate plugins
            ▼
app/.netscript/generated/
  frontend.registry.ts   ← typed FrontendContributionRegistry (imports plugin manifests)
  frontend.islands.ts    ← const pluginIslandSpecifiers: string[]
  frontend.routes.ts     ← createRouteReference entries → routes.plugins.crons.calendar.href()
  frontend.css           ← aggregated theme overlays

            │  consumed by
            ▼
app/main.ts        defineFreshApp({ name, frontend: frontendRegistry })          ← mounts sub-apps,
                                                                                   nav, zones, gateway
app/vite.config.ts fresh({ islandSpecifiers: pluginIslandSpecifiers })           ← island builds
app/routes/…       <PluginZone id='app.dashboard.panels' />                      ← zone rendering
```

## Document map

| Doc | Contents |
| --- | --- |
| `01-contracts.md` | The schema/type contract family — the normative surface |
| `02-authoring-dx.md` | The plugin-author experience — exact code, dev loop, conventions |
| `03-discovery-and-registry.md` | Manifest block, generation, install/uninstall, gates |
| `04-host-runtime.md` | Mount protocol, SSR/hydration, data access, nav, theming, isolation |
| `05-scaffolding-and-cli.md` | CLI verbs, scaffold template changes, starter resources, AppTarget |
| `06-doctrine-fit.md` | Archetypes, gates, debt, precedence, layering |
| `../examples/*.md` | The four worked consumer stories |

## Explicitly out of scope for this layer (and where it lives)

- Dashboard-only contribution kinds (panels-with-slots, entity tabs, ⌘K actions, AI tools, home
  cards) — dashboard run, extending this base family.
- T1/T2 sandbox rendering (iframe + RPC bridge) — dashboard run ([stable] per prior design).
- Marketplace/verification — [stable], prior design §7.
- Non-Fresh frontend frameworks — the `framework` discriminator reserves the axis
  (doctrine 07 axis table), nothing else is built.
