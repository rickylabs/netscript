// Opt-in real-clock proof. Two boundary events give negative schedules a full
// observed minute before teardown; the timer is only a failure deadline.
import { assertEquals } from '@std/assert';
import { DenoCronAdapter } from '../../adapters/deno.adapter.ts';
import { calculateNextDenoRun } from '../../internal/next-run.ts';
import { CronPresets } from '../../ports/types.ts';

const boundary = new Date(Math.floor((Date.now() + 5_000) / 60_000) * 60_000 + 60_000);
const day = boundary.getUTCDate();
const weekday = boundary.getUTCDay();
const otherDay = day === 1 ? 2 : 1;
const otherWeekday = (weekday + 1) % 7;
const adapter = new DenoCronAdapter();
const control = new AbortController();
const fired = new Set<string>();
const executions: Record<string, string> = {};
let ticks = 0;
let finish!: () => void;
let fail!: (error: Error) => void;
const done = new Promise<void>((resolve, reject) => {
  finish = resolve;
  fail = reject;
});
const deadline = setTimeout(() => fail(new Error('Cron fire deadline exceeded')), 130_000);
const cases = [
  ['today', `* * * * ${weekday}`, true],
  ['tomorrow', `* * * * ${otherWeekday}`, false],
  ['both-match', `* * ${day} * ${weekday}`, true],
  ['only-weekday', `* * ${otherDay} * ${weekday}`, true],
  ['only-dom', `* * ${day} * ${otherWeekday}`, true],
  ['neither', `* * ${otherDay} * ${otherWeekday}`, false],
  ['wildcard-weekday-wrong-dom', `* * ${otherDay} * *`, false],
  ['full-range-dom', `* * 1-31 * ${otherWeekday}`, true],
  ['step-dom', `* * */1 * ${otherWeekday}`, true],
  ['full-weekday', `* * ${otherDay} * 0-6`, true],
] as const;
let boundaryCompletion: Promise<void> | undefined;
try {
  // Registration alone must work for the formerly invalid Sunday preset.
  await adapter.schedule('weekly', CronPresets.EVERY_WEEK, () => {}, { enabled: false });
  for (const [name, expression, shouldFire] of cases) {
    const expected = calculateNextDenoRun(expression, new Date(boundary.getTime() - 1));
    assertEquals(expected?.getTime() === boundary.getTime(), shouldFire, `${name} preview`);
    await adapter.schedule(name, expression, () => {
      const now = new Date();
      // Record only the first controlled boundary, including delayed callbacks.
      if (now.getTime() >= boundary.getTime() && now.getTime() < boundary.getTime() + 60_000) {
        fired.add(name);
        executions[name] = now.toISOString();
      }
    });
  }
  boundaryCompletion = Deno.cron('boundary', '* * * * *', { signal: control.signal }, () => {
    if (Date.now() >= boundary.getTime() && ++ticks === 2) finish();
  });
  await done;
  assertEquals(
    [...fired].sort(),
    cases.filter((entry) => entry[2]).map((entry) => entry[0]).sort(),
  );
  console.log(JSON.stringify({
    deno: Deno.version.deno,
    controlledBoundary: boundary.toISOString(),
    weekday,
    semantics: 'OR for restricted days; literal wildcards remove constraints',
    fired: [...fired].sort(),
    executions,
    ticks,
  }));
} finally {
  clearTimeout(deadline);
  control.abort();
  await adapter.stop();
  await boundaryCompletion;
}
