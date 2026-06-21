import { createQueue, type MessageContext } from '@netscript/queue';
import {
  DEFAULT_TOPIC,
  type JobDefinition,
  type JobMessage,
  type TaskMessage,
} from '@netscript/plugin-workers-core/runtime';
import type { TracedMessageContext, TracedQueue } from '@netscript/telemetry/instrumentation';
import type {
  QueueTriggerConfig,
  WorkerDispatchContext,
  WorkerQueueContext,
} from './worker-options.ts';
import { processWorkerTask } from './job-dispatcher.ts';
import { WorkerListenerSupervisor } from './listener-supervisor.ts';

/** Start listeners for queue-triggered jobs. */
export async function startQueueTriggerListeners(
  context: WorkerQueueContext,
): Promise<WorkerListenerSupervisor[]> {
  const supervisors: WorkerListenerSupervisor[] = [];
  for (const config of context.queueTriggers) {
    const jobDef = await context.registry.get(config.jobId);
    if (!jobDef) {
      console.warn(
        `[Worker ${context.workerId}] Queue trigger job '${config.jobId}' not found, skipping`,
      );
      continue;
    }

    console.log(
      `[Worker ${context.workerId}] Setting up queue trigger: ${config.queueName} -> ${config.jobId}`,
    );

    const triggerQueue = createQueue<unknown>(config.queueName) as TracedQueue<unknown>;
    context.triggerQueues.push(triggerQueue);

    const supervisor = createListenerSupervisor(
      context,
      `trigger:${config.queueName}`,
      (signal) => listenToTriggerQueue(context, triggerQueue, config, jobDef, signal),
    );
    supervisors.push(supervisor);
    supervisor.start();
  }
  return supervisors;
}

/** Start the polyglot task queue listener. */
export function startTaskQueueListener(
  queueContext: WorkerQueueContext,
  dispatchContext: WorkerDispatchContext,
): WorkerListenerSupervisor {
  const taskQueue = createQueue<TaskMessage>('tasks');
  queueContext.setTaskQueue(taskQueue);
  const supervisor = createListenerSupervisor(queueContext, 'task:tasks', (signal) => {
    return taskQueue.listen(
      async (message, context) => {
        try {
          await processWorkerTask(dispatchContext, message, context);
        } catch (error) {
          console.error(
            `[Worker ${queueContext.workerId}] Unexpected error processing task '${message.taskId}':`,
            error instanceof Error ? error.message : String(error),
          );
        }
      },
      { signal },
    );
  });
  supervisor.start();
  return supervisor;
}

function createListenerSupervisor(
  context: WorkerQueueContext,
  name: string,
  run: (signal: AbortSignal) => Promise<void>,
): WorkerListenerSupervisor {
  return new WorkerListenerSupervisor({
    name,
    abortSignal: context.abortController?.signal,
    maxRestarts: context.listenerMaxRestarts,
    initialBackoffMs: context.listenerInitialBackoffMs,
    maxBackoffMs: context.listenerMaxBackoffMs,
    run,
    onFailure: (error, snapshot) => {
      context.reportListenerFailure(name, error, snapshot);
    },
  });
}

async function listenToTriggerQueue(
  context: WorkerQueueContext,
  queue: TracedQueue<unknown>,
  config: QueueTriggerConfig,
  jobDef: JobDefinition,
  signal: AbortSignal,
): Promise<void> {
  await queue.listen(
    async (message, queueContext) => {
      let validatedMessage = message;
      if (config.schema) {
        try {
          validatedMessage = config.schema.parse(message);
        } catch (error) {
          console.error(
            `[Worker ${context.workerId}] Invalid message on '${config.queueName}':`,
            error,
          );
          return;
        }
      }

      const jobMessage: JobMessage = {
        jobId: config.jobId,
        topic: jobDef.topic ?? DEFAULT_TOPIC,
        triggeredBy: 'queue',
        triggeredAt: new Date().toISOString(),
        payload: validatedMessage as Record<string, unknown>,
        priority: 50,
      };

      await context.processJob(
        jobMessage,
        queueContext as MessageContext,
        queueContext as TracedMessageContext,
      );
    },
    {
      concurrency: config.concurrency ?? 1,
      signal,
    },
  );
}
