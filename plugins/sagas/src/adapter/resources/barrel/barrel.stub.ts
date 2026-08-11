/** Type-checked source stub for the generated sagas barrel.
 *
 * @module
 */

import { defineStub, type StubSource } from '@netscript/plugin/adapter';

/** Type-checked sagas barrel stub with named substitution tokens. */
export const barrelStub: StubSource<
  'CONFIG_EXPORT' | 'CONFIG_FILE' | 'SAGA_EXPORT' | 'SAGA_FILE'
> = defineStub({
  source: `export { %%SAGA_EXPORT%% } from './%%SAGA_FILE%%.ts';
export { %%CONFIG_EXPORT%% } from './%%CONFIG_FILE%%.ts';
`,
  tokens: ['CONFIG_EXPORT', 'CONFIG_FILE', 'SAGA_EXPORT', 'SAGA_FILE'] as const,
});
