/**
 * @module templates/app/route-templates_test
 */

import { describe, it } from 'jsr:@std/testing@^1/bdd';
import {
  assert,
  assertEquals,
  assertStrictEquals,
  assertStringIncludes,
} from 'jsr:@std/assert@^1';
import { generateRouteManifestSeed } from '../../application/scaffold/writers/app-route-seeds.ts';
import { TEMPLATE_MANIFEST } from '../../assets/manifest.ts';
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
  appExampleServiceOptimisticListMutationTemplate,
  appExampleServiceRouteContractTemplate,
  appExamplesIndexRouteTemplate,
  appExamplesViewTemplate,
  appOrderExampleRouteTemplate,
  appHealthRouteTemplate,
  appHealthSharedTemplate,
  appHealthViewTemplate,
  appHomeViewTemplate,
  appIndexRouteTemplate,
  appLayoutTemplate,
  appRouterTemplate,
  appServiceAuthorizationTemplate,
  appServiceExampleHeroTemplate,
  appServiceExampleIndexTemplate,
  appServiceExampleLabPanelTemplate,
  appServiceExampleLayoutTemplate,
  appServiceExampleNotesCardTemplate,
  appServiceExamplePageLayoutTemplate,
  appServiceManagedFormTemplate,
  appServiceShowcaseIslandTemplate,
  appServiceShowcaseMemoryIslandTemplate,
  appServiceShowcaseMemorySharedTemplate,
  appServiceShowcaseSharedTemplate,
  appServiceSummaryCardTemplate,
  appServiceSummaryPanelTemplate,
  appServiceSummaryPartialTemplate,
  appUtilsTemplate,
  makeAdapter,
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
  for (const match of body.matchAll(/^  ([A-Za-z][A-Za-z0-9]*): ([^,\n]+),$/gm)) {
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
  it('router.ts mirrors the playground route entrypoint and adds the scaffold service ref', async () => {
    const adapter = makeAdapter();
    const output = await adapter.render(appRouterTemplate, SAMPLE_APP_VARS);
    assertStringIncludes(output, "import { createRouteReference } from '@netscript/fresh/route';");
    assertStringIncludes(output, "import { routePatterns } from './.generated/manifest.ts';");
    assertStringIncludes(
      output,
      "import { routes as generatedRoutes } from './.generated/routes.ts';",
    );
    assertStringIncludes(output, 'export { routePatterns };');
    assertStringIncludes(output, '...generatedRoutes,');
    assertStringIncludes(output, '...generatedRoutes.examples,');
    assertStringIncludes(output, "serviceExample: createRouteReference('/examples/team-members'");
    assertStringIncludes(output, "id: 'examples.teamMembers'");
    assertStringIncludes(output, 'export const appRoutes = {');
    assertStringIncludes(output, 'home: routes.$route,');
    assertStringIncludes(output, 'dashboard: routes.dashboard.$route,');
    assertStringIncludes(output, 'health: routes.health.$route,');
    assertStringIncludes(output, 'examples: routes.examples.$route,');
    assertStringIncludes(output, 'serviceExample: routes.examples.serviceExample,');
    assertStringIncludes(output, 'crudExample: routes.examples.crud.$route,');
    assertStringIncludes(output, "designTokens: createRouteReference('/design/tokens'");
    assertStringIncludes(output, "id: 'design.components'");
    assertStringIncludes(output, "id: 'design.composition'");
    assertStringIncludes(output, 'export const appRouter = {');
  });

  it('CRUD links resolve to the generated /examples/crud route', async () => {
    const adapter = makeAdapter();
    const router = await adapter.render(appRouterTemplate, SAMPLE_APP_VARS);
    const home = await adapter.render(appIndexRouteTemplate, SAMPLE_APP_VARS);
    const examples = await adapter.render(appExamplesIndexRouteTemplate, SAMPLE_APP_VARS);
    const targets = directAppRouteTargets(router);

    assert(
      targets.get('crudExample') === 'routes.examples.crud.$route',
      'appRoutes.crudExample must target the generated CRUD route',
    );
    assertStringIncludes(generateRouteManifestSeed(), "$route: '/examples/crud'");
    assertStringIncludes(home, 'href: appRoutes.crudExample.href()');
    assertStringIncludes(examples, 'href: appRoutes.crudExample.href()');
  });

  it('dynamic order route is registered, aliased, and linked from examples', async () => {
    const adapter = makeAdapter();
    const router = await adapter.render(appRouterTemplate, SAMPLE_APP_VARS);
    const examples = await adapter.render(appExamplesIndexRouteTemplate, SAMPLE_APP_VARS);

    assert(
      TEMPLATE_MANIFEST.map((asset) => String(asset.path)).includes(
        'app/routes/examples/orders/[id].tsx.template',
      ),
      'dynamic order route template must be registered',
    );
    assertStringIncludes(router, 'order: generatedRoutes.examples.orders.$id.$route,');
    assertStringIncludes(examples, "appRoutes.order.href({ path: { id: 'order-42' } })");
  });

  it('dynamic order route binds inferred ctx.path and derives its self href from that value', () => {
    const route = appOrderExampleRouteTemplate;

    assertStringIncludes(route, '.withRoute(appRoutes.order)');
    assertStringIncludes(route, 'const id: string = ctx.path.id;');
    assertStringIncludes(route, 'const selfHref = ctx.route.href({ path: { id } });');
    assertStringIncludes(route, 'data-order-id={id}');
    assertStringIncludes(route, 'href={selfHref}');
    assert(!route.includes('ctx.params'));
    assert(!route.includes('ctx.url'));
    assert(!route.includes('order-42'));
  });

  it('rejects duplicate direct appRoutes targets', async () => {
    const output = await makeAdapter().render(appRouterTemplate, SAMPLE_APP_VARS);
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
    assertStringIncludes(route, "import HomeView from './(_components)/home-view.tsx';");
    assertStringIncludes(route, "import { appRoutes } from '@app/router.ts';");
    assertStringIncludes(route, "import { definePage } from '@app/utils.ts';");
    assertStringIncludes(route, 'export const homePage = definePage()');
    assertStringIncludes(route, '.withRoute(appRoutes.home)');
    assertStringIncludes(route, '.withMeta(() => ({');
    assertStringIncludes(route, 'href: appRoutes.dashboard.href()');
    assertStringIncludes(route, 'href: appRoutes.crudExample.href()');
    assertStringIncludes(route, 'href: appRoutes.examples.href()');
    assertStringIncludes(route, 'designHref: appRoutes.design.href()');
    assertStringIncludes(route, 'compositionHref: appRoutes.designComposition.href()');
    assertStringIncludes(route, 'href: appRoutes.design.href()');
    assertStringIncludes(route, '.build();');
    assertStringIncludes(route, 'export { page as default };');
    assertStringIncludes(view, 'interface HomeViewProps {');
    assertStringIncludes(view, "import { Badge, Button, Card, PageHeader, StatsGrid }");
    assertStringIncludes(view, 'A generated NetScript workspace with app-owned UI copies');
    assertStringIncludes(view, 'href={designHref}');
    assertStringIncludes(view, 'href={compositionHref}');
  });

  it('dashboard route keeps operations data in a registry-only child view', async () => {
    const adapter = makeAdapter();
    const route = await adapter.render(appDashboardRouteTemplate, SAMPLE_APP_VARS);
    const view = await adapter.render(appDashboardViewTemplate, SAMPLE_APP_VARS);
    assertStringIncludes(route, "import DashboardView from './(_components)/dashboard-view.tsx';");
    assertStringIncludes(route, "import { appRoutes } from '@app/router.ts';");
    assertStringIncludes(route, '.withRoute(appRoutes.dashboard)');
    assertStringIncludes(route, ".withLayer('dashboard', DashboardView");
    assertStringIncludes(route, "name: 'api-gateway'");
    assertStringIncludes(route, '.build();');
    assertStringIncludes(view, 'interface DashboardViewProps {');
    assertStringIncludes(view, 'StatsGrid');
    assertStringIncludes(view, 'ResponsiveTable');
    assertStringIncludes(view, 'Deployment readiness');
    assert(!view.includes('class=\'flex'));
    assert(!view.includes('class=\'grid'));
  });

  it('health route keeps the builder in health.tsx and the probe payload in shared helpers', async () => {
    const adapter = makeAdapter();
    const route = await adapter.render(appHealthRouteTemplate, SAMPLE_APP_VARS);
    const view = await adapter.render(appHealthViewTemplate, SAMPLE_APP_VARS);
    const shared = await adapter.render(appHealthSharedTemplate, SAMPLE_APP_VARS);
    assertStringIncludes(route, "import HealthView from './(_components)/health-view.tsx';");
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
    assertStringIncludes(route, 'export const { handler, default: page } = healthPage;');
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
      route.indexOf('if (accept.includes(') < route.indexOf('return { data: { payload } };'),
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
    assertStringIncludes(output, 'const dashboardHref = appRoutes.dashboard.href();');
    assertStringIncludes(output, 'const examplesHref = appRoutes.examples.href();');
    assertStringIncludes(output, 'const designHref = appRoutes.design.href();');
    assertStringIncludes(output, 'url.pathname.startsWith(examplesHref)');
    assertStringIncludes(output, "import { Badge, Button } from '@app/components/ui/mod.ts';");
    assertStringIncludes(output, "<Button\n            type='link'\n            href={dashboardHref}");
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
    const layout = await adapter.render(appDesignLayoutTemplate, SAMPLE_APP_VARS);
    const tokensRoute = await adapter.render(appDesignTokensRouteTemplate, SAMPLE_APP_VARS);
    const componentsRoute = await adapter.render(appDesignComponentsRouteTemplate, SAMPLE_APP_VARS);
    const compositionRoute = await adapter.render(
      appDesignCompositionRouteTemplate,
      SAMPLE_APP_VARS,
    );

    assertStringIncludes(layout, "import SidebarToggle from '@app/islands/ui/SidebarToggle.tsx';");
    assertStringIncludes(layout, "import ThemeToggle from '@app/islands/ui/ThemeToggle.tsx';");
    assertStringIncludes(layout, "import { appRoutes } from '@app/router.ts';");
    assertStringIncludes(layout, 'href: appRoutes.designTokens.href()');
    assertStringIncludes(layout, 'test-project');
    assertStringIncludes(appDesignIndexRouteTemplate, 'return ctx.redirect(appRoutes.designTokens.href());');
    assertStringIncludes(tokensRoute, "import DesignTokensView from './(_components)/tokens-view.tsx';");
    assertStringIncludes(tokensRoute, '.withRoute(appRoutes.designTokens)');
    assertStringIncludes(tokensRoute, ".withLayer('tokens', DesignTokensView");
    assertStringIncludes(
      componentsRoute,
      "import DesignComponentsView from './(_components)/components-view.tsx';",
    );
    assertStringIncludes(componentsRoute, '.withRoute(appRoutes.designComponents)');
    assertStringIncludes(componentsRoute, ".withLayer('components', DesignComponentsView");
    assertStringIncludes(
      compositionRoute,
      "import DesignCompositionView from './(_components)/composition-view.tsx';",
    );
    assertStringIncludes(compositionRoute, '.withRoute(appRoutes.designComposition)');
    assertStringIncludes(compositionRoute, ".withLayer('composition', DesignCompositionView");
    assertStringIncludes(
      appDesignTokensViewTemplate,
      "import TokenClipboard from '../(_islands)/TokenClipboard.tsx';",
    );
    assertStringIncludes(appDesignTokensViewTemplate, "from '../(_shared)/tokens.ts';");
    assertStringIncludes(appDesignComponentsViewTemplate, "from '../(_shared)/registry.ts';");
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

  it('examples landing route keeps the builder in index.tsx and the cards in a child view', async () => {
    const adapter = makeAdapter();
    const route = await adapter.render(appExamplesIndexRouteTemplate, SAMPLE_APP_VARS);
    const view = await adapter.render(appExamplesViewTemplate, SAMPLE_APP_VARS);
    assertStringIncludes(route, "import ExamplesView from './(_components)/examples-view.tsx';");
    assertStringIncludes(route, "import { appRoutes } from '@app/router.ts';");
    assertStringIncludes(route, "import { definePage } from '@app/utils.ts';");
    assertStringIncludes(route, 'export const examplesPage = definePage()');
    assertStringIncludes(route, '.withRoute(appRoutes.examples)');
    assertStringIncludes(route, 'canonicalHref: appRoutes.serviceExample.href()');
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
    const route = await adapter.render(appCrudExampleRouteTemplate, SAMPLE_APP_VARS);
    const view = await adapter.render(appCrudExampleViewTemplate, SAMPLE_APP_VARS);
    assertStringIncludes(route, "import CrudExampleView from './(_components)/crud-view.tsx';");
    assertStringIncludes(route, "import { routes } from '@app/router.ts';");
    assertStringIncludes(route, '.withRoute(routes.examples.crud.$route)');
    assertStringIncludes(route, "title: 'test-project — directory pattern demo'");
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
    assert(!view.includes('class=\'flex'));
    assert(!view.includes('class=\'grid'));
  });

  it('example service template wires the selected service client and query helpers', async () => {
    const adapter = makeAdapter();
    const output = await adapter.render(appExampleServiceQueryTemplate, SAMPLE_APP_VARS);
    assertStringIncludes(output, "import { createServiceClient } from '@netscript/sdk/client';");
    assertStringIncludes(output, "import { createQueryFactories } from '@netscript/sdk/query';");
    assertStringIncludes(
      output,
      "import { bridgeInvalidation } from '@netscript/sdk/query-client';",
    );
    assertStringIncludes(output, 'TeamMembersContractV1,');
    assertStringIncludes(output, "export const teamMembersName = 'team-members';");
    assertStringIncludes(output, "export const teamMembersRouterName = 'teamMembers';");
    assertStringIncludes(
      output,
      'export const teamMembersListInvalidation = bridgeInvalidation(',
    );
    assertStringIncludes(
      output,
      'export const teamMembersClient = createServiceClient<typeof teamMembersContract>({',
    );
    assertStringIncludes(output, 'routerName: teamMembersRouterName,');
    assertStringIncludes(output, 'export const teamMembersQueries = createQueryFactories({');
  });

  it('resource-local route contract owns typed path and search state', async () => {
    const output = await makeAdapter().render(
      appExampleServiceRouteContractTemplate,
      SAMPLE_APP_VARS,
    );
    assertStringIncludes(output, "import { z } from 'zod';");
    assertStringIncludes(output, 'export const teamMembersPathSchema = z.object({});');
    assertStringIncludes(output, 'export const teamMembersSearchSchema = z.object({');
    assertStringIncludes(output, 'page: z.coerce.number().int().min(1).default(1)');
    assertStringIncludes(output, "query: z.string().trim().max(100).default('')");
    assertStringIncludes(output, 'export const teamMembersNoteSchema = z.object({');
    assertStringIncludes(output, "min(3, 'Note must be at least 3 characters')");
  });

  it('service example route is folder-owned with the builder in index.tsx and layout in index.layout.tsx', async () => {
    const adapter = makeAdapter();
    const route = await adapter.render(appServiceExampleIndexTemplate, SAMPLE_APP_VARS);
    const layout = await adapter.render(appServiceExampleLayoutTemplate, SAMPLE_APP_VARS);
    assertStringIncludes(
      route,
      "import { teamMembersName } from './(_lib)/service-query.ts';",
    );
    assertStringIncludes(route, "import { appRoutes } from '@app/router.ts';");
    assertStringIncludes(route, "import { ServiceExampleHero } from './(_components)/hero.tsx';");
    assertStringIncludes(
      route,
      "import { ServiceExampleLabPanel } from './(_components)/lab-panel.tsx';",
    );
    assertStringIncludes(
      route,
      "import { ServiceExampleSummaryCard } from './(_components)/summary-card.tsx';",
    );
    assertStringIncludes(
      route,
      "import { ServiceExampleNotesCard } from './(_components)/notes-card.tsx';",
    );
    assertStringIncludes(route, "import { ServiceExampleRouteLayout } from './index.layout.tsx';");
    assertStringIncludes(route, 'loadServiceShowcaseSummary');
    assertStringIncludes(route, 'export const serviceExamplePage = definePage()');
    assertStringIncludes(route, ".withRouteContract({ $route: '/examples/team-members' })");
    assertStringIncludes(route, '.withPathParams(teamMembersPathSchema)');
    assertStringIncludes(route, '.withSearchParams(teamMembersSearchSchema)');
    assertStringIncludes(route, ".withPolicy('balanced')");
    assertStringIncludes(route, "spanName: 'scaffold.examples.teamMembers'");
    assertStringIncludes(route, ".withResource('viewer', () => resolveServiceExampleViewer())");
    assertStringIncludes(
      route,
      ".withResource('showcase', ({ search }) => loadServiceShowcaseData(search))",
    );
    assertStringIncludes(route, ".withLayer('hero', ServiceExampleHero");
    assertStringIncludes(route, ".withLayer('lab', ServiceExampleLabPanel");
    assertStringIncludes(route, 'loader: ({ resources }) => resources.showcase');
    assertStringIncludes(route, ".withLayer('summary', ServiceExampleSummaryCard");
    assertStringIncludes(route, "partialName: 'team-members-summary'");
    assertStringIncludes(route, ".withForm('managedForm', ServiceManagedForm");
    assertStringIncludes(route, 'requireServiceExampleMutation(resources.viewer)');
    assertStringIncludes(route, "spanName: 'scaffold.examples.teamMembers.note'");
    assertStringIncludes(route, ".withLayer('notes', ServiceExampleNotesCard");
    assertStringIncludes(route, 'export type ServiceExamplePage = typeof serviceExamplePage;');
    assertStringIncludes(
      route,
      'export const { hooks: serviceExamplePageHooks, default: page } = serviceExamplePage;',
    );
    assertStringIncludes(route, '.build();');
    assertStringIncludes(layout, "import { serviceExamplePageHooks } from './index.tsx';");
    assertStringIncludes(
      layout,
      "import { ServiceExamplePageLayout } from './(_components)/page-layout.tsx';",
    );
    assertStringIncludes(layout, 'const slots = serviceExamplePageHooks.useSlots();');
    assertStringIncludes(layout, 'hero={slots.hero()}');
    assertStringIncludes(layout, 'lab={slots.lab()}');
    assertStringIncludes(layout, 'summary={slots.summary()}');
    assertStringIncludes(layout, 'managedForm={slots.managedForm()}');
    assertStringIncludes(layout, 'notes={slots.notes()}');
  });

  it('service example child components separate page structure from layer UIs', async () => {
    const adapter = makeAdapter();
    const pageLayout = await adapter.render(appServiceExamplePageLayoutTemplate, SAMPLE_APP_VARS);
    const hero = await adapter.render(appServiceExampleHeroTemplate, SAMPLE_APP_VARS);
    const lab = await adapter.render(appServiceExampleLabPanelTemplate, SAMPLE_APP_VARS);
    const summaryCard = await adapter.render(appServiceSummaryCardTemplate, SAMPLE_APP_VARS);
    const notes = await adapter.render(appServiceExampleNotesCardTemplate, SAMPLE_APP_VARS);
    const authorization = await adapter.render(appServiceAuthorizationTemplate, SAMPLE_APP_VARS);
    assertStringIncludes(pageLayout, 'interface ServiceExamplePageLayoutProps');
    assertStringIncludes(pageLayout, '{hero}');
    assertStringIncludes(pageLayout, '{lab}');
    assertStringIncludes(pageLayout, '{summary}');
    assertStringIncludes(pageLayout, '{managedForm}');
    assertStringIncludes(pageLayout, '{notes}');
    assertStringIncludes(hero, 'export function ServiceExampleHero');
    assertStringIncludes(hero, 'examplesHref');
    assertStringIncludes(hero, 'page-layout.tsx');
    assertStringIncludes(
      lab,
      "import ServiceShowcaseLab from '../(_islands)/ServiceShowcaseLab.tsx';",
    );
    assertStringIncludes(lab, '<ServiceShowcaseLab {...props} />');
    assertStringIncludes(summaryCard, 'export function ServiceExampleSummaryCard');
    assertStringIncludes(summaryCard, 'Summary cards stay server-owned');
    assertStringIncludes(notes, 'export function ServiceExampleNotesCard');
    assertStringIncludes(notes, 'Deferred partial-backed layers');
    assertStringIncludes(authorization, 'export interface ServiceExampleViewer');
    assertStringIncludes(authorization, 'export function requireServiceExampleMutation');
  });

  it('managed form renders the schema-invalid branch and keeps partial navigation', async () => {
    const output = await makeAdapter().render(appServiceManagedFormTemplate, SAMPLE_APP_VARS);
    assertStringIncludes(output, "data-state={state.hasErrors ? 'invalid'");
    assertStringIncludes(output, "variant='destructive' title='Check the form'");
    assertStringIncludes(output, 'The note was not saved. Correct the validation error');
    assertStringIncludes(output, '<form');
    assertStringIncludes(output, 'f-client-nav');
  });

  it('managed form renders the successful-submission branch', async () => {
    const output = await makeAdapter().render(appServiceManagedFormTemplate, SAMPLE_APP_VARS);
    assertStringIncludes(output, ": state.submitted ? 'success' : 'initial'");
    assertStringIncludes(output, "variant='success' title='Note accepted'");
    assertStringIncludes(output, 'The managed mutation completed successfully.');
  });

  it('route-local shared loader prefetches and dehydrates the showcase query', async () => {
    const adapter = makeAdapter();
    const output = await adapter.render(appServiceShowcaseSharedTemplate, SAMPLE_APP_VARS);
    assertStringIncludes(output, "import { dehydrateQueryClient } from '@netscript/fresh/query';");
    assertStringIncludes(
      output,
      "import { createNetScriptQueryClient } from '@netscript/sdk/query-client';",
    );
    assertStringIncludes(output, 'export const SERVICE_SHOWCASE_INPUT = {');
    assertStringIncludes(output, 'export async function loadServiceShowcaseSummary()');
    assertStringIncludes(output, 'export async function loadServiceShowcaseData(search:');
    assertStringIncludes(output, 'page: search.page');
    assertStringIncludes(output, 'dehydratedState: dehydrateQueryClient(queryClient)');
    assert(!output.includes('summaryCachedAt'));
    assert(!output.includes('summary: buildServiceSummary'));
  });

  it('optimistic callbacks capture and restore the exact pre-mutation snapshot', async () => {
    const source = await makeAdapter().render(
      appExampleServiceOptimisticListMutationTemplate,
      SAMPLE_APP_VARS,
    );
    const module = await import(`data:application/typescript,${encodeURIComponent(source)}`);
    const key = ['team-members', 'list'] as const;
    const before = { data: [{ id: 1, name: 'Ada' }] };
    let current = before;
    const events: string[] = [];
    const callbacks = module.createOptimisticListMutationCallbacks({
      queryClient: {
        getQueryData: () => current,
        setQueryData: (_queryKey: readonly unknown[], data: typeof before) => {
          current = data;
        },
      },
      queryKey: key,
      update: (previous: typeof before, variables: { readonly name: string }) => ({
        data: [{ ...previous.data[0], name: variables.name }],
      }),
      onOptimisticUpdate: () => events.push('optimistic'),
      onRollback: () => events.push('rollback'),
    });

    const context = callbacks.onMutate({ name: 'Grace' });
    assertStrictEquals(context.previous, before);
    assertEquals(current, { data: [{ id: 1, name: 'Grace' }] });
    callbacks.onError(new Error('rejected'), { name: 'Grace' }, context);
    assertStrictEquals(current, before);
    assertEquals(events, ['optimistic', 'rollback']);
  });

  it('DB island exposes cached query states and consumes executable rollback callbacks', async () => {
    const adapter = makeAdapter();
    const output = await adapter.render(appServiceShowcaseIslandTemplate, SAMPLE_APP_VARS);
    assertStringIncludes(output, "import { useSignal } from '@preact/signals';");
    assertStringIncludes(output, "import { useRef } from 'preact/hooks';");
    assertStringIncludes(output, 'QueryIsland');
    assertStringIncludes(output, 'hydrateFromDehydrated');
    assertStringIncludes(output, 'useMutation');
    assertStringIncludes(output, 'useQuery');
    assertStringIncludes(output, 'teamMembersQueries.create.mutationOptions()');
    assertStringIncludes(output, 'teamMembersQueries.update.mutationOptions()');
    assertStringIncludes(output, 'teamMembersQueries.delete.mutationOptions()');
    assertStringIncludes(output, 'useQuery<ServiceListData>');
    assertStringIncludes(output, 'useMutation<ServiceRecord, unknown, CreateInput>');
    assertStringIncludes(output, 'createOptimisticListMutationCallbacks<ServiceListData');
    assertStringIncludes(output, 'the cached list rolled back');
    assertStringIncludes(output, "data-state='loading'");
    assertStringIncludes(output, "data-state='error'");
    assertStringIncludes(output, "data-state='empty'");
    assertStringIncludes(output, "items.length === 0 ? 'empty' : 'success'");
    assertStringIncludes(output, 'data-state={renderState}');
    assertStringIncludes(output, "renderState === 'rollback'");
  });

  it('memory island consumes executable rollback callbacks and preserves query states', async () => {
    const adapter = makeAdapter();
    const island = await adapter.render(appServiceShowcaseMemoryIslandTemplate, SAMPLE_APP_VARS);
    const shared = await adapter.render(appServiceShowcaseMemorySharedTemplate, SAMPLE_APP_VARS);
    assertStringIncludes(island, 'createOptimisticListMutationCallbacks<ServiceListData');
    assertStringIncludes(island, 'the cached list rolled back');
    assertStringIncludes(island, "data-state='loading'");
    assertStringIncludes(island, "data-state='error'");
    assertStringIncludes(island, "data-state='empty'");
    assertStringIncludes(island, "items.length === 0 ? 'empty' : 'success'");
    assertStringIncludes(island, 'data-state={renderState}');
    assertStringIncludes(island, "renderState === 'rollback'");
    assertStringIncludes(shared, 'offset: (search.page - 1) * SERVICE_SHOWCASE_PAGE_SIZE');
    assertStringIncludes(shared, 'search: search.query || undefined');
  });

  it('summary panel and partial route keep defer concerns server-owned', async () => {
    const adapter = makeAdapter();
    const panel = await adapter.render(appServiceSummaryPanelTemplate, SAMPLE_APP_VARS);
    const partial = await adapter.render(appServiceSummaryPartialTemplate, SAMPLE_APP_VARS);
    assertStringIncludes(panel, 'Deferred partial refreshed');
    assertStringIncludes(
      partial,
      "import { defineStatsPartial } from '@netscript/fresh/builders';",
    );
    assertStringIncludes(
      partial,
      "import { ServiceSummaryPanel } from '@app/routes/examples/team-members/(_components)/summary-panel.tsx';",
    );
    assertStringIncludes(partial, "name: 'team-members-summary'");
    assertStringIncludes(partial, 'query: loadServiceShowcaseSummary');
  });

  it('service contract exposes typed CRUD schemas for the showcase mutations', async () => {
    const adapter = makeAdapter();
    const output = await adapter.render(serviceContractTemplate, SAMPLE_APP_VARS);
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
    assertStringIncludes(output, "import type { PrismaClient } from '@database';");
    assertStringIncludes(output, "type TeamMemberDelegate = PrismaClient['teamMember'];");
    assertStringIncludes(output, 'type TeamMemberHandlerContext = { readonly db: PrismaClient };');
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
