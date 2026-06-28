/**
 * Sample workers job emitted into a user workspace at `workers/jobs/health-check.ts`.
 *
 * This file is shipped as a real, type-checked stub inside `@netscript/plugin-workers` and is
 * copied verbatim into the user's workspace by `plugin add workers`. The user owns and edits it;
 * the scaffolder never rewrites it after the first scaffold. Keep it minimal, dependency-direction
 * clean (import only the published runtime core `@netscript/plugin-workers-core`), and free of
 * scaffold-time tokens so it can be emitted with no interpolation.
 *
 * @module
 */

import {
  createSuccessResult,
  defineJobHandler,
  type JobHandlerContext,
  type JobResult,
} from '@netscript/plugin-workers-core';

/**
 * A starter workers job that reports the runtime can execute handlers.
 *
 * Replace the body with your own job logic; the export name and `@netscript/plugin-workers-core`
 * imports are all the workers runtime needs to discover and run it.
 */
export const healthCheckJob: (
  context: JobHandlerContext,
) => JobResult | Promise<JobResult> = defineJobHandler((context) => {
  return createSuccessResult({
    ok: true,
    checkedAt: new Date().toISOString(),
    payload: context.payload,
  });
});
