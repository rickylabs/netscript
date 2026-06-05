import type { PluginContext } from '../../domain/mod.ts';

/** Create a minimal plugin context for SDK runtime helpers. */
export function createPluginContext(projectRoot: string): PluginContext {
  return {
    projectRoot,
    pluginRoot: projectRoot,
    isDev: false,
    manifest: {},
    logger: {
      debug: () => undefined,
      info: () => undefined,
      warn: () => undefined,
      error: () => undefined,
    },
  };
}
