import { assert, assertEquals } from 'jsr:@std/assert@^1';
import {
  restreamUpstreamBody,
  sanitizeProxyResponse,
  sanitizeProxyResponseHeaders,
} from '../../services/src/proxy-headers.ts';

Deno.test('sanitizeProxyResponseHeaders strips the gzip mislabel and hop-by-hop headers', () => {
  const source = new Headers({
    'content-type': 'application/json',
    'content-encoding': 'gzip',
    'content-length': '9999',
    'transfer-encoding': 'chunked',
    'connection': 'keep-alive',
    'etag': 'W/"abc"',
    'stream-next-offset': '42',
  });

  const out = sanitizeProxyResponseHeaders(source);

  // the mislabel + stale length are gone
  assertEquals(out.get('content-encoding'), null);
  assertEquals(out.get('content-length'), null);
  // hop-by-hop headers are gone
  assertEquals(out.get('transfer-encoding'), null);
  assertEquals(out.get('connection'), null);
  // everything else — content-type, etag, durable-stream headers — is preserved
  assertEquals(out.get('content-type'), 'application/json');
  assertEquals(out.get('etag'), 'W/"abc"');
  assertEquals(out.get('stream-next-offset'), '42');
});

Deno.test('sanitizeProxyResponse re-streams a >1KiB plain body mislabeled as gzip', async () => {
  // A durable-stream JSON event body: literal JSON (starts `[{`, the #219
  // wire-proof shape), well over 1 KiB, but the upstream advertises gzip.
  // The re-streamed response must carry the bytes verbatim and NO
  // content-encoding, so a compliant reader never tries to gunzip a plain body.
  const payload = JSON.stringify(
    Array.from({ length: 64 }, (_, i) => ({
      type: 'TEXT_MESSAGE_CONTENT',
      seq: i,
      delta: 'x'.repeat(16),
    })),
  );
  assertEquals(payload.length > 1024, true);
  assertEquals(payload.startsWith('[{'), true);

  const upstream = new Response(payload, {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'content-encoding': 'gzip',
      'content-length': String(payload.length),
    },
  });

  const proxied = sanitizeProxyResponse(upstream);

  assertEquals(proxied.status, 200);
  assertEquals(proxied.headers.get('content-encoding'), null);
  assertEquals(proxied.headers.get('content-length'), null);
  assertEquals(proxied.headers.get('content-type'), 'application/json');
  // body survives intact
  assertEquals(await proxied.text(), payload);
});

Deno.test('sanitizeProxyResponse preserves status and statusText', () => {
  const upstream = new Response('not found', { status: 404, statusText: 'Not Found' });
  const proxied = sanitizeProxyResponse(upstream);
  assertEquals(proxied.status, 404);
  assertEquals(proxied.statusText, 'Not Found');
});

Deno.test('sanitizeProxyResponse forwards a null upstream body unchanged (204)', async () => {
  const upstream = new Response(null, { status: 204, statusText: 'No Content' });
  const proxied = sanitizeProxyResponse(upstream);
  assertEquals(proxied.status, 204);
  assertEquals(proxied.body, null);
  await proxied.body?.cancel();
});

Deno.test('restreamUpstreamBody re-emits every chunk verbatim through a fresh stream', async () => {
  const chunks = ['alpha', 'bravo', 'charlie'];
  const encoder = new TextEncoder();
  let emitted = 0;
  const upstreamBody = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (emitted < chunks.length) {
        controller.enqueue(encoder.encode(chunks[emitted]));
        emitted++;
      } else {
        controller.close();
      }
    },
  });

  const restreamed = restreamUpstreamBody(upstreamBody);
  // The re-streamed stream is a distinct object, not the raw upstream body.
  assert(restreamed !== upstreamBody, 'restream wraps the upstream in a new stream');

  const collected = await new Response(restreamed).text();
  // Bytes are forwarded verbatim and in order — the #239 body invariant holds.
  assertEquals(collected, chunks.join(''));
});

Deno.test(
  'sanitizeProxyResponse: a mid-stream client disconnect cancels the upstream reader with no AbortError (netscript#268)',
  async () => {
    let upstreamCancelled = false;
    let upstreamCancelReason: unknown;
    const encoder = new TextEncoder();
    let emitted = 0;

    // A never-ending upstream body: it only stops when the reader is cancelled,
    // standing in for a live durable-streams long-poll the client abandons.
    const upstreamBody = new ReadableStream<Uint8Array>({
      pull(controller) {
        emitted++;
        controller.enqueue(encoder.encode(`chunk-${emitted}`));
      },
      cancel(reason) {
        upstreamCancelled = true;
        upstreamCancelReason = reason;
      },
    });

    const upstream = new Response(upstreamBody, {
      status: 200,
      headers: { 'content-type': 'application/json', 'content-encoding': 'gzip' },
    });

    // Capture any AbortError (or other) unhandled rejection during the cancel.
    const rejections: unknown[] = [];
    const onRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      rejections.push(event.reason);
    };
    globalThis.addEventListener('unhandledrejection', onRejection);

    try {
      const proxied = sanitizeProxyResponse(upstream);
      // #239 header invariant still holds through the explicit stream.
      assertEquals(proxied.headers.get('content-encoding'), null);

      const reader = proxied.body!.getReader();
      const first = await reader.read();
      assert(!first.done, 'the first chunk streams through before the disconnect');
      assertEquals(new TextDecoder().decode(first.value), 'chunk-1');

      // Simulate the client disconnecting mid-stream: Deno.serve cancels the
      // served response body. A reason is forwarded to prove it propagates.
      await reader.cancel('client-disconnected');

      // Let any queued microtasks / rejection callbacks settle.
      await new Promise((resolve) => setTimeout(resolve, 10));

      assert(upstreamCancelled, 'the upstream reader/source cancel path ran');
      assertEquals(upstreamCancelReason, 'client-disconnected');
      assertEquals(rejections.length, 0);
    } finally {
      globalThis.removeEventListener('unhandledrejection', onRejection);
    }
  },
);
