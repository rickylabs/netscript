import { join } from '@std/path';
import { PORT_RANGES } from '../../../constants/port-ranges.ts';
import { SCAFFOLD_DEFAULTS } from '../../../constants/scaffold/scaffold-defaults.ts';
import { SCAFFOLD_FILES } from '../../../constants/scaffold/scaffold-files.ts';
import type { ValidatedInitOptions } from '../../../domain/scaffold/scaffold-options.ts';
import { generateAppDenoJson } from '../../../adapters/templates/app/generate-app-deno-json.ts';
import { generateAppViteConfig } from '../../../adapters/templates/app/generate-vite-config.ts';
import {
  loadAppScaffoldTemplateAssets,
  loadExampleServiceAppTemplateAssets,
} from '../../../adapters/templates/scaffold-template-assets.ts';
import { DEFAULT_UI_INIT_ITEMS, installUiRegistryItems } from '../../ui/registry.ts';
import type { InitPipelineContext } from '../context.ts';
import { adjustLocalBase } from '../support/helpers.ts';
import { createScaffoldPlan } from '../../../domain/scaffold/scaffold-plan.ts';
import { generateRouteManifestSeed, generateRoutesSeed } from './app-route-seeds.ts';
import { writeExampleServiceAppFiles } from './write-example-service-app-files.ts';

export async function writeNormalizedAppFiles(
  context: InitPipelineContext,
  options: ValidatedInitOptions,
  appDir: string,
  overwrite: boolean,
  filesCreated: string[],
  filesSkipped: string[],
  directoriesCreated: string[],
): Promise<void> {
  const appPort = options.legacyAspire ? PORT_RANGES.APP.start : PORT_RANGES.APP.start + 10;
  const plan = createScaffoldPlan(options, {
    useWorkspacePackages: context.packagesAsWorkspaceMembers(options),
  });
  const appTemplateVars = {
    name: options.name,
    appName: options.appName,
    appPort: String(appPort),
    serviceName: plan.service?.name ?? SCAFFOLD_DEFAULTS.SERVICE_NAME,
  };
  const {
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
    appHealthRouteTemplate,
    appHealthSharedTemplate,
    appHealthViewTemplate,
    appHomeViewTemplate,
    appIndexRouteTemplate,
    appLayoutTemplate,
    appMainTemplate,
    appRouterTemplate,
    appUiModTemplate,
    appUtilsTemplate,
  } = await loadAppScaffoldTemplateAssets();

  const write = async (targetPath: string, content: string) => {
    if (await context.scaffolder.writeFile(targetPath, content, overwrite)) {
      filesCreated.push(targetPath);
    } else {
      filesSkipped.push(targetPath);
    }
  };

  const createDir = async (dirPath: string) => {
    await context.scaffolder.createDir(dirPath);
    directoriesCreated.push(dirPath);
  };

  const routesDir = join(appDir, 'routes');
  const examplesRoutesDir = join(routesDir, 'examples');
  const routeComponentsDir = join(routesDir, '(_components)');
  const routeSharedDir = join(routesDir, '(_shared)');
  const designGroupDir = join(routesDir, '(design)');
  const designRoutesDir = join(designGroupDir, 'design');
  const designComponentsDir = join(designRoutesDir, '(_components)');
  const designIslandsDir = join(designRoutesDir, '(_islands)');
  const designSharedDir = join(designRoutesDir, '(_shared)');
  const examplesComponentsDir = join(examplesRoutesDir, '(_components)');
  const generatedDir = join(appDir, '.generated');
  const componentsDir = join(appDir, 'components');
  const uiComponentsDir = join(componentsDir, 'ui');
  const assetsDir = join(appDir, 'assets');
  const libDir = join(appDir, 'lib');
  const partialsDir = join(routesDir, 'partials');
  const partialsExamplesDir = join(partialsDir, 'examples');
  const serviceExampleDir = options.serviceName
    ? join(examplesRoutesDir, options.serviceName)
    : undefined;
  const serviceExampleComponentsDir = serviceExampleDir
    ? join(serviceExampleDir, '(_components)')
    : undefined;
  const serviceExampleIslandsDir = serviceExampleDir
    ? join(serviceExampleDir, '(_islands)')
    : undefined;
  const serviceExampleSharedDir = serviceExampleDir
    ? join(serviceExampleDir, '(_shared)')
    : undefined;
  const serviceExamplePartialDir = options.serviceName
    ? join(partialsExamplesDir, options.serviceName)
    : undefined;
  const telemetryExampleDir = join(examplesRoutesDir, 'telemetry');
  const telemetryExampleComponentsDir = join(telemetryExampleDir, '(_components)');
  const telemetryExampleSharedDir = join(telemetryExampleDir, '(_shared)');

  await createDir(routesDir);
  await createDir(examplesRoutesDir);
  await createDir(routeComponentsDir);
  await createDir(routeSharedDir);
  await createDir(designGroupDir);
  await createDir(designRoutesDir);
  await createDir(designComponentsDir);
  await createDir(designIslandsDir);
  await createDir(designSharedDir);
  await createDir(examplesComponentsDir);
  await createDir(generatedDir);
  await createDir(componentsDir);
  await createDir(uiComponentsDir);
  await createDir(assetsDir);
  await createDir(libDir);
  if (options.includeExampleService) {
    if (
      serviceExampleDir && serviceExampleComponentsDir && serviceExampleIslandsDir &&
      serviceExampleSharedDir && serviceExamplePartialDir
    ) {
      await createDir(partialsDir);
      await createDir(partialsExamplesDir);
      await createDir(serviceExampleDir);
      await createDir(serviceExampleComponentsDir);
      await createDir(serviceExampleIslandsDir);
      await createDir(serviceExampleSharedDir);
      await createDir(serviceExamplePartialDir);
    }
    await createDir(telemetryExampleDir);
    await createDir(telemetryExampleComponentsDir);
    await createDir(telemetryExampleSharedDir);
  }

  const appDenoJsonPath = join(appDir, SCAFFOLD_FILES.DENO_JSON);
  const appDenoJson = generateAppDenoJson({
    projectName: options.name,
    appName: options.appName,
    importMode: options.importMode,
    localBase: options.localBase ? adjustLocalBase(options.localBase, 2) : undefined,
    packagesAsWorkspaceMembers: plan.useWorkspacePackages,
    jsrResolver: context.jsrResolver,
  });
  await write(appDenoJsonPath, appDenoJson);
  const uiInstall = await installUiRegistryItems({
    projectRoot: appDir,
    names: DEFAULT_UI_INIT_ITEMS,
    overwrite: true,
  }, { fs: context.fs });
  for (const copiedFile of uiInstall.copiedFiles) {
    if (!filesCreated.includes(copiedFile)) filesCreated.push(copiedFile);
  }
  if (!filesCreated.includes(uiInstall.stylesPath)) filesCreated.push(uiInstall.stylesPath);
  await write(join(assetsDir, 'design.css'), appDesignCssTemplate);
  await write(
    join(appDir, 'client.ts'),
    appClientTemplate,
  );
  await write(
    join(appDir, SCAFFOLD_FILES.MAIN),
    await context.templateAdapter.render(appMainTemplate, appTemplateVars),
  );
  await write(join(appDir, 'utils.ts'), appUtilsTemplate);
  await write(
    join(appDir, 'router.ts'),
    await context.templateAdapter.render(appRouterTemplate, appTemplateVars),
  );
  await write(join(generatedDir, 'manifest.ts'), generateRouteManifestSeed());
  await write(join(generatedDir, 'routes.ts'), generateRoutesSeed());
  await write(join(uiComponentsDir, 'mod.ts'), appUiModTemplate);
  await write(join(designSharedDir, 'registry.ts'), appDesignRegistryTemplate);
  await write(join(designSharedDir, 'tokens.ts'), appDesignTokensLibTemplate);
  await write(
    join(designIslandsDir, 'FloatingSurfaceDemo.tsx'),
    appDesignFloatingSurfaceDemoTemplate,
  );
  await write(join(designIslandsDir, 'TokenClipboard.tsx'), appDesignTokenClipboardTemplate);
  await write(
    join(routesDir, '_app.tsx'),
    await context.templateAdapter.render(appAppTemplate, appTemplateVars),
  );
  await write(
    join(routesDir, 'index.tsx'),
    await context.templateAdapter.render(appIndexRouteTemplate, appTemplateVars),
  );
  await write(
    join(routeComponentsDir, 'home-view.tsx'),
    await context.templateAdapter.render(appHomeViewTemplate, appTemplateVars),
  );
  await write(
    join(routesDir, 'dashboard.tsx'),
    await context.templateAdapter.render(appDashboardRouteTemplate, appTemplateVars),
  );
  await write(
    join(routeComponentsDir, 'dashboard-view.tsx'),
    await context.templateAdapter.render(appDashboardViewTemplate, appTemplateVars),
  );
  await write(
    join(routesDir, '_layout.tsx'),
    await context.templateAdapter.render(appLayoutTemplate, appTemplateVars),
  );
  await write(
    join(routesDir, 'health.tsx'),
    await context.templateAdapter.render(appHealthRouteTemplate, appTemplateVars),
  );
  await write(
    join(routeComponentsDir, 'health-view.tsx'),
    await context.templateAdapter.render(appHealthViewTemplate, appTemplateVars),
  );
  await write(
    join(routeSharedDir, 'health.ts'),
    await context.templateAdapter.render(appHealthSharedTemplate, appTemplateVars),
  );
  await write(
    join(designRoutesDir, '_layout.tsx'),
    await context.templateAdapter.render(appDesignLayoutTemplate, appTemplateVars),
  );
  await write(join(designRoutesDir, 'index.tsx'), appDesignIndexRouteTemplate);
  await write(join(designRoutesDir, 'tokens.tsx'), appDesignTokensRouteTemplate);
  await write(join(designComponentsDir, 'tokens-view.tsx'), appDesignTokensViewTemplate);
  await write(join(designRoutesDir, 'components.tsx'), appDesignComponentsRouteTemplate);
  await write(join(designComponentsDir, 'components-view.tsx'), appDesignComponentsViewTemplate);
  await write(join(designRoutesDir, 'composition.tsx'), appDesignCompositionRouteTemplate);
  await write(
    join(designComponentsDir, 'composition-view.tsx'),
    appDesignCompositionViewTemplate,
  );
  await write(
    join(examplesRoutesDir, 'index.tsx'),
    await context.templateAdapter.render(appExamplesIndexRouteTemplate, appTemplateVars),
  );
  await write(
    join(examplesComponentsDir, 'examples-view.tsx'),
    await context.templateAdapter.render(appExamplesViewTemplate, appTemplateVars),
  );
  await write(
    join(examplesRoutesDir, 'crud.tsx'),
    await context.templateAdapter.render(appCrudExampleRouteTemplate, appTemplateVars),
  );
  await write(
    join(examplesComponentsDir, 'crud-view.tsx'),
    await context.templateAdapter.render(appCrudExampleViewTemplate, appTemplateVars),
  );
  if (
    options.includeExampleService && serviceExampleDir &&
    serviceExampleComponentsDir && serviceExampleIslandsDir &&
    serviceExampleSharedDir && serviceExamplePartialDir
  ) {
    await writeExampleServiceAppFiles({
      context,
      appTemplateVars,
      templates: await loadExampleServiceAppTemplateAssets(),
      write,
      hasDatabase: options.dbEngine !== 'none',
      libDir,
      serviceExampleDir,
      serviceExampleComponentsDir,
      serviceExampleIslandsDir,
      serviceExampleSharedDir,
      serviceExamplePartialDir,
      telemetryExampleDir,
      telemetryExampleComponentsDir,
      telemetryExampleSharedDir,
    });
  }
  await write(
    join(appDir, 'vite.config.ts'),
    generateAppViteConfig({ appName: options.appName }),
  );
}
