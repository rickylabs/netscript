/** Type-checked source stub for generated workers job handlers.
 *
 * @module
 */

import { defineStub, type StubSource } from '@netscript/plugin/adapter';

/** Type-checked workers job handler stub with named substitution tokens. */
export const sampleHealthCheckStub: StubSource<'JOB_ID' | 'JOB_EXPORT'> = defineStub({
  source: `import {
  createSuccessResult,
  defineJobHandler,
  type JobHandlerDefinition,
} from '@netscript/plugin-workers-core';
import { z } from 'zod';

const PayloadSchema = z.object({}).passthrough().default({});
type Payload = z.infer<typeof PayloadSchema>;
type SampleHandler = JobHandlerDefinition<Payload> & Readonly<{ scaffoldSample: true }>;

/**
 * Starter workers job handler for %%JOB_ID%%.
 */
export const %%JOB_EXPORT%%: SampleHandler = Object
  .assign(
    defineJobHandler(
      PayloadSchema,
      async (context) => {
        await context.reportProgress?.(50, 'Checking worker context');
        const entries = [];
        for await (const entry of Deno.readDir('.')) {
          entries.push(entry.name);
          if (entries.length >= 3) break;
        }
        await context.reportProgress?.(100, 'Workspace checked');
        return createSuccessResult({
          jobId: '%%JOB_ID%%',
          payload: context.payload,
          workspaceEntries: entries.length,
        });
      },
    ),
    { scaffoldSample: true as const },
  );

export default %%JOB_EXPORT%%;
`,
  tokens: ['JOB_ID', 'JOB_EXPORT'] as const,
});
