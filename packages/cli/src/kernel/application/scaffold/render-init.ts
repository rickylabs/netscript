import { join } from '@std/path';
import { toPascalCase } from '@std/text';
import { PORT_RANGES } from '../../constants/port-ranges.ts';
import { SCAFFOLD_DIRS } from '../../constants/scaffold/scaffold-dirs.ts';
import { SCAFFOLD_FILES } from '../../constants/scaffold/scaffold-files.ts';
import { SCAFFOLD_VERSIONS } from '../../constants/scaffold/scaffold-versions.ts';
import type { ScaffoldResult } from '../../domain/core-types.ts';
import type { ValidatedInitOptions } from '../../domain/scaffold/scaffold-options.ts';
import { generateAppsettings } from '../../templates/aspire/generate-appsettings.ts';
import { generateAspireConfig } from '../../templates/aspire/generate-aspire-config.ts';
import { generateGlobalJson } from '../../templates/aspire/generate-global-json.ts';
import type { InitPipelineContext } from './context.ts';
import { scaffoldTsAppHost } from './render-ts-apphost.ts';
import { loadLegacyAspireTemplateAssets } from '../../adapters/templates/scaffold-template-assets.ts';

export async function scaffoldAspire(
  context: InitPipelineContext,
  options: ValidatedInitOptions,
): Promise<ScaffoldResult> {
  // --no-aspire: skip entirely
  if (options.noAspire) {
    return {
      filesCreated: [],
      directoriesCreated: [],
      filesSkipped: [],
      totalOperations: 0,
      durationMs: 0,
    };
  }

  // TS AppHost mode: generate aspire.config.json, package.json, apphost.mts, .helpers/
  if (!options.legacyAspire) {
    return await scaffoldTsAppHost(context, options);
  }

  const start = performance.now();
  const filesCreated: string[] = [];
  const directoriesCreated: string[] = [];
  const filesSkipped: string[] = [];
  const targetPath = options.targetPath;

  // Derive template variables
  const pascalName = toPascalCase(options.name);
  const namespace = `NetScript.${pascalName}`;
  const userSecretsId = `aspire-${options.name}-${crypto.randomUUID().split('-')[0]}`;

  const appPort = PORT_RANGES.APP.start;
  const {
    apphostCsprojTemplate,
    extensionsCsTemplate,
    launchSettingsTemplate,
    programCsTemplate,
    serviceDefaultsCsprojTemplate,
    telemetryDefaultsCsTemplate,
  } = await loadLegacyAspireTemplateAssets();

  const aspireVars: Record<string, string> = {
    name: options.name,
    namespace,
    appName: options.appName,
    appPort: String(appPort),
    aspireVersion: SCAFFOLD_VERSIONS.ASPIRE_SDK,
    extensionsVersion: SCAFFOLD_VERSIONS.MICROSOFT_EXTENSIONS,
    otelVersion: SCAFFOLD_VERSIONS.OTEL_INSTRUMENTATION,
    scalarVersion: SCAFFOLD_VERSIONS.SCALAR_ASPIRE,
    swashbuckleVersion: SCAFFOLD_VERSIONS.SWASHBUCKLE,
    userSecretsId,
    denoHostingVersion: SCAFFOLD_VERSIONS.ASPIRE_HOSTING_DENO,
  };

  // 1. Create dotnet/ directory
  const dotnetDir = join(targetPath, SCAFFOLD_DIRS.DOTNET);
  await context.scaffolder.createDir(dotnetDir);
  directoriesCreated.push(dotnetDir);

  // 2. Create dotnet/AppHost/ directory
  const apphostDir = join(dotnetDir, SCAFFOLD_DIRS.APPHOST);
  await context.scaffolder.createDir(apphostDir);
  directoriesCreated.push(apphostDir);

  // 3. Create dotnet/AppHost/Properties/ directory
  const propertiesDir = join(apphostDir, SCAFFOLD_DIRS.PROPERTIES);
  await context.scaffolder.createDir(propertiesDir);
  directoriesCreated.push(propertiesDir);

  // 4. Create dotnet/ServiceDefaults/ directory
  const serviceDefaultsDir = join(dotnetDir, SCAFFOLD_DIRS.SERVICE_DEFAULTS);
  await context.scaffolder.createDir(serviceDefaultsDir);
  directoriesCreated.push(serviceDefaultsDir);

  // 5. Render + write AppHost.csproj (Tier 2)
  const apphostCsprojContent = await context.templateAdapter.render(
    apphostCsprojTemplate,
    aspireVars,
  );
  const apphostCsprojPath = join(apphostDir, SCAFFOLD_FILES.APPHOST_CSPROJ);
  if (await context.scaffolder.writeFile(apphostCsprojPath, apphostCsprojContent, options.force)) {
    filesCreated.push(apphostCsprojPath);
  } else {
    filesSkipped.push(apphostCsprojPath);
  }

  // 6. Write Program.cs (Tier 2 — static, render for convention consistency)
  const programCsContent = await context.templateAdapter.render(
    programCsTemplate,
    aspireVars,
  );
  const programCsPath = join(apphostDir, SCAFFOLD_FILES.PROGRAM_CS);
  if (await context.scaffolder.writeFile(programCsPath, programCsContent, options.force)) {
    filesCreated.push(programCsPath);
  } else {
    filesSkipped.push(programCsPath);
  }

  // 7. Render + write launchSettings.json (Tier 2)
  const launchSettingsContent = await context.templateAdapter.render(
    launchSettingsTemplate,
    aspireVars,
  );
  const launchSettingsPath = join(propertiesDir, SCAFFOLD_FILES.LAUNCH_SETTINGS);
  if (
    await context.scaffolder.writeFile(launchSettingsPath, launchSettingsContent, options.force)
  ) {
    filesCreated.push(launchSettingsPath);
  } else {
    filesSkipped.push(launchSettingsPath);
  }

  // 8. Generate + write appsettings.json (Tier 1 — programmatic)
  //    Pass appPort so Program.cs and appsettings.json stay in sync.
  const appsettingsContent = generateAppsettings({
    name: options.name,
    appName: options.appName,
    appPort,
    dbEngine: options.dbEngine,
    service: options.includeExampleService && options.serviceName && options.servicePort
      ? { name: options.serviceName, port: options.servicePort }
      : undefined,
  });
  const appsettingsPath = join(apphostDir, SCAFFOLD_FILES.APPSETTINGS);
  if (await context.scaffolder.writeFile(appsettingsPath, appsettingsContent, options.force)) {
    filesCreated.push(appsettingsPath);
  } else {
    filesSkipped.push(appsettingsPath);
  }

  // 9. Generate + write global.json (Tier 1 — programmatic)
  const globalJsonContent = generateGlobalJson();
  const globalJsonPath = join(dotnetDir, SCAFFOLD_FILES.GLOBAL_JSON);
  if (await context.scaffolder.writeFile(globalJsonPath, globalJsonContent, options.force)) {
    filesCreated.push(globalJsonPath);
  } else {
    filesSkipped.push(globalJsonPath);
  }

  // 10. Generate + write aspire.config.json in project ROOT (Tier 1)
  const aspireConfigContent = generateAspireConfig();
  const aspireConfigPath = join(targetPath, SCAFFOLD_FILES.ASPIRE_CONFIG);
  if (await context.scaffolder.writeFile(aspireConfigPath, aspireConfigContent, options.force)) {
    filesCreated.push(aspireConfigPath);
  } else {
    filesSkipped.push(aspireConfigPath);
  }

  // 11. Render + write ServiceDefaults.csproj (Tier 2)
  const sdCsprojContent = await context.templateAdapter.render(
    serviceDefaultsCsprojTemplate,
    aspireVars,
  );
  const sdCsprojPath = join(serviceDefaultsDir, SCAFFOLD_FILES.SERVICE_DEFAULTS_CSPROJ);
  if (await context.scaffolder.writeFile(sdCsprojPath, sdCsprojContent, options.force)) {
    filesCreated.push(sdCsprojPath);
  } else {
    filesSkipped.push(sdCsprojPath);
  }

  // 12. Render + write Extensions.cs (Tier 2)
  const extensionsCsContent = await context.templateAdapter.render(
    extensionsCsTemplate,
    aspireVars,
  );
  const extensionsCsPath = join(serviceDefaultsDir, SCAFFOLD_FILES.EXTENSIONS_CS);
  if (await context.scaffolder.writeFile(extensionsCsPath, extensionsCsContent, options.force)) {
    filesCreated.push(extensionsCsPath);
  } else {
    filesSkipped.push(extensionsCsPath);
  }

  // 13. Render + write NetScriptTelemetryDefaults.cs (Tier 2)
  const telemetryCsContent = await context.templateAdapter.render(
    telemetryDefaultsCsTemplate,
    aspireVars,
  );
  const telemetryCsPath = join(serviceDefaultsDir, SCAFFOLD_FILES.TELEMETRY_DEFAULTS_CS);
  if (await context.scaffolder.writeFile(telemetryCsPath, telemetryCsContent, options.force)) {
    filesCreated.push(telemetryCsPath);
  } else {
    filesSkipped.push(telemetryCsPath);
  }

  const durationMs = performance.now() - start;
  return {
    filesCreated,
    directoriesCreated,
    filesSkipped,
    totalOperations: filesCreated.length + directoriesCreated.length,
    durationMs,
  };
}
