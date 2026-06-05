/** Public API for resolving Aspire manifest env vars during Windows deployment. */
import type { CompileTarget } from '../../../domain/deploy/compile-target.ts';
import type { InfrastructureConfig } from '../../../domain/infrastructure-config.ts';
import { loadAspireManifest } from './manifest-loader.ts';
import { buildPlaceholderLookup, resolvePlaceholders } from './manifest-placeholders.ts';
import type { AspireManifest } from './manifest-types.ts';

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Pre-built context for resolving manifest env vars — built once per deployment
 * build and shared across all targets.
 */
export interface ManifestContext {
  manifest: AspireManifest;
  lookup: Record<string, string>;
}

/**
 * Build the manifest context for a deployment build.
 * Returns null if the manifest file is not found (graceful fallback to hardcoded logic).
 */
export async function buildManifestContext(
  projectRoot: string,
  infra: InfrastructureConfig,
  connectionStrings: Record<string, string>,
  allTargets: CompileTarget[],
): Promise<ManifestContext | null> {
  const manifest = await loadAspireManifest(projectRoot);
  if (!manifest) return null;

  const lookup = buildPlaceholderLookup(manifest, infra, connectionStrings, allTargets);
  return { manifest, lookup };
}

/**
 * Resolve env vars from the Aspire manifest for a single compile target.
 *
 * Returns the full env var map with all placeholders replaced by production values,
 * or null if no manifest context is available.
 *
 * @param targetName - Compile target name (e.g. "sagas-combined", "users")
 * @param ctx - Manifest context built via buildManifestContext()
 */
export function getManifestEnvVars(
  target: Pick<CompileTarget, 'name' | 'manifestResourceName'>,
  ctx: ManifestContext | null,
): Record<string, string> | null {
  if (!ctx) return null;

  const resourceName = target.manifestResourceName ?? target.name;
  const resource = ctx.manifest.resources[resourceName];
  if (!resource?.env) return null;

  const resolved: Record<string, string> = {};
  for (const [key, value] of Object.entries(resource.env)) {
    resolved[key] = resolvePlaceholders(value, ctx.lookup);
  }
  return resolved;
}
