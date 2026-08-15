/**
 * @module infra/service/scaffolder_test
 *
 * Focused tests for the service capability.
 */

import { assertEquals, assertRejects, assertStringIncludes } from 'jsr:@std/assert@^1';
import { join } from 'jsr:@std/path@^1';
import { writeCrudZodBarrel } from '../../../../../database/scripts/mod.ts';
import { MemoryFileSystemAdapter } from '../scaffold/memory-fs.ts';
import { Scaffolder } from '../scaffold/scaffolder.ts';
import { StringTemplateAdapter } from '../scaffold/template-adapter.ts';
import { createContractScaffolder } from '../contracts/contract-scaffolder.ts';
import { DefaultContractTemplateRegistry } from '../contracts/templates/contract-template-registry.ts';
import { DEFAULT_CONTRACT_VERSION } from '../contracts/types.ts';
import { ContractVersionRegistry } from '../contracts/version-registry.ts';
import { ContractWorkspaceResolver } from '../contracts/workspace-resolver.ts';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../application/registries/template-registry.ts';
import { ScaffoldValidationError } from '../../domain/errors.ts';
import { generateV1Mod } from '../contracts/templates/generate-v1-mod.ts';
import { generateDenoJson } from '../../templates/workspace/deno-json.ts';
import { PortAllocator } from './port-allocator.ts';
import { ServiceScaffolder } from './scaffolder.ts';
import { ServiceWorkspaceResolver } from './workspace-resolver.ts';
import type { GeneratedSourceFormatterPort } from '../../ports/generated-source-formatter-port.ts';

await DEFAULT_TEMPLATE_REGISTRY.hydrate();

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
  assertEquals(result.configEntry.Port, undefined);
  assertEquals(result.configEntry.HostPort, undefined);
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

Deno.test('ServiceScaffolder writes canonical content for every generated service file', async () => {
  const { fs, scaffolder, templateAdapter } = createHarness();
  const formattedPaths: string[] = [];
  const formatter: GeneratedSourceFormatterPort = {
    formatContent: (path, content) => {
      formattedPaths.push(path);
      return Promise.resolve(path.endsWith('.json') ? content : `// canonical\n${content}`);
    },
    formatFiles: () => Promise.resolve({ code: 0, stdout: '', stderr: '' }),
  };

  await new ServiceScaffolder(scaffolder, fs, templateAdapter, formatter).scaffold({
    projectName: 'my-app',
    targetPath: '/project',
    serviceName: 'payments',
    servicePort: 3001,
    importMode: 'jsr',
    force: false,
  });

  assertEquals(formattedPaths, [
    '/project/services/payments/deno.json',
    '/project/services/payments/src/main.ts',
    '/project/services/payments/src/router.ts',
    '/project/services/payments/src/routers/health.ts',
    '/project/services/payments/src/routers/v1.ts',
  ]);
  assertEquals(
    (await fs.readFile('/project/services/payments/src/routers/v1.ts')).startsWith(
      '// canonical\n',
    ),
    true,
  );
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
      imports: {
        '@database/zod': '../database/postgres/schema/.generated/zod/crud.ts',
      },
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
  await contractScaffolder.addServiceContract(
    {
      projectName: 'my-app',
      targetPath: '/project',
      importMode: 'jsr',
      force: false,
    },
    {
      serviceName: 'cycles',
      version: DEFAULT_CONTRACT_VERSION,
      modelName: 'Cycle',
      hasDatabase: true,
    },
  );

  const modContent = await fs.readFile('/project/contracts/versions/v1/mod.ts');
  assertStringIncludes(modContent, "from './orders.contract.ts'");
  assertStringIncludes(modContent, "from './payments.contract.ts'");
  assertStringIncludes(modContent, "from './cycles.contract.ts'");
  assertStringIncludes(modContent, 'orders: OrdersV1');
  assertStringIncludes(modContent, 'payments: PaymentsV1');
  assertStringIncludes(modContent, 'cycles: CyclesV1');

  const cycleContract = await fs.readFile(
    '/project/contracts/versions/v1/cycles.contract.ts',
  );
  assertStringIncludes(cycleContract, 'CycleCreateInput');
  assertStringIncludes(cycleContract, 'CycleSchema');
  assertStringIncludes(cycleContract, 'CycleUpdateInput');
  assertStringIncludes(cycleContract, "from '@database/zod'");

  const contractsDenoJson = JSON.parse(await fs.readFile('/project/contracts/deno.json'));
  assertEquals(contractsDenoJson.exports, {
    '.': './mod.ts',
    './versions/v1': './versions/v1/mod.ts',
  });
  assertStringIncludes(
    contractsDenoJson.imports['@netscript/contracts'],
    'jsr:@netscript/contracts',
  );
  assertEquals(
    contractsDenoJson.imports['@database/zod'],
    '../database/postgres/schema/.generated/zod/crud.ts',
  );

  const compileRoot = await Deno.makeTempDir();
  try {
    const zodOutputDir = join(compileRoot, 'database', 'postgres', 'schema', '.generated', 'zod');
    await Deno.mkdir(join(zodOutputDir, 'schemas', 'models'), { recursive: true });
    await Deno.mkdir(join(zodOutputDir, 'schemas', 'variants', 'input'), { recursive: true });
    await Deno.mkdir(join(zodOutputDir, 'schemas', 'objects'), { recursive: true });
    await Deno.mkdir(join(compileRoot, 'contracts', 'versions', 'v1'), { recursive: true });
    await Deno.mkdir(join(compileRoot, 'stubs'), { recursive: true });

    await Promise.all([
      Deno.writeTextFile(
        join(zodOutputDir, 'schemas', 'models', 'Cycle.schema.ts'),
        "import { z } from 'zod';\nexport const CycleSchema = z.object({ id: z.number() });\n",
      ),
      Deno.writeTextFile(
        join(zodOutputDir, 'schemas', 'variants', 'input', 'Cycle.input.ts'),
        "import { z } from 'zod';\nexport const CycleInputSchema = z.object({ id: z.number() });\n",
      ),
      Deno.writeTextFile(
        join(zodOutputDir, 'schemas', 'objects', 'CycleUpdateInput.schema.ts'),
        "import { z } from 'zod';\nexport const CycleUpdateInputObjectZodSchema = z.object({ id: z.number().optional() });\n",
      ),
      Deno.writeTextFile(
        join(compileRoot, 'contracts', 'versions', 'v1', 'cycles.contract.ts'),
        cycleContract,
      ),
      Deno.writeTextFile(
        join(compileRoot, 'stubs', 'orpc.ts'),
        'export const implement = <T>(value: T): T => value;\n',
      ),
      Deno.writeTextFile(
        join(compileRoot, 'stubs', 'contracts.ts'),
        'export const baseContract = { route: (_route: unknown) => ({ output: <T>(schema: T): T => schema }) };\n',
      ),
      Deno.writeTextFile(
        join(compileRoot, 'stubs', 'crud.ts'),
        'export function createCrudContract(_options: unknown): Record<string, unknown> { return {}; }\n',
      ),
    ]);
    await writeCrudZodBarrel({ zodOutputDir, modelName: 'Cycle' });

    const workspace = JSON.parse(generateDenoJson({
      name: 'test-project',
      appName: 'dashboard',
      workspaceMembers: ['contracts', 'database/postgres'],
      importMode: 'jsr',
      dbEngines: ['postgres'],
    }));
    await Deno.writeTextFile(
      join(compileRoot, 'deno.json'),
      JSON.stringify({
        imports: {
          '@database/zod': workspace.imports['@database/zod'],
          '@orpc/server': './stubs/orpc.ts',
          '@netscript/contracts': './stubs/contracts.ts',
          '@netscript/contracts/crud': './stubs/crud.ts',
          zod: 'npm:zod@^4.3.6',
        },
      }),
    );

    const checked = await new Deno.Command(Deno.execPath(), {
      cwd: compileRoot,
      args: ['check', 'contracts/versions/v1/cycles.contract.ts'],
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assertEquals(checked.code, 0, new TextDecoder().decode(checked.stderr));
  } finally {
    await Deno.remove(compileRoot, { recursive: true });
  }
});

Deno.test('shared contract scaffolder canonicalizes the service contract and version aggregate', async () => {
  const { fs, scaffolder, templateAdapter } = createHarness();
  await fs.createDir('/project/contracts/versions/v1');
  const formattedPaths: string[] = [];
  const formatter: GeneratedSourceFormatterPort = {
    formatContent: (path, content) => {
      formattedPaths.push(path);
      return Promise.resolve(`// canonical\n${content}`);
    },
    formatFiles: () => Promise.resolve({ code: 0, stdout: '', stderr: '' }),
  };
  const contractScaffolder = createContractScaffolder({
    scaffolder,
    templateAdapter,
    templateRegistry: new DefaultContractTemplateRegistry(),
    versionRegistry: new ContractVersionRegistry(fs, formatter),
    formatter,
  });

  await contractScaffolder.addServiceContract(
    {
      projectName: 'my-app',
      targetPath: '/project',
      importMode: 'jsr',
      force: false,
    },
    { serviceName: 'payments', version: DEFAULT_CONTRACT_VERSION },
  );

  assertEquals(formattedPaths, [
    '/project/contracts/versions/v1/payments.contract.ts',
    '/project/contracts/versions/v1/mod.ts',
  ]);
  assertEquals(
    (await fs.readFile('/project/contracts/versions/v1/payments.contract.ts')).startsWith(
      '// canonical\n',
    ),
    true,
  );
  assertEquals(
    (await fs.readFile('/project/contracts/versions/v1/mod.ts')).startsWith('// canonical\n'),
    true,
  );
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

  const allocation = await new PortAllocator(fs).allocate('/project', 'shop', 'orders');
  assertEquals(allocation.source, 'auto');
  assertEquals(allocation.port >= 49_152, true);
});

Deno.test('PortAllocator rejects out-of-range and duplicate requested ports', async () => {
  const { fs } = createHarness();
  await fs.writeFile(
    '/project/appsettings.json',
    JSON.stringify({ NetScript: { Services: { users: { Port: 3000 } } } }),
  );

  await assertRejects(
    () => new PortAllocator(fs).allocate('/project', 'shop', 'orders', 1000),
    ScaffoldValidationError,
  );
  await assertRejects(
    () => new PortAllocator(fs).allocate('/project', 'shop', 'orders', 3000),
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
