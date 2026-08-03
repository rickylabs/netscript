# README fragments

Each fragment below is a self-contained section written to drop into the named package's README.

---

## Fragment: `@netscript/plugin-frontend-core` — opening sections

````markdown
**The contract vocabulary for NetScript plugin frontends: serializable types, Standard-Schema
validation, and the `defineFrontend` builder that turns a plugin's `frontend/` directory into a
versioned manifest envelope.**

A NetScript plugin is a full-stack unit: alongside services and workers it can contribute pages,
islands, zone components, nav entries, and theme CSS to any Fresh host. This package defines what
those contributions *are* — as data. It deliberately contains no Fresh, no Preact, and no runtime
helpers; everything that touches the framework lives in `@netscript/fresh/plugins`. Because
component references are module specifiers, host tooling can discover, validate, and type-check a
plugin's frontend without executing plugin code.

## Why authors use it

- **One declaration file** — `defineFrontend` validates the whole `frontend/` story at once and
  freezes it, so a malformed contribution fails in the plugin, not inside a host.
- **An envelope that can evolve** — a stable envelope plus per-family payload schemas with
  `(family, major)` windows: new optional fields are minor, new kinds are a new major, and hosts
  quarantine what they cannot serve instead of crashing.
- **Host-negotiated surfaces** — zones and nav groups are host-published data, so hosts grow new
  contribution points without contract changes.
- **A test kit, not vibes** — `./testing` mounts the plugin against a generated host fixture:
  schema/resolution checks, island-props serialization round-trip, SSR, hydration, browser smoke,
  accessibility, and production budgets.

## Quick example

```ts
import { defineFrontend } from '@netscript/plugin-frontend-core';

export default defineFrontend({
  contract: { family: 'app', major: 1 },
  pluginKind: 'crons',
  base: '/crons',
  routes: [{ kind: 'route', id: 'calendar', path: '/calendar', module: './routes/calendar.tsx' }],
  zones: [
    { kind: 'zone', id: 'next-fires', zone: 'app.dashboard.panels', module: './components/NextFiresCard.tsx' },
  ],
  requires: { procedures: ['crons.list', 'crons.nextFires'] },
});
```

The always-current symbol list is `deno doc jsr:@netscript/plugin-frontend-core@<version>`.
````

---

## Fragment: `@netscript/fresh` — `./plugins` row and section

Add to the entrypoint table:

````markdown
| `@netscript/fresh/plugins` | `./src/runtime/plugins/mod.ts` | Plugin frontend mounting: `definePluginPage`, `pluginApi`, `PluginZone`, `pluginNavSections`, `mountPluginFrontends`. |
````

Add as a section:

````markdown
## Plugin frontends

Pass the generated registry to `defineFreshApp` and every installed plugin's pages, islands, zone
components, nav entries, and theme CSS mount themselves — no app edits:

```ts
import { defineFreshApp } from '@netscript/fresh/server';
import { frontendRegistry } from './.netscript/generated/frontend.registry.ts';

export const app = defineFreshApp<State>({ name: 'my-app', frontend: frontendRegistry });
```

Mounting runs as a dedicated composition phase after the host's own routes, as thin wrappers over
upstream Fresh primitives: `App.mountApp` for routes, `islandSpecifiers` for islands, `app.use`
for the gateway. Plugin route modules are authored with `definePluginPage` (Fresh `PageProps` plus
the injected plugin contexts); islands call home through `pluginApi`, which targets the generated
deny-by-default procedure gateway. `<PluginZone id>` renders a host-published zone, and
`pluginNavSections(registry, { group })` feeds contributed entries into the app's navigation.

Plugin authors should read the guide *Ship frontend from your plugin*; app authors only need the
one option above.
````

---

## Fragment: `@netscript/plugin` — contribution-vocabulary bullet + section

Extend the contribution-vocabulary bullet:

````markdown
- **A rich contribution vocabulary** — declare services, background processors, stream topics,
  database schemas, migrations, runtime-config topics, telemetry, and **frontend surfaces** as
  typed contribution axes.
````

Add as a section:

````markdown
## The frontend axis is a pointer

A plugin that ships a frontend registers it with one builder call:

```ts
.withFrontend({ export: './frontend', framework: 'fresh', contract: [{ family: 'app', major: 1 }] })
```

and the matching `scaffold.plugin.json` block:

```jsonc
{ "frontend": { "export": "./frontend", "framework": "fresh", "contract": [{ "family": "app", "major": 1 }] } }
```

The block is a parse-only pointer — the same idiom as `scaffolder.export`. No frontend vocabulary
lives in this package: the typed contract (`defineFrontend`, the five contribution kinds, host
contexts) is owned by `@netscript/plugin-frontend-core`, and discovery is the CLI's generated
registry. Older toolchains ignore the block safely, because an older host also lacks the frontend
generation step — there is no half-wired state.
````

---

## Fragment: `@netscript/cli` — plugin-frontend verbs section

````markdown
## Plugin frontend commands

The CLI discovers, generates, and maintains plugin frontend wiring. The app-side emissions live in
`.netscript/generated/frontend.*` and are produced transactionally — staged, type-checked, and
swapped atomically — so a failed generation never leaves a half-updated host.

| Command | What it does |
| --- | --- |
| `netscript plugin new <name> --with frontend` | Scaffold the `frontend/` tree, register the manifest axis, and seed the `deno.json` export map. |
| `netscript plugin dev` | In a plugin directory: watch `frontend/`, keep the export map in sync, regenerate the host registry atomically, and signal the app's Vite server to reload. |
| `netscript plugin install <spec>` | Regenerate the frontend emissions and type-check the staged set — a broken module export fails the install with the real diagnostic. |
| `netscript plugin update` / `remove` | Re-pin (or deterministically empty) the emissions; removal can never leave dangling imports. |
| `netscript generate plugins` | Regenerate every axis registry, including `frontend.*`. |
| `netscript generate frontend` | In a plugin directory: derive contribution lists from the file-tree convention and repair the export map. |
| `netscript generate frontend-wiring` | Idempotently adopt the layer in an existing app: Vite island feed, router merge, zone hints, CSS import. |
| `netscript plugin resource add <plugin> <resource> --app <path>` | Copy a scaffolded-starter resource into a chosen app — app-owned from that moment, drift-reported on update. |
| `netscript plugin doctor` | Frontend check: envelope/window handshake, zone validity against the host descriptor, export-map presence, and orphan/stale generated output. |
````
