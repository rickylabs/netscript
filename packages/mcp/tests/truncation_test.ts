import { assertEquals, assertStringIncludes, assertThrows } from '@std/assert';
import { truncateResult } from '../mod.ts';
import { ResultByteLimitError } from '../src/application/runner/truncation.ts';

Deno.test('truncation recursively bounds arrays and strings', () => {
  const result = truncateResult(
    { rows: ['abcdefgh', 'two', 'three'], nested: { body: '123456' } },
    { maxItems: 2, maxStringLength: 4 },
  ) as Record<string, unknown>;
  assertEquals(result.rows, ['abcd…[truncated]', 'two']);
  assertStringIncludes(JSON.stringify(result.nested), '1234…[truncated]');
});

Deno.test('75 rows cannot become 50 rows with false truncation metadata', () => {
  const result = truncateResult({
    rows: Array.from({ length: 75 }, (_, index) => ({ index })),
    truncated: false,
  }) as { rows: unknown[]; truncated: boolean };

  assertEquals(result.rows.length, 50);
  assertEquals(result.truncated, true);
});

Deno.test('nested truncation marks existing metadata on every declaring ancestor', () => {
  const result = truncateResult(
    {
      page: {
        rows: ['long value'],
        truncated: false,
      },
      truncated: false,
    },
    { maxItems: 50, maxStringLength: 4 },
  ) as { page: { truncated: boolean }; truncated: boolean };

  assertEquals(result.page.truncated, true);
  assertEquals(result.truncated, true);
});

Deno.test('irreducibly large bounded results fail the UTF-8 byte ceiling', () => {
  const value = Object.fromEntries(
    Array.from({ length: 40 }, (_, index) => [`field${index}`, 'x'.repeat(2000)]),
  );

  assertThrows(
    () => truncateResult(value),
    ResultByteLimitError,
    'after truncation; limit is 65536',
  );
});
