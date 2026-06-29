import type { PluginCliArgs } from '../cli/mod.ts';
import type { ScaffolderContext } from '../protocol/mod.ts';
import type { NetScriptPlugin, PluginAdapter, PluginCommandConfig } from './contract.ts';
import { createDenoFileSystem, DEFAULT_PLUGIN_WORKSPACE_ROOT } from './defaults.ts';
import { createInstallScaffoldEntrypoint } from './commands/install.ts';
import { runPluginCliCommand } from './runner/plugin-cli-runner.ts';

/**
 * Create the core adapter for a NetScript plugin contract object.
 *
 * @param plugin Plugin contract supplying seams and optional handlers.
 * @returns Adapter with CLI and scaffold entrypoints.
 *
 * @example
 * ```ts
 * const adapter = createPluginAdapter(plugin);
 * export default adapter.toCli();
 * ```
 */
export function createPluginAdapter(plugin: NetScriptPlugin): PluginAdapter {
  return {
    toCli() {
      return async (args: PluginCliArgs) => {
        const fileSystem = createDenoFileSystem();
        return await runPluginCliCommand({
          plugin,
          args,
          context: {
            workspaceRoot: readWorkspaceRoot(args),
            options: {},
            config: readConfig(args),
            dryRun: args.flags?.dryRun === true,
            fileSystem,
          },
        });
      };
    },
    toScaffold() {
      return (context: ScaffolderContext) =>
        createInstallScaffoldEntrypoint(plugin, createDenoFileSystem())(context);
    },
  };
}

function readWorkspaceRoot(args: PluginCliArgs): string {
  const value = args.flags?.workspaceRoot;
  return typeof value === 'string' && value.length > 0 ? value : DEFAULT_PLUGIN_WORKSPACE_ROOT;
}

function readConfig(args: PluginCliArgs): PluginCommandConfig {
  const config: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(args.flags ?? {})) {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      config[key] = value;
    }
  }
  return config;
}
