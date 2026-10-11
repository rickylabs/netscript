/** Bounded generated-entrypoint adoption probe; the receiver transport is controlled. */
import { assert, assertEquals } from 'jsr:@std/assert@^1';
import { resolve, toFileUrl } from 'jsr:@std/path@^1';
import type { JobHandlerDefinition } from '@netscript/plugin-workers-core';
import { KvDeadLetterStore } from '@netscript/queue/adapters/kv-dead-letter-store';

const payload = {
  deliveryId: 'command-outbox-adoption',
  endpointId: 'adoption-receiver',
  enqueuedAt: '2026-10-10T00:00:00.000Z',
  body: '{"event":"invoice.paid","idempotencyKey":"command-outbox-adoption"}',
};
const jobPath = resolve(Deno.args[0]);
const directory = await Deno.makeTempDir({ prefix: 'outbound-adoption-' });
const settings = {
  WEBHOOK_ENDPOINT_ID: payload.endpointId,
  WEBHOOK_ENDPOINT_URL: 'https://injected-receiver.invalid/events',
  WEBHOOK_SIGNING_SECRET: 'adoption-fixture-secret',
  WEBHOOK_DLQ_PATH: resolve(directory, 'delivery.sqlite'),
  WEBHOOK_MAX_ATTEMPTS: '2',
};
const requests: Request[] = [];
const previous = new Map(Object.keys(settings).map((name) => [name, Deno.env.get(name)]));
const originalFetch = globalThis.fetch;
try {
  for (const [name, value] of Object.entries(settings)) Deno.env.set(name, value);
  const module: {
    default: JobHandlerDefinition<typeof payload>;
    deliveryJob: { id: string; maxRetries: number };
  } = await import(toFileUrl(jobPath).href);
  assertEquals(module.deliveryJob.maxRetries, 0);
  let status = 503;
  globalThis.fetch = (input, init) => {
    requests.push(new Request(input, init));
    return Promise.resolve(new Response(null, { status }));
  };
  const context = { id: 'worker-adoption-run', payload, signal: new AbortController().signal };
  const exhausted = await module.default(context);
  assertEquals(exhausted.success, true);
  assertEquals(exhausted.data, {
    deliveryId: payload.deliveryId,
    attempts: 2,
    outcome: 'dead_lettered',
  });
  assertEquals(requests.length, 2, 'default job must consume exactly the configured attempt cap');
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(settings.WEBHOOK_SIGNING_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  for (const request of requests) {
    assertEquals(request.url, settings.WEBHOOK_ENDPOINT_URL);
    assertEquals(request.method, 'POST');
    assertEquals(request.redirect, 'error');
    assertEquals(request.headers.get('webhook-id'), payload.deliveryId);
    assertEquals(request.headers.get('idempotency-key'), payload.deliveryId);
    const timestamp = request.headers.get('webhook-timestamp');
    assert(timestamp && /^\d+$/.test(timestamp));
    const signature = request.headers.get('webhook-signature') ?? '';
    assert(/^v1=[0-9a-f]{64}$/.test(signature));
    const bytes = Uint8Array.from(signature.slice(3).match(/../g)!, (hex) => parseInt(hex, 16));
    const body = await request.text();
    assertEquals(body, payload.body);
    assert(
      await crypto.subtle.verify(
        'HMAC',
        key,
        bytes,
        new TextEncoder().encode(timestamp + '.' + payload.deliveryId + '.' + body),
      ),
      'receiver must independently verify the generated request signature',
    );
  }
  // A second invocation opens a fresh KV connection; successful delivery creates no new DLQ row.
  status = 204;
  const delivered = await module.default({ ...context, id: 'worker-adoption-success' });
  assertEquals(delivered.data, {
    deliveryId: payload.deliveryId,
    attempts: 1,
    outcome: 'delivered',
  });
  assertEquals(requests.length, 3);
  const kv = await Deno.openKv(settings.WEBHOOK_DLQ_PATH);
  try {
    const store = new KvDeadLetterStore<typeof payload>({
      queueName: module.deliveryJob.id,
      denoKv: kv,
    });
    assertEquals(await store.depth(), 1);
    const [record] = await store.list({ limit: 2 });
    assertEquals(record.messageId, payload.deliveryId);
    assertEquals(record.payload, payload);
    assertEquals(record.headers['webhook-id'], payload.deliveryId);
    assertEquals(record.deliveryCount, 2);
    assertEquals(record.reason, 'max_attempts_exceeded');
    assertEquals(record.errorCode, 'http_503');
    assert(!JSON.stringify(record).includes(settings.WEBHOOK_SIGNING_SECRET));
  } finally {
    kv.close();
  }
  console.info(
    'Generated outbound webhook adoption: signature, identity, injected endpoint, attempt cap, persisted DLQ and success verified',
  );
} finally {
  globalThis.fetch = originalFetch;
  for (const [name, value] of previous) {
    if (value === undefined) Deno.env.delete(name);
    else Deno.env.set(name, value);
  }
  await Deno.remove(directory, { recursive: true });
}
