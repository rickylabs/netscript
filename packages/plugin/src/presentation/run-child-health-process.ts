import type { ChildHealthSnapshot } from '../domain/child-health.ts';
import { PluginError } from '../domain/errors.ts';
import { ChildHealthMonitor } from '../runtime/child-health-monitor.ts';
import { childHealthResponse } from './child-health-response.ts';
import { FileChildRestartHistory } from '../adapters/file-child-restart-history.ts';

/**
 * Process health composition, including optional single-owner restart history.
 *
 * @example
 * ```ts
 * import type { ChildHealthProcessOptions } from '@netscript/plugin/health';
 * const options: ChildHealthProcessOptions = {
 *   restartHistoryPath: '.data/child-health/custom.json',
 * };
 * ```
 */
export type ChildHealthProcessOptions = Readonly<{
  /** Use the runtime's monitor for both process failure and extended snapshot diagnostics. */
  health?: ChildHealthMonitor;
  /** Bind address; defaults to loopback. Pass '0.0.0.0' for container ingress. */
  hostname?: string;
  /** Total shutdown budget, including cleanup; defaults to 35_000 ms (30 s work + 5 s cleanup). */
  drainTimeoutMs?: number;
  /** Reserved portion of the total budget; defaults to min(5_000, drainTimeoutMs / 5). */
  cleanupTimeoutMs?: number;
  /** Owned resource cleanups, invoked after drain, including when drain times out. */
  onShutdown?: readonly (() => void | Promise<void>)[];
  /** Explicitly exit 0 clean, 1 failed or 2 timed out; defaults to true. False supports embedding. */
  exitOnShutdown?: boolean;
  /** Persistent file owned by exactly one background resource; relative to its working directory. */
  restartHistoryPath?: string;
}>;

/**
 * Start health before bootstrap and expose failure for one second before exiting.
 *
 * Signal handlers and the health listener are owned by this process, independent
 * of a frontend session. Fatal causes remain in server logs, never in the payload,
 * and set the process exit code to one. The child must drain when its signal is aborted.
 * Work drains before owned cleanups within the total budget. With exitOnShutdown false,
 * failures reject with PluginError instead of terminating the embedding process.
 *
 * @example
 * ```ts
 * import { runChildHealthProcess } from '@netscript/plugin/health';
 * if (import.meta.main) {
 *   await runChildHealthProcess(async (health, signal) => {
 *     health.registryLoaded(); health.dependenciesReady(); health.running();
 *     await new Promise<void>((resolve) => signal.addEventListener('abort', () => resolve()));
 *   });
 * }
 * ```
 */
export async function runChildHealthProcess(
  run: (health: ChildHealthMonitor, signal: AbortSignal) => Promise<void>,
  snapshot?: () => ChildHealthSnapshot | undefined | Promise<ChildHealthSnapshot | undefined>,
  options: ChildHealthProcessOptions = {},
): Promise<void> {
  const totalMs = shutdownMilliseconds(options.drainTimeoutMs, 35_000);
  const cleanupMs = Math.min(
    totalMs,
    shutdownMilliseconds(options.cleanupTimeoutMs, Math.min(5_000, totalMs / 5)),
  );
  const port = Number(Deno.env.get('PORT') ?? '0');
  if (!Number.isSafeInteger(port) || port < 0 || port > 65_535) {
    throw new Error('Invalid background child health port.');
  }
  const health = options.health ?? new ChildHealthMonitor();
  const controller = new AbortController();
  const healthReads = new AbortController();
  let latest: ChildHealthSnapshot | undefined;
  let terminal: ChildHealthSnapshot | undefined;
  let shutdownStarted: number | undefined;
  let failureTimer: ReturnType<typeof setTimeout> | undefined;
  const server = Deno.serve(
    { port, hostname: options.hostname ?? '127.0.0.1' },
    async (request) => {
      if (terminal) return childHealthResponse(request, terminal);
      const interrupted = Promise.withResolvers<undefined>();
      const onStop = (): void => interrupted.resolve(undefined);
      healthReads.signal.addEventListener('abort', onStop, { once: true });
      if (healthReads.signal.aborted) onStop();
      try {
        const current = await Promise.race([snapshot?.(), interrupted.promise]);
        if (current) latest = current;
        return childHealthResponse(request, terminal ?? current ?? health.snapshot());
      } catch (cause) {
        failed(cause);
        return childHealthResponse(request, terminal ?? health.snapshot());
      } finally {
        healthReads.signal.removeEventListener('abort', onStop);
      }
    },
  );
  const signals: readonly Deno.Signal[] = Deno.build.os === 'windows'
    ? ['SIGINT', 'SIGBREAK']
    : ['SIGINT', 'SIGTERM'];
  const stop = (): void => {
    shutdownStarted ??= performance.now();
    controller.abort();
    healthReads.abort();
  };
  for (const signal of signals) Deno.addSignalListener(signal, stop);
  const failed = (cause: unknown): void => {
    if (terminal) return;
    console.error('Background child failed:', cause);
    Deno.exitCode = 1;
    try {
      health.failed();
    } catch {
      // Persistence failure is latched unhealthy; fatal shutdown must still complete.
    }
    const retainFailure = (child: ChildHealthSnapshot | undefined): void => {
      terminal = Object.freeze({
        ...(child ?? health.snapshot()),
        state: child?.state === 'crash-looping' || health.snapshot().state === 'crash-looping'
          ? 'crash-looping'
          : 'failed',
        dependencyReady: false,
        lastFatalError: child?.lastFatalError ?? health.snapshot().lastFatalError,
      });
    };
    retainFailure(latest);
    healthReads.abort();
    failureTimer = setTimeout(stop, 1_000);
    try {
      // A fresh snapshot may enrich diagnostics, but IO never gates fatal shutdown.
      void Promise.resolve(snapshot?.()).then((child) => {
        if (child) retainFailure(child);
      }, () => undefined);
    } catch {
      // A failed health dependency must not hide the original process failure.
    }
  };
  const completion = Promise.resolve().then(() => {
    if (options.restartHistoryPath !== undefined) {
      health.trackProcess(new FileChildRestartHistory(options.restartHistoryPath), Deno.pid);
    }
    return run(health, controller.signal);
  }).then(
    () => {
      if (!controller.signal.aborted) {
        failed(new Error('Background child stopped before process shutdown.'));
      }
    },
    failed,
  );
  await new Promise<void>((resolve) => {
    if (controller.signal.aborted) resolve();
    else controller.signal.addEventListener('abort', () => resolve(), { once: true });
  });
  const deadline = (shutdownStarted ?? performance.now()) + totalMs;
  let timedOut = false;
  let cleanupFailed = false;
  try {
    timedOut = !await withinShutdownDeadline(completion, deadline - cleanupMs);
    if (!terminal && !timedOut) health.stopped();
  } catch (cause) {
    cleanupFailed = true;
    console.error('Background child drain failed:', cause);
  } finally {
    clearTimeout(failureTimer);
    for (const signal of signals) Deno.removeSignalListener(signal, stop);
    // Start every cleanup, even if another cleanup hangs or the work budget expired.
    const cleanups = [...(options.onShutdown ?? [])].reverse();
    cleanups.push(() => server.shutdown());
    const cleanup = Promise.all(cleanups.map(async (close) => {
      try {
        await close();
      } catch (cause) {
        cleanupFailed = true;
        console.error('Background child cleanup failed:', cause);
      }
    })).then(() => undefined);
    timedOut = !await withinShutdownDeadline(cleanup, deadline) || timedOut;
  }
  const exitCode = timedOut ? 2 : terminal || cleanupFailed ? 1 : 0;
  if (options.exitOnShutdown !== false) Deno.exit(exitCode);
  if (terminal || cleanupFailed || timedOut) {
    throw new PluginError(
      timedOut
        ? 'Background child shutdown timed out.'
        : 'Background child failed (details redacted).',
    );
  }
}

function shutdownMilliseconds(value: number | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  if (!Number.isFinite(value) || value < 0) throw new RangeError('Invalid child shutdown budget.');
  return value;
}

async function withinShutdownDeadline(
  operation: Promise<void>,
  deadline: number,
): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation.then(() => true),
      new Promise<boolean>((resolve) => {
        timer = setTimeout(() => resolve(false), Math.max(0, deadline - performance.now()));
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
