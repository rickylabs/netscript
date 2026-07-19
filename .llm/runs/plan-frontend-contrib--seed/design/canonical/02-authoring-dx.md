# Authoring DX — what a plugin author actually writes (draft, rev 2)

> **Draft — design document only.** Rev 2 integrates adversarial findings S-5, S-16 (and the
> rev-2 contract shapes from S-7/S-8/S-10). This document remains the DX bar the implementation
> is held to: if a mechanism choice makes a snippet below longer or stranger, the mechanism is
> wrong — but the bar now also refuses *hidden* work (S-16): every step the author must do is on
> this page, none deferred to folklore.

## The pitch, in one screen

You already know how to write a Fresh app: `routes/`, `islands/`, components, `--ns-*` tokens.
A plugin frontend is **that, in a `frontend/` folder**, plus one declaration file:

```
plugins/crons/
  frontend/
    mod.ts
    routes/calendar.tsx        routes/schedules/[id].tsx
    islands/CronCalendar.tsx
    components/NextFiresCard.tsx
    theme.css
```

```ts
// plugins/crons/frontend/mod.ts — the whole declaration
import { defineFrontend } from '@netscript/plugin-frontend-core';

export default defineFrontend({
  // contract defaults to { family: 'app', major: 1 } — override only for other families (K-7)
  pluginKind: 'crons',
  base: '/crons',
  routes: [
    {
      kind: 'route',
      id: 'calendar',
      path: '/calendar',
      module: './routes/calendar.tsx',
      // string labels compile to MessageRefs with derived ids (K-8); pass { id, default } to
      // control the catalog key
      nav: { label: 'Cron calendar', icon: 'calendar', group: 'main' },
    },
    { kind: 'route', id: 'schedule-detail', path: '/schedules/:id', module: './routes/schedules/[id].tsx' },
  ],
  islands: [{ kind: 'island', id: 'cron-calendar', module: './islands/CronCalendar.tsx' }],
  zones: [
    { kind: 'zone', id: 'next-fires', zone: 'app.dashboard.panels', module: './components/NextFiresCard.tsx' },
  ],
  theme: { kind: 'theme', id: 'theme', css: ['./theme.css'] },   // one overlay per plugin (K-6)
  requires: { procedures: ['crons.list', 'crons.nextFires'] },
});
```

`defineFrontend` validates and freezes; the keyed form compiles to the versioned envelope
(`01-contracts.md`). Register the axis on the plugin (one builder call + one manifest block):

```ts
// plugins/crons/src/public/mod.ts
.withFrontend({ export: './frontend', framework: 'fresh' })   // family/major derived from the module (K-10)
```

```jsonc
// plugins/crons/scaffold.plugin.json
{ "frontend": { "export": "./frontend", "framework": "fresh" } }
```

## Writing the pages: it is just Fresh (with one import that is honest about where it lives)

```tsx
// plugins/crons/frontend/routes/calendar.tsx
import { definePluginPage } from '@netscript/fresh/plugins';   // runtime sugar lives with the runtime (S-5)
import { CronCalendar } from '../islands/CronCalendar.tsx';
import { createCronsClient } from '@acme/plugin-crons/contracts/v1';

export default definePluginPage(async (ctx) => {
  // ctx is Fresh PageProps + typed ctx.host (PluginRequestContext, injected via app state).
  const crons = await createCronsClient(ctx.host.serviceUrl('crons-api')).crons.list();
  return (
    <section class='ns-stack ns-stack--lg'>
      <h1 class='ns-heading'>Cron calendar</h1>
      <CronCalendar initial={crons} client={ctx.client} />
    </section>
  );
});
// Sugar-free equivalent: plain `define.page`, reading props.state.pluginHost yourself.
```

```tsx
// plugins/crons/frontend/islands/CronCalendar.tsx
import { useSignal } from '@preact/signals';
import { pluginApi } from '@netscript/fresh/plugins';
import type { PluginClientContext } from '@netscript/plugin-frontend-core/contracts/v1';

export function CronCalendar(props: { initial: readonly CronEntry[]; client: PluginClientContext }) {
  const entries = useSignal(props.initial);
  async function refresh() {
    // Client-side calls go through the generated deny-by-default gateway (04 §4):
    entries.value = await createCronsClient(pluginApi(props.client)).crons.list();
  }
  return ( /* --ns-* styled markup */ );
}
```

**The serialization rule (S-16, stated where authors will read it):** island props cross the
server→client boundary and must be serializable data — no functions, no `Request`, no server
context. Pass `ctx.client` (the serializable `PluginClientContext`), never `ctx.host`. The
`./testing` kit fails a contribution whose island props don't round-trip.

## The dev loop — two modes, stated honestly (S-16)

```
netscript plugin new crons --with frontend   # scaffolds the tree above + manifest + exports
netscript plugin dev                         # in the plugin dir: watches frontend/, maintains
                                             # deno.json exports, regenerates the host registry
                                             # atomically, signals vite (reload islands / HMR)
```

- **Local-source mode** (plugin in the workspace): route/component edits hot-reload through
  vite `watchPaths`; island-list changes and manifest edits are picked up by
  `netscript plugin dev`'s regeneration + reload signal. This is the primary authoring loop.
- **JSR-installed mode**: packages are immutable; the loop is publish → `plugin update`. Island
  build behavior in this mode is Wave-0-gated ([P3], `04 §3`). Docs never pretend the two loops
  are the same.

**Export-map maintenance is tooling-owned from phase 1** (S-16 — was phase 2): JSR resolves only
published entrypoints, so `./frontend` and every route/island module need explicit `deno.json`
exports; `plugin new --with frontend` seeds them and `plugin dev` / `generate frontend` keep
them in sync. Authors never hand-maintain the export list (hand-written manifests are still
fine — the generator only owns the export map + optional convention-derived lists).

## What an author CANNOT do (guardrails as DX)

- Pass non-serializable island props (checked by the test kit; explained above).
- Import the app's copied `components/ui/*` (app-owned); use tokens + fresh-ui runtime exports.
- Ship a plugin `_layout` in v1 (rejected at generate time — S-2; wrap pages in a shared
  component instead).
- Rely on SSR error boundaries for a crashing zone render — fetch in the resolver, keep render
  pure (the containment contract, `04 §6`).
- Claim routes outside the mount base; mutate the registry at runtime; ship raw hex colors
  (`--ns-*` only).
