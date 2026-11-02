import { dirname, join } from '@std/path';
import type { InitPipelineContext } from '../../application/scaffold/context.ts';
import type { ValidatedInitOptions } from '../../domain/scaffold/scaffold-options.ts';
import type { ScaffoldResult } from '../../domain/core-types.ts';
import { TEMPLATE_KEYS } from '../../assets/manifest.ts';
import { netscriptJsrSpecifier } from '../../constants/jsr-specifiers.ts';
import { readTemplateAssetSync, renderTemplateAssetSync } from '../templates/template-asset.ts';
import { northwindVocabulary, showcaseFiles } from './showcase-files.ts';

/** Compose the opt-in commerce recipe after the unchanged default scaffold phases. */
export async function scaffoldShowcase(
  context: InitPipelineContext,
  options: ValidatedInitOptions,
): Promise<ScaffoldResult> {
  const start = performance.now();
  const filesCreated: string[] = [];
  const root = options.targetPath;
  const app = `apps/${options.appName}`;
  const write = async (path: string, source: string) => {
    const absolute = join(root, path);
    await context.scaffolder.createDir(dirname(absolute));
    await context.scaffolder.writeFile(absolute, source, true);
    filesCreated.push(absolute);
  };
  const read = (path: string) => context.fs.readFile(join(root, path));
  const patch = async (path: string, transform: (source: string) => string) =>
    write(path, transform(await read(path)));
  const variables = {
    appName: options.appName,
    projectName: options.name,
    dbEngine: options.dbEngine,
  };
  for (const [path, template] of showcaseFiles(options.appName, options.dbEngine)) {
    await write(path, renderTemplateAssetSync(template, variables));
  }
  await patch(
    `database/${options.dbEngine}/schema/schema.prisma`,
    (source) =>
      source.replace(
        'model Order {',
        'model Order {\n  customerId Int?\n  customer Customer? @relation(fields: [customerId], references: [id])\n  lines OrderLine[]',
      ) + readTemplateAssetSync(TEMPLATE_KEYS.showcaseSchema),
  );
  const seedPath = `database/${options.dbEngine}/scripts/seed.ts`;
  // Keep the canonical date/status sample and its durable worker handoff intact.
  await patch(
    seedPath,
    (source) =>
      source.replaceAll('`REC-${FIRST_REFERENCE - index}`', '`SO-${FIRST_REFERENCE - index}`')
        .replace(
          'if (import.meta.main) {',
          "import { seedCommerce } from './seed-commerce.ts';\n\nif (import.meta.main) {",
        )
        .concat('\nif (import.meta.main) await seedCommerce();\n'),
  );
  await patch(
    'services/orders/src/router.ts',
    (source) =>
      "import { commerce } from './commerce.ts';\n" +
      source.replace('    v1: {', '    v1: {\n      commerce,'),
  );
  await patch(
    'contracts/versions/v1/orders.contract.ts',
    (source) =>
      source.replace(
        '.omit({ reference: true })',
        '.omit({ reference: true, customer: true, lines: true })',
      ),
  );
  const rootConfig = JSON.parse(await read('deno.json'));
  // Match the existing @netscript/fresh and @netscript/ai dependency pins.
  rootConfig.imports['@tanstack/ai'] = 'npm:@tanstack/ai@0.68.0';
  rootConfig.imports['@durable-streams/client'] = 'npm:@durable-streams/client@0.2.7';
  rootConfig.imports['@durable-streams/tanstack-ai-transport'] =
    'npm:@durable-streams/tanstack-ai-transport@0.0.10';
  rootConfig.tasks['showcase:setup'] = 'deno run -A --unstable-kv showcase/setup.ts';
  rootConfig.tasks['showcase:cli'] = options.importMode === 'local'
    ? 'deno run -A packages/cli/bin/netscript-dev.ts'
    : `deno run -A ${netscriptJsrSpecifier('cli')}`;
  await write('deno.json', JSON.stringify(rootConfig, null, 2) + '\n');
  await patch(
    `${app}/client.ts`,
    (source) => source + "\nimport './assets/northwind.css';\nimport './assets/showcase-ai.css';\n",
  );
  const uiPaths = [
    'navigation.ts',
    'lib/scaffold-contract.ts',
    'lib/scaffold-capabilities.ts',
    'lib/scaffold-plugin-capabilities.ts',
    'routes/_layout.tsx',
    'routes/(_components)/dashboard-view.tsx',
    'routes/sign-in.tsx',
    'islands/RecordTable.tsx',
    'islands/WorkspaceCommands.tsx',
  ];
  for (const path of uiPaths) {
    await patch(`${app}/${path}`, (source) =>
      northwindVocabulary(source)
        .replaceAll(`</span>${options.name}`, '</span>Northwind')
        .replace(`label: '${options.name}'`, "label: 'Northwind'"));
  }
  await patch(
    `${app}/routes/examples/orders/[id].tsx`,
    (source) =>
      "import { Badge, Button, PageHeader } from '@app/components/ui/mod.ts';\n" + source
        .replace("<main class='ns-shell ns-section ns-stack'", "<main class='workspace-page'")
        .replace(
          '<h1>Order {id}</h1>',
          `<PageHeader class='workspace-heading'><PageHeader.Layout><PageHeader.Main><PageHeader.Intro><h1>Typed route reference</h1><p>A dynamic URL parameter, separate from your commerce orders.</p></PageHeader.Intro></PageHeader.Main><PageHeader.Actions><Button type='link' variant='outline' href='/orders'>View live orders</Button></PageHeader.Actions></PageHeader.Layout></PageHeader><section class='workspace-section'><header class='workspace-section-heading'><h2>Route binding</h2><Badge variant='muted'>Reference</Badge></header><p class='workspace-muted'>Current route parameter</p><p><code>{id}</code></p><p>This page demonstrates a typed route. Customer details, line items and fulfilment are available in Orders.</p></section>`,
        )
        .replace('>Current order</a>', '>Open this route ↗</a>'),
  );
  await patch(
    `${app}/routes/examples/(_components)/crud-view.tsx`,
    (source) =>
      source.replace(
        "class='ns-shell ns-section ns-stack ns-stack--lg'",
        "class='northwind-directory ns-shell ns-section ns-stack ns-stack--lg'",
      ),
  );
  await patch(
    `${app}/routes/examples/telemetry/(_components)/telemetry-view.tsx`,
    (source) =>
      source.replace('import { Button, Card }', 'import { Alert, Button, Card }')
        .replace(
          /<div class='rounded-lg border border-red-500\/30[^']*'>\s*Dashboard API error: \{data.error\}\s*<\/div>/,
          "<Alert variant='destructive' title='Traces unavailable' description={<>Dashboard API error: {data.error}</>} />",
        ),
  );
  for (const file of ['index.tsx', '[id].tsx']) {
    let source = northwindVocabulary(await read(`${app}/routes/records/${file}`));
    if (file === '[id].tsx') source = extendOrderDetail(source);
    await write(`${app}/routes/orders/${file}`, source);
    await context.fs.remove(join(root, app, 'routes/records', file));
  }
  await patch(`${app}/router.ts`, (source) => source.replaceAll('routes.records', 'routes.orders'));
  await patch(
    `${app}/navigation.ts`,
    (source) =>
      source.replace(
        '  { href: appRoutes.settings.href()',
        "  { href: '/customers', label: 'Customers', match: 'exact' },\n  { href: '/products', label: 'Products', match: 'exact' },\n  { href: '/ai', label: 'Assistant', match: 'exact' },\n  { href: appRoutes.settings.href()",
      ),
  );
  for (const [kind, title] of [['customers', 'Customers'], ['products', 'Products']] as const) {
    await write(
      `${app}/routes/${kind}.tsx`,
      renderTemplateAssetSync(TEMPLATE_KEYS.showcaseCatalogueRoute, {
        catalogueKind: kind,
        catalogueTitle: title,
      }),
    );
  }
  for (const action of ['fulfil', 'webhook']) {
    await write(
      `${app}/routes/orders/[id]/${action}.ts`,
      renderTemplateAssetSync(TEMPLATE_KEYS.showcaseAction, {
        webhook: String(action === 'webhook'),
      }),
    );
  }
  await patch(
    'README.md',
    (source) =>
      '# Northwind commerce showcase\n\nRun `deno task showcase:setup`, then `deno task aspire:start`.\nRead [the complete showcase walkthrough](showcase/README.md).\n\n' +
      source,
  );
  if (!options.dryRun) {
    // Load Vite tooling only when emitting this preset, preserving ordinary CLI permissions.
    const { writeFreshRouteManifestSync } = await import('../scaffold/fresh-route-manifest.ts');
    writeFreshRouteManifestSync(join(root, app));
  }
  return {
    filesCreated,
    filesSkipped: [],
    directoriesCreated: [],
    totalOperations: filesCreated.length,
    durationMs: performance.now() - start,
  };
}

function extendOrderDetail(source: string): string {
  return "import { OrderWorkflow } from '../(_components)/order-workflow.tsx';\nimport { loadOrderWorkflow, type OrderWorkflowData } from '@app/lib/northwind.ts';\n" +
    source
      .replace('({ detail, locale }:', '({ detail, locale, workflow }:')
      .replace(
        'readonly locale?: string })',
        'readonly locale?: string; readonly workflow?: OrderWorkflowData })',
      )
      .replace(
        '</section></DetailLayout.Main>',
        '</section><OrderWorkflow data={workflow} orderId={record.id} status={record.status} /></DetailLayout.Main>',
      )
      .replace(
        'detail: await loadScaffoldRecord(ctx.req, ctx.path.id),',
        'detail: await loadScaffoldRecord(ctx.req, ctx.path.id), workflow: await loadOrderWorkflow(ctx.req, ctx.path.id),',
      );
}
