import { assertEquals, assertRejects, assertStringIncludes } from 'jsr:@std/assert@^1';
import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { createContractScaffolder } from '../../../../kernel/adapters/contracts/contract-scaffolder.ts';
import { DefaultContractTemplateRegistry } from '../../../../kernel/adapters/contracts/templates/contract-template-registry.ts';
import { ContractVersionRegistry } from '../../../../kernel/adapters/contracts/version-registry.ts';
import { ContractWorkspaceResolver } from '../../../../kernel/adapters/contracts/workspace-resolver.ts';
import { MemoryFileSystemAdapter } from '../../../../kernel/adapters/scaffold/memory-fs.ts';
import { Scaffolder } from '../../../../kernel/adapters/scaffold/scaffolder.ts';
import { StringTemplateAdapter } from '../../../../kernel/adapters/scaffold/template-adapter.ts';
import { ScaffoldValidationError } from '../../../../kernel/domain/errors.ts';
import { addContract } from './add-contract.ts';

describe('add contract', () => {
  it('writes a v1 contract and regenerates the aggregate', async () => {
    const { fs, contractScaffolder } = await workspace();

    const result = await addContract({
      name: 'catalog-items',
      projectRoot: '/workspace/shop',
      force: false,
    }, { fs, contractScaffolder });

    const contract = await fs.readFile(
      '/workspace/shop/contracts/versions/v1/catalog-items.contract.ts',
    );
    const aggregate = await fs.readFile('/workspace/shop/contracts/versions/v1/mod.ts');
    const rootConfig = JSON.parse(await fs.readFile('/workspace/shop/deno.json'));

    assertStringIncludes(contract, 'CatalogItemsContractV1');
    assertStringIncludes(aggregate, "from './catalog-items.contract.ts'");
    assertStringIncludes(aggregate, 'catalogItems: CatalogItemsV1');
    assertEquals(rootConfig.workspace, ['./contracts']);
    assertEquals(result.versions, ['v1']);
  });

  it('preserves an existing contract unless force is set', async () => {
    const { fs, contractScaffolder } = await workspace();
    const request = { name: 'catalog', projectRoot: '/workspace/shop', force: false } as const;

    await addContract(request, { fs, contractScaffolder });
    const contractPath = '/workspace/shop/contracts/versions/v1/catalog.contract.ts';
    await fs.writeFile(contractPath, '// user-authored contract\n');

    const result = await addContract(request, { fs, contractScaffolder });

    assertEquals(await fs.readFile(contractPath), '// user-authored contract\n');
    assertEquals(result.scaffoldResult.filesSkipped, [contractPath]);
  });

  it('rejects names outside the workspace naming contract', async () => {
    const { fs, contractScaffolder } = await workspace();

    await assertRejects(
      () => addContract({
        name: 'Catalog Items',
        projectRoot: '/workspace/shop',
        force: false,
      }, { fs, contractScaffolder }),
      ScaffoldValidationError,
      'Names must be kebab-case',
    );
  });
});

async function workspace(): Promise<{
  fs: MemoryFileSystemAdapter;
  contractScaffolder: ReturnType<typeof createContractScaffolder>;
}> {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile(
    '/workspace/shop/deno.json',
    JSON.stringify({ workspace: [] }, null, 2) + '\n',
  );
  await fs.writeFile(
    '/workspace/shop/contracts/deno.json',
    JSON.stringify({ name: '@shop/contracts' }, null, 2) + '\n',
  );
  await fs.createDir('/workspace/shop/contracts/versions/v1');
  const templateAdapter = new StringTemplateAdapter(fs);
  const scaffolder = new Scaffolder(templateAdapter, fs);

  return {
    fs,
    contractScaffolder: createContractScaffolder({
      scaffolder,
      templateAdapter,
      templateRegistry: new DefaultContractTemplateRegistry(),
      versionRegistry: new ContractVersionRegistry(fs),
      workspaceResolver: new ContractWorkspaceResolver(fs),
    }),
  };
}
