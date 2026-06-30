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
 * - a deferred oRPC route (`fireTrigger`) returns a server error (the honest
 *   "pending triggers-core runtime backing" deferral);
 * - the raw HMAC webhook route is mounted at `POST /api/v1/webhooks/:triggerId`:
 *   an unknown trigger id resolves (cast-free) to a 404 before ingress, and a
 *   known trigger id is resolved against the definitions and reaches the ingress.
 *
 * @module
 */

import { assertEquals, assertExists } from '@std/assert';
import type { RunningService } from '@netscript/service';
import { defineWebhook } from '@netscript/plugin-triggers-core/builders';
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
import { createTriggersService } from './main.ts';
import type { TriggerServiceContext } from './routers/v1-types.ts';

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
  const definitions: readonly ProcessableTriggerDefinition[] = [
    {
      id: 'sched-1',
      kind: 'scheduled',
      durability: 't1',
      description: 'A scheduled trigger fixture.',
      tags: ['fixture'],
      // The handler is never invoked by the read-only smoke paths.
      handler: () => Promise.resolve(),
    } as unknown as ProcessableTriggerDefinition,
  ];
  return {
    definitions,
    eventStore: new InMemoryEventStore(),
    ingress: failingIngress,
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
  return {
    definitions,
    eventStore: new InMemoryEventStore(),
    ingress: {
      accept(request: TriggerIngressRequest): Promise<TriggerIngressResponse> {
        acceptedTriggerIds.push(request.triggerId);
        return Promise.resolve({
          status: 202,
          acceptedAt: new Date(0).toISOString(),
        });
      },
    },
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
    });

    await t.step('deferred route fireTrigger returns a server error', async () => {
      const route = await findRoute(
        baseUrl,
        (method, path) => method === 'POST' && /\/fire$/.test(path),
      );
      const url = `${baseUrl}/api${route.path.replace('{id}', 'sched-1')}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });
      // oRPC maps the uncaught deferral throw to a 5xx server error.
      assertEquals(res.status >= 500, true, `expected 5xx, got ${res.status}`);
      await res.body?.cancel();
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
