import {
  type PluginComposition,
  PluginCompositionError,
  type PluginManifest,
  validatePluginComposition,
} from '@netscript/plugin/config';
import { ConfigError } from '../../domain/errors/cli-exit-error.ts';

/** Exit code for a configured plugin set that does not compose into one root host. */
export const PLUGIN_COMPOSITION_INVALID_EXIT_CODE = 76;

/**
 * Validate configured plugin manifests with the shared `validatePluginComposition` check.
 *
 * @throws {ConfigError} With the `PluginCompositionError` as `cause` and the structured diagnostics
 * as `context.diagnostics` when the composition is invalid.
 */
export function requireValidPluginComposition(
  plugins: readonly PluginManifest[],
): PluginComposition {
  const result = validatePluginComposition(plugins);
  if (result.ok) return result.composition;

  const error = new PluginCompositionError(result.diagnostics);
  throw new ConfigError(PLUGIN_COMPOSITION_INVALID_EXIT_CODE, error.message, {
    cause: error,
    context: { diagnostics: result.diagnostics },
  });
}

/** Check whether an error came from an invalid plugin composition. */
export function isPluginCompositionFailure(error: unknown): boolean {
  return error instanceof ConfigError && error.cause instanceof PluginCompositionError;
}
