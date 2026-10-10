import { assert, assertEquals, assertMatch } from '@std/assert';
import { dirname, fromFileUrl, join, resolve, toFileUrl } from '@std/path';
import { walk } from '@std/fs';
import { SCAFFOLD_WORKSPACE_CATALOG } from '../../../../kernel/constants/scaffold/scaffold-app-catalog.ts';

const REPO_ROOT = resolve(dirname(fromFileUrl(import.meta.url)), '../../../../../../..');
const CLI = Deno.env.get('NETSCRIPT_ASPIRE_CHECK_CLI') ??
  join(REPO_ROOT, 'packages/cli/bin/netscript.ts');

interface Report {
  version: number;
  status: string;
  exitCode: number;
  outputs: { path: string; generator: string; ownership: string; digest: string }[];
  inputs: { path: string; ownership: string }[];
  drift: { path: string; kind: string }[];
}

async function command(root: string, ...flags: string[]) {
  return await new Deno.Command(Deno.execPath(), {
    args: ['run', '--no-lock', '-A', CLI, 'generate', 'aspire', '--project-root', root, ...flags],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
}

async function inspect(root: string): Promise<Report> {
  const output = await command(root, '--check', '--format', 'json');
  const stdout = new TextDecoder().decode(output.stdout);
  const stderr = new TextDecoder().decode(output.stderr);
  assert(stdout.trim().startsWith('{'), `Expected typed report: ${stderr}`);
  const report: Report = JSON.parse(stdout);
  assertEquals(output.code, report.exitCode);
  return report;
}

async function withProject(run: (root: string) => Promise<void>) {
  const root = await Deno.makeTempDir();
  try {
    await Deno.mkdir(join(root, 'aspire'));
    await Deno.writeTextFile(
      join(root, 'appsettings.json'),
      JSON.stringify(
        {
          NetScript: { Name: 'inspection', Version: '0.0.8', Services: {} },
        },
        null,
        2,
      ) + '\n',
    );
    await Deno.writeTextFile(
      join(root, 'deno.json'),
      JSON.stringify({
        catalog: SCAFFOLD_WORKSPACE_CATALOG,
        imports: {
          '@netscript/config': toFileUrl(join(REPO_ROOT, 'packages/config/mod.ts')).href,
        },
      }),
    );
    await Deno.writeTextFile(
      join(root, 'netscript.config.ts'),
      `import { defineConfig } from '@netscript/config';
export default defineConfig({ name: 'inspection', databases: { config: [] }, plugins: [] });
`,
    );
    const generated = await command(root);
    assertEquals(generated.code, 0, new TextDecoder().decode(generated.stderr));
    await run(root);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
}

async function snapshot(root: string): Promise<Record<string, string>> {
  const files: Record<string, string> = {};
  for await (const entry of walk(root, { includeDirs: false })) {
    files[entry.path.slice(root.length)] = Array.from(await Deno.readFile(entry.path)).join(',');
  }
  return files;
}

Deno.test('Aspire check inventories every selected output, uses canonical generation bytes, never writes', async () => {
  await withProject(async (root) => {
    const before = await snapshot(root);
    const report = await inspect(root);
    assertEquals(report.status, 'current');
    assertEquals(report.version, 1);
    assertEquals(report.outputs.length, 13);
    assert(report.outputs.some((entry) => entry.path === 'aspire/apphost.mts'));
    assertEquals(
      report.outputs.map((entry) => entry.path).sort(),
      Object.keys(before).filter((path) => path.startsWith('/aspire/')).map((path) => path.slice(1))
        .sort(),
    );
    for (const entry of report.outputs) {
      assertEquals(entry.generator, 'public.generate.aspire');
      assertEquals(entry.ownership, 'generated');
      assertMatch(entry.digest, /^sha256:[0-9a-f]{64}$/);
      assert(!entry.path.includes('\\'));
      assert(!entry.path.includes('appsettings'));
    }
    assert(
      report.inputs.some((entry) =>
        entry.path === 'appsettings.json' && entry.ownership === 'authored'
      ),
    );
    assertEquals(await snapshot(root), before);
    // Formatter failure during inspection cannot enter the normal generation action.
    const rerun = await command(root);
    assertEquals(rerun.code, 0);
    assertEquals(await snapshot(root), before);
  });
});

const mutations: { name: string; kind: string; mutate: (root: string) => Promise<void> }[] = [
  {
    name: 'missing output',
    kind: 'missing',
    mutate: (root) => Deno.remove(join(root, 'aspire/apphost.mts')),
  },
  {
    name: 'extra output',
    kind: 'extra',
    mutate: (root) => Deno.writeTextFile(join(root, 'aspire/.helpers/stale.mts'), 'export {};\n'),
  },
  {
    name: 'source change after generation',
    kind: 'bytes',
    mutate: async (root) => {
      const path = join(root, 'appsettings.json');
      const settings = JSON.parse(await Deno.readTextFile(path));
      settings.NetScript.Services = { changed: { Port: 3141 } };
      await Deno.writeTextFile(path, JSON.stringify(settings));
    },
  },
  {
    name: 'producer overlap',
    kind: 'ownership',
    mutate: async (root) => {
      const path = join(root, 'aspire/apphost.mts');
      await Deno.writeTextFile(
        path,
        '// @netscript-generated foreign.producer\n' + await Deno.readTextFile(path),
      );
    },
  },
  {
    name: 'producer deletion',
    kind: 'ownership',
    mutate: async (root) => {
      const path = join(root, 'aspire/apphost.mts');
      await Deno.writeTextFile(
        path,
        (await Deno.readTextFile(path)).split('\n').slice(1).join('\n'),
      );
    },
  },
  {
    name: 'unexpected config write attempt',
    kind: 'inspection-failure',
    mutate: async (root) => {
      const path = join(root, 'netscript.config.ts');
      await Deno.writeTextFile(
        path,
        `await Deno.writeTextFile('write-attempt.txt', 'unexpected');\n` +
          await Deno.readTextFile(path),
      );
    },
  },
  {
    name: 'unexpected plugin probe write attempt',
    kind: 'inspection-failure',
    mutate: async (root) => {
      await Deno.mkdir(join(root, 'plugins/hostile'), { recursive: true });
      await Deno.writeTextFile(
        join(root, 'plugins/hostile/mod.ts'),
        "await Deno.writeTextFile('plugin-write-attempt.txt', 'unexpected');\nexport const plugin = {};\n",
      );
      const configPath = join(root, 'deno.json');
      const config = JSON.parse(await Deno.readTextFile(configPath));
      config.imports['@inspection/hostile'] = './plugins/hostile/mod.ts';
      await Deno.writeTextFile(configPath, JSON.stringify(config));
      const path = join(root, 'netscript.config.ts');
      await Deno.writeTextFile(
        path,
        (await Deno.readTextFile(path)).replace(
          'plugins: []',
          "plugins: ['@inspection/hostile']",
        ),
      );
    },
  },
  {
    name: 'appsettings ownership violation',
    kind: 'extra',
    mutate: async (root) => {
      await Deno.copyFile(
        join(root, 'appsettings.json'),
        join(root, 'aspire/.helpers/appsettings.json'),
      );
    },
  },
  {
    name: 'invalid UTF-8 byte drift',
    kind: 'bytes',
    mutate: async (root) => {
      const path = join(root, 'aspire/apphost.mts');
      const bytes = await Deno.readFile(path);
      await Deno.writeFile(path, new Uint8Array([...bytes, 255]));
    },
  },
];
for (const mutation of mutations) {
  Deno.test(`Aspire check fails closed for ${mutation.name} and preserves project bytes`, async () => {
    await withProject(async (root) => {
      await mutation.mutate(root);
      const before = await snapshot(root);
      const report = await inspect(root);
      assertEquals(report.exitCode, 1);
      assert(report.drift.some((entry) => entry.kind === mutation.kind));
      assertEquals(await snapshot(root), before);
    });
  });
}

Deno.test('Aspire generation preserves authored appsettings and check rejects linked outputs', async () => {
  await withProject(async (root) => {
    const authored = await Deno.readTextFile(join(root, 'appsettings.json'));
    assertEquals((await command(root)).code, 0);
    assertEquals(await Deno.readTextFile(join(root, 'appsettings.json')), authored);
    const path = join(root, 'aspire/apphost.mts');
    await Deno.remove(path);
    await Deno.symlink(join(root, 'appsettings.json'), path);
    const report = await inspect(root);
    assertEquals(report.status, 'inspection-failure');
    assertEquals(await Deno.readTextFile(join(root, 'appsettings.json')), authored);
  });
});

Deno.test('Aspire public check works when the inspecting process is denied all project writes', async () => {
  await withProject(async (root) => {
    const before = await snapshot(root);
    const output = await new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '--no-lock',
        '--allow-read',
        '--allow-run',
        '--allow-env',
        '--allow-net',
        '--deny-write',
        '--no-prompt',
        CLI,
        'generate',
        'aspire',
        '--project-root',
        root,
        '--check',
        '--format',
        'json',
      ],
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assertEquals(output.code, 0, new TextDecoder().decode(output.stderr));
    const report: Report = JSON.parse(new TextDecoder().decode(output.stdout));
    assertEquals(report.status, 'current');
    assertEquals(await snapshot(root), before);
  });
});

Deno.test('Aspire generation preserves authored appsettings byte formatting', async () => {
  await withProject(async (root) => {
    const path = join(root, 'appsettings.json');
    const authored = '  ' + JSON.stringify(JSON.parse(await Deno.readTextFile(path))) + '\n\n';
    await Deno.writeTextFile(path, authored);
    assertEquals((await command(root)).code, 0);
    assertEquals(await Deno.readTextFile(path), authored);
  });
});
