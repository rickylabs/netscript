import { assertEquals, assertFalse } from 'jsr:@std/assert@1';
import type { SqlQuery } from '@prisma/driver-adapter-utils';

import * as publicApi from '../mod.ts';
import { PrismaMySqlAdapter } from '../src/adapter.ts';
import type { PrismaMySqlQuery, PrismaMySqlTransactionOptions } from '../mod.ts';

const _toUpstream: SqlQuery = {} as PrismaMySqlQuery;
const _fromUpstream: PrismaMySqlQuery = {} as SqlQuery;
void _toUpstream;
void _fromUpstream;

Deno.test('root surface exposes transaction options without the concrete adapter', () => {
  const options: PrismaMySqlTransactionOptions = { usePhantomQuery: false };

  assertEquals(options, { usePhantomQuery: false });
  assertFalse('PrismaMySqlAdapter' in publicApi);
  assertFalse('isConnectionError' in publicApi);
  assertFalse('MYSQL_CONNECTION_ERROR_CODES' in publicApi);
  assertFalse('getCapabilities' in publicApi);
  assertEquals(typeof PrismaMySqlAdapter, 'function');
});
