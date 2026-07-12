import { assertStringIncludes } from '@std/assert';
import { Scaffolder } from '../scaffold/scaffolder.ts';
import { MemoryFileSystemAdapter } from '../scaffold/memory-fs.ts';
import { StringTemplateAdapter } from '../scaffold/template-adapter.ts';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../application/registries/template-registry.ts';
import { ServiceClientScaffolder } from './client-scaffolder.ts';

Deno.test('service client scaffolder mirrors the typed SDK and query template', async () => {
  await DEFAULT_TEMPLATE_REGISTRY.hydrate();
  const fs = new MemoryFileSystemAdapter();
  const template = new StringTemplateAdapter(fs);
  await fs.writeFile('/app/deno.json', JSON.stringify({
    workspace: ['./apps/dashboard'],
  }));
  const path = await new ServiceClientScaffolder(new Scaffolder(template, fs), fs).scaffold(
    '/app',
    'shop',
    'orders',
    false,
  );
  const source = await fs.readFile(path);
  assertStringIncludes(source, 'createServiceClient<typeof exampleServiceContract>');
  assertStringIncludes(source, "from '@shop/contracts'");
  assertStringIncludes(source, "exampleServiceName = 'orders'");
});
