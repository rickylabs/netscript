/**
 * @module infra/config/plugin-registry
 *
 * Helpers for loading and normalizing the local plugin registry.
 */

import { dirname, join, resolve } from '@std/path';
import { toFileUrl } from '@std/path/to-file-url';
import type { NetScriptConfig, PathsConfig } from '@netscript/config';
import type { PluginManifest } from '@netscript/plugin';
import type {
  RegisteredPluginConfig,
  RegisteredPluginEnvironmentVariableValue,
} from '../../domain/resolved-config.ts';
import type { PluginInfrastructureDependency } from '../../domain/plugin-kind.ts';
import { ConfigError } from '../../domain/errors/cli-exit-error.ts';
import { loadProjectConfig } from './project-config-loader.ts';
import { DenoProcess } from '../runtime/process/deno-process.ts';

const PLUGIN_DEPENDENCY_MISSING_EXIT_CODE = 76;
const SCAFFOLD_PLUGIN_MANIFEST = 'scaffold.plugin.json';

type RegisteredPluginSnapshot = Pick<
  RegisteredPluginConfig,
  | 'name'
  | 'displayName'
  | 'type'
  | 'permissions'
  | 'service'
  | 'infrastructure'
  | 'entrypoints'
  | 'runtime'
  | 'runtimeConfig'
>;

type NetScriptConfigWithPlugins = NetScriptConfig & {
  readonly plugins?: readonly string[];
};

interface ScaffoldPluginMetadata {
  readonly provider: {
    readonly displayName?: string;
    readonly defaultPermissions?: readonly string[];
    readonly defaultEntrypoint?: string;
    readonly defaultServiceEntrypoint?: string | null;
    readonly pluginType?: string;
    readonly infrastructureRequires?: readonly string[];
    readonly infrastructureOptionalDeps?: readonly string[];
    readonly concurrencyEnvVar?: string | null;
    readonly defaultConcurrency?: number | null;
  };
  readonly officialSource?: {
    readonly canonicalName?: string;
    readonly pluginDir?: string;
    readonly serviceEntrypoint?: string;
    readonly servicePort?: number;
    readonly backgroundPort?: number;
    readonly permissions?: readonly string[];
  };
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/');
}

function resolvePluginLocalName(pluginName: string): string {
  const packageSegment = pluginName.split('/').at(-1) ?? pluginName;
  return packageSegment.startsWith('plugin-')
    ? packageSegment.slice('plugin-'.length)
    : packageSegment;
}

export function getPluginApiServiceName(pluginName: string): string {
  return `${pluginName}-api`;
}

export function getPluginServiceLookupName(serviceName: string): string {
  return serviceName.endsWith('-api') ? serviceName.slice(0, -4) : serviceName;
}

export function resolvePluginWorkdir(
  pluginName: string,
  paths?: Pick<PathsConfig, 'plugins'>,
): string {
  return normalizePath(join(paths?.plugins ?? 'plugins', resolvePluginLocalName(pluginName)));
}

function normalizePluginManifest(
  definition: RegisteredPluginSnapshot,
  projectRoot: string,
  config?: NetScriptConfig,
  paths?: Pick<PathsConfig, 'plugins'>,
): RegisteredPluginConfig {
  const workdir = resolvePluginWorkdir(definition.name, paths);

  return {
    name: definition.name,
    displayName: definition.displayName,
    type: definition.type,
    workdir,
    rootDir: resolve(projectRoot, workdir),
    permissions: definition.permissions ? [...definition.permissions] : undefined,
    service: definition.service,
    infrastructure: definition.infrastructure,
    entrypoints: definition.entrypoints,
    runtime: definition.runtime
      ? {
        topic: definition.runtime.topic,
        description: definition.runtime.description,
        schemaDefinitions: definition.runtime.schemaDefinitions,
        generatedContent: config ? definition.runtime.generatedContent : undefined,
      }
      : undefined,
    runtimeConfig: definition.runtimeConfig,
  };
}

async function resolvePluginConfigSnapshot(
  projectRoot: string,
  config?: NetScriptConfig,
): Promise<RegisteredPluginSnapshot[]> {
  const manifests: PluginManifest[] = [];
  for (const spec of resolvePluginSpecs(config)) {
    manifests.push(await resolvePluginManifest(projectRoot, spec));
  }

  const installedPluginNames = new Set(manifests.map((manifest) => manifest.name));
  for (const manifest of manifests) {
    validatePluginDependencies(manifest, installedPluginNames);
  }

  return manifests.map((manifest) => resolveRegisteredPluginSnapshot(manifest, config));
}

export async function loadRegisteredPlugins(
  projectRoot: string,
  config?: NetScriptConfig,
): Promise<Record<string, RegisteredPluginConfig>> {
  const resolvedConfig = config ??
    await loadProjectConfig({ cwd: projectRoot }, {
      process: new DenoProcess(),
    });
  const definitions = await resolvePluginConfigSnapshot(projectRoot, resolvedConfig);

  return Object.fromEntries(
    definitions.map((definition) => {
      const plugin = normalizePluginManifest(
        definition,
        projectRoot,
        resolvedConfig,
        resolvedConfig.paths,
      );
      return [resolvePluginLocalName(plugin.name), plugin] as const;
    }),
  );
}

/** Load registered plugin metadata without importing plugin modules into the CLI process. */
export async function loadRegisteredPluginMetadata(
  projectRoot: string,
  config: NetScriptConfig,
): Promise<Record<string, RegisteredPluginConfig>> {
  const plugins: Record<string, RegisteredPluginConfig> = {};
  for (const spec of resolvePluginSpecs(config)) {
    const metadata = await resolveScaffoldPluginMetadata(projectRoot, spec);
    if (!metadata) {
      continue;
    }

    const plugin = normalizeScaffoldPluginMetadata(projectRoot, metadata, config.paths);
    plugins[resolvePluginLocalName(plugin.name)] = plugin;
  }
  return plugins;
}

function resolvePluginSpecs(config?: NetScriptConfig): readonly string[] {
  return (config as NetScriptConfigWithPlugins | undefined)?.plugins ?? [];
}

async function resolveScaffoldPluginMetadata(
  projectRoot: string,
  spec: string,
): Promise<ScaffoldPluginMetadata | null> {
  if (!spec.startsWith('.') && !spec.startsWith('/')) {
    return null;
  }

  const resolved = resolve(projectRoot, spec);
  const manifestPath = join(dirname(resolved), SCAFFOLD_PLUGIN_MANIFEST);
  const raw = JSON.parse(await Deno.readTextFile(manifestPath));
  return isScaffoldPluginMetadata(raw) ? raw : null;
}

function normalizeScaffoldPluginMetadata(
  projectRoot: string,
  metadata: ScaffoldPluginMetadata,
  paths?: Pick<PathsConfig, 'plugins'>,
): RegisteredPluginConfig {
  const name = metadata.officialSource?.canonicalName ?? metadata.officialSource?.pluginDir;
  if (!name) {
    throw new Error(`${SCAFFOLD_PLUGIN_MANIFEST} is missing officialSource.canonicalName.`);
  }

  const serviceEntrypoint = metadata.officialSource?.serviceEntrypoint ??
    metadata.provider.defaultServiceEntrypoint ??
    metadata.provider.defaultEntrypoint;
  const workdir = normalizePath(join(paths?.plugins ?? 'plugins', name));
  const permissions = metadata.officialSource?.permissions ?? metadata.provider.defaultPermissions;
  const infrastructureRequires = normalizeInfrastructureDependencies(
    metadata.provider.infrastructureRequires,
  );
  const infrastructureOptionalDeps = normalizeInfrastructureDependencies(
    metadata.provider.infrastructureOptionalDeps,
  );

  return {
    name,
    displayName: metadata.provider.displayName,
    type: metadata.provider.pluginType === 'background-processor' ? 'background-processor' : 'utility',
    workdir,
    rootDir: resolve(projectRoot, workdir),
    permissions: permissions ? [...permissions] : undefined,
    service: serviceEntrypoint
      ? {
        entrypoint: serviceEntrypoint,
        port: metadata.officialSource?.servicePort ?? metadata.officialSource?.backgroundPort,
      }
      : undefined,
    infrastructure: infrastructureRequires.length > 0
      ? {
        requires: infrastructureRequires,
        optionalDeps: infrastructureOptionalDeps.length > 0
          ? infrastructureOptionalDeps
          : undefined,
        concurrencyEnvVar: metadata.provider.concurrencyEnvVar ?? undefined,
        defaultConcurrency: metadata.provider.defaultConcurrency ?? undefined,
      }
      : undefined,
  };
}

function normalizeInfrastructureDependencies(
  values: readonly string[] | undefined,
): PluginInfrastructureDependency[] {
  return (values ?? []).filter(isPluginInfrastructureDependency);
}

function isPluginInfrastructureDependency(value: string): value is PluginInfrastructureDependency {
  return value === 'kv' || value === 'db' || value === 'cache';
}

function isScaffoldPluginMetadata(value: unknown): value is ScaffoldPluginMetadata {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const provider = Reflect.get(value, 'provider');
  return !!provider && typeof provider === 'object';
}

async function resolvePluginManifest(
  projectRoot: string,
  spec: string,
): Promise<PluginManifest> {
  const module = await import(resolvePluginImportSpecifier(projectRoot, spec)) as Record<
    string,
    unknown
  >;
  const manifest = resolveExportedPluginManifest(module);
  if (!manifest) {
    throw new Error(`Plugin spec "${spec}" does not export a plugin manifest.`);
  }
  return manifest;
}

function resolveExportedPluginManifest(
  module: Record<string, unknown>,
): PluginManifest | undefined {
  if (isPluginManifest(module.default)) {
    return module.default;
  }

  const manifests = Object.values(module).filter(isPluginManifest);
  if (manifests.length === 1) {
    return manifests[0];
  }

  return undefined;
}

function isPluginManifest(value: unknown): value is PluginManifest {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const manifest = value as Partial<PluginManifest>;
  return typeof manifest.name === 'string' &&
    typeof manifest.version === 'string' &&
    !!manifest.contributions &&
    typeof manifest.contributions === 'object';
}

function resolvePluginImportSpecifier(projectRoot: string, spec: string): string {
  if (spec.startsWith('.') || spec.startsWith('/')) {
    const resolved = resolve(projectRoot, spec);
    const modulePath = resolved.endsWith('.ts') ? resolved : join(resolved, 'mod.ts');
    return toFileUrl(modulePath).href;
  }
  return spec;
}

function validatePluginDependencies(
  manifest: PluginManifest,
  installedPluginNames: ReadonlySet<string>,
): void {
  for (const [alias, dependency] of Object.entries(manifest.dependencies ?? {})) {
    if (!hasHostContribution(dependency)) {
      continue;
    }

    if (installedPluginNames.has(dependency.name)) {
      continue;
    }

    throw new ConfigError(
      PLUGIN_DEPENDENCY_MISSING_EXIT_CODE,
      `Plugin "${manifest.name}" depends on "${dependency.name}" (alias "${alias}") which is not installed. Run: ns plugins install ${dependency.name}`,
      {
        context: {
          plugin: manifest.name,
          dependency: dependency.name,
          alias,
        },
      },
    );
  }
}

function hasHostContribution(manifest: PluginManifest): boolean {
  return Object.values(manifest.contributions).some((contribution) =>
    Array.isArray(contribution) ? contribution.length > 0 : contribution !== undefined
  );
}

function resolveRegisteredPluginSnapshot(
  definition: PluginManifest,
  _config?: NetScriptConfig,
): RegisteredPluginSnapshot {
  const service = definition.contributions.services?.[0];
  return {
    name: definition.name,
    displayName: definition.displayName,
    type: definition.type,
    permissions: definition.permissions ? [...definition.permissions] : undefined,
    service: service
      ? {
        entrypoint: service.entrypoint,
        port: service.port,
      }
      : undefined,
    infrastructure: undefined,
    entrypoints: undefined,
    runtime: undefined,
    runtimeConfig: definition.contributions.runtimeConfigTopics?.length
      ? { schemas: [] }
      : undefined,
  };
}

export function resolvePluginEnvironmentVariables(
  envVars?: Record<string, RegisteredPluginEnvironmentVariableValue>,
): Record<string, string> {
  const resolved: Record<string, string> = {};

  for (const [name, spec] of Object.entries(envVars ?? {})) {
    if (typeof spec === 'string') {
      resolved[name] = spec;
      continue;
    }

    if (spec.value !== undefined) {
      resolved[name] = spec.value;
      continue;
    }

    if (spec.fromEnv) {
      resolved[name] = Deno.env.get(spec.fromEnv) ?? spec.defaultValue ?? '';
      continue;
    }

    if (spec.defaultValue !== undefined) {
      resolved[name] = spec.defaultValue;
    }
  }

  return resolved;
}
