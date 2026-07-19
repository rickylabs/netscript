# Ship frontend from your plugin

A NetScript plugin is a full-stack unit. The same package that contributes services, workers,
schemas, and Aspire wiring can also contribute **pages, islands, zone components, nav entries, and
theme CSS** to any NetScript Fresh app — declared as data in a `frontend/` directory, discovered by
the CLI, and mounted by the host with zero app edits.

You write ordinary Fresh code — the same `routes/`-and-`islands/` idiom you already know — plus one
`defineFrontend()` export. This guide walks through the whole life of a plugin frontend: scaffolding
it, declaring it, iterating on it, and fixing it when something is off.

## Quickstart: a cron calendar in five minutes

You need a NetScript workspace with a scaffolded app. Everything below lives in the plugin you are
about to create — the app is never edited.

**1 · Scaffold the plugin with the frontend axis.**

```bash
netscript plugin new crons --with frontend
```

The generator emits the frontend tree, registers the axis in `scaffold.plugin.json`, and seeds the
`deno.json` export map (`./frontend` plus every route and island module — tooling maintains that
list from here on, you never hand-edit it):

```text
plugins/crons/
  frontend/
    mod.ts                     ← the one declaration
    routes/calendar.tsx        ← an ordinary Fresh route module
    islands/CronCalendar.tsx   ← an ordinary Fresh island (one component per file)
    components/NextFiresCard.tsx
    theme.css                  ← --ns-* overlays only
```

**2 · Declare what the plugin contributes.** `frontend/mod.ts` is the whole contract — validated
and frozen by `defineFrontend`:

```ts
// plugins/crons/frontend/mod.ts
import { defineFrontend } from '@netscript/plugin-frontend-core';

export default defineFrontend({
  contract: { family: 'app', major: 1 },
  pluginKind: 'crons',
  base: '/crons',
  routes: [
    {
      kind: 'route',
      id: 'calendar',
      path: '/calendar',
      module: './routes/calendar.tsx',
      nav: { label: { id: 'crons.nav.calendar', default: 'Cron calendar' }, icon: 'calendar', group: 'main' },
    },
    { kind: 'route', id: 'schedule-detail', path: '/schedules/:id', module: './routes/schedules/[id].tsx' },
  ],
  islands: [{ kind: 'island', id: 'cron-calendar', module: './islands/CronCalendar.tsx' }],
  zones: [
    { kind: 'zone', id: 'next-fires', zone: 'app.dashboard.panels', module: './components/NextFiresCard.tsx' },
  ],
  theme: [{ kind: 'theme', id: 'theme', css: ['./theme.css'] }],
  requires: { procedures: ['crons.list', 'crons.nextFires'] },
});
```

**3 · Write the page and the island.** Pages use `definePluginPage`, which types the host context
the mount layer injects. It is just Fresh underneath:

```tsx
// plugins/crons/frontend/routes/calendar.tsx
import { definePluginPage } from '@netscript/fresh/plugins';
import { CronCalendar } from '../islands/CronCalendar.tsx';
import { createCronsClient } from '@acme/plugin-crons/contracts/v1';

export default definePluginPage(async (ctx) => {
  // ctx is Fresh PageProps + typed ctx.host (server-only) and ctx.client (island-safe).
  const crons = await createCronsClient(ctx.host.serviceUrl('crons-api')).crons.list();
  return (
    <section class='ns-stack ns-stack--lg'>
      <h1 class='ns-heading'>Cron calendar</h1>
      <CronCalendar initial={crons} client={ctx.client} />
    </section>
  );
});
```

**4 · Install it into the app.**

```bash
netscript plugin install crons --local-path ./plugins/crons
```

Install regenerates the app's frontend wiring, type-checks the staged output — a broken module
export fails here, with the real diagnostic, not at the first Vite build — and swaps it in
atomically. The app now serves `/crons/calendar`, the sidebar gains **Cron calendar**, the
dashboard grows a *Next fires* panel, and the theme overlay applies. No app file changed.

**5 · Iterate.** In the plugin directory:

```bash
netscript plugin dev
```

`plugin dev` watches `frontend/`, keeps the export map in sync, regenerates the host registry
atomically, and signals the app's Vite server to reload. Edit the calendar page and the change is
in front of you.

## The authoring model

Everything a plugin contributes is one of **five kinds**, declared in `frontend/mod.ts` and
compiled into a versioned manifest envelope. Component references are module specifiers — data —
which is what keeps the registry statically generatable.

| Kind    | What it is                                                        | Where it lands                |
| ------- | ----------------------------------------------------------------- | ----------------------------- |
| `route` | A Fresh route module (page and/or handlers) mounted under `base`. | `base + path`, e.g. `/crons/calendar` |
| `island` | One interactive component per file, hydrated on the client.      | Imported by routes and zones. |
| `zone`  | An SSR component injected into a host-published zone.             | `<PluginZone>` render points. |
| `nav`   | A navigation entry with a discriminated target.                   | Host sidebar / topbar.        |
| `theme` | CSS overlays in the `--ns-*` token vocabulary.                    | The aggregated stylesheet.    |

### Routes

A route's `path` is composed **under the resolved mount base** in Fresh pattern syntax —
`path: '/calendar'` with `base: '/crons'` serves `/crons/calendar`. The `module` is a
package-relative specifier; the generated registry emits a literal lazy loader for it, so the
bundler sees a real edge. Two conveniences worth knowing:

- `nav` on a route is shorthand: it emits a nav contribution targeting that route, with the base
  path composed for you.
- Typed hrefs are generated for every contributed route — `routes.plugins.crons.calendar.href()` —
  so the app and other plugins link without string concatenation.

Plugin `_layout` modules are not supported: wrap pages in a shared component instead. A plugin
route that throws fails **that route**, host-styled — never the app shell.

### Islands

Islands follow the Fresh convention: one component per file. The one rule that matters crosses the
serialization boundary:

> **Island props must be serializable data.** No functions, no `Request`, no server context. Pass
> `ctx.client` (the serializable `PluginClientContext`), never `ctx.host`. The testing kit fails a
> contribution whose island props do not round-trip.

### Zones

Zones are SSR render points the **host** publishes — the scaffolded app ships
`app.topbar.end`, `app.dashboard.panels`, `app.home.cards`, and `app.footer`. A zone contribution
names a zone id and an SSR component; the host renders contributions in deterministic order and
validates the zone id against its own published surface, so a typo is a generate-time error, not a
silent miss.

Zone components receive `{ url, host, client }` server-side and may forward only `client` (or
slices of it) to islands. Keep renders pure: **fetch in the resolver, not the component body** —
see [Troubleshooting](#troubleshooting) for why.

### Nav

A nav contribution's target is discriminated — no ambiguous strings:

```ts
target: { kind: 'route', routeId: 'calendar' }      // same plugin; base path composed
target: { kind: 'href', href: '/settings' }         // host-internal absolute path
target: { kind: 'external', href: 'https://…' }     // rel="noopener noreferrer" enforced
```

Labels are message references (`{ id, default }`), so hosts with a message catalog can localize
them and every host always has the default text. The `group` is validated against the host's nav
groups — the scaffolded app publishes `main`.

### Theme

Theme contributions are CSS files written against the `--ns-*` token vocabulary and nothing else.
See [Theming with `--ns-*` tokens](#theming-with---ns--tokens) below.

## The dev loop

Two modes exist, and they are honestly different:

- **Local-source mode** (the plugin lives in your workspace) is the primary authoring loop.
  Route and component edits hot-reload through Vite's `watchPaths`. Island-list changes and
  manifest edits are picked up by `netscript plugin dev`, which regenerates the host registry and
  signals a reload. This is the mode the quickstart uses.
- **Published mode** (the plugin is installed from JSR) is immutable: packages do not change on
  disk, so the loop is *publish → `netscript plugin update`*. Island edits in this mode take a
  signaled full reload rather than HMR. Neither loop pretends to be the other; plan your
  inner-loop work in local-source mode and treat published installs as release consumption.

In both modes the **export map is tooling-owned**: JSR resolves only published entrypoints, so
`./frontend` and every route/island module need explicit `deno.json` exports. `plugin new --with
frontend` seeds them; `plugin dev` and `netscript generate frontend` keep them in sync.

## Data access: typed clients and the gateway

**Server-side code does not need a proxy.** Route handlers and zone resolvers call typed clients
directly against the host's service resolution:

```ts
const crons = await createCronsClient(ctx.host.serviceUrl('crons-api')).crons.list();
```

`ctx.host` also carries the principal port (supplied by the auth plugin when installed, `null`
otherwise), the resolved mount base, the CSP nonce seam, and the request's abort signal.

**Browser code goes through the generated gateway.** The gateway is a deny-by-default route table
generated from your `requires.procedures` — one route per granted procedure, derived from your
plugin's own versioned contract metadata. Nothing else is reachable: no wildcard forwarding, ever.
It authenticates server-side through the host principal, enforces origin/CSRF checks, size limits,
timeouts, and abort propagation, and writes a structured audit line per call.

Islands reach it through `pluginApi`, which turns the client context into the gateway base URL:

```tsx
// plugins/crons/frontend/islands/CronCalendar.tsx
import { useSignal } from '@preact/signals';
import { pluginApi } from '@netscript/fresh/plugins';
import type { PluginClientContext } from '@netscript/plugin-frontend-core/contracts/v1';

export function CronCalendar(props: { initial: readonly CronEntry[]; client: PluginClientContext }) {
  const entries = useSignal(props.initial);
  async function refresh() {
    entries.value = await createCronsClient(pluginApi(props.client)).crons.list();
  }
  // …
}
```

`requires` is the actual allowlist, not an audit comment — a procedure you do not declare has no
gateway route. Granted capabilities also surface on `ctx.client.capabilities`, so a plugin can
degrade its UI cleanly when a host (or an adapter) does not provide something.

## Starters vs live: two delivery models

> **If the user will edit it, scaffold it; if the plugin owns it, serve it.**

- **Live (default).** The app imports the plugin's published frontend modules; updates ship with
  the package version. Right for consoles, panels, and widgets — surfaces the plugin *operates*.
- **Scaffolded starter (opt-in).** Files are generated into the app and become app-owned. Right
  for surfaces the user is expected to customize — a sign-in page, a cloud-optimized route.

Starters are delivered through the resource channel:

```bash
netscript plugin resource add auth signin --app .
# → routes/auth/signin.tsx, routes/auth/callback.tsx  (app-owned from this moment)
```

Starters compose existing backend procedures — they never fabricate backend surface. Updates
report drift, never overwrite, and each generated file carries a provenance header so `plugin
doctor` can report an orphaned starter without ever deleting it. A plugin may ship both models for
the same feature: the auth plugin serves the account page live and scaffolds the sign-in page.
Start live, eject to a starter when you need to own the pixels.

## Theming with `--ns-*` tokens

Plugin CSS speaks one vocabulary: the `--ns-*` semantic custom properties. That buys three things:

1. **The app always wins.** The generated stylesheet opens with a host-owned layer prelude
   (`@layer ns-app, ns-plugins;`), so plugin CSS loses to app CSS by declaration, not by luck.
2. **Scoping is automatic.** Zones and plugin route trees render under
   `[data-ns-plugin='<mountId>']` wrappers. Overlays and portals escape wrappers, so the host
   provides a per-plugin portal root under `document.body` — fresh-ui overlay primitives mount
   there via the client context.
3. **Themes come for free.** Token overlays inherit light/dark and any host theme swap; raw hex
   values are out of contract.

```css
/* plugins/crons/frontend/theme.css */
[data-ns-plugin='crons'] .cron-calendar {
  background: var(--ns-surface-raised);
  color: var(--ns-fg);
  border-color: var(--ns-border);
}
```

## Troubleshooting

**Install fails with a type error.** The staged generation is type-checked before it swaps in —
including a check module that imports every referenced route, island, and CSS module. A missing
deep export fails install with the real diagnostic; run `netscript plugin dev` (or
`netscript generate frontend`) in the plugin to repair the export map, then reinstall.

**A contribution renders as a quarantine card.** Quarantine is a render state, not a crash, and it
is reserved for two causes: the plugin's `(family, major)` contract window falls outside what the
host supports, or a module failed to load. `netscript plugin doctor` prints the mismatch and the
remediation (usually: update the plugin, or update the host).

**A zone contribution silently does not appear.** Three diagnoses look alike but differ:

| Diagnosis              | Meaning                                            | Disposition                       |
| ---------------------- | -------------------------------------------------- | --------------------------------- |
| Unknown zone           | The id is not in the host's published surface — a typo. | Generate-time **error**.      |
| Known-but-unmounted    | The zone exists in the family but this host does not mount it. | **Informational**; contribution skipped, never quarantined. |
| Capacity-rejected      | The zone's capacity is exhausted.                  | Deterministic overflow report naming winners and losers. |

**A page 500s when a zone throws.** SSR render-time throws in zone components are not containable
by a component boundary — they fail the page response. That is why the rule exists: resolve data
in the resolver (host-side, before render, inside a guard), keep the render pure. Failed
resolutions render the quarantine card; pure renders cannot throw on data.

**Nav entry missing or route link broken.** Nav targets of kind `route` must name a route id from
the same plugin; unknown ids are generate-time errors. Use the generated typed refs
(`routes.plugins.crons.calendar.href()`) instead of hand-built strings.

**`netscript plugin doctor` is the front door.** Its frontend check validates the
envelope/window handshake, zone ids against the host descriptor, export-map presence, and
orphan/stale generated output — a registry entry with no installed plugin, a CSS import with no
file, a starter whose plugin is gone.

## See also

- `@netscript/plugin-frontend-core` reference — the contract vocabulary: `defineFrontend`, the
  envelope, the five kinds, identity, host contexts, `requires`, and the testing kit.
- `@netscript/fresh/plugins` reference — the runtime surface: the `frontend` option,
  `definePluginPage`, `pluginApi`, `PluginZone`, `pluginNavSections`, and the generated gateway.
- `@netscript/fresh-ui` — the `--ns-*` token vocabulary and component runtime.
