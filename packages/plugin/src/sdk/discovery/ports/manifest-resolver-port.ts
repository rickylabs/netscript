import type { PluginManifest } from '../../../config/mod.ts';

/** Port for resolving a plugin manifest from a package or module specifier. */
export interface ManifestResolverPort {
  /** Resolve a manifest for a package or module specifier. */
  resolve(spec: string): Promise<PluginManifest | undefined>;
}
