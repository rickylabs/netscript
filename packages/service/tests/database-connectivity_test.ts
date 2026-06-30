import { assertEquals } from '@std/assert';
import { resolveProbeEngine } from '../src/diagnostics/database-connectivity.ts';

// Regression coverage for #175: a service scaffolded with
// PrimaryDatabase=sqlite must NOT run (and thus must not log a spurious ERR
// for) the MySQL connectivity probe. sqlite is file-based and has no TCP
// endpoint, so the probe resolves to 'skip'.
Deno.test('resolveProbeEngine skips probe for sqlite (no spurious MySQL probe) (#175)', () => {
  assertEquals(resolveProbeEngine('sqlite'), 'skip');
  assertEquals(resolveProbeEngine('SQLite'), 'skip');
});

Deno.test('resolveProbeEngine targets the configured TCP engine', () => {
  assertEquals(resolveProbeEngine('mysql'), 'mysql');
  assertEquals(resolveProbeEngine('postgres'), 'postgres');
  assertEquals(resolveProbeEngine('postgresql'), 'postgres');
  assertEquals(resolveProbeEngine('mssql'), 'mssql');
  assertEquals(resolveProbeEngine('sqlserver'), 'mssql');
});

Deno.test('resolveProbeEngine is case-insensitive for TCP engines', () => {
  assertEquals(resolveProbeEngine('MySQL'), 'mysql');
  assertEquals(resolveProbeEngine('POSTGRES'), 'postgres');
  assertEquals(resolveProbeEngine('SqlServer'), 'mssql');
});

Deno.test('resolveProbeEngine falls back to mysql only when provider is unset', () => {
  // Preserves the legacy default for existing MySQL deployments that do not
  // export DB_PROVIDER / DATABASE_PROVIDER.
  assertEquals(resolveProbeEngine(undefined), 'mysql');
  assertEquals(resolveProbeEngine(null), 'mysql');
  assertEquals(resolveProbeEngine(''), 'mysql');
});

Deno.test('resolveProbeEngine skips unrecognized providers instead of probing mysql', () => {
  // An unknown engine must not silently fall back to a MySQL probe.
  assertEquals(resolveProbeEngine('duckdb'), 'skip');
  assertEquals(resolveProbeEngine('mongodb'), 'skip');
});

Deno.test('resolveProbeEngine reads DB_PROVIDER from the environment', () => {
  const prevDbProvider = Deno.env.get('DB_PROVIDER');
  const prevDatabaseProvider = Deno.env.get('DATABASE_PROVIDER');
  try {
    Deno.env.set('DB_PROVIDER', 'sqlite');
    Deno.env.delete('DATABASE_PROVIDER');
    assertEquals(resolveProbeEngine(), 'skip');

    Deno.env.set('DB_PROVIDER', 'mysql');
    assertEquals(resolveProbeEngine(), 'mysql');
  } finally {
    restoreEnv('DB_PROVIDER', prevDbProvider);
    restoreEnv('DATABASE_PROVIDER', prevDatabaseProvider);
  }
});

Deno.test('resolveProbeEngine falls back to DATABASE_PROVIDER when DB_PROVIDER is unset', () => {
  const prevDbProvider = Deno.env.get('DB_PROVIDER');
  const prevDatabaseProvider = Deno.env.get('DATABASE_PROVIDER');
  try {
    Deno.env.delete('DB_PROVIDER');
    Deno.env.set('DATABASE_PROVIDER', 'sqlite');
    assertEquals(resolveProbeEngine(), 'skip');
  } finally {
    restoreEnv('DB_PROVIDER', prevDbProvider);
    restoreEnv('DATABASE_PROVIDER', prevDatabaseProvider);
  }
});

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    Deno.env.delete(name);
  } else {
    Deno.env.set(name, value);
  }
}
