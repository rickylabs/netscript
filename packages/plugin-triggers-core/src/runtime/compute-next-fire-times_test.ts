import { assert, assertEquals, assertThrows } from '@std/assert';
import { defineScheduledTrigger } from '../builders/mod.ts';
import { TriggersError } from '../domain/mod.ts';
import { computeNextFireTimes } from './compute-next-fire-times.ts';

Deno.test('computeNextFireTimes handles spring-forward skipped wall time', () => {
  const definition = defineScheduledTrigger(() => Promise.resolve([]), {
    id: 'spring-forward',
    cron: '0 2 * * *',
    timezone: 'America/New_York',
  });

  assertEquals(
    computeNextFireTimes(definition, 1, new Date('2024-03-10T06:55:00.000Z')),
    ['2024-03-10T07:00:00.000Z'],
  );
});

Deno.test('computeNextFireTimes returns both fall-back occurrences', () => {
  const definition = defineScheduledTrigger(() => Promise.resolve([]), {
    id: 'fall-back',
    cron: '0 1 * * *',
    timezone: 'America/New_York',
  });

  assertEquals(
    computeNextFireTimes(definition, 2, new Date('2024-11-03T04:55:00.000Z')),
    ['2024-11-03T05:00:00.000Z', '2024-11-03T06:00:00.000Z'],
  );
});

Deno.test('computeNextFireTimes handles UTC-offset timezones without DST', () => {
  const definition = defineScheduledTrigger(() => Promise.resolve([]), {
    id: 'tokyo',
    cron: '30 9 * * *',
    timezone: 'Asia/Tokyo',
  });

  assertEquals(
    computeNextFireTimes(definition, 2, new Date('2023-12-31T23:00:00.000Z')),
    ['2024-01-01T00:30:00.000Z', '2024-01-02T00:30:00.000Z'],
  );
});

Deno.test('computeNextFireTimes defaults from to current time', () => {
  const definition = defineScheduledTrigger(() => Promise.resolve([]), {
    id: 'default-from',
    cron: '* * * * *',
    timezone: 'UTC',
  });
  const before = Date.now();
  const [next] = computeNextFireTimes(definition, 1);
  const after = Date.now();
  const nextMs = Date.parse(next);

  assert(nextMs >= Math.floor(before / 60_000) * 60_000);
  assert(nextMs <= Math.ceil(after / 60_000) * 60_000 + 60_000);
});

Deno.test('computeNextFireTimes honors non-persistent one-shot preview semantics', () => {
  const definition = defineScheduledTrigger(() => Promise.resolve([]), {
    id: 'one-shot',
    cron: '*/10 * * * *',
    timezone: 'UTC',
    persistent: false,
  });

  assertEquals(
    computeNextFireTimes(definition, 3, new Date('2024-01-01T00:01:00.000Z')),
    ['2024-01-01T00:10:00.000Z'],
  );
});

Deno.test('computeNextFireTimes supports leap-day recurrences', () => {
  const definition = defineScheduledTrigger(() => Promise.resolve([]), {
    id: 'leap-day',
    cron: '0 0 29 2 *',
    timezone: 'UTC',
  });

  assertEquals(
    computeNextFireTimes(definition, 2, new Date('2023-01-01T00:00:00.000Z')),
    ['2024-02-29T00:00:00.000Z', '2028-02-29T00:00:00.000Z'],
  );
});

Deno.test('computeNextFireTimes throws a typed error for impossible cron dates', () => {
  const definition = defineScheduledTrigger(() => Promise.resolve([]), {
    id: 'invalid-date',
    cron: '0 0 30 2 *',
    timezone: 'UTC',
  });

  const error = assertThrows(
    () => computeNextFireTimes(definition, 1, new Date('2024-01-01T00:00:00.000Z')),
    TriggersError,
  );
  assertEquals(error.code, 'TRIGGER_VALIDATION_FAILED');
});

Deno.test('computeNextFireTimes handles every-N-minutes intervals', () => {
  const definition = defineScheduledTrigger(() => Promise.resolve([]), {
    id: 'interval',
    cron: '*/15 * * * *',
    timezone: 'UTC',
  });

  assertEquals(
    computeNextFireTimes(definition, 3, new Date('2024-01-01T00:07:00.000Z')),
    [
      '2024-01-01T00:15:00.000Z',
      '2024-01-01T00:30:00.000Z',
      '2024-01-01T00:45:00.000Z',
    ],
  );
});
