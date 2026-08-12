import { assert, assertEquals } from '@std/assert';
import { createNetScriptChatStreamProxy } from './stream-proxy.ts';

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
    let upstreamAcceptEncoding: string | null = null;
    let upstreamUrl: string | undefined;
    const handler = createNetScriptChatStreamProxy({
      target: { sessionId: 's1', baseUrl: 'http://upstream.test' },
      auth: () => ({ Authorization: 'Bearer server-secret' }),
      fetch: (input) => {
        const req = input as Request;
        upstreamUrl = req.url;
        upstreamAuth = req.headers.get('authorization');
        upstreamAcceptEncoding = req.headers.get('accept-encoding');
        return Promise.resolve(upstreamResponse);
      },
    });

    const response = await handler(new Request('http://app.test/api/chat/s1', { method: 'POST' }));

    // Target resolved to the durable `/ai/chat/{sessionId}` addressing.
    assert(upstreamUrl !== undefined);
    assert(
      upstreamUrl!.startsWith('http://upstream.test/') && upstreamUrl!.endsWith('/ai/chat/s1'),
      `unexpected upstream URL: ${upstreamUrl}`,
    );

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
    assertEquals(upstreamAcceptEncoding, 'identity');
    assertEquals(response.headers.get('authorization'), null);
  },
);

Deno.test('forwards durable State-Protocol query parameters to the injected fetch', async () => {
  let upstreamRequest: Request | undefined;
  const handler = createNetScriptChatStreamProxy({
    target: { sessionId: 's1', baseUrl: 'http://upstream.test' },
    auth: () => ({}),
    fetch: (request) => {
      upstreamRequest = request as Request;
      return Promise.resolve(new Response());
    },
  });

  await handler(
    new Request(
      'http://app.test/api/chat-stream?offset=42&live=sse&handle=h1&cursor=next',
    ),
  );

  assert(upstreamRequest);
  const query = new URL(upstreamRequest.url).searchParams;
  assertEquals(query.get('offset'), '42');
  assertEquals(query.get('live'), 'sse');
  assertEquals(query.get('handle'), 'h1');
  assertEquals(query.get('cursor'), 'next');
});

Deno.test('drops application routing id while forwarding durable query parameters', async () => {
  let upstreamRequest: Request | undefined;
  const handler = createNetScriptChatStreamProxy({
    target: { sessionId: 'session-1', baseUrl: 'http://upstream.test' },
    auth: () => ({}),
    fetch: (request) => {
      upstreamRequest = request as Request;
      return Promise.resolve(new Response());
    },
  });

  await handler(
    new Request(
      'http://app.test/api/chat-stream?id=session-1&offset=42&live=sse&handle=h1',
    ),
  );

  assert(upstreamRequest);
  const query = new URL(upstreamRequest.url).searchParams;
  assertEquals(query.get('id'), null);
  assertEquals(query.get('offset'), '42');
  assertEquals(query.get('live'), 'sse');
  assertEquals(query.get('handle'), 'h1');
});

Deno.test('keeps resolved upstream query values on client collisions', async () => {
  let upstreamRequest: Request | undefined;
  const handler = createNetScriptChatStreamProxy({
    target: { sessionId: 's1', baseUrl: 'http://upstream.test' },
    streamPath: ({ target }) => `/ai/chat/${target.sessionId}?live=configured`,
    auth: () => ({}),
    fetch: (request) => {
      upstreamRequest = request as Request;
      return Promise.resolve(new Response());
    },
  });

  await handler(new Request('http://app.test/api/chat-stream?live=client&offset=42'));

  assert(upstreamRequest);
  const query = new URL(upstreamRequest.url).searchParams;
  assertEquals(query.getAll('live'), ['configured']);
  assertEquals(query.get('offset'), '42');
});

Deno.test('preserves repeated incoming query keys', async () => {
  let upstreamRequest: Request | undefined;
  const handler = createNetScriptChatStreamProxy({
    target: { sessionId: 's1', baseUrl: 'http://upstream.test' },
    auth: () => ({}),
    fetch: (request) => {
      upstreamRequest = request as Request;
      return Promise.resolve(new Response());
    },
  });

  await handler(new Request('http://app.test/api/chat-stream?cursor=a&cursor=b'));

  assert(upstreamRequest);
  assertEquals(new URL(upstreamRequest.url).searchParams.getAll('cursor'), ['a', 'b']);
});

Deno.test('query hook replaces default forwarding and can suppress or add parameters', async () => {
  let upstreamRequest: Request | undefined;
  const handler = createNetScriptChatStreamProxy({
    target: { sessionId: 's1', baseUrl: 'http://upstream.test' },
    query: (incoming) =>
      new URLSearchParams([
        ['id', incoming.get('id') ?? 'missing'],
        ['cursor', 'mapped'],
      ]),
    auth: () => ({}),
    fetch: (request) => {
      upstreamRequest = request as Request;
      return Promise.resolve(new Response());
    },
  });

  await handler(
    new Request('http://app.test/api/chat-stream?id=session-1&offset=42&live=sse'),
  );

  assert(upstreamRequest);
  const query = new URL(upstreamRequest.url).searchParams;
  assertEquals(query.get('id'), 'session-1');
  assertEquals(query.get('cursor'), 'mapped');
  assertEquals(query.get('offset'), null);
  assertEquals(query.get('live'), null);
});

Deno.test('leaves a no-query upstream URL unchanged without a stray question mark', async () => {
  let upstreamRequest: Request | undefined;
  const handler = createNetScriptChatStreamProxy({
    target: { sessionId: 's1', baseUrl: 'http://upstream.test' },
    auth: () => ({}),
    fetch: (request) => {
      upstreamRequest = request as Request;
      return Promise.resolve(new Response());
    },
  });

  await handler(new Request('http://app.test/api/chat-stream'));

  assert(upstreamRequest);
  assertEquals(upstreamRequest.url, 'http://upstream.test/v1/stream/netscript/ai/chat/s1');
});

Deno.test(
  'supports eis-chat per-session stream paths and survives identity-negotiated gzip mislabel (#219)',
  async () => {
    const controller = new AbortController();
    const server = Deno.serve(
      { port: 0, signal: controller.signal, onListen() {} },
      (request) => {
        // Mirror durable-streams' bad flavor: plain JSON bytes with a gzip
        // label. With `identity`, Deno fetch leaves the bytes readable so FA2
        // can strip the bad header before returning the response to the app.
        if (request.headers.get('accept-encoding') !== 'identity') {
          return new Response('[{"unreachable":true}]', {
            headers: {
              'content-type': 'application/json',
              'content-encoding': 'gzip',
            },
          });
        }
        return new Response('[{"ok":true}]', {
          headers: {
            'content-type': 'application/json',
            'content-encoding': 'gzip',
          },
        });
      },
    );

    try {
      const { port } = server.addr as Deno.NetAddr;
      let upstreamUrl: string | undefined;
      const handler = createNetScriptChatStreamProxy({
        target: (request) => {
          const sessionId = new URL(request.url).searchParams.get('session') ?? 'missing';
          return { sessionId, baseUrl: `http://127.0.0.1:${port}` };
        },
        streamPath: ({ target }) => `/eischat/sessions/${target.sessionId}/messages`,
        auth: () => ({}),
        fetch: async (input) => {
          const request = input as Request;
          upstreamUrl = request.url;
          return await fetch(request);
        },
      });

      const response = await handler(
        new Request('http://app.test/api/streams/chat?session=eis-123', { method: 'GET' }),
      );

      assertEquals(
        upstreamUrl,
        `http://127.0.0.1:${port}/v1/stream/netscript/eischat/sessions/eis-123/messages?session=eis-123`,
      );
      assertEquals(response.headers.get('content-encoding'), null);
      assertEquals(response.headers.get('content-type'), 'application/json');
      assertEquals(await response.text(), '[{"ok":true}]');
    } finally {
      controller.abort();
      await server.finished.catch(() => undefined);
    }
  },
);

Deno.test('propagates the client AbortSignal into the upstream fetch (F-13 cancel-aware)', async () => {
  const controller = new AbortController();
  let upstreamSignal: AbortSignal | undefined;
  let streamCancelled = false;

  const handler = createNetScriptChatStreamProxy({
    target: (req) => ({
      sessionId: new URL(req.url).pathname.split('/').pop()!,
      baseUrl: 'http://upstream.test',
    }),
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
