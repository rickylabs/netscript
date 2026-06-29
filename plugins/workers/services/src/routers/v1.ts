import { adminHandlers } from './admin.ts';
import { describeHandlers } from './describe.ts';
import { jobHandlers } from './jobs.ts';
import { executionHandlers } from './runs.ts';
import { subscribeHandlers } from './subscribe.ts';
import { taskHandlers } from './tasks.ts';

export const workersV1: Record<string, unknown> = {
  ...describeHandlers,
  ...jobHandlers,
  ...executionHandlers,
  ...taskHandlers,
  ...adminHandlers,
  ...subscribeHandlers,
};
