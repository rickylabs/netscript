import { SagasError } from '../../domain/mod.ts';
import type {
  SagaJobTriggerReceipt,
  SagaJobTriggerRequest,
  SagaWorkersClientPort,
  SagaWorkerTriggerOptions,
} from './types.ts';
import type { JobId } from '@netscript/plugin-workers-core';

/** Trigger a branded worker job through an explicitly supplied workers port. */
export async function triggerJob<
  TJobId extends string,
  TPayload,
  TResult = unknown,
>(
  workers: SagaWorkersClientPort,
  jobId: JobId<TJobId>,
  payload: TPayload,
  options: SagaWorkerTriggerOptions = {},
): Promise<SagaJobTriggerReceipt<TJobId, TResult>> {
  assertTriggerOptions(options);
  const request: SagaJobTriggerRequest<TJobId, TPayload> = Object.freeze({
    jobId,
    payload,
    priority: options.priority,
    delay: options.delay,
    correlationId: options.correlationId,
    idempotencyKey: options.idempotencyKey,
    concurrencyKey: options.concurrencyKey,
    traceparent: options.traceparent,
    tracestate: options.tracestate,
  });
  return await workers.triggerJob<TJobId, TPayload, TResult>(request);
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
