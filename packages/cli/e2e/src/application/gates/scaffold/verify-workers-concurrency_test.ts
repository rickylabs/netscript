import { assertEquals, assertThrows } from '@std/assert';
import type { TelemetrySpan } from '@netscript/telemetry/query';
import { assertWorkersConcurrency } from './verify-workers-concurrency.ts';

function execution(concurrency?: number): TelemetrySpan {
  return {
    traceId: 'generated-worker-proof',
    spanId: 'completed-job',
    name: 'job.execute',
    kind: 'internal',
    startTimeUnixMs: 0,
    statusCode: 1,
    attributes: {
      'netscript.job.id': 'health-check',
      ...(concurrency === undefined ? {} : { 'netscript.worker.concurrency': concurrency }),
    },
    events: [],
    links: [],
  };
}

Deno.test('generated workers receipt accepts declared concurrency on a completed health-check', () => {
  const span = execution(2);
  assertEquals(assertWorkersConcurrency([span], 2), span);
});

Deno.test('generated workers receipt rejects main telemetry without concurrency', () => {
  assertThrows(() => assertWorkersConcurrency([execution()], 2), Error, 'observed=undefined');
});

Deno.test('generated workers receipt rejects silent runtime fallback to one', () => {
  assertThrows(() => assertWorkersConcurrency([execution(1)], 2), Error, 'declared=2, observed=1');
});

Deno.test('generated workers receipt requires execution evidence and rejects mixed values', () => {
  assertThrows(() => assertWorkersConcurrency([], 2), Error, 'No generated health-check');
  assertThrows(
    () => assertWorkersConcurrency([execution(1), execution(2)], 2),
    Error,
    'observed=1',
  );
});
