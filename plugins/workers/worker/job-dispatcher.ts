import {
  DEFAULT_TOPIC,
  type JobMessage,
  type TaskMessage,
  type WorkerIdempotencyClaim,
} from '@netscript/plugin-workers-core/runtime';
import type { MessageContext } from '@netscript/queue';
import {
  addJobStepEvent,
  type TracedMessageContext,
  traceJobExecution,
} from '@netscript/telemetry/instrumentation';
import { getParentContextFromHeaders, getTraceContext } from '@netscript/telemetry/context';
import { WorkerAttributes } from '@netscript/telemetry/attributes';
import { executeWorkerJob } from './job-execution.ts';
import type { JobExecutionContext, WorkerDispatchContext } from './worker-options.ts';
import { recordIdempotentSkip } from './worker-idempotency-events.ts';

/** Process a queued job message. */
export async function processWorkerJob(
  context: WorkerDispatchContext,
  message: JobMessage,
  queueContext?: MessageContext,
  tracedContext?: TracedMessageContext,
): Promise<void> {
  const { jobId, payload, correlationId } = message;
  const traceHeaders = getTraceHeaders(message, tracedContext);
  const parentContext = tracedContext?.parentContext ?? getParentContextFromHeaders(traceHeaders);
  const triggeredBy = message.triggeredBy;

  console.log(`[Worker ${context.workerId}] Processing job '${jobId}' (trigger: ${triggeredBy})`);

  let executionId: string | undefined;
  let claim: WorkerIdempotencyClaim | undefined;

  try {
    const jobDef = await context.registry.get(jobId);
    if (!jobDef) {
      throw new Error(`Job '${jobId}' not found in registry`);
    }
    if (!jobDef.enabled) {
      throw new Error(`Job '${jobId}' is disabled`);
    }

    const topic = jobDef.topic ?? message.topic ?? DEFAULT_TOPIC;
    claim = await context.idempotency.claim({
      concept: 'job',
      targetId: jobId,
      idempotencyKey: message.idempotencyKey,
      messageId: queueContext?.messageId,
      payload,
    });
    if (!claim.claimed) {
      recordIdempotentSkip(context, 'job', jobId, claim, tracedContext);
      return;
    }

    const execution = await context.executionState.create({
      jobId,
      topic,
      triggeredBy: message.triggeredBy,
      payload,
      correlationId,
      traceparent: traceHeaders['traceparent'],
      tracestate: traceHeaders['tracestate'],
    });

    executionId = execution.id;
    const abortController = new AbortController();

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

        addJobStepEvent('state_update', { status: 'running' });
        await context.executionState.start(executionId!);

        const currentTraceCtx = getTraceContext();
        const subprocessHeaders: Record<string, string> = currentTraceCtx
          ? {
            traceparent: currentTraceCtx.traceparent,
            ...(currentTraceCtx.tracestate ? { tracestate: currentTraceCtx.tracestate } : {}),
          }
          : traceHeaders;

        addJobStepEvent('spawn_subprocess');
        const result = await executeWorkerJob(
          context,
          jobDef,
          payload,
          abortController.signal,
          subprocessHeaders,
        );

        addJobStepEvent('state_update', { status: result.success ? 'completed' : 'failed' });
        if (result.success) {
          await context.idempotency.markApplied(claim!.key);
        } else {
          await context.idempotency.release(claim!.key);
        }
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
    if (claim?.claimed) {
      await context.idempotency.release(claim.key);
    }
    await recordJobFailure(context, message, executionId, error);
  } finally {
    if (executionId) {
      context.activeJobs.delete(executionId);
    }
  }
}

/** Process a queued task message. */
export async function processWorkerTask(
  context: WorkerDispatchContext,
  message: TaskMessage,
  queueContext?: MessageContext,
): Promise<void> {
  const { taskId, payload, correlationId, triggeredBy } = message;
  const topic = message.topic ?? DEFAULT_TOPIC;
  let executionId: string | undefined;
  let claim: WorkerIdempotencyClaim | undefined;

  console.log(`[Worker ${context.workerId}] Processing task '${taskId}' (trigger: ${triggeredBy})`);

  try {
    const taskDef = await context.taskRegistry.get(taskId);
    if (!taskDef) throw new Error(`Task '${taskId}' not found in registry`);
    if (!taskDef.enabled) throw new Error(`Task '${taskId}' is disabled`);

    claim = await context.idempotency.claim({
      concept: 'task',
      targetId: taskId,
      idempotencyKey: message.idempotencyKey,
      messageId: queueContext?.messageId,
      payload,
    });
    if (!claim.claimed) {
      recordIdempotentSkip(context, 'task', taskId, claim);
      return;
    }

    const execution = await context.executionState.create({
      concept: 'task',
      jobId: taskId,
      topic,
      triggeredBy,
      payload,
      correlationId,
    });

    executionId = execution.id;
    await context.executionState.start(executionId);

    const result = await context.taskExecutor.execute(taskDef, {
      env: {
        TASK_ID: taskId,
        ...(payload ? { TASK_PAYLOAD: JSON.stringify(payload) } : {}),
      },
      timeout: taskDef.timeout,
    });

    if (result.success) {
      await context.idempotency.markApplied(claim.key);
    }

    await context.executionState.complete(executionId, {
      status: result.success ? 'completed' : 'failed',
      exitCode: result.exitCode ?? (result.success ? 0 : 1),
      result: result.result ?? undefined,
      error: result.error ?? undefined,
    });
    if (!result.success) {
      await context.idempotency.release(claim.key);
    }

    console.log(
      `[Worker ${context.workerId}] Task '${taskId}' ${
        result.success ? 'completed' : 'failed'
      } in ${result.duration}ms`,
    );
  } catch (error) {
    if (claim?.claimed) {
      await context.idempotency.release(claim.key);
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
  }
}

function getTraceHeaders(
  message: JobMessage,
  tracedContext?: TracedMessageContext,
): Record<string, string> {
  const messageWithTrace = message as typeof message & {
    headers?: Record<string, string>;
    traceparent?: string;
    tracestate?: string;
  };

  const traceHeaders: Record<string, string> = {
    ...(tracedContext?.headers ?? {}),
    ...(messageWithTrace.headers ?? {}),
  };
  if (messageWithTrace.traceparent && !traceHeaders['traceparent']) {
    traceHeaders['traceparent'] = messageWithTrace.traceparent;
  }
  if (messageWithTrace.tracestate && !traceHeaders['tracestate']) {
    traceHeaders['tracestate'] = messageWithTrace.tracestate;
  }
  return traceHeaders;
}

async function recordJobFailure(
  context: WorkerDispatchContext,
  message: JobMessage,
  executionId: string | undefined,
  error: unknown,
): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const isTimeout = errorMessage.includes('timeout') || errorMessage.includes('Timeout');
  const status = isTimeout ? 'timeout' : 'failed';
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
