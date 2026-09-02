import { assertEquals } from '@std/assert';
import { MemoryFileSystemAdapter } from '../../../adapters/scaffold/memory-fs.ts';
import { DenoProcess } from '../../../adapters/runtime/process/deno-process.ts';
import { StringTemplateAdapter } from '../../../adapters/scaffold/template-adapter.ts';
import { loadResourceSliceTemplateAssets } from '../../../adapters/templates/scaffold-template-assets.ts';
import {
  planExampleServiceResourceSlice,
  renderExampleServiceResourceSlice,
} from './write-example-service-app-files.ts';

const APP_VARS = {
  name: 'example',
  appName: 'dashboard',
  appPort: '8000',
  serviceName: 'team-members',
  modelName: 'TeamMember',
  serviceResourceRouteAlias: 'teamMembers: generatedRoutes.examples.teamMembers.$route,\n  ',
  serviceExampleRouteReference: 'routes.examples.teamMembers.$route',
} as const;

Deno.test('example writer preset owns exactly the form and partial canonical leaves', async () => {
  const fs = new MemoryFileSystemAdapter();
  const leaves = await renderExampleServiceResourceSlice(
    {
      templateAdapter: new StringTemplateAdapter(fs),
      process: new DenoProcess(),
    },
    APP_VARS,
    await loadResourceSliceTemplateAssets(),
  );

  assertEquals(planExampleServiceResourceSlice(APP_VARS).input.variants, [
    'core',
    'form',
    'partial',
  ]);
  assertEquals(leaves.map((leaf) => leaf.role).sort(), [
    'form-component',
    'form-contract',
    'island',
    'layout',
    'loaders',
    'page',
    'partial-route',
    'route-contract',
    'summary-component',
    'view',
  ]);
  assertEquals(
    leaves.every((leaf) => leaf.content.startsWith('// @netscript/resource-slice ')),
    true,
  );
});
