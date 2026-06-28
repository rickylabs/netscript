/**
 * Auth plugin-owned scaffold entrypoint.
 *
 * Composes the shared {@linkcode createPluginScaffold} factory with the auth userland
 * {@linkcode buildArtifacts} and the real-filesystem port, then runs it over the `--context-json`
 * argv contract via {@linkcode runScaffoldCli}. All scaffold mechanics (argv parsing, write planning,
 * dry-run, result serialization) live in `@netscript/plugin/scaffold`; this module only wires the
 * auth-specific artifact builder.
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

/** Auth `./scaffold` entrypoint: emits only userland glue, never plugin source. */
export const scaffold: PluginScaffoldEntrypoint = createPluginScaffold({
  fileSystem: createDenoFileSystem(),
  buildArtifacts,
});

if (import.meta.main) {
  await runScaffoldCli({ entrypoint: scaffold });
}
