# @netscript/plugin-triggers

NetScript plugin for trigger ingress, scheduling, file watching, and the trigger runtime — the operational plugin layer around `@netscript/plugin-triggers-core`.

## Install

```sh
deno add jsr:@netscript/plugin-triggers
```

The trigger DSL and runtime contracts live in `@netscript/plugin-triggers-core`. This package
contributes the plugin manifest, starts the HTTP ingress service, wraps production primitives
(`@netscript/cron`, `@netscript/watchers`), generates userland trigger modules, and declares runtime
resources for local orchestration.

Operational APIs stay on subpaths so importing the root barrel does not pull in service, CLI,
watcher, cron, or Aspire dependencies:

| Subpath         | Purpose                                           |
| --------------- | ------------------------------------------------- |
| `.`             | Curated plugin manifest exports.                  |
| `./public`      | Manifest constants and inspection surface.        |
| `./plugin`      | Plugin package contribution aliases.              |
| `./cli`         | CLI command model and local project backend.      |
| `./scaffolding` | Trigger definition scaffolders.                   |
| `./runtime`     | Cron, watcher, and processor runtime entrypoints. |
| `./aspire`      | Aspire resource contribution.                     |
| `./services`    | Triggers API service entrypoint.                  |

## Quick example

The root barrel is intentionally small. Use it to wire the plugin manifest and inspect it:

```ts
import {
  inspectTriggers,
  TRIGGERS_API_DEFAULT_PORT,
  triggersPlugin,
} from '@netscript/plugin-triggers';

const inspection = inspectTriggers(triggersPlugin);

console.log(inspection.id); // "triggers"
console.log(TRIGGERS_API_DEFAULT_PORT); // 8093
```

Application trigger definitions import the DSL from `@netscript/plugin-triggers-core`, not from this
plugin package:

```ts
import { defineWebhook, enqueueJob } from '@netscript/plugin-triggers-core/builders';
import { sendReceiptJob } from '../workers/jobs/send-receipt.ts';

export default defineWebhook(async (event) => {
  return [enqueueJob(sendReceiptJob, { payload: event.payload })];
}, {
  id: 'orders.receipt',
  path: 'orders/created',
  verifier: 'hmac-sha256',
  secretEnv: 'ORDERS_WEBHOOK_SECRET',
});
```

The `triggers-api` service defaults to port `8093`. Webhook delivery follows the trigger core
ack-then-process contract: the HTTP handler verifies the request, records the event, schedules
processing asynchronously, and returns `202` without waiting for handler execution. The shipped
pipeline is durability tier T1 (at-least-once, retries, dedup, dead-letter, circuit breaker, explicit
status transitions).

## Docs

- [API reference](https://rickylabs.github.io/netscript/reference/triggers/)
- [Concepts & guides](https://rickylabs.github.io/netscript/)
- [Core DSL package](https://rickylabs.github.io/netscript/reference/triggers-core/) — `@netscript/plugin-triggers-core`
