import { assertEquals } from '@std/assert';
import { stub } from 'jsr:@std/testing@^1/mock';
import * as adminExports from '../../admin.ts';
import { headDurableStream } from '../../mod.ts';
import { DurableStreamAdmin } from '../../admin.ts';
import {
  StreamsInstrumentation,
  type StreamsSpanPort,
} from '../../src/telemetry/instrumentation.ts';

Deno.test('admin subpath exposes only its adapter at runtime while root owns helpers', () => {
  assertEquals(Object.keys(adminExports), ['DurableStreamAdmin']);
});

Deno.test('administrative sweep calls reuse default adapter and instrumentation instances', async () => {
  const previous = Deno.env.get('DURABLE_STREAMS_URL');
  Deno.env.set('DURABLE_STREAMS_URL', 'http://streams.test');
  const adapters = new Set<DurableStreamAdmin>();
  const instruments = new Set<StreamsInstrumentation>();
  const span: StreamsSpanPort = {
    spanContext: () => ({ traceId: '0'.repeat(32), spanId: '0'.repeat(16), traceFlags: 0 }),
    setAttribute() {
      return this;
    },
    addEvent() {
      return this;
    },
    setStatus() {
      return this;
    },
    recordException: () => undefined,
    end: () => undefined,
  };
  const head = stub(DurableStreamAdmin.prototype, 'head', function (this: DurableStreamAdmin) {
    adapters.add(this);
    return Promise.resolve({ ok: true, value: null });
  });
  const startSpan = stub(
    StreamsInstrumentation.prototype,
    'startAdminSpan',
    function (this: StreamsInstrumentation) {
      instruments.add(this);
      return span;
    },
  );
  try {
    assertEquals(await headDurableStream('/first'), null);
    assertEquals(await headDurableStream('/second'), null);
    assertEquals(adapters.size, 1);
    assertEquals(instruments.size, 1);
  } finally {
    startSpan.restore();
    head.restore();
    if (previous === undefined) Deno.env.delete('DURABLE_STREAMS_URL');
    else Deno.env.set('DURABLE_STREAMS_URL', previous);
  }
});
