/** Workers plugin-owned scaffold entrypoint. */
import { runScaffoldCli, toEntrypoint } from '@netscript/plugin/scaffold';
import type { PluginScaffoldEntrypoint } from '@netscript/plugin/scaffold';

import { WorkersScaffolder } from './scaffolder.ts';

/** Scaffold the workers plugin artifacts into a NetScript workspace. */
export const scaffold: PluginScaffoldEntrypoint = toEntrypoint(WorkersScaffolder);

if (import.meta.main) {
  await runScaffoldCli(scaffold);
}
