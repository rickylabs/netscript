/** Type-checked source stub for the generated workers barrel.
 *
 * @module
 */

import { defineStub, type StubSource } from '@netscript/plugin/adapter';

/** Workers background workspace barrel stub. */
export const barrelStub: StubSource<
  'JOB_EXPORT' | 'JOB_FILE' | 'TASK_EXPORT' | 'TASK_FILE'
> = defineStub({
  source: `export { %%JOB_EXPORT%% } from './jobs/%%JOB_FILE%%.ts';
export { %%TASK_EXPORT%% } from './tasks/%%TASK_FILE%%.ts';
`,
  tokens: ['JOB_EXPORT', 'JOB_FILE', 'TASK_EXPORT', 'TASK_FILE'] as const,
});
