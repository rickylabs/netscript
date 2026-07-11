import { assert, assertEquals } from '@std/assert';
import { computeBackoff, parseDoneContract, remainingBudgetDelay } from './run-codex-slice-lib.ts';

Deno.test('done contract accepts only the final exact marker', () => {
  assertEquals(parseDoneContract('work complete\nDONE\n'), { state: 'done' });
  assertEquals(parseDoneContract('DONE\nstill working'), { state: 'running' });
});

Deno.test('done contract requires a blocked reason', () => {
  assertEquals(parseDoneContract('BLOCKED: missing authority'), {
    state: 'blocked',
    reason: 'missing authority',
  });
  assertEquals(parseDoneContract('BLOCKED:'), { state: 'running' });
});

Deno.test('backoff uses reset time then bounded exponential schedule', () => {
  const now = Date.parse('2026-07-11T10:00:00.000Z');
  assertEquals(
    computeBackoff({ kind: 'quota_exhausted', resetAt: '2026-07-11T10:02:00.000Z' }, 0, now),
    120_000,
  );
  assertEquals(computeBackoff({ kind: 'model_capacity' }, 0, now, 100, 350), 100);
  assertEquals(computeBackoff({ kind: 'model_capacity' }, 3, now, 100, 350), 350);
  assertEquals(computeBackoff({ kind: 'other', raw: 'boom' }, 0, now), null);
});

Deno.test('wall-clock clamp never crosses or underflows the budget', () => {
  assertEquals(remainingBudgetDelay(500, 800, 1_000), 200);
  assertEquals(remainingBudgetDelay(500, 1_000, 1_000), 0);
  assert(remainingBudgetDelay(50, 0, 1_000) === 50);
});
