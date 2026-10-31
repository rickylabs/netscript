---
layout: layouts/base.vto
title: "@netscript/plugin-triggers"
---

# `@netscript/plugin-triggers`

The deployable NetScript triggers plugin: trigger ingress, scheduling, file watching and the trigger
runtime APIs. Its root entrypoint holds the plugin manifest and its metadata constants; inspect the
manifest with `inspectPlugin` from `@netscript/plugin`. The handler-first authoring DSL
(`defineWebhook`, `defineScheduledTrigger`, `defineFileWatch`, `enqueueJob`) and the runtime ports
live in [`@netscript/plugin-triggers-core`](/reference/plugin-triggers-core/).

## Sub-path exports

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| `@netscript/plugin-triggers` | `./mod.ts` | Public [plugin manifest](#plugin-manifest) surface. |
| `@netscript/plugin-triggers/adapter-cli` | `./cli.ts` | Executable plugin-adapter CLI entrypoint and its shared CLI protocol types. |
| `@netscript/plugin-triggers/public` | `./src/public/mod.ts` | Public manifest re-export (identical to the root surface). |
| `@netscript/plugin-triggers/plugin` | `./src/public/mod.ts` | Plugin lifecycle composition (alias of the public surface). |
| `@netscript/plugin-triggers/runtime` | `./src/runtime/mod.ts` | Trigger runtime wiring. |
| `@netscript/plugin-triggers/scaffold` | `./scaffold.ts` | Plugin scaffold entrypoint types, logger, context, and result contracts. |
| `@netscript/plugin-triggers/aspire` | `./src/aspire/mod.ts` | [Aspire contribution](#aspire-aspire) for trigger services and background workers. |
| `@netscript/plugin-triggers/cli` | `./src/cli/composition/main.ts` | Trigger CLI composition root. |
| `@netscript/plugin-triggers/services` | `./services/src/main.ts` | Trigger ingress/management HTTP service entrypoint. |
| `@netscript/plugin-triggers/streams` | `./streams/mod.ts` | Stream integration surface. |
| `@netscript/plugin-triggers/streams/server` | `./streams/server.ts` | Stream server entrypoint. |

## Plugin manifest

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `triggersPlugin` | const | `const triggersPlugin: PluginManifest` | Plugin manifest for NetScript triggers. |

## Manifest constants

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `TRIGGERS_PLUGIN_ID` | const | `const TRIGGERS_PLUGIN_ID = "triggers"` | Stable plugin identifier for NetScript triggers. |
| `TRIGGERS_PLUGIN_VERSION` | const | `const TRIGGERS_PLUGIN_VERSION = "0.1.0"` | Initial plugin package version. |
| `TRIGGERS_API_SERVICE_NAME` | const | `const TRIGGERS_API_SERVICE_NAME = "triggers-api"` | Default HTTP service name for trigger ingress and management APIs. |
| `TRIGGERS_API_DEFAULT_PORT` | const | `const TRIGGERS_API_DEFAULT_PORT = 8093` | Default HTTP port for trigger ingress and management APIs. |

## Manifest types

| Symbol | Kind | Description |
| --- | --- | --- |
| `TriggersPluginId` | type alias | Literal type for the triggers plugin id. |
| `TriggersPluginVersion` | type alias | Literal type for the triggers plugin version. |
| `TriggersApiServiceName` | type alias | Literal type for the triggers API service name. |

## Aspire (`./aspire`)

| Symbol | Kind | Description |
| --- | --- | --- |
| `TriggersAspireContribution` | class | Aspire contribution for the NetScript triggers plugin. |
| `TRIGGERS_PLUGIN_PACKAGE_NAME` | const | Package name reported by the triggers Aspire contribution. |
| `TriggersAspireBuilder` | interface | Aspire builder methods required by the triggers contribution. |
| `TriggersAspireResource` | interface | Resource returned by the triggers Aspire builder boundary. |
| `TriggersContributionContext` | interface | Contribution context required by the triggers Aspire contribution. |
| `TriggersDenoServiceSpec` | interface | Deno service resource spec used by the triggers Aspire contribution. |
| `TriggersDenoBackgroundSpec` | interface | Deno background resource spec used by the triggers Aspire contribution. |
| `TriggersEnvSource` | type alias | Environment source reference accepted by triggers Aspire declarations. |

## Core package

[`@netscript/plugin-triggers-core`](/reference/plugin-triggers-core/) is canonical for the
handler-first DSL, ingress and processor runtimes, ports, configuration and testing exports.

## Examples

### Test triggers with in-memory doubles

Verify trigger routing, signature verification, manual replays and live execution monitoring with
in-memory doubles, without an HTTP host or a database.

```ts
import { assertEquals, assertExists } from "@std/assert";
import {
  defineWebhook,
  type TriggerEventSubscriptionMessage,
} from "@netscript/plugin-triggers-core";
import { MemoryTriggerEventStore, InlineTriggerProcessor } from "@netscript/plugin-triggers-core/testing";
import { HmacSha256WebhookVerifier } from "@netscript/plugin-triggers-core/adapters";
import {
  createTriggerIngress,
  createWebhookTestDelivery,
  createManualDispatcher,
  createEventSubscription,
} from "@netscript/plugin-triggers-core";

Deno.test("Trigger operator, manual dispatch, test delivery, and lifecycle subscriptions", async () => {
  // Define a webhook trigger spec
  const webhookDef = defineWebhook(() => Promise.resolve([]), {
    id: "orders-webhook",
    path: "/orders",
    verifier: "hmac-sha256",
    secretEnv: "ORDERS_SECRET",
  });

  const eventStore = new MemoryTriggerEventStore();
  const processor = new InlineTriggerProcessor();
  const verifier = new HmacSha256WebhookVerifier({ signatureHeader: "x-hub-signature-256" });

  // 1. Create a trigger ingress and webhook test delivery
  const ingress = createTriggerIngress({
    definitions: [webhookDef],
    eventStore,
    processor,
    verifier,
    resolveSecret: () => "webhook-secret-key",
  });

  const delivery = createWebhookTestDelivery({
    ingress,
    resolveSecret: () => "webhook-secret-key",
  });

  // Signed webhook test delivery
  const deliveryResponse = await delivery.deliver(webhookDef, {
    payload: { orderId: "ord_123", amount: 99.99 },
    idempotencyKey: "idem-webhook-test",
  });

  assertEquals(deliveryResponse.accepted, true);
  assertEquals(deliveryResponse.status, "pending");

  // 2. Manual Replay / Fire dispatcher
  const dispatcher = createManualDispatcher({
    eventStore,
    processor,
  });

  const replayResponse = await dispatcher.fire(webhookDef, {
    payload: { orderId: "ord_123", amount: 99.99 },
    reason: "Manual event replay due to consumer downtime",
    firedBy: "admin-operator",
  });

  assertEquals(replayResponse.accepted, true);
  assertExists(replayResponse.eventId);

  // 3. Lifecycle event observation via createEventSubscription
  const subscriptionHub = createEventSubscription();
  const observedEvents: TriggerEventSubscriptionMessage[] = [];
  const abortController = new AbortController();

  const subscriptionPromise = (async () => {
    for await (const msg of subscriptionHub.subscribe({}, { signal: abortController.signal })) {
      observedEvents.push(msg);
    }
  })();

  const triggerEvent = await eventStore.load(replayResponse.eventId);
  if (triggerEvent) {
    await subscriptionHub.publish({
      type: "trigger:accepted",
      timestamp: new Date().toISOString(),
      event: triggerEvent,
    });
  }

  abortController.abort();
  await subscriptionPromise;

  assertEquals(observedEvents.length, 1);
  assertEquals(observedEvents[0].type, "trigger:accepted");
  assertEquals(observedEvents[0].event.triggerId, webhookDef.id);
});
```
