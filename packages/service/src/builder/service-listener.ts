/**
 * HTTP listener mechanics for the service builder.
 *
 * Owns the `Deno.serve` lifecycle: port resolution, abort-signal bridging, the
 * startup log banner, and the `stop()` teardown contract. Kept separate from the
 * builder class so the listener concern can evolve (e.g. TLS, clustering) without
 * touching the fluent API.
 *
 * @module
 */

import { createServiceLogger } from '@netscript/logger';
import type {
  RunningService,
  ServeOptions,
  ServiceApp,
  ShutdownHook,
  ShutdownReport,
} from '../types.ts';
import { ServiceShutdownCoordinator } from './service-shutdown.ts';

const POSIX_SHUTDOWN_SIGNALS = ['SIGINT', 'SIGTERM'] as const;
const WINDOWS_SHUTDOWN_SIGNALS = ['SIGINT', 'SIGBREAK'] as const;

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
  const controller = new AbortController();
  const registeredSignals: Array<{
    readonly signal: RegisteredSignal;
    readonly handler: () => void;
  }> = [];
  let removeExternalAbortListener: (() => void) | undefined;
  let listenersRemoved = false;
  let shutdownLogged = false;

  const server = Deno.serve(
    {
      port,
      onListen: ({ hostname, port }) => {
        const origin = `http://${hostname}:${port}`;
        serviceLogger.info('Service listening', {
          service: serviceName,
          origin,
          docs: `${origin}/api/docs`,
          openapi: `${origin}/api/openapi.json`,
          health: `${origin}/health`,
        });
      },
    },
    (request) => app.fetch(request),
  );

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
    addr: server.addr as RunningService['addr'],
    stop: async () => {
      await stopAndLog('manual');
    },
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
