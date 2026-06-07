/**
 * @module infra/database/scaffolder_test
 */

import { assertStringIncludes } from 'jsr:@std/assert@^1';
import { describe, it } from 'jsr:@std/testing@^1/bdd';

import { MemoryFileSystemAdapter } from '../../adapters/scaffold/memory-fs.ts';
import { Scaffolder } from '../../adapters/scaffold/scaffolder.ts';
import { StringTemplateAdapter } from '../../adapters/scaffold/template-adapter.ts';
import { DatabaseScaffolder } from './scaffolder.ts';

describe('DatabaseScaffolder', () => {
  it('renders database script wrappers with concrete schema and generated paths', async () => {
    const fs = new MemoryFileSystemAdapter();
    const templateAdapter = new StringTemplateAdapter(fs);
    const scaffolder = new Scaffolder(templateAdapter, fs);
    const databaseScaffolder = new DatabaseScaffolder(
      scaffolder,
      fs,
      templateAdapter,
    );

    await databaseScaffolder.scaffold({
      projectName: 'alpha-app',
      targetPath: '/project',
      engine: 'mysql',
      importMode: 'jsr',
    });

    const generateZod = await fs.readFile('/project/database/mysql/scripts/generate-zod.ts');
    const fixZodImports = await fs.readFile('/project/database/mysql/scripts/fix-zod-imports.ts');
    const migrate = await fs.readFile('/project/database/mysql/scripts/migrate.ts');
    const clearSeededClient = await fs.readFile(
      '/project/database/mysql/scripts/clear-seeded-client.ts',
    );
    const patchPrismaClient = await fs.readFile(
      '/project/database/mysql/scripts/patch-prisma-client.ts',
    );
    const rootZodConfig = await fs.readFile(
      '/project/database/mysql/zod-generator.config.json',
    );
    const schemaZodConfig = await fs.readFile(
      '/project/database/mysql/schema/zod-generator.config.json',
    );

    assertStringIncludes(
      generateZod,
      "const ZOD_OUTPUT_DIR = new URL('../schema/.generated/zod', import.meta.url).pathname",
    );
    assertStringIncludes(
      generateZod,
      'await generateZodSchemasCli({ zodOutputDir: ZOD_OUTPUT_DIR });',
    );

    assertStringIncludes(
      fixZodImports,
      "const ZOD_OUTPUT_DIR = new URL('../schema/.generated/zod', import.meta.url).pathname",
    );
    assertStringIncludes(
      fixZodImports,
      'await runFixZodImports(ZOD_OUTPUT_DIR, { fixDecimalImports: true });',
    );
    assertStringIncludes(
      fixZodImports,
      'await runPatchPrismaClient(GENERATED_DIR);',
    );

    assertStringIncludes(
      migrate,
      "await runMigrationCli({ provider: 'mysql' });",
    );

    assertStringIncludes(
      clearSeededClient,
      "new URL('../schema/.generated/client.server.ts', import.meta.url)",
    );

    assertStringIncludes(
      patchPrismaClient,
      "const GENERATED_DIR = new URL('../schema/.generated', import.meta.url).pathname",
    );
    assertStringIncludes(
      patchPrismaClient,
      'await runPatchPrismaClient(GENERATED_DIR);',
    );

    assertStringIncludes(rootZodConfig, '"zodImportTarget": "v4"');
    assertStringIncludes(schemaZodConfig, '"emit": {');
  });

  it('derives unique container database names for added engines', async () => {
    const fs = new MemoryFileSystemAdapter();
    const templateAdapter = new StringTemplateAdapter(fs);
    const scaffolder = new Scaffolder(templateAdapter, fs);
    const databaseScaffolder = new DatabaseScaffolder(
      scaffolder,
      fs,
      templateAdapter,
    );

    const mysql = await databaseScaffolder.scaffold({
      projectName: 'alpha-app',
      targetPath: '/project',
      engine: 'mysql',
      configKey: 'mysql',
      importMode: 'jsr',
    });
    const mssql = await databaseScaffolder.scaffold({
      projectName: 'alpha-app',
      targetPath: '/project',
      engine: 'mssql',
      configKey: 'mssql',
      importMode: 'jsr',
      overwrite: true,
    });

    assertStringIncludes(mysql.databaseName, 'alpha-app-mysql-db');
    assertStringIncludes(mssql.databaseName, 'alpha-app-mssql-db');
  });
});
