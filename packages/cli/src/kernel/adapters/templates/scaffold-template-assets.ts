import { TEMPLATE_KEYS, type TemplateKey } from '../../assets/manifest.ts';
import { readTemplateAsset } from '../templates/template-asset.ts';

type TemplateUrlMap = Readonly<Record<string, TemplateKey>>;

const APP_TEMPLATE_URLS: TemplateUrlMap = {
  appDesignCssTemplate: TEMPLATE_KEYS.appAssetsDesignCss,
  appDesignComponentsRouteTemplate: TEMPLATE_KEYS.appRoutesDesignComponents,
  appDesignComponentsViewTemplate: TEMPLATE_KEYS.appRoutesDesignComponentsView,
  appDesignCompositionRouteTemplate: TEMPLATE_KEYS.appRoutesDesignComposition,
  appDesignCompositionViewTemplate: TEMPLATE_KEYS.appRoutesDesignCompositionView,
  appDesignIndexRouteTemplate: TEMPLATE_KEYS.appRoutesDesignIndex,
  appDesignLayoutTemplate: TEMPLATE_KEYS.appRoutesDesignLayout,
  appDesignRegistryTemplate: TEMPLATE_KEYS.appRoutesDesignSharedRegistry,
  appDesignFloatingSurfaceDemoTemplate: TEMPLATE_KEYS.appRoutesDesignIslandsFloatingSurfaceDemo,
  appDesignTokenClipboardTemplate: TEMPLATE_KEYS.appRoutesDesignIslandsTokenClipboard,
  appDesignTokensLibTemplate: TEMPLATE_KEYS.appRoutesDesignSharedTokens,
  appDesignTokensRouteTemplate: TEMPLATE_KEYS.appRoutesDesignTokens,
  appDesignTokensViewTemplate: TEMPLATE_KEYS.appRoutesDesignTokensView,
  appAppTemplate: TEMPLATE_KEYS.appRoutesApp,
  appClientTemplate: TEMPLATE_KEYS.appClient,
  appCrudExampleRouteTemplate: TEMPLATE_KEYS.appRoutesExamplesCrud,
  appCrudExampleViewTemplate: TEMPLATE_KEYS.appRoutesExamplesComponentsCrudView,
  appDashboardRouteTemplate: TEMPLATE_KEYS.appRoutesDashboard,
  appDashboardViewTemplate: TEMPLATE_KEYS.appRoutesComponentsDashboardView,
  appExamplesIndexRouteTemplate: TEMPLATE_KEYS.appRoutesExamplesIndex,
  appExamplesViewTemplate: TEMPLATE_KEYS.appRoutesExamplesComponentsExamplesView,
  appHealthRouteTemplate: TEMPLATE_KEYS.appRoutesHealth,
  appHealthSharedTemplate: TEMPLATE_KEYS.appRoutesSharedHealth,
  appHealthViewTemplate: TEMPLATE_KEYS.appRoutesComponentsHealthView,
  appHomeViewTemplate: TEMPLATE_KEYS.appRoutesComponentsHomeView,
  appIndexRouteTemplate: TEMPLATE_KEYS.appRoutesIndex,
  appLayoutTemplate: TEMPLATE_KEYS.appRoutesLayout,
  appMainTemplate: TEMPLATE_KEYS.appMain,
  appRouterTemplate: TEMPLATE_KEYS.appRouter,
  appUiModTemplate: TEMPLATE_KEYS.appComponentsUiMod,
  appUtilsTemplate: TEMPLATE_KEYS.appUtils,
} as const;

const EXAMPLE_SERVICE_APP_TEMPLATE_URLS: TemplateUrlMap = {
  appExampleServiceHeroTemplate: TEMPLATE_KEYS.appRoutesExamplesComponentsHero,
  appExampleServiceLabPanelTemplate: TEMPLATE_KEYS.appRoutesExamplesComponentsLabPanel,
  appExampleServiceNotesCardTemplate: TEMPLATE_KEYS.appRoutesExamplesComponentsNotesCard,
  appExampleServicePageLayoutTemplate: TEMPLATE_KEYS.appRoutesExamplesComponentsPageLayout,
  appExampleServiceShowcaseSharedTemplate: TEMPLATE_KEYS.appRoutesExamplesSharedServiceShowcase,
  appExampleServiceShowcaseSharedMemoryTemplate:
    TEMPLATE_KEYS.appRoutesExamplesSharedServiceShowcaseMemory,
  appExampleServiceShowcaseTemplate: TEMPLATE_KEYS.appRoutesExamplesIslandsServiceshowcaselab,
  appExampleServiceShowcaseMemoryTemplate:
    TEMPLATE_KEYS.appRoutesExamplesIslandsServiceshowcaselabMemory,
  appExampleServiceSummaryCardTemplate: TEMPLATE_KEYS.appRoutesExamplesComponentsSummaryCard,
  appExampleServiceSummaryPanelTemplate: TEMPLATE_KEYS.appRoutesExamplesComponentsSummaryPanel,
  appExampleServiceSummaryPanelMemoryTemplate:
    TEMPLATE_KEYS.appRoutesExamplesComponentsSummaryPanelMemory,
  appExampleServiceTemplate: TEMPLATE_KEYS.appLibExampleService,
  appServiceExampleIndexTemplate: TEMPLATE_KEYS.appRoutesExamplesServiceIndex,
  appServiceExampleLayoutTemplate: TEMPLATE_KEYS.appRoutesExamplesServiceIndexLayout,
  appServiceSummaryPartialTemplate: TEMPLATE_KEYS.appRoutesPartialsExamplesServiceSummary,
  appTelemetryExampleIndexTemplate: TEMPLATE_KEYS.appRoutesExamplesTelemetryIndex,
  appTelemetryExampleViewTemplate: TEMPLATE_KEYS.appRoutesExamplesTelemetryComponentsTelemetryView,
  appTelemetryExampleSharedTemplate: TEMPLATE_KEYS.appRoutesExamplesTelemetrySharedTelemetryTrace,
} as const;

const ROOT_TEMPLATE_URLS: TemplateUrlMap = {
  bareMetalDeployWorkflowTemplate: TEMPLATE_KEYS.workspaceGithubWorkflowsDeployBareMetal,
  composeGhcrDeployWorkflowTemplate: TEMPLATE_KEYS.workspaceGithubWorkflowsDeployComposeGhcr,
  denoDeployWorkflowTemplate: TEMPLATE_KEYS.workspaceGithubWorkflowsDeployDenoDeploy,
  gitignoreTemplate: TEMPLATE_KEYS.workspaceGitignore,
} as const;

const ASPIRE_HELPER_TEMPLATE_URLS: TemplateUrlMap = {
  apphostTemplate: TEMPLATE_KEYS.aspireHelpersApphost,
  aspireCompatTemplate: TEMPLATE_KEYS.aspireHelpersAspireCompat,
  configureDashboardTemplate: TEMPLATE_KEYS.aspireHelpersConfigureDashboard,
} as const;

type TemplateMap<T extends Record<string, TemplateKey>> = {
  readonly [Key in keyof T]: string;
};

export type AppScaffoldTemplateAssets = TemplateMap<typeof APP_TEMPLATE_URLS>;
export type ExampleServiceAppTemplateAssets = TemplateMap<
  typeof EXAMPLE_SERVICE_APP_TEMPLATE_URLS
>;
export type RootScaffoldTemplateAssets = TemplateMap<typeof ROOT_TEMPLATE_URLS>;
export type AspireHelperTemplateAssets = TemplateMap<
  typeof ASPIRE_HELPER_TEMPLATE_URLS
>;

async function loadTemplateMap<T extends Record<string, TemplateKey>>(
  urls: T,
): Promise<TemplateMap<T>> {
  const entries = await Promise.all(
    Object.entries(urls).map(async (
      [name, url],
    ) => [name, await readTemplateAsset(url)]),
  );
  return Object.fromEntries(entries) as TemplateMap<T>;
}

export async function loadAppScaffoldTemplateAssets(): Promise<
  AppScaffoldTemplateAssets
> {
  return await loadTemplateMap(APP_TEMPLATE_URLS);
}

export async function loadExampleServiceAppTemplateAssets(): Promise<
  ExampleServiceAppTemplateAssets
> {
  return await loadTemplateMap(EXAMPLE_SERVICE_APP_TEMPLATE_URLS);
}

export async function loadRootScaffoldTemplateAssets(): Promise<
  RootScaffoldTemplateAssets
> {
  return await loadTemplateMap(ROOT_TEMPLATE_URLS);
}

export async function loadAspireHelperTemplateAssets(): Promise<
  AspireHelperTemplateAssets
> {
  return await loadTemplateMap(ASPIRE_HELPER_TEMPLATE_URLS);
}
