import { assert, assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import { generateAppTsConfig } from '../../../adapters/templates/app/generate-app-tsconfig.ts';
import { MemoryFileSystemAdapter } from '../../../adapters/scaffold/memory-fs.ts';
import { DenoProcess } from '../../../adapters/runtime/process/deno-process.ts';
import { StringTemplateAdapter } from '../../../adapters/scaffold/template-adapter.ts';
import {
  createResourceSliceTemplateRenderer,
  loadResourceSliceTemplateAssets,
} from '../../../adapters/templates/scaffold-template-assets.ts';
import { DenoGeneratedSourceFormatter } from '../../../adapters/runtime/process/deno-generated-source-formatter.ts';
import { planResourceSlice } from '../../resource-slice/plan-resource-slice.ts';
import { renderResourceSlice } from '../../resource-slice/render-resource-slice.ts';
import { normalizeResourceSliceInput } from '../../resource-slice/resource-slice-contract.ts';
import {
  planExampleServiceResourceSlice,
  renderExampleServiceResourceSlice,
} from './write-example-service-app-files.ts';
import { emitSelectedBackendImports } from './write-app-files.ts';

const APP_VARS = {
  name: 'test-project',
  appName: 'dashboard',
  appPort: '8010',
  serviceName: 'team-members',
  modelName: 'TeamMember',
  serviceResourceRouteAlias: 'teamMembers: generatedRoutes.examples.teamMembers.$route,\n  ',
  serviceExampleRouteReference: 'routes.examples.teamMembers.$route',
} as const;

Deno.test('selected cache backend is carried into the generated app runtime', () => {
  const emitted = emitSelectedBackendImports('export const app = {};\n', {
    cache: true,
  });

  assertStringIncludes(emitted, "import '@netscript/sdk/cache';");
  assertEquals(emitSelectedBackendImports(emitted, { cache: true }), emitted);
});

Deno.test('cache registration import is omitted when cache is disabled', () => {
  const source = 'export const app = {};\n';
  assertEquals(emitSelectedBackendImports(source, { cache: false }), source);
});

Deno.test('app tsconfig is self-contained and Vite/Fresh compatible', () => {
  const result = JSON.parse(generateAppTsConfig());

  assertEquals(result.files, []);
  assert(!('extends' in result));
  assert(!('include' in result));
  assertEquals(result.compilerOptions, {
    allowImportingTsExtensions: true,
    jsx: 'react-jsx',
    jsxImportSource: 'preact',
    module: 'ESNext',
    moduleResolution: 'Bundler',
    noEmit: true,
  });
});

Deno.test('init preset and command-shaped planner render byte-identical canonical roles', async () => {
  const fs = new MemoryFileSystemAdapter();
  const renderer = new StringTemplateAdapter(fs);
  const process = new DenoProcess();
  const canonicalRenderer = createResourceSliceTemplateRenderer(
    renderer,
    new DenoGeneratedSourceFormatter(process),
  );
  const templates = await loadResourceSliceTemplateAssets();
  const initPlan = planExampleServiceResourceSlice(APP_VARS);
  const commandPlan = planResourceSlice(normalizeResourceSliceInput({
    resource: 'team-members',
    app: 'dashboard',
    route: '/examples/team-members',
    variants: ['form', 'partial'],
    client: {
      serviceName: 'team-members',
      moduleSpecifier: '@app/routes/examples/team-members/(_lib)/service-query.ts',
      queryFactoryName: 'teamMembersQueries',
    },
    procedure: { path: ['list'], kind: 'query' },
  }));
  const [initLeaves, commandLeaves] = await Promise.all([
    renderExampleServiceResourceSlice(
      { templateAdapter: renderer, process },
      APP_VARS,
      templates,
    ),
    renderResourceSlice(commandPlan, templates, canonicalRenderer),
  ]);

  assertEquals(initPlan.input.variants, ['core', 'form', 'partial']);
  assertEquals(
    Object.fromEntries(initLeaves.map((leaf) => [leaf.role, leaf.content])),
    Object.fromEntries(commandLeaves.map((leaf) => [leaf.role, leaf.content])),
  );
});

Deno.test('Fresh derivation follows route emission and no manual seed remains', async () => {
  const source = await Deno.readTextFile(
    new URL('./write-app-files.ts', import.meta.url),
  );
  const routeEmission = source.indexOf('await writeExampleServiceAppFiles({');
  const freshDerivation = source.indexOf('writeFreshRouteManifestSync(appDir)');

  assert(routeEmission >= 0, 'expected service route emission');
  assert(
    freshDerivation > routeEmission,
    'Fresh derivation must follow every example route',
  );
  assertEquals(source.includes('generateRouteManifestSeed'), false);
  assertEquals(source.includes('generateRoutesSeed'), false);
});
