# Worked example — Deploy plugin (draft, rev 2)

> **Draft — design document only.** Rev 2 integrates adversarial finding S-15: the uniform op
> set is **seven** operations — `plan/emit`, `up`, `down`, `status`, `logs`, `rollback`,
> `secrets` (`.llm/harness/archetypes/ARCHETYPE-7-deploy-target-adapter.md:50-63`) — and rev 1's
> core-imports-adapter-islands composition reversed the adapter dependency direction. This
> example is a design input to the deploy seed run, not a commitment on its behalf.

## Assumed shape (from ARCHETYPE-7 + the deploy-plugin direction)

`plugin-deploy` (core) + per-target adapter packages behind the deploy-target port with the
uniform **seven-op** contract. The v1 console explicitly versions a **read-only surface**
(`status`, `logs`, `plan` preview) plus confirm-gated `up`/`down`; `rollback` and `secrets`
surface as capability-gated sections that adapters declare support for — an adapter without
`rollback` renders the absent-capability state, preserving the parity law.

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

**Cloud-specific console surface — adapters contribute, core consumes (S-15).** Rev 1 had core
lazily import adapter islands, which reverses the adapter boundary (core would know every
target, and third-party targets would need a core change). Corrected composition: the deploy
plugin's console publishes **deploy-family zones** (`deploy.console.target-panels`,
`deploy.env.detail.sidebar`) in its `HostSurfaceDescriptor` extension, and each target adapter
ships its own frontend manifest contributing panels into those zones (`deploy-cloudflare` → a
`WorkersKvBrowser` panel; `deploy-aws` → a `QueueDepthPanel`). Core imports **no** target
module; it renders its zone registry. A third-party target plugin gets console presence the
same way — the exact dogfood of this layer's zone mechanism, one level down.

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
