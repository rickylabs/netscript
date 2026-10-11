import { assertEquals, assertRejects } from '@std/assert';
import { FakeTime } from 'jsr:@std/testing@1/time';
import { stub } from 'jsr:@std/testing@1/mock';
import { DenoCronAdapter } from '../adapters/deno.adapter.ts';
import { CronPresets } from '../ports/types.ts';

Deno.test('Deno adapter registers translated presets and preserves NetScript metadata', async () => {
  const expressions: string[] = [];
  using cron = stub(Deno, 'cron', (_name, expression) => {
    expressions.push(String(expression));
    return Promise.resolve();
  });
  const scheduler = new DenoCronAdapter();
  try {
    for (
      const preset of [CronPresets.EVERY_WEEK, CronPresets.WEEKDAYS_9AM, CronPresets.WEEKENDS_NOON]
    ) {
      const job = await scheduler.schedule(preset, preset, () => {});
      assertEquals(job.schedule, preset);
      assertEquals(scheduler.get(preset)?.schedule, preset);
    }
    assertEquals(expressions, ['0 0 * * 1', '0 9 * * 2,3,4,5,6', '0 12 * * 1,7']);
    const calls = cron.calls.length;
    await assertRejects(
      () => scheduler.schedule('ambiguous', '0 0 * * 0/2', () => {}),
      Error,
      'day-of-week',
    );
    assertEquals(cron.calls.length, calls);
    assertEquals(scheduler.has('ambiguous'), false);
  } finally {
    await scheduler.stop();
  }
});

Deno.test('native Deno registration accepts EVERY_WEEK with translation and rejects old code', async () => {
  const adapter = new URL('../adapters/deno.adapter.ts', import.meta.url).href;
  const code = `
    import { DenoCronAdapter } from ${JSON.stringify(adapter)};
    const controller = new AbortController();
    let rejected = false;
    try {
      Deno.cron('old-weekly', '0 0 * * 0', { signal: controller.signal }, () => {});
    } catch (error) {
      rejected = error instanceof TypeError && error.message.includes('Invalid cron schedule');
    } finally { controller.abort(); }
    if (!rejected) throw new Error('Old code negative control did not reject Sunday zero');
    const scheduler = new DenoCronAdapter();
    try { await scheduler.schedule('weekly', '0 0 * * 0', () => {}); }
    finally { await scheduler.stop(); }
  `;
  const result = await new Deno.Command(Deno.execPath(), {
    args: ['eval', '--unstable-cron', code],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  assertEquals(result.code, 0, new TextDecoder().decode(result.stderr));
});

Deno.test('Deno adapter uses native OR preview and reports native OR after trigger', async () => {
  using time = new FakeTime('2026-10-11T10:17:43Z');
  using cron = stub(Deno, 'cron', () => Promise.resolve());
  const scheduler = new DenoCronAdapter();
  try {
    const job = await scheduler.schedule('either-day', '* * 1 * 0', () => {});
    assertEquals(job.nextRun?.toISOString(), '2026-10-11T10:18:00.000Z');
    await scheduler.trigger('either-day');
    assertEquals(job.nextRun?.toISOString(), '2026-10-11T10:18:00.000Z');
  } finally {
    await scheduler.stop();
  }
});
