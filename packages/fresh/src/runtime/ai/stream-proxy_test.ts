import { assert, assertEquals } from '@std/assert';
import { createChatStreamProxyHandler } from './stream-proxy.ts';

/** Enqueue `text` as a single chunk into a `ReadableStream<Uint8Array>`. */
function streamOf(chunks: readonly string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
}

Deno.test(
  'streams a >1KB chunked body through uncorrupted and strips stale content-length/encoding (#239 fence)',
  async () => {
    // A chunked body well over 1KB, streamed in multiple frames.
    const chunks = Array.from(
      { length: 64 },
      (_, i) => `chunk-${i.toString().padStart(4, '0')}-payload;`,
    );
    const fullBody = chunks.join('');
    assert(fullBody.length > 1024, `body must exceed 1KB, got ${fullBody.length}`);

    // Upstream advertises a BOGUS gzip encoding and a STALE (truncating)
    // content-length on an already-decoded, re-framed body — exactly the #239
    // trap. Also carries hop-by-hop headers that must not survive the hop.
    const upstreamResponse = new Response(streamOf(chunks), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'content-encoding': 'gzip',
        'content-length': '5',
        'transfer-encoding': 'chunked',
        'connection': 'keep-alive',
        'etag': 'W/"abc"',
      },
    });

    let upstreamAuth: string | null = null;
    const handler = createChatStreamProxyHandler({
      resolveUpstreamUrl: () => 'http://upstream.test/ai/chat/s1',
      auth: () => ({ Authorization: 'Bearer server-secret' }),
      fetch: (input) => {
        upstreamAuth = (input as Request).headers.get('authorization');
        return Promise.resolve(upstreamResponse);
      },
    });

    const response = await handler(new Request('http://app.test/api/chat/s1', { method: 'POST' }));

    // Corrupting headers stripped; benign headers preserved.
    assertEquals(response.headers.get('content-encoding'), null);
    assertEquals(response.headers.get('content-length'), null);
    assertEquals(response.headers.get('transfer-encoding'), null);
    assertEquals(response.headers.get('connection'), null);
    assertEquals(response.headers.get('content-type'), 'application/json');
    assertEquals(response.headers.get('etag'), 'W/"abc"');

    // Full, uncorrupted body — no truncation from the stale content-length.
    const received = await response.text();
    assertEquals(received, fullBody);
    assert(received.length > 1024);

    // Auth was attached to the server→streams hop, never to the client response.
    assertEquals(upstreamAuth, 'Bearer server-secret');
    assertEquals(response.headers.get('authorization'), null);
  },
);

Deno.test('propagates the client AbortSignal into the upstream fetch (F-13 cancel-aware)', async () => {
  const controller = new AbortController();
  let upstreamSignal: AbortSignal | undefined;
  let streamCancelled = false;

  const handler = createChatStreamProxyHandler({
    resolveUpstreamUrl: () => 'http://upstream.test/ai/chat/s1',
    auth: () => ({}),
    fetch: (input) => {
      const req = input as Request;
      upstreamSignal = req.signal;
      // A body that never completes on its own — only a client disconnect
      // (cancel) tears it down. This mirrors an open durable chat stream.
      const body = new ReadableStream<Uint8Array>({
        cancel() {
          streamCancelled = true;
        },
      });
      return Promise.resolve(new Response(body, { status: 200 }));
    },
  });

  const request = new Request('http://app.test/api/chat/s1', {
    method: 'POST',
    signal: controller.signal,
  });
  const response = await handler(request);

  // Before disconnect: the upstream fetch saw a live (un-aborted) signal.
  assert(upstreamSignal !== undefined);
  assertEquals(upstreamSignal!.aborted, false);

  // Client disconnect → the same signal aborts the inner fetch.
  controller.abort();
  assertEquals(upstreamSignal!.aborted, true);

  // Tear down the client-facing stream; the upstream stream is cancelled.
  await response.body?.cancel();
  assert(streamCancelled);
});
