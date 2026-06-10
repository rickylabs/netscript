# Getting Started

Use this package when you need the operational trigger plugin.

Use `@netscript/plugin-triggers-core` when you are authoring trigger definitions.

## Inspect The Manifest

```ts
import { assertEquals } from 'jsr:@std/assert@^1';
import { inspectTriggers, triggersPlugin } from '../mod.ts';

assertEquals(triggersPlugin.type, 'background-processor');
assertEquals(inspectTriggers().dependencies, [
  'workersCore',
  'streamsCore',
  'sagasCore',
]);
```

## Add A Webhook Trigger

Use the CLI scaffold workflow in a project:

```sh
deno run -A packages/cli/bin/netscript-dev.ts triggers add webhook orders-created --path=/webhooks/orders-created
```

The generated module imports the DSL from the core package.

The generated module is a handler-first trigger definition.

## Run Package Checks

From `plugins/triggers`, run:

```sh
deno task check
deno task test
deno task triggers:e2e
deno publish --dry-run --allow-dirty
```

The `triggers:e2e` task runs metadata tests by default.

Live webhook tests require `NETSCRIPT_RUN_WEBHOOK_E2E=1`.

## Start The Service

Use `deno task start` from `plugins/triggers` for the package service entrypoint.

The service listens on port `8093` by default.

The health endpoint is `/health`.

Aspire normally owns process startup in generated applications.
