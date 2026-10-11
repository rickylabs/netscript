import { netscriptJsrSpecifier } from '../../../../kernel/constants/jsr-specifiers.ts';
import { assert, assertEquals, assertMatch } from '@std/assert';
import { dirname, fromFileUrl, join, resolve, toFileUrl } from '@std/path';
import { walk } from '@std/fs';
import schema from '../../../../../assets/schema/plugin-generated-surface.v1.json' with {
  type: 'json',
};
import type { PluginSurfaceReport } from '../../../../kernel/domain/plugin-generated-surface.ts';

const REPO = resolve(dirname(fromFileUrl(import.meta.url)), '../../../../../../..');
const CLI = Deno.env.get('NETSCRIPT_PLUGIN_CHECK_CLI') ??
  join(REPO, 'packages/cli/bin/netscript.ts');
const OUTPUT = '.netscript/generated/plugin-triggers/triggers.registry.ts';

async function command(root: string, check = true) {
  return await new Deno.Command(Deno.execPath(), {
    args: [
      'run',
      '--no-lock',
      '--no-prompt',
      ...(check
        ? ['--allow-read', '--allow-run=deno', '--allow-env', '--allow-net', `--deny-write=${root}`]
        : ['-A']),
      CLI,
      'generate',
      'plugins',
      '--project-root',
      root,
      ...(check ? ['--check', '--format', 'json'] : []),
    ],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
}
async function inspect(root: string): Promise<PluginSurfaceReport> {
  const result = await command(root);
  const stdout = new TextDecoder().decode(result.stdout);
  assert(stdout.trim().startsWith('{'), new TextDecoder().decode(result.stderr));
  const report: PluginSurfaceReport = JSON.parse(stdout);
  assertEquals(result.code, report.exitCode);
  return report;
}
async function write(root: string, path: string, content: string) {
  await Deno.mkdir(dirname(join(root, path)), { recursive: true });
  await Deno.writeTextFile(join(root, path), content);
}
async function snapshot(root: string) {
  const files: Record<string, number[]> = {};
  for await (const entry of walk(root, { includeDirs: false, followSymlinks: false })) {
    if (!entry.isSymlink) {
      files[entry.path.slice(root.length + 1)] = [...await Deno.readFile(entry.path)];
    }
  }
  return files;
}
async function withProject(
  run: (root: string) => Promise<void>,
  plugins = ['triggers'],
  prepare?: (root: string) => Promise<void>,
) {
  const root = await Deno.makeTempDir();
  try {
    const rootConfig = JSON.parse(await Deno.readTextFile(join(REPO, 'deno.json')));
    await write(
      root,
      'deno.json',
      JSON.stringify({
        catalog: rootConfig.catalog,
        imports: {
          ...rootConfig.imports,
          '@netscript/plugin/cli': toFileUrl(join(REPO, 'packages/plugin/src/cli/mod.ts')).href,
          '@netscript/config': toFileUrl(join(REPO, 'packages/config/mod.ts')).href,
          '@netscript/plugin-workers-core/config':
            toFileUrl(join(REPO, 'packages/plugin-workers-core/src/config/mod.ts')).href,
          ...Object.fromEntries(
            plugins.map((
              plugin,
            ) => [
              `@netscript/plugin-${plugin}/runtime`,
              toFileUrl(join(REPO, `plugins/${plugin}/src/runtime/mod.ts`)).href,
            ]),
          ),
        },
      }),
    );
    await write(
      root,
      'appsettings.json',
      JSON.stringify({
        NetScript: {
          Plugins: Object.fromEntries(
            plugins.map((
              plugin,
            ) => [plugin, {
              Entrypoint: netscriptJsrSpecifier(`plugin-${plugin}`, '/runtime'),
            }]),
          ),
        },
      }),
    );
    await write(
      root,
      'triggers/custom.ts',
      'export default { id: "custom", kind: "webhook", handler: async () => new Response() };\n',
    );
    await write(root, 'workers/jobs/custom.ts', 'export default () => undefined;\n');
    await write(root, 'sagas/custom-saga.ts', 'export default defineSaga("custom");\n');
    await write(
      root,
      'ai/tools/custom.ts',
      'export default { descriptor: { name: "custom" }, schema: {}, execute: async () => ({}) };\n',
    );
    await write(root, 'ai/agents/custom.ts', 'export default () => ({});\n');
    await prepare?.(root);
    const generated = await command(root, false);
    assertEquals(generated.code, 0, new TextDecoder().decode(generated.stderr));
    await run(root);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
}

Deno.test('plugin check inventories every selected first-party registry with canonical generation bytes and no project writes', async () => {
  await withProject(async (root) => {
    const before = await snapshot(root);
    const report = await inspect(root);
    assertEquals(report.status, 'current');
    assertEquals(report.version, 1);
    assertEquals(Object.keys(report).sort(), schema.required.toSorted());
    assertEquals(report.generator, schema.properties.generator.const);
    assertEquals(report.outputs.length, 5);
    assert(report.inputs.some((entry) => entry.path === 'sagas/custom-saga.ts'));
    assert(report.inputs.some((entry) => entry.path === 'workers/jobs/custom.ts'));
    assert(report.inputs.some((entry) => entry.path === 'ai/tools/custom.ts'));
    assert(report.inputs.some((entry) => entry.path === 'ai/agents/custom.ts'));
    assertEquals(
      report.outputs.map((entry) => entry.path).sort(),
      Object.keys(before).filter((path) => path.startsWith('.netscript/generated/')).sort(),
    );
    for (const entry of report.outputs) {
      assertMatch(entry.digest, /^sha256:[0-9a-f]{64}$/);
      assertEquals(entry.ownership, 'generated');
      assertMatch(entry.generator, /^public\.generate\.plugins:@netscript\/plugin-/);
    }
    assert(
      report.inputs.some((entry) =>
        entry.path === 'appsettings.json' && entry.ownership === 'authored'
      ),
    );
    assert(report.inputs.some((entry) => entry.path === 'triggers/custom.ts'));
    assert(!report.outputs.some((entry) => entry.path.includes('appsettings')));
    assertEquals(await snapshot(root), before);
    assertEquals((await command(root, false)).code, 0);
    assertEquals(await snapshot(root), before);
  }, ['triggers', 'workers', 'sagas', 'ai', 'auth', 'streams']);
});

const mutations: { name: string; kind: string; mutate: (root: string) => Promise<void> }[] = [
  { name: 'missing output', kind: 'missing', mutate: (root) => Deno.remove(join(root, OUTPUT)) },
  {
    name: 'extra output',
    kind: 'extra',
    mutate: (root) => write(root, '.netscript/generated/plugin-triggers/stale.ts', 'export {};\n'),
  },
  {
    name: 'source selection change',
    kind: 'bytes',
    mutate: (root) => write(root, 'triggers/new.ts', 'export {};\n'),
  },
  {
    name: 'source deletion',
    kind: 'bytes',
    mutate: (root) => Deno.remove(join(root, 'triggers/custom.ts')),
  },
  {
    name: 'producer marker overlap',
    kind: 'ownership',
    mutate: async (root) =>
      write(
        root,
        OUTPUT,
        '// @netscript-generated foreign.producer\n' + await Deno.readTextFile(join(root, OUTPUT)),
      ),
  },
  {
    name: 'producer deletion',
    kind: 'extra',
    mutate: (root) => write(root, 'appsettings.json', '{"NetScript":{"Plugins":{}}}\n'),
  },
  {
    name: 'invalid bytes',
    kind: 'bytes',
    mutate: (root) => Deno.writeFile(join(root, OUTPUT), new Uint8Array([255])),
  },
  {
    name: 'linked output',
    kind: 'inspection-failure',
    mutate: async (root) => {
      await Deno.remove(join(root, OUTPUT));
      await Deno.symlink(join(root, 'triggers/custom.ts'), join(root, OUTPUT));
    },
  },
];
for (const mutation of mutations) {
  Deno.test(`plugin public check fails closed on ${mutation.name} with writes denied`, async () => {
    await withProject(async (root) => {
      await mutation.mutate(root);
      const before = await snapshot(root);
      const report = await inspect(root);
      assertEquals(report.exitCode, 1);
      assert(
        report.drift.some((finding) => finding.kind === mutation.kind),
        JSON.stringify(report),
      );
      assertEquals(await snapshot(root), before);
    });
  });
}

async function replaceProducer(root: string, manifest: unknown, script: string, second = false) {
  const pluginRoot = 'plugins/custom';
  await write(root, `${pluginRoot}/deno.json`, '{"name":"@acme/plugin-custom","version":"1.0.0"}');
  await write(root, `${pluginRoot}/mod.ts`, 'export {};');
  await write(root, `${pluginRoot}/scaffold.runtime.json`, JSON.stringify(manifest));
  await write(root, `${pluginRoot}/generate.ts`, script);
  const settings = JSON.parse(await Deno.readTextFile(join(root, 'appsettings.json')));
  if (!second) settings.NetScript.Plugins = {};
  settings.NetScript.Plugins.custom = { Entrypoint: 'jsr:@acme/plugin-custom@1.0.0/runtime' };
  await write(root, 'appsettings.json', JSON.stringify(settings));
  const config = JSON.parse(await Deno.readTextFile(join(root, 'deno.json')));
  config.imports['@acme/plugin-custom'] = './plugins/custom/mod.ts';
  await write(root, 'deno.json', JSON.stringify(config));
}
const manifest = (path = OUTPUT, protocol: unknown = 2) => ({
  runtimeRegistryGenerator: { command: 'generate.ts', inspectionProtocol: protocol },
  runtimeRegistries: [{ dir: 'triggers', registryPath: path }],
});
const renderScript = (path = OUTPUT) =>
  `console.log(JSON.stringify({inspectionProtocol:2,registries:[{registryPath:${
    JSON.stringify(path)
  },sourceFiles:['triggers/custom.ts'],content:'export {};\\n'}]}));`;
for (
  const hostile of [
    {
      name: 'unexpected write attempt',
      manifest: manifest(),
      script: 'await Deno.writeTextFile("appsettings.json", "bad");',
    },
    {
      name: 'authored appsettings output ownership',
      manifest: manifest('appsettings.json'),
      script: renderScript('appsettings.json'),
    },
    { name: 'duplicate producers', manifest: manifest(), script: renderScript(), second: true },
    {
      name: 'unsupported source-only inspection',
      manifest: manifest(OUTPUT, 1),
      script: 'throw new Error("must not execute");',
    },
    {
      name: 'missing rendered target',
      manifest: manifest(),
      script: 'console.log(JSON.stringify({inspectionProtocol:2,registries:[]}));',
    },
    {
      name: 'traversal output',
      manifest: manifest('../escape.ts'),
      script: renderScript('../escape.ts'),
    },
    { name: 'malformed protocol response', manifest: manifest(), script: 'console.log("bad");' },
  ]
) {
  Deno.test(`plugin public check refuses ${hostile.name} without mutation fallback`, async () => {
    await withProject(async (root) => {
      await replaceProducer(root, hostile.manifest, hostile.script, hostile.second);
      const before = await snapshot(root);
      const report = await inspect(root);
      assertEquals(report.status, 'inspection-failure');
      assertEquals(report.exitCode, 1);
      assertEquals(await snapshot(root), before);
    });
  });
}

Deno.test('plugin check excludes skipped AI targets and inventories only bytes generation writes', async () => {
  await withProject(async (root) => {
    await Deno.remove(join(root, 'ai/agents/custom.ts'));
    const stale = await inspect(root);
    assertEquals(stale.status, 'drift');
    assertEquals((await command(root, false)).code, 0);
    const before = await snapshot(root);
    const report = await inspect(root);
    assertEquals(report.status, 'current');
    assertEquals(report.outputs.map((entry) => entry.path), [
      '.netscript/generated/plugin-ai/tools.registry.ts',
    ]);
    assertEquals((await command(root, false)).code, 0);
    assertEquals(await snapshot(root), before);
  }, ['ai']);
});

for (const lock of ['deno.lock', 'consumer.lock']) {
  Deno.test(`plugin generation extends a real app lock (${lock}) and check leaves it unchanged`, async () => {
    let appLock = '';
    await withProject(
      async (root) => {
        const generatedLock = await Deno.readTextFile(join(root, lock));
        assert(generatedLock !== appLock, 'normal generation must resolve its graph into the lock');
        const graph = JSON.parse(generatedLock).specifiers;
        assert(Object.keys(graph).some((key) => key.startsWith('jsr:@std/fs@')));
        const before = await snapshot(root);
        assertEquals((await inspect(root)).status, 'current');
        assertEquals(await snapshot(root), before);
      },
      ['workers'],
      async (root) => {
        const config = JSON.parse(await Deno.readTextFile(join(root, 'deno.json')));
        config.lock = lock;
        await write(root, 'deno.json', JSON.stringify(config));
        await write(root, 'app.ts', 'import { assert } from "@std/assert"; assert(true);\n');
        const cached = await new Deno.Command(Deno.execPath(), {
          args: ['cache', '--config', join(root, 'deno.json'), join(root, 'app.ts')],
          cwd: root,
          stdout: 'piped',
          stderr: 'piped',
        }).output();
        assertEquals(cached.code, 0, new TextDecoder().decode(cached.stderr));
        appLock = await Deno.readTextFile(join(root, lock));
        assert(
          !Object.keys(JSON.parse(appLock).specifiers).some((key) =>
            key.startsWith('jsr:@std/fs@')
          ),
        );
        const before = await snapshot(root);
        const report = await inspect(root);
        assertEquals(report.status, 'drift');
        assert(report.drift.every((finding) => finding.kind === 'missing'));
        assertEquals(await snapshot(root), before);
      },
    );
  });
}

Deno.test('plugin check detects edits to an existing AI source that change generator selection', async () => {
  await withProject(async (root) => {
    await write(root, 'ai/tools/custom.ts', 'export function helper() { return {}; }\n');
    const before = await snapshot(root);
    const report = await inspect(root);
    assertEquals(report.status, 'drift');
    assert(
      report.drift.some((finding) =>
        finding.path === '.netscript/generated/plugin-ai/tools.registry.ts' &&
        finding.kind === 'extra'
      ),
    );
    assertEquals(await snapshot(root), before);
    assertEquals((await command(root, false)).code, 0);
    assertEquals((await inspect(root)).status, 'current');
    await assertMissing(root, '.netscript/generated/plugin-ai/tools.registry.ts');
  }, ['ai']);
});

async function assertMissing(root: string, path: string) {
  let missing = false;
  try {
    await Deno.lstat(join(root, path));
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
    missing = true;
  }
  assert(missing, 'inactive producer-owned output should be removed');
}

Deno.test('plugin generation removes the last workers registry when its source disappears', async () => {
  await withProject(async (root) => {
    await Deno.remove(join(root, 'workers/jobs/custom.ts'));
    assertEquals((await inspect(root)).status, 'drift');
    assertEquals((await command(root, false)).code, 0);
    await assertMissing(root, '.netscript/generated/plugin-workers/job-registry.ts');
    const before = await snapshot(root);
    assertEquals((await inspect(root)).status, 'current');
    assertEquals(await snapshot(root), before);
  }, ['workers']);
});

for (
  const content of [
    'export const authored = true;\n',
    '// @netscript-generated public.generate.plugins:@acme/other\nexport {};\n',
  ]
) {
  Deno.test(`plugin generation preserves inactive target with foreign ownership (${content.split('\n')[0]})`, async () => {
    await withProject(async (root) => {
      const path = '.netscript/generated/plugin-ai/tools.registry.ts';
      await write(root, 'ai/tools/custom.ts', 'export function helper() {}\n');
      await write(root, path, content);
      assertEquals((await command(root, false)).code, 0);
      assertEquals(await Deno.readTextFile(join(root, path)), content);
      const before = await snapshot(root);
      assertEquals((await inspect(root)).status, 'drift');
      assertEquals(await snapshot(root), before);
    }, ['ai']);
  });
}

Deno.test('plugin check excludes SDK axis registries but still detects removed plugin producers', async () => {
  await withProject(async (root) => {
    await write(root, '.netscript/generated/jobs.registry.ts', 'export {};\n');
    await write(root, '.netscript/generated/plugin-jobs.registry.ts', 'export {};\n');
    const before = await snapshot(root);
    assertEquals((await inspect(root)).status, 'current');
    assertEquals(await snapshot(root), before);
    await write(root, '.netscript/generated/plugin-removed/stale.registry.ts', 'export {};\n');
    const report = await inspect(root);
    assertEquals(report.status, 'drift');
    assertEquals(report.drift, [{
      path: '.netscript/generated/plugin-removed/stale.registry.ts',
      kind: 'extra',
    }]);
  });
});

Deno.test('plugin generation and check both reject missing installed runtime manifests', async () => {
  await withProject(async (root) => {
    await replaceProducer(root, {}, '');
    await Deno.remove(join(root, 'plugins/custom/scaffold.runtime.json'));
    const before = await snapshot(root);
    const generated = await command(root, false);
    assertEquals(generated.code, 1);
    assertMatch(new TextDecoder().decode(generated.stderr), /Missing runtime manifest/);
    assertEquals((await inspect(root)).status, 'inspection-failure');
    assertEquals(await snapshot(root), before);
  });
});

for (const entrypoint of [null, './plugins/custom/mod.ts']) {
  Deno.test(`plugin check refuses unsupported installed entrypoint ${String(entrypoint)} instead of certifying an empty surface`, async () => {
    await withProject(async (root) => {
      await write(
        root,
        'appsettings.json',
        JSON.stringify({ NetScript: { Plugins: { custom: { Entrypoint: entrypoint } } } }),
      );
      const before = await snapshot(root);
      assertEquals((await inspect(root)).status, 'inspection-failure');
      assertEquals(await snapshot(root), before);
    });
  });
}
