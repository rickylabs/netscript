import { assertEquals } from '@std/assert';
import { parseOtlpHeaders } from './otlp-headers.ts';

Deno.test('parseOtlpHeaders reads the AppHost-injected x-otlp-api-key', () => {
  assertEquals(parseOtlpHeaders('x-otlp-api-key=abc123'), { 'x-otlp-api-key': 'abc123' });
});

Deno.test('parseOtlpHeaders handles multiple pairs, percent-encoding and blanks', () => {
  assertEquals(parseOtlpHeaders('a=1, b=x%3Dy ,=bad,novalue'), { a: '1', b: 'x=y' });
  assertEquals(parseOtlpHeaders(undefined), {});
  assertEquals(parseOtlpHeaders(''), {});
});
