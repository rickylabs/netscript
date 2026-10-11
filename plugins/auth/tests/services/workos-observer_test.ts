import { assertEquals } from '@std/assert';
import { InMemorySpanRecorder } from '@netscript/telemetry/testing';
import { SpanStatusCode } from '@netscript/telemetry/tracer';
import { createWorkosWorkerObserver } from '../../services/src/workos-worker-observer.ts';

Deno.test('WorkOS worker retries emit safe error telemetry even when the service logger fails', async () => {
  const tracer = new InMemorySpanRecorder();
  const observe = createWorkosWorkerObserver({
    error() {
      throw new Error('sensitive-log-sink');
    },
  }, tracer);
  await observe('delivery');
  await observe('storage');
  const spans = tracer.snapshots();
  assertEquals(spans.length, 2);
  assertEquals(
    spans.map((span) => ({
      name: span.name,
      attributes: span.attributes,
      status: span.status.code,
      ended: span.ended,
      messages: span.exceptions.map((error) => typeof error === 'string' ? error : error.message),
    })),
    ['delivery', 'storage'].map((stage) => ({
      name: 'auth.workos.revocation.retry',
      attributes: { component: 'workos-revocation', stage },
      status: SpanStatusCode.ERROR,
      ended: true,
      messages: ['WorkOS revocation worker retrying after failure.'],
    })),
  );
});

Deno.test('WorkOS worker standard async dependency is declared by the shipped plugin', async () => {
  const config = JSON.parse(await Deno.readTextFile('plugins/auth/deno.json'));
  assertEquals(config.imports['@std/async'], 'jsr:@std/async@^1');
  const worker = await Deno.readTextFile('plugins/auth/services/src/workos-revocation-worker.ts');
  assertEquals(worker.includes("from 'jsr:"), false);
});
