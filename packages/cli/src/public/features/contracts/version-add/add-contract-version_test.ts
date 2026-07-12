import { assert, assertStringIncludes } from '@std/assert';
import { ContractVersionRegistry } from '../../../../kernel/adapters/contracts/version-registry.ts';
import { MemoryFileSystemAdapter } from '../../../../kernel/adapters/scaffold/memory-fs.ts';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../../../kernel/application/registries/template-registry.ts';
import { addContractVersion } from './add-contract-version.ts';

Deno.test('contract version add promotes symbols and regenerates aggregates', async () => {
  await DEFAULT_TEMPLATE_REGISTRY.hydrate();
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile('/app/contracts/versions/v1/orders.contract.ts', `
export const OrdersContractV1 = {};
export const OrdersV1 = implement(OrdersContractV1);
`);
  await fs.writeFile('/app/contracts/versions/v1/mod.ts', 'export const v1 = {};\n');
  await fs.writeFile('/app/contracts/mod.ts', "export * from './versions/v1/mod.ts';\n");
  const result = await addContractVersion({
    name: 'orders',
    projectRoot: '/app',
    from: 'v1',
    to: 'v2',
    force: false,
  }, { fs, registry: new ContractVersionRegistry(fs) });

  assert(await fs.exists(result.contractPath));
  assertStringIncludes(await fs.readFile(result.contractPath), 'OrdersContractV2');
  assertStringIncludes(await fs.readFile(result.aggregatePath), 'OrdersContractV2');
  const rootMod = await fs.readFile(result.rootModPath);
  assertStringIncludes(rootMod, "./versions/v1/mod.ts");
  assertStringIncludes(rootMod, "./versions/v2/mod.ts");
});
