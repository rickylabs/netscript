/**
 * HTTP listener mechanics for the service builder.
 *
 * Owns the `Deno.serve` lifecycle: port resolution, abort-signal bridging, the
 * startup log banner, and the `stop()` teardown contract. Kept separate from the
 * builder class so the listener concern can evolve (e.g. TLS, clustering) without
 * touching the fluent API.
 *
 * Per-request cancellation note (Deno 2.9, denoland/deno#29111): the request
 * handler returns the app's response directly so per-request teardown happens on
 * the handler's return path, not via a side-effecting `request.signal` listener
 * installed here. The oRPC runtime still observes `request.signal` for genuine
 * client-disconnect cancellation; to avoid Deno's legacy abort-on-success
 * deprecation warning while preserving that cancellation, scaffolded services run
 * with `--unstable-no-legacy-abort` (see the generated service `deno.json`
 * tasks). The listener itself never depends on the signal firing on success.
 *
 * @module
 */

import { createServiceLogger } from '@netscript/logger';
import type {
  RunningService,
  RunningServiceAddress,
  ServeOptions,
  ServiceApp,
  ServiceTlsOptions,
  ShutdownHook,
  ShutdownReport,
} from '../types.ts';
import { ServiceShutdownCoordinator } from './service-shutdown.ts';

const POSIX_SHUTDOWN_SIGNALS = ['SIGINT', 'SIGTERM'] as const;
const WINDOWS_SHUTDOWN_SIGNALS = ['SIGINT', 'SIGBREAK'] as const;

/** Env var naming a PEM certificate file used when `ServeOptions.tls` is absent. */
const TLS_CERT_FILE_ENV = 'NETSCRIPT_TLS_CERT_FILE';

/** Env var naming a PEM private-key file used when `ServeOptions.tls` is absent. */
const TLS_KEY_FILE_ENV = 'NETSCRIPT_TLS_KEY_FILE';

/**
 * Resolves TLS material from the passed serve options, else from the
 * `NETSCRIPT_TLS_CERT_FILE` / `NETSCRIPT_TLS_KEY_FILE` env pair.
 *
 * The env fallback only activates when **both** variables are set, in which case
 * the referenced PEM files are read synchronously (services already hold
 * `--allow-read`/`--allow-env`). Returns `undefined` when no TLS is configured,
 * preserving the plain HTTP/1.1 default.
 *
 * @param options - Serve options that may carry inline `tls` material.
 * @returns Resolved cert/key PEM strings, or `undefined` for plain HTTP.
 */
export function resolveTlsConfig(options?: ServeOptions): ServiceTlsOptions | undefined {
  if (options?.tls) {
    return { cert: options.tls.cert, key: options.tls.key };
  }

  const certFile = Deno.env.get(TLS_CERT_FILE_ENV);
  const keyFile = Deno.env.get(TLS_KEY_FILE_ENV);
  if (certFile && keyFile) {
    return {
      cert: Deno.readTextFileSync(certFile),
      key: Deno.readTextFileSync(keyFile),
    };
  }

  return undefined;
}

type RegisteredSignal =
  | (typeof POSIX_SHUTDOWN_SIGNALS)[number]
  | (typeof WINDOWS_SHUTDOWN_SIGNALS)[number];

/**
 * Starts a `Deno.serve` listener for a built service app.
 *
 * @param app - The built service app (provides `fetch`).
 * @param serviceName - Service name used for the startup log banner.
 * @param defaultPort - Port to use when `options.port` is absent.
 * @param options - Serve options (port, external abort signal).
 * @returns The running service handle with address and `stop()`.
 */
export function startServiceListener(
  app: ServiceApp,
  serviceName: string,
  defaultPort: number,
  options?: ServeOptions,
  shutdownHooks: readonly ShutdownHook[] = [],
): RunningService {
  const serviceLogger = createServiceLogger(serviceName);
  const port = options?.port ?? defaultPort;
  const tls = resolveTlsConfig(options);
  const scheme = tls ? 'https' : 'http';
  const controller = new AbortController();
  const registeredSignals: Array<{
    readonly signal: RegisteredSignal;
    readonly handler: () => void;
  }> = [];
  let removeExternalAbortListener: (() => void) | undefined;
  let listenersRemoved = false;
  let shutdownLogged = false;

  const onListen = ({ hostname, port }: Deno.NetAddr): void => {
    serviceLogger.info('Service listening', {
      service: serviceName,
      ...buildListenerBanner(scheme, { hostname, port }),
    });
  };
  const handler = (request: Request): Response | Promise<Response> => app.fetch(request);

  // Passing `cert`/`key` makes Deno serve HTTPS and auto-negotiate HTTP/2 via
  // ALPN; the plain-TCP branch keeps the unchanged HTTP/1.1 default.
  const server = tls
    ? Deno.serve({ port, onListen, cert: tls.cert, key: tls.key }, handler)
    : Deno.serve({ port, onListen }, handler);

  const removeListeners = (): void => {
    if (listenersRemoved) return;
    listenersRemoved = true;
    removeExternalAbortListener?.();
    for (const { signal, handler } of registeredSignals) {
      Deno.removeSignalListener(signal, handler);
    }
  };

  const coordinator = new ServiceShutdownCoordinator({
    controller,
    shutdownServer: async () => {
      await server.shutdown();
    },
    awaitServerFinished: async () => {
      await server.finished;
    },
    hooks: shutdownHooks,
    drainTimeoutMs: options?.drainTimeoutMs,
  });

  const stopWithReport = async (
    reason: 'manual' | 'signal',
    signal?: Deno.Signal,
  ): Promise<ShutdownReport> => {
    try {
      return await coordinator.runShutdown(reason, signal);
    } finally {
      removeListeners();
    }
  };

  const stopAndLog = async (reason: 'manual' | 'signal', signal?: Deno.Signal): Promise<void> => {
    const report = await stopWithReport(reason, signal);
    if (shutdownLogged) return;
    shutdownLogged = true;
    logShutdownReport(serviceLogger, serviceName, report);
  };

  if (options?.signal?.aborted) {
    queueMicrotask(() => {
      void stopAndLog('manual').catch((error: unknown) => {
        serviceLogger.error('Service shutdown failed', { service: serviceName, error });
      });
    });
  } else if (options?.signal) {
    const abortListener = (): void => {
      void stopAndLog('manual').catch((error: unknown) => {
        serviceLogger.error('Service shutdown failed', { service: serviceName, error });
      });
    };
    options.signal.addEventListener('abort', abortListener, { once: true });
    removeExternalAbortListener = () => {
      options.signal?.removeEventListener('abort', abortListener);
    };
  }

  if (options?.handleSignals !== false) {
    for (const signal of shutdownSignalsForCurrentPlatform()) {
      const handler = (): void => {
        void stopAndLog('signal', signal).catch((error: unknown) => {
          serviceLogger.error('Service shutdown failed', {
            service: serviceName,
            signal,
            error,
          });
        });
      };
      Deno.addSignalListener(signal, handler);
      registeredSignals.push({ signal, handler });
    }
  }

  return {
    app,
    addr: toRunningServiceAddress(server.addr),
    stop: async () => {
      await stopAndLog('manual');
    },
  };
}

/** URL scheme used in the startup banner and endpoint links. */
export type ListenerScheme = 'http' | 'https';

/**
 * Builds the startup-banner endpoint URLs for a listening address.
 *
 * The scheme is `https` whenever TLS is active (see {@link resolveTlsConfig}) and
 * `http` otherwise, so the logged docs/openapi/health links always match the
 * transport the listener actually speaks.
 *
 * @param scheme - `https` when the listener serves TLS, else `http`.
 * @param addr - Listening hostname and port.
 * @returns Origin plus the docs, openapi, and health endpoint URLs.
 */
export function buildListenerBanner(
  scheme: ListenerScheme,
  addr: Pick<Deno.NetAddr, 'hostname' | 'port'>,
): {
  readonly origin: string;
  readonly docs: string;
  readonly openapi: string;
  readonly health: string;
} {
  const origin = `${scheme}://${addr.hostname}:${addr.port}`;
  return {
    origin,
    docs: `${origin}/api/docs`,
    openapi: `${origin}/api/openapi.json`,
    health: `${origin}/health`,
  };
}

function toRunningServiceAddress(addr: Deno.NetAddr): RunningServiceAddress {
  return {
    hostname: addr.hostname,
    port: addr.port,
    transport: addr.transport === 'tcp' ? 'tcp' : 'unix',
  };
}

/** Returns the OS signals this listener can register on the current platform. */
export function shutdownSignalsForCurrentPlatform(): readonly RegisteredSignal[] {
  return Deno.build.os === 'windows' ? WINDOWS_SHUTDOWN_SIGNALS : POSIX_SHUTDOWN_SIGNALS;
}

function logShutdownReport(
  serviceLogger: ReturnType<typeof createServiceLogger>,
  serviceName: string,
  report: ShutdownReport,
): void {
  const failedHooks = report.hooks.filter((hook) => !hook.ok);
  const payload = {
    service: serviceName,
    reason: report.reason,
    timedOut: report.timedOut,
    hookCount: report.hooks.length,
    failedHookCount: failedHooks.length,
    hookErrors: failedHooks.map((hook) => hook.error ?? 'unknown shutdown hook failure'),
  };

  if (report.timedOut || failedHooks.length > 0) {
    serviceLogger.warn('Service shutdown completed with issues', payload);
    return;
  }

  serviceLogger.info('Service shutdown completed', payload);
}
