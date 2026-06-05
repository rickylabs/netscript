/**
 * @module infra/plugin/db-integration
 *
 * Composition layer between plugin scaffolding and database capabilities.
 */

import { join } from '@std/path';

import { SCAFFOLD_DIRS } from '../../constants/scaffold/scaffold-dirs.ts';
import { SCAFFOLD_FILES } from '../../constants/scaffold/scaffold-files.ts';
import { ScaffoldValidationError } from '../../domain/errors.ts';
import type { FileSystemPort } from '../../ports/file-system-port.ts';
import type { PackageSourceMode } from '../../domain/scaffold/scaffold-options.ts';
import type { ScaffolderPort, TemplatePort } from '../../ports/template-port.ts';
import { DbEngineRegistry } from '../../application/registries/db-engine-registry.ts';
import { DatabaseScaffolder } from '../database/scaffolder.ts';
import { DatabaseWorkspaceMutator } from '../database/workspace-mutator.ts';
import { DbWorkspaceResolver } from '../database/workspace-resolver.ts';
import type {
  DatabaseScaffoldResult,
  DbEngine,
  DiscoveredDatabase,
} from '../../domain/db-engine.ts';
import type {
  PluginDbDetectionResult,
  PluginKindProvider,
  PluginSchemaCopyResult,
} from '../../domain/plugin-kind.ts';

/** CLI flags that affect plugin database resolution. */
export interface PluginDbFlags {
  /** Explicit database engine or configured DB key to target. */
  readonly db?: string;
  /** Explicitly disable DB wiring for this plugin. */
  readonly noDb?: boolean;
}

/** Project/package options needed when provisioning a database from plugin add. */
export interface PluginDbProvisioningOptions {
  /** Project name used for generated package names and DB resource names. */
  readonly projectName: string;
  /** Import mode used by the target project. */
  readonly importMode: PackageSourceMode;
  /** Local import base when `importMode` is `local`. */
  readonly localBase?: string;
  /** Whether existing generated DB files may be overwritten. */
  readonly overwrite?: boolean;
}

/** Adapter dependencies used by DB provisioning. */
export interface PluginDbProvisioningAdapters {
  /** Scaffold file writer abstraction. */
  readonly scaffolder: ScaffolderPort;
  /** Filesystem abstraction. */
  readonly fs: FileSystemPort;
  /** Template renderer. */
  readonly templateAdapter: TemplatePort;
}

/** Detect whether a plugin needs a database and which database it should target. */
export async function detectPluginDbRequirement(
  projectRoot: string,
  provider: PluginKindProvider,
  flags: PluginDbFlags,
  fs: FileSystemPort,
  registry: DbEngineRegistry = new DbEngineRegistry(),
): Promise<PluginDbDetectionResult> {
  if (flags.noDb) {
    return noDatabaseRequired();
  }

  const explicitDb = flags.db?.trim();
  const requiresDb = explicitDb !== undefined && explicitDb.length > 0 ||
    provider.defaultRequiresDb;
  if (!requiresDb) {
    return noDatabaseRequired();
  }

  const databases = await discoverDatabases(projectRoot, fs);

  if (explicitDb !== undefined && explicitDb.length > 0) {
    return resolveExplicitDatabase(explicitDb, databases, registry);
  }

  if (databases.length > 0) {
    const primaryDatabase = await readPrimaryDatabase(projectRoot, fs);
    const enabled = databases.filter((database) => database.enabled);
    const target = enabled.find((database) => database.configKey === primaryDatabase) ??
      enabled[0] ??
      databases[0];
    return {
      requiresDb: true,
      dbExists: true,
      targetConfigKey: target.configKey,
      targetEngine: target.engine,
      needsProvisioning: false,
    };
  }

  return {
    requiresDb: true,
    dbExists: false,
    targetConfigKey: 'postgres',
    targetEngine: 'postgres',
    needsProvisioning: true,
  };
}

/** Provision a database workspace when detection determined one is required. */
export async function provisionDatabaseIfNeeded(
  projectRoot: string,
  detection: PluginDbDetectionResult,
  options: PluginDbProvisioningOptions,
  adapters: PluginDbProvisioningAdapters,
  registry: DbEngineRegistry = new DbEngineRegistry(),
): Promise<DatabaseScaffoldResult | null> {
  if (!detection.needsProvisioning || !detection.targetEngine) {
    return null;
  }

  const provider = registry.get(detection.targetEngine);
  const configKey = detection.targetConfigKey ?? provider.engine;
  const dbScaffolder = new DatabaseScaffolder(
    adapters.scaffolder,
    adapters.fs,
    adapters.templateAdapter,
    registry,
  );
  const result = await dbScaffolder.scaffold({
    projectName: options.projectName,
    targetPath: projectRoot,
    engine: detection.targetEngine,
    configKey,
    importMode: options.importMode,
    localBase: options.localBase,
    overwrite: options.overwrite,
  });

  const mutator = new DatabaseWorkspaceMutator(
    adapters.fs,
    adapters.scaffolder,
    adapters.templateAdapter,
  );
  await mutator.addDatabaseToAppsettings(projectRoot, {
    configKey,
    engine: detection.targetEngine,
    databaseName: result.databaseName,
  });
  await mutator.addDatabaseWorkspaceMember(projectRoot, provider.dirName);
  await mutator.regenerateAspireConfig(projectRoot);

  return result;
}

/** Copy a plugin schema contribution into the selected root database schema tree. */
export async function copyPluginSchemaToRootDb(
  projectRoot: string,
  pluginName: string,
  detection: PluginDbDetectionResult,
  adapters: Pick<PluginDbProvisioningAdapters, 'fs' | 'scaffolder'>,
  options: { readonly overwrite?: boolean } = {},
  registry: DbEngineRegistry = new DbEngineRegistry(),
): Promise<PluginSchemaCopyResult | null> {
  const results = await copyPluginSchemasToRootDb(
    projectRoot,
    pluginName,
    detection,
    adapters,
    options,
    registry,
  );
  return results[0] ?? null;
}

/** Copy all plugin schema contributions into the selected root database schema tree. */
export async function copyPluginSchemasToRootDb(
  projectRoot: string,
  pluginName: string,
  detection: PluginDbDetectionResult,
  adapters: Pick<PluginDbProvisioningAdapters, 'fs' | 'scaffolder'>,
  options: { readonly overwrite?: boolean } = {},
  registry: DbEngineRegistry = new DbEngineRegistry(),
): Promise<readonly PluginSchemaCopyResult[]> {
  if (!detection.requiresDb || !detection.targetEngine) {
    return [];
  }

  const provider = registry.get(detection.targetEngine);
  const sourceRoot = join(
    projectRoot,
    SCAFFOLD_DIRS.PLUGINS,
    pluginName,
    SCAFFOLD_DIRS.DATABASE,
  );

  if (!await adapters.fs.exists(sourceRoot)) {
    return [];
  }

  const results: PluginSchemaCopyResult[] = [];
  for await (const entry of adapters.fs.walk(sourceRoot)) {
    if (!entry.isFile || !entry.path.endsWith('.prisma')) {
      continue;
    }

    const sourcePath = entry.path;
    const fileName = sourcePath.endsWith(`${SCAFFOLD_DIRS.DATABASE}\\schema.prisma`) ||
        sourcePath.endsWith(`${SCAFFOLD_DIRS.DATABASE}/schema.prisma`)
      ? `${pluginName}.prisma`
      : sourcePath.split(/[\\/]/).at(-1) ?? `${pluginName}.prisma`;
    const targetPath = join(
      projectRoot,
      SCAFFOLD_DIRS.DATABASE,
      provider.dirName,
      'schema',
      SCAFFOLD_DIRS.PLUGINS,
      pluginName,
      fileName,
    );
    const content = await adapters.fs.readFile(sourcePath);
    const written = await adapters.scaffolder.writeFile(
      targetPath,
      content,
      options.overwrite ?? false,
    );

    results.push({
      sourcePath,
      targetPath,
      written,
    });
  }

  return results;
}

async function discoverDatabases(
  projectRoot: string,
  fs: FileSystemPort,
): Promise<readonly DiscoveredDatabase[]> {
  const resolver = new DbWorkspaceResolver(fs);
  try {
    return await resolver.discoverDatabases(projectRoot);
  } catch (error: unknown) {
    if (error instanceof ScaffoldValidationError) {
      return [];
    }
    throw error;
  }
}

function resolveExplicitDatabase(
  explicitDb: string,
  databases: readonly DiscoveredDatabase[],
  registry: DbEngineRegistry,
): PluginDbDetectionResult {
  const existing = databases.find((database) => database.configKey === explicitDb) ??
    databases.find((database) => database.databaseName === explicitDb);
  if (existing) {
    return {
      requiresDb: true,
      dbExists: true,
      targetConfigKey: existing.configKey,
      targetEngine: existing.engine,
      needsProvisioning: false,
    };
  }

  const engine = explicitDb.toLowerCase() as DbEngine;
  if (!registry.has(engine)) {
    throw new ScaffoldValidationError(`Unsupported database engine or target: ${explicitDb}`, {
      target: explicitDb,
      supportedEngines: registry.engines(),
      configuredDatabases: databases.map((database) => database.configKey),
    });
  }

  return {
    requiresDb: true,
    dbExists: false,
    targetConfigKey: engine,
    targetEngine: engine,
    needsProvisioning: true,
  };
}

async function readPrimaryDatabase(
  projectRoot: string,
  fs: FileSystemPort,
): Promise<string | null> {
  const appsettingsPath = join(projectRoot, SCAFFOLD_FILES.APPSETTINGS);
  if (!(await fs.exists(appsettingsPath))) {
    return null;
  }

  const parsed = JSON.parse(await fs.readFile(appsettingsPath)) as unknown;
  const primaryDatabase = asRecord(asRecord(parsed).NetScript).PrimaryDatabase;
  return typeof primaryDatabase === 'string' ? primaryDatabase : null;
}

function noDatabaseRequired(): PluginDbDetectionResult {
  return {
    requiresDb: false,
    dbExists: false,
    targetConfigKey: null,
    targetEngine: null,
    needsProvisioning: false,
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}
