import { assertEquals } from 'jsr:@std/assert@^1';
import {
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
