/** Type-checked source stub for generated file-watch triggers.
 *
 * @module
 */

import { defineStub, type StubSource } from '@netscript/plugin/adapter';

/** Type-checked file-watch trigger stub with named substitution tokens. */
export const fileWatchStub: StubSource<
  'IGNORED' | 'PATHS' | 'PATTERNS' | 'TRIGGER_EXPORT' | 'TRIGGER_ID'
> = defineStub({
  source: `import { defineFileWatch } from '@netscript/plugin-triggers-core/builders';
import type {
  FileWatchDefinition,
  FileWatchTriggerPayload,
  TriggerContext,
  TriggerEvent,
} from '@netscript/plugin-triggers-core/domain';

/**
 * Starter file-watch trigger for %%TRIGGER_ID%%.
 */
export const %%TRIGGER_EXPORT%%: FileWatchDefinition<
  '%%TRIGGER_ID%%',
  TriggerEvent<'file-watch', FileWatchTriggerPayload>,
  TriggerContext
> = defineFileWatch(
  // deno-lint-ignore require-await -- starter handler; the runtime contract is async.
  async () => {
    return [];
  },
  {
    id: '%%TRIGGER_ID%%',
    paths: %%PATHS%%,
    patterns: %%PATTERNS%%,
    ignored: %%IGNORED%%,
    on: ['create'],
    debounceMs: 2_000,
    stabilityThreshold: { checkIntervalMs: 1_000, stableChecks: 3 },
  },
);

export default %%TRIGGER_EXPORT%%;
`,
  tokens: ['IGNORED', 'PATHS', 'PATTERNS', 'TRIGGER_EXPORT', 'TRIGGER_ID'] as const,
});
