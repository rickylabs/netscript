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
import { z } from 'zod';

const PayloadSchema = z.object({}).passthrough();
type Payload = z.infer<typeof PayloadSchema>;

/**
 * Starter workers job handler for %%JOB_ID%%.
 */
export const %%JOB_EXPORT%%: (
  context: JobHandlerContext<Payload>,
) => JobResult | Promise<JobResult> = defineJobHandler((context) => {
  const payload = PayloadSchema.parse(context.payload);

  return createSuccessResult({
    jobId: '%%JOB_ID%%',
    payload,
  });
});
`,
  tokens: ['JOB_ID', 'JOB_EXPORT'] as const,
});
