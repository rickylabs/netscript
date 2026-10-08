import type {
  CommandStorePort,
  CommandTransaction,
  CommandTransactionRequest,
} from '../../../ports/command-store.ts';
import type { TransactionClientPort } from '../../../ports/transaction-client.ts';
import { createCommandStoreCapabilities } from '../../../ports/command-store-capabilities.ts';
import { CommandStoreError } from '../../../ports/command-store-error.ts';
import type { PostgresCommandClient } from '../ports/postgres-command-client.ts';
import { postgresCommandClaim } from './postgres-command-claim.ts';
import {
  appendPostgresCommandAudit,
  appendPostgresCommandOutbox,
  completePostgresCommandReceipt,
} from './postgres-command-rows.ts';
import { postgresCommandCode, postgresCommandFailure } from './postgres-command-errors.ts';

/** Explicit finite transaction timeout; network connections remain consumer-owned. */
export type PostgresCommandStoreOptions = Readonly<{
  /** Default timeout, between one millisecond and one minute. */
  transactionTimeoutMs: number;
}>;

class BusyRollback extends Error {}

/**
 * Bind a PostgreSQL command store to the consumer's actual generated transaction callback.
 *
 * Requires the reviewed receipt/audit/outbox migration. No connection, migration, queue
 * or driver starts on import/construction. Values are parameters and identifiers are fixed.
 * Cooperative cancellation checks framework steps; in-flight queries rely on the finite
 * provider transaction timeout. The consumer owns network/environment permissions.
 *
 * @example
 * ```ts
 * import { createPostgresCommandStore, type PostgresCommandClient } from '@netscript/database/commands/postgres';
 * import type { TransactionClientPort } from '@netscript/database/commands';
 * declare const root: TransactionClientPort<PostgresCommandClient>;
 * const store = createPostgresCommandStore(root, { transactionTimeoutMs: 5000 });
 * await store.transaction({ receiptClaimWaitMs: 1 }, async () => 'read-only');
 * ```
 */
export function createPostgresCommandStore<TTx extends PostgresCommandClient>(
  root: TransactionClientPort<TTx>,
  options: PostgresCommandStoreOptions,
): CommandStorePort<TTx> {
  const timeout = options.transactionTimeoutMs;
  if (!Number.isSafeInteger(timeout) || timeout < 1 || timeout > 60000) {
    throw new TypeError('[netscript.command.store] finite transaction timeout required');
  }
  const capabilities = createCommandStoreCapabilities({
    provider: 'postgres',
    transactionModel: 'interactive',
    sideRecordAtomicity: 'same_commit',
    callbackAttempts: 'one',
    cancellation: 'cooperative',
    selectableIsolationLevels: [
      'ReadUncommitted',
      'ReadCommitted',
      'RepeatableRead',
      'Serializable',
    ],
    defaultIsolation: 'ReadCommitted',
    receiptClaimWait: { minimumMs: 1, maximumMs: 60000, granularityMs: 1 },
  });
  return Object.freeze({
    capabilities,
    async transaction<TResult>(
      request: CommandTransactionRequest,
      work: (transaction: CommandTransaction<TTx>) => Promise<TResult>,
      signal?: AbortSignal,
    ): Promise<TResult> {
      const wait = request.receiptClaimWaitMs;
      const effectiveTimeout = request.options?.timeout ?? timeout;
      if (
        !Number.isSafeInteger(wait) || wait < 1 || wait > 60000 ||
        !Number.isSafeInteger(effectiveTimeout) || effectiveTimeout < 1 ||
        effectiveTimeout > 60000 ||
        (request.options?.isolationLevel &&
          !capabilities.selectableIsolationLevels.includes(request.options.isolationLevel))
      ) {
        throw new TypeError('[netscript.command.store] invalid transaction policy');
      }
      if (signal?.aborted) throw new CommandStoreError({ kind: 'aborted', retryable: true });
      let invoked = false;
      let callbackError: Readonly<{ cause: unknown }> | undefined;
      let busyResult: Readonly<{ value: TResult }> | undefined;
      try {
        return await root.$transaction(async (business) => {
          if (invoked) throw new TypeError('[netscript.command.store] callback reentry refused');
          invoked = true;
          for (
            const key of ['$transaction', '$connect', '$disconnect', '$on', '$use', '$extends']
          ) {
            if (typeof Reflect.get(business, key) === 'function') {
              throw new TypeError('[netscript.command.store] root operation in callback client');
            }
          }
          let active = true, busy = false;
          const pending = new Set<string>();
          function checkpoint(stepSignal?: AbortSignal): void {
            if (!active || busy || signal?.aborted || stepSignal?.aborted) {
              throw new CommandStoreError({ kind: 'aborted', retryable: true });
            }
          }
          const tx: CommandTransaction<TTx> = {
            business,
            async claimReceipt(claim, stepSignal) {
              checkpoint(stepSignal);
              const result = await postgresCommandClaim(business, claim, wait);
              if (result.kind === 'busy') busy = true;
              else if (result.kind === 'execute') pending.add(result.receiptId);
              return result;
            },
            async completeReceipt(completion, stepSignal) {
              checkpoint(stepSignal);
              if (!pending.has(completion.receiptId)) {
                throw new CommandStoreError({ kind: 'receipt_corrupt', retryable: false });
              }
              await completePostgresCommandReceipt(business, completion);
              pending.delete(completion.receiptId);
            },
            async appendAudit(rows, stepSignal) {
              checkpoint(stepSignal);
              await appendPostgresCommandAudit(business, rows);
            },
            async appendOutbox(rows, stepSignal) {
              checkpoint(stepSignal);
              await appendPostgresCommandOutbox(business, rows);
            },
          };
          try {
            const value = await work(Object.freeze(tx));
            if (busy) {
              busyResult = { value };
              throw new BusyRollback();
            }
            checkpoint();
            if (pending.size) {
              throw new CommandStoreError({ kind: 'receipt_corrupt', retryable: false });
            }
            return value;
          } catch (cause) {
            callbackError = { cause };
            throw cause;
          } finally {
            active = false;
          }
        }, {
          ...request.options,
          timeout: effectiveTimeout,
          isolationLevel: request.options?.isolationLevel ?? 'ReadCommitted',
        });
      } catch (cause) {
        if (cause instanceof BusyRollback && busyResult) return busyResult.value;
        if (callbackError?.cause === cause) {
          if (postgresCommandCode(cause)) throw postgresCommandFailure(cause, 'business');
          throw cause;
        }
        if (cause instanceof CommandStoreError) throw cause;
        throw postgresCommandFailure(cause, invoked ? 'commit' : 'begin');
      }
    },
  });
}
