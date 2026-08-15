import { assertEquals, assertFalse } from 'jsr:@std/assert@1';

import * as publicApi from '../mod.ts';
import { PrismaMySqlAdapter } from '../src/adapter.ts';
import type { PrismaMySqlTransactionOptions } from '../mod.ts';

Deno.test('root surface exposes transaction options without the concrete adapter', () => {
  const options: PrismaMySqlTransactionOptions = { usePhantomQuery: false };

  assertEquals(options, { usePhantomQuery: false });
  assertFalse('PrismaMySqlAdapter' in publicApi);
  assertEquals(typeof PrismaMySqlAdapter, 'function');
});
