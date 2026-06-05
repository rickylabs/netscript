import { SagasError } from '../../domain/mod.ts';
import type {
  SagaTaskTriggerReceipt,
  SagaTaskTriggerRequest,
  SagaWorkersClientPort,
  SagaWorkerTriggerOptions,
} from './types.ts';
import type { TaskId } from '@netscript/plugin-workers-core';

/** Trigger a branded worker task through an explicitly supplied workers port. */
export async function triggerTask<
  TTaskId extends string,
  TPayload,
  TResult = unknown,
>(
  workers: SagaWorkersClientPort,
  taskId: TaskId<TTaskId>,
  payload: TPayload,
  options: SagaWorkerTriggerOptions = {},
): Promise<SagaTaskTriggerReceipt<TTaskId, TResult>> {
  assertTriggerOptions(options);
  const request: SagaTaskTriggerRequest<TTaskId, TPayload> = Object.freeze({
    taskId,
    payload,
    priority: options.priority,
    delay: options.delay,
    correlationId: options.correlationId,
    idempotencyKey: options.idempotencyKey,
    concurrencyKey: options.concurrencyKey,
    traceparent: options.traceparent,
    tracestate: options.tracestate,
  });
  return await workers.triggerTask<TTaskId, TPayload, TResult>(request);
}

function assertTriggerOptions(options: SagaWorkerTriggerOptions): void {
  const delayMs = options.delay?.delayMs;
  if (delayMs !== undefined && (!Number.isFinite(delayMs) || delayMs < 0)) {
    throw SagasError.validationFailed('Worker trigger delayMs must be a non-negative number.');
  }

  const scheduledFor = options.delay?.scheduledFor;
  if (scheduledFor !== undefined && Number.isNaN(scheduledFor.getTime())) {
    throw SagasError.validationFailed('Worker trigger scheduledFor must be a valid Date.');
  }
}
