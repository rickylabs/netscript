/**
 * Durable Streams service entrypoint.
 *
 * Starts the `@durable-streams/server` `DurableStreamTestServer` on an
 * internal port, then fronts it with the mandated `createPluginService`
 * serving surface configured as a pure transparent proxy:
 *   - `/health`, `/health/live`, `/health/ready` via `withHealth`
 *   - all other requests proxied to the upstream DurableStreamTestServer
 *     through a raw catch-all route (`method: 'all'`, `path: '/*'`)
 *
 * Streams is the one plugin with no oRPC contract, so the service is built
 * with an empty router and `serveRpc: false` (no `withRPC` wiring).
 *
 * When `STREAMS_DATA_DIR` is set the server uses file-backed storage so
 * events survive process restarts.  Omitting the env var uses in-memory
 * storage (suitable for development).
 *
 * @module
 */

import type { Context } from 'hono';
import { getAvailablePort } from '@std/net';
import { healthChecks } from '@netscript/service';
import { createPluginService } from '@netscript/plugin/service';
import { DurableStreamTestServer } from '@durable-streams/server';
import denoJson from '../../deno.json' with { type: 'json' };

/** Connector version, single-sourced from the streams package `deno.json`. */
const VERSION: string = denoJson.version;

const port = parseInt(
  Deno.env.get('PORT') ?? Deno.env.get('STREAMS_PORT') ?? '4437',
  10,
);
const dataDir = Deno.env.get('STREAMS_DATA_DIR');

// ── Start the upstream streams server on an internal port ─────────────
const internalPortOverride = Deno.env.get('STREAMS_INTERNAL_PORT');
const preferredInternalPort = internalPortOverride ? parseInt(internalPortOverride, 10) : undefined;
const internalPort = await getAvailablePort({
  preferredPort: preferredInternalPort,
});

const server = new DurableStreamTestServer({
  port: internalPort,
  host: '127.0.0.1',
  dataDir,
});

const internalUrl = await server.start();
void internalUrl;

// ── Health check: verify upstream is reachable ────────────────────────
const upstreamCheck = healthChecks.custom('durable-streams-server', async () => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(`http://127.0.0.1:${internalPort}/`, {
      signal: controller.signal,
    });
    return res.status < 500;
  } finally {
    clearTimeout(timeout);
  }
});

// ── Transparent proxy to the upstream DurableStreamTestServer ─────────
// Matches all paths (including nested routes like /v1/stream/...) that are
// not handled by the health endpoints or the service-info root.
const proxyHandler = async (c: Context): Promise<Response> => {
  const url = new URL(c.req.url);
  const target = `http://127.0.0.1:${internalPort}${url.pathname}${url.search}`;
  try {
    const proxyReq = new Request(target, {
      method: c.req.method,
      headers: c.req.raw.headers,
      body: c.req.raw.body,
      // @ts-ignore Deno supports duplex on Request
      duplex: c.req.raw.body ? 'half' : undefined,
    });
    return await fetch(proxyReq);
  } catch {
    return c.json({ error: 'Upstream unavailable' }, 502);
  }
};

// ── Serve via the mandated createPluginService surface ────────────────
// Empty router + serveRpc:false → no oRPC wiring (streams has no contract).
// `serve()` owns the front listener and graceful SIGINT/SIGTERM/SIGBREAK
// shutdown; the upstream server stop runs as an onShutdown hook.
const running = await createPluginService({}, {
  name: 'streams',
  version: VERSION,
  port,
  serveRpc: false,
  cors: {
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'],
    allowHeaders: [
      'Content-Type',
      'Authorization',
      'Stream-Seq',
      'Stream-TTL',
      'Stream-Expires-At',
      'Stream-Closed',
      'Producer-Id',
      'Producer-Epoch',
      'Producer-Seq',
    ],
    exposeHeaders: [
      'Stream-Next-Offset',
      'Stream-Cursor',
      'Stream-Up-To-Date',
      'Stream-Closed',
      'Producer-Epoch',
      'Producer-Seq',
      'Producer-Expected-Seq',
      'Producer-Received-Seq',
      'etag',
      'content-type',
      'content-encoding',
      'vary',
    ],
  },
  healthChecks: [upstreamCheck],
  rawRoutes: [{ method: 'all', path: '/*', handler: proxyHandler }],
  onShutdown: [async () => {
    await server.stop();
  }],
}).serve();

void running;
