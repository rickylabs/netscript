/**
 * Database Adapters - Barrel Export
 *
 * Re-exports all database adapter implementations.
 *
 * @module
 */

export {
  createPostgresAdapter,
  PostgresAdapter,
  type PostgresConnectionOptions,
} from './postgres.adapter.ts';

// MSSQL and MySQL adapters are available as sub-exports to avoid pulling in
// heavy dependencies (mssql, mysql2, @netscript/prisma-adapter-mysql) into
// consumers that only need Postgres.
//
// Import them explicitly when needed:
//   import { MssqlAdapter } from '@netscript/database/adapters/mssql';
//   import { MysqlAdapter } from '@netscript/database/adapters/mysql';
