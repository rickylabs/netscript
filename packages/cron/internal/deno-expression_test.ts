import { assertEquals, assertThrows } from '@std/assert';
import { isValidCronExpression } from '../ports/types.ts';
import { translateDenoCronExpression } from './deno-expression.ts';

Deno.test('Deno weekday translation preserves exact weekday sets and other fields', () => {
  for (
    const [expression, expected] of [
      ['0 0 * * 0', '0 0 * * 1'],
      ['0 9 * * 1-5', '0 9 * * 2,3,4,5,6'],
      ['0 0 * * 0,6', '0 0 * * 1,7'],
      ['0 0 * * */2', '0 0 * * 1,3,5,7'],
      ['*/5 09 1-20/2 1,12 *', '*/5 09 1-20/2 1,12 *'],
      ['0 0 * * 1-6/2,0', '0 0 * * 1,2,4,6'],
      ['0 0 * * 6,0,6', '0 0 * * 1,7'],
      ['0 0 * * */1', '0 0 * * 1,2,3,4,5,6,7'],
      ['0 0 * * 0-6/3', '0 0 * * 1,4,7'],
      ['0 0 * * */8', '0 0 * * 1'],
    ]
  ) {
    assertEquals(translateDenoCronExpression(expression), expected, expression);
  }
});

Deno.test('Deno weekday translation rejects unsupported fields explicitly', () => {
  assertEquals(isValidCronExpression('0 0 * * 7'), false);
  for (const field of ['7', 'MON', '0/2', '6-0', '*/0', '*/9007199254740992', '*-3']) {
    assertThrows(
      () => translateDenoCronExpression(`0 0 * * ${field}`),
      Error,
      `day-of-week field '${field}'`,
    );
  }
  assertThrows(() => translateDenoCronExpression('* * * *'), Error, 'expected five fields');
});
