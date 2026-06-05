import type { NetScriptConfig } from '@netscript/config';

/** Configuration shape consumed by the plugin host loader. */
export type PluginHostConfig = NetScriptConfig;

/** Port for loading a NetScript project configuration. */
export interface ConfigLoaderPort {
  /** Load the project configuration from the supplied project root. */
  load(projectRoot: string): Promise<PluginHostConfig>;
}

/** Result of reading plugin declarations from project configuration. */
export interface DiscoverPluginsResult {
  /** Loaded NetScript configuration. */
  readonly config: PluginHostConfig;
  /** Plugin manifest specifiers declared by the project. */
  readonly plugins: readonly string[];
}

/** Resolve plugin declarations from `netscript.config.ts`. */
export async function resolveConfiguredPlugins(
  projectRoot: string,
  configLoader: ConfigLoaderPort,
): Promise<DiscoverPluginsResult> {
  const config = await configLoader.load(projectRoot);
  return {
    config,
    plugins: config.plugins ?? [],
  };
}
