/**
 * Triggers service connector smoke test.
 *
 * Boots the converged triggers service on an ephemeral port with in-memory ports
 * (no Deno KV, no project registry) and asserts the connector wiring end to end:
 *
 * - `withHealth` serves `/health` as healthy;
 * - `withServiceInfo` serves the service-info root;
 * - a backed oRPC route (`listTriggers`) returns the mapped definition set over
 *   the OpenAPI surface;
 * - `fireTrigger` persists and accepts a manual-fire event;
 * - the raw HMAC webhook route is mounted at `POST /api/v1/webhooks/:triggerId`:
 *   an unknown trigger id resolves (cast-free) to a 404 before ingress, and a
 *   known trigger id is resolved against the definitions and reaches the ingress.
 *
 * @module
 */

import { assertEquals, assertExists } from '@std/assert';
import type { RunningService } from '@netscript/service';
import {
  HmacSha256WebhookVerifier,
  MemoryWebhookVerifier,
} from '@netscript/plugin-triggers-core/adapters';
import { defineScheduledTrigger, defineWebhook } from '@netscript/plugin-triggers-core/builders';
import type {
  TriggerEvent,
  TriggerEventId,
  TriggerEventStatus,
} from '@netscript/plugin-triggers-core/domain';
import { TriggersError } from '@netscript/plugin-triggers-core/domain';
import type {
  ProcessableTriggerDefinition,
  TriggerEventListOptions,
  TriggerEventStorePort,
} from '@netscript/plugin-triggers-core/ports';
import type {
  TriggerIngressPort,
  TriggerIngressRequest,
  TriggerIngressResponse,
} from '@netscript/plugin-triggers-core/ports';
import {
  InlineTriggerProcessor,
  MemoryTriggerEnabledStateStore,
} from '@netscript/plugin-triggers-core/testing';
import {
  createEventSubscription,
  createManualDispatcher,
  createTriggerIngress,
  createWebhookTestDelivery,
} from '@netscript/plugin-triggers-core/runtime';
import { createTriggersService } from './main.ts';
import type { TriggerServiceContext } from './routers/v1-types.ts';
import { HttpTriggersService } from '../../src/cli/http-triggers-service.ts';

/** Minimal in-memory event store; the smoke test exercises read paths only. */
class InMemoryEventStore implements TriggerEventStorePort {
  readonly #events: TriggerEvent[];
  constructor(events: readonly TriggerEvent[] = []) {
    this.#events = [...events];
  }
  save(event: TriggerEvent): Promise<void> {
    this.#events.push(event);
    return Promise.resolve();
  }
  load(eventId: TriggerEventId): Promise<TriggerEvent | undefined> {
    return Promise.resolve(this.#events.find((event) => event.id === eventId));
  }
  updateStatus(
    eventId: TriggerEventId,
    status: TriggerEventStatus,
  ): Promise<void> {
    const event = this.#events.find((candidate) => candidate.id === eventId);
    if (event !== undefined) {
      (event as { status: TriggerEventStatus }).status = status;
    }
    return Promise.resolve();
  }
  list(options?: TriggerEventListOptions): Promise<readonly TriggerEvent[]> {
    const status = options?.status;
    return Promise.resolve(
      status === undefined ? this.#events : this.#events.filter((e) => e.status === status),
    );
  }
}

/** Ingress stub that mirrors the real "unknown trigger -> not found" failure. */
const failingIngress: TriggerIngressPort = {
  accept(request: TriggerIngressRequest): Promise<TriggerIngressResponse> {
    throw TriggersError.triggerNotFound(request.triggerId);
  },
};

function buildContext(): TriggerServiceContext {
  const eventStore = new InMemoryEventStore();
  const eventSubscription = createEventSubscription();
  const definitions: readonly ProcessableTriggerDefinition[] = [
    defineScheduledTrigger(() => Promise.resolve([]), {
      id: 'sched-1',
      name: 'Fixture Schedule',
      cron: '0 0 * * *',
      timezone: 'UTC',
      description: 'A scheduled trigger fixture.',
      tags: ['fixture'],
    }),
  ];
  return {
    definitions,
    eventStore,
    enabledState: new MemoryTriggerEnabledStateStore(),
    ingress: failingIngress,
    manualDispatcher: createManualDispatcher({
      eventStore,
      processor: new InlineTriggerProcessor(),
      createEventId: () => 'trg_evt_connector_manual' as TriggerEventId,
    }),
    webhookTestDelivery: createWebhookTestDelivery({ ingress: failingIngress }),
    eventSubscription,
  };
}

function buildWebhookPathContext(acceptedTriggerIds: string[]): TriggerServiceContext {
  const definitions: readonly ProcessableTriggerDefinition[] = [
    defineWebhook(() => Promise.resolve([]), {
      id: 'generic-inbound-webhook',
      path: 'inbound/generic',
      verifier: 'memory',
    }),
  ];
  const eventStore = new InMemoryEventStore();
  const eventSubscription = createEventSubscription();
  return {
    definitions,
    eventStore,
    enabledState: new MemoryTriggerEnabledStateStore(),
    ingress: {
      accept(request: TriggerIngressRequest): Promise<TriggerIngressResponse> {
        acceptedTriggerIds.push(request.triggerId);
        return Promise.resolve({
          status: 202,
          acceptedAt: new Date(0).toISOString(),
        });
      },
    },
    manualDispatcher: createManualDispatcher({
      eventStore,
      processor: new InlineTriggerProcessor(),
    }),
    webhookTestDelivery: createWebhookTestDelivery({ ingress: failingIngress }),
    eventSubscription,
  };
}

function buildEventsContext(): TriggerServiceContext {
  const event = {
    id: 'trg_evt_fixture',
    triggerId: 'inbound/generic',
    kind: 'webhook',
    status: 'completed',
    attempt: 0,
    detectedAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
    payload: {},
    metadata: {},
  } as unknown as TriggerEvent;
  const eventStore = new InMemoryEventStore([event]);
  const eventSubscription = createEventSubscription();
  return {
    definitions: [],
    eventStore,
    enabledState: new MemoryTriggerEnabledStateStore(),
    ingress: failingIngress,
    manualDispatcher: createManualDispatcher({
      eventStore,
      processor: new InlineTriggerProcessor(),
    }),
    webhookTestDelivery: createWebhookTestDelivery({ ingress: failingIngress }),
    eventSubscription,
  };
}

function buildWebhookTestContext(): TriggerServiceContext {
  const definition = defineWebhook(() => Promise.resolve([]), {
    id: 'test-webhook',
    path: '/test-webhook',
    verifier: 'memory',
  });
  const eventStore = new InMemoryEventStore();
  const processor = new InlineTriggerProcessor();
  const eventSubscription = createEventSubscription();
  const memoryVerifier = new MemoryWebhookVerifier({ idempotencyKey: 'test-webhook-idem' });
  const ingress = createTriggerIngress({
    definitions: [definition],
    eventStore,
    processor,
    verifier: new HmacSha256WebhookVerifier({ signatureHeader: 'x-hub-signature-256' }),
    selectVerifier: () => memoryVerifier,
    createEventId: () => 'trg_evt_connector_webhook_test' as TriggerEventId,
  });
  return {
    definitions: [definition],
    eventStore,
    enabledState: new MemoryTriggerEnabledStateStore(),
    ingress,
    manualDispatcher: createManualDispatcher({ eventStore, processor }),
    webhookTestDelivery: createWebhookTestDelivery({ ingress }),
    eventSubscription,
  };
}

async function findRoute(
  baseUrl: string,
  predicate: (method: string, path: string) => boolean,
): Promise<{ method: string; path: string }> {
  const response = await fetch(`${baseUrl}/api/openapi.json`);
  const spec = await response.json() as {
    paths: Record<string, Record<string, unknown>>;
  };
  for (const [path, methods] of Object.entries(spec.paths)) {
    for (const method of Object.keys(methods)) {
      if (predicate(method.toUpperCase(), path)) {
        return { method: method.toUpperCase(), path };
      }
    }
  }
  throw new Error('No matching OpenAPI route found.');
}

Deno.test('triggers connector smoke', async (t) => {
  const running: RunningService = await createTriggersService(buildContext(), { port: 0 })
    .serve({ port: 0 });
  // The listener binds `0.0.0.0`; connect over the loopback address (Windows
  // rejects an outbound connection to `0.0.0.0`).
  const host = running.addr.hostname === '0.0.0.0' ? '127.0.0.1' : running.addr.hostname;
  const baseUrl = `http://${host}:${running.addr.port}`;

  try {
    await t.step('health is served and healthy', async () => {
      const res = await fetch(`${baseUrl}/health`);
      assertEquals(res.status, 200);
      const body = await res.json() as { status: string };
      assertEquals(body.status, 'healthy');
    });

    await t.step('service info root is served', async () => {
      const res = await fetch(`${baseUrl}/`);
      assertEquals(res.status, 200);
      const body = await res.json() as { service: string; endpoints: unknown };
      assertExists(body.endpoints);
    });

    await t.step('backed route listTriggers returns the mapped set', async () => {
      const route = await findRoute(
        baseUrl,
        (method, path) => method === 'GET' && /\/triggers$/.test(path),
      );
      const res = await fetch(`${baseUrl}/api${route.path}`);
      assertEquals(res.status, 200);
      const body = await res.json() as { triggers: unknown[]; total: number };
      assertEquals(body.total, 1);
      assertEquals(body.triggers.length, 1);
      assertEquals(body.triggers[0], {
        id: 'sched-1',
        kind: 'scheduled',
        name: 'Fixture Schedule',
        description: 'A scheduled trigger fixture.',
        enabled: true,
        durabilityTier: 't1',
        tags: ['fixture'],
      });
    });

    await t.step('enable and disable routes round-trip stored state', async () => {
      const disableRoute = await findRoute(
        baseUrl,
        (method, path) => method === 'POST' && /\/disable$/.test(path),
      );
      const disableRes = await fetch(
        `${baseUrl}/api${disableRoute.path.replace('{id}', 'sched-1')}`,
        {
          method: 'POST',
        },
      );
      assertEquals(disableRes.status, 200);
      const disabled = await disableRes.json() as { enabled: boolean };
      assertEquals(disabled.enabled, false);

      const listRoute = await findRoute(
        baseUrl,
        (method, path) => method === 'GET' && /\/triggers$/.test(path),
      );
      const disabledList = await fetch(`${baseUrl}/api${listRoute.path}?enabled=false`);
      assertEquals(disabledList.status, 200);
      const disabledBody = await disabledList.json() as { triggers: Array<{ id: string }> };
      assertEquals(disabledBody.triggers.map((trigger) => trigger.id), ['sched-1']);

      const fireRoute = await findRoute(
        baseUrl,
        (method, path) => method === 'POST' && /\/fire$/.test(path),
      );
      const disabledFire = await fetch(
        `${baseUrl}/api${fireRoute.path.replace('{id}', 'sched-1')}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ payload: { shouldNotDispatch: true } }),
        },
      );
      assertEquals(disabledFire.ok, false);

      const enableRoute = await findRoute(
        baseUrl,
        (method, path) => method === 'POST' && /\/enable$/.test(path),
      );
      const enableRes = await fetch(
        `${baseUrl}/api${enableRoute.path.replace('{id}', 'sched-1')}`,
        {
          method: 'POST',
        },
      );
      assertEquals(enableRes.status, 200);
      const enabled = await enableRes.json() as { enabled: boolean };
      assertEquals(enabled.enabled, true);
    });

    await t.step('fireTrigger accepts a manual fire event', async () => {
      const route = await findRoute(
        baseUrl,
        (method, path) => method === 'POST' && /\/fire$/.test(path),
      );
      const url = `${baseUrl}/api${route.path.replace('{id}', 'sched-1')}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ payload: { orderId: 'o-1' }, reason: 'manual replay' }),
      });
      assertEquals(res.status, 200);
      const body = await res.json() as {
        accepted: boolean;
        eventId: string;
        triggerId: string;
        status: string;
      };
      assertEquals(body, {
        accepted: true,
        eventId: 'trg_evt_connector_manual',
        triggerId: 'sched-1',
        status: 'pending',
      });
    });

    await t.step('previewSchedule returns next fire times', async () => {
      const route = await findRoute(
        baseUrl,
        (method, path) => method === 'GET' && /\/triggers\/\{id\}\/preview$/.test(path),
      );
      const res = await fetch(
        `${baseUrl}/api${route.path.replace('{id}', 'sched-1')}?count=2`,
      );
      assertEquals(res.status, 200);
      const body = await res.json() as {
        triggerId: string;
        nextFireAt: string[];
        timezone: string;
        persistent: boolean;
      };
      assertEquals(body.triggerId, 'sched-1');
      assertEquals(body.nextFireAt.length, 2);
      assertEquals(body.timezone, 'UTC');
      assertEquals(body.persistent, true);
    });

    await t.step('subscribeEvents streams a heartbeat', async () => {
      const route = await findRoute(
        baseUrl,
        (method, path) => method === 'GET' && /\/events\/subscribe$/.test(path),
      );
      const controller = new AbortController();
      const res = await fetch(`${baseUrl}/api${route.path}`, { signal: controller.signal });
      assertEquals(res.status, 200);
      const reader = res.body?.getReader();
      assertExists(reader);
      const chunk = await reader.read();
      controller.abort();
      reader.releaseLock();
      const text = new TextDecoder().decode(chunk.value);
      assertEquals(text.includes('heartbeat'), true);
    });

    await t.step('raw webhook unknown trigger id resolves to a 404', async () => {
      // No definition matches `unknown-trigger`, so the connector resolves the
      // path parameter against `context.definitions`, finds nothing, and returns
      // the unknown-id 404 directly (cast-free: it never reaches ingress).
      const res = await fetch(`${baseUrl}/api/v1/webhooks/unknown-trigger`, {
        method: 'POST',
        body: '{}',
      });
      assertEquals(res.status, 404);
      const body = await res.json() as {
        accepted: boolean;
        status: number;
        error: string;
      };
      assertEquals(body.accepted, false);
      assertEquals(body.status, 404);
      assertEquals(body.error, 'TRIGGER_NOT_FOUND');
    });

    await t.step('raw webhook known trigger id reaches the ingress', async () => {
      // `sched-1` IS in `context.definitions`, so the connector resolves it and
      // passes the definition's already-branded `.id` to `ingress.accept` (no
      // brand cast). The stub ingress throws `triggerNotFound`, which the
      // connector maps to a 404 failure — proving the resolved id reached ingress.
      const res = await fetch(`${baseUrl}/api/v1/webhooks/sched-1`, {
        method: 'POST',
        body: '{}',
      });
      assertEquals(res.status, 404);
      const body = await res.json() as { accepted: boolean; status: number };
      assertEquals(body.accepted, false);
      assertEquals(body.status, 404);
    });
  } finally {
    await running.stop();
  }
});

Deno.test('triggers webhook public path resolves to definition id', async () => {
  const acceptedTriggerIds: string[] = [];
  const running: RunningService = await createTriggersService(
    buildWebhookPathContext(acceptedTriggerIds),
    { port: 0 },
  ).serve({ port: 0 });
  const host = running.addr.hostname === '0.0.0.0' ? '127.0.0.1' : running.addr.hostname;
  const baseUrl = `http://${host}:${running.addr.port}`;

  try {
    const res = await fetch(`${baseUrl}/api/v1/webhooks/inbound/generic`, {
      method: 'POST',
      body: '{}',
    });
    assertEquals(res.status, 202);
    assertEquals(acceptedTriggerIds, ['generic-inbound-webhook']);
  } finally {
    await running.stop();
  }
});

Deno.test('triggers testWebhook route accepts a synthetic delivery', async () => {
  const running: RunningService = await createTriggersService(
    buildWebhookTestContext(),
    { port: 0 },
  ).serve({ port: 0 });
  const host = running.addr.hostname === '0.0.0.0' ? '127.0.0.1' : running.addr.hostname;
  const baseUrl = `http://${host}:${running.addr.port}`;

  try {
    const route = await findRoute(
      baseUrl,
      (method, path) => method === 'POST' && /\/webhooks\/\{id\}\/test$/.test(path),
    );
    const res = await fetch(`${baseUrl}/api${route.path.replace('{id}', 'test-webhook')}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ payload: { ok: true } }),
    });
    assertEquals(res.status, 200);
    const body = await res.json() as {
      accepted: boolean;
      eventId: string;
      triggerId: string;
      status: string;
    };
    assertEquals(body, {
      accepted: true,
      eventId: 'trg_evt_connector_webhook_test',
      triggerId: 'test-webhook',
      status: 'pending',
    });
  } finally {
    await running.stop();
  }
});

Deno.test('triggers legacy events path lists stored events', async () => {
  const running: RunningService = await createTriggersService(
    buildEventsContext(),
    { port: 0 },
  ).serve({ port: 0 });
  const host = running.addr.hostname === '0.0.0.0' ? '127.0.0.1' : running.addr.hostname;
  const baseUrl = `http://${host}:${running.addr.port}`;

  try {
    const res = await fetch(`${baseUrl}/api/v1/events?limit=10`);
    assertEquals(res.status, 200);
    const body = await res.json() as { events?: unknown[]; total?: number };
    assertEquals(Array.isArray(body.events), true);
    assertEquals(body.events?.length, 1);
    assertEquals(body.total, 1);
  } finally {
    await running.stop();
  }
});

Deno.test('CLI service adapter observes fired webhook ledger and authoritative state', async () => {
  const context = buildWebhookTestContext();
  const running: RunningService = await createTriggersService(context, { port: 0 })
    .serve({ port: 0 });
  const host = running.addr.hostname === '0.0.0.0' ? '127.0.0.1' : running.addr.hostname;
  const baseUrl = `http://${host}:${running.addr.port}`;
  const client = new HttpTriggersService({ baseUrl: `${baseUrl}/api/v1` });

  try {
    const disabled = await client.setEnabled('test-webhook', false);
    assertEquals(disabled.id, 'test-webhook');
    assertEquals(disabled.enabled, false);
    const rejected = await fetch(`${baseUrl}/api/v1/webhooks/test-webhook`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ orderId: 'disabled-order' }),
    });
    assertEquals(rejected.status, 409);

    assertEquals((await client.setEnabled('test-webhook', true)).enabled, true);
    const accepted = await fetch(`${baseUrl}/api/v1/webhooks/test-webhook`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ orderId: 'accepted-order' }),
    });
    assertEquals(accepted.status, 202);

    const ledger = await client.listEvents({ triggerId: 'test-webhook', limit: 10 });
    assertEquals(ledger.total, 1);
    assertEquals(ledger.events[0]?.triggerId, 'test-webhook');
    const payload = ledger.events[0]?.payload as {
      body?: unknown;
      headers?: Record<string, string>;
      method?: string;
      path?: string;
    };
    assertEquals(payload.body, { orderId: 'accepted-order' });
    assertEquals(payload.headers?.['content-type'], 'application/json');
    assertEquals(payload.method, 'POST');
    assertEquals(payload.path, '/api/v1/webhooks/test-webhook');
  } finally {
    await running.stop();
  }
});
