/**
 * Sagas plugin-owned scaffold entrypoint.
 *
 * Composes the shared {@linkcode createPluginScaffold} factory with the sagas userland
 * {@linkcode buildArtifacts} and the real-filesystem port, then runs it over the `--context-json`
 * argv contract via {@linkcode runScaffoldCli}. All scaffold mechanics (argv parsing, write
 * planning, dry-run, result serialization) live in `@netscript/plugin/scaffold`; this module only
 * wires the sagas-specific artifact builder.
 *
 * @module
 */

import {
  createDenoFileSystem,
  createPluginScaffold,
  type PluginScaffoldEntrypoint,
  runScaffoldCli,
} from '@netscript/plugin/scaffold';
import { buildArtifacts } from './scaffolder.ts';

/** Sagas `./scaffold` entrypoint: emits only userland glue, never plugin source. */
export const scaffold: PluginScaffoldEntrypoint = createPluginScaffold({
  fileSystem: createDenoFileSystem(),
  buildArtifacts,
});

if (import.meta.main) {
  await runScaffoldCli({ entrypoint: scaffold });
}
