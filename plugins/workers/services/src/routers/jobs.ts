import { DEFAULT_TOPIC, type JobMessage } from '@netscript/plugin-workers-core/runtime';
import { notFound } from '@shared/utils';
import { getJobQueue, getWorkersRuntime, router } from './router-context.ts';

export const jobHandlers = {
  listJobs: router.listJobs.handler(async ({ input, context }) => {
    const { limit, offset, enabled, scheduled, source, pluginId, tags } = input;
    const { jobRegistry: registry } = getWorkersRuntime(context);

    const allJobs = await registry.list({
      enabled: enabled !== undefined ? enabled : undefined,
      scheduled: scheduled !== undefined ? scheduled : undefined,
      source: source as 'local' | 'plugin' | 'database' | 'remote' | undefined,
      pluginId,
      tags: tags?.split(','),
    });

    const validExecutionTypes = new Set(['deno', 'wrapper']);
    const validJobs = allJobs.filter((job) => validExecutionTypes.has(job.executionType));

    const paginatedJobs = validJobs.slice(offset, offset + limit);

    return {
      jobs: paginatedJobs,
      total: validJobs.length,
      offset,
      limit,
    };
  }),

  getJob: router.getJob.handler(async ({ input, errors, path, context }) => {
    const { jobRegistry: registry } = getWorkersRuntime(context);
    const job = await registry.get(input.id);

    if (!job) {
      notFound({ errors, path, resourceId: input.id });
    }

    return job;
  }),

  createJob: router.createJob.handler(async ({ input, context }) => {
    const { jobRegistry: registry } = getWorkersRuntime(context);
    const executionId = input.id ?? crypto.randomUUID();
    const job = await registry.registerJob({
      ...input,
      id: executionId,
      topic: input.topic || DEFAULT_TOPIC,
      source: 'database',
      executionType: 'deno',
      retryDelay: 1000,
      maxConcurrency: 1,
      persist: true,
    });

    return job;
  }),

  updateJob: router.updateJob.handler(async ({ input, errors, path, context }) => {
    const { id, ...updates } = input;
    const { jobRegistry: registry } = getWorkersRuntime(context);

    const jobId = id!;

    const existing = await registry.get(jobId);
    if (!existing) {
      notFound({ errors, path, resourceId: jobId });
    }

    const job = await registry.update(jobId, updates);
    return job;
  }),

  deleteJob: router.deleteJob.handler(async ({ input, errors, path, context }) => {
    const { jobRegistry: registry } = getWorkersRuntime(context);
    const deleted = await registry.unregister(input.id);

    if (!deleted) {
      notFound({ errors, path, resourceId: input.id });
    }

    return { id: input.id, deleted: true };
  }),

  triggerJob: router.triggerJob.handler(async ({ input, errors, path, context }) => {
    const { jobRegistry: registry } = getWorkersRuntime(context);
    const job = await registry.get(input.id);

    if (!job) {
      notFound({ errors, path, resourceId: input.id });
    }

    const traceHeaders =
      (context as { traceHeaders?: { traceparent?: string; tracestate?: string } })?.traceHeaders;

    const jobMessage: JobMessage = {
      jobId: input.id,
      topic: job.topic ?? DEFAULT_TOPIC,
      triggeredBy: 'api',
      triggeredAt: new Date().toISOString(),
      payload: input.payload,
      priority: input.priority ?? 50,
      correlationId: input.correlationId,
      traceparent: input.traceparent ?? traceHeaders?.traceparent,
      tracestate: input.tracestate ?? traceHeaders?.tracestate,
    };

    const queue = getJobQueue();
    await queue.enqueue(jobMessage, {
      delay: input.delay,
      priority: input.priority,
      headers: traceHeaders
        ? {
          ...(traceHeaders.traceparent ? { traceparent: traceHeaders.traceparent } : {}),
          ...(traceHeaders.tracestate ? { tracestate: traceHeaders.tracestate } : {}),
        }
        : undefined,
    });

    return { jobId: input.id, triggered: true };
  }),
};
