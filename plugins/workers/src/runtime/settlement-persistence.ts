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

/** Internal structural port for read-only execution-state lookups without expanding public types. */
interface ReadableExecutionState {
  readonly get?: (
    executionId: string,
  ) => Promise<(WorkerExecutionRecord & { readonly status?: string }) | null>;
}

/** Inputs for settling a job or task after its handler reported success. */
export interface SettleAppliedExecutionInput {
  readonly idempotency: WorkerIdempotencyPort;
  readonly executionState: WorkerExecutionState;
  readonly claim: WorkerIdempotencyClaim;
  readonly executionId: string;
  readonly completion: WorkerCompleteExecutionOptions;
  readonly signal?: AbortSignal;
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
 * Read-only check for whether an execution row already transitioned to `expectedStatus`.
 */
export async function verifyExecutionStatus(
  executionState: WorkerExecutionState & ReadableExecutionState,
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
 * using bounded transient retries and read-only verification on ambiguous outcomes.
 */
export async function settleAppliedExecution(
  input: SettleAppliedExecutionInput,
): Promise<SettlementOutcome<WorkerExecutionRecord | null>> {
  const applied = await settleWriteWithVerification(
    () => input.idempotency.markApplied(input.claim.key, undefined, input.claim.token),
    { signal: input.signal },
  );
  if (!applied.settled) {
    return applied;
  }

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

/**
 * Best-effort reporting for post-effect settlement or diagnostic faults.
 *
 * Diagnostic sink failures are swallowed so reporting can never convert a settled
 * delivery into a callback rejection or counted nack.
 */
export function logPostEffectSettlementFailure(
  workerId: string,
  concept: 'Job' | 'Task',
  id: string,
  failure: FailedSettlementOutcome | undefined,
  error: unknown,
): void {
  try {
    const classification = failure?.failureClass ?? 'post_success_error';
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      `[Worker ${workerId}] ${concept} '${id}' settlement failed (${classification}) after successful execution:`,
      message,
    );
  } catch {
    // Secondary diagnostic sink errors must never alter a settled delivery outcome.
  }
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
