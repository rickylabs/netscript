/**
 * @module infra/config/plugin-registry
 *
 * Helpers for loading and normalizing the local plugin registry.
 */

import { join, resolve } from '@std/path';
import { toFileUrl } from '@std/path/to-file-url';
import type { NetScriptConfig, PathsConfig } from '@netscript/config';
import type { PluginManifest } from '@netscript/plugin';
import type {
  RegisteredPluginConfig,
  RegisteredPluginEnvironmentVariableValue,
} from '../../domain/resolved-config.ts';
import { ConfigError } from '../../domain/errors/cli-exit-error.ts';
import { loadProjectConfig } from './project-config-loader.ts';
import { DenoProcess } from '../runtime/process/deno-process.ts';

const PLUGIN_DEPENDENCY_MISSING_EXIT_CODE = 76;

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

function resolvePluginSpecs(config?: NetScriptConfig): readonly string[] {
  return (config as NetScriptConfigWithPlugins | undefined)?.plugins ?? [];
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
