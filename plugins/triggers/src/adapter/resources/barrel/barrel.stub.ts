/** Type-checked source stub for the generated triggers barrel.
 *
 * @module
 */

import { defineStub, type StubSource } from '@netscript/plugin/adapter';

/** Type-checked triggers barrel stub with named substitution tokens. */
export const barrelStub: StubSource<
  | 'FILE_WATCH_EXPORT'
  | 'FILE_WATCH_FILE'
  | 'SCHEDULED_EXPORT'
  | 'SCHEDULED_FILE'
  | 'WEBHOOK_EXPORT'
  | 'WEBHOOK_FILE'
> = defineStub({
  source: `export { %%WEBHOOK_EXPORT%% } from './%%WEBHOOK_FILE%%.ts';
export { %%SCHEDULED_EXPORT%% } from './%%SCHEDULED_FILE%%.ts';
export { %%FILE_WATCH_EXPORT%% } from './%%FILE_WATCH_FILE%%.ts';
`,
  tokens: [
    'FILE_WATCH_EXPORT',
    'FILE_WATCH_FILE',
    'SCHEDULED_EXPORT',
    'SCHEDULED_FILE',
    'WEBHOOK_EXPORT',
    'WEBHOOK_FILE',
  ] as const,
});
