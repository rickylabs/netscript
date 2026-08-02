import { assertEquals, assertRejects, assertStringIncludes } from 'jsr:@std/assert@^1';

import { MemoryFileSystemAdapter } from '../scaffold/memory-fs.ts';
import { Scaffolder } from '../scaffold/scaffolder.ts';
import { StringTemplateAdapter } from '../scaffold/template-adapter.ts';
import { copyPluginSchemasToRootDb, copyPluginSchemaToRootDb } from './db-integration.ts';
import { ScaffoldValidationError } from '../../domain/errors.ts';

Deno.test('copyPluginSchemaToRootDb copies plugin schema into active root DB schema tree', async () => {
  const fs = new MemoryFileSystemAdapter();
  const templateAdapter = new StringTemplateAdapter(fs);
  const scaffolder = new Scaffolder(templateAdapter, fs);
  const schema = 'model Example { id String @id }\n';

  await fs.writeFile('/project/plugins/test-worker/database/schema.prisma', schema);

  const result = await copyPluginSchemaToRootDb(
    '/project',
    'test-worker',
    {
      requiresDb: true,
      dbExists: true,
      targetConfigKey: 'postgres',
      targetEngine: 'postgres',
      needsProvisioning: false,
    },
    { fs, scaffolder },
  );

  if (result === null) {
    throw new Error('Expected schema copy result.');
  }
  assertEquals(
    result.targetPath.replace(/\\/g, '/'),
    '/project/database/postgres/schema/plugins/test-worker/test-worker.prisma',
  );
  assertEquals(
    await fs.readFile(result.targetPath),
    schema,
  );
});

Deno.test('copyPluginSchemaToRootDb skips non-DB plugins', async () => {
  const fs = new MemoryFileSystemAdapter();
  const templateAdapter = new StringTemplateAdapter(fs);
  const scaffolder = new Scaffolder(templateAdapter, fs);

  await fs.writeFile(
    '/project/plugins/no-db/database/schema.prisma',
    'model Example { id String @id }\n',
  );

  const result = await copyPluginSchemaToRootDb(
    '/project',
    'no-db',
    {
      requiresDb: false,
      dbExists: false,
      targetConfigKey: null,
      targetEngine: null,
      needsProvisioning: false,
    },
    { fs, scaffolder },
  );

  assertEquals(result, null);
  assertEquals(
    await fs.exists('/project/database/postgres/schema/plugins/no-db/no-db.prisma'),
    false,
  );
});

Deno.test('copyPluginSchemasToRootDb copies production plugin schema filenames', async () => {
  const fs = new MemoryFileSystemAdapter();
  const templateAdapter = new StringTemplateAdapter(fs);
  const scaffolder = new Scaffolder(templateAdapter, fs);
  const schema = 'model WorkerRecord { id String @id }\n';

  await fs.writeFile('/project/plugins/workers/database/workers.prisma', schema);

  const result = await copyPluginSchemasToRootDb(
    '/project',
    'workers',
    {
      requiresDb: true,
      dbExists: true,
      targetConfigKey: 'postgres',
      targetEngine: 'postgres',
      needsProvisioning: false,
    },
    { fs, scaffolder },
  );

  assertEquals(result.length, 1);
  assertEquals(
    result[0].targetPath.replace(/\\/g, '/'),
    '/project/database/postgres/schema/plugins/workers/workers.prisma',
  );
  assertEquals(await fs.readFile(result[0].targetPath), schema);
});

Deno.test('copyPluginSchemasToRootDb prefers package fragments over copied placeholders', async () => {
  const fs = new MemoryFileSystemAdapter();
  const scaffolder = new Scaffolder(new StringTemplateAdapter(fs), fs);
  const realSchema = 'model SagaInstance { id String @id }\n';
  await fs.writeFile('/project/plugins/sagas/database/schema.prisma', '// placeholder\n');

  const result = await copyPluginSchemasToRootDb(
    '/project',
    'sagas',
    {
      requiresDb: true,
      dbExists: true,
      targetConfigKey: 'postgres',
      targetEngine: 'postgres',
      needsProvisioning: false,
    },
    { fs, scaffolder },
    {
      packageFragments: [{ path: 'database/sagas.prisma', content: realSchema }],
      schemaDeclared: true,
    },
  );

  assertEquals(result.length, 1);
  assertEquals(
    result[0].targetPath.replaceAll('\\', '/'),
    '/project/database/postgres/schema/plugins/sagas/sagas.prisma',
  );
  assertEquals(await fs.readFile(result[0].targetPath), realSchema);
});

Deno.test('copyPluginSchemasToRootDb keeps the bare schema filename rule for package fragments', async () => {
  const fs = new MemoryFileSystemAdapter();
  const scaffolder = new Scaffolder(new StringTemplateAdapter(fs), fs);
  const result = await copyPluginSchemasToRootDb(
    '/project',
    'custom',
    {
      requiresDb: true,
      dbExists: true,
      targetConfigKey: 'postgres',
      targetEngine: 'postgres',
      needsProvisioning: false,
    },
    { fs, scaffolder },
    { packageFragments: [{ path: '/database/schema.prisma', content: 'model Custom {}\n' }] },
  );

  assertEquals(
    result[0].targetPath.replaceAll('\\', '/'),
    '/project/database/postgres/schema/plugins/custom/custom.prisma',
  );
});

Deno.test('copyPluginSchemasToRootDb validates declared schemas without widening no-DB behavior', async () => {
  const fs = new MemoryFileSystemAdapter();
  const scaffolder = new Scaffolder(new StringTemplateAdapter(fs), fs);
  const packageSearchPath = 'jsr:@example/plugin@0.0.2/database/**/*.prisma';
  const detection = {
    requiresDb: true,
    dbExists: true,
    targetConfigKey: 'postgres',
    targetEngine: 'postgres' as const,
    needsProvisioning: false,
  };

  const error = await assertRejects(
    () =>
      copyPluginSchemasToRootDb(
        '/project',
        'missing-db-plugin',
        detection,
        { fs, scaffolder },
        { schemaDeclared: true, packageSearchPath },
      ),
    ScaffoldValidationError,
  );
  assertStringIncludes(error.message, 'missing-db-plugin');
  assertEquals(error.context?.searchedPaths, [
    '/project/plugins/missing-db-plugin/database',
    packageSearchPath,
  ]);
  assertEquals(
    await copyPluginSchemasToRootDb(
      '/project',
      'no-schema',
      detection,
      { fs, scaffolder },
      { schemaDeclared: false },
    ),
    [],
  );
  assertEquals(
    await copyPluginSchemasToRootDb(
      '/project',
      'no-db',
      { ...detection, requiresDb: false, targetEngine: null },
      { fs, scaffolder },
      { schemaDeclared: true },
    ),
    [],
  );
});

Deno.test('copyPluginSchemasToRootDb rejects a dependency fragment that collides with a base declaration', async () => {
  const fs = new MemoryFileSystemAdapter();
  const scaffolder = new Scaffolder(new StringTemplateAdapter(fs), fs);
  const basePath = '/project/database/postgres/schema/schema.prisma';
  const fragmentPath = 'database/auth.prisma';
  await fs.writeFile(basePath, 'model User {\n  id String @id\n}\n');

  const error = await assertRejects(
    () =>
      copyPluginSchemasToRootDb(
        '/project',
        'auth',
        {
          requiresDb: true,
          dbExists: true,
          targetConfigKey: 'postgres',
          targetEngine: 'postgres',
          needsProvisioning: false,
        },
        { fs, scaffolder },
        {
          packageFragments: [{
            path: fragmentPath,
            content: 'model User {\n  id Int @id\n}\n',
          }],
          schemaDeclared: true,
        },
      ),
    ScaffoldValidationError,
  );

  assertStringIncludes(error.message, 'auth');
  assertStringIncludes(error.message, fragmentPath);
  assertStringIncludes(error.message, 'User');
  assertStringIncludes(error.message, basePath);
  assertEquals(error.context, {
    pluginName: 'auth',
    fragmentPath,
    declarationKind: 'model',
    declarationName: 'User',
    existingPath: basePath,
  });
});

Deno.test('copyPluginSchemasToRootDb deduplicates an identical base declaration', async () => {
  const fs = new MemoryFileSystemAdapter();
  const scaffolder = new Scaffolder(new StringTemplateAdapter(fs), fs);
  const schema = 'model User {\n  id String @id\n}\n';
  const targetPath = '/project/database/postgres/schema/plugins/auth/auth.prisma';
  await fs.writeFile('/project/database/postgres/schema/schema.prisma', schema);

  const results = await copyPluginSchemasToRootDb(
    '/project',
    'auth',
    {
      requiresDb: true,
      dbExists: true,
      targetConfigKey: 'postgres',
      targetEngine: 'postgres',
      needsProvisioning: false,
    },
    { fs, scaffolder },
    {
      packageFragments: [{ path: 'database/auth.prisma', content: schema }],
      schemaDeclared: true,
    },
  );

  assertEquals(results, [{
    sourcePath: 'database/auth.prisma',
    targetPath,
    written: false,
  }]);
  assertEquals(await fs.exists(targetPath), false);
});

Deno.test('copyPluginSchemasToRootDb reinstalls a changed fragment without self-collision', async () => {
  const fs = new MemoryFileSystemAdapter();
  const scaffolder = new Scaffolder(new StringTemplateAdapter(fs), fs);
  const targetPath = '/project/database/postgres/schema/plugins/auth/auth.prisma';
  // A prior install already wrote the fragment; the plugin now ships a changed body.
  await fs.writeFile(targetPath, 'model AuthUser {\n  id String @id\n}\n');
  const updated = 'model AuthUser {\n  id String @id\n  email String\n}\n';

  const results = await copyPluginSchemasToRootDb(
    '/project',
    'auth',
    {
      requiresDb: true,
      dbExists: true,
      targetConfigKey: 'postgres',
      targetEngine: 'postgres',
      needsProvisioning: false,
    },
    { fs, scaffolder },
    {
      packageFragments: [{ path: 'database/auth.prisma', content: updated }],
      schemaDeclared: true,
      overwrite: true,
    },
  );

  // The fragment must not be compared against its own previously-written copy.
  assertEquals(results, [{
    sourcePath: 'database/auth.prisma',
    targetPath,
    written: true,
  }]);
  assertEquals(await fs.readFile(targetPath), updated);
});
