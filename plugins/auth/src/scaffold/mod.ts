/** Auth plugin-owned scaffold entrypoint. */
import { runScaffoldCli, toEntrypoint } from '@netscript/plugin/scaffold';
import type { PluginScaffoldEntrypoint } from '@netscript/plugin/scaffold';

import { AuthScaffolder } from './scaffolder.ts';

/** Scaffold the auth plugin artifacts into a NetScript workspace. */
export const scaffold: PluginScaffoldEntrypoint = toEntrypoint(AuthScaffolder);

if (import.meta.main) {
  await runScaffoldCli(scaffold);
}
