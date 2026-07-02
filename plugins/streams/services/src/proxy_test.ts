/**
 * Regression coverage for the fresh-session live-read race (netscript#267).
 *
 * A brand-new session's first live/subscribe poll (`?live=long-poll`) of a
 * durable stream can arrive *before* the producer's first write has created
 * that stream. The upstream answers with `404 Stream not found`; forwarding
 * that verbatim tears the subscription down and the UI stalls until a manual
 * refresh. {@link createStreamsProxyHandler} reinterprets that specific 404 as
 * an open, empty, up-to-date subscription and delivers as soon as the producer
 * creates the stream — while leaving snapshot (non-live) 404s untouched.
 *
 * Each test wires the real proxy handler in front of a tiny fake upstream (a
 * stand-in for `DurableStreamTestServer`) whose stream store starts empty.
 *
 * @module
 */

import { getAvailablePort } from '@std/net';
import { type Context, Hono } from 'hono';
import { createPluginService } from '@netscript/plugin/service';
import { createStreamsProxyHandler, type LiveCreateWaitConfig } from './proxy.ts';

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`Assertion failed: ${msg}`);
}
function assertEquals<T>(actual: T, expected: T, msg: string): void {
  if (actual !== expected) {
    throw new Error(`Assertion failed (${msg}): expected ${String(expected)}, got ${String(actual)}`);
  }
}

/** A fake DurableStreamTestServer whose stream store starts empty. */
function startFakeUpstream(
  store: Map<string, unknown[]>,
  internalPort: number,
): Deno.HttpServer {
  const upstream = new Hono();
  upstream.get('/*', (c: Context) => {
    const path = new URL(c.req.url).pathname;
    const messages = store.get(path);
    if (messages === undefined) {
      // Not-yet-created stream: this is the 404 the proxy must reinterpret for
      // live polls (and forward for snapshot reads).
      return c.text('Stream not found', 404);
    }
    return new Response(JSON.stringify(messages), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'Stream-Next-Offset': `1_${messages.length}`,
        'Stream-Up-To-Date': 'true',
      },
    });
  });
  return Deno.serve({ port: internalPort, hostname: '127.0.0.1' }, upstream.fetch);
}

async function startFront(
  internalPort: number,
  liveCreateWait: LiveCreateWaitConfig,
): Promise<Awaited<ReturnType<ReturnType<typeof createPluginService>['serve']>>> {
  const front = await getAvailablePort();
  return await createPluginService({}, {
    name: 'streams',
    version: '0.0.0-test',
    port: front,
    serveRpc: false,
    cors: { origin: '*' },
    rawRoutes: [{
      method: 'all',
      path: '/*',
      handler: createStreamsProxyHandler({ internalPort, liveCreateWait }),
    }],
  }).serve();
}

Deno.test('streams live-read race: first live poll of a not-yet-created stream stays open and delivers on producer write', async () => {
  const store = new Map<string, unknown[]>();
  const internalPort = await getAvailablePort();
  const upstreamServer = startFakeUpstream(store, internalPort);
  const running = await startFront(internalPort, { waitMs: 3_000, pollMs: 25 });

  try {
    const base = `http://127.0.0.1:${running.addr.port}`;
    const streamPath = '/v1/stream/fresh-session-topic';
    const expected = crypto.randomUUID();

    // Producer creates the stream and writes shortly AFTER the subscriber's
    // first live poll is already in flight — the race the bug describes.
    const write = (async () => {
      await new Promise((r) => setTimeout(r, 150));
      store.set(streamPath, [{ key: expected }]);
    })();

    // Fresh-session first live/subscribe poll of the not-yet-created stream.
    const res = await fetch(`${base}${streamPath}?offset=-1&live=long-poll`);
    const body = await res.text();
    await write;

    // The bug: this arrives as 404 and the subscription dies. The fix: the poll
    // stays open and delivers the producer's first write.
    assert(res.status !== 404, `live poll must not 404 (got ${res.status})`);
    assertEquals(res.status, 200, 'delivered read is a normal 200');
    assert(body.includes(expected), `delivered body must contain the produced event (body=${body})`);
  } finally {
    await running.stop();
    await upstreamServer.shutdown();
  }
});

Deno.test('streams live-read race: live poll of a stream that never appears returns an empty up-to-date response, not a 404', async () => {
  const store = new Map<string, unknown[]>();
  const internalPort = await getAvailablePort();
  const upstreamServer = startFakeUpstream(store, internalPort);
  // Short bridge window: the stream is never created, so the handler falls
  // through to the empty up-to-date response.
  const running = await startFront(internalPort, { waitMs: 200, pollMs: 25 });

  try {
    const base = `http://127.0.0.1:${running.addr.port}`;
    const res = await fetch(`${base}/v1/stream/never-created?offset=-1&live=long-poll`);
    await res.body?.cancel();

    assert(res.status !== 404, `missing-stream live poll must not 404 (got ${res.status})`);
    assertEquals(res.status, 204, 'empty live poll is 204 No Content');
    assertEquals(res.headers.get('Stream-Up-To-Date'), 'true', 'response signals up-to-date');
    assertEquals(res.headers.get('Stream-Next-Offset'), '-1', 'resume offset echoes the request start offset');
  } finally {
    await running.stop();
    await upstreamServer.shutdown();
  }
});

Deno.test('streams live-read race: a snapshot (non-live) read of a genuinely missing stream still 404s', async () => {
  const store = new Map<string, unknown[]>();
  const internalPort = await getAvailablePort();
  const upstreamServer = startFakeUpstream(store, internalPort);
  const running = await startFront(internalPort, { waitMs: 3_000, pollMs: 25 });

  try {
    const base = `http://127.0.0.1:${running.addr.port}`;
    // No `live` param → one-shot snapshot read; a genuinely missing stream must
    // still 404 (semantics preserved, scope limited to the live path).
    const res = await fetch(`${base}/v1/stream/missing-snapshot?offset=-1`);
    await res.body?.cancel();

    assertEquals(res.status, 404, 'snapshot read of a missing stream 404s unchanged');
  } finally {
    await running.stop();
    await upstreamServer.shutdown();
  }
});
