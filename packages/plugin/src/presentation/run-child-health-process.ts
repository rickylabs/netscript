import type { ChildHealthSnapshot } from '../domain/child-health.ts';
import { ChildHealthMonitor } from '../runtime/child-health-monitor.ts';
import { childHealthResponse } from './child-health-response.ts';

/**
 * Start health before bootstrap and retain a red surface after a child fails.
 *
 * Signal handlers and the health listener are owned by this process, independent
 * of a frontend session. The child must drain when its signal is aborted.
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
  snapshot?: () => ChildHealthSnapshot | undefined,
): Promise<void> {
  const port = Number(Deno.env.get('PORT') ?? '0');
  if (!Number.isSafeInteger(port) || port < 0 || port > 65_535) {
    throw new Error('Invalid background child health port.');
  }
  const health = new ChildHealthMonitor();
  const controller = new AbortController();
  let terminal: ChildHealthSnapshot | undefined;
  const server = Deno.serve(
    { port },
    (request) => childHealthResponse(request, terminal ?? snapshot?.() ?? health.snapshot()),
  );
  const signals: readonly Deno.Signal[] = Deno.build.os === 'windows'
    ? ['SIGINT', 'SIGBREAK']
    : ['SIGINT', 'SIGTERM'];
  const stop = () => controller.abort();
  for (const signal of signals) Deno.addSignalListener(signal, stop);
  const failed = () => {
    const child = snapshot?.();
    health.failed();
    terminal = Object.freeze({
      ...(child ?? health.snapshot()),
      state: child?.state === 'crash-looping' ? 'crash-looping' : 'failed',
      dependencyReady: false,
      lastFatalError: child?.lastFatalError ?? health.snapshot().lastFatalError,
    });
  };
  const completion = Promise.resolve().then(() => run(health, controller.signal)).then(
    () => {
      if (!controller.signal.aborted) failed();
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
    for (const signal of signals) Deno.removeSignalListener(signal, stop);
    await server.shutdown();
  }
}
