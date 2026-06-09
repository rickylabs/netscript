/**
 * Durable Streams service entrypoint.
 *
 * Starts the `@durable-streams/server` `DurableStreamTestServer` on an
 * internal port, then fronts it with a Hono app that:
 *   - Provides `/health`, `/health/live`, `/health/ready` via @netscript/service
 *   - Proxies all other requests to the upstream DurableStreamTestServer
 *
 * When `STREAMS_DATA_DIR` is set the server uses file-backed storage so
 * events survive process restarts.  Omitting the env var uses in-memory
 * storage (suitable for development).
 *
 * @module
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getAvailablePort } from '@std/net';
import {
  createHealthHandler,
  createLivenessHandler,
  createReadinessHandler,
  healthChecks,
} from '@netscript/service';
import { DurableStreamTestServer } from '@durable-streams/server';

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

// ── Hono app with health + proxy ──────────────────────────────────────
const app = new Hono();

app.use(
  '*',
  cors({
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
  }),
);

app.get(
  '/health',
  createHealthHandler({
    version: '1.0.0',
    checks: [upstreamCheck],
  }),
);
app.get('/health/live', createLivenessHandler());
app.get(
  '/health/ready',
  createReadinessHandler([
    async () => {
      try {
        const res = await fetch(`http://127.0.0.1:${internalPort}/`);
        return res.status < 500;
      } catch {
        return false;
      }
    },
  ]),
);

// Proxy everything else to the upstream DurableStreamTestServer.
// Use /* to match all paths including nested routes like /v1/stream/...
app.all('/*', async (c) => {
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
});

// ── Start the front proxy ─────────────────────────────────────────────
const frontServer = Deno.serve({ port, hostname: '0.0.0.0' }, app.fetch);

// ── Graceful shutdown ─────────────────────────────────────────────────
const shutdown = async () => {
  try {
    await frontServer.shutdown();
    await server.stop();
  } catch {
    // Ignore stop errors during shutdown
  }
};

Deno.addSignalListener('SIGINT', shutdown);
Deno.addSignalListener('SIGTERM', shutdown);
