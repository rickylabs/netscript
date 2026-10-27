/**
 * Workers `./service` factory.
 *
 * Importing this module performs no env, file, KV or network work. The oRPC router, runtime and
 * job composition that do are loaded inside {@link startWorkersService} after the caller's auth
 * posture has been asserted, so an invalid posture never reaches host resources.
 *
 * @module
 */

import type { PluginServiceContext } from '@netscript/plugin/sdk';
import type { CorsOptions, RunningService, ServeOptions } from '@netscript/service';
import { assertServiceAuthPolicy, type ServiceAuthPolicy } from '@netscript/service/auth';

/** Caller-owned policy for one workers service instance. */
export interface WorkersServiceOptions {
  /** Native guards, or an explicit public opt-out with a nonblank reason. */
  readonly auth: ServiceAuthPolicy;
  /** Forwarded unchanged to the native CORS middleware; omitted keeps the native defaults. */
  readonly cors?: CorsOptions;
  /** Forwarded by reference to the native listener; `serve.port` (including 0) wins over `PORT`. */
  readonly serve?: ServeOptions;
}

const MISSING_PORT_MESSAGE = 'Workers API requires the host-provided PORT environment variable.';

/**
 * Starts the Workers API service over the host-provided context.
 *
 * Order: auth assertion, port resolution, composition load, runtime and job registration,
 * listener. `options.auth`, `options.cors` and `options.serve` are passed through by reference;
 * nothing is copied or normalized. `context` is read only for the legacy `context.env.PORT` seam
 * and is not forwarded to the service. The runtime resolves the native global `getKv()` from
 * `@netscript/kv` inside this call, so the host registers its adapter beforehand; the factory
 * never closes it.
 *
 * @param context - Host-provided plugin service context; only `env.PORT` is read.
 * @param options - Auth posture plus optional CORS and listener options.
 * @returns The running service; `stop()` drains the listener.
 * @throws {TypeError} When `options.auth` is not a valid native auth posture.
 * @throws {Error} When neither `options.serve.port` nor a `PORT` value is available.
 *
 * @example Guarded service on an ephemeral loopback port, host-registered KV adapter
 * ```ts
 * import '@netscript/kv/redis'; // registers the adapter the runtime's getKv() selects
 * import { getKv } from '@netscript/kv';
 * import { createPluginServiceContext } from '@netscript/plugin/sdk';
 * import { createStaticCredentialAuthenticator } from '@netscript/service/auth';
 * import { startWorkersService } from '@netscript/plugin-workers/service';
 *
 * declare const openDatabaseClient: () => Promise<unknown>;
 *
 * const context = await createPluginServiceContext('workers', {
 *   getDatabaseClient: () => openDatabaseClient(),
 *   getKv: () => getKv(),
 * });
 * const authenticator = createStaticCredentialAuthenticator({
 *   credentials: {
 *     local: { subject: 'service:workers', scopes: ['workers:read'], roles: ['service'] },
 *   },
 * });
 *
 * const running = await startWorkersService(context, {
 *   auth: { authn: { authenticator } },
 *   serve: { hostname: '127.0.0.1', port: 0 },
 * });
 * console.log(running.addr.port);
 * await running.stop();
 * ```
 */
export async function startWorkersService(
  context: PluginServiceContext,
  options: WorkersServiceOptions,
): Promise<RunningService> {
  assertServiceAuthPolicy(options?.auth);
  const port = options.serve?.port ?? resolveHostPort(context);

  const [
    { createPluginService },
    { router },
    { registerPluginJobs },
    { registerGeneratedJobDefinitions },
    { describeGeneratedJobRegistry },
    { createStreamMutationHook },
    { createWorkersServiceRuntime },
  ] = await Promise.all([
    import('@netscript/plugin/service'),
    import('./router.ts'),
    import('./init.ts'),
    import('./generated-jobs.ts'),
    import('../../src/runtime/generated-jobs.ts'),
    import('../../streams/server.ts'),
    import('./service-runtime.ts'),
  ]);

  const runtime = await createWorkersServiceRuntime();
  await registerPluginJobs(runtime);
  const generated = await registerGeneratedJobDefinitions(runtime);
  console.log(`[Workers Plugin] ${describeGeneratedJobRegistry(generated)}`);

  const running = await createPluginService(router, {
    auth: options.auth,
    cors: options.cors,
    name: 'workers',
    version: '1.0.0',
    port,
    openApi: {
      title: 'Workers API',
      description: 'Workers service for job management and execution',
    },
    context: () => ({ workers: runtime }),
  }).serve(options.serve);

  queueMicrotask(() => {
    try {
      runtime.executionState.setMutationHook(createStreamMutationHook());

      console.log(
        `Subscribe: http://localhost:${port}/api/v1/workers/subscribe (KV watch SSE)`,
      );
    } catch (error) {
      console.error('[Workers Plugin] Failed to finish post-listen startup:', error);
    }
  });

  return running;
}

/** Legacy host port seam: `context.env.PORT`, then the process environment; same parse and error. */
function resolveHostPort(context: PluginServiceContext): number {
  const value = context.env.PORT ?? Deno.env.get('PORT');
  if (value === undefined) {
    throw new Error(MISSING_PORT_MESSAGE);
  }
  return Number.parseInt(value, 10);
}
