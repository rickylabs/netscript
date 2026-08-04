import { assertEquals, assertStrictEquals } from '@std/assert';

import { withDatabasePermissions } from '../register/database-permissions.ts';

Deno.test('SQLite permissions add FFI only when it is not already granted', () => {
  const scoped = ['--allow-net'] as const;
  const explicitFfi = ['--allow-net', '--allow-ffi'] as const;
  const allowAll = ['--unstable-kv', '--allow-all'] as const;

  assertEquals(withDatabasePermissions(scoped, 'Sqlite'), ['--allow-net', '--allow-ffi']);
  assertStrictEquals(withDatabasePermissions(explicitFfi, 'Sqlite'), explicitFfi);
  assertStrictEquals(withDatabasePermissions(allowAll, 'Sqlite'), allowAll);
  assertStrictEquals(withDatabasePermissions(scoped, 'Postgres'), scoped);
});
