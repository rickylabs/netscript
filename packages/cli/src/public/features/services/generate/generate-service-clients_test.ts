import { assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { Scaffolder } from '../../../../kernel/adapters/scaffold/scaffolder.ts';
import { MemoryFileSystemAdapter } from '../../../../kernel/adapters/scaffold/memory-fs.ts';
import { StringTemplateAdapter } from '../../../../kernel/adapters/scaffold/template-adapter.ts';
import { ServiceClientScaffolder } from '../../../../kernel/adapters/service/client-scaffolder.ts';
import { ServiceWorkspaceResolver } from '../../../../kernel/adapters/service/workspace-resolver.ts';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../../../kernel/application/registries/template-registry.ts';
import { ScaffoldValidationError } from '../../../../kernel/domain/errors.ts';
import type { ScaffolderPort, TemplatePort } from '../../../../kernel/ports/template-port.ts';
import { createServiceGenerateCommand } from './generate-service-command.ts';
import { generateServiceClients } from './generate-service-clients.ts';

await DEFAULT_TEMPLATE_REGISTRY.hydrate();

Deno.test('generateServiceClients isolates two service resource keys and SDK imports', async () => {
  const harness = await createHarness({ orders: {}, 'team-members': { Enabled: false } });
  await writeContract(harness.fs, 'orders');
  await writeContract(harness.fs, 'team-members');
  const initOwnedRoute =
    '/workspace/shop/apps/dashboard/routes/examples/service/(_lib)/service-query.ts';
  await harness.fs.writeFile(initOwnedRoute, '// init-owned route stays untouched\n');

  const result = await generateServiceClients({
    projectRoot: '/workspace/shop',
    dryRun: false,
    force: false,
  }, harness.dependencies);

  assertEquals(result.written, [
    '/workspace/shop/apps/dashboard/lib/orders.ts',
    '/workspace/shop/apps/dashboard/lib/team-members.ts',
  ]);
  const orders = await harness.fs.readFile(result.written[0]);
  const teamMembers = await harness.fs.readFile(result.written[1]);
  assertStringIncludes(orders, 'createQueryFactories({\n  orders: {');
  assertStringIncludes(teamMembers, 'createQueryFactories({\n  teamMembers: {');
  assertEquals(extractQueryFactoryResource(orders), 'orders');
  assertEquals(extractQueryFactoryResource(teamMembers), 'teamMembers');
  assertEquals(extractSdkImports(orders), [
    ['@netscript/sdk/client', ['createServiceClient']],
    ['@netscript/sdk/query', ['createQueryFactories']],
  ]);
  assertLiteralInvalidationAfterQueries(orders, 'orders');
  assertLiteralInvalidationAfterQueries(teamMembers, 'teamMembers');
  assertEquals(
    await harness.fs.readFile(initOwnedRoute),
    '// init-owned route stays untouched\n',
  );
});

Deno.test('generateServiceClients rewrites drift, skips identical files, and force rewrites', async () => {
  const harness = await createHarness({ orders: {} });
  await writeContract(harness.fs, 'orders');
  const path = '/workspace/shop/apps/dashboard/lib/orders.ts';
  await harness.fs.writeFile(path, '// stale\n');

  const first = await generateServiceClients({
    projectRoot: '/workspace/shop',
    dryRun: false,
    force: false,
  }, harness.dependencies);
  assertEquals(first.written, [path]);
  assertEquals(first.skipped, []);

  const second = await generateServiceClients({
    projectRoot: '/workspace/shop',
    dryRun: false,
    force: false,
  }, harness.dependencies);
  assertEquals(second.written, []);
  assertEquals(second.skipped, [path]);

  const forced = await generateServiceClients({
    projectRoot: '/workspace/shop',
    dryRun: false,
    force: true,
  }, harness.dependencies);
  assertEquals(forced.written, [path]);
});

Deno.test('generateServiceClients dry-run reports plans without writing', async () => {
  const harness = await createHarness({ orders: {} });
  await writeContract(harness.fs, 'orders');

  const result = await generateServiceClients({
    projectRoot: '/workspace/shop',
    dryRun: true,
    force: false,
  }, harness.dependencies);

  assertEquals(result.planned.map((file) => [file.serviceName, file.willWrite]), [[
    'orders',
    true,
  ]]);
  assertEquals(result.written, []);
  assertEquals(await harness.fs.exists('/workspace/shop/apps/dashboard/lib/orders.ts'), false);
});

Deno.test('generateServiceClients validates all contracts before any write', async () => {
  const harness = await createHarness({ orders: {}, payments: {} });
  await writeContract(harness.fs, 'orders');

  await assertRejects(
    () =>
      generateServiceClients({
        projectRoot: '/workspace/shop',
        dryRun: false,
        force: false,
      }, harness.dependencies),
    ScaffoldValidationError,
    'payments',
    '/workspace/shop/contracts/versions/v1/payments.contract.ts',
  );
  assertEquals(await harness.fs.exists('/workspace/shop/apps/dashboard/lib/orders.ts'), false);
});

Deno.test('generateServiceClients rejects colliding derived resource identities before writes', async () => {
  const harness = await createHarness({ 'team-members': {}, teamMembers: {} });
  await writeContract(harness.fs, 'team-members');
  await writeContract(harness.fs, 'teamMembers');

  await assertRejects(
    () =>
      generateServiceClients({
        projectRoot: '/workspace/shop',
        dryRun: false,
        force: false,
      }, harness.dependencies),
    ScaffoldValidationError,
    'share resource identity "teamMembers"',
  );
});

Deno.test('service generate withholds Aspire writes when any service contract is missing', async () => {
  const harness = await createHarness({ orders: {}, payments: {} });
  await writeContract(harness.fs, 'orders');
  let aspireCalls = 0;
  const command = createServiceGenerateCommand({
    resolveProjectRoot: () => Promise.resolve('/workspace/shop'),
    generateServiceClientsDependencies: harness.dependencies,
    generateAspireDependencies: {
      fs: harness.fs,
      scaffolder: {} as ScaffolderPort,
      templateAdapter: {} as TemplatePort,
    },
    generateHelpers: () => {
      aspireCalls++;
      return Promise.resolve({ helperFiles: [] });
    },
  });

  await assertRejects(
    () => command.parse([]),
    ScaffoldValidationError,
    '/workspace/shop/contracts/versions/v1/payments.contract.ts',
  );
  assertEquals(aspireCalls, 0);
  assertEquals(await harness.fs.exists('/workspace/shop/apps/dashboard/lib/orders.ts'), false);
});

Deno.test('service generate applies dry-run and force to clients and Aspire helpers', async () => {
  const harness = await createHarness({ orders: {} });
  const requests: unknown[] = [];
  const command = createServiceGenerateCommand({
    resolveProjectRoot: () => Promise.resolve('/workspace/shop'),
    generateServiceClientsDependencies: harness.dependencies,
    generateAspireDependencies: {
      fs: harness.fs,
      scaffolder: {} as ScaffolderPort,
      templateAdapter: {} as TemplatePort,
    },
    generateClients: (request) => {
      requests.push(['clients', request]);
      return Promise.resolve({ planned: [], written: [], skipped: [], dryRun: request.dryRun });
    },
    generateHelpers: (request) => {
      requests.push(['aspire', request]);
      return Promise.resolve({ helperFiles: [] });
    },
  });

  await command.parse(['--dry-run', '--force']);
  assertEquals(requests, [
    ['clients', { projectRoot: '/workspace/shop', dryRun: true, force: true }],
    ['aspire', { projectRoot: '/workspace/shop', dryRun: true, force: true }],
  ]);
});

async function createHarness(
  services: Readonly<Record<string, unknown>>,
): Promise<{
  readonly fs: MemoryFileSystemAdapter;
  readonly dependencies: {
    readonly readProjectName: () => Promise<string>;
    readonly serviceResolver: ServiceWorkspaceResolver;
    readonly clientScaffolder: ServiceClientScaffolder;
  };
}> {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile(
    '/workspace/shop/deno.json',
    JSON.stringify({
      workspace: ['./apps/dashboard', './contracts'],
    }),
  );
  await fs.writeFile(
    '/workspace/shop/appsettings.json',
    JSON.stringify({
      NetScript: { Name: 'shop', Services: services },
    }),
  );
  const template = new StringTemplateAdapter(fs);
  return {
    fs,
    dependencies: {
      readProjectName: () => Promise.resolve('shop'),
      serviceResolver: new ServiceWorkspaceResolver(fs),
      clientScaffolder: new ServiceClientScaffolder(new Scaffolder(template, fs), fs),
    },
  };
}

async function writeContract(fs: MemoryFileSystemAdapter, serviceName: string): Promise<void> {
  const pascal = serviceName.split(/[-_\s]+/).map((part) =>
    part.length > 0 ? part[0].toUpperCase() + part.slice(1) : ''
  ).join('');
  await fs.writeFile(
    `/workspace/shop/contracts/versions/v1/${serviceName}.contract.ts`,
    `export const ${pascal}ContractV1 = { list: {} };\n`,
  );
}

function extractQueryFactoryResource(source: string): string {
  const match = source.match(/createQueryFactories\(\{\s*([A-Za-z_$][\w$]*):/);
  if (!match) throw new Error('Rendered query-factory resource was not found.');
  return match[1];
}

function extractSdkImports(source: string): readonly (readonly [string, readonly string[]])[] {
  return [...source.matchAll(/import\s+([^;]+?)\s+from '(@netscript\/sdk\/[^']+)';/g)]
    .map((match) => {
      const named = match[1].match(/^\{([^}]+)\}$/s);
      if (!named) throw new Error(`SDK import is not a named import: ${match[0]}`);
      return [
        match[2],
        named[1].split(',').map((name) => name.trim()).filter(Boolean),
      ] as const;
    })
    .sort(([left], [right]) => left.localeCompare(right));
}

function assertLiteralInvalidationAfterQueries(source: string, serviceIdentity: string): void {
  const queries = `export const ${serviceIdentity}Queries = createQueryFactories`;
  const invalidation =
    `export const ${serviceIdentity}ListInvalidation = { queryKey: ${serviceIdentity}Queries.list.clientKey() } as const;`;
  assertStringIncludes(source, invalidation);
  assertEquals(source.indexOf(invalidation) > source.indexOf(queries), true);
}
