import type { PluginManifest } from '@netscript/plugin/config';
import type { ManifestResolverPort } from '@netscript/plugin/sdk';

import { ConfigError } from '../../../../kernel/domain/errors/cli-exit-error.ts';
import { EXIT_CODES } from './plugin-loader.ts';

/** Options for resolving a plugin manifest through the SDK resolver port. */
export interface ResolvePluginManifestOptions {
  /** SDK manifest resolver. */
  readonly manifestResolver: ManifestResolverPort;
}

/** Resolve a plugin manifest by package spec. */
export async function resolvePluginManifest(
  spec: string,
  options: ResolvePluginManifestOptions,
): Promise<PluginManifest> {
  const manifest = await options.manifestResolver.resolve(spec);
  if (!manifest) {
    throw new ConfigError(EXIT_CODES.MANIFEST_NOT_FOUND, `Plugin manifest not found: ${spec}`, {
      context: { spec },
    });
  }
  return manifest;
}

/** Resolve all configured plugin manifests. */
export async function resolvePluginManifests(
  plugins: readonly string[],
  options: ResolvePluginManifestOptions,
): Promise<readonly PluginManifest[]> {
  return await Promise.all(
    plugins.map((plugin) => resolvePluginManifest(plugin, options)),
  );
}
