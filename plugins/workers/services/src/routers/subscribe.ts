import { withEventMeta } from '@orpc/server';
import {
  DEFAULT_TOPIC,
  type ExecutionRecord,
  SSEEventTypes,
} from '@netscript/plugin-workers-core/runtime';
import { getKv } from '@netscript/kv';
import { getWorkersRuntime, router, type WorkersHandlers } from './router-context.ts';

export const subscribeHandlers: WorkersHandlers<'subscribe' | 'listTopics'> = {
  subscribe: router.subscribe.handler(async function* (
    { input, lastEventId, signal, context },
  ) {
    const { executionState: execState, jobRegistry, taskRegistry } = getWorkersRuntime(context);
    const kv = await getKv();
    let eventId = lastEventId ? parseInt(lastEventId, 10) : 0;
    const topicFilter = input?.topic;
    const jobIdFilter = input?.jobId;
    const concept = input?.concept || 'job';

    yield withEventMeta(
      {
        type: SSEEventTypes.heartbeat,
        data: { connected: true, topic: topicFilter || 'all', concept },
        timestamp: new Date().toISOString(),
      },
      { id: String(++eventId), retry: 5000 },
    );

    if (concept === 'task') {
      const tasks = await taskRegistry.list();
      const filteredTasks = topicFilter
        ? tasks.filter((t) => (t.topic || DEFAULT_TOPIC) === topicFilter)
        : tasks;
      yield withEventMeta(
        {
          type: SSEEventTypes.tasks,
          data: { tasks: filteredTasks },
          timestamp: new Date().toISOString(),
        },
        { id: String(++eventId), retry: 5000 },
      );
    } else {
      const jobs = await jobRegistry.list();
      const filteredJobs = topicFilter
        ? jobs.filter((j) => (j.topic || DEFAULT_TOPIC) === topicFilter)
        : jobs;
      yield withEventMeta(
        {
          type: SSEEventTypes.jobs,
          data: { jobs: filteredJobs },
          timestamp: new Date().toISOString(),
        },
        { id: String(++eventId), retry: 5000 },
      );
    }

    let executions = topicFilter
      ? await execState.listByTopic(topicFilter, { limit: 100, concept })
      : await execState.listAll({ limit: 100, concept });

    if (jobIdFilter) {
      executions = executions.filter((e) => e.jobId === jobIdFilter);
    }

    yield withEventMeta(
      {
        type: SSEEventTypes.executions,
        data: { executions },
        timestamp: new Date().toISOString(),
      },
      { id: String(++eventId), retry: 5000 },
    );

    const watchPrefix = ['__kvdex__', 'executions', '__id__'] as const;

    const HEARTBEAT_INTERVAL = 30000;
    let lastHeartbeat = Date.now();

    try {
      for await (
        const event of kv.watchPrefix<ExecutionRecord>(watchPrefix, {
          signal,
          skipInitial: true,
          pollInterval: 500,
        })
      ) {
        if (signal?.aborted) break;

        const execution = event.value;
        if (!execution) continue;

        if (concept && execution.concept !== concept) continue;
        if (topicFilter && (execution.topic ?? DEFAULT_TOPIC) !== topicFilter) continue;
        if (jobIdFilter && execution.jobId !== jobIdFilter) continue;

        const sseEventType = event.type === 'delete'
          ? SSEEventTypes.executionDeleted
          : SSEEventTypes.executionUpdated;

        yield withEventMeta(
          {
            type: sseEventType,
            data: execution,
            timestamp: new Date().toISOString(),
            id: execution.id,
          },
          { id: String(++eventId), retry: 5000 },
        );

        const now = Date.now();
        if (now - lastHeartbeat >= HEARTBEAT_INTERVAL) {
          yield withEventMeta(
            {
              type: SSEEventTypes.heartbeat,
              data: { timestamp: new Date().toISOString() },
              timestamp: new Date().toISOString(),
            },
            { id: String(++eventId), retry: 5000 },
          );
          lastHeartbeat = now;
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      throw error;
    }
  }),

  listTopics: router.listTopics.handler(async ({ context }) => {
    const { executionState: execState, jobRegistry } = getWorkersRuntime(context);

    const allJobs = await jobRegistry.list();
    const allExecutions = await execState.listAll({ limit: 1000 });

    const topicStats = new Map<string, { jobCount: number; executionCount: number }>();

    for (const job of allJobs) {
      const topic = job.topic || DEFAULT_TOPIC;
      const stats = topicStats.get(topic) || { jobCount: 0, executionCount: 0 };
      stats.jobCount++;
      topicStats.set(topic, stats);
    }

    for (const exec of allExecutions) {
      const topic = exec.topic || DEFAULT_TOPIC;
      const stats = topicStats.get(topic) || { jobCount: 0, executionCount: 0 };
      stats.executionCount++;
      topicStats.set(topic, stats);
    }

    const topics = Array.from(topicStats.entries()).map(([topic, stats]) => ({
      topic,
      jobCount: stats.jobCount,
      executionCount: stats.executionCount,
    }));

    return { topics };
  }),
};
