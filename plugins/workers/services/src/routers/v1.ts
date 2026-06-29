import { adminHandlers } from './admin.ts';
import { describeHandlers } from './describe.ts';
import { jobHandlers } from './jobs.ts';
import { executionHandlers } from './runs.ts';
import { subscribeHandlers } from './subscribe.ts';
import { taskHandlers } from './tasks.ts';
import type { WorkersHandlers } from './router-context.ts';

/**
 * Every v1 route key the workers contract exposes (minus the implementer
 * helpers). The assembled `workersV1` map is the union of the per-resource
 * handler maps, so its precise type is `WorkersHandlers` over all route keys —
 * an explicit annotation that keeps per-route precision while satisfying JSR
 * `--isolatedDeclarations` for this exported, cross-module const.
 */
type WorkersV1RouteKey =
  | 'describe'
  | 'listJobs'
  | 'getJob'
  | 'createJob'
  | 'updateJob'
  | 'deleteJob'
  | 'triggerJob'
  | 'listExecutions'
  | 'getExecution'
  | 'batchQueryExecutions'
  | 'listExecutionsByCorrelationId'
  | 'listTasks'
  | 'getTask'
  | 'triggerTask'
  | 'listTaskExecutions'
  | 'getTaskExecution'
  | 'cleanup'
  | 'cleanupDbExecutions'
  | 'archiveExecutions'
  | 'seed'
  | 'subscribe'
  | 'listTopics';

export const workersV1: WorkersHandlers<WorkersV1RouteKey> = {
  ...describeHandlers,
  ...jobHandlers,
  ...executionHandlers,
  ...taskHandlers,
  ...adminHandlers,
  ...subscribeHandlers,
};
