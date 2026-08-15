import { assertEquals, assertFalse, assertStringIncludes } from '@std/assert';
import { Scaffolder } from '../scaffold/scaffolder.ts';
import { MemoryFileSystemAdapter } from '../scaffold/memory-fs.ts';
import { StringTemplateAdapter } from '../scaffold/template-adapter.ts';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../application/registries/template-registry.ts';
import { ServiceClientScaffolder } from './client-scaffolder.ts';

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
  const path = await new ServiceClientScaffolder(new Scaffolder(template, fs), fs).scaffold(
    '/app',
    'shop',
    'orders',
    false,
  );
  const source = await fs.readFile(path);
  assertEquals(path, '/app/apps/dashboard/lib/orders.ts');
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
