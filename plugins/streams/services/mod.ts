/**
 * Caller-policy entrypoint for the streams proxy service.
 *
 * Importing `@netscript/plugin-streams/service` is inert. {@link startStreamsService} validates
 * the required native auth posture before environment reads, storage or either listener starts.
 * The legacy `./services` entrypoint keeps its existing start-on-import behavior separately.
 *
 * An explicit `serve.port`, including 0, wins over process `PORT`, then `STREAMS_PORT`.
 * Auth and serve objects are forwarded unchanged; native hostname, TLS, signal and drain options
 * remain owned by the caller. The returned native handle owns front-listener drain and invokes
 * the upstream stop hook. Startup failures attempt upstream stop while preserving the primary
 * error; a rejected cleanup is not proof that resources were released.
 *
 * CORS supplies the existing six methods, nine allowed headers and twelve exposed headers only.
 * Caller arrays replace their respective defaults by reference. Omitted origin stays absent for
 * native environment behavior; credentials and maxAge are present only when supplied. There is
 * no wildcard origin default. Native CORS policy validation remains authoritative.
 *
 * Startup reads environment variables and uses network access for the front/upstream listeners
 * and proxy. The current native storage backend also needs read/write, sys and ffi permissions;
 * hosts scope those permissions to their deployment. STREAMS_DATA_DIR retains its existing
 * fail-fast write/read probe; an omitted directory selects ephemeral memory. The factory has
 * no KV context and never closes global KV resources.
 *
 * @example Guarded service with caller-owned listener options
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
 * await running.stop();
 * ```
 *
 * @example Explicit public posture with a reviewed reason
 * ```ts
 * import { startStreamsService } from '@netscript/plugin-streams/service';
 *
 * const running = await startStreamsService({
 *   auth: { public: true, reason: 'Internal mesh; ingress authenticates upstream.' },
 * });
 * await running.stop();
 * ```
 *
 * @module
 */

export { startStreamsService, type StreamsServiceOptions } from './src/service.ts';

// Exact native identity closure for public doc-lint; all 22 names count as numeric F5 debt.
// STREAMS-SERVICE-NATIVE-TYPE-CLOSURE-F5-U1-20261028 is separate from the workers exception.
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
