import { assertEquals } from '@std/assert';
import { z } from 'zod';

Deno.test('Zod contract string bounds count Unicode code points', () => {
  assertEquals(z.string().max(2).safeParse('😀😀').success, true);
  assertEquals(z.string().min(2).safeParse('😀').success, false);
});

Deno.test('Zod contract datetimes require RFC 3339 seconds', () => {
  assertEquals(z.iso.datetime().safeParse('2026-10-10T20:00Z').success, false);
  assertEquals(z.iso.datetime().safeParse('2026-10-10T20:00:00Z').success, true);
});

Deno.test('Zod JSON Schema preserves chained numeric contract bounds', () => {
  const schema = z.toJSONSchema(z.number().min(0).max(23).int());
  assertEquals(schema.minimum, 0);
  assertEquals(schema.maximum, 23);
});
