/**
 * Runtime-neutral stream proxy mount contracts for `@netscript/service`.
 *
 * Keeps `@netscript/service` strictly acyclic with respect to `@netscript/plugin-streams-core`:
 * services declare and authorize mounted stream endpoints structurally via
 * `@netscript/contracts/streams`, while `@netscript/plugin-streams-core/proxy` supplies concrete
 * `StreamProxyMount` instances via `bindStreamProxy()`.
 *
 * @module
 */

import type { StreamEndpointContract } from '@netscript/contracts/streams';
import type { Principal } from '../auth/types.ts';
import type { ServiceProxyTrust } from '../rate-limit/middleware/options.ts';

/**
 * Per-request execution context supplied by `ServiceBuilder` / `defineService` to a mounted
 * {@link StreamProxyMount}.
 */
export interface StreamProxyMountContext {
  /** Decoded path parameters matched by the Hono route. */
  readonly params: Readonly<Record<string, string>>;
  /**
   * Exact credential transport selected BEFORE `withAuthn` ran (`'bearer'` or `'cookie'`).
   * Guarantees `principal` was authenticated strictly from this credential mode.
   */
  readonly credentialMode: 'bearer' | 'cookie';
  /** Authenticated principal set by `withAuthn` strictly from `credentialMode`, when present. */
  readonly principal?: Principal;
  /** Socket peer metadata from `ServiceEnvironment.remoteAddr`, used for trusted proxy-origin checks. */
  readonly remoteAddr?: Deno.Addr;
  /** Service-owned pre-drain shutdown signal; aborted before `server.shutdown()` waits. */
  readonly shutdownSignal: AbortSignal;
}

/**
 * Structural mount descriptor accepted by `ServiceBuilder.withStreamProxy()` and
 * `DefineServiceOptions.streamProxies`.
 */
export interface StreamProxyMount {
  /** Authoritative stream endpoint contract governing path, `clientAuth`, and `access` policy. */
  readonly endpoint: StreamEndpointContract<unknown, unknown, unknown, unknown>;
  /**
   * Pre-authn guard configuration read by `ServiceBuilder` to run deterministic credential
   * selection and cookie Origin/Fetch-Metadata checks BEFORE `withAuthn` touches credentials or
   * refreshes sessions.
   */
  readonly guardConfig?: Readonly<{
    /** Exact cross-origin allowlist for cookie clients (`*` and `null` are rejected). */
    readonly allowedOrigins?: readonly string[];
    /** Explicit trusted reverse-proxy peer predicate for forwarded origin resolution. */
    readonly trustProxy?: ServiceProxyTrust;
    /** Whether direct navigation (`Sec-Fetch-Site: none`) is allowed for cookie requests. */
    readonly allowDirectNavigation?: boolean;
  }>;
  /** Handles one matched GET request for this stream endpoint. */
  handle(request: Request, context: StreamProxyMountContext): Promise<Response>;
}
