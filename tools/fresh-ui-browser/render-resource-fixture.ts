/** Render the same resource-slice island and loader used by the scaffold runtime suite. */
import { join } from '@std/path';
import { MemoryFileSystemAdapter } from '../../packages/cli/src/kernel/adapters/scaffold/memory-fs.ts';
import { StringTemplateAdapter } from '../../packages/cli/src/kernel/adapters/scaffold/template-adapter.ts';
import { DenoProcess } from '../../packages/cli/src/kernel/adapters/runtime/process/deno-process.ts';
import { DenoGeneratedSourceFormatter } from '../../packages/cli/src/kernel/adapters/runtime/process/deno-generated-source-formatter.ts';
import {
  createResourceSliceTemplateRenderer,
  loadResourceSliceTemplateAssets,
} from '../../packages/cli/src/kernel/adapters/templates/scaffold-template-assets.ts';
import { normalizeResourceSliceInput } from '../../packages/cli/src/kernel/application/resource-slice/resource-slice-contract.ts';
import { planResourceSlice } from '../../packages/cli/src/kernel/application/resource-slice/plan-resource-slice.ts';
import { renderResourceSlice } from '../../packages/cli/src/kernel/application/resource-slice/render-resource-slice.ts';

const app = Deno.args[0];
if (!app) throw new Error('Generated app root is required');
const input = normalizeResourceSliceInput({
  resource: 'people',
  app: 'dashboard',
  route: '/people',
  variants: ['partial'],
  client: {
    serviceName: 'users',
    moduleSpecifier: '@app/browser-fixtures/resource/users-query.ts',
    queryFactoryName: 'usersQueries',
  },
  procedure: { path: ['list'], kind: 'query' },
});
const leaves = await renderResourceSlice(
  planResourceSlice(input),
  await loadResourceSliceTemplateAssets(),
  createResourceSliceTemplateRenderer(
    new StringTemplateAdapter(new MemoryFileSystemAdapter()),
    new DenoGeneratedSourceFormatter(new DenoProcess()),
  ),
);
for (const leaf of leaves.filter((leaf) => leaf.role === 'island' || leaf.role === 'loaders')) {
  const path = join(app, 'browser-fixtures/resource', leaf.path);
  await Deno.mkdir(join(path, '..'), { recursive: true });
  await Deno.writeTextFile(path, leaf.content);
}
await Deno.copyFile(
  new URL('./fixtures/users-query.ts.template', import.meta.url),
  join(app, 'browser-fixtures/resource/users-query.ts'),
);
await Deno.copyFile(
  new URL('./fixtures/resource-query.tsx.template', import.meta.url),
  join(app, 'browser-fixtures/test-resource-query.tsx'),
);
