import { type PluginManifest, validatePluginComposition } from '../../config/mod.ts';
import { PluginCompositionError } from '../../domain/mod.ts';

/** Result of bootstrapping plugin host state. */
export interface PluginHostBootstrap {
  /** Plugin manifests loaded into the host snapshot. */
  readonly plugins: readonly PluginManifest[];
}

/**
 * Create a plugin host bootstrap snapshot from a validated root composition.
 *
 * Every host, including background-only processes, bootstraps through the same
 * `validatePluginComposition` check the CLI generator runs.
 *
 * @throws {PluginCompositionError} When the manifests do not compose into one root host.
 */
export function createPluginHostBootstrap(
  plugins: readonly PluginManifest[],
): PluginHostBootstrap {
  const result = validatePluginComposition(plugins);
  if (!result.ok) throw new PluginCompositionError(result.diagnostics);
  return { plugins: result.composition.plugins };
}
