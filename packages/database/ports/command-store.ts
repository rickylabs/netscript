import type { DatabaseProvider, IsolationLevel, TransactionOptions } from './database-client.ts';

/** Capabilities guaranteed by a provider's bound implementation, never weaker modes. */
export type CommandStoreCapabilities = Readonly<{
  provider: DatabaseProvider;
  transactionModel: 'interactive';
  sideRecordAtomicity: 'same_commit';
  callbackAttempts: 'one';
  cancellation: 'cooperative' | 'driver';
  selectableIsolationLevels: readonly IsolationLevel[];
  defaultIsolation: IsolationLevel | 'provider_configured';
  receiptClaimWait: Readonly<{ minimumMs: number; maximumMs: number; granularityMs: number }>;
}>;

/** Normalized executor policy passed before entering the provider boundary. */
export type CommandTransactionRequest = Readonly<{
  options?: Readonly<TransactionOptions>;
  receiptClaimWaitMs: number;
}>;

/** Uncommitted receipt identity; contains the key digest rather than the raw key. */
export type ReceiptClaim = Readonly<{
  id: string;
  scope: string;
  commandName: string;
  commandVersion: number;
  keyHash: string;
  requestHash: string;
  actorKind: 'principal' | 'system';
  actorSubject: string;
  correlationId: string;
  createdAt: Date;
}>;

/** Completed replay material copied from the winning receipt. */
export type StoredCommandReceipt = Readonly<{
  id: string;
  requestHash: string;
  commandVersion: number;
  responseJson: string;
  correlationId: string;
  completedAt: Date;
}>;

/** Logical receipt row; incomplete fields are legal only inside its uncommitted claim. */
export type CommandReceiptRow =
  & ReceiptClaim
  & Readonly<{
    responseJson: string | null;
    completedAt: Date | null;
  }>;

/** Claim decision; busy terminates the callback and requires boundary rollback. */
export type ReceiptClaimResult =
  | Readonly<{ kind: 'execute'; receiptId: string }>
  | Readonly<{ kind: 'replay'; receipt: StoredCommandReceipt }>
  | Readonly<{ kind: 'mismatch' }>
  | Readonly<{ kind: 'busy'; retryAfterMs?: number }>;

/** Completion of a claim owned by the current transaction. */
export type ReceiptCompletion = Readonly<{
  receiptId: string;
  responseJson: string;
  completedAt: Date;
}>;

/** Immutable audit intent committed with the business mutation. */
export type StoredCommandAudit = Readonly<{
  id: string;
  executionId: string;
  commandName: string;
  commandVersion: number;
  action: string;
  subjectType: string;
  subjectId: string;
  actorKind: 'principal' | 'system';
  actorSubject: string;
  actorScheme?: string;
  correlationId: string;
  dataJson?: string;
  occurredAt: Date;
}>;

/** Immutable delivery intent; relay lease and settlement fields are owned by later transactions. */
export type StoredCommandOutbox = Readonly<{
  id: string;
  executionId: string;
  commandName: string;
  commandVersion: number;
  destination: string;
  topic: string;
  payloadJson: string;
  dedupeKey: string;
  correlationId: string;
  traceparent?: string;
  tracestate?: string;
  availableAt: Date;
}>;

/** One callback-bound business handle and its four same-commit side-record delegates. */
export interface CommandTransaction<TTx> {
  /** Provider transaction client; excludes root lifecycle and nested transaction methods. */
  readonly business: TTx;
  /** Reserve or inspect a receipt using the request's bounded wait policy. */
  claimReceipt(claim: ReceiptClaim, signal?: AbortSignal): Promise<ReceiptClaimResult>;
  /** Complete a locally owned claim before commit. */
  completeReceipt(completion: ReceiptCompletion, signal?: AbortSignal): Promise<void>;
  /** Append validated audit records in the business transaction. */
  appendAudit(records: readonly StoredCommandAudit[], signal?: AbortSignal): Promise<void>;
  /** Append validated delivery intents in the business transaction. */
  appendOutbox(messages: readonly StoredCommandOutbox[], signal?: AbortSignal): Promise<void>;
}

/** Interactive boundary invokes work at most once and reports completion only after commit/rollback. */
export interface CommandStorePort<TTx> {
  /** Construction guarantees of the actual implementation. */
  readonly capabilities: CommandStoreCapabilities;
  /** Execute once; busy, cancellation and arbitrary callback errors rollback before surfacing. */
  transaction<TResult>(
    request: CommandTransactionRequest,
    work: (transaction: CommandTransaction<TTx>) => Promise<TResult>,
    signal?: AbortSignal,
  ): Promise<TResult>;
}
