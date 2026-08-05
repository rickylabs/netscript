import type { DatabaseEntry } from '@netscript/aspire/types';

/** Adds permissions required by the selected database engine without duplicates. */
export function withDatabasePermissions(
  permissions: readonly string[],
  databaseEngine?: DatabaseEntry['Engine'],
): readonly string[] {
  const ffiAlreadyGranted = permissions.includes('--allow-all') ||
    permissions.includes('--allow-ffi');

  return databaseEngine === 'Sqlite' && !ffiAlreadyGranted
    ? [...permissions, '--allow-ffi']
    : permissions;
}
