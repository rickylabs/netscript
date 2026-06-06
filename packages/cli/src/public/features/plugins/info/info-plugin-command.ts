/**
 * @module
 *
 * Public `netscript plugin info <name>` command.
 *
 * F-9 permissions: this command dispatches through the process port and the
 * public CLI binary requires `--allow-run=deno` for plugin subprocesses.
 */

import type { Command } from '@cliffy/command';

import {
  createPluginVerbCommand,
  type PluginVerbCommandDependencies,
} from '../dispatch/plugin-verb-command.ts';

/** Dependencies for the public plugin info command. */
export type InfoPluginCommandDependencies = Omit<PluginVerbCommandDependencies, 'verb'>;

/** Create the public `plugin info` command. */
export function createInfoPluginCommand(dependencies: InfoPluginCommandDependencies): Command<any, any, any, any, any, any, any, any> {
  return createPluginVerbCommand({
    ...dependencies,
    verb: 'info',
  });
}
