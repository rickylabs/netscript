# Getting Started

Use the core package when you need to define trigger behavior or compose trigger runtime tests.

Use the plugin package when you need CLI commands, scaffolded files, services, or Aspire resources.

## Define A Webhook

```ts
import { assertEquals } from 'jsr:@std/assert@^1';
import { defineWebhook } from '../mod.ts';

const webhook = defineWebhook(
  async () => [],
  {
    id: 'orders-created',
    path: '/webhooks/orders-created',
    verifier: 'memory',
  },
);

assertEquals(webhook.kind, 'webhook');
assertEquals(webhook.verifier, 'memory');
```

## Define A File Watch

```ts
import { assertEquals } from 'jsr:@std/assert@^1';
import { defineFileWatch } from '../mod.ts';

const watch = defineFileWatch(
  async () => [],
  {
    id: 'import-dropbox',
    paths: ['./imports'],
    patterns: ['**/*.json'],
    on: ['create'],
  },
);

assertEquals(watch.kind, 'file-watch');
assertEquals(watch.paths, ['./imports']);
```

## Define A Schedule

```ts
import { assertEquals } from 'jsr:@std/assert@^1';
import { defineScheduledTrigger } from '../mod.ts';

const schedule = defineScheduledTrigger(
  async () => [],
  {
    id: 'daily-digest',
    cron: '0 8 * * *',
    timezone: 'UTC',
  },
);

assertEquals(schedule.kind, 'scheduled');
assertEquals(schedule.cron, '0 8 * * *');
```

## Choose Subpaths

Start with the root barrel for application trigger files.

Move to `runtime` when composing processors or ingress.

Move to `ports` when implementing a runtime boundary.

Move to `testing` when writing deterministic unit tests.

Move to `contracts/v1` when binding service routers.

Move to `telemetry` when wiring tracing or metrics.

Move to `config` when validating trigger config.

## Validate Locally

Run `deno task check` from `packages/plugin-triggers-core`.

Run `deno task test` from `packages/plugin-triggers-core`.

Run `deno publish --dry-run --allow-dirty` before publication.
