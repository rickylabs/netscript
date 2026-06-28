/** Options used when validating a plugin scaffold package name. */
export interface ReadScaffoldPluginNameOptions {
  /** Display name used in the thrown validation error. */
  readonly scaffolderName: string;
}

/**
 * Read and validate the common `options.pluginName` scaffold option.
 *
 * @param options - Scaffold options object supplied by the installer.
 * @param config - Error-message context for the calling plugin scaffolder.
 * @returns The validated kebab-case plugin package name.
 * @throws Error when `options.pluginName` is missing or not kebab-case.
 *
 * @example
 * ```ts
 * import { readScaffoldPluginName } from "@netscript/plugin/scaffold";
 *
 * const pluginName = readScaffoldPluginName(
 *   { pluginName: "workers" },
 *   { scaffolderName: "Workers" },
 * );
 * ```
 */
export function readScaffoldPluginName(
  options: Readonly<Record<string, unknown>>,
  config: ReadScaffoldPluginNameOptions,
): string {
  const pluginName = Reflect.get(options, 'pluginName');
  if (typeof pluginName !== 'string' || !/^[a-z][a-z0-9-]*$/.test(pluginName)) {
    throw new Error(
      `${config.scaffolderName} scaffolder requires a kebab-case options.pluginName.`,
    );
  }
  return pluginName;
}
