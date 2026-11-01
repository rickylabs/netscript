import { executeInit } from '../../../kernel/application/scaffold/init-orchestrator.ts';
import {
  assert,
  assertEquals,
  assertRejects,
  assertStringIncludes,
  assertThrows,
} from '@std/assert';
import { walk } from 'jsr:@std/fs@^1/walk';
import { join, relative } from '@std/path';
import { applyInitPreset } from '../../../kernel/domain/scaffold/northwind-preset.ts';
import { createPublicCommandDependencies } from '../root/public-command-dependencies.ts';
import { createInitCommand } from './init-command.ts';
import { runInitCommand } from './run-init-command.ts';
import { createMaintainerInitCommand } from '../../../maintainer/features/init/init-command.ts';
import type { MaintainerInitExecutionRequest } from '../../../maintainer/features/init/orchestrate-maintainer-init.ts';
import { PresetRegistry } from '../../../kernel/application/registries/preset-registry.ts';
import baseline from '../../../../tests/fixtures/northwind/default-scaffold.json' with {
  type: 'json',
};

Deno.test('Northwind choices reject contradictions without mutating ordinary init', () => {
  const ordinary = { dbEngine: 'none' as const, includeExampleService: false };
  assertEquals(applyInitPreset(ordinary), ordinary);
  assertEquals(new PresetRegistry().get('northwind')?.id, 'northwind');
  for (
    const conflict of [
      { dbEngine: 'none' as const },
      { dbEngine: 'mysql' as const },
      { dbEngine: 'mssql' as const },
      { noAspire: true },
      { includeExampleService: false },
      { serviceName: 'users' },
      { modelName: 'User' },
      { preset: 'studio' },
    ]
  ) assertThrows(() => applyInitPreset({ from: 'northwind', ...conflict }));
  assertThrows(() => applyInitPreset({ from: 'showcase' }), Error, 'Available: northwind');
  assertEquals(applyInitPreset({ from: 'northwind', dbEngine: 'postgres', cache: true }), {
    from: 'northwind',
    dbEngine: 'postgres',
    cache: true,
    includeExampleService: true,
    serviceName: 'orders',
    modelName: 'Order',
  });
});

async function fixture(
  run: (input: {
    parent: string;
    root: string;
    parse: (args: string[]) => Promise<readonly string[]>;
  }) => Promise<void>,
): Promise<void> {
  const parent = await Deno.makeTempDir();
  const root = join(parent, 'baseline-app');
  const dependencies = createPublicCommandDependencies({
    cwd: () => parent,
    resolvePath: (path = '.') => join(parent, path),
  }).initCommandDependencies;
  try {
    await run({
      parent,
      root,
      parse: async (args) => {
        const lines: string[] = [];
        const log = console.log;
        console.log = (message: string) => lines.push(message);
        try {
          await createInitCommand(dependencies).throwErrors().parse([
            'baseline-app',
            '--path',
            parent,
            '--ci',
            '--no-git',
            '--no-agent',
            '--json',
            ...args,
          ]);
        } finally {
          console.log = log;
        }
        return lines;
      },
    });
  } finally {
    await Deno.remove(parent, { recursive: true });
  }
}

Deno.test('ordinary init matches the pre-preset full file set and content hashes', async () => {
  const captured: Record<string, Record<string, string>> = {};
  const update = Deno.env.get('UPDATE_NORTHWIND_BASELINE') === '1';
  for (const variant of ['none', 'sqlite'] as const) {
    await fixture(async ({ parent, root, parse }) => {
      await parse([
        '--db',
        variant,
        ...(variant === 'sqlite'
          ? ['--service', '--service-name', 'orders', '--model-name', 'Order']
          : []),
      ]);
      const files: Record<string, string> = {};
      for await (const entry of walk(root, { includeDirs: false })) {
        const content = (await Deno.readTextFile(entry.path)).replaceAll(root, '<ROOT>').replaceAll(
          parent,
          '<PARENT>',
        );
        const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(content));
        files[relative(root, entry.path).replaceAll('\\', '/')] = Array.from(
          new Uint8Array(digest),
          (v) => v.toString(16).padStart(2, '0'),
        ).join('');
      }
      captured[variant] = Object.fromEntries(
        Object.entries(files).sort(([a], [b]) => a.localeCompare(b)),
      );
      if (!update) assertEquals(files, baseline[variant]);
    });
  }
  if (update) {
    await Deno.writeTextFile(
      new URL('../../../../tests/fixtures/northwind/default-scaffold.json', import.meta.url),
      JSON.stringify(captured, null, 2) + '\n',
    );
  }
});

Deno.test('public Northwind emits one truthful result and a complete orders model/adapter', async () => {
  for (const engine of ['sqlite', 'postgres']) {
    await fixture(async ({ root, parse }) => {
      const lines = await parse([
        '--from',
        'northwind',
        '--db',
        engine,
        '--app-name',
        'storefront',
      ]);
      assertEquals(lines.length, 1);
      const result = JSON.parse(lines[0]);
      assertEquals(result.project.from, 'northwind');
      assertEquals(result.project.database, engine);
      assertEquals(result.project.appName, 'storefront');
      assertEquals(result.plugins, []);
      assertStringIncludes(
        await Deno.readTextFile(join(root, `database/${engine}/schema/schema.prisma`)),
        'customerName String',
      );
      assertStringIncludes(
        await Deno.readTextFile(join(root, `database/${engine}/schema/.generated/zod/crud.ts`)),
        'totalCents: z.number().int()',
      );
      const seed = await Deno.readTextFile(join(root, `database/${engine}/scripts/seed.ts`));
      assertStringIncludes(seed, 'client.order.upsert');
      assertStringIncludes(seed, 'update: {}');
      const adapter = await Deno.readTextFile(
        join(root, 'apps/storefront/lib/scaffold-records.ts'),
      );
      for (const field of ['row.customerName', 'row.shipCountry', 'row.totalCents', 'row.status']) {
        assertStringIncludes(adapter, field);
      }
      assertStringIncludes(
        adapter,
        'scaffoldServiceClient(contract, serviceName, routerName, request)',
      );
      const settings = JSON.parse(await Deno.readTextFile(join(root, 'appsettings.json')));
      assert(settings.NetScript.Services.orders);
      assertStringIncludes(
        await Deno.readTextFile(join(root, 'contracts/versions/v1/orders.contract.ts')),
        'OrderCreateInput',
      );
    });
  }
});

Deno.test('Northwind dry-run writes nothing and conflicting public flags fail before scaffolding', async () => {
  await fixture(async ({ parent, parse }) => {
    const lines = await parse(['--from', 'northwind', '--dry-run']);
    assertEquals(JSON.parse(lines[0]).project.from, 'northwind');
    assertEquals(JSON.parse(lines[0]).project.dryRun, true);
    assertEquals(Array.from(Deno.readDirSync(parent)), []);
    for (
      const flags of [
        ['--service', 'false'],
        ['--no-aspire'],
        ['--db', 'none'],
        ['--service-name', 'users'],
        ['--model-name', 'User'],
        ['--preset', 'studio'],
      ]
    ) {
      await assertRejects(() => parse(['--from', 'northwind', ...flags]));
      assertEquals(Array.from(Deno.readDirSync(parent)), []);
    }
  });
});

Deno.test('explicit Northwind fills domain choices before interactive prompts', async () => {
  const parent = await Deno.makeTempDir();
  try {
    const dependencies = createPublicCommandDependencies({
      cwd: () => parent,
      resolvePath: (p = '.') => join(parent, p),
    }).initCommandDependencies;
    const prompts: string[] = [];
    await runInitCommand(
      {
        ...dependencies,
        prompt: {
          input: (message, options) => {
            prompts.push(message);
            return Promise.resolve(options?.defaultValue ?? '');
          },
          confirm: () =>
            Promise.reject(new Error('Northwind must fill service/cache before prompts')),
          select: () => Promise.reject(new Error('Northwind must fill database before prompts')),
        },
      },
      { from: 'northwind', dryRun: true, json: true, agent: false, git: false },
      'shop',
      true,
    );
    assertEquals(prompts, ['Frontend application name']);
  } finally {
    await Deno.remove(parent, { recursive: true });
  }
});

Deno.test('maintainer Northwind resolves SQLite before local package selection and preserves explicit false', async () => {
  const requests: MaintainerInitExecutionRequest[] = [];
  const engines: (readonly string[] | undefined)[] = [];
  const command = () =>
    createMaintainerInitCommand({
      print: () => {},
      initDependencies: {
        cwd: () => '/repo',
        detectMonorepoRoot: () => Promise.resolve('/repo'),
        runInit: (request) => {
          requests.push(request);
          return Promise.resolve({
            name: request.name,
            targetPath: '/repo/shop',
            phases: [],
            dryRun: request.dryRun,
            durationMs: 0,
            totalFilesCreated: 0,
            totalDirectoriesCreated: 0,
          });
        },
        syncPackages: (request) => {
          engines.push(request.dbEngines);
          return Promise.resolve({ directoriesCreated: [], filesCreated: [], packagesCopied: 0 });
        },
      },
    }).throwErrors();
  await command().parse(['shop', '--from', 'northwind', '--app-name', 'storefront']);
  assertEquals(requests[0].dbEngine, 'sqlite');
  assertEquals(requests[0].includeExampleService, true);
  assertEquals(requests[0].serviceName, 'orders');
  assertEquals(requests[0].modelName, 'Order');
  assertEquals(requests[0].cache, false);
  assertEquals(requests[0].appName, 'storefront');
  assertEquals(engines, [['sqlite']]);
  for (
    const flags of [['--service', 'false'], ['--preset', 'studio'], ['--db', 'none'], [
      '--no-aspire',
    ]]
  ) {
    await assertRejects(() => command().parse(['shop', '--from', 'northwind', ...flags]));
  }
  assertEquals(requests.length, 1);
});

Deno.test('direct kernel init rejects a conflicting Northwind choice before writes', async () => {
  const parent = await Deno.makeTempDir();
  try {
    const context = createPublicCommandDependencies({
      cwd: () => parent,
      resolvePath: (p = '.') => join(parent, p),
    }).initCommandDependencies.initContext;
    await assertRejects(
      () =>
        executeInit(context, {
          name: 'kernel-shop',
          from: 'northwind',
          dbEngine: 'mysql',
          importMode: 'jsr',
          force: false,
          ci: true,
          yes: true,
          dryRun: false,
          noGit: true,
          noAspire: false,
        }),
      Error,
      '--db mysql',
    );
    assertEquals(Array.from(Deno.readDirSync(parent)), []);
  } finally {
    await Deno.remove(parent, { recursive: true });
  }
});
