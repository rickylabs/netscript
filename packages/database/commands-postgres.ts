/**
 * PostgreSQL command-store adapter for the consumer-owned generated callback and migration.
 * Construction opens no resource; the consumer provides the provider boundary and permissions.
 *
 * @example
 * ```ts
 * import { createPostgresCommandStore } from '@netscript/database/commands/postgres';
 * import type { TransactionClientPort } from '@netscript/database/commands';
 * import type { PostgresCommandClient } from '@netscript/database/commands/postgres';
 * declare const root: TransactionClientPort<PostgresCommandClient>;
 * createPostgresCommandStore(root, { transactionTimeoutMs: 5000 });
 * ```
 * @module
 */
export {
  createPostgresCommandStore,
  type PostgresCommandStoreOptions,
} from './src/commands/adapters/create-postgres-command-store.ts';
export type { PostgresCommandClient } from './src/commands/ports/postgres-command-client.ts';

export type { TransactionClientPort } from './ports/transaction-client.ts';
export type { CommandStorePort } from './ports/command-store.ts';
