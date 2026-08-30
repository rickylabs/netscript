import {
  assert,
  assertEquals,
  assertStringIncludes,
  assertThrows,
} from 'jsr:@std/assert@^1';
import { DenoFileSystem } from '../../../../kernel/adapters/runtime/file-system/deno-file-system.ts';
import { MemoryFileSystemAdapter } from '../../../../kernel/adapters/scaffold/memory-fs.ts';
import {
  scaffoldUiPage,
  type UiGeneratedFile,
} from '../../../../kernel/application/ui/web-scaffold.ts';
import { createUiAddCommand } from './add-ui-command.ts';

const APP_ROOT = '/workspace/shop/apps/dashboard';
const ROUTER_PATH = `${APP_ROOT}/router.ts`;
const ROUTER_SOURCE = `import { createRouteReference } from '@netscript/fresh/route';

export const appRoutes = {
  home: createRouteReference('/', { id: 'home', kind: 'page' }),
} as const;
`;

Deno.test('ui:add help explains the page island query-loader triad', () => {
  const command = createUiAddCommand({
    installDependencies: { fs: new DenoFileSystem() },
    resolveUiAppRoot: () => Promise.resolve('/workspace'),
  });
  const help = command.getHelp().replace(/\s+/g, ' ');

  assertStringIncludes(
    help,
    'Creates one data-screen unit: typed page route + colocated hydrating island + query loader.',
  );
  assertStringIncludes(help, 'Use it when a route will load data and hydrate an interactive region.');
  assertStringIncludes(
    help,
    'Use a registry item when the route already exists and you only need an app-owned component',
  );
});

Deno.test('ui:add real help advertises exactly the independently planned data-screen roles', async () => {
  const fs = new MemoryFileSystemAdapter();
  await seedBindableApp(fs);
  const planned = await scaffoldUiPage(
    { projectRoot: APP_ROOT, path: 'incidents', island: true, dryRun: true },
    fs,
  );
  const help = testCommand(fs).getHelp().replace(/\s+/g, ' ');

  assertHelpMatchesPlan(help, planned.files);
  assertStringIncludes(help, 'routes/**/(_islands)/');
});

Deno.test('ui:add help-role seam rejects the stale three-part advertisement', async () => {
  const fs = new MemoryFileSystemAdapter();
  await seedBindableApp(fs);
  const planned = await scaffoldUiPage(
    { projectRoot: APP_ROOT, path: 'incidents', island: true, dryRun: true },
    fs,
  );

  assertThrows(
    () =>
      assertHelpMatchesPlan(
        'Data-screen roles: page, query-loader, island.',
        planned.files,
      ),
    Error,
  );
});

Deno.test('ui:add page --island --dry-run reports the exact plan and writes nothing', async () => {
  const fs = new MemoryFileSystemAdapter();
  await seedBindableApp(fs);
  const before = new Map(fs.getFiles());
  const output: string[] = [];

  await testCommand(fs, output).parse([
    'page',
    'admin/status',
    '--island',
    '--dry-run',
  ]);

  assertEquals(fs.getFiles(), before);
  assertReportedRoles(output, 'Planned');
  for (const path of [
    `${APP_ROOT}/routes/admin/status/index.tsx`,
    `${APP_ROOT}/routes/admin/status/(_shared)/query-loaders.ts`,
    `${APP_ROOT}/routes/admin/status/(_islands)/StatusIsland.tsx`,
    ROUTER_PATH,
  ]) {
    assert(output.some((line) => line.includes(path)), `Missing planned path: ${path}`);
  }
});

Deno.test('ui:add page --island reports each generated role and path', async () => {
  const fs = new MemoryFileSystemAdapter();
  await seedBindableApp(fs);
  const output: string[] = [];

  await testCommand(fs, output).parse(['page', 'incidents', '--island']);

  assertReportedRoles(output, 'Generated');
});

Deno.test('ui:add --force reaches page scaffold replacement', async () => {
  const fs = new MemoryFileSystemAdapter();
  await seedBindableApp(fs);
  for (const path of [
    `${APP_ROOT}/routes/orders/index.tsx`,
    `${APP_ROOT}/routes/orders/(_shared)/query-loaders.ts`,
    `${APP_ROOT}/routes/orders/(_islands)/OrdersIsland.tsx`,
  ]) {
    await fs.writeFile(path, '// stale\n');
  }

  await testCommand(fs).parse(['page', 'orders', '--island', '--force']);

  assertStringIncludes(
    await fs.readFile(`${APP_ROOT}/routes/orders/index.tsx`),
    ".withRoute(appRoutes['orders'])",
  );
});

function testCommand(fs: MemoryFileSystemAdapter, output: string[] = []) {
  return createUiAddCommand({
    installDependencies: { fs },
    resolveUiAppRoot: () => Promise.resolve(APP_ROOT),
    print: (message) => output.push(message),
  });
}

async function seedBindableApp(fs: MemoryFileSystemAdapter): Promise<void> {
  await fs.writeFile(ROUTER_PATH, ROUTER_SOURCE);
  await fs.writeFile(
    `${APP_ROOT}/lib/orders.ts`,
    `export const ordersName = 'orders';
export const ordersQueries = createQueryFactories({
  service: { contract: ordersContract, client: ordersClient },
}).service;
`,
  );
  await fs.writeFile(
    '/workspace/shop/contracts/versions/v1/orders.contract.ts',
    "export const OrdersCrudContractV1 = createCrudContract({ resource: 'orders' });\n",
  );
}

function assertHelpMatchesPlan(help: string, files: readonly UiGeneratedFile[]): void {
  const advertised = /Data-screen roles: ([^.]+)\./.exec(help)?.[1]
    .split(',')
    .map((role) => role.trim())
    .sort();
  assert(advertised, 'Real command help must expose the data-screen role list.');
  assertEquals(advertised, [...new Set(files.map((file) => file.role))].sort());
}

function assertReportedRoles(output: readonly string[], verb: 'Planned' | 'Generated'): void {
  assertEquals(
    output.filter((line) => line.startsWith(`${verb} `)).map((line) => line.split(':')[0]).sort(),
    [
      `${verb} island`,
      `${verb} page`,
      `${verb} query-loader`,
      `${verb} route-registration`,
    ],
  );
}
