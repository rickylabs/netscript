import { delay } from '@std/async';
import { assert, assertEquals } from '@std/assert';
import type { JobContext } from '../ports/mod.ts';
import { MemoryCronAdapter } from '../testing/mod.ts';

Deno.test('MemoryCronAdapter stop aborts jobs and clears scheduler timers', async () => {
  const scheduler = new MemoryCronAdapter();
  scheduler.setTickInterval(5);

  let runs = 0;
  let signal: AbortSignal | undefined;

  await scheduler.schedule('fast-job', '0 0 1 1 *', (context: JobContext) => {
    signal = context.signal;
    runs++;
  });

  await scheduler.waitForExecutions('fast-job', 1, 1000);
  const runsBeforeStop = runs;

  await scheduler.stop();

  assertEquals(scheduler.isRunning, false);
  assertEquals(scheduler.list(), []);
  assert(signal?.aborted);

  await delay(25);

  assertEquals(runs, runsBeforeStop);
});
