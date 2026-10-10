import { assert, assertEquals, assertThrows } from '@std/assert';
import { os } from '@orpc/server';
import { z } from 'zod';
import { createBodyLimitMiddleware, createService, defineService } from '../mod.ts';
import { createStaticCredentialAuthenticator } from '../src/auth/static-credential-authenticator.ts';

const LIMIT = 1024;
const CHUNK = 256;

const router = os.router({
  echo: os
    .route({ method: 'POST', path: '/echo' })
    .input(z.object({ data: z.string() }))
    .output(z.object({ length: z.number() }))
    .handler(({ input }) => ({ length: input.data.length })),
});

const PAYLOAD_TOO_LARGE = {
  error: 'PAYLOAD_TOO_LARGE',
  message: `Request body exceeds ${LIMIT} bytes`,
  maxBytes: LIMIT,
};

interface Projection {
  readonly name: string;
  readonly path: string;
  readonly encode: (data: string) => string;
}

const PROJECTIONS: readonly Projection[] = [
  { name: 'RPC', path: '/api/rpc/echo', encode: (data) => JSON.stringify({ json: { data } }) },
  { name: 'OpenAPI', path: '/api/echo', encode: (data) => JSON.stringify({ data }) },
];

function clientOrigin(hostname: string, port: number): string {
  const host = hostname === '0.0.0.0' ? '127.0.0.1' : hostname;
  return `http://${host}:${port}`;
}

function limitedApp() {
  return createService(router, { name: 'body-limit' })
    .withRPC()
    .withBodyLimit({ maxBytes: LIMIT })
    .build();
}

/** A pull-driven chunked body that records how many bytes the server consumed. */
function countingStream(totalChunks: number): {
  readonly body: ReadableStream<Uint8Array>;
  readonly pulledBytes: () => number;
} {
  const chunk = new TextEncoder().encode('a'.repeat(CHUNK));
  let pulled = 0;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (pulled >= totalChunks * CHUNK) {
        controller.close();
        return;
      }
      pulled += chunk.byteLength;
      controller.enqueue(chunk);
    },
  }, { highWaterMark: 0 });
  return { body, pulledBytes: () => pulled };
}

function chunkedBody(text: string): ReadableStream<Uint8Array> {
  const bytes = new TextEncoder().encode(text);
  let offset = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (offset >= bytes.byteLength) {
        controller.close();
        return;
      }
      controller.enqueue(bytes.slice(offset, offset + CHUNK));
      offset += CHUNK;
    },
  });
}

for (const projection of PROJECTIONS) {
  Deno.test(`body limit accepts a ${projection.name} body under the limit`, async () => {
    const response = await limitedApp().request(projection.path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: projection.encode('a'.repeat(LIMIT / 2)),
    });

    assertEquals(response.status, 200);
    const body = await response.json() as { json?: { length: number }; length?: number };
    assertEquals(body.json?.length ?? body.length, LIMIT / 2);
  });

  Deno.test(`body limit rejects an oversized ${projection.name} Content-Length body with a typed 413`, async () => {
    const payload = projection.encode('a'.repeat(LIMIT * 2));
    const response = await limitedApp().request(projection.path, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': String(new TextEncoder().encode(payload).byteLength),
      },
      body: payload,
    });

    assertEquals(response.status, 413);
    assertEquals(await response.json(), PAYLOAD_TOO_LARGE);
  });

  Deno.test(`body limit rejects an oversized chunked ${projection.name} body without draining it`, async () => {
    const totalChunks = 64; // 16 KiB offered against a 1 KiB limit
    const { body, pulledBytes } = countingStream(totalChunks);
    const response = await limitedApp().request(projection.path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      duplex: 'half',
    } as RequestInit);

    assertEquals(response.status, 413);
    assertEquals(await response.json(), PAYLOAD_TOO_LARGE);
    assert(
      pulledBytes() <= LIMIT + CHUNK,
      `expected the limit to stop reading near ${LIMIT} bytes, read ${pulledBytes()}`,
    );
  });

  Deno.test(`defineService bodyLimit rejects ${projection.name} bodies over a real listener`, async () => {
    const framing: { contentLength?: string; transferEncoding?: string }[] = [];
    const running = await defineService(router, {
      name: `body-limit-${projection.name.toLowerCase()}`,
      port: 0,
      cors: { origin: ['https://app.example'] },
      middleware: [async (c, next) => {
        framing.push({
          contentLength: c.req.header('content-length'),
          transferEncoding: c.req.header('transfer-encoding'),
        });
        await next();
      }],
      bodyLimit: { maxBytes: LIMIT },
    });

    try {
      const url = `${clientOrigin(running.addr.hostname, running.addr.port)}${projection.path}`;
      const headers = { 'content-type': 'application/json', origin: 'https://app.example' };

      const under = await fetch(url, {
        method: 'POST',
        headers,
        body: projection.encode('a'.repeat(LIMIT / 2)),
      });
      assertEquals(under.status, 200);
      await under.body?.cancel();

      const declared = await fetch(url, {
        method: 'POST',
        headers,
        body: projection.encode('a'.repeat(LIMIT * 2)),
      });
      assertEquals(declared.status, 413);
      assertEquals(declared.headers.get('access-control-allow-origin'), 'https://app.example');
      assertEquals(await declared.json(), PAYLOAD_TOO_LARGE);

      const chunked = await fetch(url, {
        method: 'POST',
        headers,
        body: chunkedBody(projection.encode('a'.repeat(LIMIT * 2))),
      });
      assertEquals(chunked.status, 413);
      assertEquals(await chunked.json(), PAYLOAD_TOO_LARGE);
      // The chunked request reached the service without a Content-Length header.
      assertEquals(framing.at(-1), { contentLength: undefined, transferEncoding: 'chunked' });
    } finally {
      await running.stop();
    }
  });
}

Deno.test('defineService without bodyLimit keeps accepting large bodies', async () => {
  const running = await defineService(router, { name: 'body-limit-default', port: 0 });

  try {
    const response = await fetch(
      `${clientOrigin(running.addr.hostname, running.addr.port)}/api/echo`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ data: 'a'.repeat(256 * 1024) }),
      },
    );

    assertEquals(response.status, 200);
    assertEquals(await response.json(), { length: 256 * 1024 });
  } finally {
    await running.stop();
  }
});

Deno.test('body limit lets bodyless requests through a deferred route it guards', async () => {
  const app = createService(router, { name: 'body-limit-get' })
    .withBodyLimit({ maxBytes: 1 })
    .route('all', '/probe', (c: unknown) => (c as { text(body: string): Response }).text('ok'))
    .build();

  // The deferred route is mounted after the limit, so a body on it is rejected...
  const withBody = await app.request('/probe', { method: 'POST', body: 'ab' });
  assertEquals(withBody.status, 413);
  await withBody.body?.cancel();

  // ...while a bodyless GET traverses the same stage untouched.
  const bodyless = await app.request('/probe');
  assertEquals(bodyless.status, 200);
  assertEquals(await bodyless.text(), 'ok');
});

Deno.test('body limit runs after authentication so anonymous callers get 401 first', async () => {
  const app = createService(router, { name: 'body-limit-auth' })
    .withRPC()
    .withBodyLimit({ maxBytes: LIMIT })
    .withAuthn({
      authenticator: createStaticCredentialAuthenticator({
        credentials: { token: { subject: 'service:workers', scopes: [] } },
      }),
    })
    .build();
  const oversized = JSON.stringify({ data: 'a'.repeat(LIMIT * 2) });

  const anonymous = await app.request('/api/echo', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: oversized,
  });
  assertEquals(anonymous.status, 401);

  const authenticated = await app.request('/api/echo', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer token' },
    body: oversized,
  });
  assertEquals(authenticated.status, 413);
  assertEquals(await authenticated.json(), PAYLOAD_TOO_LARGE);
});

Deno.test('createBodyLimitMiddleware rejects a non-positive or fractional maxBytes', () => {
  for (const maxBytes of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
    assertThrows(() => createBodyLimitMiddleware({ maxBytes }), RangeError);
  }
});
