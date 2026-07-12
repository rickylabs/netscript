import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { Scaffolder } from '../../../../kernel/adapters/scaffold/scaffolder.ts';
import { MemoryFileSystemAdapter } from '../../../../kernel/adapters/scaffold/memory-fs.ts';
import { StringTemplateAdapter } from '../../../../kernel/adapters/scaffold/template-adapter.ts';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../../../kernel/application/registries/template-registry.ts';
import { removeService } from './remove-service.ts';

Deno.test('service remove reverses workspace, appsettings, contract, and helper mutations', async () => {
  await DEFAULT_TEMPLATE_REGISTRY.hydrate();
  const fs = new MemoryFileSystemAdapter();
  const templateAdapter = new StringTemplateAdapter(fs);
  const scaffolder = new Scaffolder(templateAdapter, fs);
  await fs.writeFile('/app/deno.json', JSON.stringify({
    workspace: ['./apps/dashboard', './contracts', './services/orders'],
  }));
  await fs.writeFile('/app/appsettings.json', JSON.stringify({
    NetScript: { Services: { orders: { Enabled: true } } },
  }));
  await fs.writeFile('/app/services/orders/src/main.ts', 'export {};\n');
  await fs.writeFile('/app/apps/dashboard/lib/orders.ts', 'export {};\n');
  await fs.writeFile('/app/contracts/versions/v1/orders.contract.ts', 'export {};\n');
  const result = await removeService({
    name: 'orders',
    projectRoot: '/app',
    keepContract: false,
  }, {
    fs,
    scaffolder,
    templateAdapter,
    regenerateHelpers: () => Promise.resolve(['/app/aspire/apphost.ts']),
  });

  assert(!await fs.exists('/app/services/orders'));
  assert(!await fs.exists('/app/apps/dashboard/lib/orders.ts'));
  assert(!await fs.exists('/app/contracts/versions/v1/orders.contract.ts'));
  assertEquals(result.removedContracts.length, 1);
  assertStringIncludes(await fs.readFile('/app/deno.json'), '"./contracts"');
  assert(!(await fs.readFile('/app/deno.json')).includes('./services/orders'));
  assertEquals(
    JSON.parse(await fs.readFile('/app/appsettings.json')).NetScript.Services,
    {},
  );
});
