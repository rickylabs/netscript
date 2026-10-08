import type { CommandBoundaryObserver } from './executor-boundary.ts';
import { CommandStoreError, createCommandStoreCapabilities } from '@netscript/database/commands';
import type { CommandStoreCapabilities, StoredCommandReceipt } from '@netscript/database/commands';
import type { CommandDefinition } from '../domain/definition.ts';
import type {
  CommandExecution,
  CommandExecutor,
  CommandRecordLimits,
  CommandTelemetryResult,
} from '../domain/execution.ts';
import { CommandError } from '../domain/failure.ts';
import type { CommandEnvelope } from '../domain/values.ts';
import type { CommandExecutorOptions, CommandTelemetrySpan } from '../ports/executor-ports.ts';
import { canonicalCommandJson, parseCanonicalCommandJson } from './canonical-json.ts';
import { commandHandler } from './define-command.ts';
import { commandIdentity, commandString } from './command-identity.ts';
import { commandRecordBuffer } from './command-record-buffer.ts';

const DEFAULT_LIMITS: CommandRecordLimits = Object.freeze({
  auditRecords: 64,
  outboxRecords: 64,
  recordBytes: 65_536,
});

class ClaimBusy extends Error {
  constructor(readonly retryAfterMs?: number) {
    super('[netscript.command] claim busy');
  }
}

function checkpoint(signal: AbortSignal): void {
  if (signal.aborted) throw new CommandError({ kind: 'aborted', retryable: true });
}

function capabilities(input: CommandStoreCapabilities): CommandStoreCapabilities {
  if (input.sideRecordAtomicity !== 'same_commit') {
    throw new CommandError({
      kind: 'unsupported_capability',
      retryable: false,
      capability: 'store_atomicity',
    });
  }
  if (input.transactionModel !== 'interactive' || input.callbackAttempts !== 'one') {
    throw new CommandError({
      kind: 'unsupported_capability',
      retryable: false,
      capability: 'transaction_model',
    });
  }
  try {
    return createCommandStoreCapabilities(input);
  } catch (cause) {
    throw new CommandError({
      kind: 'unsupported_capability',
      retryable: false,
      capability: 'transaction_model',
    }, { cause });
  }
}

function recordLimits(input: CommandRecordLimits = DEFAULT_LIMITS): CommandRecordLimits {
  for (const key of ['auditRecords', 'outboxRecords', 'recordBytes']) {
    const value = key === 'auditRecords'
      ? input.auditRecords
      : key === 'outboxRecords'
      ? input.outboxRecords
      : input.recordBytes;
    const ceiling = key === 'recordBytes'
      ? DEFAULT_LIMITS.recordBytes
      : DEFAULT_LIMITS.auditRecords;
    if (
      !Number.isSafeInteger(value) || value < (key === 'recordBytes' ? 1 : 0) || value > ceiling
    ) throw new TypeError('[netscript.command.executor] invalid limits');
  }
  return Object.freeze({ ...input });
}

function corrupt(): never {
  throw new CommandError({ kind: 'receipt_corrupt', retryable: false });
}

function replay<TName extends string, TInput, TOutput, TTx>(
  command: CommandDefinition<TName, TInput, TOutput, TTx>,
  receipt: StoredCommandReceipt,
  requestHash: string,
): CommandExecution<TOutput> {
  if (
    !commandString(receipt.id) || !commandString(receipt.correlationId) ||
    !Number.isSafeInteger(receipt.commandVersion) || receipt.commandVersion < 1 ||
    typeof receipt.requestHash !== 'string' || !/^[0-9a-f]{64}$/.test(receipt.requestHash) ||
    !(receipt.completedAt instanceof Date) || !Number.isFinite(receipt.completedAt.getTime()) ||
    typeof receipt.responseJson !== 'string'
  ) corrupt();
  if (receipt.requestHash !== requestHash || receipt.commandVersion !== command.definitionVersion) {
    throw new CommandError({ kind: 'idempotency_key_reuse', retryable: false });
  }
  let parsed;
  try {
    parsed = parseCanonicalCommandJson(receipt.responseJson);
  } catch {
    corrupt();
  }
  try {
    return Object.freeze({
      value: command.idempotency.response.decode(parsed),
      outcome: 'replayed',
      idempotency: 'replayed',
      correlationId: receipt.correlationId,
    });
  } catch (cause) {
    throw new CommandError({ kind: 'codec_failure', retryable: false, phase: 'response_decode' }, {
      cause,
    });
  }
}

function failed(error: unknown, keyed: boolean): CommandTelemetryResult {
  const failure = error instanceof CommandError ? error.failure : undefined;
  const kind = failure?.kind;
  return Object.freeze({
    outcome: kind === 'aborted'
      ? 'cancelled'
      : kind === 'optimistic_conflict'
      ? 'conflict'
      : kind === 'invalid_envelope' || kind === 'unsupported_capability' ||
          kind === 'codec_failure' || kind === 'idempotency_key_reuse'
      ? 'rejected'
      : 'failed',
    idempotency: kind === 'in_progress'
      ? 'busy'
      : kind === 'idempotency_key_reuse'
      ? 'mismatch'
      : keyed
      ? 'claimed'
      : 'not_requested',
    auditCount: 0,
    outboxCount: 0,
    ...(kind === undefined ? {} : { errorType: kind }),
  });
}

/**
 * Compose a once-only command executor over a same-commit interactive store.
 *
 * Input is detached bounded I-JSON and deeply frozen before identity callbacks. Header strings
 * are 1–256 UTF-8 bytes; keys are 16–256 bytes. Buffers default to 64 rows each and 64 KiB
 * aggregate canonical side-row bytes; options may only tighten these limits. Each transaction
 * receives a finite five-second timeout. No transport, retry or fault control is installed.
 *
 * @example
 * ```ts
 * import { createCommandExecutor } from '@netscript/service/commands';
 * import type { CommandStorePort } from '@netscript/database/commands';
 * declare const store: CommandStorePort<{ update(): Promise<void> }>;
 * const executor = createCommandExecutor({ store });
 * ```
 */
export function createCommandExecutor<TTx>(
  options: CommandExecutorOptions<TTx>,
): CommandExecutor<TTx> {
  return constructCommandExecutor(options);
}

/** Internal per-instance construction seam; only the testing factory supplies an observer. */
export function constructCommandExecutor<TTx>(
  options: CommandExecutorOptions<TTx>,
  boundary?: CommandBoundaryObserver,
): CommandExecutor<TTx> {
  const store = options.store;
  const declared = capabilities(store.capabilities);
  const limits = recordLimits(options.limits);
  const wait = options.receiptClaimWaitMs ?? declared.receiptClaimWait.minimumMs;
  if (
    !Number.isSafeInteger(wait) || wait < declared.receiptClaimWait.minimumMs ||
    wait > declared.receiptClaimWait.maximumMs ||
    wait % declared.receiptClaimWait.granularityMs !== 0
  ) throw new TypeError('[netscript.command.executor] invalid receipt wait');
  const clock = options.clock ?? { now: (): Date => new Date() };
  const ids = options.ids ?? { next: (): string => crypto.randomUUID() };
  const telemetry = options.telemetry;
  return Object.freeze({
    async execute<TName extends string, TInput, TOutput>(
      command: CommandDefinition<TName, TInput, TOutput, TTx>,
      incoming: CommandEnvelope<TInput>,
      executionOptions?: Readonly<{ signal?: AbortSignal }>,
    ): Promise<CommandExecution<TOutput>> {
      const signal = executionOptions?.signal ?? new AbortController().signal;
      checkpoint(signal);
      const handle = commandHandler(command);
      capabilities(store.capabilities);
      if (
        command.isolationLevel !== undefined &&
        !declared.selectableIsolationLevels.includes(command.isolationLevel)
      ) {
        throw new CommandError({
          kind: 'unsupported_capability',
          retryable: false,
          capability: 'isolation',
        });
      }
      const identity = await commandIdentity(command, incoming);
      checkpoint(signal);
      let invoked = false;
      const operation = async (span?: CommandTelemetrySpan): Promise<CommandExecution<TOutput>> => {
        if (invoked) {
          throw new CommandError({ kind: 'store_failure', retryable: false, phase: 'begin' });
        }
        invoked = true;
        const issued = new Set<string>();
        const newId = (): string => {
          try {
            const value = ids.next();
            if (!commandString(value) || issued.has(value)) {
              throw new TypeError('[netscript.command.executor] invalid identifier');
            }
            issued.add(value);
            return value;
          } catch (cause) {
            throw new CommandError({
              kind: 'codec_failure',
              retryable: false,
              phase: 'side_record',
            }, { cause });
          }
        };
        const now = (): Date => {
          try {
            const date = clock.now();
            if (!(date instanceof Date) || !Number.isFinite(date.getTime())) {
              throw new TypeError('[netscript.command.executor] invalid clock');
            }
            return new Date(date);
          } catch (cause) {
            throw new CommandError({
              kind: 'codec_failure',
              retryable: false,
              phase: 'side_record',
            }, { cause });
          }
        };
        let callbacks = 0;
        let entered = false;
        let callbackFailed = false;
        let callbackError: unknown;
        let counts = { auditCount: 0, outboxCount: 0 };
        let result: CommandExecution<TOutput>;
        try {
          checkpoint(signal);
          boundary?.('before_transaction');
          const candidateId = newId();
          const createdAt = now();
          result = await store.transaction({
            receiptClaimWaitMs: wait,
            options: {
              timeout: 5000,
              ...(command.isolationLevel === undefined
                ? {}
                : { isolationLevel: command.isolationLevel }),
            },
          }, async (transaction): Promise<CommandExecution<TOutput>> => {
            entered = true;
            try {
              if (++callbacks !== 1) {
                throw new CommandError({
                  kind: 'store_failure',
                  retryable: false,
                  phase: 'business',
                });
              }
              checkpoint(signal);
              let executionId = candidateId;
              const raw = async <T>(
                phase: 'claim' | 'flush' | 'complete',
                action: () => Promise<T>,
              ): Promise<T> => {
                checkpoint(signal);
                try {
                  return await action();
                } catch (cause) {
                  if (cause instanceof CommandError) throw cause;
                  if (cause instanceof CommandStoreError) {
                    throw new CommandError(cause.failure, { cause });
                  }
                  checkpoint(signal);
                  throw new CommandError({ kind: 'store_failure', retryable: false, phase }, {
                    cause,
                  });
                }
              };
              if (identity.keyHash !== undefined) {
                const decision = await raw('claim', () =>
                  transaction.claimReceipt({
                    id: candidateId,
                    scope: identity.scope,
                    commandName: command.name,
                    commandVersion: command.definitionVersion,
                    keyHash: identity.keyHash ?? '',
                    requestHash: identity.requestHash,
                    actorKind: identity.envelope.actor.kind,
                    actorSubject: identity.envelope.actor.subject,
                    correlationId: identity.envelope.correlationId,
                    createdAt,
                  }, signal));
                if (!decision || typeof decision !== 'object') corrupt();
                if (decision.kind === 'busy') {
                  if (
                    decision.retryAfterMs !== undefined &&
                    (!Number.isSafeInteger(decision.retryAfterMs) || decision.retryAfterMs < 0)
                  ) corrupt();
                  throw new ClaimBusy(decision.retryAfterMs);
                }
                checkpoint(signal);
                if (decision.kind === 'mismatch') {
                  throw new CommandError({ kind: 'idempotency_key_reuse', retryable: false });
                }
                if (decision.kind === 'replay') {
                  return replay(command, decision.receipt, identity.requestHash);
                }
                if (!commandString(decision.receiptId)) corrupt();
                executionId = decision.receiptId;
                boundary?.('after_claim');
              }
              const buffers = commandRecordBuffer(command, identity.envelope, limits, now, newId);
              let value: TOutput;
              try {
                value = await handle({
                  tx: transaction.business,
                  envelope: identity.envelope,
                  signal,
                  now,
                  newId,
                  audit: buffers.audit,
                  publish: buffers.publish,
                  conflict: (): never => {
                    throw new CommandError({ kind: 'optimistic_conflict', retryable: false });
                  },
                });
              } finally {
                buffers.seal();
              }
              checkpoint(signal);
              boundary?.('after_handler');
              const rows = buffers.rows(executionId);
              let responseJson: string;
              let decoded: TOutput;
              try {
                responseJson = canonicalCommandJson(command.idempotency.response.encode(value));
              } catch (cause) {
                throw new CommandError({
                  kind: 'codec_failure',
                  retryable: false,
                  phase: 'response_encode',
                }, { cause });
              }
              try {
                decoded = command.idempotency.response.decode(
                  parseCanonicalCommandJson(responseJson),
                );
              } catch (cause) {
                throw new CommandError({
                  kind: 'codec_failure',
                  retryable: false,
                  phase: 'response_decode',
                }, { cause });
              }
              const completedAt = now();
              checkpoint(signal);
              await raw('flush', () => transaction.appendAudit(rows.audit, signal));
              boundary?.('after_audit');
              checkpoint(signal);
              await raw('flush', () => transaction.appendOutbox(rows.outbox, signal));
              boundary?.('after_outbox');
              checkpoint(signal);
              if (identity.keyHash !== undefined) {
                await raw('complete', () =>
                  transaction.completeReceipt(
                    { receiptId: executionId, responseJson, completedAt },
                    signal,
                  ));
                boundary?.('after_receipt_complete');
              }
              checkpoint(signal);
              counts = { auditCount: rows.audit.length, outboxCount: rows.outbox.length };
              return Object.freeze({
                value: decoded,
                outcome: 'applied',
                idempotency: identity.keyHash === undefined ? 'not_requested' : 'claimed',
                correlationId: identity.envelope.correlationId,
              });
            } catch (error) {
              callbackFailed = true;
              callbackError = error;
              throw error;
            }
          }, signal);
          if (callbacks !== 1) {
            throw new CommandError({ kind: 'store_failure', retryable: false, phase: 'business' });
          }
        } catch (cause) {
          let error: unknown = cause;
          if (cause instanceof CommandStoreError) {
            error = new CommandError(cause.failure, { cause });
          } else if (cause instanceof ClaimBusy) {
            error = new CommandError({
              kind: 'in_progress',
              retryable: true,
              ...(cause.retryAfterMs === undefined ? {} : { retryAfterMs: cause.retryAfterMs }),
            });
          } else if (
            !(cause instanceof CommandError) && !(callbackFailed && Object.is(cause, callbackError))
          ) {
            error = signal.aborted
              ? new CommandError({ kind: 'aborted', retryable: true })
              : new CommandError({
                kind: 'store_failure',
                retryable: false,
                phase: entered ? 'commit' : 'begin',
              }, { cause });
          }
          try {
            span?.finish(failed(error, identity.keyHash !== undefined));
          } catch {
            // An observer cannot replace the application or rollback failure being surfaced.
          }
          throw error;
        }
        boundary?.('after_commit_before_return');
        span?.finish(
          Object.freeze({ outcome: result.outcome, idempotency: result.idempotency, ...counts }),
        );
        return result;
      };
      return telemetry === undefined ? await operation() : await telemetry.trace(
        Object.freeze({
          name: command.name,
          definitionVersion: command.definitionVersion,
          isolation: command.isolationLevel ?? 'default',
          provider: declared.provider,
          idempotency: identity.keyHash === undefined ? 'not_requested' : 'claimed',
        }),
        operation,
      );
    },
  });
}
