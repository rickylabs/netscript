import { assertEquals } from 'jsr:@std/assert@^1';

import {
  inspectContracts,
  OffsetPaginationQuerySchema,
  paginationLimit,
  stringToInt,
} from '../mod.ts';

Deno.test('contracts root exposes pagination and diagnostics primitives', () => {
  const parsed = OffsetPaginationQuerySchema.parse({ limit: '25', offset: '5' });
  assertEquals(parsed, { limit: 25, offset: 5 });

  const report = inspectContracts(OffsetPaginationQuerySchema);
  assertEquals(report.packageName, '@netscript/contracts');
  assertEquals(report.status, 'ok');
});

Deno.test('contracts root exposes schema helper factories', () => {
  const limit = stringToInt(paginationLimit({ default: 10 }));
  assertEquals(limit.parse('30'), 30);
});
