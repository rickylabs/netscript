/**
 * Loopback server for HTTP contract regressions that need a real `fetch`:
 *
 * - `GET /stalled-401` serves 401 headers, then a body that never arrives.
 * - `GET /redirect-to-session` serves 302 to `/session`.
 * - `GET /session` serves the matching 200 `{ "authenticated": false }`.
 */
export interface ContractTestServer {
  readonly baseUrl: string;
  /** Stalled bodies the client cancelled instead of waiting for. */
  readonly cancelledStalledBodies: () => number;
  readonly close: () => Promise<void>;
}

/** Start the loopback contract server on an ephemeral port. */
export function startContractTestServer(): ContractTestServer {
  const stalled = new Set<ReadableStreamDefaultController<Uint8Array>>();
  let cancelled = 0;
  const server = Deno.serve({ hostname: '127.0.0.1', port: 0, onListen: () => {} }, (request) => {
    const path = new URL(request.url).pathname;
    if (path === '/stalled-401') {
      let owned: ReadableStreamDefaultController<Uint8Array> | undefined;
      const body = new ReadableStream<Uint8Array>({
        start: (controller) => {
          owned = controller;
          stalled.add(controller);
        },
        cancel: () => {
          cancelled += 1;
          if (owned) stalled.delete(owned);
        },
      });
      return new Response(body, { status: 401 });
    }
    if (path === '/redirect-to-session') {
      return new Response(null, { status: 302, headers: { location: '/session' } });
    }
    if (path === '/session') return Response.json({ authenticated: false });
    return new Response('not found', { status: 404 });
  });
  return {
    baseUrl: `http://127.0.0.1:${server.addr.port}`,
    cancelledStalledBodies: () => cancelled,
    close: async () => {
      for (const controller of stalled) controller.close();
      stalled.clear();
      await server.shutdown();
    },
  };
}
