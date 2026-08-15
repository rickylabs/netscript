import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assertEquals, assertRejects, assertStringIncludes } from 'jsr:@std/assert@^1';

import { MemoryFileSystemAdapter } from '../../../../kernel/adapters/scaffold/memory-fs.ts';
import { Scaffolder } from '../../../../kernel/adapters/scaffold/scaffolder.ts';
import { StringTemplateAdapter } from '../../../../kernel/adapters/scaffold/template-adapter.ts';
import { createContractScaffolder } from '../../../../kernel/adapters/contracts/contract-scaffolder.ts';
import { DefaultContractTemplateRegistry } from '../../../../kernel/adapters/contracts/templates/contract-template-registry.ts';
import { ContractVersionRegistry } from '../../../../kernel/adapters/contracts/version-registry.ts';
import { ContractWorkspaceResolver } from '../../../../kernel/adapters/contracts/workspace-resolver.ts';
import { PortAllocator } from '../../../../kernel/adapters/service/port-allocator.ts';
import { ServiceScaffolder } from '../../../../kernel/adapters/service/scaffolder.ts';
import { ServiceWorkspaceResolver } from '../../../../kernel/adapters/service/workspace-resolver.ts';
import { addService } from './add-service.ts';
import { planServiceAdd } from './plan-service-add.ts';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../../../kernel/application/registries/template-registry.ts';
import { ServiceClientScaffolder } from '../../../../kernel/adapters/service/client-scaffolder.ts';
import { ScaffoldValidationError } from '../../../../kernel/domain/errors.ts';

// This flow renders root project metadata via sync template generators, which
// require a previously-awaited registry hydration. The test drives the flow
// directly (outside the CLI dispatch path), so hydrate at module load.
await DEFAULT_TEMPLATE_REGISTRY.hydrate();

describe('public add service flow', () => {
  it('plans a service add request from project metadata', async () => {
    const fs = new MemoryFileSystemAdapter();
    await writeProjectFiles(fs);

    const plan = await planServiceAdd({
      serviceName: 'billing',
      serviceReferences: [],
      projectRoot: '/workspace/alpha',
      overwrite: false,
    }, {
      fs,
      portAllocator: new PortAllocator(fs),
      serviceResolver: new ServiceWorkspaceResolver(fs),
    });

    assertEquals(plan.projectName, 'alpha-app');
    assertEquals(plan.allocation.port >= 49_152, true);
    assertEquals(plan.allocation.source, 'auto');
  });

  it('writes service and contract files with JSR imports', async () => {
    const fs = new MemoryFileSystemAdapter();
    await writeProjectFiles(fs);
    const templateAdapter = new StringTemplateAdapter(fs);
    const scaffolder = new Scaffolder(templateAdapter, fs);

    const result = await addService({
      serviceName: 'billing',
      port: 3005,
      serviceReferences: ['users'],
      projectRoot: '/workspace/alpha',
      overwrite: false,
      withClient: true,
    }, {
      fs,
      scaffolder,
      templateAdapter,
      portAllocator: new PortAllocator(fs),
      serviceResolver: new ServiceWorkspaceResolver(fs),
      contractScaffolder: createContractScaffolder({
        scaffolder,
        templateAdapter,
        templateRegistry: new DefaultContractTemplateRegistry(),
        versionRegistry: new ContractVersionRegistry(fs),
        workspaceResolver: new ContractWorkspaceResolver(fs),
      }),
      serviceScaffolder: new ServiceScaffolder(scaffolder, fs, templateAdapter),
      clientScaffolder: new ServiceClientScaffolder(scaffolder, fs),
      regenerateHelpers: () => Promise.resolve(['/workspace/alpha/aspire/apphost.mts']),
    });

    const serviceDenoJson = JSON.parse(
      await fs.readFile('/workspace/alpha/services/billing/deno.json'),
    );
    const appsettings = JSON.parse(await fs.readFile('/workspace/alpha/appsettings.json'));
    const rootDenoJson = JSON.parse(await fs.readFile('/workspace/alpha/deno.json'));
    const contractMod = await fs.readFile('/workspace/alpha/contracts/versions/v1/mod.ts');

    assertStringIncludes(
      serviceDenoJson.imports['@netscript/service'],
      'jsr:@netscript/service',
    );
    assertEquals(appsettings.NetScript.Services.billing.ServiceReferences, ['users']);
    assertEquals(rootDenoJson.workspace.includes('./services/billing'), true);
    assertStringIncludes(contractMod, './billing.contract.ts');
    assertEquals(result.helperFiles.length, 1);
    assertEquals(result.clientPath, '/workspace/alpha/apps/web/lib/billing.ts');
    if (!result.clientPath) throw new Error('Expected generated client path.');
    assertStringIncludes(
      await fs.readFile(result.clientPath),
      '{ queryKey: billingQueries.list.clientKey() } as const',
    );
  });

  it('rejects an unrelated missing contract before any add-path write', async () => {
    const fs = new MemoryFileSystemAdapter();
    await writeProjectFiles(fs, {
      users: { Port: 3001 },
      orders: { Port: 3002 },
    });
    await fs.writeFile(
      '/workspace/alpha/contracts/versions/v1/users.contract.ts',
      'export const UsersContractV1 = { list: {} };\n',
    );
    const originalAppsettings = await fs.readFile('/workspace/alpha/appsettings.json');
    const originalWorkspace = await fs.readFile('/workspace/alpha/deno.json');
    const templateAdapter = new StringTemplateAdapter(fs);
    const scaffolder = new Scaffolder(templateAdapter, fs);

    const error = await assertRejects(
      () =>
        addService({
          serviceName: 'payments',
          port: 3003,
          serviceReferences: [],
          projectRoot: '/workspace/alpha',
          overwrite: false,
          withClient: true,
        }, {
          fs,
          scaffolder,
          templateAdapter,
          portAllocator: new PortAllocator(fs),
          serviceResolver: new ServiceWorkspaceResolver(fs),
          contractScaffolder: createContractScaffolder({
            scaffolder,
            templateAdapter,
            templateRegistry: new DefaultContractTemplateRegistry(),
            versionRegistry: new ContractVersionRegistry(fs),
            workspaceResolver: new ContractWorkspaceResolver(fs),
          }),
          serviceScaffolder: new ServiceScaffolder(scaffolder, fs, templateAdapter),
          clientScaffolder: new ServiceClientScaffolder(scaffolder, fs),
          regenerateHelpers: async () => {
            await fs.writeFile('/workspace/alpha/aspire/apphost.mts', '// unexpected write\n');
            return ['/workspace/alpha/aspire/apphost.mts'];
          },
        }),
      ScaffoldValidationError,
    );

    assertStringIncludes(error.message, 'orders');
    assertStringIncludes(
      error.message,
      '/workspace/alpha/contracts/versions/v1/orders.contract.ts',
    );
    assertEquals(await fs.readFile('/workspace/alpha/appsettings.json'), originalAppsettings);
    assertEquals(await fs.readFile('/workspace/alpha/deno.json'), originalWorkspace);
    assertEquals(await fs.exists('/workspace/alpha/aspire/apphost.mts'), false);
    assertEquals(await fs.exists('/workspace/alpha/services/payments/deno.json'), false);
    assertEquals(
      await fs.exists('/workspace/alpha/contracts/versions/v1/payments.contract.ts'),
      false,
    );
  });
});

async function writeProjectFiles(
  fs: MemoryFileSystemAdapter,
  services: Readonly<Record<string, unknown>> = {},
): Promise<void> {
  await fs.writeFile(
    '/workspace/alpha/appsettings.json',
    JSON.stringify(
      {
        NetScript: {
          Name: 'alpha-app',
          Services: services,
        },
      },
      null,
      2,
    ) + '\n',
  );
  await fs.writeFile(
    '/workspace/alpha/deno.json',
    JSON.stringify({ workspace: ['apps/web', './contracts'] }, null, 2) + '\n',
  );
}
