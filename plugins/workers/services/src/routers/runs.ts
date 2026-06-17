import type { ExecutionRecord } from '@netscript/plugin-workers-core/runtime';
import { notFound } from '@netscript/contracts';
import { getWorkersRuntime, router } from './router-context.ts';

type ExecutionStatus =
  | 'pending'
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timeout';

export const executionHandlers: Record<string, unknown> = {
  listExecutions: router.listExecutions.handler(async ({ input, context }) => {
    const { limit, jobId, status, topic } = input;
    const { executionState: state, jobRegistry: registry } = getWorkersRuntime(context);

    let executions: ExecutionRecord[];

    if (jobId && topic) {
      executions = await state.listByJob(jobId, { limit });
    } else if (topic) {
      executions = await state.listByTopic(topic, { limit });
    } else if (jobId) {
      await registry.get(jobId);
      executions = await state.listByJob(jobId, { limit });
    } else if (status) {
      executions = await state.listByStatus(status as ExecutionStatus, { limit });
    } else {
      executions = await state.listAll({ limit });
    }

    const mappedExecutions = executions.map((exec) => ({
      ...exec,
      executionId: exec.id,
    }));

    let total = 0;
    if (jobId && topic) {
      total = await state.countByJob(jobId);
    } else if (topic) {
      total = await state.countByTopic(topic);
    } else if (jobId) {
      await registry.get(jobId);
      total = await state.countByJob(jobId);
    } else if (status) {
      total = await state.countByStatus(status as ExecutionStatus);
    } else {
      total = await state.countAll();
    }

    return {
      executions: mappedExecutions,
      total,
      limit,
    };
  }),

  getExecution: router.getExecution.handler(async ({ input, errors, path, context }) => {
    const { executionState: state } = getWorkersRuntime(context);
    const execution = await state.get(input.executionId);

    if (!execution) {
      notFound({ errors, path, resourceId: input.executionId });
    }

    return {
      ...execution,
      executionId: execution.id,
    };
  }),

  batchQueryExecutions: router.batchQueryExecutions.handler(async ({ input, context }) => {
    const { jobId, triggeredAfter, triggeredBefore, correlationIds, limit } = input;
    const { executionState: state } = getWorkersRuntime(context);

    const afterMs = triggeredAfter
      ? typeof triggeredAfter === 'number' ? triggeredAfter : new Date(triggeredAfter).getTime()
      : 0;
    const beforeMs = triggeredBefore
      ? typeof triggeredBefore === 'number' ? triggeredBefore : new Date(triggeredBefore).getTime()
      : Date.now() + 60000;

    const correlationIdSet = correlationIds ? new Set(correlationIds) : null;
    const allExecutions = await state.listByJob(jobId, { limit: 1000 });

    const matchingExecutions: Array<{
      id: string;
      executionId: string;
      concept: ExecutionRecord['concept'];
      jobId: string;
      topic: string;
      status: ExecutionRecord['status'];
      triggeredBy: ExecutionRecord['triggeredBy'];
      triggeredAt: string;
      startedAt: string | null;
      completedAt: string | null;
      duration: number | null;
      error: string | null;
      result: Record<string, unknown> | null;
      attempt: number;
      maxAttempts: number;
      payload?: Record<string, unknown>;
    }> = [];

    for (const exec of allExecutions) {
      const triggeredAt = new Date(exec.triggeredAt).getTime();
      if (triggeredAt < afterMs || triggeredAt > beforeMs) {
        continue;
      }

      const payload = exec.payload as Record<string, unknown> | undefined;

      if (correlationIdSet) {
        const correlationId = payload?._benchmarkCorrelationId as string | undefined;

        if (!correlationId || !correlationIdSet.has(correlationId)) {
          continue;
        }
      }

      matchingExecutions.push({
        id: exec.id,
        executionId: exec.id,
        concept: exec.concept,
        jobId: exec.jobId,
        topic: exec.topic,
        status: exec.status,
        triggeredBy: exec.triggeredBy,
        triggeredAt: exec.triggeredAt,
        startedAt: exec.startedAt,
        completedAt: exec.completedAt,
        duration: exec.duration,
        error: exec.error,
        result: exec.result,
        attempt: exec.attempt,
        maxAttempts: exec.maxAttempts,
        payload,
      });

      if (matchingExecutions.length >= limit) {
        break;
      }
    }

    return {
      executions: matchingExecutions,
      total: matchingExecutions.length,
    };
  }),

  listExecutionsByCorrelationId: router.listExecutionsByCorrelationId.handler(
    async ({ input, context }) => {
      const { correlationId, limit = 50 } = input;
      const { executionState: state } = getWorkersRuntime(context);

      const executions = await state.listByCorrelation(correlationId, { limit });

      const matchingExecutions = executions.map((exec) => ({
        ...exec,
        executionId: exec.id,
        payload: exec.payload as Record<string, unknown> | undefined,
      }));

      return {
        executions: matchingExecutions,
        total: matchingExecutions.length,
      };
    },
  ),
};
