import { assertEquals } from '@std/assert';
import { extractErrorData } from './extract.ts';

Deno.test('extractErrorData normalizes ordinary errors', () => {
  const data = extractErrorData(new Error('exploded'));

  assertEquals(data.message, 'exploded');
  assertEquals(data.status, 500);
  assertEquals(data.type, 'server');
  assertEquals(data.retry, true);
});

Deno.test('extractErrorData normalizes unknown values', () => {
  const data = extractErrorData('nope');

  assertEquals(data.message, 'An unexpected error occurred');
  assertEquals(data.code, 'UNKNOWN_ERROR');
});
