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

export type {
  CommandReceiptRow,
  CommandStoreCapabilities,
  CommandStorePort,
  CommandTransaction,
  CommandTransactionRequest,
  DatabaseProvider,
  IsolationLevel,
  ReceiptClaim,
  ReceiptClaimResult,
  ReceiptCompletion,
  StoredCommandAudit,
  StoredCommandOutbox,
  StoredCommandReceipt,
  TransactionClientPort,
  TransactionOptions,
} from './commands.ts';

export { createPostgresCommandOutboxRelayStore } from './src/commands/adapters/create-postgres-command-outbox-relay-store.ts';
export type {
  ClaimedCommandOutboxRow,
  CommandOutboxAcceptance,
  CommandOutboxClaim,
  CommandOutboxPublication,
  CommandOutboxRelayStore,
  CommandOutboxRelease,
  CommandRelayFailureClass,
} from './commands.ts';
export { COMMAND_RELAY_FAILURE_CLASSES } from './commands.ts';
