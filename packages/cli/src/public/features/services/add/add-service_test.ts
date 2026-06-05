import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';

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
    assertEquals(plan.allocation.port, 3000);
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
      regenerateHelpers: () => Promise.resolve(['/workspace/alpha/aspire/apphost.ts']),
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
  });
});

async function writeProjectFiles(fs: MemoryFileSystemAdapter): Promise<void> {
  await fs.writeFile(
    '/workspace/alpha/appsettings.json',
    JSON.stringify(
      {
        NetScript: {
          Name: 'alpha-app',
          Services: {},
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
