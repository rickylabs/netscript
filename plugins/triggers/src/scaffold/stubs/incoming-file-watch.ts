/**
 * Sample file-watch trigger emitted into a user workspace at `triggers/incoming-file-watch.ts`.
 *
 * This file is shipped as a real, type-checked stub inside `@netscript/plugin-triggers` and is
 * copied verbatim into the user's workspace by `plugin add triggers`. The user owns and edits it;
 * the scaffolder never rewrites it after the first scaffold. Keep it minimal, dependency-direction
 * clean (import only the published runtime core `@netscript/plugin-triggers-core/builders`), and
 * free of scaffold-time tokens so it can be emitted with no interpolation.
 *
 * @module
 */

import { defineFileWatch } from '@netscript/plugin-triggers-core/builders';
import type {
  FileWatchDefinition,
  FileWatchTriggerPayload,
  TriggerContext,
  TriggerEvent,
} from '@netscript/plugin-triggers-core/domain';

/**
 * A starter file-watch trigger. Replace the handler body with your own ingestion logic; the
 * `default` export and the `@netscript/plugin-triggers-core` import are all the triggers runtime
 * needs to discover and run it.
 */
export const incomingFileWatchTrigger: FileWatchDefinition<
  'incoming-file-watch',
  TriggerEvent<'file-watch', FileWatchTriggerPayload>,
  TriggerContext
> = defineFileWatch(
  // deno-lint-ignore require-await -- starter handler; the runtime contract is async.
  async () => {
    return [];
  },
  {
    id: 'incoming-file-watch' as const,
    paths: ['./shared/incoming'],
    patterns: ['*.json', '*.csv'],
    ignored: ['*.tmp', '.*'],
    on: ['create'],
    debounceMs: 2_000,
    stabilityThreshold: { checkIntervalMs: 1_000, stableChecks: 3 },
  },
);

export default incomingFileWatchTrigger;
