import type { PluginManifest } from '../../config/mod.ts';

/** Result of bootstrapping plugin host state. */
export interface PluginHostBootstrap {
  /** Plugin manifests loaded into the host snapshot. */
  readonly plugins: readonly PluginManifest[];
}

/** Create a plugin host bootstrap snapshot. */
export function createPluginHostBootstrap(
  plugins: readonly PluginManifest[],
): PluginHostBootstrap {
  return { plugins };
}
