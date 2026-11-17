import { assertEquals, assertThrows } from '@std/assert';
import { WorkersConfigSchema } from '../../src/config/mod.ts';

Deno.test('worker schema derives the same total and grace defaults as the runtime', () => {
  for (
    const [input, total, grace] of [[{}, 25_000, 5_000], [
      { drainTimeoutMs: 10_000 },
      10_000,
      2_000,
    ], [{ drainTimeoutMs: 500, abortGracePeriodMs: 0 }, 500, 0]] as const
  ) {
    const config = WorkersConfigSchema.parse(input);
    assertEquals(config && Reflect.get(config, 'drainTimeoutMs'), total);
    assertEquals(config && Reflect.get(config, 'abortGracePeriodMs'), grace);
  }
  assertEquals(WorkersConfigSchema.parse(undefined), undefined);
});

Deno.test('worker schema rejects invalid or contradictory budgets', () => {
  for (const value of [0, -1, 1.5, Infinity, NaN, 2_147_483_648]) {
    assertThrows(() => WorkersConfigSchema.parse({ drainTimeoutMs: value }));
  }
  for (const value of [-1, 1.5, Infinity, NaN, 101]) {
    assertThrows(() =>
      WorkersConfigSchema.parse({ drainTimeoutMs: 100, abortGracePeriodMs: value })
    );
  }
});
