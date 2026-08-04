import type { DatabaseEntry } from '@netscript/aspire/types';

/** Adds permissions required by the selected database engine without duplicates. */
export function withDatabasePermissions(
  permissions: readonly string[],
  databaseEngine?: DatabaseEntry['Engine'],
): readonly string[] {
  return databaseEngine === 'Sqlite' && !permissions.includes('--allow-ffi')
    ? [...permissions, '--allow-ffi']
    : permissions;
}
