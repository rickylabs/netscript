import {
  createFailureResult,
  createSuccessResult,
  defineJob,
} from '@netscript/plugin-workers-core';
import { defineTask } from '@netscript/plugin-workers-core/builders';
import { createDefaultTaskExecutor } from '@netscript/plugin-workers-core/executor';
import { defineScheduledTrigger, enqueueJob } from '@netscript/plugin-triggers-core';

const normalize = defineTask('normalize-erp')
  .runtime('python')
  .entrypoint('./workers/scripts/normalize.py')
  .args('--input', '.data/incoming/export.csv')
  .timeout(60_000)
  .build();
const executor = createDefaultTaskExecutor();

export const sync = defineJob('sync-erp')
  .handler(async () => {
    const result = await executor.execute(normalize);
    return result.success
      ? createSuccessResult(result.result)
      : createFailureResult(result.error ?? 'Normalization failed');
  })
  .retry(2)
  .build();

export const schedule = defineScheduledTrigger(
  () => Promise.resolve([enqueueJob(sync)]),
  { id: 'nightly-erp', cron: '0 2 * * *', timezone: 'UTC' },
);
