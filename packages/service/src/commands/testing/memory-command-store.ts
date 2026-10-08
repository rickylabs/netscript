import { createCommandStoreCapabilities } from '@netscript/database/commands';
import type {
  CommandReceiptRow,
  CommandStorePort,
  CommandTransaction,
  CommandTransactionRequest,
  ReceiptClaim,
  ReceiptClaimResult,
  ReceiptCompletion,
  StoredCommandAudit,
  StoredCommandOutbox,
} from '@netscript/database/commands';
import { CommandError } from '../domain/failure.ts';

/** Minimal business client derived from one transaction draft; no root methods. */
export interface MemoryCommandBusiness {
  /** Read a detached scalar business value. */
  get(key: string): string | undefined;
  /** Write a scalar value to this transaction's draft. */
  set(key: string, value: string): void;
  /** Update only when the draft's current value matches the expected version/value. */
  compareAndSet(key: string, expected: string | undefined, value: string): boolean;
}

/** Detached frozen inspection of the four committed collections. */
export type MemoryCommandSnapshot = Readonly<{
  business: Readonly<Record<string, string>>;
  receipts: readonly CommandReceiptRow[];
  audit: readonly StoredCommandAudit[];
  outbox: readonly StoredCommandOutbox[];
}>;

/** One-use controllable barrier before commit, after the callback has finished. */
export interface CommandStoreBarrier {
  /** Resolves when the next transaction reaches the boundary. */
  readonly reached: Promise<void>;
  /** Release the held boundary; repeated release is harmless. */
  release(): void;
}

/** Bounded default timeout for the testing adapter. */
export type MemoryCommandStoreOptions = Readonly<{ transactionTimeoutMs?: number }>;

/** Testing-only store plus explicit fixture/negative controls; never passed to production constructors. */
export type MemoryCommandStore =
  & CommandStorePort<MemoryCommandBusiness>
  & Readonly<{
    /** Inspect detached committed data, never the uncommitted draft. */
    snapshot(): MemoryCommandSnapshot;
    /** Hold the next callback before commit for concurrency and rollback tests. */
    holdBeforeCommit(): CommandStoreBarrier;
    /** Seed even corrupt receipt material to exercise replay defenses. */
    seedReceipt(row: CommandReceiptRow): void;
    /** Deliberately bypass the bound transaction for a negative control. */
    writeBusinessOutsideTransaction(key: string, value: string): void;
  }>;

type State = {
  business: Map<string, string>;
  receipts: Map<string, CommandReceiptRow>;
  audit: StoredCommandAudit[];
  outbox: StoredCommandOutbox[];
};
type PendingBarrier = { entered: () => void; wait: Promise<void> };

function receiptKey(
  row: CommandReceiptRow | { scope: string; commandName: string; keyHash: string },
): string {
  return JSON.stringify([row.scope, row.commandName, row.keyHash]);
}

function copyReceipt(row: CommandReceiptRow): CommandReceiptRow {
  return Object.freeze({
    ...row,
    createdAt: Object.freeze(new Date(row.createdAt)),
    completedAt: row.completedAt === null ? null : Object.freeze(new Date(row.completedAt)),
  });
}

function copyAudit(row: StoredCommandAudit): StoredCommandAudit {
  return Object.freeze({ ...row, occurredAt: Object.freeze(new Date(row.occurredAt)) });
}

function copyOutbox(row: StoredCommandOutbox): StoredCommandOutbox {
  return Object.freeze({ ...row, availableAt: Object.freeze(new Date(row.availableAt)) });
}

/**
 * Construct a bound, atomic in-memory command store with controllable test boundaries.
 *
 * Its sqlite provider vocabulary is simulated, not certification of a SQLite adapter.
 * Conflicting drafts fail without callback retry. Receipt contention is immediate busy.
 *
 * @example
 * ```ts
 * import { createMemoryCommandStore } from '@netscript/service/commands/testing';
 * const store = createMemoryCommandStore();
 * await store.transaction({ receiptClaimWaitMs: 0 }, async ({ business }) => {
 *   return business.compareAndSet('version', undefined, '1');
 * });
 * ```
 */
export function createMemoryCommandStore(
  options: MemoryCommandStoreOptions = {},
): MemoryCommandStore {
  const defaultTimeout = options.transactionTimeoutMs ?? 5000;
  if (!Number.isSafeInteger(defaultTimeout) || defaultTimeout < 1) {
    throw new TypeError('[netscript.command.memory] invalid timeout');
  }
  const capabilities = createCommandStoreCapabilities({
    provider: 'sqlite',
    transactionModel: 'interactive',
    sideRecordAtomicity: 'same_commit',
    callbackAttempts: 'one',
    cancellation: 'cooperative',
    selectableIsolationLevels: ['Serializable'],
    defaultIsolation: 'Serializable',
    receiptClaimWait: { minimumMs: 0, maximumMs: 0, granularityMs: 1 },
  });
  let state: State = { business: new Map(), receipts: new Map(), audit: [], outbox: [] };
  let revision = 0;
  const claims = new Map<string, object>();
  let barrier: PendingBarrier | undefined;
  return Object.freeze({
    capabilities,
    snapshot(): MemoryCommandSnapshot {
      return Object.freeze({
        business: Object.freeze(Object.fromEntries(state.business)),
        receipts: Object.freeze([...state.receipts.values()].map(copyReceipt)),
        audit: Object.freeze(state.audit.map(copyAudit)),
        outbox: Object.freeze(state.outbox.map(copyOutbox)),
      });
    },
    holdBeforeCommit(): CommandStoreBarrier {
      if (barrier) throw new TypeError('[netscript.command.memory] barrier already armed');
      const reached = Promise.withResolvers<void>();
      const release = Promise.withResolvers<void>();
      barrier = { entered: reached.resolve, wait: release.promise };
      return Object.freeze({ reached: reached.promise, release: () => release.resolve() });
    },
    seedReceipt(row: CommandReceiptRow): void {
      state.receipts.set(receiptKey(row), copyReceipt(row));
      revision++;
    },
    writeBusinessOutsideTransaction(key: string, value: string): void {
      state.business.set(key, value);
      revision++;
    },
    async transaction<TResult>(
      request: CommandTransactionRequest,
      work: (transaction: CommandTransaction<MemoryCommandBusiness>) => Promise<TResult>,
      signal?: AbortSignal,
    ): Promise<TResult> {
      signal?.throwIfAborted();
      const timeout = request.options?.timeout ?? defaultTimeout;
      if (
        !Number.isSafeInteger(timeout) || timeout < 1 || request.receiptClaimWaitMs !== 0 ||
        (request.options?.maxWait !== undefined &&
          (!Number.isSafeInteger(request.options.maxWait) || request.options.maxWait < 0)) ||
        (request.options?.isolationLevel !== undefined &&
          request.options.isolationLevel !== 'Serializable')
      ) {
        throw new TypeError('[netscript.command.memory] unsupported transaction request');
      }
      const startingRevision = revision;
      const draft: State = {
        business: new Map(state.business),
        receipts: new Map(state.receipts),
        audit: [...state.audit],
        outbox: [...state.outbox],
      };
      const owner = {};
      const owned = new Set<string>();
      let active = true;
      let busy = false;
      let dirty = false;
      const check = (operationSignal?: AbortSignal): void => {
        if (!active || busy) throw new TypeError('[netscript.command.memory] terminal transaction');
        signal?.throwIfAborted();
        operationSignal?.throwIfAborted();
      };
      const business: MemoryCommandBusiness = Object.freeze({
        get(key: string): string | undefined {
          check();
          return draft.business.get(key);
        },
        set(key: string, value: string): void {
          check();
          draft.business.set(key, value);
          dirty = true;
        },
        compareAndSet(key: string, expected: string | undefined, value: string): boolean {
          check();
          if (draft.business.get(key) !== expected) return false;
          draft.business.set(key, value);
          dirty = true;
          return true;
        },
      });
      const transaction: CommandTransaction<MemoryCommandBusiness> = Object.freeze({
        business,
        async claimReceipt(
          claim: ReceiptClaim,
          operationSignal?: AbortSignal,
        ): Promise<ReceiptClaimResult> {
          await Promise.resolve();
          check(operationSignal);
          const key = receiptKey(claim);
          if (claims.has(key) && claims.get(key) !== owner) {
            busy = true;
            return Object.freeze({ kind: 'busy', retryAfterMs: 0 });
          }
          const row = draft.receipts.get(key);
          if (row) {
            if (
              row.requestHash !== claim.requestHash || row.commandVersion !== claim.commandVersion
            ) {
              return Object.freeze({ kind: 'mismatch' });
            }
            if (row.responseJson === null || row.completedAt === null) {
              throw new CommandError({ kind: 'receipt_corrupt', retryable: false });
            }
            return Object.freeze({
              kind: 'replay',
              receipt: Object.freeze({
                id: row.id,
                requestHash: row.requestHash,
                commandVersion: row.commandVersion,
                responseJson: row.responseJson,
                correlationId: row.correlationId,
                completedAt: Object.freeze(new Date(row.completedAt)),
              }),
            });
          }
          if ([...draft.receipts.values()].some((existing) => existing.id === claim.id)) {
            throw new TypeError('[netscript.command.memory] duplicate receipt id');
          }
          claims.set(key, owner);
          owned.add(key);
          draft.receipts.set(key, copyReceipt({ ...claim, responseJson: null, completedAt: null }));
          dirty = true;
          return Object.freeze({ kind: 'execute', receiptId: claim.id });
        },
        async completeReceipt(
          completion: ReceiptCompletion,
          operationSignal?: AbortSignal,
        ): Promise<void> {
          await Promise.resolve();
          check(operationSignal);
          const key = [...owned].find((key) =>
            draft.receipts.get(key)?.id === completion.receiptId
          );
          const row = key === undefined ? undefined : draft.receipts.get(key);
          if (!row || key === undefined || row.completedAt !== null) {
            throw new TypeError('[netscript.command.memory] completion requires local claim');
          }
          draft.receipts.set(
            key,
            copyReceipt({
              ...row,
              responseJson: completion.responseJson,
              completedAt: completion.completedAt,
            }),
          );
          dirty = true;
        },
        async appendAudit(
          records: readonly StoredCommandAudit[],
          operationSignal?: AbortSignal,
        ): Promise<void> {
          await Promise.resolve();
          check(operationSignal);
          if (
            new Set([...draft.audit, ...records].map((row) => row.id)).size !==
              draft.audit.length + records.length
          ) {
            throw new TypeError('[netscript.command.memory] duplicate audit id');
          }
          draft.audit.push(...records.map(copyAudit));
          dirty = dirty || records.length > 0;
        },
        async appendOutbox(
          messages: readonly StoredCommandOutbox[],
          operationSignal?: AbortSignal,
        ): Promise<void> {
          await Promise.resolve();
          check(operationSignal);
          if (
            new Set([...draft.outbox, ...messages].map((row) => row.id)).size !==
              draft.outbox.length + messages.length
          ) {
            throw new TypeError('[netscript.command.memory] duplicate outbox id');
          }
          draft.outbox.push(...messages.map(copyOutbox));
          dirty = dirty || messages.length > 0;
        },
      });
      const cancelled = Promise.withResolvers<never>();
      const abort = (): void => {
        active = false;
        cancelled.reject(signal?.reason);
      };
      signal?.addEventListener('abort', abort, { once: true });
      const timer = setTimeout(() => {
        active = false;
        cancelled.reject(
          new CommandError({ kind: 'store_failure', retryable: true, phase: 'business' }),
        );
      }, timeout);
      try {
        const result = await Promise.race([work(transaction), cancelled.promise]);
        check();
        const pending = barrier;
        barrier = undefined;
        if (pending) {
          pending.entered();
          await Promise.race([pending.wait, cancelled.promise]);
        }
        check();
        if ([...owned].some((key) => draft.receipts.get(key)?.completedAt === null)) {
          throw new CommandError({ kind: 'receipt_corrupt', retryable: false });
        }
        if (dirty && revision !== startingRevision) {
          throw new CommandError({ kind: 'store_failure', retryable: true, phase: 'commit' });
        }
        if (dirty) {
          state = draft;
          revision++;
        }
        return result;
      } finally {
        active = false;
        clearTimeout(timer);
        signal?.removeEventListener('abort', abort);
        for (const key of owned) if (claims.get(key) === owner) claims.delete(key);
      }
    },
  });
}
