/**
 * @module infra/database/scaffolder_test
 */

import { assertStringIncludes } from 'jsr:@std/assert@^1';
import { describe, it } from 'jsr:@std/testing@^1/bdd';

import { MemoryFileSystemAdapter } from '../../adapters/scaffold/memory-fs.ts';
import { Scaffolder } from '../../adapters/scaffold/scaffolder.ts';
import { StringTemplateAdapter } from '../../adapters/scaffold/template-adapter.ts';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../application/registries/template-registry.ts';
import { DatabaseScaffolder } from './scaffolder.ts';

await DEFAULT_TEMPLATE_REGISTRY.hydrate();

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
      modelName: 'Product',
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
    const schema = await fs.readFile('/project/database/mysql/schema/schema.prisma');
    const seededCrudZod = await fs.readFile(
      '/project/database/mysql/schema/.generated/zod/crud.ts',
    );
    const seed = await fs.readFile('/project/database/mysql/scripts/seed.ts');

    assertStringIncludes(
      generateZod,
      "const ZOD_OUTPUT_DIR = new URL('../schema/.generated/zod', import.meta.url).pathname",
    );
    assertStringIncludes(
      generateZod,
      'await runWriteCrudZodBarrel(ZOD_OUTPUT_DIR, CRUD_MODEL_NAME);',
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
      'await runWriteCrudZodBarrel(ZOD_OUTPUT_DIR, CRUD_MODEL_NAME);',
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
      clearSeededClient,
      "new URL('../schema/.generated/zod/crud.ts', import.meta.url)",
    );
    assertStringIncludes(
      clearSeededClient,
      "new URL('../schema/.generated/zod', import.meta.url)",
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
    assertStringIncludes(schema, 'model Product {');
    assertStringIncludes(schema, 'id        Int      @id @default(autoincrement())');
    assertStringIncludes(
      seededCrudZod,
      'This file is seeded by netscript init and replaced by database code generation.',
    );
    assertStringIncludes(seededCrudZod, 'export const ProductSchema = z.object({');
    assertStringIncludes(seededCrudZod, 'export const ProductCreateInput = z.object({');
    assertStringIncludes(
      seededCrudZod,
      'export const ProductUpdateInput = ProductCreateInput.partial();',
    );
    assertStringIncludes(seed, 'const existing = await client.product.findFirst(');
    assertStringIncludes(seed, 'await client.product.create({');
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
    const defaultSeed = await fs.readFile('/project/database/mysql/scripts/seed.ts');
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
    assertStringIncludes(defaultSeed, 'client.exampleRecord.findFirst(');
  });
});
