import { assertEquals, assertStringIncludes } from '@std/assert';
import { truncateResult } from '../mod.ts';

Deno.test('truncation recursively bounds arrays and strings', () => {
  const result = truncateResult(
    { rows: ['abcdefgh', 'two', 'three'], nested: { body: '123456' } },
    { maxItems: 2, maxStringLength: 4 },
  ) as Record<string, unknown>;
  assertEquals(result.rows, ['abcd…[truncated]', 'two']);
  assertStringIncludes(JSON.stringify(result.nested), '1234…[truncated]');
});
