import { assert, assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { stripAnsiCode } from '@std/fmt/colors';
import { MemoryFileSystemAdapter } from '../../../../kernel/adapters/scaffold/memory-fs.ts';
import { StringTemplateAdapter } from '../../../../kernel/adapters/scaffold/template-adapter.ts';
import { loadResourceSliceTemplateAssets } from '../../../../kernel/adapters/templates/scaffold-template-assets.ts';
import { markOwnedResourceSliceLeaf } from '../../../../kernel/application/resource-slice/resource-slice-contract.ts';
import type { GenerateResourceDependencies, ResourceClientResolver } from './generate-resource.ts';
import {
  createGenerateResourceCommand,
  ResourceSliceConflictError,
} from './generate-resource-command.ts';

const APP_ROOT = '/workspace/apps/dashboard';
const PAGE = `${APP_ROOT}/routes/orders/index.tsx`;
const FORM = `${APP_ROOT}/routes/orders/(_components)/orders-form.tsx`;
const ROUTER = `${APP_ROOT}/router.ts`;
const ROUTER_SOURCE = `import { routePatterns } from './.generated/manifest.ts';
import { routes as generatedRoutes } from './.generated/routes.ts';

export const appRoutes = {
} as const;
`;

interface CommandFixture {
  readonly fs: MemoryFileSystemAdapter;
  readonly output: string[];
  readonly json: unknown[];
  readonly args: (extra?: Partial<GenerateResourceDependencies>) => Promise<
    ReturnType<typeof createGenerateResourceCommand>
  >;
  readonly resetWrites: () => void;
  readonly writes: () => number;
}

Deno.test('resource help exposes the static-route, selector, safety, and output contract', async () => {
  const fixture = await commandFixture();
  const help = stripAnsiCode((await fixture.args()).getHelp()).replace(/\s+/g, ' ');
  for (
    const token of [
      '--procedure',
      '--client',
      '--app',
      '--project-root',
      '--route',
      '--form',
      '--partial',
      '--stream',
      '--dry-run',
      '--force',
      '--json',
    ]
  ) assertStringIncludes(help, token);
  assertStringIncludes(help, 'Static absolute route');
  assertStringIncludes(help, 'generator-owned leaves only');
});

Deno.test('command forwards the explicit client selector unchanged and emits text', async () => {
  const seen: Array<string | undefined> = [];
  const fixture = await commandFixture();
  const command = await fixture.args({
    resolveClient: ((_root, client) => {
      seen.push(client);
      return Promise.resolve(selectedClient());
    }) satisfies ResourceClientResolver,
  });

  await command.parse(['orders', '--procedure', 'admin.list', '--client', 'billing-v2']);

  assertEquals(seen, ['billing-v2']);
  assert(fixture.output.some((line) => line.startsWith('WRITE routes/orders/index.tsx')));
  assertStringIncludes(fixture.output.at(-1) ?? '', 'Resource slice applied:');
});

Deno.test('command emits one JSON result', async () => {
  const fixture = await commandFixture();
  await (await fixture.args()).parse(['orders', '--procedure', 'list', '--json']);

  assertEquals(fixture.output, []);
  assertEquals(fixture.json.length, 1);
  const result = fixture.json[0] as { readonly status: string; readonly exitCode: number };
  assertEquals(result.status, 'applied');
  assertEquals(result.exitCode, 0);
});

Deno.test('identical second command run exits zero and performs zero writes', async () => {
  const fixture = await commandFixture();
  await (await fixture.args()).parse(['orders', '--procedure', 'list']);
  fixture.resetWrites();

  await (await fixture.args()).parse(['orders', '--procedure', 'list']);

  assertEquals(fixture.writes(), 0);
  assert(fixture.output.some((line) => line.startsWith('SKIP routes/orders/index.tsx')));
  assertStringIncludes(fixture.output.at(-1) ?? '', '0 written');
});

Deno.test('later option dry-run reports an edited base and performs no writes', async () => {
  const fixture = await commandFixture();
  await (await fixture.args()).parse(['orders', '--procedure', 'list']);
  await fixture.fs.writeFile(
    PAGE,
    (await fixture.fs.readFile(PAGE)).replace('OrdersLayout', 'EditedLayout'),
  );
  const before = new Map(fixture.fs.getFiles());
  fixture.resetWrites();

  const error = await assertRejects(
    () => (fixture.args().then((command) =>
      command.parse([
        'orders',
        '--procedure',
        'list',
        '--form',
        '--dry-run',
      ])
    )),
    ResourceSliceConflictError,
  );

  assertEquals(error.exitCode, 1);
  assertEquals(fixture.fs.getFiles(), before);
  assertEquals(fixture.writes(), 0);
  assert(fixture.output.some((line) => line.startsWith('WRITE ') && line.includes('orders-form')));
  assert(
    fixture.output.some((line) => line.includes('owned-edited') && line.includes('Move or rename')),
  );
});

Deno.test('force leaves unowned and owned-edited targets byte-identical', async () => {
  const fixture = await commandFixture();
  await (await fixture.args()).parse(['orders', '--procedure', 'list', '--form']);
  await fixture.fs.writeFile(
    PAGE,
    (await fixture.fs.readFile(PAGE)).replace('OrdersLayout', 'EditedLayout'),
  );
  await fixture.fs.writeFile(FORM, '// app-owned form\n');
  const before = new Map(fixture.fs.getFiles());
  fixture.resetWrites();

  const error = await assertRejects(
    () =>
      fixture.args().then((command) =>
        command.parse(['orders', '--procedure', 'list', '--form', '--force'])
      ),
    ResourceSliceConflictError,
  );

  assertEquals(
    [...error.result.conflicts].sort(),
    [FORM.slice(APP_ROOT.length + 1), PAGE.slice(APP_ROOT.length + 1)].sort(),
  );
  assertEquals(fixture.fs.getFiles(), before);
  assertEquals(fixture.writes(), 0);
});

Deno.test('force replaces exactly one positively owned divergent leaf', async () => {
  const fixture = await commandFixture();
  await (await fixture.args()).parse(['orders', '--procedure', 'list']);
  const divergent = await markOwnedResourceSliceLeaf(
    { resource: 'orders', role: 'page', options: ['core'] },
    'export default function OldPage() { return null; }\n',
  );
  await fixture.fs.writeFile(PAGE, divergent);
  fixture.resetWrites();

  await (await fixture.args()).parse(['orders', '--procedure', 'list', '--force']);

  assertEquals(fixture.writes(), 1);
  assertStringIncludes(await fixture.fs.readFile(PAGE), 'OrdersLayout');
  assertEquals(fixture.output.filter((line) => line.startsWith('WRITE ')).length, 1);
});

Deno.test('conflict output is emitted before a typed nonzero exit error', async () => {
  const fixture = await commandFixture();
  await fixture.fs.writeFile(PAGE, '// foreign page\n');
  fixture.resetWrites();

  const error = await assertRejects(
    () => fixture.args().then((command) => command.parse(['orders', '--procedure', 'list'])),
    ResourceSliceConflictError,
  );

  assertEquals(error.exitCode, 1);
  assertEquals(fixture.writes(), 0);
  assert(fixture.output.some((line) => line.startsWith('CONFLICT routes/orders/index.tsx')));
});

Deno.test('invalid input, client, procedure, Fresh staging, and shared transform never mutate the app', async () => {
  const cases: readonly Readonly<{
    name: string;
    argv: readonly string[];
    override?: Partial<GenerateResourceDependencies>;
    router?: string;
  }>[] = [
    {
      name: 'input',
      argv: ['orders', '--procedure', 'list', '--route', 'orders'],
    },
    {
      name: 'client',
      argv: ['orders', '--procedure', 'list'],
      override: { resolveClient: () => Promise.reject(new Error('client failure')) },
    },
    {
      name: 'procedure',
      argv: ['orders', '--procedure', 'missing'],
      override: { resolveProcedure: () => Promise.reject(new Error('procedure failure')) },
    },
    {
      name: 'Fresh staging',
      argv: ['orders', '--procedure', 'list'],
      override: { stage: () => Promise.reject(new Error('Fresh staging failure')) },
    },
    {
      name: 'shared transform',
      argv: ['orders', '--procedure', 'list'],
      router: 'export const customRouter = true;\n',
    },
  ];

  for (const testCase of cases) {
    const fixture = await commandFixture(testCase.router);
    const before = new Map(fixture.fs.getFiles());
    fixture.resetWrites();
    await assertRejects(
      () => fixture.args(testCase.override).then((command) => command.parse([...testCase.argv])),
    );
    assertEquals(fixture.fs.getFiles(), before, testCase.name);
    assertEquals(fixture.writes(), 0, testCase.name);
  }
});

async function commandFixture(router = ROUTER_SOURCE): Promise<CommandFixture> {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile(ROUTER, router);
  let writeCount = 0;
  const writeFile = fs.writeFile.bind(fs);
  fs.writeFile = async (path, content): Promise<void> => {
    writeCount++;
    await writeFile(path, content);
  };
  const output: string[] = [];
  const json: unknown[] = [];
  const base: GenerateResourceDependencies = {
    fs,
    templateRenderer: new StringTemplateAdapter(fs),
    templates: await loadResourceSliceTemplateAssets(),
    resolveAppRoot: () => Promise.resolve(APP_ROOT),
    resolveClient: (_root, _client) => Promise.resolve(selectedClient()),
    resolveProcedure: ({ procedure }) =>
      Promise.resolve({
        path: procedure.split('.') as [string, ...string[]],
        kind: 'query',
      }),
    stage: ({ route }) =>
      Promise.resolve({
        routeKeyPath: routeKeyPath(route),
        shared: [
          { path: '.generated/manifest.ts', content: 'manifest\n', role: 'fresh-derived' },
          { path: '.generated/routes.ts', content: 'routes\n', role: 'fresh-derived' },
        ],
      }),
  };
  return {
    fs,
    output,
    json,
    args: (extra = {}) =>
      Promise.resolve(createGenerateResourceCommand({
        generateResourceDependencies: { ...base, ...extra },
        printText: (message) => output.push(message),
        printJson: (value) => json.push(value),
      })),
    resetWrites: () => {
      writeCount = 0;
      output.splice(0);
      json.splice(0);
    },
    writes: () => writeCount,
  };
}

function selectedClient() {
  return {
    serviceName: 'orders',
    moduleSpecifier: '@app/lib/orders.ts',
    queryFactoryName: 'ordersQueries',
  } as const;
}

function routeKeyPath(route: string): [string, ...string[]] {
  const [first, ...rest] = route.slice(1).split('/');
  if (!first) throw new Error('Expected a normalized route.');
  return [first, ...rest, '$route'];
}
