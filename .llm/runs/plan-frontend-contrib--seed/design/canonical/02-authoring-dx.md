# Authoring DX — what a plugin author actually writes (draft)

> **Draft — design document only.** This document is the DX bar the implementation is held to.
> If a mechanism choice would make any snippet below longer or stranger, the mechanism is wrong.

## The pitch, in one screen

You already know how to write a Fresh app: `routes/`, `islands/`, components, `--ns-*` tokens.
A plugin frontend is **that, in a `frontend/` folder**, plus one declaration file:

```
plugins/crons/
  frontend/
    mod.ts
    routes/
      calendar.tsx
      schedules/[id].tsx
      _layout.tsx
    islands/
      CronCalendar.tsx
    components/
      NextFiresCard.tsx
    theme.css
```

```ts
// plugins/crons/frontend/mod.ts — the whole declaration
import { defineFrontend } from '@netscript/plugin-frontend-core';

export default defineFrontend({
  contract: 'v1',
  plugin: 'crons',
  base: '/crons',
  routes: [
    {
      kind: 'route',
      id: 'calendar',
      path: '/calendar',
      module: './routes/calendar.tsx',
      nav: { label: 'Cron calendar', icon: 'calendar', group: 'main' },
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

Register the axis on the plugin (one builder call + one manifest block):

```ts
// plugins/crons/src/public/mod.ts — existing definePlugin chain
export const cronsPlugin = definePlugin('@acme/plugin-crons', VERSION)
  .withType('utility')
  .withService({ name: 'crons-api', entrypoint: './services/src/main.ts', port: 8093 })
  .withFrontend({ export: './frontend', framework: 'fresh', contract: 'v1' })   // ← new
  .build();
```

```jsonc
// plugins/crons/scaffold.plugin.json — additive block, parse-only discovery
{ "frontend": { "export": "./frontend", "framework": "fresh", "contract": "v1" } }
```

That's the complete authoring surface. Everything else — registry, islands build wiring, nav,
route refs, CSS aggregation, API proxy — is generated or host-side.

## Writing the pages: it is just Fresh

```tsx
// plugins/crons/frontend/routes/calendar.tsx — an ordinary Fresh route module
import { definePluginPage } from '@netscript/plugin-frontend-core';
import { CronCalendar } from '../islands/CronCalendar.tsx';
import { createCronsClient } from '@acme/plugin-crons/contracts/v1';

export default definePluginPage(async (ctx) => {
  // Server-side: typed client against the plugin's own service (base URL from host config).
  const crons = await createCronsClient(ctx.host.serviceUrl('crons-api')).crons.list();
  return (
    <section class='ns-stack ns-stack--lg'>
      <h1 class='ns-heading'>Cron calendar</h1>
      <CronCalendar initial={crons} />
    </section>
  );
});
```

```tsx
// plugins/crons/frontend/islands/CronCalendar.tsx — an ordinary Fresh island
import { useSignal } from '@preact/signals';
import { createCronsClient } from '@acme/plugin-crons/contracts/v1';
import { pluginApi } from '@netscript/plugin-frontend-core/contracts/v1';

export function CronCalendar(props: { initial: readonly CronEntry[] }) {
  const entries = useSignal(props.initial);
  async function refresh() {
    // Client-side: same typed client, same-origin proxy (/api/plugins/crons/…).
    entries.value = await createCronsClient(pluginApi('crons')).crons.list();
  }
  return ( /* fresh-ui-token-styled markup, --ns-* vars only */ );
}
```

Key DX properties, each load-bearing:

- **Islands are imported and rendered directly** — the registry feeds their specifiers to the
  build (`islandSpecifiers`), so hydration Just Works. No island wrapper API, no registration
  call in author code.
- **Types flow end-to-end** — pages import the plugin's own `contracts/v1` client; the island
  props are ordinary TypeScript. Breaking a contract breaks `deno check` in the generated
  workspace at install time, not the user's browser at runtime.
- **`definePluginPage`** is thin sugar over Fresh's `define.page` that types `ctx.host`
  (`PluginHostState`: service URL resolution, session claims, base path) — the ONLY new concept a
  page author meets. Plain `define.page` route modules also work; the sugar is optional.
- **Styling uses the app's tokens.** Only `--ns-*` semantic vars
  (`packages/fresh-ui/tokens/semantic.tokens.json`) — the plugin UI is automatically correct in
  light/dark and under any app theme override. Compiled fresh-ui *components* are not importable
  (copy-registry, app-owned); plugin markup uses tokens + its own CSS + the fresh-ui runtime
  helpers that ARE package exports (`Icon`, `DataGrid`, toast, `cn`, interactive namespaces).

## The dev loop

```
netscript plugin new crons --with frontend   # scaffolds the frontend/ skeleton above
cd plugins/crons && deno task dev            # plugin dev = the HOST app runs with local-source
                                             # plugin; vite watches plugins/** (watchPaths seam
                                             # already exists in createNetScriptVitePlugin)
```

- Local-source plugins are workspace members; editing `frontend/routes/calendar.tsx` hot-reloads
  the host app like any app file (vite `watchPaths` already includes workspace packages —
  `packages/fresh/src/application/vite/README.md`).
- `netscript generate plugins` re-emits the registry; `plugin install`/`uninstall` runs it
  automatically. Regeneration is idempotent (byte-identical skip — the `runtime-schemas`
  precedent).
- `netscript plugin doctor` gains a `frontend` check: contract handshake, zone validity, module
  refs resolvable, deno.json exports present.

## Convention generator (phase 2 sugar — the contract stays explicit)

`netscript generate frontend` (run inside the plugin) derives the `routes:`/`islands:` lists from
the file tree (Medusa's build-time convention, done the NetScript generated-file way) and
maintains the plugin's `deno.json` exports for `./frontend` and each island/route module — JSR
requires explicit exports, so the generator owns that bookkeeping, not the author. Authors who
prefer to write the manifest by hand simply do; the generated form is the same contract.

## What an author CANNOT do (guardrails, stated as DX)

- Import the app's copied `components/ui/*` — those are app-owned. Use tokens + package-safe
  fresh-ui runtime exports. (The auth example shows the scaffolded-starter path when you *want*
  the app to own and restyle a page — `../examples/auth.md`.)
- Claim routes outside the mount base — base remap/collisions are host decisions
  (`04-host-runtime.md §2`).
- Mutate the registry at runtime — there is no API for it, by design.
- Ship raw hex/oklch colors — theme CSS is `--ns-*` vocabulary (lint-gated later; debt entry
  until then).
