import type { PluginCliResult } from '../../cli/mod.ts';
import type { NetScriptPlugin } from '../contract.ts';

/** Input consumed by the mandatory remove command. */
export interface RunRemoveCommandOptions {
  /** Plugin contract supplying remove seams. */
  readonly plugin: NetScriptPlugin;
}

/**
 * Run the core-owned plugin remove algorithm.
 *
 * @param options Plugin contract.
 * @returns CLI result describing removal support.
 *
 * @example
 * ```ts
 * const result = runRemoveCommand({ plugin });
 * console.log(result.message);
 * ```
 */
export function runRemoveCommand(options: RunRemoveCommandOptions): PluginCliResult {
  const strategy = options.plugin.remove?.strategy ?? 'unsupported';
  if (strategy === 'manifest-only') {
    return { code: 0, message: `Remove ${options.plugin.name} from the host plugin manifest.` };
  }

  return {
    code: 1,
    message: options.plugin.remove?.reason ??
      `Remove is not implemented for ${options.plugin.name}.`,
  };
}
