/**
 * Caller-owned streams service composition. Importing this module is inert; native composition,
 * storage and proxy modules load only after auth validation and host port resolution.
 * @module
 */

import type { CorsOptions, RunningService, ServeOptions } from '@netscript/service';
import { assertServiceAuthPolicy, type ServiceAuthPolicy } from '@netscript/service/auth';

/** Native caller policy for one streams service instance. */
export interface StreamsServiceOptions {
  /** Native guards or an explicit public posture with a nonblank reason. */
  readonly auth: ServiceAuthPolicy;
  /** Caller fields override streams protocol defaults; omitted origin keeps native behavior. */
  readonly cors?: CorsOptions;
  /** Passed unchanged to the native listener; explicit port, including 0, wins over host env. */
  readonly serve?: ServeOptions;
}

const DEFAULT_ALLOW_METHODS: readonly string[] = Object.freeze([
  'GET',
  'POST',
  'PUT',
  'DELETE',
  'HEAD',
  'OPTIONS',
]);
const DEFAULT_ALLOW_HEADERS: readonly string[] = Object.freeze([
  'Content-Type',
  'Authorization',
  'Stream-Seq',
  'Stream-TTL',
  'Stream-Expires-At',
  'Stream-Closed',
  'Producer-Id',
  'Producer-Epoch',
  'Producer-Seq',
]);
const DEFAULT_EXPOSE_HEADERS: readonly string[] = Object.freeze([
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
]);

/**
 * Starts the native streams proxy and its factory-owned upstream server.
 *
 * Auth is asserted before any environment, storage or listener access. Auth and serve objects,
 * and caller CORS arrays, retain identity. Only omitted protocol arrays receive copied defaults.
 * The native running handle drains the front listener and stops the upstream through its shutdown
 * hook. Before that handle exists, startup failure attempts native upstream stop and preserves the
 * identical primary error even if cleanup rejects. No unrelated or global resources are closed.
 *
 * @param options - Required native auth posture and optional CORS/listener configuration.
 * @returns The native running handle; its stop and caller signal use native drain semantics.
 * @throws {TypeError} When the caller's auth posture is invalid.
 * @throws {Error} When no explicit port or host PORT/STREAMS_PORT value is available.
 *
 * @example Guarded streams service on an ephemeral loopback port
 * ```ts
 * import { createStaticCredentialAuthenticator } from '@netscript/service/auth';
 * import { startStreamsService } from '@netscript/plugin-streams/service';
 *
 * const authenticator = createStaticCredentialAuthenticator({
 *   credentials: { local: { subject: 'service:streams', scopes: [], roles: ['service'] } },
 * });
 * const running = await startStreamsService({
 *   auth: { authn: { authenticator, protect: ['/'] } },
 *   serve: { hostname: '127.0.0.1', port: 0 },
 * });
 * console.log(running.addr.port);
 * await running.stop();
 * ```
 */
export async function startStreamsService(options: StreamsServiceOptions): Promise<RunningService> {
  assertServiceAuthPolicy(options?.auth);
  const port = options.serve?.port ?? resolveHostPort();
  const [
    { getAvailablePort },
    { healthChecks },
    { createPluginService },
    { createStreamsServer },
    { PLUGIN_PACKAGE_VERSION },
    { createStreamsProxyHandler },
    { createStorageHealthCheck, describeStorageDurability },
  ] = await Promise.all([
    import('@std/net'),
    import('@netscript/service'),
    import('@netscript/plugin/service'),
    import('./bounded-file-store.ts'),
    import('../../src/package-metadata.generated.ts'),
    import('./proxy.ts'),
    import('./durability.ts'),
  ]);
  const dataDir = Deno.env.get('STREAMS_DATA_DIR');
  const durability = await describeStorageDurability(dataDir);
  if (!durability.durable) console.warn(`[streams] Warning: ${durability.message}`);
  const internalPortOverride = Deno.env.get('STREAMS_INTERNAL_PORT');
  const internalPort = await getAvailablePort({
    preferredPort: internalPortOverride ? parseInt(internalPortOverride, 10) : undefined,
  });
  const server = createStreamsServer({ port: internalPort, host: '127.0.0.1', dataDir });
  try {
    await server.start();
    const upstreamCheck = healthChecks.custom('durable-streams-server', async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      try {
        const res = await fetch(`http://127.0.0.1:${internalPort}/`, {
          signal: controller.signal,
        });
        await res.body?.cancel();
        return res.status < 500;
      } finally {
        clearTimeout(timeout);
      }
    });
    const proxyHandler = createStreamsProxyHandler({ internalPort });
    return await createPluginService({}, {
      auth: options.auth,
      name: 'streams',
      version: PLUGIN_PACKAGE_VERSION,
      port,
      serveRpc: false,
      cors: {
        ...options.cors,
        allowMethods: options.cors?.allowMethods ?? [...DEFAULT_ALLOW_METHODS],
        allowHeaders: options.cors?.allowHeaders ?? [...DEFAULT_ALLOW_HEADERS],
        exposeHeaders: options.cors?.exposeHeaders ?? [...DEFAULT_EXPOSE_HEADERS],
      },
      healthChecks: [upstreamCheck, createStorageHealthCheck(durability)],
      rawRoutes: [{ method: 'all', path: '/*', handler: proxyHandler }],
      onShutdown: [async () => {
        await server.stop();
      }],
    }).serve(options.serve);
  } catch (error) {
    try {
      await server.stop();
    } catch {
      // Native cleanup can reject; preserve the primary startup failure without claiming cleanup.
    }
    throw error;
  }
}

/** Retains the legacy host port precedence, parse and missing-value error. */
function resolveHostPort(): number {
  const value = Deno.env.get('PORT') ?? Deno.env.get('STREAMS_PORT');
  if (value === undefined) {
    throw new Error('Streams requires the host-provided PORT environment variable.');
  }
  return Number.parseInt(value, 10);
}
