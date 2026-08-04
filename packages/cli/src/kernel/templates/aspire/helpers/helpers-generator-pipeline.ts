/**
 * @module
 * Composes Aspire helper generators and template assets into GeneratedFile entries.
 */

import type { TemplatePort } from '../../../ports/template-port.ts';
import { HELPERS_FILES } from '../../../constants/helpers-files.ts';
import { SCAFFOLD_ASPIRE_MODULES } from '../../../constants/scaffold/scaffold-aspire.ts';
import { SCAFFOLD_DIRS } from '../../../constants/scaffold/scaffold-dirs.ts';
import { SCAFFOLD_FILES } from '../../../constants/scaffold/scaffold-files.ts';
import {
  type AspireHelperTemplateAssets,
  loadAspireHelperTemplateAssets,
} from '../../../adapters/templates/scaffold-template-assets.ts';
import type {
  ConfigSchemaOptions,
  DbCliModeOptions,
  GeneratedFile,
  HelpersGeneratorOptions,
  RegisterAppsOptions,
  RegisterBackgroundOptions,
  RegisterInfrastructureOptions,
  RegisterPluginsOptions,
  RegisterServicesOptions,
  RegisterToolsOptions,
} from './types.ts';

import { generateConfigSchema } from './generate-config-schema.ts';
import { generateRegisterInfrastructure } from './register/generate-register-infrastructure.ts';
import { generateRegisterServices } from './register/generate-register-services.ts';
import { generateRegisterPlugins } from './register/generate-register-plugins.ts';
import { generateRegisterBackground } from './register/generate-register-background.ts';
import { generateRegisterApps } from './register/generate-register-apps.ts';
import { generateRegisterTools } from './register/generate-register-tools.ts';
import { generateDbCliMode } from './generate-db-cli-mode.ts';
import { generateIndex } from './generate-index.ts';
import { generateTsAspireConfig } from '../generate-aspire-config.ts';

export class HelpersGeneratorPipeline {
  readonly #templateAdapter: TemplatePort | null;

  constructor(templateAdapter?: TemplatePort | null) {
    this.#templateAdapter = templateAdapter ?? null;
  }

  async execute(options: HelpersGeneratorOptions): Promise<GeneratedFile[]> {
    const { config, configPath, generateAppHost } = options;
    const templates = await loadAspireHelperTemplateAssets();
    const files: GeneratedFile[] = [];
    const databaseEngine = config.PrimaryDatabase
      ? config.Databases[config.PrimaryDatabase]?.Engine
      : undefined;

    // 0. Tier 2: Aspire compat shim (D-7 Node.js workaround)
    files.push({
      path: SCAFFOLD_DIRS.HELPERS + '/_aspire-compat.mts',
      content: templates.aspireCompatTemplate,
    });

    // 1. Tier 2: Configure dashboard (always generated)
    files.push(await this.renderConfigureDashboard(templates));

    // 2. Tier 2: tool runner with bounded failure detail capture
    files.push({
      path: `${SCAFFOLD_DIRS.HELPERS}/${HELPERS_FILES.RUN_TOOL}`,
      content: templates.runToolTemplate,
    });

    // 3. Tier 1: Config schema (always generated)
    files.push(this.buildConfigSchema({
      services: config.Services,
      apps: config.Apps,
      plugins: config.Plugins,
      backgroundProcessors: config.BackgroundProcessors,
      databases: config.Databases,
      caches: config.Cache,
      tools: config.Tools,
    }));

    // 3. Tier 1: Register infrastructure
    files.push(this.buildRegisterInfrastructure({
      databases: config.Databases,
      caches: config.Cache,
      primaryDatabase: config.PrimaryDatabase,
      primaryCache: config.PrimaryCache,
    }));

    // 4. Tier 1: DB CLI mode
    files.push(this.buildDbCliMode({
      databases: config.Databases,
    }));

    // 5. Tier 1: Register services (two-pass cross-ref)
    files.push(this.buildRegisterServices({
      services: config.Services,
      version: config.Version,
      denoDefaults: config.Defaults.Deno,
      databaseEngine,
    }));

    // 6. Tier 1: Register plugins (two-pass cross-ref)
    files.push(this.buildRegisterPlugins({
      plugins: config.Plugins,
      version: config.Version,
      denoDefaults: config.Defaults.Deno,
      databaseEngine,
    }));

    // 7. Tier 1: Register background processors
    files.push(this.buildRegisterBackground({
      processors: config.BackgroundProcessors,
      version: config.Version,
      denoDefaults: config.Defaults.Deno,
      databaseEngine,
    }));

    // 8. Tier 1: Register apps
    files.push(this.buildRegisterApps({
      apps: config.Apps,
      version: config.Version,
      denoDefaults: config.Defaults.Deno,
    }));

    // 9. Tier 1: Register tools
    files.push(this.buildRegisterTools({
      tools: config.Tools,
    }));

    // 10. Tier 1: Index barrel + orchestrator (always generated)
    files.push(this.buildIndex());

    // 11. Tier 2: AppHost entry point (optional — default true)
    if (generateAppHost !== false) {
      const operationHelpers = files
        .filter((file) => file.path.startsWith(`${SCAFFOLD_DIRS.HELPERS}/`))
        .map((file) => ({
          path: `db-operation/${file.path}`,
          content: file.path.endsWith(`/${HELPERS_FILES.INDEX}`)
            ? file.content.replace(
              "resolve(await builder.appHostDirectory(), '..')",
              "resolve(await builder.appHostDirectory(), '../..')",
            )
            : file.content,
        }));
      files.push(
        ...operationHelpers,
        await this.renderAppHost(
          configPath ??
            `../${SCAFFOLD_FILES.APPSETTINGS}`,
          templates,
        ),
        await this.renderAppHost(
          configPath ? `../${configPath}` : `../../${SCAFFOLD_FILES.APPSETTINGS}`,
          templates,
          SCAFFOLD_FILES.DB_OPERATION_APPHOST_MTS,
          {
            sdkImport: './.aspire/modules/aspire.mts',
            helpersImport: './.helpers/index.mts',
            prelude: [
              "import { readFileSync } from 'node:fs';",
              "const dbOperationEnv = JSON.parse(readFileSync(new URL('./.netscript-db-operation.json', import.meta.url), 'utf8'));",
              'Object.assign(process.env, dbOperationEnv);',
            ].join('\n'),
          },
        ),
        {
          path: `db-operation/${SCAFFOLD_FILES.ASPIRE_CONFIG}`,
          content: generateTsAspireConfig({
            dbEngines: Object.values(config.Databases).flatMap((entry) => {
              const engine = entry.Engine.toLowerCase();
              return engine === 'postgres' || engine === 'mysql' || engine === 'mssql' ||
                  engine === 'sqlite'
                ? [engine]
                : [];
            }),
            cache: false,
          }),
        },
        {
          path: `db-operation/${SCAFFOLD_FILES.TSCONFIG_APPHOST}`,
          content: JSON.stringify({
            compilerOptions: {
              target: 'ES2022',
              module: 'NodeNext',
              moduleResolution: 'NodeNext',
              allowImportingTsExtensions: true,
              esModuleInterop: true,
              forceConsistentCasingInFileNames: true,
              strict: true,
              skipLibCheck: true,
              noEmit: true,
            },
            include: [
              'apphost.mts',
              '.helpers/_aspire-compat.mts',
              '.helpers/configure-dashboard.mts',
              '.helpers/db-cli-mode.mts',
              '.helpers/index.mts',
              '.helpers/register-*.mts',
              '.aspire/modules/*.mts',
            ],
            exclude: ['node_modules'],
          }, null, 2) + '\n',
        },
      );
    }

    return files;
  }

  buildConfigSchema(options: ConfigSchemaOptions): GeneratedFile {
    return {
      path: `${SCAFFOLD_DIRS.HELPERS}/${HELPERS_FILES.CONFIG_SCHEMA}`,
      content: generateConfigSchema(options),
    };
  }

  buildRegisterInfrastructure(options: RegisterInfrastructureOptions): GeneratedFile {
    return {
      path: `${SCAFFOLD_DIRS.HELPERS}/${HELPERS_FILES.REGISTER_INFRASTRUCTURE}`,
      content: generateRegisterInfrastructure(options),
    };
  }

  /** Generates `.helpers/db-cli-mode.mts` — database operation short-circuit mode. */
  buildDbCliMode(options: DbCliModeOptions): GeneratedFile {
    return {
      path: `${SCAFFOLD_DIRS.HELPERS}/${HELPERS_FILES.DB_CLI_MODE}`,
      content: generateDbCliMode(options),
    };
  }

  buildRegisterServices(options: RegisterServicesOptions): GeneratedFile {
    return {
      path: `${SCAFFOLD_DIRS.HELPERS}/${HELPERS_FILES.REGISTER_SERVICES}`,
      content: generateRegisterServices(options),
    };
  }

  buildRegisterPlugins(options: RegisterPluginsOptions): GeneratedFile {
    return {
      path: `${SCAFFOLD_DIRS.HELPERS}/${HELPERS_FILES.REGISTER_PLUGINS}`,
      content: generateRegisterPlugins(options),
    };
  }

  buildRegisterBackground(options: RegisterBackgroundOptions): GeneratedFile {
    return {
      path: `${SCAFFOLD_DIRS.HELPERS}/${HELPERS_FILES.REGISTER_BACKGROUND}`,
      content: generateRegisterBackground(options),
    };
  }

  buildRegisterApps(options: RegisterAppsOptions): GeneratedFile {
    return {
      path: `${SCAFFOLD_DIRS.HELPERS}/${HELPERS_FILES.REGISTER_APPS}`,
      content: generateRegisterApps(options),
    };
  }

  buildRegisterTools(options: RegisterToolsOptions): GeneratedFile {
    return {
      path: `${SCAFFOLD_DIRS.HELPERS}/${HELPERS_FILES.REGISTER_TOOLS}`,
      content: generateRegisterTools(options),
    };
  }

  buildIndex(): GeneratedFile {
    return {
      path: `${SCAFFOLD_DIRS.HELPERS}/${HELPERS_FILES.INDEX}`,
      content: generateIndex(),
    };
  }

  async renderAppHost(
    configPath: string,
    templates?: AspireHelperTemplateAssets,
    path: string = SCAFFOLD_FILES.APPHOST_MTS,
    imports?: {
      readonly sdkImport: string;
      readonly helpersImport: string;
      readonly prelude?: string;
    },
  ): Promise<GeneratedFile> {
    const resolvedTemplates = templates ?? await loadAspireHelperTemplateAssets();
    const vars: Record<string, string> = {
      configPath,
      sdkImport: imports?.sdkImport ?? SCAFFOLD_ASPIRE_MODULES.SDK_IMPORT_FROM_ROOT,
      helpersImport: imports?.helpersImport ?? SCAFFOLD_ASPIRE_MODULES.HELPERS_IMPORT_FROM_ROOT,
    };

    let content = this.#templateAdapter
      ? await this.#templateAdapter.render(resolvedTemplates.apphostTemplate, vars)
      : renderSimple(resolvedTemplates.apphostTemplate, vars);
    if (imports?.prelude) {
      content = content.replace('const builder = await createBuilder();', `${imports.prelude}\n\nconst builder = await createBuilder();`);
    }

    return {
      path,
      content,
    };
  }

  async renderConfigureDashboard(
    templates?: AspireHelperTemplateAssets,
  ): Promise<GeneratedFile> {
    const resolvedTemplates = templates ?? await loadAspireHelperTemplateAssets();
    const content = this.#templateAdapter
      ? await this.#templateAdapter.render(resolvedTemplates.configureDashboardTemplate, {})
      : resolvedTemplates.configureDashboardTemplate;

    return {
      path: `${SCAFFOLD_DIRS.HELPERS}/${HELPERS_FILES.CONFIGURE_DASHBOARD}`,
      content,
    };
  }
}

export async function generateHelpers(
  options: HelpersGeneratorOptions,
  templateAdapter?: TemplatePort | null,
): Promise<GeneratedFile[]> {
  const pipeline = new HelpersGeneratorPipeline(templateAdapter);
  return await pipeline.execute(options);
}

function renderSimple(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(
    /\{\{\s*(\w+)\s*\}\}/g,
    (_match: string, key: string): string => {
      const value = vars[key];
      if (value === undefined) {
        throw new Error(
          `Template variable "{{${key}}}" is not defined. ` +
            `Available: ${Object.keys(vars).join(', ')}`,
        );
      }
      return value;
    },
  );
}

export type { GeneratedFile, HelpersGeneratorOptions } from './types.ts';
