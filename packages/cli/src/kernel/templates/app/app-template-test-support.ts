import { MemoryFileSystemAdapter } from '../../adapters/scaffold/memory-fs.ts';
import { StringTemplateAdapter } from '../../adapters/scaffold/template-adapter.ts';
import { readTemplateAsset } from '../../adapters/templates/template-asset.ts';
import { TEMPLATE_KEYS } from '../../assets/manifest.ts';
import {
  loadAppScaffoldTemplateAssets,
  loadExampleServiceAppTemplateAssets,
  loadResourceSliceTemplateAssets,
} from '../../adapters/templates/scaffold-template-assets.ts';

export const SAMPLE_APP_VARS = {
  name: 'test-project',
  appName: 'dashboard',
  appPort: '8010',
  serviceName: 'team-members',
  modelName: 'TeamMember',
  serviceResourceRouteAlias: 'teamMembers: generatedRoutes.examples.teamMembers.$route,\n  ',
  serviceExampleRouteReference: 'routes.examples.teamMembers.$route',
} as const;

export function makeAdapter(): StringTemplateAdapter {
  return new StringTemplateAdapter(new MemoryFileSystemAdapter());
}

const appTemplates = await loadAppScaffoldTemplateAssets();

export const {
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
  appUtilsTemplate,
} = appTemplates;

const exampleTemplates = await loadExampleServiceAppTemplateAssets();

export const appExampleServiceQueryTemplate = exampleTemplates.appExampleServiceQueryTemplate;
export const appTelemetryExampleSharedTemplate = exampleTemplates.appTelemetryExampleSharedTemplate;

export const resourceSliceTemplates = await loadResourceSliceTemplateAssets();

export const serviceContractTemplate = await readTemplateAsset(
  TEMPLATE_KEYS.serviceContract,
);
export const serviceV1RouterTemplate = await readTemplateAsset(
  TEMPLATE_KEYS.serviceRoutersV1,
);
