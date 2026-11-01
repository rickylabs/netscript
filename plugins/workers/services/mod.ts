/**
 * Caller-policy entrypoint for the Workers API service.
 *
 * `@netscript/plugin-workers/service` exposes {@link startWorkersService}: a factory that starts
 * the same oRPC Workers API as the legacy `./services` entrypoint, but with the auth posture,
 * CORS and listener options owned by the caller instead of being fixed inside the plugin.
 *
 * Importing this module is inert — no environment, file, KV or network access happens until
 * `startWorkersService` runs. The first thing the factory does is assert `options.auth` with the
 * native `assertServiceAuthPolicy`, so a missing, mixed or blank-reason posture throws before
 * the host port, the KV adapter or the listener is touched.
 *
 * The plugin service context is read for one thing only: the legacy `context.env.PORT` seam.
 * The runtime keeps resolving the native global `getKv()` from `@netscript/kv`, exactly as the
 * legacy entrypoint does, so the host registers the adapter it wants before calling the factory
 * (the legacy entrypoint does this with `import '@netscript/kv/redis'`). The factory never closes
 * that adapter.
 *
 * Port resolution follows the legacy seam unless the caller pins a listener: an explicit
 * `serve.port` (including `0` for an ephemeral port) wins; otherwise `context.env.PORT`, then the
 * process `PORT`, with the legacy error when neither is set. `serve.hostname`, `serve.tls` and
 * `serve.signal` are forwarded unchanged to the native listener.
 *
 * Permissions for a caller: `--allow-net` for the listener, `--allow-env` when the port comes
 * from `PORT`, plus whatever the registered KV adapter needs.
 *
 * @example Guarded workers service bound to an ephemeral loopback port
 * ```ts
 * import '@netscript/kv/redis'; // registers the Redis/Garnet adapter the runtime's getKv() selects
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
 * console.log(running.addr.port); // the port the OS picked
 * await running.stop();
 * ```
 *
 * @example Explicit public opt-out with a reviewed reason
 * ```ts
 * import type { PluginServiceContext } from '@netscript/plugin/sdk';
 * import { startWorkersService } from '@netscript/plugin-workers/service';
 *
 * declare const context: PluginServiceContext;
 *
 * const running = await startWorkersService(context, {
 *   auth: { public: true, reason: 'Internal mesh; ingress authenticates upstream (#1383).' },
 * });
 * await running.stop();
 * ```
 *
 * @module
 */

export { startWorkersService, type WorkersServiceOptions } from './src/service.ts';

// Identity re-exports of the native types reachable from the public signature, so the documented
// surface is self-complete for the JSR `private-type-ref` doc rule. The resulting 23-symbol count
// is recorded as accepted F-5 debt: WORKERS-SERVICE-NATIVE-TYPE-CLOSURE-F5-U1-20261027.
export type { PluginServiceContext } from '@netscript/plugin/sdk';
export type {
  CorsOptions,
  RunningService,
  RunningServiceAddress,
  ServeOptions,
  ServiceApp,
  ServiceEnvironment,
  ServiceTlsOptions,
} from '@netscript/service';
export type {
  AuthenticatorPort,
  AuthnOptions,
  AuthnRequest,
  AuthnResult,
  AuthorizerPort,
  AuthzDecision,
  AuthzOptions,
  AuthzRequest,
  Principal,
  ProcedureErrorCode,
  ServiceAuthPolicy,
  ServiceGuardedAuthPolicy,
  ServicePublicAuthPolicy,
} from '@netscript/service/auth';
