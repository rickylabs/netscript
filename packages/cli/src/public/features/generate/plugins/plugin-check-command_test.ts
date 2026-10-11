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
async function withProject(run: (root: string) => Promise<void>, plugins = ['triggers']) {
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
            ) => [plugin, { Entrypoint: `jsr:@netscript/plugin-${plugin}@0.0.7/runtime` }]),
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
    await Deno.remove(join(root, '.netscript/generated/plugin-ai/agents.registry.ts'));
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

Deno.test('plugin check freezes a configured consumer lock and never repairs an outdated lock', async () => {
  await withProject(async (root) => {
    const config = JSON.parse(await Deno.readTextFile(join(root, 'deno.json')));
    config.lock = 'consumer.lock';
    await write(root, 'deno.json', JSON.stringify(config));
    await write(root, 'consumer.lock', '{"version":"5","specifiers":{}}\n');
    const before = await snapshot(root);
    const report = await inspect(root);
    assertEquals(report.status, 'inspection-failure');
    assert(report.drift.some((finding) => finding.message?.includes('lockfile is out of date')));
    assertEquals(await snapshot(root), before);
  });
});

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
  }, ['ai']);
});
