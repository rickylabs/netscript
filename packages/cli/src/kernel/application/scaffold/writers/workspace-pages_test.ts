import { JsrImportResolver } from '../../../../public/adapters/jsr-import-resolver.ts';
import { generateAppDenoJson } from '../../../adapters/templates/app/generate-app-deno-json.ts';
import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { renderTemplate } from '../../../adapters/scaffold/template-adapter.ts';
import { readTemplateAssetSync } from '../../../adapters/templates/template-asset.ts';
import { TEMPLATE_KEYS } from '../../../assets/manifest.ts';
import { createServiceAddCommand } from '../../../../public/features/services/add/add-service-command.ts';

const variables = {
  name: 'acme',
  appName: 'portal',
  serviceName: 'team-members',
  modelName: 'TeamMember',
  hasService: 'false',
  serviceExampleHref: 'undefined',
  serviceExampleEntries: '',
  serviceResourceRouteAlias: '',
  serviceExampleRouteReference: 'routes.examples.$route',
};

Deno.test('#2566: home uses shared generated overview without fabricated CRUD or theme copy', () => {
  const home = readTemplateAssetSync(TEMPLATE_KEYS.appRoutesComponentsHomeView);
  const dashboard = readTemplateAssetSync(TEMPLATE_KEYS.appRoutesComponentsDashboardView);
  const navigation = readTemplateAssetSync(TEMPLATE_KEYS.appNavigation);
  assertStringIncludes(home, "from './dashboard-view.tsx'");
  assertStringIncludes(dashboard, 'appTheme().label');
  assertStringIncludes(dashboard, 'generatedPageCount()');
  assertStringIncludes(navigation, 'walk(routePatterns)');
  assertStringIncludes(navigation, "import.meta.env.MODE !== 'development'");
  for (
    const phrase of ['NS One', 'maintainer scaffold', 'CRUD', 'Seeded operational rows', '612ms']
  ) {
    assertEquals(dashboard.includes(phrase), false, phrase);
  }
});

Deno.test('workspace templates render custom names and never leave template variables', () => {
  for (
    const key of [
      TEMPLATE_KEYS.appScaffoldContract,
      TEMPLATE_KEYS.appScaffoldCapabilities,
      TEMPLATE_KEYS.appScaffoldRecords,
      TEMPLATE_KEYS.appRecordsRoute,
      TEMPLATE_KEYS.appRecordRoute,
      TEMPLATE_KEYS.appSettingsRoute,
      TEMPLATE_KEYS.appSignInRoute,
      TEMPLATE_KEYS.appWorkspaceCommands,
      TEMPLATE_KEYS.appSettingsForm,
      TEMPLATE_KEYS.appRoutesExamplesIndex,
    ]
  ) {
    const output = renderTemplate(readTemplateAssetSync(key), variables);
    assertEquals(/\{\{\s*\w+/.test(output), false, key);
    assertEquals(output.includes('netscript plugin add'), false, key);
  }
  const contract = renderTemplate(
    readTemplateAssetSync(TEMPLATE_KEYS.appScaffoldContract),
    variables,
  );
  assertStringIncludes(contract, 'netscript service add --name team-members --with-client');
  assertStringIncludes(contract, 'netscript plugin install auth --name auth');
  assertStringIncludes(contract, "'installed-unwired'");
});

Deno.test('no-service scaffold loader has no missing contract imports or static business records', () => {
  const loader = readTemplateAssetSync(TEMPLATE_KEYS.appScaffoldRecords);
  assertEquals(loader.includes('/contracts'), false);
  assertStringIncludes(loader, 'readScaffoldCapabilities(');
  assertStringIncludes(loader, 'rows: []');
  const crud = readTemplateAssetSync(TEMPLATE_KEYS.appRoutesExamplesCrud);
  assertStringIncludes(crud, 'records: []');
  assertEquals(crud.includes('Acme Robotics'), false);
  for (const hasService of ['false', 'true']) {
    const serviceExampleHref = hasService === 'true'
      ? 'appRoutes.serviceExample.href()'
      : 'undefined';
    const route = renderTemplate(crud, { ...variables, hasService, serviceExampleHref });
    assertStringIncludes(
      route,
      `serviceHref: ${serviceExampleHref}`,
    );
    assertStringIncludes(route, 'recordsHref: appRoutes.records.href()');
  }
  const crudView = readTemplateAssetSync(TEMPLATE_KEYS.appRoutesExamplesComponentsCrudView);
  assertEquals(crudView.includes('/examples/'), false);
  assertStringIncludes(crudView, 'href={serviceHref}');
  assertStringIncludes(crudView, 'Open Records to connect a service.');
  const examples = renderTemplate(
    readTemplateAssetSync(TEMPLATE_KEYS.appRoutesExamplesIndex),
    variables,
  );
  assertStringIncludes(examples, 'canonicalHref: undefined');
  assertEquals(examples.includes('true ?'), false);
  assertEquals(examples.includes('false ?'), false);
  assertEquals(examples.includes('Placeholder'), false);
});

Deno.test('retains the existing runtime reference routes and home design links', () => {
  const dashboard = readTemplateAssetSync(TEMPLATE_KEYS.appRoutesComponentsDashboardView);
  assertStringIncludes(dashboard, 'appRoutes.design.href()');
  assertStringIncludes(dashboard, 'appRoutes.designComposition.href()');
  const order = readTemplateAssetSync(TEMPLATE_KEYS.appRoutesExamplesOrdersId);
  assertStringIncludes(order, 'data-order-id={id}');
  assertStringIncludes(order, 'href={selfHref}');
  const command = readTemplateAssetSync(TEMPLATE_KEYS.appWorkspaceCommands);
  assertStringIncludes(
    command,
    "import { CommandPalette } from '@app/components/ui/command-palette.tsx'",
  );
  assertStringIncludes(command, 'event.metaKey || event.ctrlKey');
});

Deno.test('service empty-state flags remain supported by the real command parser', () => {
  // Inspect command grammar without invoking filesystem/network dependencies.
  const command = createServiceAddCommand({
    addServiceDependencies: {} as Parameters<
      typeof createServiceAddCommand
    >[0]['addServiceDependencies'],
    resolveProjectRoot: () => Promise.resolve('.'),
  });
  assert(command.getOption('name'));
  assert(command.getOption('with-client'));
});

Deno.test('capability read contains missing/invalid configuration errors on the server', async () => {
  const root = await Deno.makeTempDir();
  const contract = renderTemplate(
    readTemplateAssetSync(TEMPLATE_KEYS.appScaffoldContract),
    variables,
  );
  const contractUrl = `data:application/typescript,${encodeURIComponent(contract)}`;
  const source = renderTemplate(
    readTemplateAssetSync(TEMPLATE_KEYS.appScaffoldCapabilities),
    variables,
  )
    .replace(
      "import { findWorkspaceRoot } from '@netscript/config';",
      `const findWorkspaceRoot = () => Promise.resolve(${JSON.stringify(root)});`,
    )
    .replace(
      "import { probeScaffoldPlugin } from './scaffold-plugin-capabilities.ts';",
      "const probeScaffoldPlugin = async () => ({state: 'ready' as const, description: 'ready'});",
    )
    .replace("'./scaffold-contract.ts'", JSON.stringify(contractUrl))
    .replace("'zod'", JSON.stringify(import.meta.resolve('zod')));
  const module = await import(`data:application/typescript,${encodeURIComponent(source)}`);
  const originalError = console.error;
  const errors: unknown[][] = [];
  console.error = (...args: unknown[]) => {
    errors.push(args);
  };
  try {
    for (
      const contents of [undefined, '{invalid-secret-content', '{"NetScript":{"Services":42}}']
    ) {
      if (contents !== undefined) await Deno.writeTextFile(`${root}/appsettings.json`, contents);
      const capabilities = await module.readScaffoldCapabilities();
      assertEquals(capabilities.map((entry: { id: string }) => entry.id), [
        'service',
        'auth',
        'workers',
        'streams',
        'ai',
      ]);
      for (const capability of capabilities) {
        assertEquals(capability.state, 'unavailable');
        assertEquals(capability.command, undefined);
      }
      assertEquals(JSON.stringify(capabilities).includes(root), false);
      assertEquals(JSON.stringify(capabilities).includes('invalid-secret-content'), false);
    }
    assertEquals(errors.length, 3);
  } finally {
    console.error = originalError;
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('scaffold worker reader and official plugin share the release-pinned contract version', async () => {
  const core = JSON.parse(
    await Deno.readTextFile(
      new URL('../../../../../../plugin-workers-core/deno.json', import.meta.url),
    ),
  );
  const plugin = JSON.parse(
    await Deno.readTextFile(
      new URL('../../../../../../../plugins/workers/scaffold.plugin.json', import.meta.url),
    ),
  );
  const app = JSON.parse(
    generateAppDenoJson({
      projectName: 'fixture',
      appName: 'portal',
      importMode: 'jsr',
      jsrResolver: new JsrImportResolver(),
    }),
  );
  assertEquals(core.version, plugin.version);
  assertEquals(
    app.imports[`${core.name}/contracts/v1`],
    `jsr:${core.name}@${core.version}/contracts/v1`,
  );
});
