import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';

import { MemoryFileSystemAdapter } from '../../../../kernel/adapters/scaffold/memory-fs.ts';
import { Scaffolder } from '../../../../kernel/adapters/scaffold/scaffolder.ts';
import { StringTemplateAdapter } from '../../../../kernel/adapters/scaffold/template-adapter.ts';
import { DbEngineRegistry } from '../../../../kernel/application/registries/db-engine-registry.ts';
import { DatabaseScaffolder } from '../../../../kernel/adapters/database/scaffolder.ts';
import { DatabaseWorkspaceMutator } from '../../../../kernel/adapters/database/workspace-mutator.ts';
import { addDb } from './add-db.ts';
import { planDbAdd } from './plan-db-add.ts';

describe('public add database flow', () => {
  it('plans a database add request from project metadata', async () => {
    const fs = new MemoryFileSystemAdapter();
    await writeProjectFiles(fs);

    const plan = await planDbAdd({
      engine: 'POSTGRES',
      configKey: undefined,
      projectRoot: '/workspace/alpha',
      overwrite: false,
    }, {
      fs,
      registry: new DbEngineRegistry(),
    });

    assertEquals(plan.engine, 'postgres');
    assertEquals(plan.configKey, 'postgres');
    assertEquals(plan.projectName, 'alpha-app');
  });

  it('writes the database workspace and root project metadata', async () => {
    const fs = new MemoryFileSystemAdapter();
    await writeProjectFiles(fs);
    const templateAdapter = new StringTemplateAdapter(fs);
    const scaffolder = new Scaffolder(templateAdapter, fs);
    const registry = new DbEngineRegistry();

    await addDb({
      engine: 'sqlite',
      configKey: 'primary',
      projectRoot: '/workspace/alpha',
      overwrite: false,
    }, {
      fs,
      registry,
      databaseScaffolder: new DatabaseScaffolder(scaffolder, fs, templateAdapter, registry),
      workspaceMutator: new DatabaseWorkspaceMutator(fs, scaffolder, templateAdapter),
    });

    const appsettings = JSON.parse(
      await fs.readFile('/workspace/alpha/appsettings.json'),
    );
    const denoJson = JSON.parse(await fs.readFile('/workspace/alpha/deno.json'));
    const dbDenoJson = JSON.parse(
      await fs.readFile('/workspace/alpha/database/sqlite/deno.json'),
    );

    assertEquals(appsettings.NetScript.Databases.primary.Engine, 'Sqlite');
    assertEquals(denoJson.workspace.includes('./database/sqlite'), true);
    assertStringIncludes(
      dbDenoJson.imports['@netscript/database/scripts'],
      'jsr:@netscript/database',
    );
  });
});

async function writeProjectFiles(fs: MemoryFileSystemAdapter): Promise<void> {
  await fs.writeFile(
    '/workspace/alpha/appsettings.json',
    JSON.stringify(
      {
        NetScript: {
          Name: 'alpha-app',
          Databases: {},
        },
      },
      null,
      2,
    ) + '\n',
  );
  await fs.writeFile(
    '/workspace/alpha/deno.json',
    JSON.stringify({ workspace: ['apps/web'] }, null, 2) + '\n',
  );
}
