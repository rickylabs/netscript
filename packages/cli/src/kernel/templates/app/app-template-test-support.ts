import { MemoryFileSystemAdapter } from '../../adapters/scaffold/memory-fs.ts';
import { StringTemplateAdapter } from '../../adapters/scaffold/template-adapter.ts';
import { readTemplateAsset } from '../../adapters/templates/template-asset.ts';
import { TEMPLATE_KEYS } from '../../assets/manifest.ts';
import {
  loadAppScaffoldTemplateAssets,
  loadExampleServiceAppTemplateAssets,
} from '../../adapters/templates/scaffold-template-assets.ts';

export const SAMPLE_APP_VARS = {
  name: 'test-project',
  appName: 'dashboard',
  appPort: '8010',
  serviceName: 'team-members',
} as const;

export function makeAdapter(): StringTemplateAdapter {
  return new StringTemplateAdapter(new MemoryFileSystemAdapter());
}

const appTemplates = await loadAppScaffoldTemplateAssets();

export const {
  appAppTemplate,
  appClientTemplate,
  appDesignComponentsRouteTemplate,
  appDesignCompositionRouteTemplate,
  appDesignCssTemplate,
  appDesignFloatingSurfaceDemoTemplate,
  appDesignIndexRouteTemplate,
  appDesignLayoutTemplate,
  appDesignRegistryTemplate,
  appDesignTokenClipboardTemplate,
  appDesignTokensLibTemplate,
  appDesignTokensRouteTemplate,
  appExamplesIndexRouteTemplate,
  appExamplesViewTemplate,
  appHealthRouteTemplate,
  appHealthSharedTemplate,
  appHealthViewTemplate,
  appHomeViewTemplate,
  appIndexRouteTemplate,
  appLayoutTemplate,
  appRouterTemplate,
  appUtilsTemplate,
} = appTemplates;

const exampleTemplates = await loadExampleServiceAppTemplateAssets();

export const appExampleServiceTemplate = exampleTemplates.appExampleServiceTemplate;
export const appServiceExampleHeroTemplate = exampleTemplates.appExampleServiceHeroTemplate;
export const appServiceExampleLabPanelTemplate = exampleTemplates.appExampleServiceLabPanelTemplate;
export const appServiceExampleNotesCardTemplate =
  exampleTemplates.appExampleServiceNotesCardTemplate;
export const appServiceExamplePageLayoutTemplate =
  exampleTemplates.appExampleServicePageLayoutTemplate;
export const appServiceShowcaseIslandTemplate = exampleTemplates.appExampleServiceShowcaseTemplate;
export const appServiceShowcaseSharedTemplate =
  exampleTemplates.appExampleServiceShowcaseSharedTemplate;
export const appServiceSummaryCardTemplate = exampleTemplates.appExampleServiceSummaryCardTemplate;
export const appServiceSummaryPanelTemplate =
  exampleTemplates.appExampleServiceSummaryPanelTemplate;
export const appServiceExampleIndexTemplate = exampleTemplates.appServiceExampleIndexTemplate;
export const appServiceExampleLayoutTemplate = exampleTemplates.appServiceExampleLayoutTemplate;
export const appServiceSummaryPartialTemplate = exampleTemplates.appServiceSummaryPartialTemplate;

export const serviceContractTemplate = await readTemplateAsset(TEMPLATE_KEYS.serviceContract);
export const serviceV1RouterTemplate = await readTemplateAsset(TEMPLATE_KEYS.serviceRoutersV1);
