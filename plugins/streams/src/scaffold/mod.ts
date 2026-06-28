/** Streams plugin-owned scaffold entrypoint. */
import { runScaffoldCli, toEntrypoint } from '@netscript/plugin/scaffold';
import type { PluginScaffoldEntrypoint } from '@netscript/plugin/scaffold';

import { StreamsScaffolder } from './scaffolder.ts';

/** Scaffold the streams plugin artifacts into a NetScript workspace. */
export const scaffold: PluginScaffoldEntrypoint = toEntrypoint(StreamsScaffolder);

if (import.meta.main) {
  await runScaffoldCli(scaffold);
}
