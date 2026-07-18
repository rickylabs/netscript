# Worked example — Dev-dashboard panels (draft)

> **Draft — design document only.** Shows (a) how the base family already carries useful panels
> in the scaffolded app today, and (b) how the ratified dashboard architecture becomes a family
> extension of this layer instead of a sibling.

## Today

No dashboard package exists; the scaffolded `/dashboard` route renders a hardcoded `services`
array (`packages/cli/src/kernel/assets/app/routes/dashboard.tsx.template`), nav is static arrays
(`DESIGN_NAVIGATION`; `_layout.tsx.template:33-74`). The full dashboard contribution family (7
kinds) is designed but unbuilt
(`dashboard-design--orchestrator/analysis/plugin-extension-architecture.md`).

## Step 1 (this layer, phase 1-2): plugin panels in the SCAFFOLDED app

The workers plugin surfaces its queue health on the app's own `/dashboard` page — no dashboard
host needed:

```ts
// plugins/workers/frontend/mod.ts
export default defineFrontend({
  contract: 'v1',
  plugin: 'workers',
  base: '/workers',
  routes: [{
    kind: 'route', id: 'console', path: '/', module: './routes/console.tsx',
    nav: { label: 'Workers', icon: 'activity', group: 'main' },
  }],
  islands: [{ kind: 'island', id: 'queue-live', module: './islands/QueueLive.tsx' }],
  zones: [{
    kind: 'zone', id: 'queue-health', zone: 'app.dashboard.panels',
    module: './components/QueueHealthPanel.tsx', order: 10,
  }],
  requires: { procedures: ['workers.jobs.stats', 'workers.dlq.depth'] },
});
```

```tsx
// plugins/workers/frontend/components/QueueHealthPanel.tsx — SSR zone component
import type { ZoneProps } from '@netscript/plugin-frontend-core/contracts/v1';
import { createWorkersClient } from '@netscript/plugin-workers-core/contracts/v1';
import { QueueLive } from '../islands/QueueLive.tsx';

export default async function QueueHealthPanel({ host }: ZoneProps) {
  const stats = await createWorkersClient(host.serviceUrl('workers-api')).jobs.stats();
  return (
    <article class='nsw-panel'>{/* --ns-* styled card */}
      <h3>Job queues</h3>
      <QueueLive initial={stats} />          {/* hydrates; polls via pluginApi('workers') */}
      <a href={`${host.base}/`}>Open workers console →</a>
    </article>
  );
}
```

Install workers → the scaffolded dashboard grows a live queue-health panel and the nav gains
"Workers", with `/workers` serving a full console page. The four first-party plugins
(workers/sagas/triggers/streams) each ship one zone panel + one console route — **the dogfood
proof** (#427's acceptance idea, relocated to the app surface).

## Step 2 (dashboard run): the dashboard host consumes the same registry

The future dev dashboard is a NetScript Fresh app whose host policy differs, not a new mechanism:

- mounts every plugin's routes under `/plugins/<pluginId>/…` (host base remap,
  `04-host-runtime.md §2`);
- defines **additional zones** (`dashboard.home.*`, `entity.<kind>.detail.sidebar`, …) — the
  `ZoneContribution.zone` type is open to host-published zone sets by design;
- targets contributions with `surfaces: ['dashboard']` where a panel is dashboard-only.

## Step 3 (dashboard run): the family extension

`plugin-dashboard-core/contracts/v1` re-exports this base family and **adds** dashboard-only
kinds — panels-with-slots/setup bindings, `entity-tab`, `action` (⌘K + `cliEquivalent` confirm),
`ai-tool`, `home-card` — exactly the seven-member union already ratified, now defined as
`DashboardContribution = FrontendContribution | DashboardPanelContribution | …`. The dashboard's
manifest block, registry emission, trust tiers (T1/T2 iframe sandbox), and injection-zone
inspector proceed per the prior design, unchanged, on top of this layer's discovery pipeline —
one emission, one handshake, one doctor check family.

**What this run hands the dashboard run:** the discovery pipeline, the mount glue, zones, nav,
route refs, and four dogfood panels — so the dashboard epic starts at "define richer kinds and
the host app", not "invent discovery".
