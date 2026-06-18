/**
 * @netscript/database
 *
 * Core database utilities, adapters, and connection management.
 * Provides a unified interface for multiple database backends.
 *
 * This package is designed to be JSR-publishable with NO user-specific schemas.
 * User database schemas should live in the root /database folder.
 *
 * Features:
 * - Multi-database support (PostgreSQL, MSSQL, MySQL, SQLite)
 * - Adapter-based architecture for consistent API
 * - Auto-discovery from Aspire environment
 * - OpenTelemetry instrumentation
 * - Transaction helpers
 * - Connection pool management
 *
 * @example Basic Usage with Adapters
 * ```typescript
 * import { createPostgresAdapter, createMssqlAdapter } from '@netscript/database/adapters';
 * import { PrismaClient } from './generated/client';
 *
 * // PostgreSQL
 * const pgAdapter = createPostgresAdapter({ connectionString: pgUrl });
 * const pgClient = new PrismaClient({ adapter: pgAdapter.getDriverAdapter() });
 *
 * // SQL Server
 * const mssqlAdapter = createMssqlAdapter({ connectionString: mssqlUrl });
 * const mssqlClient = new PrismaClient({ adapter: mssqlAdapter.getDriverAdapter() });
 * ```
 *
 * @module
 */

import { enablePrismaTracing } from './prisma-tracing.ts';

// ============================================================================
// OTEL INSTRUMENTATION
// ============================================================================

/**
 * Enable Prisma OTEL instrumentation for database tracing
 *
 * Call this before creating any Prisma clients.
 * Only works when OTEL_DENO=true.
 *
 * Uses a lightweight tracing helper that avoids the CJS-heavy
 * `@opentelemetry/instrumentation` dependency (which breaks Deno bundle/compile).
 *
 * @returns true if instrumentation was enabled successfully
 */
export function enableInstrumentation(): boolean {
  if (Deno.env.get('OTEL_DENO') === 'true') {
    try {
      enablePrismaTracing();
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

// ============================================================================
// INTERFACE EXPORTS
// ============================================================================

export type {
  DatabaseAdapter,
  DatabaseAdapterFactory,
  DatabaseConnectionOptions,
  DatabaseConnectionStatus,
  DatabaseProvider,
  IsolationLevel,
  SharedDatabaseConfig,
  TransactionOptions,
} from './ports/mod.ts';

// ============================================================================
// ADAPTER EXPORTS
// ============================================================================

export {
  createPostgresAdapter,
  PostgresAdapter,
  type PostgresConnectionOptions,
} from './adapters/mod.ts';

// MSSQL and MySQL adapters are available as sub-exports to avoid pulling in
// heavy dependencies (mssql, mysql2, @netscript/prisma-adapter-mysql) into
// consumers that only need Postgres.
//
//   import { MssqlAdapter } from '@netscript/database/adapters/mssql';
//   import { MysqlAdapter } from '@netscript/database/adapters/mysql';

// ============================================================================
// EXTENSIONS EXPORTS
// ============================================================================

export { jsonUtils, registerJsonFields } from './extensions/mod.ts';

// ============================================================================
// TRANSACTION HELPERS
// ============================================================================

import type { TransactionOptions } from './ports/mod.ts';

/**
 * Execute operations within a transaction
 *
 * @param client - Prisma client instance
 * @param fn - Function to execute within transaction
 * @param options - Transaction options
 * @returns Result of the transaction function
 *
 * @example
 * ```typescript
 * import { withTransaction } from '@netscript/database';
 *
 * const result = await withTransaction(await db.getMysql(), async (tx) => {
 *   const user = await tx.user.create({ data: { name: 'John' } });
 *   const order = await tx.order.create({ data: { userId: user.id } });
 *   return { user, order };
 * });
 * ```
 */
export function withTransaction<T, Client extends { $transaction: unknown }>(
  client: Client,
  fn: (tx: Client) => Promise<T>,
  options?: TransactionOptions,
): Promise<T> {
  // Type assertion needed due to Prisma's generic transaction type
  const $transaction = client.$transaction as (
    fn: (tx: Client) => Promise<T>,
    options?: TransactionOptions,
  ) => Promise<T>;

  return $transaction(fn, options);
}

// ============================================================================
// CONNECTION HELPERS
// ============================================================================

/**
 * Parse a database connection string
 *
 * Supports PostgreSQL, MSSQL, MySQL connection strings.
 *
 * @param connectionString - Database connection string
 * @returns Parsed connection details
 */
export function parseConnectionString(connectionString: string): {
  protocol: string;
  host: string;
  port: number;
  database: string;
  user?: string;
  password?: string;
} {
  const url = new URL(connectionString);

  // Determine default port based on protocol
  let defaultPort = 5432; // PostgreSQL default
  if (url.protocol === 'sqlserver:' || url.protocol === 'mssql:') {
    defaultPort = 1433;
  } else if (url.protocol === 'mysql:') {
    defaultPort = 3306;
  }

  return {
    protocol: url.protocol.replace(':', ''),
    host: url.hostname,
    port: parseInt(url.port) || defaultPort,
    database: url.pathname.slice(1),
    user: url.username || undefined,
    password: url.password || undefined,
  };
}

/**
 * Build a PostgreSQL connection string from parts
 *
 * @param parts - Connection parts
 * @returns PostgreSQL connection string
 */
export function buildPostgresConnectionString(parts: {
  host: string;
  port?: number;
  database: string;
  user?: string;
  password?: string;
  ssl?: boolean;
}): string {
  const { host, port = 5432, database, user, password, ssl } = parts;
  const auth = user ? (password ? `${user}:${password}@` : `${user}@`) : '';
  const sslParam = ssl ? '?sslmode=require' : '';
  return `postgresql://${auth}${host}:${port}/${database}${sslParam}`;
}

/**
 * Build a SQL Server connection string from parts
 *
 * @param parts - Connection parts
 * @returns SQL Server connection string (Prisma format)
 */
export function buildMssqlConnectionString(parts: {
  host: string;
  port?: number;
  database: string;
  user?: string;
  password?: string;
  instanceName?: string;
  trustServerCertificate?: boolean;
  encrypt?: boolean;
}): string {
  const {
    host,
    port = 1433,
    database,
    user,
    password,
    instanceName,
    trustServerCertificate,
    encrypt,
  } = parts;

  const server = instanceName ? `${host}\\${instanceName}` : `${host}:${port}`;
  const params: string[] = [`Database=${database}`];

  if (user) {
    params.push(`User Id=${user}`);
    if (password) {
      params.push(`Password=${password}`);
    }
  } else {
    params.push('Integrated Security=true');
  }

  if (trustServerCertificate !== undefined) {
    params.push(`TrustServerCertificate=${trustServerCertificate}`);
  }

  if (encrypt !== undefined) {
    params.push(`Encrypt=${encrypt}`);
  }

  return `sqlserver://${server};${params.join(';')}`;
}
