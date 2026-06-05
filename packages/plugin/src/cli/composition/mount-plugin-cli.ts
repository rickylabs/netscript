import type { PluginCli } from '../base/plugin-cli.ts';
import type { PluginCliCommand } from '../types.ts';

/** Mount plugin CLI command groups into a flat command list. */
export function mountPluginCli(clis: readonly PluginCli[]): readonly PluginCliCommand[] {
  return clis.flatMap((cli) =>
    cli.commands().map((command) => ({
      ...command,
      name: `${cli.name}:${command.name}`,
    }))
  );
}
