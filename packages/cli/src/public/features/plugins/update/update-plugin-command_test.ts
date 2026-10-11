import { workersStarterResources } from '../../../../../../../plugins/workers/src/adapter/plugin.ts';
import { streamsStarterResources } from '../../../../../../../plugins/streams/src/adapter/plugin.ts';
import { createContributionExtractor } from '../../../../kernel/adapters/plugin/contribution-extractor.ts';
import { assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { walk } from '@std/fs';
import { fromFileUrl, join, relative, resolve } from '@std/path';
import { FilesystemWalker, RegistryEmitter } from '@netscript/plugin/sdk';
import { DenoProjectStage } from '../../../../kernel/adapters/runtime/file-system/deno-project-stage.ts';
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

for (const factory of ['defineExample']) {
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
      assertEquals(fixture.scaffoldCalls(), 1);
      assertEquals(fixture.scaffoldRoots.every((path) => path !== fixture.root), true);
      for (const path of fixture.scaffoldRoots) {
        await assertRejects(() => Deno.stat(path), Deno.errors.NotFound);
      }
    } finally {
      await Deno.remove(fixture.root, { recursive: true });
    }
  });
}

for (
  const declaration of [
    "export const NETSCRIPT_CONTRIBUTION_BUILDERS = [{ callee: 'defineTask', axis: 'jobs' }] as const;",
    "export const NETSCRIPT_CONTRIBUTION_BUILDERS = [{ callee: 'defineTask', axis: 42 }] as const;",
  ]
) {
  Deno.test(`plugin update keeps all bytes on invalid first-party metadata: ${declaration}`, async () => {
    const fixture = await createFixture(new RegistryEmitter(), 'streams', {
      'streams/plugin.ts': declaration,
    });
    try {
      const before = await snapshot(fixture.root);
      await assertRejects(() => fixture.command.parse(['streams']), TypeError);
      assertEquals(await snapshot(fixture.root), before);
      for (const stagedRoot of fixture.scaffoldRoots) {
        await assertRejects(() => Deno.stat(stagedRoot), Deno.errors.NotFound);
      }
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
    assertEquals(fixture.scaffoldCalls(), 1);
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

for (
  const { kind, factory, axis, importPath } of [
    {
      kind: 'streams',
      factory: 'defineStreamSchema',
      axis: null,
      importPath: '@netscript/plugin-streams-core',
    },
    {
      kind: 'workers',
      factory: 'defineJob',
      axis: 'jobs',
      importPath: '@netscript/plugin-workers-core',
    },
  ]
) {
  Deno.test(`plugin update ${kind} repairs a legacy control module before discovering ${factory}`, async () => {
    const declaration = `export const NETSCRIPT_CONTRIBUTION_BUILDERS = [
      { callee: '${factory}', axis: ${JSON.stringify(axis)} },
    ] as const;`;
    const fixture = await createFixture(new RegistryEmitter(), kind, {
      [`${kind}/plugin.ts`]: declaration,
    });
    try {
      await Deno.writeTextFile(
        join(fixture.root, 'authored.ts'),
        `import { ${factory} } from '${importPath}';
export const definition = ${factory}({});`,
      );
      await fixture.command.parse([kind]);
      assertEquals(fixture.scaffoldCalls(), 1);
      assertEquals(fixture.scaffoldRoots.every((path) => path !== fixture.root), true);
      for (const path of fixture.scaffoldRoots) {
        await assertRejects(() => Deno.stat(path), Deno.errors.NotFound);
      }
      assertEquals(await Deno.readTextFile(join(fixture.root, `${kind}/plugin.ts`)), declaration);
      assertEquals(
        await Deno.stat(join(fixture.root, '.netscript/generated/existing.registry.ts')).then(
          (info) => info.isFile,
        ),
        true,
      );
      if (axis !== null) {
        assertStringIncludes(
          await Deno.readTextFile(join(fixture.root, `.netscript/generated/${axis}.registry.ts`)),
          'authored.ts',
        );
      } else {
        assertEquals(
          (await snapshot(fixture.root)).filter(([path]) => path.endsWith('.registry.ts')).length,
          1,
        );
      }
    } finally {
      await Deno.remove(fixture.root, { recursive: true });
    }
  });
}

Deno.test('plugin update discovers changed declarations and contributions created by the scaffold', async () => {
  const fixture = await createFixture(new RegistryEmitter(), 'streams', {
    'streams/plugin.ts': `export const NETSCRIPT_CONTRIBUTION_BUILDERS = [
      { callee: 'defineExample', axis: 'newItems' },
    ] as const;`,
    'streams/new.ts': `import { defineExample } from '@acme/plugin-example-core';
export const added = defineExample({ id: 'new' });`,
  });
  try {
    await Deno.writeTextFile(
      join(fixture.root, 'streams/plugin.ts'),
      `export const NETSCRIPT_CONTRIBUTION_BUILDERS = [{ callee: 'defineExample', axis: 'oldItems' }] as const;`,
    );
    await fixture.command.parse(['streams']);
    assertStringIncludes(
      await Deno.readTextFile(join(fixture.root, '.netscript/generated/newitems.registry.ts')),
      'newitems0.id',
    );
    assertEquals(
      await new DenoFileSystem().exists(
        join(fixture.root, '.netscript/generated/olditems.registry.ts'),
      ),
      false,
    );
    assertEquals(fixture.scaffoldCalls(), 1);
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

Deno.test('plugin update local-source workers writes resolvable runtime imports at a different live root depth', async () => {
  const parent = await Deno.makeTempDir();
  const root = join(parent, 'nested', 'consumer', 'app');
  const fixture = await createFixture(new RegistryEmitter(), 'workers', {
    'workers/plugin.ts': `export const NETSCRIPT_CONTRIBUTION_BUILDERS = [
      { callee: 'defineJob', axis: 'jobs' },
    ] as const;`,
  }, { root });
  try {
    await Deno.mkdir(join(root, 'packages/cli'), { recursive: true });
    await Deno.writeTextFile(join(root, 'packages/cli/deno.json'), '{}\n');
    await fixture.command.parse(['workers']);
    assertEquals(fixture.scaffoldRoots.length, 1);
    assertEquals(
      fixture.scaffoldRoots[0].split(/[/\\]/).length === root.split(/[/\\]/).length,
      false,
    );
    const config = JSON.parse(await Deno.readTextFile(join(root, 'deno.json')));
    for (const target of Object.values(config.imports as Record<string, string>)) {
      if (target.startsWith('.')) {
        assertEquals((await Deno.stat(resolve(root, target))).isFile, true, target);
      }
    }
    for (
      const specifier of [
        '@netscript/plugin-workers/runtime',
        'jsr:@netscript/plugin-workers/jobs/health-check.ts',
      ]
    ) {
      assertEquals(typeof config.imports[specifier], 'string');
      assertEquals((await Deno.stat(resolve(root, config.imports[specifier]))).isFile, true);
    }
  } finally {
    await Deno.remove(parent, { recursive: true });
  }
});

Deno.test('plugin update preserves existing and scaffold-created external imports and removal snapshots across root depths', async () => {
  const parent = await Deno.makeTempDir();
  const root = join(parent, 'nested', 'consumer', 'app');
  const external = fromFileUrl(
    new URL('../../../../../../../packages/plugin/mod.ts', import.meta.url),
  );
  const fixture = await createFixture(new RegistryEmitter(), 'workers', {
    'workers/plugin.ts': `export const NETSCRIPT_CONTRIBUTION_BUILDERS = [
      { callee: 'defineJob', axis: 'jobs' },
    ] as const;`,
  }, {
    root,
    onScaffold: async (stageRoot) => {
      assertEquals(stageRoot.split(/[/\\]/).length === root.split(/[/\\]/).length, false);
      const config = JSON.parse(await Deno.readTextFile(join(stageRoot, 'deno.json')));
      assertEquals(resolve(stageRoot, config.imports['@fixture/external']), external);
      assertEquals(
        await Deno.readTextFile(resolve(stageRoot, config.imports['@fixture/internal'])),
        'export const value = 1;\n',
      );
      // A scaffold subprocess may itself add a project-external relative import.
      config.imports['@fixture/scaffold'] = relative(stageRoot, external);
      await Deno.writeTextFile(join(stageRoot, 'deno.json'), JSON.stringify(config));
    },
  });
  try {
    await Deno.mkdir(join(root, 'packages/cli'), { recursive: true });
    await Deno.writeTextFile(join(root, 'packages/cli/deno.json'), '{}\n');
    await Deno.writeTextFile(join(root, 'local.ts'), 'export const value = 1;\n');
    const existingImports = {
      '@fixture/external': relative(root, external),
      '@fixture/internal': './local.ts',
    };
    await Deno.writeTextFile(
      join(root, 'deno.json'),
      JSON.stringify({
        workspace: [],
        imports: existingImports,
        scopes: { './workers/': { '@fixture/scoped': relative(root, external) } },
      }),
    );
    await Deno.writeTextFile(
      join(root, 'undeclared.ts'),
      `import { defineExample } from '@acme/plugin-example-core';
export const example = defineExample({});`,
    );
    const before = await snapshot(root);
    await assertRejects(
      () => fixture.command.parse(['workers']),
      TypeError,
      'Contribution factory "defineExample" has no declared axis',
    );
    assertEquals(await snapshot(root), before);
    await Deno.remove(join(root, 'undeclared.ts'));
    await fixture.command.parse(['workers']);
    const config = JSON.parse(await Deno.readTextFile(join(root, 'deno.json')));
    assertEquals(config.imports['@fixture/external'], existingImports['@fixture/external']);
    assertEquals(config.imports['@fixture/internal'], existingImports['@fixture/internal']);
    for (const imports of [config.imports, ...Object.values(config.scopes)]) {
      for (const target of Object.values(imports as Record<string, string>)) {
        if (!target.startsWith('.') && !target.startsWith('/') && !target.startsWith('file:')) {
          continue;
        }
        const path = target.startsWith('file:') ? fromFileUrl(target) : resolve(root, target);
        assertEquals((await Deno.stat(path)).isFile, true, target);
      }
    }
    for (
      const specifier of [
        '@netscript/plugin-workers/runtime',
        'jsr:@netscript/plugin-workers/jobs/health-check.ts',
      ]
    ) {
      assertEquals(typeof config.imports[specifier], 'string');
      assertEquals((await Deno.stat(resolve(root, config.imports[specifier]))).isFile, true);
    }
    assertEquals(resolve(root, config.imports['@fixture/scaffold']), external);
    const metadata = JSON.parse(
      await Deno.readTextFile(join(root, 'workers/scaffold.plugin.json')),
    );
    assertEquals(JSON.parse(metadata.netscriptInstall.rootDenoJsonBefore).imports, existingImports);
    assertEquals(JSON.parse(metadata.netscriptInstall.rootDenoJsonAfter), config);
    assertEquals(fixture.scaffoldCalls(), 2);
    for (const stageRoot of fixture.scaffoldRoots) {
      await assertRejects(() => Deno.stat(stageRoot), Deno.errors.NotFound);
    }
  } finally {
    await Deno.remove(parent, { recursive: true });
  }
});

for (const order of [['streams', 'workers'], ['workers', 'streams']] as const) {
  Deno.test(`plugin update legacy workers and streams succeeds in ${order.join(' then ')} order with authored defineTask`, async () => {
    const root = await Deno.makeTempDir();
    try {
      for (const [index, kind] of order.entries()) {
        const starter = kind === 'workers' ? workersStarterResources : streamsStarterResources;
        const control = starter.find((resource) =>
          resource.scaffolder.name === 'control-plane-module'
        );
        if (!control) throw new Error('Missing control-plane scaffolder');
        const artifact = control.scaffolder.emit({})[0];
        if (artifact.body.kind !== 'text') throw new Error('Expected text control module');
        const fixture = await createFixture(new RegistryEmitter(), kind, {
          [`${kind}/plugin.ts`]: artifact.body.text,
        }, { root, initialized: index > 0 });
        if (index === 0) {
          await fixtureFs.writeFile(
            join(root, 'workers/plugin.ts'),
            `export const NETSCRIPT_CONTRIBUTION_BUILDERS = [{ callee: 'defineJob', axis: 'jobs' }] as const;
export { workersPlugin } from '@netscript/plugin-workers';`,
          );
          await fixtureFs.writeFile(
            join(root, 'streams/plugin.ts'),
            `export { streamsPlugin } from '@netscript/plugin-streams';`,
          );
          await fixtureFs.writeFile(join(root, 'workers/scaffold.plugin.json'), '{}\n');
          await fixtureFs.writeFile(join(root, 'streams/scaffold.plugin.json'), '{}\n');
          for (const id of ['cli-probe', 'matrix-probe', 'managed-git']) {
            await fixtureFs.writeFile(
              join(root, `workers/tasks/${id}.ts`),
              `import { defineTask } from '@netscript/plugin-workers-core/builders';
export default defineTask('${id}').entrypoint('task.ts').build();`,
            );
          }
          await fixtureFs.writeFile(
            join(root, 'streams/document-schema.ts'),
            `import { defineStreamSchema } from '@netscript/plugin-streams-core';
export const documents = defineStreamSchema({});`,
          );
        }
        const other = kind === 'workers' ? 'streams' : 'workers';
        const otherControl = await Deno.readFile(join(root, `${other}/plugin.ts`));
        const otherMetadata = await Deno.readFile(join(root, `${other}/scaffold.plugin.json`));
        await fixture.command.parse([kind]);
        assertEquals(await Deno.readFile(join(root, `${other}/plugin.ts`)), otherControl);
        assertEquals(
          await Deno.readFile(join(root, `${other}/scaffold.plugin.json`)),
          otherMetadata,
        );
        const registry = await Deno.readTextFile(
          join(root, '.netscript/generated/tasks.registry.ts'),
        );
        for (const id of ['cli-probe', 'matrix-probe', 'managed-git']) {
          assertStringIncludes(registry, `workers/tasks/${id}.ts`);
        }
        assertStringIncludes(registry, 'String(tasks0.id)');
        assertEquals(
          (await snapshot(root)).some(([path]) => path.includes('schemas.registry')),
          false,
        );
        for (const stagedRoot of fixture.scaffoldRoots) {
          await assertRejects(() => Deno.stat(stagedRoot), Deno.errors.NotFound);
        }
      }
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  });
}

const fixtureFs = new DenoFileSystem();

async function createFixture(
  emitter: EmitterPort = new RegistryEmitter(),
  kind = 'streams',
  updatedFiles: Readonly<Record<string, string>> = {
    'streams/plugin.ts': '// updated control module\n',
  },
  fixtureOptions: {
    root?: string;
    onScaffold?: (stageRoot: string) => Promise<void>;
    initialized?: boolean;
  } = {},
) {
  const root = fixtureOptions.root ?? await Deno.makeTempDir();
  const fs = new DenoFileSystem();
  const registry = new PluginKindRegistry();
  const pluginPath = fromFileUrl(new URL(`../../../../../../../plugins/${kind}`, import.meta.url));
  const resolved = await resolveLocalPluginDescriptor(pluginPath, registry, fs);
  const schemaBytes = kind === 'workers'
    ? await Deno.readFile(join(pluginPath, 'database/workers.prisma'))
    : new Uint8Array();
  const digest = await crypto.subtle.digest('SHA-256', schemaBytes);
  const checksum = 'sha256-' +
    Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  const descriptor = kind === 'workers'
    ? {
      ...resolved.descriptor,
      versionMetadata: {
        ...resolved.descriptor.versionMetadata,
        files: { '/database/workers.prisma': checksum },
      },
    }
    : resolved.descriptor;
  const templateAdapter = new StringTemplateAdapter(fs);
  const scaffolder = new Scaffolder(templateAdapter, fs);
  const messages: string[] = [];
  let scaffoldCalls = 0;
  const scaffoldRoots: string[] = [];
  if (!fixtureOptions.initialized) {
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
    await fs.writeFile(join(root, `${kind}/plugin.ts`), '// previously installed control module\n');
    await fs.writeFile(
      join(root, '.netscript/generated/existing.registry.ts'),
      '// existing bytes\r\n',
    );
  }
  const command = createUpdatePluginCommand({
    projectStage: new DenoProjectStage(),
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
        validate: () => Promise.resolve({ ok: true, descriptor }),
      },
      packageFileFetcher: { fetchFile: () => Promise.resolve(schemaBytes) },
      processRunner: {
        exec: async (_command, args, options) => {
          if (args.some((arg) => arg.endsWith('/scaffold'))) {
            scaffoldCalls += 1;
            const contextArg = args[args.indexOf('--context-json') + 1];
            const context: { workspaceRoot: string } = JSON.parse(contextArg);
            assertEquals(context.workspaceRoot, options?.cwd);
            scaffoldRoots.push(context.workspaceRoot);
            await fixtureOptions.onScaffold?.(context.workspaceRoot);
            for (const [path, text] of Object.entries(updatedFiles)) {
              await fs.writeFile(join(context.workspaceRoot, path), text);
            }
          }
          return {
            code: 0,
            stdout: JSON.stringify({
              status: 'applied',
              createdFiles: [],
              modifiedFiles: Object.keys(updatedFiles),
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
      extractor: createContributionExtractor(),
      emitter,
      fs,
    },
  });
  return {
    root,
    command,
    scaffoldCalls: () => scaffoldCalls,
    scaffoldRoots,
    messages: () => messages,
    completionMessage: `Updated ${kind} to ${resolved.descriptor.version}; generated 1 registries.`,
  };
}
