import type { NetScriptConfig } from '@netscript/config';
import type { PluginContributions, PluginManifest } from '@netscript/plugin/config';
import type {
  EmitterPort,
  ExtractorPort,
  ManifestResolverPort,
  RegistryEmission,
  WalkerPort,
} from '@netscript/plugin/sdk';

import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import { type ConfigLoaderPort, resolveConfiguredPlugins } from './discover-plugins.ts';
import { resolvePluginContributions } from './load-plugin-contributions.ts';
import { resolvePluginManifests } from './resolve-plugin-manifest.ts';
import { resolveWalkerEmissions } from './trigger-walker.ts';

/** Exit codes used by plugin host flows. */
export const EXIT_CODES = {
  SUCCESS: 0,
  MANIFEST_NOT_FOUND: 2,
  DISPATCH_FAILED: 3,
  SCAFFOLD_FAILED: 4,
} as const;

/** Options for resolving host plugin state. */
export interface PluginHostLoaderOptions {
  /** Project root for configuration and walker operations. */
  readonly projectRoot: string;
  /** Config loader for `netscript.config.ts`. */
  readonly configLoader: ConfigLoaderPort;
  /** Plugin SDK manifest resolver. */
  readonly manifestResolver: ManifestResolverPort;
  /** Plugin SDK walker. */
  readonly walker: WalkerPort;
  /** Plugin SDK extractor. */
  readonly extractor: ExtractorPort;
  /** Plugin SDK registry emitter. */
  readonly emitter: EmitterPort;
  /** Filesystem adapter reserved for host-side expansion in later slices. */
  readonly fs: FileSystemPort;
}

/** State resolved by the plugin host loader. */
export interface PluginHostState {
  /** Loaded NetScript configuration. */
  readonly config: NetScriptConfig;
  /** Resolved plugin manifests. */
  readonly plugins: readonly PluginManifest[];
  /** Merged plugin contributions. */
  readonly contributions: PluginContributions;
  /** Registry emissions produced by the walker stub. */
  readonly emissions: readonly RegistryEmission[];
}

/** Port implemented by plugin host loader use cases. */
export interface PluginHostLoaderPort {
  /** Resolve the current plugin host state. */
  resolve(): Promise<PluginHostState>;
}

/** Concrete host loader that composes config, manifest, contribution, and walker ports. */
export class PluginHostLoader implements PluginHostLoaderPort {
  constructor(private readonly options: PluginHostLoaderOptions) {}

  /** Resolve the current plugin host state. */
  resolve(): Promise<PluginHostState> {
    return resolvePluginHostState(this.options);
  }
}

/** Create the default plugin host loader use case. */
export function createPluginHostLoader(
  options: PluginHostLoaderOptions,
): PluginHostLoaderPort {
  return new PluginHostLoader(options);
}

/** Resolve plugin host state from config, manifests, contributions, and walker output. */
export async function resolvePluginHostState(
  options: PluginHostLoaderOptions,
): Promise<PluginHostState> {
  const discovered = await resolveConfiguredPlugins(options.projectRoot, options.configLoader);
  const plugins = await resolvePluginManifests(discovered.plugins, {
    manifestResolver: options.manifestResolver,
  });
  const contributions = resolvePluginContributions(plugins);
  const emissions = await resolveWalkerEmissions({
    projectRoot: options.projectRoot,
    walker: options.walker,
    extractor: options.extractor,
    emitter: options.emitter,
  });

  return {
    config: discovered.config,
    plugins,
    contributions,
    emissions,
  };
}
