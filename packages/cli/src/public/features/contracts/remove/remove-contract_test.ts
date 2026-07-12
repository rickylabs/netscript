import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { ContractVersionRegistry } from '../../../../kernel/adapters/contracts/version-registry.ts';
import { ContractWorkspaceResolver } from '../../../../kernel/adapters/contracts/workspace-resolver.ts';
import { MemoryFileSystemAdapter } from '../../../../kernel/adapters/scaffold/memory-fs.ts';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../../../kernel/application/registries/template-registry.ts';
import { removeContract } from './remove-contract.ts';

Deno.test('contract remove deletes every version and regenerates aggregates', async () => {
  await DEFAULT_TEMPLATE_REGISTRY.hydrate();
  const fs = new MemoryFileSystemAdapter();
  for (const version of ['v1', 'v2']) {
    await fs.writeFile(`/app/contracts/versions/${version}/orders.contract.ts`, 'export {};\n');
    await fs.writeFile(`/app/contracts/versions/${version}/users.contract.ts`, 'export {};\n');
  }
  const registry = new ContractVersionRegistry(fs);
  const removed = await removeContract({ name: 'orders', projectRoot: '/app' }, {
    fs,
    registry,
    resolver: new ContractWorkspaceResolver(fs),
  });
  assertEquals(removed.length, 2);
  assert(!await fs.exists('/app/contracts/versions/v1/orders.contract.ts'));
  assertStringIncludes(await fs.readFile('/app/contracts/versions/v2/mod.ts'), 'UsersContractV2');
});
