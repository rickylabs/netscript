import { assertEquals } from '@std/assert';
import { FakeTime } from 'jsr:@std/testing/time';
import { MemoryCronAdapter } from '@netscript/cron/adapters';

Deno.test('MemoryCronAdapter deterministic execution with FakeTime', async () => {
  const time = new FakeTime();
  try {
    const scheduler = new MemoryCronAdapter();
    let executionCount = 0;

    // Schedule a job to run every 5 minutes
    await scheduler.schedule('test-job', '*/5 * * * *', () => {
      executionCount++;
    });

    assertEquals(executionCount, 0);

    // Advance clock by 5 minutes (300,000 ms)
    await time.tickAsync(300000);
    assertEquals(executionCount, 1);

    // Advance clock by another 10 minutes (600,000 ms)
    await time.tickAsync(600000);
    assertEquals(executionCount, 3);

    // Clean up
    await scheduler.stop();
  } finally {
    time.restore();
  }
});
