/**
 * @module infra/database/workspace-mutator
 *
 * Workspace mutation helpers for database lifecycle commands.
 */

import { parseAppSettings } from '@netscript/aspire/config';
import { join } from '@std/path';

import { SCAFFOLD_DIRS } from '../../constants/scaffold/scaffold-dirs.ts';
import { SCAFFOLD_FILES } from '../../constants/scaffold/scaffold-files.ts';
import { ScaffoldValidationError } from '../../domain/errors.ts';
import { generateTsAspireConfig } from '../../templates/aspire/generate-aspire-config.ts';
import { HelpersGeneratorPipeline } from '../../templates/aspire/helpers/helpers-generator-pipeline.ts';
import type { DbEngineChoice } from '../../domain/db-engine.ts';
import type { FileSystemPort } from '../../ports/file-system-port.ts';
import type { ScaffolderPort, TemplatePort } from '../../ports/template-port.ts';
import type { DbEngine } from '../../domain/db-engine.ts';

/** Appsettings database entry data written after a DB workspace is scaffolded. */
export interface DatabaseAppsettingsMutation {
  /** Config key under `NetScript.Databases`. */
  readonly configKey: string;
  /** Database engine identifier. */
  readonly engine: DbEngine;
  /** Aspire resource or SQLite file name for the database. */
  readonly databaseName: string;
}

/** Mutates root config files after scaffolding a database workspace. */
export class DatabaseWorkspaceMutator {
  /** Create a mutator with injected filesystem and template adapters. */
  constructor(
    private readonly fs: FileSystemPort,
    private readonly scaffolder: ScaffolderPort,
    private readonly templateAdapter: TemplatePort,
  ) {}

  /** Add a database entry to root `appsettings.json`. */
  async addDatabaseToAppsettings(
    projectRoot: string,
    database: DatabaseAppsettingsMutation,
  ): Promise<void> {
    const path = join(projectRoot, SCAFFOLD_FILES.APPSETTINGS);
    if (!(await this.fs.exists(path))) {
      throw new ScaffoldValidationError('appsettings.json not found.', { projectRoot });
    }

    const parsed = JSON.parse(await this.fs.readFile(path)) as unknown;
    const root = asMutableRecord(parsed);
    const netScript = ensureRecord(root, 'NetScript');
    const databases = ensureRecord(netScript, 'Databases');
    if (databases[database.configKey] !== undefined) {
      throw new ScaffoldValidationError(`Database "${database.configKey}" already exists.`, {
        configKey: database.configKey,
      });
    }

    databases[database.configKey] = {
      Enabled: true,
      Engine: toConfigEngine(database.engine),
      Mode: database.engine === 'sqlite' ? undefined : 'Container',
      DatabaseName: database.databaseName,
      ...(database.engine === 'sqlite' ? {} : { Persistent: true }),
      ...(database.engine === 'sqlite' ? {} : { DataPath: `.data/${database.configKey}` }),
    };
    if (typeof netScript.PrimaryDatabase !== 'string') {
      netScript.PrimaryDatabase = database.configKey;
    }
    const primaryDatabase = typeof netScript.PrimaryDatabase === 'string'
      ? netScript.PrimaryDatabase
      : database.configKey;
    const tools = ensureRecord(netScript, 'Tools');
    const prismaStudio = tools['prisma-studio'];
    if (prismaStudio === undefined) {
      tools['prisma-studio'] = {
        Enabled: true,
        TaskName: 'db:studio',
        Database: primaryDatabase,
        Description: 'Prisma Studio for database management',
      };
    } else if (typeof prismaStudio === 'object' && prismaStudio !== null) {
      const studioRecord = prismaStudio as Record<string, unknown>;
      if (typeof studioRecord.Database !== 'string') {
        studioRecord.Database = primaryDatabase;
      }
      if (typeof studioRecord.TaskName !== 'string') {
        studioRecord.TaskName = 'db:studio';
      }
      if (typeof studioRecord.Description !== 'string') {
        studioRecord.Description = 'Prisma Studio for database management';
      }
      if (typeof studioRecord.Enabled !== 'boolean') {
        studioRecord.Enabled = true;
      }
    }

    await this.fs.writeFile(path, JSON.stringify(root, null, 2) + '\n');
  }

  /** Add a database workspace member to root `deno.json`. */
  async addDatabaseWorkspaceMember(
    projectRoot: string,
    engineDirName: string,
  ): Promise<void> {
    const path = join(projectRoot, SCAFFOLD_FILES.DENO_JSON);
    if (!(await this.fs.exists(path))) {
      throw new ScaffoldValidationError('deno.json not found.', { projectRoot });
    }

    const parsed = JSON.parse(await this.fs.readFile(path)) as unknown;
    const root = asMutableRecord(parsed);
    const workspace = Array.isArray(root.workspace) ? root.workspace : [];
    const member = `${SCAFFOLD_DIRS.DATABASE}/${engineDirName}`;
    const normalized = member.startsWith('./') ? member : `./${member}`;
    if (!workspace.includes(normalized)) {
      root.workspace = [...workspace, normalized];
    }

    await this.fs.writeFile(path, JSON.stringify(root, null, 2) + '\n');
  }

  /** Regenerate `aspire.config.json` with the configured DB engines. */
  async regenerateAspireConfig(projectRoot: string): Promise<void> {
    const aspireDir = join(projectRoot, SCAFFOLD_DIRS.ASPIRE_TS);
    if (!(await this.fs.exists(aspireDir))) {
      return;
    }

    const { config } = await parseAppSettings(join(projectRoot, SCAFFOLD_FILES.APPSETTINGS));
    const aspireConfigContent = generateTsAspireConfig({
      dbEngines: collectConfiguredDbEngines(config.Databases),
    });
    await this.fs.writeFile(join(aspireDir, SCAFFOLD_FILES.ASPIRE_CONFIG), aspireConfigContent);
  }

  /** Regenerate TypeScript AppHost helper files from root `appsettings.json`. */
  async regenerateAppHostHelpers(projectRoot: string): Promise<readonly string[]> {
    const aspireDir = join(projectRoot, SCAFFOLD_DIRS.ASPIRE_TS);
    if (!(await this.fs.exists(aspireDir))) {
      return [];
    }

    const { config } = await parseAppSettings(join(projectRoot, SCAFFOLD_FILES.APPSETTINGS));
    const helpersPipeline = new HelpersGeneratorPipeline(this.templateAdapter);
    const files = await helpersPipeline.execute({
      config,
      configPath: `../${SCAFFOLD_FILES.APPSETTINGS}`,
      generateAppHost: true,
    });

    const written: string[] = [];
    for (const file of files) {
      const path = join(aspireDir, file.path);
      if (await this.scaffolder.writeFile(path, file.content, true)) {
        written.push(path);
      }
    }
    return written;
  }
}

function toConfigEngine(engine: DbEngine): 'Postgres' | 'Mysql' | 'Mssql' | 'Sqlite' {
  switch (engine) {
    case 'postgres':
      return 'Postgres';
    case 'mysql':
      return 'Mysql';
    case 'mssql':
      return 'Mssql';
    case 'sqlite':
      return 'Sqlite';
  }
}

function asMutableRecord(value: unknown): Record<string, unknown> {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  throw new ScaffoldValidationError('Expected JSON object.');
}

function ensureRecord(parent: Record<string, unknown>, key: string): Record<string, unknown> {
  const value = parent[key];
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  const next: Record<string, unknown> = {};
  parent[key] = next;
  return next;
}

function collectConfiguredDbEngines(
  databases: Record<string, { Engine?: string }>,
): DbEngineChoice[] {
  const engines = new Set<DbEngineChoice>();
  for (const entry of Object.values(databases)) {
    const engine = toDbEngineChoice(entry.Engine);
    if (engine) {
      engines.add(engine);
    }
  }
  return [...engines];
}

function toDbEngineChoice(engine: string | undefined): DbEngineChoice | undefined {
  switch (engine) {
    case 'Postgres':
      return 'postgres';
    case 'Mysql':
      return 'mysql';
    case 'Mssql':
      return 'mssql';
    case 'Sqlite':
      return 'sqlite';
    default:
      return undefined;
  }
}
