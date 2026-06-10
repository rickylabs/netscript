# @netscript/plugin-triggers

`@netscript/plugin-triggers` is the operational plugin package for NetScript triggers.

It wraps `@netscript/plugin-triggers-core`.

It exposes the plugin manifest.

It contributes the trigger HTTP API service.

It contributes the trigger Aspire resources.

It contributes CLI command metadata.

It contributes scaffolders for trigger modules.

It contributes runtime adapters for cron and file watchers.

It contributes the `triggers-health` E2E gate.

It does not define the core trigger DSL.

It does not own worker execution.

It does not own stream storage.

It does not own saga orchestration.

It depends on sibling core packages by typed manifest shape.

## Manifest Example

```ts
import { assertEquals } from 'jsr:@std/assert@^1';
import { inspectTriggers, TRIGGERS_API_DEFAULT_PORT, triggersPlugin } from '../mod.ts';

assertEquals(triggersPlugin.name, '@netscript/plugin-triggers');
assertEquals(TRIGGERS_API_DEFAULT_PORT, 8093);
assertEquals(inspectTriggers().axes, [
  'services',
  'contractVersions',
  'runtimeConfigTopics',
  'e2e',
  'aspire',
]);
```

## What The Plugin Owns

The plugin owns service wiring.

The plugin owns CLI wiring.

The plugin owns Aspire wiring.

The plugin owns production runtime adapters.

The plugin owns scaffold templates.

The plugin owns project registry generation.

The plugin owns package docs.

The plugin owns package verification.

The plugin owns the E2E gate contribution.

## What Core Owns

Core owns `defineWebhook`.

Core owns `defineFileWatch`.

Core owns `defineScheduledTrigger`.

Core owns trigger events.

Core owns trigger processor ports.

Core owns trigger ingress ports.

Core owns testing adapters.

Core owns trigger config schemas.

Application trigger modules should import the DSL from core.

## Root Surface

The root surface is manifest oriented.

It exports `triggersPlugin`.

It exports `inspectTriggers`.

It exports `TRIGGERS_PLUGIN_ID`.

It exports `TRIGGERS_PLUGIN_VERSION`.

It exports `TRIGGERS_API_SERVICE_NAME`.

It exports `TRIGGERS_API_DEFAULT_PORT`.

Operational code lives on subpaths.

## Subpaths

Use `./public` for manifest constants.

Use `./plugin` for plugin contribution aliases.

Use `./cli` for command composition.

Use `./scaffolding` for trigger file generation.

Use `./runtime` for cron, watcher, and processor runtime pieces.

Use `./aspire` for local orchestration contribution.

Use `./services` for the HTTP service entrypoint.

Use `./streams` for trigger stream helpers.

Use `./streams/server` for stream server helpers.

## HTTP Service

The HTTP service is named `triggers-api`.

The default port is `8093`.

The service exposes health endpoints.

The service exposes webhook ingress endpoints.

The service exposes trigger event listing.

The service exposes trigger event detail.

The service accepts webhook events with ack-then-process semantics.

The service delegates behavior to core ports.

## Webhooks

Webhook trigger modules are scaffolded as handler-first core definitions.

The service maps webhook routes to trigger definitions.

The service verifies signatures before acceptance.

The service persists accepted trigger events.

The service returns `202` for accepted work.

The processor handles work after acknowledgement.

## Schedules

Scheduled trigger modules are scaffolded as core definitions.

The plugin wraps `@netscript/cron`.

The plugin registers volatile schedules.

Persistent cron behavior remains behind the scheduler port.

Unsupported persistent requests fail explicitly.

## File Watching

File-watch trigger modules are scaffolded as core definitions.

The plugin wraps `@netscript/watchers`.

The adapter maps watcher lifecycle events into trigger events.

The adapter preserves ignored patterns.

The adapter preserves debounce windows.

The adapter preserves stability thresholds.

## CLI

The CLI command group is named `triggers`.

The CLI description is trigger ingress and scheduling plugin CLI.

The command registry includes `add-webhook`.

The command registry includes `add-file-watch`.

The command registry includes `add-scheduled`.

The command registry includes `list`.

The command registry includes `test`.

The command registry includes `fire`.

The command registry includes `preview`.

The command registry includes `enable`.

The command registry includes `disable`.

## Aspire

The Aspire contribution registers `triggers-api`.

The Aspire contribution registers `trigger-processor`.

The processor waits for the API resource.

The contribution declares `TRIGGERS_API_URL`.

The contribution declares `TRIGGERS_PROCESSOR_CONCURRENCY`.

The contribution declares a health check at `http://localhost:8093/health`.

## E2E Gate

The manifest declares `triggers-health`.

The command is `deno task triggers:e2e`.

The package task discovers the manifest gate test.

Live webhook probes are gated by `NETSCRIPT_RUN_WEBHOOK_E2E=1`.

This keeps normal package tests fast.

## Verification

Run `deno run --unstable-kv verify-plugin.ts`.

Run `deno task check`.

Run `deno task test`.

Run `deno task triggers:e2e` for the package E2E gate metadata.

Run `deno publish --dry-run --allow-dirty` before publishing.

## Extension Checklist

Keep root manifest imports light.

Put operational APIs on subpaths.

Prefer structural public contracts over leaking upstream private types.

Add tests for new manifest axes.

Add Aspire tests for resource changes.

Add CLI tests for command changes.

Add docs for new user workflows.

Keep service behavior delegated to core ports.

Keep generated project files out of the package root.

Keep the health probe on port `8093`.
