import {
  DEFAULT_TOPIC,
  type ExecutionRecord,
  type TaskMessage,
} from '@netscript/plugin-workers-core/runtime';
import { notFound } from '@netscript/contracts';
import { getTaskQueue, getWorkersRuntime, router } from './router-context.ts';

export const taskHandlers: Record<string, unknown> = {
  listTasks: router.listTasks.handler(async ({ input, context }) => {
    const { limit, type, source, pluginId } = input;
    const { taskRegistry: registry } = getWorkersRuntime(context);

    const tasks = await registry.list({
      type,
      source: source as 'local' | 'plugin' | 'remote' | 'inline' | 'shared' | undefined,
      pluginId,
      limit,
    });

    return {
      tasks: [...tasks],
      total: tasks.length,
      limit,
    };
  }),

  getTask: router.getTask.handler(async ({ input, errors, path, context }) => {
    const { taskRegistry: registry } = getWorkersRuntime(context);
    const task = await registry.get(input.id);

    if (!task) {
      notFound({ errors, path, resourceId: input.id });
    }

    return task;
  }),

  triggerTask: router.triggerTask.handler(async ({ input, errors, path, context }) => {
    const { taskRegistry: registry } = getWorkersRuntime(context);
    const task = await registry.get(input.id);

    if (!task) {
      notFound({ errors, path, resourceId: input.id });
    }

    const taskMessage: TaskMessage = {
      taskId: input.id,
      topic: task.topic ?? DEFAULT_TOPIC,
      triggeredBy: 'api',
      triggeredAt: new Date().toISOString(),
      payload: input.payload,
      priority: input.priority ?? 50,
      correlationId: input.correlationId,
      delay: input.delay,
    };

    const queue = getTaskQueue();
    await queue.enqueue(taskMessage, {
      delay: input.delay,
      priority: input.priority,
    });

    return { taskId: input.id, triggered: true };
  }),

  listTaskExecutions: router.listTaskExecutions.handler(async ({ input, context }) => {
    const { limit, taskId, status, topic } = input;
    const { executionState: state } = getWorkersRuntime(context);

    let executions: ExecutionRecord[];

    if (taskId && topic) {
      executions = await state.listByJob(taskId, { limit, concept: 'task' });
    } else if (taskId) {
      executions = await state.listByJob(taskId, { limit, concept: 'task' });
    } else if (status) {
      executions = await state.listByStatus(status, { limit, concept: 'task' });
    } else {
      executions = await state.listAll({ limit, concept: 'task' });
    }

    const mapped = executions.map((exec) => ({ ...exec, executionId: exec.id }));
    const total = await state.countAll('task');

    return { executions: mapped, total, limit };
  }),

  getTaskExecution: router.getTaskExecution.handler(
    async ({ input, errors, path, context }) => {
      const { executionState: state } = getWorkersRuntime(context);
      const execution = await state.get(input.executionId);

      if (!execution) {
        notFound({ errors, path, resourceId: input.executionId });
      }

      return { ...execution, executionId: execution.id };
    },
  ),
};
