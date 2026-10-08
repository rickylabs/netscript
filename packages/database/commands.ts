/**
 * Transaction-bound command persistence contracts and logical rows.
 *
 * Providers bind all delegates to the same callback-derived business client. This
 * subpath has no service, saga, worker or queue dependency and needs no permissions.
 *
 * @example
 * ```ts
 * import type { CommandStorePort } from '@netscript/database/commands';
 * type Business = { update(expectedVersion: string): Promise<number> };
 * declare const store: CommandStorePort<Business>;
 * await store.transaction({ receiptClaimWaitMs: 0 }, async ({ business }) => {
 *   return await business.update('initial');
 * });
 * ```
 * @module
 */
export { createCommandStoreCapabilities } from './ports/command-store-capabilities.ts';
export type {
  CommandReceiptRow,
  CommandStoreCapabilities,
  CommandStorePort,
  CommandTransaction,
  CommandTransactionRequest,
  ReceiptClaim,
  ReceiptClaimResult,
  ReceiptCompletion,
  StoredCommandAudit,
  StoredCommandOutbox,
  StoredCommandReceipt,
} from './ports/command-store.ts';
export type {
  DatabaseProvider,
  IsolationLevel,
  TransactionOptions,
} from './ports/database-client.ts';

export { CommandStoreError, type CommandStoreFailure } from './ports/command-store-error.ts';

export type { TransactionClientPort } from './ports/transaction-client.ts';
