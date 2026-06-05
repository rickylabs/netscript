import { exists } from '@std/fs';
import { fromFileUrl } from '@std/path/from-file-url';
import { basename, dirname, join } from '@std/path';

import { SCAFFOLD_DIRS } from '../../kernel/constants/scaffold/scaffold-dirs.ts';
import { SCAFFOLD_FILES } from '../../kernel/constants/scaffold/scaffold-files.ts';
import { ScaffoldValidationError } from '../../kernel/domain/errors.ts';
import type { PackageSourceMode } from '../../kernel/domain/scaffold/scaffold-options.ts';
import type { ScaffoldResult } from '../../kernel/domain/core-types.ts';
import type { PluginKind, PluginKindProvider } from '../../kernel/domain/plugin-kind.ts';
import { PluginKindRegistry } from '../../kernel/application/registries/plugin-kind-registry.ts';

export interface OfficialPluginSource {
  readonly kind: PluginKind;
  readonly canonicalName: string;
  readonly pluginDir: string;
  readonly backgroundDir?: string;
  readonly serviceEntrypoint: string;
  readonly backgroundEntrypoint?: string;
  readonly serviceConfigKey: string;
  readonly servicePort: number;
  readonly backgroundPort: number;
  readonly dependencies: readonly OfficialPluginDependency[];
  readonly pluginReferences?: readonly string[];
}

export interface OfficialPluginDependency {
  readonly pluginDir: string;
  readonly configKey: string;
  readonly servicePort: number;
  readonly serviceEntrypoint: string;
  readonly requiresDb: boolean;
  readonly requiresKv: boolean;
  readonly permissions: readonly string[];
}

/** Source mode accepted by `netscript plugin add --source`. */
export type PluginSourceMode = 'auto' | 'starter' | 'local';

/** Result of copying an official plugin implementation. */
export interface OfficialPluginCopyResult {
  /** Scaffold accounting for copied source files. */
  readonly scaffoldResult: ScaffoldResult;
  /** Canonical plugin name under `plugins/`. */
  readonly pluginName: string;
  /** Absolute plugin service workspace directory. */
  readonly pluginDir: string;
  /** Optional root background workspace directory. */
  readonly backgroundDir: string | null;
  /** Plugin API config key. */
  readonly serviceConfigKey: string;
  /** Plugin API port. */
  readonly servicePort: number;
  /** Entrypoint used by the plugin API service. */
  readonly serviceEntrypoint: string;
  /** Background processor port from the official source. */
  readonly backgroundPort: number;
  /** Optional background processor entrypoint. */
  readonly backgroundEntrypoint: string | null;
  /** Extra plugin dependencies copied along with this plugin. */
  readonly dependencies: readonly OfficialPluginDependency[];
  /** Existing plugin API services this first-party implementation expects. */
  readonly pluginReferences: readonly string[];
  /** Root workspace members that must be registered. */
  readonly workspaceMembers: readonly string[];
}

/** Options for copying an official plugin implementation. */
export interface CopyOfficialPluginOptions {
  /** Source monorepo checkout root. */
  readonly sourceRoot: string;
  /** Target scaffold project root. */
  readonly targetPath: string;
  /** Scaffolded project name. */
  readonly projectName: string;
  /** Plugin kind requested by the CLI. */
  readonly kind: PluginKind;
  /** Plugin name requested by the CLI. Must match the canonical source name. */
  readonly pluginName: string;
  /** Target project import mode. */
  readonly importMode: PackageSourceMode;
  /** Whether existing copied files may be overwritten. */
  readonly force: boolean;
  /** Whether sample jobs, tasks, sagas, and triggers should be wired. */
  readonly includeSamples?: boolean;
}

interface ScaffoldPluginManifest {
  readonly schemaVersion?: number;
  readonly provider?: PluginKindProvider;
  readonly officialSource?: OfficialSourceManifest;
}

interface OfficialSourceManifest {
  readonly canonicalName: string;
  readonly pluginDir?: string;
  readonly backgroundDir?: string;
  readonly serviceEntrypoint: string;
  readonly backgroundEntrypoint?: string;
  readonly serviceConfigKey: string;
  readonly servicePort: number;
  readonly backgroundPort: number;
  readonly requiresDb?: boolean;
  readonly requiresKv?: boolean;
  readonly permissions?: readonly string[];
  readonly dependencies?: readonly string[];
  readonly pluginReferences?: readonly string[];
}

interface ManifestEntry {
  readonly pluginDir: string;
  readonly manifest: ScaffoldPluginManifest;
}

const SCAFFOLD_PLUGIN_MANIFEST = 'scaffold.plugin.json';

/** Register plugin-owned provider metadata from a source checkout when present. */
export async function registerOfficialPluginKindProviders(
  registry: PluginKindRegistry,
  sourceRoot: string,
): Promise<void> {
  for (const entry of await readPluginManifestEntries(sourceRoot)) {
    const provider = entry.manifest.provider;
    if (provider) {
      registry.register(provider.kind, provider);
    }
  }
}

/** Return the canonical first-party source descriptor for a plugin kind. */
export async function getOfficialPluginSource(
  sourceRoot: string,
  kind: PluginKind,
): Promise<OfficialPluginSource> {
  const sources = await discoverOfficialPluginSources(sourceRoot);
  const source = sources.get(kind);
  if (!source) {
    throw new ScaffoldValidationError(`No first-party plugin source is registered for "${kind}".`, {
      kind,
      supportedKinds: [...sources.keys()],
    });
  }
  return source;
}

/** Whether the requested kind/name pair can be materialized from first-party source. */
export async function canCopyOfficialPlugin(
  sourceRoot: string,
  kind: PluginKind,
  pluginName: string,
): Promise<boolean> {
  const sources = await discoverOfficialPluginSources(sourceRoot);
  return sources.get(kind)?.canonicalName === pluginName;
}

/** Find a monorepo root that contains plugin-owned scaffold manifests. */
export async function findOfficialPluginSourceRoot(
  startDir = dirname(fromFileUrl(import.meta.url)),
): Promise<string | null> {
  let current = startDir;

  while (true) {
    if (await hasOfficialPluginSources(current)) {
      return current;
    }

    const parent = dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}

export async function assertOfficialSourceRoot(sourceRoot: string): Promise<void> {
  if (!await hasOfficialPluginSources(sourceRoot)) {
    throw new ScaffoldValidationError(
      `Cannot copy official plugins because ${sourceRoot} is not a NetScript source checkout with plugin manifests.`,
      { sourceRoot },
    );
  }
}

async function discoverOfficialPluginSources(
  sourceRoot: string,
): Promise<ReadonlyMap<PluginKind, OfficialPluginSource>> {
  const entries = await readPluginManifestEntries(sourceRoot);
  const sourcesByPluginDir = new Map<string, OfficialPluginDependency>();
  const result = new Map<PluginKind, OfficialPluginSource>();

  for (const entry of entries) {
    const source = entry.manifest.officialSource;
    if (!source) continue;
    sourcesByPluginDir.set(source.pluginDir ?? entry.pluginDir, {
      pluginDir: source.pluginDir ?? entry.pluginDir,
      configKey: source.serviceConfigKey,
      servicePort: source.servicePort,
      serviceEntrypoint: source.serviceEntrypoint,
      requiresDb: source.requiresDb ?? false,
      requiresKv: source.requiresKv ?? false,
      permissions: [...(source.permissions ?? [])],
    });
  }

  for (const entry of entries) {
    const provider = entry.manifest.provider;
    const source = entry.manifest.officialSource;
    if (!provider || !source) continue;
    result.set(provider.kind, {
      kind: provider.kind,
      canonicalName: source.canonicalName,
      pluginDir: source.pluginDir ?? entry.pluginDir,
      backgroundDir: source.backgroundDir,
      serviceEntrypoint: source.serviceEntrypoint,
      backgroundEntrypoint: source.backgroundEntrypoint,
      serviceConfigKey: source.serviceConfigKey,
      servicePort: source.servicePort,
      backgroundPort: source.backgroundPort,
      dependencies: (source.dependencies ?? []).map((pluginDir) =>
        resolveDependency(sourcesByPluginDir, pluginDir)
      ),
      pluginReferences: source.pluginReferences ?? [],
    });
  }

  return result;
}

function resolveDependency(
  sourcesByPluginDir: ReadonlyMap<string, OfficialPluginDependency>,
  pluginDir: string,
): OfficialPluginDependency {
  const dependency = sourcesByPluginDir.get(pluginDir);
  if (!dependency) {
    throw new ScaffoldValidationError(
      `Official plugin manifest references unknown dependency "${pluginDir}".`,
      { pluginDir },
    );
  }
  return dependency;
}

async function readPluginManifestEntries(sourceRoot: string): Promise<readonly ManifestEntry[]> {
  const pluginsRoot = join(sourceRoot, SCAFFOLD_DIRS.PLUGINS);
  const entries: ManifestEntry[] = [];

  try {
    for await (const entry of Deno.readDir(pluginsRoot)) {
      if (!entry.isDirectory || entry.name.startsWith('.')) continue;
      const path = join(pluginsRoot, entry.name, SCAFFOLD_PLUGIN_MANIFEST);
      try {
        const manifest = JSON.parse(await Deno.readTextFile(path)) as ScaffoldPluginManifest;
        entries.push({ pluginDir: entry.name, manifest });
      } catch (error) {
        if (error instanceof Deno.errors.NotFound) continue;
        throw error;
      }
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return [];
    throw error;
  }

  return entries.sort((left, right) => left.pluginDir.localeCompare(right.pluginDir));
}

async function hasOfficialPluginSources(sourceRoot: string): Promise<boolean> {
  const hasCli = await exists(
    join(sourceRoot, SCAFFOLD_DIRS.PACKAGES, 'cli', 'bin', 'netscript.ts'),
    {
      isFile: true,
    },
  );
  if (!hasCli) {
    return false;
  }

  return (await readPluginManifestEntries(sourceRoot)).some((entry) =>
    entry.manifest.provider && entry.manifest.officialSource
  );
}

export const _internal = {
  basename,
  discoverOfficialPluginSources,
  readPluginManifestEntries,
};
