import { assertEquals } from '@std/assert';
import { CronPresets, isValidCronExpression, parseCronExpression } from '../ports/types.ts';

Deno.test('CronPresets expose valid expressions', () => {
  for (const expression of Object.values(CronPresets)) {
    assertEquals(isValidCronExpression(expression), true);
  }
});

Deno.test('isValidCronExpression validates common cases', () => {
  assertEquals(isValidCronExpression('0 9 * * 1-5'), true);
  assertEquals(isValidCronExpression('* * * * *'), true);
  assertEquals(isValidCronExpression('0 25 * * *'), false);
  assertEquals(isValidCronExpression('invalid'), false);
});

Deno.test('parseCronExpression parses valid expressions', () => {
  assertEquals(parseCronExpression('*/5 9 * * 1-5'), {
    minute: '*/5',
    hour: '9',
    dayOfMonth: '*',
    month: '*',
    dayOfWeek: '1-5',
  });
  assertEquals(parseCronExpression('invalid'), null);
});
