/**
 * @module
 *
 * Generator for `.helpers/index.mts` — the barrel + orchestrator file that
 * exports `createNetScriptAppHost()`. This is the single entry point that
 * parses project configuration and registers all resources with the Aspire
 * SDK builder in the correct order following C# NuGet semantics.
 *
 * Registration order:
 * 1. Dashboard OTLP endpoint configuration
 * 2. Infrastructure (databases + caches)
 * 3. DB CLI short-circuit mode
 * 4. Services (two-pass with cross-reference wiring)
 * 5. Plugins (two-pass with plugin→plugin + plugin→service refs)
 * 6. Background processors (workers, sagas, triggers)
 * 7. Applications (web apps, Tauri desktop, task apps)
 * 8. Development tools (Prisma Studio, etc.)
 *
 * Empty sections produce no-op functions in their respective modules —
 * the index file always includes all registration phases.
 */

import { fileHeader } from './_utils.ts';
import { HELPERS_FILES } from '../../../constants/helpers-files.ts';
import { SCAFFOLD_ASPIRE_MODULES } from '../../../constants/scaffold/scaffold-aspire.ts';
import { TEMPLATE_KEYS } from '../../../assets/manifest.ts';
import { renderTemplateAssetSync } from '../../../adapters/templates/template-asset.ts';

/**
 * Generates the `.helpers/index.mts` file content — the barrel + orchestrator
 * that exports `createNetScriptAppHost()`.
 *
 * This generator takes no options because the index file always includes all
 * registration phases. Empty sections produce no-op functions in their
 * respective modules.
 *
 * @returns Generated TypeScript source as a string
 */
export function generateIndex(): string {
  // Derive module names without extensions for function import names
  const configDashboardModule = helperRuntimeImport(HELPERS_FILES.CONFIGURE_DASHBOARD);
  const infraModule = helperRuntimeImport(HELPERS_FILES.REGISTER_INFRASTRUCTURE);
  const dbCliModeModule = helperRuntimeImport(HELPERS_FILES.DB_CLI_MODE);
  const servicesModule = helperRuntimeImport(HELPERS_FILES.REGISTER_SERVICES);
  const pluginsModule = helperRuntimeImport(HELPERS_FILES.REGISTER_PLUGINS);
  const backgroundModule = helperRuntimeImport(HELPERS_FILES.REGISTER_BACKGROUND);
  const appsModule = helperRuntimeImport(HELPERS_FILES.REGISTER_APPS);
  const toolsModule = helperRuntimeImport(HELPERS_FILES.REGISTER_TOOLS);

  return renderTemplateAssetSync(TEMPLATE_KEYS.generatedAspireHelpersGenerateIndex1, {
    __slot0__: String(fileHeader(HELPERS_FILES.INDEX)),
    __slot1__: String(SCAFFOLD_ASPIRE_MODULES.ASPIRE_COMPAT_IMPORT),
    __slot2__: String(SCAFFOLD_ASPIRE_MODULES.SDK_IMPORT_FROM_HELPERS),
    __slot3__: String(configDashboardModule),
    __slot4__: String(infraModule),
    __slot5__: String(dbCliModeModule),
    __slot6__: String(servicesModule),
    __slot7__: String(pluginsModule),
    __slot8__: String(backgroundModule),
    __slot9__: String(appsModule),
    __slot10__: String(toolsModule),
  });
}

function helperRuntimeImport(fileName: string): string {
  return `./${fileName.replace(/\.mts$/, '.mjs')}`;
}
