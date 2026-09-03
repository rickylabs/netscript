/**
 * @module templates/app/route-templates_test
 */

import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assert, assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import { join } from 'jsr:@std/path@^1';
import { writeFreshRouteManifestSync } from '../../adapters/scaffold/fresh-route-manifest.ts';
import { readTemplateAsset } from '../../adapters/templates/template-asset.ts';
import { DenoProcess } from '../../adapters/runtime/process/deno-process.ts';
import { renderExampleServiceResourceSlice } from '../../application/scaffold/writers/write-example-service-app-files.ts';
import { TEMPLATE_KEYS, TEMPLATE_MANIFEST } from '../../assets/manifest.ts';
import {
  appAppTemplate,
  appClientTemplate,
  appCrudExampleRouteTemplate,
  appCrudExampleViewTemplate,
  appDashboardRouteTemplate,
  appDashboardViewTemplate,
  appDesignComponentsRouteTemplate,
  appDesignComponentsViewTemplate,
  appDesignCompositionRouteTemplate,
  appDesignCompositionViewTemplate,
  appDesignCssTemplate,
  appDesignFloatingSurfaceDemoTemplate,
  appDesignIndexRouteTemplate,
  appDesignLayoutTemplate,
  appDesignRegistryTemplate,
  appDesignTokenClipboardTemplate,
  appDesignTokensLibTemplate,
  appDesignTokensRouteTemplate,
  appDesignTokensViewTemplate,
  appExampleServiceQueryTemplate,
  appExamplesIndexRouteTemplate,
  appExamplesViewTemplate,
  appHealthRouteTemplate,
  appHealthSharedTemplate,
  appHealthViewTemplate,
  appHomeViewTemplate,
  appIndexRouteTemplate,
  appLayoutTemplate,
  appOrderExampleRouteTemplate,
  appRouterTemplate,
  appTelemetryExampleSharedTemplate,
  appUtilsTemplate,
  makeAdapter,
  resourceSliceTemplates,
  SAMPLE_APP_VARS,
  serviceContractTemplate,
  serviceV1RouterTemplate,
} from './app-template-test-support.ts';

function directAppRouteTargets(source: string): ReadonlyMap<string, string> {
  const start = source.indexOf('export const appRoutes = {');
  const end = source.indexOf('\n} as const;', start);
  assert(start >= 0 && end > start, 'rendered router must contain appRoutes');

  const targets = new Map<string, string>();
  const body = source.slice(start, end);
  for (
    const match of body.matchAll(/^[ ]{2}([A-Za-z][A-Za-z0-9]*): ([^,\n]+),$/gm)
  ) {
    targets.set(match[1], match[2]);
  }
  return targets;
}

function assertUniqueDirectAppRouteTargets(source: string): void {
  const owners = new Map<string, string>();
  for (const [key, target] of directAppRouteTargets(source)) {
    const owner = owners.get(target);
    assert(
      owner === undefined,
      `appRoutes.${key} duplicates appRoutes.${owner} target ${target}`,
    );
    owners.set(target, key);
  }
}

describe('app route template rendering', () => {
  it('telemetry example resolves env then running AppHost and renders unavailable guidance', () => {
    assertStringIncludes(
      appTelemetryExampleSharedTemplate,
      "import { AspirePsDashboardReader, resolveTelemetryEndpoint } from '@netscript/mcp';",
    );
    assertStringIncludes(
      appTelemetryExampleSharedTemplate,
      'NETSCRIPT_TELEMETRY_ENDPOINT',
    );
    assertStringIncludes(
      appTelemetryExampleSharedTemplate,
      'ASPIRE_DASHBOARD_PORT',
    );
    assertStringIncludes(
      appTelemetryExampleSharedTemplate,
      'resolved.httpsFallback ?? resolved.endpoint',
    );
    assertStringIncludes(
      appTelemetryExampleSharedTemplate,
      "source === 'default'",
    );
    assertStringIncludes(
      appTelemetryExampleSharedTemplate,
      'dashboard unavailable — run `aspire ps`',
    );
    assert(!appTelemetryExampleSharedTemplate.includes('18888'));
  });

  it('router.ts keeps the service alias on the Fresh-derived resource route', async () => {
    const adapter = makeAdapter();
    const output = await adapter.render(appRouterTemplate, SAMPLE_APP_VARS);
    assertStringIncludes(
      output,
      "import { createRouteReference } from '@netscript/fresh/route';",
    );
    assertStringIncludes(
      output,
      "import { routePatterns } from './.generated/manifest.ts';",
    );
    assertStringIncludes(
      output,
      "import { routes as generatedRoutes } from './.generated/routes.ts';",
    );
    assertStringIncludes(output, 'export { routePatterns };');
    assertStringIncludes(output, '...generatedRoutes,');
    assertStringIncludes(output, '...generatedRoutes.examples,');
    assert(!output.includes("createRouteReference('/examples/team-members'"));
    assertStringIncludes(output, 'export const appRoutes = {');
    assertStringIncludes(output, 'home: routes.$route,');
    assertStringIncludes(output, 'dashboard: routes.dashboard.$route,');
    assertStringIncludes(output, 'health: routes.health.$route,');
    assertStringIncludes(output, 'examples: routes.examples.$route,');
    assertStringIncludes(
      output,
      'teamMembers: generatedRoutes.examples.teamMembers.$route,',
    );
    assertStringIncludes(
      output,
      'serviceExample: routes.examples.teamMembers.$route,',
    );
    assertStringIncludes(output, 'crudExample: routes.examples.crud.$route,');
    assertStringIncludes(
      output,
      "designTokens: createRouteReference('/design/tokens'",
    );
    assertStringIncludes(output, "id: 'design.components'");
    assertStringIncludes(output, "id: 'design.composition'");
    assertStringIncludes(output, 'export const appRouter = {');
  });

  it('CRUD links resolve to the generated /examples/crud route', async () => {
    const adapter = makeAdapter();
    const router = await adapter.render(appRouterTemplate, SAMPLE_APP_VARS);
    const home = await adapter.render(appIndexRouteTemplate, SAMPLE_APP_VARS);
    const examples = await adapter.render(
      appExamplesIndexRouteTemplate,
      SAMPLE_APP_VARS,
    );
    const targets = directAppRouteTargets(router);

    assert(
      targets.get('crudExample') === 'routes.examples.crud.$route',
      'appRoutes.crudExample must target the generated CRUD route',
    );
    assertStringIncludes(home, 'href: appRoutes.crudExample.href()');
    assertStringIncludes(examples, 'href: appRoutes.crudExample.href()');
  });

  it('dynamic order route is registered, aliased, and linked from examples', async () => {
    const adapter = makeAdapter();
    const router = await adapter.render(appRouterTemplate, SAMPLE_APP_VARS);
    const examples = await adapter.render(
      appExamplesIndexRouteTemplate,
      SAMPLE_APP_VARS,
    );

    assert(
      TEMPLATE_MANIFEST.map((asset) => String(asset.path)).includes(
        'app/routes/examples/orders/[id].tsx.template',
      ),
      'dynamic order route template must be registered',
    );
    assertStringIncludes(
      router,
      'order: generatedRoutes.examples.orders.$id.$route,',
    );
    assertStringIncludes(
      examples,
      "appRoutes.order.href({ path: { id: 'order-42' } })",
    );
  });

  it('dynamic order route binds inferred ctx.path and derives its self href from that value', () => {
    const route = appOrderExampleRouteTemplate;

    assertStringIncludes(route, '.withRoute(appRoutes.order)');
    assertStringIncludes(route, 'const id: string = ctx.path.id;');
    assertStringIncludes(
      route,
      'const selfHref = ctx.route.href({ path: { id } });',
    );
    assertStringIncludes(route, 'data-order-id={id}');
    assertStringIncludes(route, 'href={selfHref}');
    assert(!route.includes('ctx.params'));
    assert(!route.includes('ctx.url'));
    assert(!route.includes('order-42'));
  });

  it('rejects duplicate direct appRoutes targets', async () => {
    const output = await makeAdapter().render(
      appRouterTemplate,
      SAMPLE_APP_VARS,
    );
    assertUniqueDirectAppRouteTargets(output);
  });

  it('utils.ts re-exports a typed definePage helper', () => {
    assertStringIncludes(
      appUtilsTemplate,
      "import { definePage as createDefinePage } from '@netscript/fresh/builders';",
    );
    assertStringIncludes(appUtilsTemplate, 'export function definePage()');
    assertStringIncludes(appUtilsTemplate, 'return createDefinePage<State>();');
  });

  it('app shell imports design CSS and avoids favicon console noise', async () => {
    const adapter = makeAdapter();
    const appShell = await adapter.render(appAppTemplate, SAMPLE_APP_VARS);
    assertStringIncludes(appClientTemplate, "import './assets/styles.css';");
    assertStringIncludes(appClientTemplate, "import './assets/design.css';");
    assertStringIncludes(appShell, "<link rel='icon' href='data:,' />");
  });

  it('index route keeps the builder in index.tsx and the view in a child component', async () => {
    const adapter = makeAdapter();
    const route = await adapter.render(appIndexRouteTemplate, SAMPLE_APP_VARS);
    const view = await adapter.render(appHomeViewTemplate, SAMPLE_APP_VARS);
    assertStringIncludes(
      route,
      "import HomeView from './(_components)/home-view.tsx';",
    );
    assertStringIncludes(route, "import { appRoutes } from '@app/router.ts';");
    assertStringIncludes(route, "import { definePage } from '@app/utils.ts';");
    assertStringIncludes(route, 'export const homePage = definePage()');
    assertStringIncludes(route, '.withRoute(appRoutes.home)');
    assertStringIncludes(route, '.withMeta(() => ({');
    assertStringIncludes(route, 'href: appRoutes.dashboard.href()');
    assertStringIncludes(route, 'href: appRoutes.crudExample.href()');
    assertStringIncludes(route, 'href: appRoutes.examples.href()');
    assertStringIncludes(route, 'designHref: appRoutes.design.href()');
    assertStringIncludes(
      route,
      'compositionHref: appRoutes.designComposition.href()',
    );
    assertStringIncludes(route, 'href: appRoutes.design.href()');
    assertStringIncludes(route, '.build();');
    assertStringIncludes(route, 'export { page as default };');
    assertStringIncludes(view, 'interface HomeViewProps {');
    assertStringIncludes(
      view,
      'import { Badge, Button, Card, PageHeader, StatsGrid }',
    );
    assertStringIncludes(
      view,
      'A generated NetScript workspace with app-owned UI copies',
    );
    assertStringIncludes(view, 'href={designHref}');
    assertStringIncludes(view, 'href={compositionHref}');
  });

  it('dashboard route keeps operations data in a registry-only child view', async () => {
    const adapter = makeAdapter();
    const route = await adapter.render(
      appDashboardRouteTemplate,
      SAMPLE_APP_VARS,
    );
    const view = await adapter.render(
      appDashboardViewTemplate,
      SAMPLE_APP_VARS,
    );
    assertStringIncludes(
      route,
      "import DashboardView from './(_components)/dashboard-view.tsx';",
    );
    assertStringIncludes(route, "import { appRoutes } from '@app/router.ts';");
    assertStringIncludes(route, '.withRoute(appRoutes.dashboard)');
    assertStringIncludes(route, ".withLayer('dashboard', DashboardView");
    assertStringIncludes(route, "name: 'api-gateway'");
    assertStringIncludes(route, '.build();');
    assertStringIncludes(view, 'interface DashboardViewProps {');
    assertStringIncludes(view, 'StatsGrid');
    assertStringIncludes(view, 'ResponsiveTable');
    assertStringIncludes(view, 'Deployment readiness');
    assert(!view.includes("class='flex"));
    assert(!view.includes("class='grid"));
  });

  it('health route keeps the builder in health.tsx and the probe payload in shared helpers', async () => {
    const adapter = makeAdapter();
    const route = await adapter.render(appHealthRouteTemplate, SAMPLE_APP_VARS);
    const view = await adapter.render(appHealthViewTemplate, SAMPLE_APP_VARS);
    const shared = await adapter.render(
      appHealthSharedTemplate,
      SAMPLE_APP_VARS,
    );
    assertStringIncludes(
      route,
      "import HealthView from './(_components)/health-view.tsx';",
    );
    assertStringIncludes(
      route,
      "import { buildPayload, toHealthRouteData } from './(_shared)/health.ts';",
    );
    assertStringIncludes(route, "import { appRoutes } from '@app/router.ts';");
    assertStringIncludes(route, "import { definePage } from '@app/utils.ts';");
    assertStringIncludes(route, 'export const healthPage = definePage()');
    assertStringIncludes(route, '.withRoute(appRoutes.health)');
    assertStringIncludes(route, ".withHandler('GET', (ctx) => {");
    assertStringIncludes(route, '.build();');
    assertStringIncludes(
      route,
      'export const { handler, default: page } = healthPage;',
    );
    assertStringIncludes(view, 'export default function HealthView');
    assertStringIncludes(view, 'Accept: application/json');
    assertStringIncludes(shared, 'export interface HealthPayload {');
    assertStringIncludes(shared, 'export function buildPayload');
    assertStringIncludes(shared, 'export function toHealthRouteData');
  });

  // Regression guard for #954. The Aspire AppHost probes this route to decide whether
  // the app is healthy, and its probe sends no `Accept` header. The route must therefore
  // render through the page layer by default — a JSON short-circuit on an unspecific
  // Accept would make the probe pass while every real page returns 500.
  it('health route renders through SSR unless the caller asks for JSON only', async () => {
    const adapter = makeAdapter();
    const route = await adapter.render(appHealthRouteTemplate, SAMPLE_APP_VARS);

    assertStringIncludes(route, ".withLayer('panel', HealthView,");
    assertStringIncludes(route, '.withLayout((slots) => slots.panel())');
    assertStringIncludes(
      route,
      "accept.includes('application/json') && !accept.includes('text/html')",
    );
    assertStringIncludes(route, 'return { data: { payload } };');
    assert(
      route.indexOf('if (accept.includes(') <
        route.indexOf('return { data: { payload } };'),
      'the JSON branch must be the guarded exception; SSR is the fall-through the probe hits',
    );
  });

  it('layout template keeps define.layout and exposes the examples nav', async () => {
    const adapter = makeAdapter();
    const output = await adapter.render(appLayoutTemplate, SAMPLE_APP_VARS);
    assertStringIncludes(output, "import { Partial } from 'fresh/runtime';");
    assertStringIncludes(output, "import { appRoutes } from '@app/router.ts';");
    assertStringIncludes(output, 'export default define.layout(');
    assertStringIncludes(output, "<Partial name='page'>");
    assertStringIncludes(output, 'const homeHref = appRoutes.home.href();');
    assertStringIncludes(
      output,
      'const dashboardHref = appRoutes.dashboard.href();',
    );
    assertStringIncludes(
      output,
      'const examplesHref = appRoutes.examples.href();',
    );
    assertStringIncludes(output, 'const designHref = appRoutes.design.href();');
    assertStringIncludes(output, 'url.pathname.startsWith(examplesHref)');
    assertStringIncludes(
      output,
      "import { Badge, Button } from '@app/components/ui/mod.ts';",
    );
    assertStringIncludes(
      output,
      "<Button\n            type='link'\n            href={dashboardHref}",
    );
    assertStringIncludes(
      output,
      "aria-current={url.pathname.startsWith(examplesHref) ? 'page' : undefined}",
    );
    assertStringIncludes(
      output,
      "aria-current={url.pathname.startsWith(designHref) ? 'page' : undefined}",
    );
  });

  it('design route templates use NetScript page builders and scoped route files', async () => {
    const adapter = makeAdapter();
    const layout = await adapter.render(
      appDesignLayoutTemplate,
      SAMPLE_APP_VARS,
    );
    const tokensRoute = await adapter.render(
      appDesignTokensRouteTemplate,
      SAMPLE_APP_VARS,
    );
    const componentsRoute = await adapter.render(
      appDesignComponentsRouteTemplate,
      SAMPLE_APP_VARS,
    );
    const compositionRoute = await adapter.render(
      appDesignCompositionRouteTemplate,
      SAMPLE_APP_VARS,
    );

    assertStringIncludes(
      layout,
      "import SidebarToggle from '@app/islands/ui/SidebarToggle.tsx';",
    );
    assertStringIncludes(
      layout,
      "import ThemeToggle from '@app/islands/ui/ThemeToggle.tsx';",
    );
    assertStringIncludes(layout, "import { appRoutes } from '@app/router.ts';");
    assertStringIncludes(layout, 'href: appRoutes.designTokens.href()');
    assertStringIncludes(layout, 'test-project');
    assertStringIncludes(
      appDesignIndexRouteTemplate,
      'return ctx.redirect(appRoutes.designTokens.href());',
    );
    assertStringIncludes(
      tokensRoute,
      "import DesignTokensView from './(_components)/tokens-view.tsx';",
    );
    assertStringIncludes(tokensRoute, '.withRoute(appRoutes.designTokens)');
    assertStringIncludes(tokensRoute, ".withLayer('tokens', DesignTokensView");
    assertStringIncludes(
      componentsRoute,
      "import DesignComponentsView from './(_components)/components-view.tsx';",
    );
    assertStringIncludes(
      componentsRoute,
      '.withRoute(appRoutes.designComponents)',
    );
    assertStringIncludes(
      componentsRoute,
      ".withLayer('components', DesignComponentsView",
    );
    assertStringIncludes(
      compositionRoute,
      "import DesignCompositionView from './(_components)/composition-view.tsx';",
    );
    assertStringIncludes(
      compositionRoute,
      '.withRoute(appRoutes.designComposition)',
    );
    assertStringIncludes(
      compositionRoute,
      ".withLayer('composition', DesignCompositionView",
    );
    assertStringIncludes(
      appDesignTokensViewTemplate,
      "import TokenClipboard from '../(_islands)/TokenClipboard.tsx';",
    );
    assertStringIncludes(
      appDesignTokensViewTemplate,
      "from '../(_shared)/tokens.ts';",
    );
    assertStringIncludes(
      appDesignComponentsViewTemplate,
      "from '../(_shared)/registry.ts';",
    );
    assertStringIncludes(
      appDesignComponentsViewTemplate,
      "from '../(_islands)/FloatingSurfaceDemo.tsx';",
    );
    assertStringIncludes(appDesignComponentsViewTemplate, 'responsive-table');
    assertStringIncludes(appDesignCompositionViewTemplate, 'Composition');
    assertStringIncludes(appDesignRegistryTemplate, "name: 'responsive-table'");
    assertStringIncludes(
      appDesignTokensLibTemplate,
      "import manifest from '@app/assets/tokens.json'",
    );
    assertStringIncludes(
      appDesignFloatingSurfaceDemoTemplate,
      "import { Popover, Sheet, Tooltip } from '@netscript/fresh-ui/interactive';",
    );
    assertStringIncludes(appDesignTokenClipboardTemplate, '[data-token-copy]');
    assertStringIncludes(appDesignCssTemplate, '.ns-tokens-page');
    assert(!appDesignCssTemplate.includes('repeating-linear-gradient'));
  });

  it('design route middleware refuses every mode except literal development', async () => {
    const middleware = await readTemplateAsset(TEMPLATE_KEYS.appRoutesDesignMiddleware);

    assertStringIncludes(middleware, "import { define } from '@app/utils.ts';");
    assertStringIncludes(
      middleware,
      "const mode = Deno.env.get('MODE') ?? Deno.env.get('NODE_ENV');",
    );
    assertStringIncludes(middleware, "if (mode !== 'development') {");
    assertStringIncludes(middleware, "return new Response('Not Found', { status: 404 });");
    assertStringIncludes(middleware, 'return await ctx.next();');
    assertEquals(middleware.includes("?? 'development'"), false);
    assert(
      middleware.indexOf("mode !== 'development'") < middleware.indexOf('ctx.next()'),
      'runtime refusal must happen before delegating to the design route',
    );
  });

  it('examples landing route keeps the builder in index.tsx and the cards in a child view', async () => {
    const adapter = makeAdapter();
    const route = await adapter.render(
      appExamplesIndexRouteTemplate,
      SAMPLE_APP_VARS,
    );
    const view = await adapter.render(appExamplesViewTemplate, SAMPLE_APP_VARS);
    assertStringIncludes(
      route,
      "import ExamplesView from './(_components)/examples-view.tsx';",
    );
    assertStringIncludes(route, "import { appRoutes } from '@app/router.ts';");
    assertStringIncludes(route, "import { definePage } from '@app/utils.ts';");
    assertStringIncludes(route, 'export const examplesPage = definePage()');
    assertStringIncludes(route, '.withRoute(appRoutes.examples)');
    assertStringIncludes(
      route,
      'canonicalHref: appRoutes.serviceExample.href()',
    );
    assertStringIncludes(route, 'href: appRoutes.serviceExample.href()');
    assertStringIncludes(route, "title: 'TeamMember resource flow'");
    assertStringIncludes(route, 'href: appRoutes.crudExample.href()');
    assertStringIncludes(route, "title: 'TeamMember CRUD'");
    assertStringIncludes(
      route,
      "description: 'Live TeamMember list, create, update, and delete flow backed by team-members.'",
    );
    assertStringIncludes(route, '/examples/telemetry');
    assertStringIncludes(route, '.build();');
    assertStringIncludes(route, 'export { page as default };');
    assertStringIncludes(view, 'interface ExamplesViewProps {');
    assertStringIncludes(view, 'ResponsiveTable');
    assertStringIncludes(view, 'href={canonicalHref}');
    assertStringIncludes(view, 'Open canonical TeamMember flow');
  });

  it('static directory-pattern route uses registry form, table, and detail blocks', async () => {
    const adapter = makeAdapter();
    const route = await adapter.render(
      appCrudExampleRouteTemplate,
      SAMPLE_APP_VARS,
    );
    const view = await adapter.render(
      appCrudExampleViewTemplate,
      SAMPLE_APP_VARS,
    );
    assertStringIncludes(
      route,
      "import CrudExampleView from './(_components)/crud-view.tsx';",
    );
    assertStringIncludes(route, "import { routes } from '@app/router.ts';");
    assertStringIncludes(route, '.withRoute(routes.examples.crud.$route)');
    assertStringIncludes(
      route,
      "title: 'test-project — directory pattern demo'",
    );
    assertStringIncludes(
      route,
      "description: 'Static registry-block composition demo with app-owned fresh-ui components.'",
    );
    assertStringIncludes(route, ".withLayer('crud', CrudExampleView");
    assertStringIncludes(route, "name: 'Acme Robotics'");
    assertStringIncludes(view, "<Badge variant='primary'>Pattern</Badge>");
    assertStringIncludes(view, '<h1>Directory pattern</h1>');
    assertStringIncludes(
      view,
      'The live service-backed CRUD route is generated under /examples/team-members.',
    );
    assertStringIncludes(view, 'FilterForm');
    assertStringIncludes(view, 'ResponsiveTable');
    assertStringIncludes(view, 'DetailLayout');
    assertStringIncludes(view, 'No accounts match these filters');
    assert(!view.includes("class='flex"));
    assert(!view.includes("class='grid"));
  });

  it('example service template wires the selected service client and query helpers', async () => {
    const adapter = makeAdapter();
    const output = await adapter.render(
      appExampleServiceQueryTemplate,
      SAMPLE_APP_VARS,
    );
    assertStringIncludes(
      output,
      "import { createServiceClient } from '@netscript/sdk/client';",
    );
    assertStringIncludes(
      output,
      "import { createQueryFactories } from '@netscript/sdk/query';",
    );
    assert(!output.includes('bridgeInvalidation'));
    const sdkImportSpecifiers = [
      ...new Set(
        [...output.matchAll(/from '(@netscript\/sdk\/[^']+)'/g)].map((match) => match[1]),
      ),
    ].sort();
    assertEquals(sdkImportSpecifiers, [
      '@netscript/sdk/client',
      '@netscript/sdk/query',
    ]);
    assertStringIncludes(output, 'TeamMembersContractV1,');
    assertStringIncludes(
      output,
      "export const teamMembersName = 'team-members';",
    );
    assertStringIncludes(
      output,
      "export const teamMembersRouterName = 'teamMembers';",
    );
    assertStringIncludes(
      output,
      'export const teamMembersClient = createServiceClient<typeof teamMembersContract>({',
    );
    assertStringIncludes(output, 'routerName: teamMembersRouterName,');
    const queries = 'export const teamMembersQueries = createQueryFactories({';
    const invalidation =
      'export const teamMembersListInvalidation = { queryKey: teamMembersQueries.list.clientKey() } as const;';
    assertStringIncludes(output, queries);
    assertStringIncludes(output, invalidation);
    assert(output.indexOf(invalidation) > output.indexOf(queries));
  });

  it('derives the service route from the neutral Form-B sidecar after rendering', async () => {
    const appRoot = await Deno.makeTempDir({
      prefix: 'netscript-init-form-b-',
    });
    try {
      const leaves = await renderExampleServiceResourceSlice(
        { templateAdapter: makeAdapter(), process: new DenoProcess() },
        SAMPLE_APP_VARS,
        resourceSliceTemplates,
      );
      for (const leaf of leaves) {
        const path = join(appRoot, leaf.path);
        await Deno.mkdir(join(path, '..'), { recursive: true });
        await Deno.writeTextFile(path, leaf.content);
      }

      const derived = writeFreshRouteManifestSync(appRoot);
      const serviceRoute = derived.discoveredRoutes.find((route) =>
        route.routePattern === '/examples/team-members'
      );
      assertEquals(serviceRoute?.pageModuleForm, 'sidecar');
      assertEquals(serviceRoute?.routeKeyPath, [
        'examples',
        'teamMembers',
        '$route',
      ]);
      assertStringIncludes(
        derived.routesSource,
        'bindRoutePattern(routeContract',
      );
      assertStringIncludes(
        leaves.find((leaf) => leaf.role === 'page')?.content ?? '',
        '.withRoute(appRoutes.teamMembers)',
      );
    } finally {
      await Deno.remove(appRoot, { recursive: true });
    }
  });

  it('service contract exposes typed CRUD schemas for the showcase mutations', async () => {
    const adapter = makeAdapter();
    const output = await adapter.render(
      serviceContractTemplate,
      SAMPLE_APP_VARS,
    );
    assertStringIncludes(output, 'createCrudContract');
    assertStringIncludes(output, 'TeamMemberSchema');
    assertStringIncludes(output, 'TeamMemberCreateInput');
    assertStringIncludes(output, 'TeamMemberUpdateInput');
  });

  it('service router binds Prisma-backed CRUD handlers for the showcase flow', async () => {
    const adapter = makeAdapter();
    const output = await adapter.render(serviceV1RouterTemplate, {
      ...SAMPLE_APP_VARS,
      projectName: SAMPLE_APP_VARS.name,
    });
    assertStringIncludes(
      output,
      "import type { PrismaClient } from '@database';",
    );
    assertStringIncludes(
      output,
      "type TeamMemberDelegate = PrismaClient['teamMember'];",
    );
    assertStringIncludes(
      output,
      'type TeamMemberHandlerContext = { readonly db: PrismaClient };',
    );
    assertStringIncludes(
      output,
      'const teamMembersV1 = v1.teamMembers.$context<TeamMemberHandlerContext>();',
    );
    assertStringIncludes(output, 'list: teamMembersV1.list.handler');
    assertStringIncludes(output, 'create: teamMembersV1.create.handler');
    assertStringIncludes(output, 'update: teamMembersV1.update.handler');
    assertStringIncludes(output, 'delete: teamMembersV1.delete.handler');
    assert(!output.includes('list!.handler'));
    assert(!output.includes('context.db as PrismaClient'));
  });
});
