/**
 * In-process command store for semantic tests; provides no real database guarantees.
 *
 * Every instance owns its state. Bound writes commit together, while explicit testing
 * controls allow corrupt fixtures and outside-transaction negative controls. No permissions.
 *
 * @example
 * ```ts
 * import { createMemoryCommandStore } from '@netscript/service/commands/testing';
 * const store = createMemoryCommandStore();
 * await store.transaction({ receiptClaimWaitMs: 0 }, async ({ business }) => {
 *   business.set('counter', '1');
 * });
 * store.snapshot();
 * ```
 * @module
 */
export { createMemoryCommandStore } from './src/commands/testing/memory-command-store.ts';
export type {
  CommandStoreBarrier,
  MemoryCommandBusiness,
  MemoryCommandSnapshot,
  MemoryCommandStore,
  MemoryCommandStoreOptions,
} from './src/commands/testing/memory-command-store.ts';
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
  TransactionOptions,
} from '@netscript/database/commands';
