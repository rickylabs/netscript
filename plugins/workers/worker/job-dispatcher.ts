import { createDefaultJobDeadLetterStore, recordJobDeadLetter } from './job-dead-letters.ts';
import {
  DEFAULT_TOPIC,
  type JobMessage,
  type TaskMessage,
  type TriggerType,
  TriggerTypeSchema,
  type WorkerIdempotencyClaim,
} from '@netscript/plugin-workers-core/runtime';
import type { MessageContext } from '@netscript/queue';
import {
  addJobStepEvent,
  recordSharedWorkerMetrics,
  type TracedMessageContext,
  traceJobExecution,
} from '@netscript/telemetry/instrumentation';
import { getParentContextFromHeaders } from '@netscript/telemetry/context';
import { WorkerAttributes } from '@netscript/telemetry/attributes';
import {
  buildWorkerClaimInput,
  createExecutionWithRetry,
  type FailedSettlementOutcome,
  logPostEffectSettlementFailure,
  recordExecutionFailureBestEffort,
  recordJobFailureBestEffort,
  releaseClaimWithRetry,
  requireSettledWrite,
  settleAppliedExecution,
  settleExecutionCompletion,
  startExecutionWithVerification,
} from '../src/runtime/settlement-persistence.ts';
import { workerJobLogger } from './job-logger.ts';
import { executeWorkerJob } from './job-execution.ts';
import type { JobExecutionContext, WorkerDispatchContext } from './worker-options.ts';
import { recordIdempotentSkip } from './worker-idempotency-events.ts';
import { WorkerDeliveryLease } from './delivery-lease.ts';
import {
  getMessageTraceHeaders,
  resolveSubprocessTraceHeaders,
  toSubprocessTraceOptions,
} from './subprocess-trace-context.ts';

/** Narrow a wire-supplied `triggeredBy` string to the canonical {@link TriggerType}. */
function normalizeTriggeredBy(triggeredBy: string): TriggerType {
  return TriggerTypeSchema.parse(triggeredBy);
}

/** Process a queued job message. */
export async function processWorkerJob(
  context: WorkerDispatchContext,
  message: JobMessage,
  queueContext?: MessageContext,
  tracedContext?: TracedMessageContext,
): Promise<void> {
  const { jobId, payload, correlationId } = message;
  const traceHeaders = getMessageTraceHeaders(message, tracedContext);
  const parentContext = tracedContext?.parentContext ?? getParentContextFromHeaders(traceHeaders);
  const triggeredBy = normalizeTriggeredBy(message.triggeredBy);

  let executionId: string | undefined;
  let claim: WorkerIdempotencyClaim | undefined;
  let claimAttempted = false;
  let preEffectPersistenceFailure = false;
  let postEffectSettlementFailure: FailedSettlementOutcome | undefined;
  const markPreEffectFailure = (): void => {
    preEffectPersistenceFailure = true;
  };
  const lease = new WorkerDeliveryLease(queueContext, context.shutdownSignal);
  let attempts = 0;
  let attemptFailed = false;
  let writingDeadLetter = false;
  let terminalRecorded = false;
  let executionSucceeded = false;
  const deadLetter = async (error: string, errorCode?: string): Promise<void> => {
    writingDeadLetter = true;
    await recordJobDeadLetter(
      context.deadLetters ?? createDefaultJobDeadLetterStore(context.queueName),
      message,
      {
        queueName: context.queueName ?? 'jobs',
        executionId,
        attempts,
        error,
        errorCode,
        queueContext,
      },
    );
    terminalRecorded = true;
    writingDeadLetter = false;
  };

  try {
    await lease.start();
    const jobDef = await context.registry.get(jobId);
    if (!jobDef) throw new Error(`Job '${jobId}' not found in registry`);
    if (!jobDef.enabled) throw new Error(`Job '${jobId}' is disabled`);

    workerJobLogger.debug('Processing job {jobId}', {
      workerId: context.workerId,
      jobId,
      jobName: jobDef.name ?? jobId,
      triggeredBy,
    });

    const topic = jobDef.topic ?? message.topic ?? DEFAULT_TOPIC;
    const claimInput = buildWorkerClaimInput(
      'job',
      jobId,
      message.idempotencyKey,
      payload,
      queueContext,
    );
    claimAttempted = true;
    claim = await requireSettledWrite(
      () => context.idempotency.claim(claimInput),
      { signal: lease.signal },
      markPreEffectFailure,
    );
    if (!claim.claimed) {
      recordIdempotentSkip(context, 'job', jobId, jobDef.name ?? jobId, claim, tracedContext);
      if (!claim.alreadyApplied) throw new Error(`Job '${jobId}' is already being processed`);
      return;
    }

    const execution = await createExecutionWithRetry(
      context.executionState,
      {
        jobId,
        topic,
        triggeredBy,
        payload,
        correlationId,
        traceparent: traceHeaders['traceparent'],
        tracestate: traceHeaders['tracestate'],
      },
      lease.signal,
      markPreEffectFailure,
    );

    executionId = execution.id;
    const abortController = lease.controller;

    await traceJobExecution(
      {
        job: {
          id: jobDef.id,
          name: jobDef.name,
          entrypoint: jobDef.entrypoint,
          timeout: jobDef.timeout,
          maxRetries: jobDef.maxRetries,
          tags: jobDef.tags,
          timezone: jobDef.timezone,
        },
        execution: { executionId, jobId, triggeredBy: message.triggeredBy, correlationId },
        parentContext,
      },
      async (span) => {
        span.setAttribute(WorkerAttributes.WORKER_CONCURRENCY, context.concurrency);
        const active: JobExecutionContext = {
          jobId,
          topic,
          executionId: executionId!,
          startTime: new Date(),
          abortController,
          span,
        };
        context.activeJobs.set(executionId!, active);
        context.workerSpan?.setAttribute(
          WorkerAttributes.WORKER_ACTIVE_JOBS,
          context.activeJobs.size,
        );
        recordSharedWorkerMetrics(
          { activeJobs: context.activeJobs.size },
          { [WorkerAttributes.WORKER_ID]: context.workerId },
        );

        addJobStepEvent('state_update', { status: 'running' });
        await startExecutionWithVerification(
          context.executionState,
          executionId!,
          lease.signal,
          markPreEffectFailure,
        );

        const subprocessHeaders = resolveSubprocessTraceHeaders(traceHeaders);
        addJobStepEvent('spawn_subprocess');
        const result = await executeWorkerJob(
          context,
          jobDef,
          executionId!,
          payload,
          abortController.signal,
          subprocessHeaders,
          correlationId,
          (attempt) => {
            attempts = attempt;
          },
          () => {
            attemptFailed = true;
          },
        );

        addJobStepEvent('state_update', { status: result.success ? 'completed' : 'failed' });
        lease.assertOwned();
        if (result.success) {
          executionSucceeded = true;
          const settled = await settleAppliedExecution({
            idempotency: context.idempotency,
            executionState: context.executionState,
            claim: claim!,
            executionId: executionId!,
            completion: {
              status: 'completed',
              exitCode: result.exitCode ?? 0,
              result: result.result ?? undefined,
              error: result.error ?? undefined,
            },
            signal: lease.signal,
          });
          if (!settled.settled) {
            postEffectSettlementFailure = settled;
            throw settled.error;
          }
          recordSharedWorkerMetrics(
            { activeJobs: context.activeJobs.size, processedJobs: 1, failedJobs: 0 },
            { [WorkerAttributes.WORKER_ID]: context.workerId },
          );
          return result;
        }

        await deadLetter(
          result.error ?? 'Job failed after exhausting retries',
          'job.retries_exhausted',
        );
        await releaseClaimWithRetry(context.idempotency, claim!.key, claim!.token);
        recordSharedWorkerMetrics(
          { activeJobs: context.activeJobs.size, processedJobs: 0, failedJobs: 1 },
          { [WorkerAttributes.WORKER_ID]: context.workerId },
        );
        const failed = await settleExecutionCompletion(context.executionState, executionId!, {
          status: 'failed',
          exitCode: result.exitCode ?? 1,
          result: result.result ?? undefined,
          error: result.error ?? undefined,
        });
        if (!failed.settled) throw failed.error;

        return result;
      },
    );
  } catch (error) {
    if (executionSucceeded) {
      logPostEffectSettlementFailure(
        context.workerId,
        'Job',
        jobId,
        postEffectSettlementFailure,
        error,
      );
      if (!queueContext) throw error;
      return;
    }

    await recordJobFailureBestEffort(
      context.workerId,
      message.jobId,
      message.topic ?? DEFAULT_TOPIC,
      context.executionState,
      executionId,
      error,
    );
    const requeue = (claim !== undefined && !claim.claimed && !claim.alreadyApplied) ||
      (claimAttempted && !claim) ||
      preEffectPersistenceFailure ||
      lease.lost ||
      context.shutdownSignal?.aborted ||
      error instanceof Error && error.name === 'ShutdownError' ||
      writingDeadLetter || terminalRecorded;
    try {
      if (requeue) {
        await requeueOrThrow(queueContext, lease, error, attemptFailed);
        return;
      }
      if (!(error instanceof Error && error.name === 'AbortError')) {
        await deadLetter(
          error instanceof Error ? error.message : String(error),
          error instanceof Error && error.name === 'TimeoutError'
            ? 'job.timeout'
            : 'job.execution_failed',
        );
      }
    } finally {
      if (claim?.claimed && !executionSucceeded) {
        await releaseClaimWithRetry(context.idempotency, claim.key, claim.token);
      }
    }
  } finally {
    await lease.stop();
    if (executionId) {
      context.activeJobs.delete(executionId);
      recordSharedWorkerMetrics(
        { activeJobs: context.activeJobs.size },
        { [WorkerAttributes.WORKER_ID]: context.workerId },
      );
    }
  }
}

/** Process a queued task message. */
export async function processWorkerTask(
  context: WorkerDispatchContext,
  message: TaskMessage,
  queueContext?: MessageContext,
): Promise<void> {
  const { taskId, payload, correlationId } = message;
  const traceHeaders = getMessageTraceHeaders(message, queueContext);
  const triggeredBy = normalizeTriggeredBy(message.triggeredBy);
  const topic = message.topic ?? DEFAULT_TOPIC;
  let executionId: string | undefined;
  let claim: WorkerIdempotencyClaim | undefined;
  let executionSucceeded = false;
  let claimAttempted = false;
  let preEffectPersistenceFailure = false;
  let postEffectSettlementFailure: FailedSettlementOutcome | undefined;
  const markPreEffectFailure = (): void => {
    preEffectPersistenceFailure = true;
  };
  const lease = new WorkerDeliveryLease(queueContext, context.shutdownSignal);

  try {
    await lease.start();
    const taskDef = await context.taskRegistry.get(taskId);
    if (!taskDef) throw new Error(`Task '${taskId}' not found in registry`);
    if (!taskDef.enabled) throw new Error(`Task '${taskId}' is disabled`);

    workerJobLogger.debug('Processing task {taskId}', {
      workerId: context.workerId,
      taskId,
      taskName: taskDef.name ?? taskId,
      triggeredBy,
    });

    const claimInput = buildWorkerClaimInput(
      'task',
      taskId,
      message.idempotencyKey,
      payload,
      queueContext,
    );
    claimAttempted = true;
    claim = await requireSettledWrite(
      () => context.idempotency.claim(claimInput),
      { signal: lease.signal },
      markPreEffectFailure,
    );
    if (!claim.claimed) {
      recordIdempotentSkip(context, 'task', taskId, taskDef.name ?? taskId, claim);
      if (!claim.alreadyApplied) throw new Error(`Task '${taskId}' is already being processed`);
      return;
    }

    const execution = await createExecutionWithRetry(
      context.executionState,
      {
        concept: 'task',
        jobId: taskId,
        topic,
        triggeredBy,
        payload,
        correlationId,
        traceparent: traceHeaders['traceparent'],
        tracestate: traceHeaders['tracestate'],
      },
      lease.signal,
      markPreEffectFailure,
    );

    executionId = execution.id;
    await startExecutionWithVerification(
      context.executionState,
      executionId,
      lease.signal,
      markPreEffectFailure,
    );

    const result = await context.taskExecutor.execute(taskDef, {
      env: {
        TASK_ID: taskId,
        ...(payload ? { TASK_PAYLOAD: JSON.stringify(payload) } : {}),
      },
      timeout: taskDef.timeout,
      signal: lease.signal,
      ...toSubprocessTraceOptions(resolveSubprocessTraceHeaders(traceHeaders), correlationId),
    });

    lease.assertOwned();
    if (result.success) {
      executionSucceeded = true;
      const settled = await settleAppliedExecution({
        idempotency: context.idempotency,
        executionState: context.executionState,
        claim,
        executionId,
        completion: {
          status: 'completed',
          exitCode: result.exitCode ?? 0,
          result: result.result ?? undefined,
          error: result.error ?? undefined,
        },
        signal: lease.signal,
      });
      if (!settled.settled) {
        postEffectSettlementFailure = settled;
        throw settled.error;
      }
      workerJobLogger.debug('Task {taskId} completed', {
        workerId: context.workerId,
        taskId,
        taskName: taskDef.name ?? taskId,
        duration: result.duration,
      });
      return;
    }

    const failed = await settleExecutionCompletion(context.executionState, executionId, {
      status: 'failed',
      exitCode: result.exitCode ?? 1,
      result: result.result ?? undefined,
      error: result.error ?? undefined,
    });
    if (!failed.settled) throw failed.error;
    await releaseClaimWithRetry(context.idempotency, claim.key, claim.token);
    console.error(`[Worker ${context.workerId}] Task '${taskId}' failed in ${result.duration}ms`);
  } catch (error) {
    if (executionSucceeded) {
      logPostEffectSettlementFailure(
        context.workerId,
        'Task',
        taskId,
        postEffectSettlementFailure,
        error,
      );
      if (!queueContext) throw error;
      return;
    }

    if (claim?.claimed) {
      await releaseClaimWithRetry(context.idempotency, claim.key, claim.token);
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Worker ${context.workerId}] Task '${taskId}' failed:`, errorMessage);

    await recordExecutionFailureBestEffort(
      context.workerId,
      'task failure',
      context.executionState,
      executionId,
      { status: 'failed', exitCode: 1, error: errorMessage },
    );
    if (
      lease.signal.aborted || preEffectPersistenceFailure ||
      (claimAttempted && !claim) || (claim && !claim.claimed && !claim.alreadyApplied)
    ) {
      await requeueOrThrow(queueContext, lease, error, false);
    }
  } finally {
    await lease.stop();
  }
}

async function requeueOrThrow(
  queueContext: MessageContext | undefined,
  lease: WorkerDeliveryLease,
  error: unknown,
  attemptFailed: boolean,
): Promise<void> {
  if (!queueContext) throw error;
  const shutdown = !attemptFailed && error === lease.signal.reason &&
    error instanceof Error && error.name === 'ShutdownError';
  await queueContext.nack({ requeue: true, ...(shutdown ? { preserveDeliveryCount: true } : {}) });
}
