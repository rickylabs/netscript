import { TEMPLATE_KEYS, type TemplateKey } from '../../assets/manifest.ts';
import { readTemplateAsset } from '../templates/template-asset.ts';

const APP_TEMPLATE_URLS = {
  appActionsCssTemplate: TEMPLATE_KEYS.appAssetsComponentsActions,
  appAppTemplate: TEMPLATE_KEYS.appRoutesApp,
  appClientTemplate: TEMPLATE_KEYS.appClient,
  appExamplesIndexRouteTemplate: TEMPLATE_KEYS.appRoutesExamplesIndex,
  appExamplesViewTemplate: TEMPLATE_KEYS.appRoutesExamplesComponentsExamplesView,
  appFeedbackCssTemplate: TEMPLATE_KEYS.appAssetsComponentsFeedback,
  appFormsCssTemplate: TEMPLATE_KEYS.appAssetsComponentsForms,
  appHealthRouteTemplate: TEMPLATE_KEYS.appRoutesHealth,
  appHealthSharedTemplate: TEMPLATE_KEYS.appRoutesSharedHealth,
  appHealthViewTemplate: TEMPLATE_KEYS.appRoutesComponentsHealthView,
  appHomeViewTemplate: TEMPLATE_KEYS.appRoutesComponentsHomeView,
  appIndexRouteTemplate: TEMPLATE_KEYS.appRoutesIndex,
  appLayoutsCssTemplate: TEMPLATE_KEYS.appAssetsLayouts,
  appLayoutTemplate: TEMPLATE_KEYS.appRoutesLayout,
  appMainTemplate: TEMPLATE_KEYS.appMain,
  appRouterTemplate: TEMPLATE_KEYS.appRouter,
  appSurfacesCssTemplate: TEMPLATE_KEYS.appAssetsComponentsSurfaces,
  appThemeToggleTemplate: TEMPLATE_KEYS.appIslandsThemetoggle,
  appTokensCssTemplate: TEMPLATE_KEYS.appAssetsTokens,
  appUiButtonTemplate: TEMPLATE_KEYS.appComponentsUiButton,
  appUiCardTemplate: TEMPLATE_KEYS.appComponentsUiCard,
  appUiModTemplate: TEMPLATE_KEYS.appComponentsUiMod,
  appUtilsTemplate: TEMPLATE_KEYS.appUtils,
} as const;

const EXAMPLE_SERVICE_APP_TEMPLATE_URLS = {
  appExampleServiceHeroTemplate: TEMPLATE_KEYS.appRoutesExamplesComponentsHero,
  appExampleServiceLabPanelTemplate: TEMPLATE_KEYS.appRoutesExamplesComponentsLabPanel,
  appExampleServiceNotesCardTemplate: TEMPLATE_KEYS.appRoutesExamplesComponentsNotesCard,
  appExampleServicePageLayoutTemplate: TEMPLATE_KEYS.appRoutesExamplesComponentsPageLayout,
  appExampleServiceShowcaseSharedTemplate: TEMPLATE_KEYS.appRoutesExamplesSharedServiceShowcase,
  appExampleServiceShowcaseTemplate: TEMPLATE_KEYS.appRoutesExamplesIslandsServiceshowcaselab,
  appExampleServiceSummaryCardTemplate: TEMPLATE_KEYS.appRoutesExamplesComponentsSummaryCard,
  appExampleServiceSummaryPanelTemplate: TEMPLATE_KEYS.appRoutesExamplesComponentsSummaryPanel,
  appExampleServiceTemplate: TEMPLATE_KEYS.appLibExampleService,
  appServiceExampleIndexTemplate: TEMPLATE_KEYS.appRoutesExamplesServiceIndex,
  appServiceExampleLayoutTemplate: TEMPLATE_KEYS.appRoutesExamplesServiceIndexLayout,
  appServiceSummaryPartialTemplate: TEMPLATE_KEYS.appRoutesPartialsExamplesServiceSummary,
  appTelemetryExampleIndexTemplate: TEMPLATE_KEYS.appRoutesExamplesTelemetryIndex,
  appTelemetryExampleViewTemplate: TEMPLATE_KEYS.appRoutesExamplesTelemetryComponentsTelemetryView,
  appTelemetryExampleSharedTemplate: TEMPLATE_KEYS.appRoutesExamplesTelemetrySharedTelemetryTrace,
} as const;

const LEGACY_ASPIRE_TEMPLATE_URLS = {
  apphostCsprojTemplate: TEMPLATE_KEYS.aspireApphost,
  extensionsCsTemplate: TEMPLATE_KEYS.aspireExtensions,
  launchSettingsTemplate: TEMPLATE_KEYS.aspireLaunchsettings,
  programCsTemplate: TEMPLATE_KEYS.aspireProgram,
  serviceDefaultsCsprojTemplate: TEMPLATE_KEYS.aspireServicedefaults,
  telemetryDefaultsCsTemplate: TEMPLATE_KEYS.aspireNetscripttelemetrydefaults,
} as const;

const ROOT_TEMPLATE_URLS = {
  gitignoreTemplate: TEMPLATE_KEYS.workspaceGitignore,
} as const;

const ASPIRE_HELPER_TEMPLATE_URLS = {
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
export type LegacyAspireTemplateAssets = TemplateMap<typeof LEGACY_ASPIRE_TEMPLATE_URLS>;
export type RootScaffoldTemplateAssets = TemplateMap<typeof ROOT_TEMPLATE_URLS>;
export type AspireHelperTemplateAssets = TemplateMap<typeof ASPIRE_HELPER_TEMPLATE_URLS>;

async function loadTemplateMap<T extends Record<string, TemplateKey>>(
  urls: T,
): Promise<TemplateMap<T>> {
  const entries = await Promise.all(
    Object.entries(urls).map(async ([name, url]) => [name, await readTemplateAsset(url)]),
  );
  return Object.fromEntries(entries) as TemplateMap<T>;
}

export async function loadAppScaffoldTemplateAssets(): Promise<AppScaffoldTemplateAssets> {
  return await loadTemplateMap(APP_TEMPLATE_URLS);
}

export async function loadExampleServiceAppTemplateAssets(): Promise<
  ExampleServiceAppTemplateAssets
> {
  return await loadTemplateMap(EXAMPLE_SERVICE_APP_TEMPLATE_URLS);
}

export async function loadLegacyAspireTemplateAssets(): Promise<LegacyAspireTemplateAssets> {
  return await loadTemplateMap(LEGACY_ASPIRE_TEMPLATE_URLS);
}

export async function loadRootScaffoldTemplateAssets(): Promise<RootScaffoldTemplateAssets> {
  return await loadTemplateMap(ROOT_TEMPLATE_URLS);
}

export async function loadAspireHelperTemplateAssets(): Promise<AspireHelperTemplateAssets> {
  return await loadTemplateMap(ASPIRE_HELPER_TEMPLATE_URLS);
}
