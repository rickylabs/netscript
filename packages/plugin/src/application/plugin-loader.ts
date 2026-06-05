import type { ManifestResolverPort } from '../sdk/mod.ts';
import type { PluginManifest } from '../config/mod.ts';

/** Load one plugin manifest from a manifest resolver. */
export async function loadPluginManifest(
  root: string,
  resolver: ManifestResolverPort,
): Promise<PluginManifest | undefined> {
  return await resolver.resolve(root);
}
