import { assertEquals, assertFalse, assertStringIncludes } from '@std/assert';
import { Scaffolder } from '../scaffold/scaffolder.ts';
import { MemoryFileSystemAdapter } from '../scaffold/memory-fs.ts';
import { StringTemplateAdapter } from '../scaffold/template-adapter.ts';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../application/registries/template-registry.ts';
import { ServiceClientScaffolder } from './client-scaffolder.ts';
import type { GeneratedSourceFormatterPort } from '../../ports/generated-source-formatter-port.ts';

const formatter: GeneratedSourceFormatterPort = {
  formatContents: (files) => Promise.resolve(files.map((file) => file.content)),
  formatContent: (_path, content) => Promise.resolve(`// canonical\n${content}`),
  formatFiles: () => Promise.resolve({ code: 0, stdout: '', stderr: '' }),
};

Deno.test('service client scaffolder mirrors the typed SDK and query template', async () => {
  await DEFAULT_TEMPLATE_REGISTRY.hydrate();
  const fs = new MemoryFileSystemAdapter();
  const template = new StringTemplateAdapter(fs);
  await fs.writeFile(
    '/app/deno.json',
    JSON.stringify({
      workspace: ['./apps/dashboard'],
    }),
  );
  await fs.writeFile(
    '/app/contracts/versions/v1/orders.contract.ts',
    'export const OrdersContractV1 = { list: {} };\n',
  );
  const path = await new ServiceClientScaffolder(new Scaffolder(template, fs), fs, formatter)
    .scaffold(
      '/app',
      'shop',
      'orders',
      false,
    );
  const source = await fs.readFile(path);
  assertEquals(path, '/app/apps/dashboard/lib/orders.ts');
  assertEquals(source.startsWith('// canonical\n'), true);
  assertStringIncludes(source, 'export const ordersContract = OrdersContractV1;');
  assertStringIncludes(source, 'export const ordersClient = createServiceClient');
  assertStringIncludes(source, 'export const ordersQueries = createQueryFactories');
  assertStringIncludes(source, 'orders: {');
  assertStringIncludes(
    source,
    '{ queryKey: ordersQueries.list.clientKey() } as const',
  );
  assertStringIncludes(source, "from '@shop/contracts'");
  assertStringIncludes(source, "export const ordersName = 'orders';");
  assertFalse(source.includes('exampleService'));
});

Deno.test('generated service client carries a banner naming the generators that depend on it', async () => {
  await DEFAULT_TEMPLATE_REGISTRY.hydrate();
  const fs = new MemoryFileSystemAdapter();
  const template = new StringTemplateAdapter(fs);
  await fs.writeFile('/app/deno.json', JSON.stringify({ workspace: ['./apps/dashboard'] }));
  await fs.writeFile(
    '/app/contracts/versions/v1/orders.contract.ts',
    'export const OrdersContractV1 = { list: {} };\n',
  );
  const path = await new ServiceClientScaffolder(new Scaffolder(template, fs), fs, formatter)
    .scaffold('/app', 'shop', 'orders', false);
  const banner = (await fs.readFile(path)).split('\nimport ')[0];

  assertStringIncludes(banner, "// Query client for the 'orders' service.");
  assertStringIncludes(banner, '`netscript ui add`');
  assertStringIncludes(banner, '`netscript generate resource`');
  assertStringIncludes(banner, 'deleting it disables those generators.');
});
