/** Triggers plugin-owned scaffold entrypoint. */
import { runScaffoldCli, toEntrypoint } from '@netscript/plugin/scaffold';
import type { PluginScaffoldEntrypoint } from '@netscript/plugin/scaffold';

import { TriggersScaffolder } from './scaffolder.ts';

/** Scaffold the triggers plugin artifacts into a NetScript workspace. */
export const scaffold: PluginScaffoldEntrypoint = toEntrypoint(TriggersScaffolder);

if (import.meta.main) {
  await runScaffoldCli(scaffold);
}
