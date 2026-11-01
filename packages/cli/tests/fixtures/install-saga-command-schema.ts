/** Exercise the installed package fragment path independently of database compiler settings. */
import { MemoryFileSystemAdapter } from '../../src/kernel/adapters/scaffold/memory-fs.ts';
import { Scaffolder } from '../../src/kernel/adapters/scaffold/scaffolder.ts';
import { StringTemplateAdapter } from '../../src/kernel/adapters/scaffold/template-adapter.ts';
import { copyPluginSchemasToRootDb } from '../../src/kernel/adapters/plugin/db-integration.ts';
import { sagasPlugin } from '../../../../plugins/sagas/mod.ts';

const fs = new MemoryFileSystemAdapter();
const scaffolder = new Scaffolder(new StringTemplateAdapter(fs), fs);
const declarations = [
  ...(sagasPlugin.contributions.databaseSchemas ?? []),
  ...(sagasPlugin.contributions.migrations ?? []),
];
const packageFragments = await Promise.all(declarations.map(async ({ path }) => ({
  path,
  content: await Deno.readTextFile(new URL('../../../../plugins/sagas/' + path, import.meta.url)),
})));
const fixture = await Deno.readTextFile(
  new URL('../../../database/tests/fixtures/command-store/schema.prisma', import.meta.url),
);
const copiedModel = Deno.args[1] === 'adopt'
  ? fixture.slice(fixture.indexOf('model NetScriptCommandOutbox {'))
  : '';
if (copiedModel) {
  await fs.writeFile('/project/database/postgres/schema/adopted.prisma', copiedModel);
}
const copies = await copyPluginSchemasToRootDb(
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
  { schemaDeclared: true, packageFragments },
);
const installed = await Promise.all(
  copies.filter((copy) => copy.written).map(async (copy) => ({
    name: copy.targetPath.split('/').at(-1)!,
    content: await fs.readFile(copy.targetPath),
  })),
);
await Deno.writeTextFile(Deno.args[0], JSON.stringify({ copiedModel, installed }));
