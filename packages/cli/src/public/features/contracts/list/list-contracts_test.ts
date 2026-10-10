import { assertEquals, assertRejects } from '@std/assert';
import { ContractWorkspaceResolver } from '../../../../kernel/adapters/contracts/workspace-resolver.ts';
import { MemoryFileSystemAdapter } from '../../../../kernel/adapters/scaffold/memory-fs.ts';
import { ScaffoldValidationError } from '../../../../kernel/domain/errors.ts';
import { formatContractList, listContracts } from './list-contracts.ts';

/** Vocabulary that claims wiring, which a directory probe cannot prove. */
const REGISTRATION_VOCABULARY = /paired|registered|mounted|contract only/i;

function dependencies(fs: MemoryFileSystemAdapter, projectRoot: string | null = '/app') {
  return {
    findProjectRoot: () => Promise.resolve(projectRoot),
    resolver: new ContractWorkspaceResolver(fs),
  };
}

Deno.test('contract list reports a service directory without a handler as a directory, not a pairing', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile('/app/contracts/versions/v1/orders.contract.ts', 'export {};\n');
  await fs.writeFile('/app/contracts/versions/v1/users.contract.ts', 'export {};\n');
  // An empty directory: no handler, no router registration.
  await fs.createDir('/app/services/orders');

  const lines = formatContractList(await listContracts({}, dependencies(fs)));

  assertEquals(lines, [
    'Contracts (v1)',
    '  orders  service directory present',
    '  users  no service directory',
  ]);
  for (const line of lines) {
    assertEquals(REGISTRATION_VOCABULARY.test(line), false, `registration wording in "${line}"`);
  }
});

Deno.test('contract list labels every requested version independently', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile('/app/contracts/versions/v1/orders.contract.ts', 'export {};\n');
  await fs.writeFile('/app/contracts/versions/v2/orders.contract.ts', 'export {};\n');
  await fs.writeFile('/app/services/orders/mod.ts', 'export {};\n');

  assertEquals(formatContractList(await listContracts({}, dependencies(fs))), [
    'Contracts (v1)',
    '  orders  service directory present',
    'Contracts (v2)',
    '  orders  service directory present',
  ]);
  assertEquals(formatContractList(await listContracts({ version: 'v2' }, dependencies(fs))), [
    'Contracts (v2)',
    '  orders  service directory present',
  ]);
});

Deno.test('contract list fails explicitly when the workspace root cannot be resolved', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile('/app/contracts/versions/v1/orders.contract.ts', 'export {};\n');

  await assertRejects(
    () => listContracts({ path: '/elsewhere' }, dependencies(fs, null)),
    ScaffoldValidationError,
    'NetScript workspace root not found',
  );
});

Deno.test('contract list fails explicitly when the contracts workspace is missing', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.createDir('/app/services/orders');

  await assertRejects(
    () => listContracts({}, dependencies(fs)),
    ScaffoldValidationError,
    'Contracts workspace not found',
  );
});

Deno.test('contract list fails explicitly when the requested version is missing', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile('/app/contracts/versions/v1/orders.contract.ts', 'export {};\n');

  await assertRejects(
    () => listContracts({ version: 'v3' }, dependencies(fs)),
    ScaffoldValidationError,
    'Contracts workspace not found',
  );
});

Deno.test('contract list reports an empty resolved workspace as having no contracts', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.createDir('/app/contracts/versions/v1');

  assertEquals(formatContractList(await listContracts({}, dependencies(fs))), [
    'Contracts (v1)',
    'No contracts found.',
  ]);
});
