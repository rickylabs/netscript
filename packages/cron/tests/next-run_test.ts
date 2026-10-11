import { assert, assertEquals } from '@std/assert';
import { stub } from 'jsr:@std/testing@1/mock';
import { FakeTime } from 'jsr:@std/testing@1/time';
import { DenoCronAdapter } from '../adapters/deno.adapter.ts';
import { MemoryCronAdapter } from '../adapters/memory.adapter.ts';

const CASES = [
  ['0 */12 * * *', '2026-10-09T12:00:00.000Z'],
  ['0 */6 * * *', '2026-10-09T12:00:00.000Z'],
  ['30 */2 * * *', '2026-10-09T10:30:00.000Z'],
  ['0 0,12 * * *', '2026-10-09T12:00:00.000Z'],
  ['*/15 * * * *', '2026-10-09T10:30:00.000Z'],
  ['0 9 * * 1-5', '2026-10-12T09:00:00.000Z'],
  ['* * * * *', '2026-10-09T10:18:00.000Z'],
  ['20-40/10 10-14/2 * * *', '2026-10-09T10:20:00.000Z'],
  ['0 0 1 11 *', '2026-11-01T00:00:00.000Z'],
  ['0 0 12 * 1', '2026-10-12T00:00:00.000Z'],
  ['0 0 29 2 *', '2028-02-29T00:00:00.000Z'],
] as const;

for (const Adapter of [DenoCronAdapter, MemoryCronAdapter]) {
  Deno.test(`${Adapter.name} UTC nextRun matches cron calendar fields`, async () => {
    using _time = new FakeTime('2026-10-09T10:17:43.250Z');
    using _cron = stub(Deno, 'cron', () => Promise.resolve());
    const scheduler = new Adapter();
    try {
      for (const [expression, expected] of CASES) {
        const job = await scheduler.schedule(expression, expression, () => {}, { enabled: false });
        assert(job.nextRun, expression);
        assert(Number.isFinite(job.nextRun.getTime()), `${expression} returned Invalid Date`);
        assertEquals(job.nextRun.toISOString(), expected, expression);
      }
    } finally {
      await scheduler.stop();
    }
  });

  Deno.test(`${Adapter.name} UTC nextRun is strictly after the clock instant`, async () => {
    using _time = new FakeTime('2026-12-31T23:45:00Z');
    using _cron = stub(Deno, 'cron', () => Promise.resolve());
    const scheduler = new Adapter();
    try {
      const job = await scheduler.schedule('boundary', '*/15 * * * *', () => {}, {
        enabled: false,
      });
      assertEquals(job.nextRun?.toISOString(), '2027-01-01T00:00:00.000Z');
      await scheduler.trigger('boundary');
      assertEquals(scheduler.get('boundary')?.nextRun?.toISOString(), '2027-01-01T00:00:00.000Z');
    } finally {
      await scheduler.stop();
    }
  });
}

Deno.test('nextRun is independent of the host timezone in child processes', async () => {
  const path = new URL('./next-run_test.ts', import.meta.url).pathname;
  for (const timezone of ['UTC', 'America/New_York', 'Asia/Kolkata']) {
    const output = await new Deno.Command(Deno.execPath(), {
      args: ['test', '--allow-all', '--filter=UTC nextRun', path],
      env: { TZ: timezone },
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assertEquals(
      output.code,
      0,
      `${timezone}: ${new TextDecoder().decode(output.stdout)}\n${
        new TextDecoder().decode(output.stderr)
      }`,
    );
  }
});
