/** Type-checked source stub for generated workers job handlers.
 *
 * @module
 */

import { defineStub, type StubSource } from '@netscript/plugin/adapter';

/** Type-checked workers job handler stub with named substitution tokens. */
export const jobStub: StubSource<'JOB_ID' | 'JOB_EXPORT'> = defineStub({
  source: `import {
  createSuccessResult,
  defineJobHandler,
  type JobHandlerContext,
  type JobResult,
} from '@netscript/plugin-workers-core';

/**
 * Starter workers job handler for %%JOB_ID%%.
 */
export const %%JOB_EXPORT%%: (
  context: JobHandlerContext,
) => JobResult | Promise<JobResult> = defineJobHandler((context) => {
  return createSuccessResult({
    jobId: '%%JOB_ID%%',
    payload: context.payload,
  });
});
`,
  tokens: ['JOB_ID', 'JOB_EXPORT'] as const,
});
