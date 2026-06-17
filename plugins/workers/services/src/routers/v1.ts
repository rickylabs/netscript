import { adminHandlers } from './admin.ts';
import { jobHandlers } from './jobs.ts';
import { executionHandlers } from './runs.ts';
import { subscribeHandlers } from './subscribe.ts';
import { taskHandlers } from './tasks.ts';

export const workersV1: Record<string, unknown> = {
  ...jobHandlers,
  ...executionHandlers,
  ...taskHandlers,
  ...adminHandlers,
  ...subscribeHandlers,
};
