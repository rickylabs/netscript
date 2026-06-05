import { assertEquals } from 'jsr:@std/assert@^1';

import { MemoryFileSystemAdapter } from '../scaffold/memory-fs.ts';
import { Scaffolder } from '../scaffold/scaffolder.ts';
import { StringTemplateAdapter } from '../scaffold/template-adapter.ts';
import { copyPluginSchemasToRootDb, copyPluginSchemaToRootDb } from './db-integration.ts';

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
