import { assertEquals, assertStringIncludes } from '@std/assert';
import { dirname, fromFileUrl, join, resolve, toFileUrl } from '@std/path';
import type { CommandExecutorPort } from '../src/domain/command-executor-port.ts';
import type { PluginRegistryInventory } from '../src/domain/plugin-registry-inventory.ts';
import { ProjectWiringDoctorFamily } from '../src/infrastructure/project-wiring-doctor-family.ts';
import { SpawnCommandExecutor } from '../src/infrastructure/spawn-command-executor.ts';

const repo = resolve(dirname(fromFileUrl(import.meta.url)), '../../..');
const cli = join(repo, 'packages/cli/bin/netscript.ts');
const outputPath = '.netscript/generated/plugin-workers/job-registry.ts';
const current: PluginRegistryInventory = {
  version: 1,
  generator: 'public.generate.plugins',
  status: 'current',
  exitCode: 0,
  producers: [],
  inputs: [],
  outputs: [],
  drift: [],
};

function inventoryExecutor(report: PluginRegistryInventory): CommandExecutorPort {
  return {
    identity: { mode: 'host', version: 'test', command: ['fixture'] },
    execute: () =>
      Promise.resolve({
        executor: { mode: 'host', version: 'test', command: ['fixture'] },
        status: report.exitCode === 0 ? 'pass' : 'fail',
        exitCode: report.exitCode,
        durationMs: 0,
        outputTail: JSON.stringify(report),
        truncated: false,
        timedOut: false,
      }),
  };
}

async function inspect(root: string, executor: CommandExecutorPort) {
  const checks = await new ProjectWiringDoctorFamily(undefined, executor).check({
    projectRoot: root,
    explicitTelemetryEndpoint: false,
  });
  return checks.find((check) => check.name === 'plugin_registry');
}

function publicExecutor(root: string): CommandExecutorPort {
  return new SpawnCommandExecutor({
    cliCommand: [
      Deno.execPath(),
      'run',
      `--lock=${join(repo, 'deno.lock')}`,
      '--frozen',
      '--node-modules-dir=none',
      '--no-prompt',
      '--allow-read',
      '--allow-run=deno',
      '--allow-env',
      '--allow-net',
      `--deny-write=${root}`,
      cli,
    ],
    outputTailBytes: 1_048_576,
  });
}

async function snapshot(root: string) {
  const files: Record<string, number[]> = {};
  async function visit(directory: string): Promise<void> {
    for await (const entry of Deno.readDir(directory)) {
      const path = join(directory, entry.name);
      if (entry.isDirectory) await visit(path);
      else files[path.slice(root.length + 1)] = [...await Deno.readFile(path)];
    }
  }
  await visit(root);
  return files;
}

async function project(plugins: string[], source: string, run: (root: string) => Promise<void>) {
  const root = await Deno.makeTempDir();
  try {
    const config = JSON.parse(await Deno.readTextFile(join(repo, 'deno.json')));
    await Deno.writeTextFile(
      join(root, 'deno.json'),
      JSON.stringify({
        catalog: config.catalog,
        imports: {
          ...config.imports,
          '@netscript/plugin/cli': toFileUrl(join(repo, 'packages/plugin/src/cli/mod.ts')).href,
          '@netscript/config': toFileUrl(join(repo, 'packages/config/mod.ts')).href,
          '@netscript/plugin-workers-core/config':
            toFileUrl(join(repo, 'packages/plugin-workers-core/src/config/mod.ts')).href,
          ...Object.fromEntries(plugins.map((plugin) => [
            `@netscript/plugin-${plugin}/runtime`,
            toFileUrl(join(repo, `plugins/${plugin}/src/runtime/mod.ts`)).href,
          ])),
        },
      }),
    );
    await Deno.writeTextFile(
      join(root, 'appsettings.json'),
      JSON.stringify({
        NetScript: {
          Plugins: Object.fromEntries(plugins.map((plugin) => [plugin, {
            Entrypoint: `jsr:@netscript/plugin-${plugin}@0.0.7/runtime`,
          }])),
        },
      }),
    );
    await Deno.writeTextFile(join(root, 'netscript.config.ts'), source);
    await run(root);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
}

async function generate(root: string) {
  const result = await new Deno.Command(Deno.execPath(), {
    args: ['run', '-A', cli, 'generate', 'plugins', '--project-root', root],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  assertEquals(result.code, 0, new TextDecoder().decode(result.stderr));
}

for (
  const [scenario, plugins, source] of [
    ['auth-only', ['auth'], 'export default { plugins: [authPlugin] };'],
    ['empty list', [], 'export default { plugins: [] };'],
    ['comment', [], '// plugins: [workersPlugin]\nexport default {};'],
    ['unrelated nested key', [], 'export default { unrelated: { plugins: [workersPlugin] } };'],
  ] as const
) {
  Deno.test(`project inventory certifies legitimate zero outputs: ${scenario}`, async () => {
    await project([...plugins], source, async (root) => {
      const executor = publicExecutor(root);
      const before = await snapshot(root);
      const check = await inspect(root, executor);
      assertEquals(check?.status, 'pass');
      assertStringIncludes(check?.summary ?? '', 'generation has nothing to register');
      assertStringIncludes(check?.summary ?? '', `${plugins.length} installed producer(s)`);
      assertEquals(check?.fix, undefined);
      assertEquals(await snapshot(root), before);
      await generate(root);
      assertEquals(await inspect(root, executor), check);
      assertEquals(await snapshot(root), before);
    });
  });
}

Deno.test('project inventory remedy clears missing and stale selected workers output and preserves authored inputs', async () => {
  await project(
    ['workers'],
    'export default { name: "registry-test", databases: { config: [] } };',
    async (root) => {
      await Deno.mkdir(join(root, 'workers/jobs'), { recursive: true });
      await Deno.writeTextFile(
        join(root, 'workers/jobs/custom.ts'),
        'export default () => undefined;\n',
      );
      await generate(root);
      const executor = publicExecutor(root);
      assertEquals((await inspect(root, executor))?.status, 'pass');
      for (const mutation of ['missing', 'bytes']) {
        if (mutation === 'missing') await Deno.remove(join(root, outputPath));
        else await Deno.writeTextFile(join(root, outputPath), 'export const stale = true;\n');
        const before = await snapshot(root);
        const check = await inspect(root, executor);
        assertEquals(check?.status, 'fail');
        assertStringIncludes(check?.summary ?? '', mutation);
        assertStringIncludes(check?.fix ?? '', 'netscript generate plugins');
        assertEquals(await snapshot(root), before);
        await generate(root);
        assertEquals((await inspect(root, executor))?.status, 'pass');
        const after = await snapshot(root);
        for (const [path, bytes] of Object.entries(before)) {
          if (!path.startsWith('.netscript/generated/')) assertEquals(after[path], bytes, path);
        }
      }
      await Deno.writeTextFile(
        join(root, '.netscript/generated/plugin-workers/foreign.ts'),
        '// authored\n',
      );
      const before = await snapshot(root);
      const extra = await inspect(root, executor);
      assertEquals(extra?.status, 'fail');
      assertStringIncludes(extra?.fix ?? '', 'Regeneration alone is not a complete remedy');
      await generate(root);
      assertEquals(await inspect(root, executor), extra);
      assertEquals(await snapshot(root), before);
    },
  );
});

Deno.test('project inventory reports an undeterminable selection as warning without regeneration advice', async () => {
  await project(
    ['workers'],
    'export default { name: "registry-test", databases: { config: [] } };',
    async (root) => {
      const before = await snapshot(root);
      const check = await inspect(root, publicExecutor(root));
      assertEquals(check?.status, 'warn');
      assertStringIncludes(check?.summary ?? '', 'could not be determined');
      assertEquals(check?.fix, undefined);
      assertEquals(await snapshot(root), before);
    },
  );
});

Deno.test('project inventory never reads config source or lists registry-looking files', async () => {
  const reads: string[] = [];
  const family = new ProjectWiringDoctorFamily({
    exists: (path) => Promise.resolve(!path.endsWith('/docs/site')),
    readText: (path) => {
      reads.push(path);
      if (!path.endsWith('/deno.json')) throw new Error('Config source must not be read');
      return Promise.resolve('{}');
    },
  }, inventoryExecutor(current));
  const checks = await family.check({ projectRoot: '/fixture', explicitTelemetryEndpoint: false });
  assertEquals(reads, ['/fixture/deno.json']);
  assertEquals(checks.find((check) => check.name === 'plugin_registry')?.status, 'pass');
  assertEquals(checks.find((check) => check.name === 'docs_root')?.status, 'warn');
});

for (
  const [scenario, changes] of [
    ['truncated', { truncated: true }],
    ['timeout', { timedOut: true }],
    ['unsupported version', { outputTail: JSON.stringify({ ...current, version: 2 }) }],
    ['malformed JSON', { outputTail: 'no inventory' }],
    ['inconsistent exit', { exitCode: 1 }],
  ] as const
) {
  Deno.test(`project inventory warns on ${scenario}`, async () => {
    const base = inventoryExecutor(current);
    const executor: CommandExecutorPort = {
      ...base,
      execute: async (request) => ({ ...await base.execute(request), ...changes }),
    };
    const check = await inspect('/fixture', executor);
    assertEquals(check?.status, 'warn');
    assertEquals(check?.fix, undefined);
  });
}

Deno.test('project inventory does not promote a failed renderer bootstrap hint into a remedy', async () => {
  const check = await inspect(
    '/fixture',
    inventoryExecutor({
      ...current,
      status: 'inspection-failure',
      exitCode: 1,
      drift: [{
        path: 'public.generate.plugins',
        kind: 'inspection-failure',
        message:
          'Invalid workers configuration; run generate plugins to prepare the consumer lock.',
      }],
    }),
  );
  assertStringIncludes(check?.summary ?? '', 'Invalid workers configuration');
  assertEquals(check?.summary.includes('run generate plugins'), false);
  assertEquals(check?.status, 'warn');
  assertEquals(check?.fix, undefined);
});
