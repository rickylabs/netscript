import { assertEquals } from '@std/assert';
import { DurableStreamAdmin } from '../../admin.ts';
import { deleteDurableStream, headDurableStream, StreamAdminError } from '../../mod.ts';
import { assertRejects } from '@std/assert';

const input = {
  url: 'http://streams.test/segment',
  headers: { Authorization: 'Bearer test' },
  requestTimeoutMs: 1000,
};

Deno.test('upstream admin adapter sends HEAD and DELETE with auth and returns bounded metadata', async () => {
  const requests: Request[] = [];
  const admin = new DurableStreamAdmin((url, init) => {
    requests.push(new Request(url, init));
    return Promise.resolve(
      new Response(null, {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'Stream-Next-Offset': 'opaque-tail',
          'Stream-Closed': 'true',
          etag: 'stream:tail',
          'cache-control': 'no-store',
        },
      }),
    );
  });
  assertEquals(await admin.head(input), {
    ok: true,
    value: {
      contentType: 'application/json',
      offset: 'opaque-tail',
      etag: 'stream:tail',
      cacheControl: 'no-store',
      streamClosed: true,
    },
  });
  assertEquals(await admin.delete(input), { ok: true, value: { deleted: true } });
  assertEquals(requests.map((request) => request.method), ['HEAD', 'DELETE']);
  assertEquals(requests.map((request) => request.headers.get('authorization')), [
    'Bearer test',
    'Bearer test',
  ]);
});

for (const operation of ['head', 'delete'] as const) {
  for (
    const [status, expectedKind] of [
      [401, 'unauthorized'],
      [403, 'unauthorized'],
      [408, 'timeout'],
      [429, 'retryable'],
      [503, 'retryable'],
      [400, 'non-retryable'],
    ] as const
  ) {
    Deno.test(`admin ${operation} classifies HTTP ${status} with no hidden retries`, async () => {
      let calls = 0;
      const admin = new DurableStreamAdmin(() => {
        calls++;
        return Promise.resolve(new Response('failure', { status }));
      });
      const result = await admin[operation](input);
      assertEquals(result.ok, false);
      if (!result.ok) assertEquals(result.failure.kind, expectedKind);
      assertEquals(calls, 1);
    });
  }
  Deno.test(`admin ${operation} returns typed absence for HTTP 404`, async () => {
    const admin = new DurableStreamAdmin(() =>
      Promise.resolve(new Response(null, { status: 404 }))
    );
    if (operation === 'head') assertEquals(await admin.head(input), { ok: true, value: null });
    else assertEquals(await admin.delete(input), { ok: true, value: { deleted: false } });
  });
  Deno.test(`admin ${operation} distinguishes request timeout from caller cancellation`, async () => {
    const admin = new DurableStreamAdmin((_url, init) =>
      new Promise((_resolve, reject) => {
        if (init?.signal?.aborted) reject(init.signal.reason);
        else {init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), {
            once: true,
          });}
      })
    );
    const timedOut = await admin[operation]({ ...input, requestTimeoutMs: 5 });
    assertEquals(timedOut.ok, false);
    if (!timedOut.ok) assertEquals(timedOut.failure.kind, 'timeout');
    const caller = new AbortController();
    caller.abort();
    const aborted = await admin[operation]({ ...input, signal: caller.signal });
    assertEquals(aborted.ok, false);
    if (!aborted.ok) assertEquals(aborted.failure.kind, 'aborted');
  });
}

Deno.test('public helpers preserve real adapter unauthorized and timeout results', async () => {
  const previous = Deno.env.get('DURABLE_STREAMS_URL');
  Deno.env.set('DURABLE_STREAMS_URL', 'http://streams.test');
  try {
    for (const call of [headDurableStream, deleteDurableStream]) {
      const unauthorized = new DurableStreamAdmin(() =>
        Promise.resolve(new Response(null, { status: 401 }))
      );
      const denied = await assertRejects(
        () => call('/segment', { admin: unauthorized }),
        StreamAdminError,
      );
      assertEquals(denied.failure.kind, 'unauthorized');
      const hung = new DurableStreamAdmin((_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), {
            once: true,
          });
        })
      );
      const timeout = await assertRejects(
        () => call('/segment', { admin: hung, requestTimeoutMs: 5 }),
        StreamAdminError,
      );
      assertEquals(timeout.failure.kind, 'timeout');
    }
  } finally {
    if (previous === undefined) Deno.env.delete('DURABLE_STREAMS_URL');
    else Deno.env.set('DURABLE_STREAMS_URL', previous);
  }
});
