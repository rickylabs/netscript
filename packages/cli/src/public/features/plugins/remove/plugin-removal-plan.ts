import { join } from '@std/path';

import { validateResourceName } from '../../../../kernel/adapters/scaffold/workspace-writer.ts';
import { ConfigError } from '../../../../kernel/domain/errors/cli-exit-error.ts';
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import { resolvePluginPackageSpec } from '../install/plugin-package-resolver.ts';

/** Install-owned root configuration state used for a safe three-way reversal. */
export interface PluginInstallState {
  readonly managedFilesAfter?: Readonly<Record<string, string | null>>;
  readonly managedFilesBefore?: Readonly<Record<string, string | null>>;
  readonly rootDenoJsonAfter?: string;
  readonly rootDenoJsonBefore?: string;
}

/** Fully validated, read-only plan for one plugin removal. */
export interface PluginRemovalPlan {
  readonly generatedDirs: readonly string[];
  readonly installState?: PluginInstallState;
  readonly packageSpecifier: string;
  readonly pluginDir: string;
  readonly pluginName: string;
  readonly projectRoot: string;
  readonly schemaDirs: readonly string[];
  readonly snapshotPaths: readonly string[];
}

/** Resolve every package and path needed by removal before project mutation begins. */
export async function planPluginRemoval(
  projectRoot: string,
  pluginName: string,
  explicitPackage: string | undefined,
  fs: FileSystemPort,
): Promise<PluginRemovalPlan> {
  validateResourceName(pluginName, 'plugin');
  const installed = await resolveInstalledPlugin(projectRoot, pluginName, fs);
  const packageSpecifier = resolveRemovalPackageSpecifier(
    explicitPackage ?? installed.packageSpecifier,
    pluginName,
  );
  const generatedDirs = [
    join(projectRoot, '.netscript', 'generated', pluginName),
    join(projectRoot, '.netscript', 'generated', `plugin-${pluginName}`),
  ];
  const schemaDirs = await discoverPluginSchemaDirs(projectRoot, pluginName, fs);
  const snapshotPaths = [
    join(projectRoot, 'appsettings.json'),
    join(projectRoot, 'netscript.config.ts'),
    join(projectRoot, 'deno.json'),
    join(projectRoot, 'aspire'),
    installed.pluginDir,
    ...generatedDirs,
    ...schemaDirs,
  ];
  return {
    generatedDirs,
    installState: installed.installState,
    packageSpecifier,
    pluginDir: installed.pluginDir,
    pluginName,
    projectRoot,
    schemaDirs,
    snapshotPaths,
  };
}

interface InstalledPluginIdentity {
  readonly installState?: PluginInstallState;
  readonly packageSpecifier: string;
  readonly pluginDir: string;
}

async function resolveInstalledPlugin(
  projectRoot: string,
  pluginName: string,
  fs: FileSystemPort,
): Promise<InstalledPluginIdentity> {
  const candidates = [
    join(projectRoot, pluginName),
    join(projectRoot, 'plugins', pluginName),
  ];
  for (const pluginDir of candidates) {
    const manifestPath = join(pluginDir, 'scaffold.plugin.json');
    if (!await fs.exists(manifestPath)) continue;
    let value: unknown;
    try {
      value = JSON.parse(await fs.readFile(manifestPath));
    } catch (error) {
      throw removalConfigError(pluginName, `installed metadata is invalid at ${manifestPath}`, error);
    }
    if (!isRecord(value) || typeof value.name !== 'string') {
      throw removalConfigError(pluginName, `installed metadata has no package name at ${manifestPath}`);
    }
    return {
      packageSpecifier: value.name,
      pluginDir,
      installState: readInstallState(value.netscriptInstall),
    };
  }
  throw removalConfigError(
    pluginName,
    'installed scaffold.plugin.json metadata was not found; no project state was changed',
  );
}

function resolveRemovalPackageSpecifier(value: string, pluginName: string): string {
  const requested = value.trim();
  try {
    if (/^(?:jsr:)?@[^/]+\/[^/@]+(?:@[^/]+)?$/.test(requested)) {
      return requested.startsWith('jsr:') ? requested.slice('jsr:'.length) : requested;
    }
    return resolvePluginPackageSpec(requested).packageSpecifier;
  } catch (error) {
    throw removalConfigError(pluginName, `package specifier "${requested}" is invalid`, error);
  }
}

async function discoverPluginSchemaDirs(
  projectRoot: string,
  pluginName: string,
  fs: FileSystemPort,
): Promise<readonly string[]> {
  const databaseRoot = join(projectRoot, 'database');
  if (!await fs.exists(databaseRoot)) return [];
  const paths: string[] = [];
  for (const engine of await fs.readDir(databaseRoot)) {
    if (!engine.isDirectory) continue;
    const candidate = join(databaseRoot, engine.name, 'schema', 'plugins', pluginName);
    if (await fs.exists(candidate)) paths.push(candidate);
  }
  return paths;
}

function readInstallState(value: unknown): PluginInstallState | undefined {
  if (!isRecord(value)) return undefined;
  const before = typeof value.rootDenoJsonBefore === 'string'
    ? value.rootDenoJsonBefore
    : undefined;
  const after = typeof value.rootDenoJsonAfter === 'string' ? value.rootDenoJsonAfter : undefined;
  const managedFilesBefore = readNullableStringRecord(value.managedFilesBefore);
  const managedFilesAfter = readNullableStringRecord(value.managedFilesAfter);
  return before === undefined && after === undefined && managedFilesBefore === undefined &&
      managedFilesAfter === undefined
    ? undefined
    : {
      managedFilesAfter,
      managedFilesBefore,
      rootDenoJsonBefore: before,
      rootDenoJsonAfter: after,
    };
}

function readNullableStringRecord(value: unknown): Readonly<Record<string, string | null>> | undefined {
  if (!isRecord(value)) return undefined;
  const entries = Object.entries(value);
  if (!entries.every(([, item]) => typeof item === 'string' || item === null)) return undefined;
  return Object.fromEntries(entries) as Record<string, string | null>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function removalConfigError(pluginName: string, detail: string, cause?: unknown): ConfigError {
  return new ConfigError(1, `Unable to remove plugin "${pluginName}": ${detail}.`, { cause });
}
