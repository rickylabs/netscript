import type { PluginCliArgs, PluginCliCommand, PluginCliResult } from '../types.ts';

/** Run a mounted command list without depending on Cliffy at package level. */
export async function runMountedCommand(
  commands: readonly PluginCliCommand[],
  args: PluginCliArgs,
): Promise<PluginCliResult> {
  const command = commands.find((item) => item.name === args.command);
  if (!command) {
    return { code: 1, message: `Unknown command: ${args.command}` };
  }
  return await command.run(args);
}
