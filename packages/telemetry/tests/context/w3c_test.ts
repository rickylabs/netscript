import { assertEquals, assertExists } from '@std/assert';
import { formatTraceparent, parseTraceparent } from '../../context.ts';

Deno.test('traceparent formatting round-trips through the parser', () => {
  const traceparent = formatTraceparent({
    traceId: '0123456789abcdef0123456789abcdef',
    spanId: '0123456789abcdef',
    traceFlags: 1,
    isRemote: false,
  });

  const parsed = parseTraceparent(traceparent);

  assertExists(parsed);
  assertEquals(parsed.traceId, '0123456789abcdef0123456789abcdef');
  assertEquals(parsed.parentId, '0123456789abcdef');
  assertEquals(parsed.traceFlags, 1);
});
