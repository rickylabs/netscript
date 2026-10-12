import { assertEquals } from '@std/assert';
import { calculateNextDenoRun, calculateNextRun } from './next-run.ts';

Deno.test('UTC next-run calculation rejects unsupported and impossible expressions safely', () => {
  const now = new Date('2026-10-09T10:17:43Z');
  for (
    const expression of [
      'invalid',
      '0 9 * * MON',
      '0 0 L * *',
      '*/0 * * * *',
      '60 * * * *',
      '0 24 * * *',
      '5-1 * * * *',
      '0 0 31 2 *',
      '0 0 * 13 *',
      '0 0 * * 7',
      '0/2 * * * *',
      '* * * * * *',
      '*/999999999999999999 * * * *',
    ]
  ) {
    assertEquals(calculateNextRun(expression, now), null, expression);
  }
  assertEquals(calculateNextRun('* * * * *', new Date(NaN)), null);
  assertEquals(calculateNextRun('* * * * *', new Date(8.64e15)), null);
});

Deno.test('UTC next-run calculation handles sparse leap-day and weekday conjunctions', () => {
  // Leap-day Monday next recurs in 2044, beyond common short search horizons.
  assertEquals(
    calculateNextRun('0 0 29 2 1', new Date('2026-10-09T10:17:43Z'))?.toISOString(),
    '2044-02-29T00:00:00.000Z',
  );
  assertEquals(
    calculateNextRun('0,30 8-12/2 10-20/5 10,11 *', new Date('2026-10-09T10:17:43Z'))
      ?.toISOString(),
    '2026-10-10T08:00:00.000Z',
  );
});

Deno.test('Deno UTC preview uses OR only when both day fields are restricted', () => {
  const now = new Date('2026-10-11T10:17:43Z'); // Sunday, the 11th.
  for (
    const [expression, expected] of [
      ['* * 11 * 0', '2026-10-11T10:18:00.000Z'],
      ['* * 1 * 0', '2026-10-11T10:18:00.000Z'],
      ['* * 11 * 1', '2026-10-11T10:18:00.000Z'],
      ['* * 1 * 1', '2026-10-12T00:00:00.000Z'],
      ['* * * * 1', '2026-10-12T00:00:00.000Z'],
      ['* * 1 * *', '2026-11-01T00:00:00.000Z'],
      ['* * 1-31 * 1', '2026-10-11T10:18:00.000Z'],
      ['* * */1 * 1', '2026-10-11T10:18:00.000Z'],
      ['* * 1 * */1', '2026-10-11T10:18:00.000Z'],
      ['0 0 31 2 1', '2027-02-01T00:00:00.000Z'],
    ]
  ) {
    assertEquals(calculateNextDenoRun(expression, now)?.toISOString(), expected, expression);
  }
  assertEquals(calculateNextRun('* * 1 * 0', now)?.toISOString(), '2026-11-01T00:00:00.000Z');
});
