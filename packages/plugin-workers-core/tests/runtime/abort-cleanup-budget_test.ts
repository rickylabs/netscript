import { assertEquals } from '@std/assert';
import { InProcessJobRunner, type JobDefinition } from '../../src/runtime/mod.ts';
import { WorkersConfigSchema } from '../../src/config/mod.ts';

Deno.test('workers configuration retains the drain and abort cleanup budgets', () => {
  const config = WorkersConfigSchema.parse({ drainTimeoutMs: 8_000, abortGracePeriodMs: 2_500 });
  assertEquals(config && Reflect.get(config, 'drainTimeoutMs'), 8_000);
  assertEquals(config && Reflect.get(config, 'abortGracePeriodMs'), 2_500);
});

Deno.test('default runner awaits cleanup lasting more than one second after abort', async () => {
  const entered = Promise.withResolvers<void>();
  const cleaned = Promise.withResolvers<void>();
  let cleanupFinished = false;
  const job: JobDefinition = {
    id: 'slow-abort-cleanup',
    handler: async ({ signal }) => {
      entered.resolve();
      await new Promise<void>((resolve) => {
        signal.addEventListener('abort', () => resolve(), { once: true });
      });
      await new Promise<void>((resolve) => setTimeout(resolve, 1_250));
      cleanupFinished = true;
      cleaned.resolve();
      return { success: true };
    },
  };
  const runner = new InProcessJobRunner();
  const controller = new AbortController();
  const result = runner.dispatch(job, { id: job.id, job, payload: {}, signal: controller.signal })
    .catch((error: unknown) => error);
  try {
    await entered.promise;
    controller.abort(new DOMException('Controlled shutdown.', 'ShutdownError'));
    await result;
    assertEquals(cleanupFinished, true, 'Dispatch settled before the handler completed cleanup.');
  } finally {
    await cleaned.promise;
    await runner.stop();
  }
});
