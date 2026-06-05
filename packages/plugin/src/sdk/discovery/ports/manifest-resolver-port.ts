import type { PluginManifest } from '../../../config/mod.ts';

/** Port for resolving a plugin manifest from a package or module specifier. */
export interface ManifestResolverPort {
  resolve(spec: string): Promise<PluginManifest | undefined>;
}
