import { assert, assertEquals, assertThrows } from '@std/assert';
import { os } from 'npm:@orpc/server@^1.15.5';
import { z } from 'npm:zod@^4.6.5';
import { createBodyLimitMiddleware, createService, defineService } from "file:///C:/Users/ericc/source/repos/netscript-native-service-policy-008/packages/service/mod.ts";
import { createStaticCredentialAuthenticator } from "file:///C:/Users/ericc/source/repos/netscript-native-service-policy-008/packages/service/src/auth/static-credential-authenticator.ts";

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
  Deno.test({ name: `diagnostic declared-only defineService bodyLimit rejects ${projection.name} bodies over a real listener`, sanitizeOps: true, sanitizeResources: true, sanitizeExit: true, async fn() {
    const framing: { contentLength?: string; transferEncoding?: string }[] = [];
    const running = await defineService(router, {
      auth: { public: true, reason: 'Public fixture for behavior unrelated to authentication' },
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

      const declared = await fetch(url, {
        method: 'POST',
        headers,
        body: projection.encode('a'.repeat(LIMIT * 2)),
      });
      assertEquals(declared.status, 413);
      assertEquals(declared.headers.get('access-control-allow-origin'), 'https://app.example');
      assertEquals(await declared.json(), PAYLOAD_TOO_LARGE);

    } finally {
      await running.stop();
    }
  }});
}
