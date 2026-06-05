import type { PluginCliArgs, PluginCliCommand, PluginCliResult } from '../types.ts';

/** Route a command by verb name. */
export async function routeVerb(
  commands: readonly PluginCliCommand[],
  args: PluginCliArgs,
): Promise<PluginCliResult> {
  const command = commands.find((item) => item.name === args.command);
  return command ? await command.run(args) : { code: 1, message: `Unknown verb: ${args.command}` };
}
