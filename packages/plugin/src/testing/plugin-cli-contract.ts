import type { PluginCli } from '../cli/mod.ts';

/** Run the shared plugin CLI contract against a CLI instance. */
export function runPluginCliContract(cli: PluginCli): boolean {
  return cli.name.length > 0 && cli.description.length > 0;
}
