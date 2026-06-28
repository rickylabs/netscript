/** Sagas plugin-owned scaffold entrypoint. */
import { runScaffoldCli, toEntrypoint } from '@netscript/plugin/scaffold';
import type { PluginScaffoldEntrypoint } from '@netscript/plugin/scaffold';

import { SagasScaffolder } from './scaffolder.ts';

/** Scaffold the sagas plugin artifacts into a NetScript workspace. */
export const scaffold: PluginScaffoldEntrypoint = toEntrypoint(SagasScaffolder);

if (import.meta.main) {
  await runScaffoldCli(scaffold);
}
