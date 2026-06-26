/**
 * @module infra/database/scaffolder
 *
 * Adapter-backed scaffolder for complete `database/<engine>/` workspaces.
 */

import { join } from '@std/path';
import { normalize as normalizePosix } from '@std/path/posix';

import { SCAFFOLD_DIRS } from '../../constants/scaffold/scaffold-dirs.ts';
import { SCAFFOLD_FILES } from '../../constants/scaffold/scaffold-files.ts';
import type { FileSystemPort } from '../../ports/file-system-port.ts';
import type { ScaffolderPort, TemplatePort } from '../../ports/template-port.ts';
import type { ScaffoldResult } from '../../domain/core-types.ts';
import {
  deriveContainerDbResourceName,
  deriveSqliteDbFileName,
} from '../../templates/aspire/generate-appsettings.ts';
import { TEMPLATE_KEYS } from '../../assets/manifest.ts';
import {
  generateDatabaseDenoJson,
  generateDatabaseFacadeMod,
  generateEngineMod,
  generatePrismaConfig,
} from '../../templates/database/database-generators.ts';
import { DbEngineRegistry } from '../../application/registries/db-engine-registry.ts';
import type { DatabaseScaffoldOptions, DatabaseScaffoldResult } from '../../domain/db-engine.ts';
import { renderTemplateAssetSync } from '../templates/template-asset.ts';

function generatePlaceholderPrismaClient(): string {
  return `// This file is seeded by netscript init and replaced by Prisma generation.

export class PrismaClient {
  constructor(_options?: unknown) {}

  async $disconnect(): Promise<void> {}

  async $queryRawUnsafe(_query: string): Promise<unknown> {
    return undefined;
  }
}

export default PrismaClient;
`;
}

function generateClearSeededPrismaClient(): string {
  return `/**
 * Remove the seeded Prisma client placeholder before real Prisma generation.
 *
 * @module
 */

try {
  await Deno.remove(new URL('../schema/.generated/client.server.ts', import.meta.url));
} catch (error) {
  if (!(error instanceof Deno.errors.NotFound)) {
    throw error;
  }
}
`;
}

/** Creates database workspaces using the existing scaffold adapter contracts. */
export class DatabaseScaffolder {
  /**
   * Create a database scaffolder.
   *
   * @param scaffolder - Scaffold file writer abstraction.
   * @param fs - Filesystem abstraction for directory creation.
   * @param templateAdapter - Template renderer for Tier 2 templates.
   * @param registry - Engine provider registry.
   */
  constructor(
    private readonly scaffolder: ScaffolderPort,
    private readonly fs: FileSystemPort,
    private readonly _templateAdapter: TemplatePort,
    private readonly registry: DbEngineRegistry = new DbEngineRegistry(),
  ) {}

  /**
   * Scaffold a complete database workspace for one engine.
   *
   * @param options - Database scaffold options.
   * @returns Created/skipped files plus resolved database identity.
   */
  async scaffold(options: DatabaseScaffoldOptions): Promise<DatabaseScaffoldResult> {
    const start = performance.now();
    const provider = this.registry.get(options.engine);
    const configKey = options.configKey ?? provider.engine;
    const databaseName = provider.engine === 'sqlite'
      ? deriveSqliteDbFileName(options.projectName)
      : deriveContainerDbResourceName(options.projectName, configKey);
    const databaseRoot = join(options.targetPath, SCAFFOLD_DIRS.DATABASE);
    const workspaceDir = join(databaseRoot, provider.dirName);
    const schemaDir = join(workspaceDir, 'schema');
    const generatedDir = join(schemaDir, '.generated');
    const migrationsDir = join(workspaceDir, 'migrations');
    const scriptsDir = join(workspaceDir, 'scripts');

    const filesCreated: string[] = [];
    const filesSkipped: string[] = [];
    const directoriesCreated: string[] = [];
    const overwrite = options.overwrite ?? false;

    for (
      const dir of [databaseRoot, workspaceDir, schemaDir, generatedDir, migrationsDir, scriptsDir]
    ) {
      await this.fs.createDir(dir);
      directoriesCreated.push(dir);
    }

    const write = async (path: string, content: string): Promise<void> => {
      if (await this.scaffolder.writeFile(path, content, overwrite)) {
        filesCreated.push(path);
      } else {
        filesSkipped.push(path);
      }
    };

    const localBase = options.importMode === 'local'
      ? rebaseLocalImportBase(options.localBase ?? '../..')
      : undefined;
    const templateVars = {
      prismaProvider: provider.prismaProvider,
      engine: provider.engine,
      displayName: provider.displayName,
      configKey,
      databaseName,
    };

    await write(
      join(workspaceDir, SCAFFOLD_FILES.DENO_JSON),
      generateDatabaseDenoJson(provider, {
        projectName: options.projectName,
        importMode: options.importMode,
        localBase,
      }),
    );
    await write(
      join(workspaceDir, 'prisma.config.ts'),
      generatePrismaConfig(provider, {
        configKey,
        databaseName,
      }),
    );
    await write(join(databaseRoot, SCAFFOLD_FILES.MOD), generateDatabaseFacadeMod(provider));
    await write(join(workspaceDir, SCAFFOLD_FILES.MOD), generateEngineMod(provider, { configKey }));
    await write(
      join(schemaDir, 'schema.prisma'),
      renderTemplateAssetSync(TEMPLATE_KEYS.databaseSchema, templateVars),
    );
    await write(
      join(generatedDir, provider.capabilities.clientEntrypoint),
      generatePlaceholderPrismaClient(),
    );
    await write(
      join(scriptsDir, 'seed.ts'),
      renderTemplateAssetSync(TEMPLATE_KEYS.databaseSeed, templateVars),
    );
    await write(
      join(scriptsDir, 'fix-zod-imports.ts'),
      renderTemplateAssetSync(TEMPLATE_KEYS.databaseScriptsFixZodImports, templateVars),
    );
    await write(
      join(scriptsDir, 'migrate.ts'),
      renderTemplateAssetSync(TEMPLATE_KEYS.databaseScriptsMigrate, templateVars),
    );
    await write(join(scriptsDir, 'clear-seeded-client.ts'), generateClearSeededPrismaClient());

    if (provider.capabilities.hasZodGeneration) {
      const zodGeneratorConfig = renderTemplateAssetSync(
        TEMPLATE_KEYS.databaseZodGeneratorConfig,
        templateVars,
      );
      await write(join(workspaceDir, 'zod-generator.config.json'), zodGeneratorConfig);
      await write(join(schemaDir, 'zod-generator.config.json'), zodGeneratorConfig);
      await write(
        join(scriptsDir, 'generate-zod.ts'),
        renderTemplateAssetSync(TEMPLATE_KEYS.databaseScriptsGenerateZod, templateVars),
      );
    }

    await write(
      join(scriptsDir, 'patch-prisma-client.ts'),
      renderTemplateAssetSync(TEMPLATE_KEYS.databaseScriptsPatchPrismaClient, templateVars),
    );

    const scaffoldResult: ScaffoldResult = {
      filesCreated,
      directoriesCreated,
      filesSkipped,
      totalOperations: filesCreated.length + directoriesCreated.length,
      durationMs: performance.now() - start,
    };

    return {
      scaffoldResult,
      workspaceDir,
      configKey,
      databaseName,
    };
  }
}

function rebaseLocalImportBase(localBase: string): string {
  const rebased = normalizePosix(`../../${localBase}`);
  return rebased.startsWith('./') || rebased.startsWith('../') || rebased.startsWith('/')
    ? rebased
    : `./${rebased}`;
}
