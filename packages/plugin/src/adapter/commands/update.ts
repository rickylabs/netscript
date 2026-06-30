import type { PluginCliResult } from '../../cli/mod.ts';
import type { NetScriptPlugin } from '../contract.ts';

/** Input consumed by the mandatory update command. */
export interface RunUpdateCommandOptions {
  /** Plugin contract supplying update seams. */
  readonly plugin: NetScriptPlugin;
}

/**
 * Run the core-owned plugin update algorithm.
 *
 * @param options Plugin contract.
 * @returns CLI result describing the update plan.
 *
 * @example
 * ```ts
 * const result = runUpdateCommand({ plugin });
 * console.log(result.code);
 * ```
 */
export function runUpdateCommand(options: RunUpdateCommandOptions): PluginCliResult {
  const strategy = options.plugin.update?.strategy ?? 'dependency';
  if (strategy === 'none') {
    return { code: 0, message: `${options.plugin.name} does not declare update work.` };
  }

  return {
    code: 0,
    message: `Update ${options.plugin.name} via ${
      options.plugin.update?.targetSpecifier ?? options.plugin.install.dependencySpecifier
    }.`,
  };
}
