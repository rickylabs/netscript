/**
 * @module infra/service/scaffolder_test
 *
 * Focused tests for the service capability.
 */

import { assertEquals, assertRejects, assertStringIncludes } from 'jsr:@std/assert@^1';
import { MemoryFileSystemAdapter } from '../scaffold/memory-fs.ts';
import { Scaffolder } from '../scaffold/scaffolder.ts';
import { StringTemplateAdapter } from '../scaffold/template-adapter.ts';
import { createContractScaffolder } from '../contracts/contract-scaffolder.ts';
import { DefaultContractTemplateRegistry } from '../contracts/templates/contract-template-registry.ts';
import { DEFAULT_CONTRACT_VERSION } from '../contracts/types.ts';
import { ContractVersionRegistry } from '../contracts/version-registry.ts';
import { ContractWorkspaceResolver } from '../contracts/workspace-resolver.ts';
import { ScaffoldValidationError } from '../../domain/errors.ts';
import { generateV1Mod } from '../contracts/templates/generate-v1-mod.ts';
import { PortAllocator } from './port-allocator.ts';
import { ServiceScaffolder } from './scaffolder.ts';
import { ServiceWorkspaceResolver } from './workspace-resolver.ts';

function createHarness(): {
  readonly fs: MemoryFileSystemAdapter;
  readonly scaffolder: Scaffolder;
  readonly templateAdapter: StringTemplateAdapter;
} {
  const fs = new MemoryFileSystemAdapter();
  const templateAdapter = new StringTemplateAdapter(fs);
  const scaffolder = new Scaffolder(templateAdapter, fs);
  return { fs, scaffolder, templateAdapter };
}

Deno.test('ServiceScaffolder creates a contract-bound service workspace', async () => {
  const { fs, scaffolder, templateAdapter } = createHarness();
  const result = await new ServiceScaffolder(scaffolder, fs, templateAdapter).scaffold({
    projectName: 'my-app',
    targetPath: '/project',
    serviceName: 'orders',
    servicePort: 3000,
    importMode: 'jsr',
    force: false,
  });

  assertEquals(result.scaffoldResult.filesCreated.length, 5);
  assertEquals(result.scaffoldResult.directoriesCreated.length, 3);
  assertEquals(result.configEntry.Port, 3000);
  assertEquals(result.configEntry.Workdir, 'services/orders');

  const denoJson = JSON.parse(await fs.readFile('/project/services/orders/deno.json'));
  assertEquals(denoJson.name, '@my-app/orders');
  assertEquals(denoJson.imports['@my-app/contracts'], '../../contracts/mod.ts');
  assertEquals(denoJson.compilerOptions.lib, ['dom', 'deno.ns', 'deno.unstable']);

  const v1Content = await fs.readFile('/project/services/orders/src/routers/v1.ts');
  assertStringIncludes(v1Content, "from '@my-app/contracts'");
  assertStringIncludes(v1Content, 'v1.orders.list.handler');

  const mainContent = await fs.readFile('/project/services/orders/src/main.ts');
  assertStringIncludes(mainContent, "port: parseInt(Deno.env.get('PORT') || '3000')");
});

Deno.test('shared contract scaffolder creates service contracts and aggregates v1 mod exports', async () => {
  const { fs, scaffolder, templateAdapter } = createHarness();
  await fs.writeFile('/project/deno.json', JSON.stringify({ workspace: ['./contracts'] }));

  const contractScaffolder = createContractScaffolder({
    scaffolder,
    templateAdapter,
    templateRegistry: new DefaultContractTemplateRegistry(),
    versionRegistry: new ContractVersionRegistry(fs),
    workspaceResolver: new ContractWorkspaceResolver(fs),
  });

  await contractScaffolder.scaffoldFull({
    options: {
      projectName: 'my-app',
      targetPath: '/project',
      importMode: 'jsr',
      force: false,
    },
  });
  await contractScaffolder.addServiceContract(
    {
      projectName: 'my-app',
      targetPath: '/project',
      importMode: 'jsr',
      force: false,
    },
    { serviceName: 'orders', version: DEFAULT_CONTRACT_VERSION },
  );
  await contractScaffolder.addServiceContract(
    {
      projectName: 'my-app',
      targetPath: '/project',
      importMode: 'jsr',
      force: false,
    },
    { serviceName: 'payments', version: DEFAULT_CONTRACT_VERSION },
  );

  const modContent = await fs.readFile('/project/contracts/versions/v1/mod.ts');
  assertStringIncludes(modContent, "from './orders.contract.ts'");
  assertStringIncludes(modContent, "from './payments.contract.ts'");
  assertStringIncludes(modContent, 'orders: OrdersV1');
  assertStringIncludes(modContent, 'payments: PaymentsV1');
});

Deno.test('PortAllocator assigns next available service port', async () => {
  const { fs } = createHarness();
  await fs.writeFile(
    '/project/appsettings.json',
    JSON.stringify({
      NetScript: {
        Services: {
          users: { Port: 3000 },
          products: { Port: 3001 },
        },
      },
    }),
  );

  const allocation = await new PortAllocator(fs).allocate('/project');
  assertEquals(allocation, { port: 3002, source: 'auto' });
});

Deno.test('PortAllocator rejects out-of-range and duplicate requested ports', async () => {
  const { fs } = createHarness();
  await fs.writeFile(
    '/project/appsettings.json',
    JSON.stringify({ NetScript: { Services: { users: { Port: 3000 } } } }),
  );

  await assertRejects(
    () => new PortAllocator(fs).allocate('/project', 2999),
    ScaffoldValidationError,
  );
  await assertRejects(
    () => new PortAllocator(fs).allocate('/project', 3000),
    ScaffoldValidationError,
  );
});

Deno.test('ServiceWorkspaceResolver discovers configured services', async () => {
  const { fs } = createHarness();
  await fs.writeFile(
    '/project/appsettings.json',
    JSON.stringify({
      NetScript: {
        Services: {
          orders: {
            Enabled: true,
            Runtime: 'deno',
            Port: 3002,
            Entrypoint: 'src/main.ts',
            Workdir: 'services/orders',
            ServiceReferences: ['users'],
          },
        },
      },
    }),
  );

  const resolver = new ServiceWorkspaceResolver(fs);
  const services = await resolver.discoverServices('/project');
  assertEquals(services.length, 1);
  assertEquals(services[0].name, 'orders');
  assertEquals(services[0].serviceReferences, ['users']);
  assertEquals(await resolver.serviceExists('/project', 'orders'), true);
});

Deno.test('shared generateV1Mod supports multiple service names', () => {
  const output = generateV1Mod({
    serviceNames: ['payments', 'orders'],
  });

  assertStringIncludes(output, 'import { OrdersContractV1, OrdersV1 }');
  assertStringIncludes(output, 'import { PaymentsContractV1, PaymentsV1 }');
  assertStringIncludes(output, 'orders: OrdersV1');
  assertStringIncludes(output, 'payments: PaymentsV1');
});

Deno.test('shared generateV1Mod supports one service name', () => {
  const output = generateV1Mod({ serviceNames: ['orders'] });

  assertStringIncludes(output, 'import { OrdersContractV1, OrdersV1 }');
  assertStringIncludes(output, 'orders: OrdersV1');
});
