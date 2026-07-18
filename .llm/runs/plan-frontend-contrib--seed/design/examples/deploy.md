# Worked example — Deploy plugin (draft)

> **Draft — design document only.** The freshest consumer: branch `plan/deploy-plugin` (stage-A
> bootstrap) redefines deploy as a plugin so it can "contribute to every layers (even frontend
> soon)" — owner-ratified intent quoted in its kickoff. This example shows the two cloud seams
> that intent implies, expressed against this layer's API. It is a design input to the deploy
> seed run, not a commitment on its behalf.

## Assumed shape (from ARCHETYPE-7 + the deploy-plugin direction)

`plugin-deploy` (core) + per-target adapter packages (`deploy-cloudflare`, `deploy-aws`,
`deploy-vercel`) behind the deploy-target port with the uniform op set
`plan/emit/up/down/status/logs` (`.llm/harness/archetypes/ARCHETYPE-7-deploy-target-adapter.md`).

## Seam 1 — LIVE: the deploy console

The core deploy plugin contributes one console; **target adapters contribute panels into it
without touching core** — the same composition trick the app dashboard uses, via a
plugin-published zone pattern:

```ts
// plugins/deploy/frontend/mod.ts  (core)
export default defineFrontend({
  contract: 'v1',
  plugin: 'deploy',
  base: '/deploy',
  routes: [{
    kind: 'route', id: 'console', path: '/', module: './routes/console.tsx',
    nav: { label: 'Deploy', icon: 'rocket', group: 'main' },
  }, {
    kind: 'route', id: 'environment', path: '/env/:env', module: './routes/env.tsx',
  }],
  islands: [
    { kind: 'island', id: 'status-live', module: './islands/StatusLive.tsx' },
    { kind: 'island', id: 'logs-tail', module: './islands/LogsTail.tsx' },
  ],
  zones: [{
    kind: 'zone', id: 'deploy-status', zone: 'app.dashboard.panels',
    module: './components/DeployStatusCard.tsx', order: 20,
  }],
  requires: { procedures: ['deploy.status', 'deploy.logs', 'deploy.plan'] },
});
```

The console page renders per-target sections from the deploy-target registry (a backend
registry, ARCHETYPE-7); `StatusLive`/`LogsTail` stream `status`/`logs` through the plugin API
proxy. Mutating ops (`up`/`down`) render as confirm-gated actions **printing the exact CLI
equivalent** (`netscript deploy cloudflare up --env staging`) — the NetScript signature carried
from the dashboard family's action design; on the app surface this is a plugin-internal pattern,
formalized as an `ActionContribution` kind only in the dashboard family.

**Cloud-specific console surface** comes from the adapter packages as *published islands* the
core console composes (plugin-to-plugin composition through explicit exports —
`04-host-runtime.md §10`): `deploy-cloudflare` exports a `WorkersKvBrowser` island, `deploy-aws`
a `QueueDepthPanel`. Core's console imports lazily per registered target; an absent adapter means
an absent section. If adapters later become standalone plugins, each ships its own
`frontend/mod.ts` and the composition moves to zones — both paths are supported by the layer.

## Seam 2 — SCAFFOLDED STARTER: cloud-optimized frontend seams

The owner's scaffolding intent ("a cloudflare optimized project that ships seams that already
are cloudflare first — workers, durable objects, KV") is the `AppTarget` copy model, verb-for-verb
(`05-scaffolding-and-cli.md §3`):

```
netscript plugin resource add deploy cloudflare-edge --app .
  → routes/api/edge/[...path].ts     (Workers-first handler seam, app-owned)
  → lib/deploy/kv.ts                 (KV binding wrapper typed against the adapter port)
  → lib/deploy/durable.ts            (DO session seam)
  → netscript.config patch           (deploy target defaults: cloudflare)
```

Same story per target (`aws-lambda-edge`, `vercel-functions` starters). These are **starters** —
cloud-first code the user owns and evolves — while `deploy.status`/`logs`/`up` stay live in the
console. The one-generator-two-callers law holds: the dashboard's future "Add to app" flow calls
the same scaffolder with the same `AppTarget`.

## What this hands the deploy seed run

A concrete answer to its kickoff §3 ("what the deploy plugin contributes to EVERY layer"): the
frontend row of that table is `defineFrontend` (console + status panels + per-adapter islands)
plus `AppTarget` starter resources (cloud-first seams) — no deploy-specific frontend machinery
to invent.
