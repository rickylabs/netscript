import { assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { walk } from '@std/fs';
import { fromFileUrl, join } from '@std/path';
import { AstExtractor, FilesystemWalker, RegistryEmitter } from '@netscript/plugin/sdk';
import { DenoFileSystem } from '../../../../kernel/adapters/runtime/file-system/deno-file-system.ts';
import { DenoGeneratedSourceFormatter } from '../../../../kernel/adapters/runtime/process/deno-generated-source-formatter.ts';
import { DenoProcess } from '../../../../kernel/adapters/runtime/process/deno-process.ts';
import { PluginRegistryScaffolder } from '../../../../kernel/adapters/plugin/registry-scaffolder.ts';
import { PluginWorkspaceMutator } from '../../../../kernel/adapters/plugin/workspace-mutator.ts';
import { Scaffolder } from '../../../../kernel/adapters/scaffold/scaffolder.ts';
import { StringTemplateAdapter } from '../../../../kernel/adapters/scaffold/template-adapter.ts';
import { PluginKindRegistry } from '../../../../kernel/application/registries/plugin-kind-registry.ts';
import { resolveLocalPluginDescriptor } from '../install/install-plugin.ts';
import { createUpdatePluginCommand } from './update-plugin-command.ts';
import type { EmitterPort } from '@netscript/plugin/sdk';

for (const factory of ['defineSaga', 'defineStreamSchema', 'defineExample']) {
  Deno.test(`plugin update rejects undeclared ${factory} before writes and leaves every file byte-identical`, async () => {
    const fixture = await createFixture();
    try {
      await Deno.writeTextFile(
        join(fixture.root, 'authored.ts'),
        `import { ${factory} } from '${
          factory == 'defineSaga'
            ? '@netscript/plugin-sagas-core'
            : factory == 'defineStreamSchema'
            ? '@netscript/plugin-streams-core'
            : '@acme/plugin-example-core'
        }';
export const definition = ${factory}({});`,
      );
      const before = await snapshot(fixture.root);
      await assertRejects(
        () => fixture.command.parse(['streams']),
        TypeError,
        `Contribution factory "${factory}" has no declared axis`,
      );
      assertEquals(await snapshot(fixture.root), before);
      assertEquals(fixture.scaffoldCalls(), 0);
    } finally {
      await Deno.remove(fixture.root, { recursive: true });
    }
  });
}

Deno.test('plugin update validates emitter failure before any installation writes', async () => {
  const fixture = await createFixture({
    emit: () => Promise.reject(new Error('invalid registry')),
  });
  try {
    const before = await snapshot(fixture.root);
    await assertRejects(() => fixture.command.parse(['streams']), Error, 'invalid registry');
    assertEquals(await snapshot(fixture.root), before);
    assertEquals(fixture.scaffoldCalls(), 0);
  } finally {
    await Deno.remove(fixture.root, { recursive: true });
  }
});

Deno.test('plugin update supports a published core-only saga host and excludes stream schema maps', async () => {
  const fixture = await createFixture();
  try {
    await Deno.writeTextFile(
      join(fixture.root, 'discovery.ts'),
      `export const NETSCRIPT_CONTRIBUTION_BUILDERS = [
  { callee: 'defineSaga', axis: 'sagas' },
  { callee: 'defineStreamSchema', axis: null },
] as const;`,
    );
    await Deno.writeTextFile(
      join(fixture.root, 'authored.ts'),
      `import { defineSaga } from '@netscript/plugin-sagas-core';
import { defineStreamSchema } from '@netscript/plugin-streams-core';
export const saga = defineSaga('onboarding').state({ status: 'pending' })
  .on('created', () => []).build();
export const schema = defineStreamSchema({});`,
    );
    await fixture.command.parse(['streams']);
    assertEquals(fixture.scaffoldCalls(), 1);
    const registry = await Deno.readTextFile(
      join(fixture.root, '.netscript/generated/sagas.registry.ts'),
    );
    assertStringIncludes(registry, 'String(sagas0.id)');
    assertEquals(
      (await snapshot(fixture.root)).filter(([path]) => path.endsWith('.registry.ts'))
        .map(([path]) => path),
      ['.netscript/generated/existing.registry.ts', '.netscript/generated/sagas.registry.ts'],
    );
    assertEquals(fixture.messages(), [fixture.completionMessage]);
  } finally {
    await Deno.remove(fixture.root, { recursive: true });
  }
});

async function snapshot(root: string): Promise<readonly (readonly [string, number[]])[]> {
  const files: Array<readonly [string, number[]]> = [];
  for await (const entry of walk(root, { includeDirs: false })) {
    files.push([entry.path.slice(root.length + 1), [...await Deno.readFile(entry.path)]]);
  }
  return files.sort(([left], [right]) => left.localeCompare(right));
}

async function createFixture(emitter: EmitterPort = new RegistryEmitter()) {
  const root = await Deno.makeTempDir();
  const fs = new DenoFileSystem();
  const registry = new PluginKindRegistry();
  const pluginPath = fromFileUrl(new URL('../../../../../../../plugins/streams', import.meta.url));
  const resolved = await resolveLocalPluginDescriptor(pluginPath, registry, fs);
  const templateAdapter = new StringTemplateAdapter(fs);
  const scaffolder = new Scaffolder(templateAdapter, fs);
  const messages: string[] = [];
  let scaffoldCalls = 0;
  await fs.writeFile(
    join(root, 'appsettings.json'),
    JSON.stringify({
      NetScript: {
        Name: 'fixture-app',
        Services: {},
        Plugins: {},
        BackgroundProcessors: {},
      },
    }) + '\n',
  );
  await fs.writeFile(join(root, 'deno.json'), '{"workspace":[],"imports":{}}\n');
  await fs.writeFile(
    join(root, 'netscript.config.ts'),
    "export default { name: 'fixture-app', databases: { config: [] }, plugins: [] };\n",
  );
  await fs.writeFile(join(root, 'streams/plugin.ts'), '// previously installed control module\n');
  await fs.writeFile(
    join(root, '.netscript/generated/existing.registry.ts'),
    '// existing bytes\r\n',
  );
  const command = createUpdatePluginCommand({
    resolveProjectRoot: () => Promise.resolve(root),
    print: (message) => messages.push(message),
    installPluginDependencies: {
      fs,
      registry,
      scaffolder,
      templateAdapter,
      formatter: new DenoGeneratedSourceFormatter(new DenoProcess()),
      registryScaffolder: new PluginRegistryScaffolder(scaffolder),
      workspaceMutator: new PluginWorkspaceMutator(fs),
      pluginValidator: {
        validate: () => Promise.resolve({ ok: true, descriptor: resolved.descriptor }),
      },
      processRunner: {
        exec: async (_command, args) => {
          if (args.some((arg) => arg.endsWith('/scaffold'))) {
            scaffoldCalls += 1;
            await fs.writeFile(join(root, 'streams/plugin.ts'), '// updated control module\n');
          }
          return {
            code: 0,
            stdout: JSON.stringify({
              status: 'applied',
              createdFiles: [],
              modifiedFiles: ['streams/plugin.ts'],
              databaseMigrationsAdded: false,
            }),
            stderr: '',
          };
        },
      },
      regenerateHelpers: () => Promise.resolve([]),
    },
    registryDependencies: {
      resolveProjectRoot: () => Promise.resolve(root),
      generate: () => Promise.resolve([]),
      walker: new FilesystemWalker(),
      extractor: new AstExtractor(),
      emitter,
      fs,
    },
  });
  return {
    root,
    command,
    scaffoldCalls: () => scaffoldCalls,
    messages: () => messages,
    completionMessage: `Updated streams to ${resolved.descriptor.version}; generated 1 registries.`,
  };
}
