/**
 * Worker settlement persistence adapters built on {@link settleWriteWithVerification}.
 *
 * Bridges idempotency and execution-state storage ports to the locked bounded transient
 * retry policy and read-only post-error verification.
 *
 * @module
 */

import type {
  WorkerIdempotencyClaim,
  WorkerIdempotencyInput,
  WorkerIdempotencyPort,
} from '@netscript/plugin-workers-core/runtime';
import type { MessageContext } from '@netscript/queue';
import type {
  WorkerCompleteExecutionOptions,
  WorkerCreateExecutionOptions,
  WorkerExecutionRecord,
  WorkerExecutionState,
} from '../../worker/worker-options.ts';
import {
  type FailedSettlementOutcome,
  requireSettledWrite,
  type SettlementCommitVerification,
  type SettlementOutcome,
  settleWriteWithVerification,
} from './settlement-retry.ts';

export {
  classifySettlementWriteFailure,
  DEFAULT_SETTLEMENT_RETRY_POLICY,
  type FailedSettlementOutcome,
  requireSettledWrite,
  SETTLEMENT_FAILURE_CLASS,
  type SettlementCommitVerification,
  type SettlementFailureClass,
  type SettlementOutcome,
  type SettlementRetryPolicy,
  type SettlementWriteOptions,
  settleWriteWithVerification,
} from './settlement-retry.ts';

/** Inputs for settling a job or task after its handler reported success. */
export interface SettleAppliedExecutionInput {
  readonly idempotency: WorkerIdempotencyPort;
  readonly executionState: WorkerExecutionState;
  readonly claimInput: WorkerIdempotencyInput;
  readonly claim: WorkerIdempotencyClaim;
  readonly executionId: string;
  readonly completion: WorkerCompleteExecutionOptions;
  readonly signal?: AbortSignal;
  readonly onApplied?: () => void;
}

/** Build a normalized idempotency claim input for one job or task delivery. */
export function buildWorkerClaimInput(
  concept: 'job' | 'task',
  targetId: string,
  idempotencyKey: string | undefined,
  payload: Record<string, unknown> | undefined,
  queueContext?: MessageContext,
): WorkerIdempotencyInput {
  return {
    concept,
    targetId,
    idempotencyKey,
    messageId: queueContext?.messageId,
    deliveryCount: queueContext?.deliveryCount,
    payload,
  };
}

/**
 * Read-first check for whether `idempotency.markApplied` already committed.
 *
 * Uses `deliveryCount: 1` so `KvWorkerIdempotencyStore` performs zero writes whenever
 * either the `applied` marker or the current `active` claim exists; if an expired key
 * is unexpectedly claimed by the probe, it is released immediately.
 */
export async function verifyIdempotencyApplied(
  idempotency: WorkerIdempotencyPort,
  claimInput: WorkerIdempotencyInput,
): Promise<SettlementCommitVerification<void>> {
  const probe = await idempotency.claim({ ...claimInput, deliveryCount: 1 });
  if (!probe.claimed && probe.alreadyApplied) {
    return { committed: true, value: undefined };
  }
  if (probe.claimed) {
    try {
      await idempotency.release(probe.key, probe.token);
    } catch {
      // Best-effort cleanup of a probe claim on an expired key.
    }
  }
  return { committed: false };
}

/**
 * Read-only check for whether an execution row already transitioned to `expectedStatus`.
 */
export async function verifyExecutionStatus(
  executionState: WorkerExecutionState,
  executionId: string,
  expectedStatus: WorkerCompleteExecutionOptions['status'] | 'running',
): Promise<SettlementCommitVerification<WorkerExecutionRecord | null>> {
  if (typeof executionState.get !== 'function') {
    return { committed: false };
  }
  const existing = await executionState.get(executionId);
  if (existing && existing.status === expectedStatus) {
    return { committed: true, value: existing };
  }
  return { committed: false };
}

/** Create an execution record with bounded retry on transient SQLite lock contention. */
export function createExecutionWithRetry(
  executionState: WorkerExecutionState,
  options: WorkerCreateExecutionOptions,
  signal?: AbortSignal,
  onFailure?: (failure: FailedSettlementOutcome) => void,
): Promise<WorkerExecutionRecord> {
  return requireSettledWrite(() => executionState.create(options), { signal }, onFailure);
}

/**
 * Persist an execution state transition (`start`) with bounded transient retry
 * and read-only status verification on unknown commit outcomes.
 */
export function startExecutionWithVerification(
  executionState: WorkerExecutionState,
  executionId: string,
  signal?: AbortSignal,
  onFailure?: (failure: FailedSettlementOutcome) => void,
): Promise<WorkerExecutionRecord | null> {
  return requireSettledWrite(
    () => executionState.start(executionId),
    {
      signal,
      verifyCommitted: () => verifyExecutionStatus(executionState, executionId, 'running'),
    },
    onFailure,
  );
}

/**
 * Persist an execution state transition (`complete`) with bounded transient retry
 * and read-only status verification on unknown commit outcomes.
 */
export function settleExecutionCompletion(
  executionState: WorkerExecutionState,
  executionId: string,
  completion: WorkerCompleteExecutionOptions,
  signal?: AbortSignal,
): Promise<SettlementOutcome<WorkerExecutionRecord | null>> {
  return settleWriteWithVerification(
    () => executionState.complete(executionId, completion),
    {
      signal,
      verifyCommitted: () => verifyExecutionStatus(executionState, executionId, completion.status),
    },
  );
}

/**
 * Persist post-effect settlement (`markApplied` followed by `executionState.complete`)
 * using bounded transient retries and read-first verification on ambiguous outcomes.
 */
export async function settleAppliedExecution(
  input: SettleAppliedExecutionInput,
): Promise<SettlementOutcome<WorkerExecutionRecord | null>> {
  const applied = await settleWriteWithVerification(
    () => input.idempotency.markApplied(input.claim.key, undefined, input.claim.token),
    {
      signal: input.signal,
      verifyCommitted: () => verifyIdempotencyApplied(input.idempotency, input.claimInput),
    },
  );
  if (!applied.settled) {
    return applied;
  }

  input.onApplied?.();

  return await settleExecutionCompletion(
    input.executionState,
    input.executionId,
    input.completion,
    input.signal,
  );
}

/**
 * Release an uncommitted active idempotency claim with bounded transient busy retry.
 *
 * Intentionally omits an already-aborted shutdown signal so shutdown cleanup can still
 * free the active marker for replacement workers.
 */
export async function releaseClaimWithRetry(
  idempotency: WorkerIdempotencyPort,
  key: string,
  token?: string,
): Promise<void> {
  const outcome = await settleWriteWithVerification(() => idempotency.release(key, token));
  if (!outcome.settled) {
    throw outcome.error;
  }
}

/** Log and best-effort persist a job failure, timeout, or cancellation status. */
export async function recordJobFailureBestEffort(
  workerId: string,
  jobId: string,
  topic: string | undefined,
  executionState: WorkerExecutionState,
  executionId: string | undefined,
  error: unknown,
): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const cause = error instanceof Error ? error.name : undefined;
  const status = cause === 'TimeoutError'
    ? 'timeout'
    : cause === 'ShutdownError' || cause === 'AbortError'
    ? 'cancelled'
    : 'failed';
  console.error(`[Worker ${workerId}] Job '${jobId}' ${status}:`, errorMessage);
  if (topic) {
    await recordExecutionFailureBestEffort(
      workerId,
      'job failure state',
      executionState,
      executionId,
      {
        status,
        exitCode: 1,
        error: errorMessage,
      },
    );
  }
}

/** Log a post-effect settlement persistence failure without masking its classification. */
export function logPostEffectSettlementFailure(
  workerId: string,
  concept: 'Job' | 'Task',
  id: string,
  failure: FailedSettlementOutcome,
  error: unknown,
): void {
  console.error(
    `[Worker ${workerId}] ${concept} '${id}' settlement failed (${failure.failureClass}) after successful execution:`,
    error instanceof Error ? error.message : String(error),
  );
}

/**
 * Best-effort persistence of a failure/timeout/cancelled execution status without
 * throwing secondary persistence errors over the primary failure path.
 */
export async function recordExecutionFailureBestEffort(
  workerId: string,
  label: string,
  executionState: WorkerExecutionState,
  executionId: string | undefined,
  completion: WorkerCompleteExecutionOptions,
): Promise<void> {
  if (!executionId) return;
  try {
    const outcome = await settleExecutionCompletion(executionState, executionId, completion);
    if (!outcome.settled) {
      console.error(
        `[Worker ${workerId}] Failed to record ${label}:`,
        outcome.error instanceof Error ? outcome.error.message : String(outcome.error),
      );
    }
  } catch (stateError) {
    console.error(
      `[Worker ${workerId}] Failed to record ${label}:`,
      stateError instanceof Error ? stateError.message : String(stateError),
    );
  }
}
