import { assert, assertEquals, assertRejects } from '@std/assert';
import * as streams from '../../mod.ts';
import type {
  StreamAdminInputV1,
  StreamAdminPort,
  StreamProducerTransportFailureV1,
} from '../../mod.ts';
import { createStreamsInstrumentation } from '../../src/telemetry/mod.ts';
import { InMemorySpanRecorder } from '@netscript/telemetry/testing';

async function serviceIdentity(action: () => Promise<void>): Promise<void> {
  const saved = new Map(
    ['DURABLE_STREAMS_URL', 'STREAMS_SECRET'].map((key) => [key, Deno.env.get(key)]),
  );
  Deno.env.set('DURABLE_STREAMS_URL', 'http://streams.test');
  Deno.env.set('STREAMS_SECRET', 'service-test');
  try {
    await action();
  } finally {
    for (const [key, value] of saved) {
      if (value === undefined) Deno.env.delete(key);
      else Deno.env.set(key, value);
    }
  }
}

Deno.test('public head and delete helpers resolve service identity and invoke the injected admin port', () =>
  serviceIdentity(async () => {
    const calls: [string, StreamAdminInputV1][] = [];
    const metadata = {
      offset: 'opaque-tail',
      streamClosed: false,
      contentType: 'application/json',
    };
    const recorder = new InMemorySpanRecorder();
    const admin: StreamAdminPort = {
      head: (input) => {
        calls.push(['head', input]);
        return Promise.resolve({ ok: true, value: metadata });
      },
      delete: (input) => {
        calls.push(['delete', input]);
        return Promise.resolve({ ok: true, value: { deleted: true } });
      },
    };
    const signal = new AbortController().signal;
    const options = {
      admin,
      signal,
      requestTimeoutMs: 1234,
      instrumentation: createStreamsInstrumentation({ tracer: recorder }),
    };
    assertEquals(await streams.headDurableStream('/segments/day', options), metadata);
    assertEquals(await streams.deleteDurableStream('/segments/day', options), true);
    assertEquals(calls.map(([operation]) => operation), ['head', 'delete']);
    for (const [, input] of calls) {
      assertEquals(input.url, 'http://streams.test/v1/stream/netscript/segments/day');
      assertEquals(input.headers.Authorization, 'Bearer service-test');
      assertEquals(input.signal, signal);
      assertEquals(input.requestTimeoutMs, 1234);
    }
    const spans = recorder.snapshots();
    assertEquals(spans.map((span) => span.name), ['stream.head', 'stream.delete']);
    assertEquals(spans.map((span) => span.kind), [2, 2]);
    assertEquals(spans.map((span) => span.status.code), [1, 1]);
    assertEquals(spans.map((span) => span.ended), [true, true]);
  }));

Deno.test('public administrative helpers treat not found as null and false', () =>
  serviceIdentity(async () => {
    const admin: StreamAdminPort = {
      head: () => Promise.resolve({ ok: true, value: null }),
      delete: () => Promise.resolve({ ok: true, value: { deleted: false } }),
    };
    assertEquals(await streams.headDurableStream('/absent', { admin }), null);
    assertEquals(await streams.deleteDurableStream('/absent', { admin }), false);
  }));

for (const kind of ['unauthorized', 'timeout', 'aborted', 'retryable', 'non-retryable'] as const) {
  Deno.test(`public administrative helpers retain typed ${kind} failures and end error spans`, () =>
    serviceIdentity(async () => {
      const failure: StreamProducerTransportFailureV1 = { kind, message: 'administrative failure' };
      const recorder = new InMemorySpanRecorder();
      const admin: StreamAdminPort = {
        head: () => Promise.resolve({ ok: false, failure }),
        delete: () => Promise.resolve({ ok: false, failure }),
      };
      const options = {
        admin,
        instrumentation: createStreamsInstrumentation({ tracer: recorder }),
      };
      for (const call of [streams.headDurableStream, streams.deleteDurableStream]) {
        const error = await assertRejects(
          () => call('/segment', options),
          streams.StreamAdminError,
        );
        assert(error instanceof streams.StreamAdminError);
        assertEquals(error.failure, failure);
      }
      assertEquals(recorder.snapshots().map((span) => span.status.code), [2, 2]);
      assertEquals(recorder.snapshots().map((span) => span.ended), [true, true]);
    }));
}

Deno.test('administrative helpers validate timeout before invoking the port', () =>
  serviceIdentity(async () => {
    let calls = 0;
    const admin: StreamAdminPort = {
      head: () => {
        calls++;
        return Promise.resolve({ ok: true, value: null });
      },
      delete: () => {
        calls++;
        return Promise.resolve({ ok: true, value: { deleted: false } });
      },
    };
    for (const requestTimeoutMs of [0, -1, NaN, Infinity, 0.5]) {
      await assertRejects(
        () => streams.deleteDurableStream('/segment', { admin, requestTimeoutMs }),
        RangeError,
      );
    }
    assertEquals(calls, 0);
  }));
