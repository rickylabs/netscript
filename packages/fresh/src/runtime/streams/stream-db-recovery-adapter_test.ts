/** Recovery lifecycle tests at the public native read boundary. @module */

import { assert, assertEquals, assertRejects, assertThrows } from '@std/assert';
import { getEventListeners } from 'node:events';
import type { StreamOptions } from '@durable-streams/client';
import { DurableStream, FetchError } from '@durable-streams/client';
import { createStreamDBRecoveryAdapter } from './stream-db-recovery-adapter.ts';

function native(fetch: typeof globalThis.fetch): DurableStream {
  return new DurableStream({
    url: import.meta.url,
    fetch,
    backoffOptions: { initialDelay: 1, maxDelay: 1, multiplier: 1, maxRetries: 0 },
  });
}

function closedBatch(offset: string): Response {
  return new Response('[]', {
    headers: {
      'content-type': 'application/json',
      'stream-next-offset': offset,
      'stream-up-to-date': 'true',
      'stream-closed': 'true',
    },
  });
}

Deno.test('StreamDB recovery validates finite bounded options before I/O', () => {
  let requests = 0;
  const stream = native(() => {
    requests++;
    throw new TypeError('offline');
  });
  for (
    const options of [
      { maxRetries: Infinity },
      { maxRetries: -1 },
      { maxRetries: 0.5 },
      { initialDelayMs: 0 },
      { initialDelayMs: NaN },
      { maxDelayMs: Infinity },
      { initialDelayMs: 2, maxDelayMs: 1 },
    ]
  ) assertThrows(() => createStreamDBRecoveryAdapter(stream, options), TypeError);
  assertEquals(requests, 0);
});

Deno.test('StreamDB recovery exhausts one capped exponential outage budget', async () => {
  let requests = 0;
  const delays: number[] = [];
  const recovery = createStreamDBRecoveryAdapter(
    native(() => {
      requests++;
      return Promise.reject(new TypeError('offline'));
    }),
    { maxRetries: 4, initialDelayMs: 2, maxDelayMs: 5 },
    (ms) => {
      delays.push(ms);
      return Promise.resolve();
    },
  );
  await assertRejects(() => deadline(recovery.stream.stream()), TypeError);
  assertEquals(requests, 5);
  assertEquals(delays, [2, 4, 5, 5]);
  assertEquals(recovery.status, 'failed');
  recovery.stop();
});

Deno.test('StreamDB recovery retries missing startup stream and retains native checkpoint', async () => {
  let requests = 0;
  const offsets: (string | null)[] = [];
  const recovery = createStreamDBRecoveryAdapter(
    native((input) => {
      offsets.push(new URL(String(input)).searchParams.get('offset'));
      return Promise.resolve(
        ++requests < 3 ? new Response(null, { status: 404 }) : closedBatch('end'),
      );
    }),
    { maxRetries: 2 },
    () => Promise.resolve(),
  );
  const response = await deadline(recovery.stream.stream({ offset: 'checkpoint' }));
  response.subscribeJson(() => {});
  await deadline(response.closed);
  assertEquals(offsets, ['checkpoint', 'checkpoint', 'checkpoint']);
  assertEquals(response.offset, 'end');
  assertEquals(recovery.status, 'stopped');
  recovery.stop();
});

Deno.test('StreamDB recovery rejects permanent auth and protocol failures without retry', async () => {
  for (const status of [400, 401, 403, 410]) {
    let requests = 0;
    let waits = 0;
    const recovery = createStreamDBRecoveryAdapter(
      native(() => {
        requests++;
        return Promise.resolve(new Response(null, { status }));
      }),
      {},
      () => {
        waits++;
        return Promise.resolve();
      },
    );
    await assertRejects(() => deadline(recovery.stream.stream()), FetchError);
    assertEquals([requests, waits], [1, 0]);
    assertEquals(recovery.status, 'failed');
    recovery.stop();
  }
});

Deno.test('StreamDB recovery stops a pending backoff and never reconnects after disposal', async () => {
  let requests = 0;
  const recovery = createStreamDBRecoveryAdapter(
    native(() => {
      requests++;
      return Promise.resolve(new Response(null, { status: 404 }));
    }),
    { initialDelayMs: 60_000, maxDelayMs: 60_000 },
  );
  const pending = recovery.stream.stream();
  // First fetch resolves and the recovery adapter enters its abort-aware delay.
  for (let turn = 0; recovery.status !== 'retrying' && turn < 100; turn++) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  assertEquals(recovery.status, 'retrying');
  recovery.stop();
  recovery.stop();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await assertRejects(
      () =>
        Promise.race([
          pending,
          new Promise((_, reject) => {
            timer = setTimeout(() => reject(new Error('Stop failed to cancel backoff.')), 1_000);
          }),
        ]),
      DOMException,
    );
  } finally {
    clearTimeout(timer);
  }
  assertEquals(requests, 1);
  assertEquals(recovery.status, 'stopped');
});

Deno.test('StreamDB recovery never commits or retries a subscriber exception', async () => {
  let requests = 0;
  const recovery = createStreamDBRecoveryAdapter(
    native(() => {
      requests++;
      return Promise.resolve(closedBatch('uncommitted'));
    }),
    {},
    () => Promise.resolve(),
  );
  const response = await deadline(recovery.stream.stream({ offset: 'checkpoint' }));
  const error = new TypeError('subscriber failure');
  response.subscribeJson(() => {
    throw error;
  });
  const rejected = await assertRejects(() => deadline(response.closed), TypeError);
  assert(rejected === error);
  assertEquals(response.offset, 'checkpoint');
  assertEquals(requests, 1);
  assertEquals(recovery.status, 'failed');
  recovery.stop();
});

async function deadline<T>(pending: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      pending,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Recovery deadline exceeded.')), 5_000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

Deno.test('StreamDB recovery keeps listener and controller counts flat across batches and timeouts', async () => {
  const signals = new Set<AbortSignal>();
  const children: AbortSignal[] = [];
  let requests = 0;
  let batches = 0;
  let peakListeners = 0;
  let peakControllers = 0;
  const transport = native((_input, init) => {
    children.push(init!.signal!);
    peakListeners = Math.max(
      peakListeners,
      [...signals].reduce(
        (count, signal) => count + getEventListeners(signal, 'abort').length,
        0,
      ),
    );
    peakControllers = Math.max(
      peakControllers,
      children.filter((signal) => !signal.aborted).length,
    );
    assert(peakListeners <= 1, `Retained abort listeners grew to ${peakListeners}.`);
    assert(peakControllers <= 1, `Active request controllers grew to ${peakControllers}.`);
    if (++requests % 4 === 0) return Promise.reject(new TypeError('transient network failure'));
    batches++;
    return Promise.resolve(
      new Response(batches % 3 === 0 ? null : '[]', {
        status: batches % 3 === 0 ? 204 : 200,
        headers: {
          'content-type': 'application/json',
          'stream-next-offset': String(batches),
          'stream-up-to-date': 'true',
          ...(batches === 256 ? { 'stream-closed': 'true' } : {}),
        },
      }),
    );
  });
  const read = transport.stream.bind(transport);
  transport.stream = function <T>(options: Omit<StreamOptions, 'url'> = {}) {
    signals.add(options.signal!);
    return read<T>(options);
  };
  const recovery = createStreamDBRecoveryAdapter(transport, {}, () => Promise.resolve());
  try {
    const response = await deadline(recovery.stream.stream({ json: true }));
    response.subscribeJson(() => {});
    await deadline(response.closed);
    assertEquals(batches, 256);
    assertEquals(response.offset, '256');
    assertEquals(
      [...signals].reduce((n, signal) => n + getEventListeners(signal, 'abort').length, 0),
      0,
    );
    assertEquals(children.filter((signal) => !signal.aborted).length, 0);
    assertEquals(peakListeners, 1);
    assertEquals(peakControllers, 1);
  } finally {
    recovery.stop();
  }
});
