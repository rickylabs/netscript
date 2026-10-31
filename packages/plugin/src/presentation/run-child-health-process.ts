import type { ChildHealthSnapshot } from '../domain/child-health.ts';
import { PluginError } from '../domain/errors.ts';
import { ChildHealthMonitor } from '../runtime/child-health-monitor.ts';
import { childHealthResponse } from './child-health-response.ts';

/**
 * Start health before bootstrap and expose failure for one second before exiting.
 *
 * Signal handlers and the health listener are owned by this process, independent
 * of a frontend session. Fatal causes remain in server logs, never in the payload,
 * and set the process exit code to one. The child must drain when its signal is aborted.
 * After the fatal grace period, rejects with PluginError for the executable's crash boundary.
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
): Promise<void> {
  const port = Number(Deno.env.get('PORT') ?? '0');
  if (!Number.isSafeInteger(port) || port < 0 || port > 65_535) {
    throw new Error('Invalid background child health port.');
  }
  const health = new ChildHealthMonitor();
  const controller = new AbortController();
  const healthReads = new AbortController();
  let latest: ChildHealthSnapshot | undefined;
  let terminal: ChildHealthSnapshot | undefined;
  let failureTimer: ReturnType<typeof setTimeout> | undefined;
  const server = Deno.serve(
    { port },
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
      } finally {
        healthReads.signal.removeEventListener('abort', onStop);
      }
    },
  );
  const signals: readonly Deno.Signal[] = Deno.build.os === 'windows'
    ? ['SIGINT', 'SIGBREAK']
    : ['SIGINT', 'SIGTERM'];
  const stop = (): void => {
    controller.abort();
    healthReads.abort();
  };
  for (const signal of signals) Deno.addSignalListener(signal, stop);
  const failed = (cause: unknown): void => {
    console.error('Background child failed:', cause);
    Deno.exitCode = 1;
    health.failed();
    const retainFailure = (child: ChildHealthSnapshot | undefined): void => {
      terminal = Object.freeze({
        ...(child ?? health.snapshot()),
        state: child?.state === 'crash-looping' ? 'crash-looping' : 'failed',
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
  const completion = Promise.resolve().then(() => run(health, controller.signal)).then(
    () => {
      if (!controller.signal.aborted) {
        failed(new Error('Background child stopped before process shutdown.'));
      }
    },
    failed,
  );
  try {
    await new Promise<void>((resolve) =>
      controller.signal.addEventListener('abort', () => resolve(), { once: true })
    );
    await completion;
    health.stopped();
  } finally {
    clearTimeout(failureTimer);
    for (const signal of signals) Deno.removeSignalListener(signal, stop);
    await server.shutdown();
  }
  // Bootstrap may leave dependency handles alive; a fatal process must still terminate.
  if (terminal) throw new PluginError('Background child failed (details redacted).');
}
