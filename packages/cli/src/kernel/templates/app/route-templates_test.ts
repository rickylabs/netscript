/**
 * @module templates/app/route-templates_test
 */

import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assert, assertStringIncludes } from 'jsr:@std/assert@^1';
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
  appExampleServiceTemplate,
  appExamplesIndexRouteTemplate,
  appExamplesViewTemplate,
  appHealthRouteTemplate,
  appHealthSharedTemplate,
  appHealthViewTemplate,
  appHomeViewTemplate,
  appIndexRouteTemplate,
  appLayoutTemplate,
  appRouterTemplate,
  appServiceExampleHeroTemplate,
  appServiceExampleIndexTemplate,
  appServiceExampleLabPanelTemplate,
  appServiceExampleLayoutTemplate,
  appServiceExampleNotesCardTemplate,
  appServiceExamplePageLayoutTemplate,
  appServiceShowcaseIslandTemplate,
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
    assertStringIncludes(output, 'crudExample: routes.examples.crud,');
    assertStringIncludes(output, 'serviceExample: routes.examples.serviceExample,');
    assertStringIncludes(output, "designTokens: createRouteReference('/design/tokens'");
    assertStringIncludes(output, "id: 'design.components'");
    assertStringIncludes(output, "id: 'design.composition'");
    assertStringIncludes(output, 'export const appRouter = {');
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
    assertStringIncludes(route, 'href: \'/design/components\'');
    assertStringIncludes(route, '.build();');
    assertStringIncludes(route, 'export { page as default };');
    assertStringIncludes(view, 'interface HomeViewProps {');
    assertStringIncludes(view, "import { Badge, Button, Card, PageHeader, StatsGrid }");
    assertStringIncludes(view, 'A generated NetScript workspace with app-owned UI copies');
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
    assertStringIncludes(output, 'url.pathname.startsWith(examplesHref)');
    assertStringIncludes(output, "import { Badge, Button } from '@app/components/ui/mod.ts';");
    assertStringIncludes(output, "<Button\n            type='link'\n            href={dashboardHref}");
    assertStringIncludes(
      output,
      "aria-current={url.pathname.startsWith(examplesHref) ? 'page' : undefined}",
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
    assertStringIncludes(route, 'href: appRoutes.crudExample.href()');
    assertStringIncludes(route, '/examples/telemetry');
    assertStringIncludes(route, '.build();');
    assertStringIncludes(route, 'export { page as default };');
    assertStringIncludes(view, 'interface ExamplesViewProps {');
    assertStringIncludes(view, 'ResponsiveTable');
    assertStringIncludes(view, 'Open CRUD example');
  });

  it('CRUD example route uses registry form, table, and detail blocks', async () => {
    const adapter = makeAdapter();
    const route = await adapter.render(appCrudExampleRouteTemplate, SAMPLE_APP_VARS);
    const view = await adapter.render(appCrudExampleViewTemplate, SAMPLE_APP_VARS);
    assertStringIncludes(route, "import CrudExampleView from './(_components)/crud-view.tsx';");
    assertStringIncludes(route, '.withRoute(appRoutes.crudExample)');
    assertStringIncludes(route, ".withLayer('crud', CrudExampleView");
    assertStringIncludes(route, "name: 'Acme Robotics'");
    assertStringIncludes(view, 'FilterForm');
    assertStringIncludes(view, 'ResponsiveTable');
    assertStringIncludes(view, 'DetailLayout');
    assertStringIncludes(view, 'No accounts match these filters');
    assert(!view.includes('class=\'flex'));
    assert(!view.includes('class=\'grid'));
  });

  it('example service template wires the selected service client and query helpers', async () => {
    const adapter = makeAdapter();
    const output = await adapter.render(appExampleServiceTemplate, SAMPLE_APP_VARS);
    assertStringIncludes(output, "import { createServiceClient } from '@netscript/sdk/client';");
    assertStringIncludes(output, "import { createQueryFactories } from '@netscript/sdk/query';");
    assertStringIncludes(
      output,
      "import { bridgeInvalidation } from '@netscript/sdk/query-client';",
    );
    assertStringIncludes(output, 'TeamMembersContractV1,');
    assertStringIncludes(output, "export const exampleServiceName = 'team-members';");
    assertStringIncludes(output, "export const exampleServiceRouterName = 'teamMembers';");
    assertStringIncludes(
      output,
      'export const exampleServiceListInvalidation = bridgeInvalidation(',
    );
    assertStringIncludes(
      output,
      'export const exampleServiceClient = createServiceClient<typeof exampleServiceContract>({',
    );
    assertStringIncludes(output, 'routerName: exampleServiceRouterName,');
    assertStringIncludes(output, 'export const exampleServiceQueries = createQueryFactories({');
  });

  it('service example route is folder-owned with the builder in index.tsx and layout in index.layout.tsx', async () => {
    const adapter = makeAdapter();
    const route = await adapter.render(appServiceExampleIndexTemplate, SAMPLE_APP_VARS);
    const layout = await adapter.render(appServiceExampleLayoutTemplate, SAMPLE_APP_VARS);
    assertStringIncludes(
      route,
      "import { exampleServiceName } from '@app/lib/example-service.ts';",
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
    assertStringIncludes(route, '.withRoute(appRoutes.serviceExample)');
    assertStringIncludes(route, ".withPolicy('balanced')");
    assertStringIncludes(route, "spanName: 'scaffold.examples.teamMembers'");
    assertStringIncludes(route, ".withLayer('hero', ServiceExampleHero");
    assertStringIncludes(route, ".withLayer('lab', ServiceExampleLabPanel");
    assertStringIncludes(route, 'loader: loadServiceShowcaseData');
    assertStringIncludes(route, ".withLayer('summary', ServiceExampleSummaryCard");
    assertStringIncludes(route, "partialName: 'team-members-summary'");
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
    assertStringIncludes(layout, 'notes={slots.notes()}');
  });

  it('service example child components separate page structure from layer UIs', async () => {
    const adapter = makeAdapter();
    const pageLayout = await adapter.render(appServiceExamplePageLayoutTemplate, SAMPLE_APP_VARS);
    const hero = await adapter.render(appServiceExampleHeroTemplate, SAMPLE_APP_VARS);
    const lab = await adapter.render(appServiceExampleLabPanelTemplate, SAMPLE_APP_VARS);
    const summaryCard = await adapter.render(appServiceSummaryCardTemplate, SAMPLE_APP_VARS);
    const notes = await adapter.render(appServiceExampleNotesCardTemplate, SAMPLE_APP_VARS);
    assertStringIncludes(pageLayout, 'interface ServiceExamplePageLayoutProps');
    assertStringIncludes(pageLayout, '{hero}');
    assertStringIncludes(pageLayout, '{lab}');
    assertStringIncludes(pageLayout, '{summary}');
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
    assertStringIncludes(output, 'export async function loadServiceShowcaseData()');
    assertStringIncludes(output, 'dehydratedState: dehydrateQueryClient(queryClient)');
    assert(!output.includes('summaryCachedAt'));
    assert(!output.includes('summary: buildServiceSummary'));
  });

  it('route-local island uses QueryIsland, useQuery, and typed optimistic mutation', async () => {
    const adapter = makeAdapter();
    const output = await adapter.render(appServiceShowcaseIslandTemplate, SAMPLE_APP_VARS);
    assertStringIncludes(output, "import { useSignal } from '@preact/signals';");
    assertStringIncludes(output, "import { useRef } from 'preact/hooks';");
    assertStringIncludes(output, 'QueryIsland');
    assertStringIncludes(output, 'hydrateFromDehydrated');
    assertStringIncludes(output, 'useMutation');
    assertStringIncludes(output, 'useQuery');
    assertStringIncludes(output, 'exampleServiceListInvalidation');
    assertStringIncludes(output, 'exampleServiceQueries.updateStatus.mutationOptions()');
    assertStringIncludes(output, 'invalidateQueries(exampleServiceListInvalidation)');
    assertStringIncludes(output, 'Optimistically moved record');
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

  it('service contract exposes typed updateStatus for the showcase mutation', async () => {
    const adapter = makeAdapter();
    const output = await adapter.render(serviceContractTemplate, SAMPLE_APP_VARS);
    assertStringIncludes(output, 'UpdateStatusInputSchemaV1');
    assertStringIncludes(output, 'UpdateStatusResponseSchemaV1');
    assertStringIncludes(output, 'updateStatus: oc');
  });

  it('service router mutates the seeded records for the showcase flow', async () => {
    const adapter = makeAdapter();
    const output = await adapter.render(serviceV1RouterTemplate, {
      ...SAMPLE_APP_VARS,
      projectName: SAMPLE_APP_VARS.name,
    });
    assertStringIncludes(
      output,
      'const NEXT_STATUS_BY_STATE: Record<',
    );
    assertStringIncludes(output, "type TeamMembersListItemV1 } from '@test-project/contracts';");
    assertStringIncludes(output, 'let seededRecords: TeamMembersListItemV1[] = [');
    assertStringIncludes(output, 'updateStatus: v1.teamMembers.updateStatus.handler');
    assertStringIncludes(output, 'const nextStatus = input.status;');
    assertStringIncludes(output, 'record.summary = nextStatus ===');
  });
});
