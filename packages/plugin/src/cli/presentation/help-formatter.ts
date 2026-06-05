import type { PluginCliCommand } from '../types.ts';

/** Format command help text for a mounted plugin CLI. */
export function formatPluginHelp(commands: readonly PluginCliCommand[]): string {
  return commands.map((command) => `${command.name} - ${command.description}`).join('\n');
}
