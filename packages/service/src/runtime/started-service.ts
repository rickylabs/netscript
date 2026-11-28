/**
 * Non-listening service lifecycle handle (`ServiceBuilder.start()` -> `StartedService`).
 *
 * Captures a clean composition-root async snapshot (`captureCleanAsyncRootOrThrow()`),
 * executes `onStartup` hooks, tracks in-flight HTTP/procedure/streaming calls,
 * and coordinates graceful `stop()` draining with reverse-order `onShutdown` hooks
 * and database disposal.
 *
 * @module
 */

import { ORPCError } from '@orpc/server';
import { createServiceLogger, ensureLogging } from '@netscript/logger';
import {
  disconnectServiceDatabases,
  type ServiceDatabaseResource,
} from '../builder/service-resources.ts';
import { DEFAULT_DRAIN_TIMEOUT_MS } from '../builder/service-shutdown.ts';
import type {
  ServiceApp,
  ServiceEnvironment,
  ServiceRouter,
  ShutdownHook,
  StartedService,
  StartOptions,
} from '../types.ts';
import {
  captureCleanAsyncRootOrThrow,
  type CleanAsyncRootRunner,
} from './async-context-isolation.ts';

/**
 * Private environment symbol stamped onto HTTP requests already admitted by
 * `StartedService.app` so nested procedure-pipeline tracking hands off
 * in-flight slots cleanly without rejecting an already-admitted request during draining.
 */
export const ADMITTED_HTTP_CALL_SYMBOL: unique symbol = Symbol(
  'netscript.service.admitted-http-call',
);

/**
 * Package-internal in-flight lifecycle tracker shared by `StartedService` and
 * the oRPC procedure pipeline.
 */
export interface ServiceLifecycleTracker {
  /** Clean composition-root runner captured during `start()`. */
  readonly cleanAsyncRoot: CleanAsyncRootRunner;
  /** Aborted as soon as `stop()` begins draining. */
  readonly shutdownSignal: AbortSignal;
  /**
   * Registers one in-flight call or stream and returns an idempotent release
   * callback. Throws `ORPCError('SERVICE_UNAVAILABLE', { status: 503 })` once
   * the service has begun stopping (unless `alreadyAdmitted` is `true` for a
   * nested handoff from an already-admitted HTTP request while draining).
   */
  enterCall(alreadyAdmitted?: boolean): () => void;
  /** Current number of active in-flight calls and streams (for diagnostics/tests). */
  readonly inFlightCount: () => number;
  /** Reports whether the service is accepting new calls. */
  readonly isRunning: () => boolean;
}

/** Package-internal handles associated with a started non-listening service. */
export interface StartedServiceInternals {
  /** Unique service instance symbol. */
  readonly serviceId: symbol;
  /** Service name. */
  readonly serviceName: string;
  /** Canonical wrapped router bound to this started service's pipeline and tracker. */
  readonly wrappedRouter: ServiceRouter;
  /** In-flight tracker and clean async-root runner. */
  readonly tracker: ServiceLifecycleTracker;
}

const STARTED_SERVICE_INTERNALS = new WeakMap<StartedService, StartedServiceInternals>();

/** Retrieves package-internal handles for a {@link StartedService}. */
export function getStartedServiceInternals(
  started: StartedService,
): StartedServiceInternals | undefined {
  return STARTED_SERVICE_INTERNALS.get(started);
}

/** Inputs required by {@link startServiceLifecycle}. */
export interface StartServiceLifecycleParams {
  readonly serviceId: symbol;
  readonly serviceName: string;
  readonly startupHooks: readonly (() => Promise<void>)[];
  readonly shutdownHooks: readonly ShutdownHook[];
  readonly databaseResources: Set<ServiceDatabaseResource>;
  readonly buildWithLifecycle: (tracker: ServiceLifecycleTracker) => {
    readonly app: ServiceApp;
    readonly wrappedRouter: ServiceRouter;
  };
  readonly options?: StartOptions;
}

/**
 * Starts a non-listening NetScript service lifecycle handle:
 * 1. Verifies composition-root cleanliness (`captureCleanAsyncRootOrThrow()`).
 * 2. Initializes logging and runs `onStartup` hooks in registration order.
 * 3. Builds the app with in-flight call & stream tracking.
 * 4. Returns a {@link StartedService} whose idempotent `stop()` refuses new calls,
 *    drains in-flight work within `drainTimeoutMs`, runs `onShutdown` hooks in
 *    reverse order, and disposes registered databases.
 */
export async function startServiceLifecycle(
  params: StartServiceLifecycleParams,
): Promise<StartedService> {
  const cleanAsyncRoot = captureCleanAsyncRootOrThrow();
  await ensureLogging();

  for (const hook of params.startupHooks) {
    await hook();
  }

  const serviceLogger = createServiceLogger(params.serviceName);
  const shutdownController = new AbortController();
  const drainTimeoutMs = normalizeDrainTimeout(params.options?.drainTimeoutMs);
  const disposeDatabases = params.options?.disposeDatabases !== false;
  const shutdownHooks = [...params.shutdownHooks];

  let state: 'running' | 'stopping' | 'stopped' = 'running';
  let inFlight = 0;
  let drainWaiter: PromiseWithResolvers<void> | undefined;
  let stopPromise: Promise<void> | undefined;
  let removeSignalListener: (() => void) | undefined;

  const tracker: ServiceLifecycleTracker = Object.freeze({
    cleanAsyncRoot,
    shutdownSignal: shutdownController.signal,
    inFlightCount: () => inFlight,
    isRunning: () => state === 'running',
    enterCall(alreadyAdmitted = false): () => void {
      if (state === 'stopped' || (state === 'stopping' && !alreadyAdmitted)) {
        throw new ORPCError('SERVICE_UNAVAILABLE', {
          status: 503,
          message: `Service "${params.serviceName}" is ${state} and no longer accepting calls`,
          data: { reason: 'service_stopping' },
        });
      }
      inFlight += 1;
      let released = false;
      return () => {
        if (released) return;
        released = true;
        inFlight = Math.max(0, inFlight - 1);
        if (inFlight === 0 && drainWaiter) {
          drainWaiter.resolve();
          drainWaiter = undefined;
        }
      };
    },
  });

  const { app: innerApp, wrappedRouter } = params.buildWithLifecycle(tracker);

  const attachAdmittedEnv = (env?: ServiceEnvironment): ServiceEnvironment => {
    const merged: ServiceEnvironment & { [ADMITTED_HTTP_CALL_SYMBOL]?: symbol } = env
      ? { ...env, shutdownSignal: env.shutdownSignal ?? shutdownController.signal }
      : { shutdownSignal: shutdownController.signal };
    merged[ADMITTED_HTTP_CALL_SYMBOL] = params.serviceId;
    return merged;
  };

  const guardedApp: ServiceApp = {
    async fetch(request: Request, env?: ServiceEnvironment): Promise<Response> {
      if (state !== 'running') {
        return serviceStoppingResponse(params.serviceName);
      }
      const leave = tracker.enterCall();
      try {
        return await innerApp.fetch(request, attachAdmittedEnv(env));
      } finally {
        leave();
      }
    },
    async request(
      input: Request | string | URL,
      init?: RequestInit,
      env?: ServiceEnvironment,
    ): Promise<Response> {
      if (state !== 'running') {
        return serviceStoppingResponse(params.serviceName);
      }
      const leave = tracker.enterCall();
      try {
        return await innerApp.request(input, init, attachAdmittedEnv(env));
      } finally {
        leave();
      }
    },
  };

  const runStop = async (): Promise<void> => {
    state = 'stopping';
    removeSignalListener?.();
    removeSignalListener = undefined;

    if (!shutdownController.signal.aborted) {
      shutdownController.abort('manual');
    }

    const startedAt = performance.now();
    let timedOut = false;

    // 1. Drain in-flight calls and streaming iterators within drainTimeoutMs.
    if (inFlight > 0) {
      drainWaiter ??= Promise.withResolvers<void>();
      const drainOutcome = await waitWithTimeout(
        drainWaiter.promise,
        remainingMs(startedAt, drainTimeoutMs),
      );
      if (drainOutcome === 'timed-out') {
        timedOut = true;
        drainWaiter = undefined;
      }
    }

    // 2. Run onShutdown hooks in reverse registration order.
    const hookErrors: string[] = [];
    for (let index = shutdownHooks.length - 1; index >= 0; index -= 1) {
      const hook = shutdownHooks[index];
      const budget = remainingMs(startedAt, drainTimeoutMs);
      if (budget <= 0) {
        timedOut = true;
        hookErrors.push('shutdown hook timed out');
        break;
      }
      const outcome = await waitWithTimeout(
        Promise.resolve().then(() => hook({ reason: 'manual' })),
        budget,
      );
      if (outcome === 'timed-out') {
        timedOut = true;
        hookErrors.push('shutdown hook timed out');
        break;
      }
      if (outcome.status === 'failed') {
        hookErrors.push(normalizeErrorMessage(outcome.error));
      }
    }

    // 3. Dispose registered databases independently of drain/hook failures.
    if (disposeDatabases && params.databaseResources.size > 0) {
      try {
        await disconnectServiceDatabases(params.databaseResources);
      } catch (error) {
        hookErrors.push(normalizeErrorMessage(error));
      }
    }

    state = 'stopped';
    const payload = {
      service: params.serviceName,
      reason: 'manual' as const,
      timedOut,
      hookCount: shutdownHooks.length,
      failedHookCount: hookErrors.length,
      hookErrors,
    };
    if (timedOut || hookErrors.length > 0) {
      serviceLogger.warn('Started service shutdown completed with issues', payload);
    } else {
      serviceLogger.info('Started service shutdown completed', payload);
    }
  };

  const stop = (): Promise<void> => {
    stopPromise ??= runStop();
    return stopPromise;
  };

  const externalSignal = params.options?.signal;
  if (externalSignal) {
    if (externalSignal.aborted) {
      queueMicrotask(() => {
        void stop();
      });
    } else {
      const onAbort = (): void => {
        void stop();
      };
      externalSignal.addEventListener('abort', onAbort, { once: true });
      removeSignalListener = () => {
        externalSignal.removeEventListener('abort', onAbort);
      };
    }
  }

  const started: StartedService = Object.freeze({
    app: guardedApp,
    name: params.serviceName,
    stop,
  });

  STARTED_SERVICE_INTERNALS.set(started, {
    serviceId: params.serviceId,
    serviceName: params.serviceName,
    wrappedRouter,
    tracker,
  });

  return started;
}

function serviceStoppingResponse(serviceName: string): Response {
  return new Response(
    JSON.stringify({
      error: 'SERVICE_UNAVAILABLE',
      message: `Service "${serviceName}" is stopping or stopped`,
    }),
    {
      status: 503,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    },
  );
}

function normalizeDrainTimeout(value: number | undefined): number {
  if (value === undefined) return DEFAULT_DRAIN_TIMEOUT_MS;
  if (!Number.isFinite(value) || value < 0) return DEFAULT_DRAIN_TIMEOUT_MS;
  return value;
}

function remainingMs(startedAt: number, timeoutMs: number): number {
  return Math.max(0, timeoutMs - (performance.now() - startedAt));
}

async function waitWithTimeout(
  promise: Promise<unknown>,
  timeoutMs: number,
): Promise<
  'timed-out' | { readonly status: 'completed' } | {
    readonly status: 'failed';
    readonly error: unknown;
  }
> {
  if (timeoutMs <= 0) return 'timed-out';
  let timerId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise.then(
        () => ({ status: 'completed' as const }),
        (error: unknown) => ({ status: 'failed' as const, error }),
      ),
      new Promise<'timed-out'>((resolve) => {
        timerId = setTimeout(() => resolve('timed-out'), timeoutMs);
      }),
    ]);
  } finally {
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }
  }
}

function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return String(error);
}
