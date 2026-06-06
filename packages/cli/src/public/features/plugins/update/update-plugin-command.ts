/**
 * @module
 *
 * Public `netscript plugin update <name>` command.
 *
 * F-9 permissions: this command dispatches through the process port and the
 * public CLI binary requires `--allow-run=deno` for plugin subprocesses.
 */

import type { Command } from '@cliffy/command';

import {
  createPluginVerbCommand,
  type PluginVerbCommandDependencies,
} from '../dispatch/plugin-verb-command.ts';

/** Dependencies for the public plugin update command. */
export type UpdatePluginCommandDependencies = Omit<PluginVerbCommandDependencies, 'verb'>;

/** Create the public `plugin update` command. */
export function createUpdatePluginCommand(dependencies: UpdatePluginCommandDependencies): Command<any, any, any, any, any, any, any, any> {
  return createPluginVerbCommand({
    ...dependencies,
    verb: 'update',
  });
}
