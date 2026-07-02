/**
 * Public structural contracts for NetScript service builders and handlers.
 *
 * @module
 */

import type { Context, ErrorHandler, Handler, MiddlewareHandler, NotFoundHandler } from 'hono';
import type { cors } from 'hono/cors';

/** Router definition accepted by the service builder and handler factories. */
export type ServiceRouter = Record<string, unknown>;

/** Minimal mountable service application returned by `build()`. */
export interface ServiceApp {
  /** Handles a Web Platform request without starting a listener. */
  fetch(request: Request): Response | Promise<Response>;

  /** Executes an in-memory request against the service app. */
  request(input: Request | string | URL, init?: RequestInit): Response | Promise<Response>;
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
 * const running = await createService(router, { name: 'users' })
 *   .withHealth()
 *   .serve({
 *     port: 3000,
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

  /** External signal that stops the listener when aborted. */
  signal?: AbortSignal;

  /** Max time to wait for in-flight requests and shutdown hooks. Defaults to `30_000`. */
  drainTimeoutMs?: number;

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
    options: { prefix: `/${string}`; context?: Record<string, unknown> },
  ): Promise<FetchHandlerResult>;
}

/** Structural oRPC plugin accepted by service handler factories. */
export interface ServiceHandlerPlugin {
  /** Plugin ordering weight used by oRPC. */
  readonly order?: number;

  /** Initializes the plugin against the standard oRPC handler runtime. */
  init?(options: unknown, router: unknown): void;

  /** Initializes fetch-adapter behavior when the plugin needs adapter state. */
  initRuntimeAdapter?(options: unknown): void;
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

/** CORS options supported by `withCors()`. */
export type CorsOptions = Parameters<typeof cors>[0];

/** Database client capable of a health-check query. */
export interface Database {
  /** Executes a raw SQL template query. */
  $queryRaw(query: TemplateStringsArray): Promise<unknown>;
}

/** Database context injected into service handler context. */
export type DbContext = object;

/** Creates per-request service handler context. */
export type ContextFactory = (
  context: Context,
) => Record<string, unknown>;
