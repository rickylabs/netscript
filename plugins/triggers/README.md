# @netscript/plugin-triggers

NetScript plugin package for trigger service wiring, runtime adapters, generated registry ownership,
scaffold templates, CLI operations, Aspire resources, and plugin package contribution.

The trigger DSL and runtime contracts live in `@netscript/plugin-triggers-core`. This package is the
operational plugin layer around that core. It contributes the plugin manifest, starts the HTTP
ingress service, wraps production primitives, generates userland trigger modules, and declares
runtime resources for local orchestration.

## What This Package Owns

- The typed `triggersPlugin` manifest and plugin inspection helpers.
- `ns-triggers` command metadata and local project backends.
- Scaffolding for handler-first webhook, file-watch, and scheduled trigger modules.
- The trigger-owned runtime registry manifest in `scaffold.runtime.json`.
- The HTTP ingress service for webhook delivery and event inspection.
- The Aspire contribution for `triggers-api` and `trigger-processor`.
- The plugin adapters for `@netscript/cron` and `@netscript/watchers`.
- The E2E trigger roundtrip gate.
- Plugin package documentation and publish readiness metadata.

## Package Boundary

Application trigger definitions should import the DSL from `@netscript/plugin-triggers-core`, not
from this plugin package.

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

The plugin package is for platform wiring. It exposes the manifest at the root and operational
subpaths for CLI, scaffolding, Aspire, services, and adapters.

## Root Exports

The root barrel is intentionally small.

```ts
import {
  inspectTriggers,
  TRIGGERS_API_DEFAULT_PORT,
  triggersPlugin,
} from '@netscript/plugin-triggers';
```

Runtime adapters and operational APIs stay on subpaths so importing the root does not pull in
service, CLI, watcher, cron, or Aspire dependencies.

## Subpaths

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

The root export budget is capped at 15 named symbols. This README is part of that discipline: users
should be able to find the right subpath without widening the root package surface.

## Manifest

`triggersPlugin` declares the plugin identity, service contribution, runtime contribution, and
scaffold metadata needed by the platform.

It depends on the worker, stream, and saga core axes by type, not by importing their operational
plugins. That keeps the trigger plugin compatible with composition roots that choose different
production adapters for those axes.

The manifest is inspectable through `inspectTriggers()` for host tooling, diagnostics, and registry
generation.

## HTTP Ingress

The `triggers-api` service defaults to port `8093`.

It mounts:

- webhook ingestion routes;
- health and readiness routes;
- event listing and event detail routes.

Webhook delivery follows the trigger core ack-then-process contract. The HTTP handler verifies the
request, records the trigger event, schedules processing asynchronously, and returns `202` without
waiting for user handler execution.

## Webhook Verification

Production webhook routes use the core verifier port.

The default HMAC verifier lives in `@netscript/plugin-triggers-core/adapters`; this plugin wires it
into the HTTP service. The plugin does not create a verifier singleton. Hosts pass the service
context and dependencies through the service composition boundary.

## Runtime Adapters

The trigger core package defines ports only. This plugin owns the production primitive adapters.

- `CronTriggerSchedulerAdapter` wraps `@netscript/cron`.
- `WatchersFileWatcherAdapter` wraps `@netscript/watchers`.

These imports are intentionally plugin-only. The core package must remain independent of the cron
and watcher primitives so tests, edge hosts, and non-Deno runtimes can provide their own adapter
pairs.

## Scheduled Triggers

Scheduled trigger definitions are authored with `defineScheduledTrigger(handler, spec)` from the
core DSL.

The plugin scheduler adapter accepts volatile schedules today. Persistent schedules are guarded
until the persistent cron primitive lands behind the scheduler port. A persistent request fails with
a typed unsupported-operation error instead of silently downgrading durability.

## File Watch Triggers

File watch definitions are authored with `defineFileWatch(handler, spec)` from the core DSL.

The watcher adapter maps file lifecycle events into trigger events and preserves ignored patterns,
debounce windows, and stability thresholds. It also exposes pause, resume, unwatch, and stop
operations through the plugin runtime subpath.

## CLI

`ns-triggers` is exposed through the `./cli` subpath.

It supports scaffold and local inspection workflows:

- `add webhook`;
- `add file-watch`;
- `add scheduled`;
- `list`;
- `test`;
- `fire`;
- `preview`;
- `enable`;
- `disable`.

The CLI backend loads user trigger modules from the target project. Deno reports that dynamic
project-file import as unanalyzable during publish dry-run, which is expected and non-failing.

## Scaffolding

The scaffolders generate handler-first trigger modules.

Generated definitions import the DSL from `@netscript/plugin-triggers-core/builders` and return
typed trigger actions from handlers.

Default output paths follow:

```text
triggers/<id>-trigger.ts
```

The CLI refuses to overwrite an existing trigger module unless the caller passes `--force`.

## Aspire

The Aspire contribution registers two resources:

- `triggers-api`: the HTTP ingress service on port `8093`;
- `trigger-processor`: the background trigger processor entrypoint.

`trigger-processor` is owned by this plugin. Worker runtime manifests must not own trigger
scheduling or trigger registry generation.

## Runtime Registry

This package owns the trigger registry scaffold declaration in `scaffold.runtime.json`.

Generated registry output belongs under the trigger plugin namespace:

```text
.netscript/generated/plugin-triggers/
```

The registry is generated by tooling. Runtime code receives registry modules through explicit
composition inputs instead of using a global trigger registry.

## E2E Gate

The plugin includes a trigger roundtrip test under `src/e2e`.

The gate drives a webhook request through:

```text
Hono route -> TriggerIngressPort -> event store -> inline processor -> completed event
```

That keeps the test focused on the plugin service boundary while relying on the core processor
contract for runtime semantics.

## Authoring Imports

Trigger definitions should use the core builders subpath:

```ts
import { defineWebhook } from '@netscript/plugin-triggers-core/builders';
```

## Durability Model

The shipped trigger pipeline is T1.

T1 means:

- at-least-once processing;
- retry policy support;
- deduplication support;
- dead-letter routing;
- circuit breaker support;
- explicit event status transitions.

Outbox replay and full historical replay remain reserved for later durability work behind ports.

## Idempotency

The processor uses the core three-tier idempotency model:

- caller-provided idempotency key;
- request-header idempotency key;
- payload hash fallback.

Plugin HTTP ingress preserves the metadata needed by that model so webhook deliveries can share the
same processing path as file, scheduled, and manual trigger events.

## Logging

Runtime code uses the core logger port.

Plugin runtime processes and adapters should receive loggers through composition. They should not
write directly with `console.log` from runtime paths.

## Publish Readiness

The plugin dry-run gate is:

```bash
deno publish --dry-run --allow-dirty
```

The package currently passes dry-run analysis with zero slow types. The only known warning is the
CLI dynamic import noted above.

## Validation

Useful targeted checks:

```bash
deno check --unstable-kv plugins/triggers/mod.ts
deno check --unstable-kv plugins/triggers/src/cli/mod.ts
deno check --unstable-kv plugins/triggers/src/runtime/mod.ts
deno test --unstable-kv plugins/triggers/src/e2e/triggers-roundtrip_test.ts
deno publish --dry-run --allow-dirty
```

Run the package publish dry-run from `plugins/triggers`.

## Related Package

The core package is:

```text
@netscript/plugin-triggers-core
```

Use core for DSL, domain types, ports, adapters, test utilities, config schemas, telemetry
contracts, and oRPC contracts. Use this plugin package for platform wiring and operational
contributions.
