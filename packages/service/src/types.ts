/**
 * Public structural contracts for NetScript service builders and handlers.
 *
 * @module
 */

import type { Context, ErrorHandler, Handler, MiddlewareHandler, NotFoundHandler } from 'hono';
import type { cors } from 'hono/cors';
import type { Principal } from './auth/types.ts';

/** Router definition accepted by the service builder and handler factories. */
export type ServiceRouter = Record<string, unknown>;

/** Socket connection metadata supplied by the listener or a mounting host. */
export interface ServiceEnvironment {
  /** Socket peer address, preserved for Hono's Deno getConnInfo adapter. */
  readonly remoteAddr?: Deno.Addr;
  /** Service-owned pre-drain shutdown signal aborted before `server.shutdown()` waits. */
  readonly shutdownSignal?: AbortSignal;
}

/** Minimal mountable service application returned by `build()`. */
export interface ServiceApp {
  /** Handles a Web Platform request without starting a listener. */
  fetch(request: Request, env?: ServiceEnvironment): Response | Promise<Response>;

  /** Executes an in-memory request against the service app. */
  request(
    input: Request | string | URL,
    init?: RequestInit,
    env?: ServiceEnvironment,
  ): Response | Promise<Response>;
}

/** Network address assigned to a running service listener. */
export interface RunningServiceAddress {
  /** Listener hostname. */
  hostname: string;

  /** Listener port. */
  port: number;

  /** Listener transport. */
  transport: 'tcp' | 'unix';
}

/** Running service handle returned by `serve()` and `defineService()`. */
export interface RunningService {
  /** Mountable service app backing the running listener. */
  app: ServiceApp;

  /** Address selected by Deno for the listener. */
  addr: RunningServiceAddress;

  /** Stops the listener and waits for shutdown to finish. */
  stop(): Promise<void>;
}

/**
 * Reason a service shutdown was triggered.
 *
 * @example
 * ```typescript
 * const reason: ShutdownReason = 'manual';
 * ```
 */
export type ShutdownReason = 'signal' | 'manual' | 'startup-failure';

/**
 * Context passed to shutdown hooks during graceful service drain.
 *
 * @example
 * ```typescript
 * import { createService, type ServiceRouter } from '@netscript/service';
 *
 * declare const router: ServiceRouter;
 * declare const audit: { record(entry: ShutdownContext): void };
 *
 * createService(router, { name: 'users' })
 *   .onShutdown(({ reason, signal }) => {
 *     audit.record({ reason, signal });
 *   });
 * ```
 */
export interface ShutdownContext {
  /** Why shutdown was triggered. */
  readonly reason: ShutdownReason;

  /** OS signal that triggered shutdown, when reason is `signal`. */
  readonly signal?: Deno.Signal;
}

/**
 * Async teardown hook registered with `ServiceBuilder.onShutdown()`.
 *
 * @example
 * ```typescript
 * declare const db: { $disconnect(): Promise<void> };
 *
 * const closeDatabase: ShutdownHook = async () => {
 *   await db.$disconnect();
 * };
 * ```
 */
export type ShutdownHook = (
  context: ShutdownContext,
) => Promise<void> | void;

/**
 * Per-hook outcome captured during graceful drain.
 *
 * @example
 * ```typescript
 * const outcome: ShutdownHookOutcome = { ok: true };
 * ```
 */
export interface ShutdownHookOutcome {
  /** True when the hook completed without throwing. */
  readonly ok: boolean;

  /** Normalized failure message when the hook rejects or throws. */
  readonly error?: string;
}

/**
 * Result of a completed service shutdown.
 *
 * @example
 * ```typescript
 * const report: ShutdownReport = {
 *   reason: 'manual',
 *   timedOut: false,
 *   hooks: [{ ok: true }],
 * };
 * ```
 */
export interface ShutdownReport {
  /** Why shutdown was triggered. */
  readonly reason: ShutdownReason;

  /** True when the drain timeout elapsed before all work settled. */
  readonly timedOut: boolean;

  /** Per-hook outcomes in execution order. */
  readonly hooks: readonly ShutdownHookOutcome[];
}

/**
 * TLS material for a service listener.
 *
 * When supplied, the listener serves HTTPS and Deno automatically negotiates
 * HTTP/2 with clients that support it over ALPN (HTTP/1.1 remains available as a
 * fallback). The fields mirror `Deno.serve`'s `cert`/`key` PEM inputs.
 *
 * @example
 * ```typescript
 * const tls: ServiceTlsOptions = {
 *   cert: await Deno.readTextFile('cert.pem'),
 *   key: await Deno.readTextFile('key.pem'),
 * };
 * ```
 */
export interface ServiceTlsOptions {
  /** PEM-encoded certificate chain. */
  readonly cert: string;

  /** PEM-encoded private key for the certificate. */
  readonly key: string;
}

/**
 * Options for starting a service listener.
 *
 * @example
 * ```typescript
 * import { createService, type ServiceRouter } from '@netscript/service';
 *
 * declare const router: ServiceRouter;
 *
 * const running = await createService(router, { name: 'users' })
 *   .withHealth()
 *   .serve({
 *     port: 3000,
 *     hostname: '127.0.0.1', // loopback-only; omit to bind all interfaces
 *     drainTimeoutMs: 10_000,
 *     handleSignals: true,
 *   });
 *
 * await running.stop();
 * ```
 */
export interface ServeOptions {
  /** Preferred listener port; use `0` for an ephemeral port. */
  port?: number;

  /**
   * Interface the listener binds to, forwarded unchanged to `Deno.serve` on both
   * the plain and the TLS branch. Pass `'127.0.0.1'` to keep the listener
   * loopback-only. When omitted, Deno's default applies and the listener binds
   * all IPv4 interfaces (`0.0.0.0`).
   */
  hostname?: string;

  /** External signal that stops the listener when aborted. */
  signal?: AbortSignal;

  /**
   * Total shutdown budget. Defaults to 30_000 ms; process-owned signal shutdown
   * reserves min(5_000, one fifth) for resource cleanup (25 s work + 5 s cleanup).
   */
  drainTimeoutMs?: number;

  /** Reserved process cleanup budget within drainTimeoutMs; defaults to min(5_000, one fifth). */
  cleanupTimeoutMs?: number;

  /**
   * Owned resource disposers, run on process-owned signals even when work drain times out.
   * These zero-argument callbacks always run in the signal cleanup phase; use onShutdown
   * for work hooks that need a shutdown reason.
   */
  onCleanup?: readonly (() => Promise<void> | void)[];

  /** Set false when onCleanup already owns database disposal; defaults to true. */
  disposeDatabaseOnSignal?: boolean;

  /** Exit 0 clean, 1 failed, 2 timed out after a signal. False leaves ownership to the host. */
  exitOnSignal?: boolean;

  /** Install SIGINT/SIGTERM or SIGBREAK handlers. Defaults to `true`. */
  handleSignals?: boolean;

  /**
   * Opt-in TLS material. When present, the listener serves HTTPS and negotiates
   * HTTP/2 via ALPN. When absent, the listener falls back to the
   * `NETSCRIPT_TLS_CERT_FILE` / `NETSCRIPT_TLS_KEY_FILE` env pair (both must be
   * set) before defaulting to plain HTTP/1.1.
   */
  tls?: ServiceTlsOptions;
}

/** Result returned by oRPC-compatible fetch handlers. */
export type FetchHandlerResult =
  | {
    /** Whether the handler matched the request path. */
    matched: true;

    /** Response generated by the handler. */
    response: Response;
  }
  | {
    /** Whether the handler matched the request path. */
    matched: false;

    /** Response generated by the handler. */
    response: undefined;
  };

/** Structural fetch handler used by RPC and OpenAPI service adapters. */
export interface FetchHandler {
  /** Handles a request with path prefix and service context options. */
  handle(
    request: Request,
    options: { prefix: `/${string}`; context?: object },
  ): Promise<FetchHandlerResult>;
}

/** Structural oRPC plugin accepted by service handler factories. */
export interface ServiceHandlerPlugin {
  /** Stable plugin name used by oRPC v2 `OrderablePlugin` ordering (`before`/`after`). */
  readonly name?: string;

  /** Plugin ordering weight used by oRPC. */
  readonly order?: number;

  /** Initializes the plugin against the standard oRPC handler runtime. */
  init?(options: unknown, router: unknown): unknown;

  /** Initializes fetch-adapter behavior when the plugin needs adapter state. */
  initRuntimeAdapter?(options: unknown): unknown;
}

/** Minimal request shape exposed to service middleware and handlers. */
export interface ServiceRequest {
  /** Raw Web Platform request. */
  raw: Request;

  /** Matched request path. */
  path: string;

  /** Reads a request header by name. */
  header(name: string): string | undefined;
}

/** Hono request context exposed to service middleware and handlers. */
export type ServiceContext = Context;

/** Middleware function accepted by the service builder. */
export type ServiceMiddleware = MiddlewareHandler;

/** Service route handler accepted by the builder route API. */
export type ServiceHandler = Handler;

/** HTTP method accepted by the service builder's raw `route()` API. `'all'` matches every method (used for transparent proxies / catch-all passthrough). */
export type ServiceRouteMethod = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'all';

/** Not-found handler used by service applications. */
export type ServiceNotFoundHandler = NotFoundHandler;

/** Error handler used by service applications. */
export type ServiceErrorHandler = ErrorHandler;

/**
 * CORS options supported by `withCors()`.
 *
 * `origin` accepts an exact origin, an allowlist array, or an upstream resolver.
 * When omitted, `NETSCRIPT_CORS_ORIGINS` supplies a comma-separated allowlist;
 * an unset or blank value denies cross-origin access. Only an explicit
 * `origin: '*'` opts into wildcard access, and it cannot enable credentials.
 *
 * @example
 * ```ts
 * import type { CorsOptions } from '@netscript/service';
 * const cors: CorsOptions = { origin: ['https://app.example'] };
 * ```
 */
export type CorsOptions = Parameters<typeof cors>[0];

/** Database client capable of a health-check query. */
export interface Database {
  /** Executes a raw SQL template query. */
  $queryRaw(query: TemplateStringsArray): Promise<unknown>;
}

/** Database context injected into service handler context. */
export type DbContext = object;

/** Creates typed custom fields for a per-request service handler context. */
export type ContextFactory<TCustom extends object = Record<never, never>> = (
  context: Context,
) => TCustom;

/**
 * Context visible to service handlers after framework-owned fields are composed.
 *
 * @example
 * ```typescript
 * type HandlerContext = ServiceHandlerContext<{ readonly tenant: string }>;
 * ```
 */
export type ServiceHandlerContext<TCustom extends object = Record<never, never>> =
  & Readonly<TCustom>
  & {
    /** Database context configured by `withDatabase()`. */
    readonly db?: DbContext;
    /** Distributed trace headers propagated for the request. */
    readonly traceHeaders?: Readonly<Record<string, string>>;
    /** Authenticated identity, when authentication succeeds. */
    readonly principal?: Principal;
  }
  & ('requestId' extends keyof TCustom ? Record<never, never> : {
    /** Unified request identifier correlated across HTTP and oRPC logs. */
    readonly requestId?: string;
  });
