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

/**
 * Narrow a wire-supplied `triggeredBy` string to the canonical {@link TriggerType}.
 *
 * Queue messages carry `triggeredBy` as an untyped `string` (JSON at rest); the
 * execution-state record requires the enum. Parsing through the canonical
 * `TriggerTypeSchema` is the type-honest narrowing — it performs the same
 * validation that `executionState.create` runs downstream, so behavior is
 * unchanged for the valid values that already succeed.
 */
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
  const lease = new WorkerDeliveryLease(queueContext, context.shutdownSignal);
  let attempts = 0;
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
    if (!jobDef) {
      throw new Error(`Job '${jobId}' not found in registry`);
    }
    if (!jobDef.enabled) {
      throw new Error(`Job '${jobId}' is disabled`);
    }

    workerJobLogger.debug('Processing job {jobId}', {
      workerId: context.workerId,
      jobId,
      jobName: jobDef.name ?? jobId,
      triggeredBy,
    });

    const topic = jobDef.topic ?? message.topic ?? DEFAULT_TOPIC;
    claim = await context.idempotency.claim({
      concept: 'job',
      targetId: jobId,
      idempotencyKey: message.idempotencyKey,
      messageId: queueContext?.messageId,
      deliveryCount: queueContext?.deliveryCount,
      payload,
    });
    if (!claim.claimed) {
      recordIdempotentSkip(context, 'job', jobId, jobDef.name ?? jobId, claim, tracedContext);
      if (!claim.alreadyApplied) throw new Error(`Job '${jobId}' is already being processed`);
      return;
    }

    const execution = await context.executionState.create({
      jobId,
      topic,
      // Narrow the wire `string` `triggeredBy` to the canonical `TriggerType`
      // via the same schema the execution record is validated against. This is
      // not a cast: invalid values throw here exactly as they would inside
      // `executionState.create` -> `ExecutionRecordSchema.parse` downstream.
      triggeredBy: normalizeTriggeredBy(message.triggeredBy),
      payload,
      correlationId,
      traceparent: traceHeaders['traceparent'],
      tracestate: traceHeaders['tracestate'],
    });

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
        execution: {
          executionId,
          jobId,
          triggeredBy: message.triggeredBy,
          correlationId,
        },
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
        await context.executionState.start(executionId!);

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
        );

        addJobStepEvent('state_update', { status: result.success ? 'completed' : 'failed' });
        lease.assertOwned();
        if (result.success) {
          executionSucceeded = true;
          await context.idempotency.markApplied(claim!.key, undefined, claim!.token);
        } else {
          await deadLetter(
            result.error ?? 'Job failed after exhausting retries',
            'job.retries_exhausted',
          );
          await context.idempotency.release(claim!.key, claim!.token);
        }
        recordSharedWorkerMetrics(
          {
            activeJobs: context.activeJobs.size,
            processedJobs: result.success ? 1 : 0,
            failedJobs: result.success ? 0 : 1,
          },
          { [WorkerAttributes.WORKER_ID]: context.workerId },
        );
        await context.executionState.complete(executionId!, {
          status: result.success ? 'completed' : 'failed',
          exitCode: result.exitCode ?? (result.success ? 0 : 1),
          result: result.result ?? undefined,
          error: result.error ?? undefined,
        });

        return result;
      },
    );
  } catch (error) {
    await recordJobFailure(context, message, executionId, error);
    const requeue = (claim !== undefined && !claim.claimed && !claim.alreadyApplied) ||
      lease.lost ||
      context.shutdownSignal?.aborted ||
      error instanceof Error && error.name === 'ShutdownError' ||
      writingDeadLetter || terminalRecorded || executionSucceeded;
    try {
      if (requeue) {
        if (!queueContext?.extendVisibility) throw error;
        await queueContext.nack({ requeue: true });
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
      if (claim?.claimed) await context.idempotency.release(claim.key, claim.token);
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

    claimAttempted = true;
    claim = await context.idempotency.claim({
      concept: 'task',
      targetId: taskId,
      idempotencyKey: message.idempotencyKey,
      messageId: queueContext?.messageId,
      deliveryCount: queueContext?.deliveryCount,
      payload,
    });
    if (!claim.claimed) {
      recordIdempotentSkip(context, 'task', taskId, taskDef.name ?? taskId, claim);
      if (!claim.alreadyApplied) throw new Error(`Task '${taskId}' is already being processed`);
      return;
    }

    const execution = await context.executionState.create({
      concept: 'task',
      jobId: taskId,
      topic,
      triggeredBy,
      payload,
      correlationId,
      traceparent: traceHeaders['traceparent'],
      tracestate: traceHeaders['tracestate'],
    });

    executionId = execution.id;
    await context.executionState.start(executionId);

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
      await context.idempotency.markApplied(claim.key, undefined, claim.token);
    }

    await context.executionState.complete(executionId, {
      status: result.success ? 'completed' : 'failed',
      exitCode: result.exitCode ?? (result.success ? 0 : 1),
      result: result.result ?? undefined,
      error: result.error ?? undefined,
    });
    if (!result.success) {
      await context.idempotency.release(claim.key, claim.token);
    }

    if (result.success) {
      workerJobLogger.debug('Task {taskId} completed', {
        workerId: context.workerId,
        taskId,
        taskName: taskDef.name ?? taskId,
        duration: result.duration,
      });
    } else {
      console.error(
        `[Worker ${context.workerId}] Task '${taskId}' failed in ${result.duration}ms`,
      );
    }
  } catch (error) {
    if (claim?.claimed) {
      await context.idempotency.release(claim.key, claim.token);
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Worker ${context.workerId}] Task '${taskId}' failed:`, errorMessage);

    try {
      if (executionId) {
        await context.executionState.complete(executionId, {
          status: 'failed',
          exitCode: 1,
          error: errorMessage,
        });
      }
    } catch (stateError) {
      console.error(
        `[Worker ${context.workerId}] Failed to record task failure:`,
        stateError instanceof Error ? stateError.message : String(stateError),
      );
    }
    if (
      executionSucceeded || lease.signal.aborted || (claimAttempted && !claim) ||
      (claim && !claim.claimed && !claim.alreadyApplied)
    ) {
      if (!queueContext?.extendVisibility) throw error;
      await queueContext.nack({ requeue: true });
    }
  } finally {
    await lease.stop();
  }
}

async function recordJobFailure(
  context: WorkerDispatchContext,
  message: JobMessage,
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
  const topic = message.topic ?? DEFAULT_TOPIC;

  console.error(`[Worker ${context.workerId}] Job '${message.jobId}' ${status}:`, errorMessage);

  try {
    if (executionId && topic) {
      await context.executionState.complete(executionId, {
        status,
        exitCode: 1,
        error: errorMessage,
      });
    }
  } catch (stateError) {
    console.error(
      `[Worker ${context.workerId}] Failed to record job failure state:`,
      stateError instanceof Error ? stateError.message : String(stateError),
    );
  }
}
