# @netscript/plugin-triggers-core

`@netscript/plugin-triggers-core` is the reusable trigger DSL and runtime boundary package for the
NetScript trigger family.

It is framework-layer code.

It owns trigger definitions.

It owns trigger events.

It owns trigger runtime ports.

It owns trigger processor behavior.

It owns webhook ingress composition.

It owns trigger config schema shape.

It owns trigger telemetry names and structural instrumentation contracts.

It owns testing adapters for deterministic package and plugin tests.

It does not own the HTTP service process.

It does not own CLI commands.

It does not own generated project files.

It does not own Aspire resource registration.

It does not own production cron or file watcher adapters.

Those are plugin-package responsibilities in `@netscript/plugin-triggers`.

## Install Surface

The package is published as `@netscript/plugin-triggers-core`.

The root barrel is intentionally small.

The root barrel is for application trigger definitions and runtime composition.

Specialized subpaths keep framework concerns separated.

Use `@netscript/plugin-triggers-core/adapters` for webhook verification adapters.

Use `@netscript/plugin-triggers-core/builders` for the full handler-first DSL.

Use `@netscript/plugin-triggers-core/config` for plugin-owned config schemas.

Use `@netscript/plugin-triggers-core/contracts/v1` for the versioned trigger API contract.

Use `@netscript/plugin-triggers-core/domain` for domain vocabulary and errors.

Use `@netscript/plugin-triggers-core/ports` for runtime extension boundaries.

Use `@netscript/plugin-triggers-core/runtime` for processor and ingress composition.

Use `@netscript/plugin-triggers-core/telemetry` for instrumentation helpers.

Use `@netscript/plugin-triggers-core/testing` for memory adapters and fixtures.

## Quick Example

The trigger DSL is handler first.

The immutable trigger spec is the second argument.

This keeps webhook, file-watch, and scheduled definitions consistent.

```ts
import { assertEquals } from 'jsr:@std/assert@^1';
import { defineWebhook } from '../mod.ts';

const stripeWebhook = defineWebhook(
  async () => [],
  {
    id: 'stripe-payments',
    path: '/webhooks/stripe',
    verifier: 'memory',
    tags: ['billing'],
  },
);

assertEquals(stripeWebhook.id, 'stripe-payments');
assertEquals(stripeWebhook.kind, 'webhook');
assertEquals(stripeWebhook.path, '/webhooks/stripe');
```

## Trigger Kinds

The known trigger kind vocabulary is finite.

`webhook` is implemented by the current runtime.

`file-watch` is implemented through an injected watcher adapter.

`scheduled` is implemented through an injected scheduler adapter.

`queue` is reserved for a future trigger source.

`stream` is reserved for a future trigger source.

`manual` is reserved for manual fire APIs.

Reserved kinds are public vocabulary.

Reserved kinds are not silent no-ops.

The processor reports not-implemented errors for unsupported runtime execution.

## Handler Model

Trigger handlers receive a `TriggerEvent`.

Trigger handlers receive a `TriggerContext`.

Trigger handlers return trigger actions.

The most common action is `enqueueJob`.

Handlers may also defer work.

Handlers do not directly commit event state.

Handlers do not directly acknowledge HTTP requests.

Ingress and processors own those lifecycle steps.

## Webhook Model

Webhook definitions include an id.

Webhook definitions include an HTTP path.

Webhook definitions include a verifier selector.

Webhook definitions may include a secret environment variable name.

Webhook definitions may include tags and metadata.

Webhook ingress verifies signatures before accepting work.

Webhook ingress persists an event before returning 202.

Webhook ingress delegates processing after acknowledgement.

This is the ack-then-process model.

## File Watch Model

File-watch definitions include one or more paths.

File-watch definitions include include patterns.

File-watch definitions may include ignored patterns.

File-watch definitions may include debounce settings.

File-watch definitions may include stability thresholds.

Core does not import `@netscript/watchers`.

The plugin package wraps production watcher APIs.

Tests use `MemoryFileWatcherAdapter`.

## Schedule Model

Scheduled definitions include a cron expression.

Scheduled definitions include an optional timezone.

Scheduled definitions may include backfill behavior.

Scheduled definitions may include retry behavior.

Scheduled definitions may include deduplication behavior.

Core does not import `@netscript/cron`.

The plugin package wraps production cron APIs.

Tests use `MemoryTriggerSchedulerAdapter`.

## Runtime Model

`createTriggerProcessor()` creates a processor with explicit collaborators.

`createTriggerIngress()` creates webhook ingress with explicit collaborators.

There is no global trigger registry in core.

There is no implicit filesystem scanning in core.

There is no process singleton in core.

Runtime code depends on ports.

Ports make tests deterministic.

Ports keep plugin packages in control of process resources.

## Idempotency Model

Idempotency is part of trigger runtime behavior.

The processor claims an idempotency key before action dispatch.

The key may come from the event.

The key may come from request metadata.

The key may fall back to a payload-derived hash.

Duplicate events are completed without dispatching duplicate work.

Testing stores expose this behavior without durable infrastructure.

## Retry Model

Trigger definitions may declare retry policy.

Retry policy controls maximum attempts.

Retry policy controls backoff.

Retry exhaustion goes to the DLQ port.

The DLQ port is injected.

The processor does not assume a concrete queue backend.

## Telemetry Model

Telemetry names live with the runtime that emits them.

Core owns trigger span names.

Core owns trigger metric names.

Core owns structural tracer and meter boundaries.

The telemetry facade can wrap OpenTelemetry.

The telemetry facade does not require a global singleton.

## Config Model

Trigger config schema lives in the core package.

The central NetScript config package treats plugin data as plugin-owned data.

The trigger plugin validates its own config section.

This avoids leaking trigger-specific schema concerns into unrelated packages.

## Contract Model

The v1 contract subpath owns the public trigger API contract.

The contract includes definition listing.

The contract includes definition lookup.

The contract includes event listing.

The contract includes event lookup.

The contract includes manual fire.

The contract includes webhook testing.

The contract includes schedule preview.

The contract includes enable and disable operations.

The contract includes event subscription.

## Testing Model

Use `@netscript/plugin-triggers-core/testing` in package tests.

Use memory stores for event persistence.

Use memory idempotency for duplicate detection.

Use `TriggerTestClock` for deterministic time.

Use `InlineTriggerProcessor` when a test needs a simple processor port.

Use `RecordingTriggerEventStore` when a test needs operation history.

Use KV adapters only when the test intentionally covers Deno KV behavior.

## Package Boundaries

The core package may import sibling core packages for type contracts.

The core package may import Web Platform APIs.

The core package may import `@std/*` helpers when appropriate.

The core package may not import the trigger plugin package.

The core package may not import generated application files.

The core package may not start services.

The core package may not read environment variables by itself.

The core package may not shell out.

## Extension Checklist

Add finite vocabulary constants before accepting new string literals.

Add domain types before runtime behavior.

Add ports before adapters.

Add memory adapters before production adapters.

Add tests before widening runtime behavior.

Add JSDoc before exposing public symbols.

Add docs when a new public workflow appears.

Run doc-lint on the combined public surface.

Run `deno check --unstable-kv` on every entrypoint.

Run `deno publish --dry-run --allow-dirty` before publishing.

## Stability

The package is alpha.

The handler-first DSL is the preferred authoring model.

The root export budget is intentional.

The subpath layout is intentional.

Breaking changes should be explicit.

Runtime invariants should be covered in tests.

Docs should stay aligned with the public barrels.
