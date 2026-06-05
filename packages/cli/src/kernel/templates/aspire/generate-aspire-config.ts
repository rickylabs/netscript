/**
 * @module templates/aspire/generate-aspire-config
 *
 * Tier 1 generator for `aspire.config.json` (project root).
 *
 * Produces the minimal Aspire CLI configuration pointing to the AppHost
 * project directory.
 */

import { PORT_RANGES } from '../../constants/port-ranges.ts';
import { SCAFFOLD_ASPIRE_INTEGRATIONS } from '../../constants/scaffold/scaffold-aspire.ts';
import { SCAFFOLD_DEFAULTS } from '../../constants/scaffold/scaffold-defaults.ts';
import { SCAFFOLD_VERSIONS } from '../../constants/scaffold/scaffold-versions.ts';
import type { DbEngineChoice } from '../../domain/db-engine.ts';

/** Options for generating `aspire.config.json`. */
export interface AspireConfigOptions {
  /** Path to the AppHost project relative to the workspace root. */
  readonly appHostPath?: string;
}

/**
 * Generate the contents of `aspire.config.json`.
 *
 * @param options - Optional overrides for AppHost path.
 * @returns Serialized JSON string with trailing newline.
 */
export function generateAspireConfig(options?: AspireConfigOptions): string {
  const config = {
    appHostPath: options?.appHostPath ?? SCAFFOLD_DEFAULTS.ASPIRE_APPHOST_PATH,
  };
  return JSON.stringify(config, null, 2) + '\n';
}

/**
 * Options controlling which NuGet integration packages are declared in the
 * TypeScript AppHost `aspire.config.json`. Each flag toggles an
 * `[AspireExport]`-annotated NuGet. Without the matching package,
 * `aspire restore` omits the capability from `.modules/aspire.ts`, and the
 * generated `.helpers/register-*.ts` call (e.g. `builder.addPostgres(...)`)
 * throws at runtime.
 *
 * ### Deno orchestration — intentionally no NuGet
 *
 * We deliberately do NOT emit `CommunityToolkit.Aspire.Hosting.Deno`. Its
 * `addDenoApp(...)` extension is `[AspireExport]`-annotated, but in Aspire
 * 13.2 the export decorator is only honoured for types declared inside the
 * AppHost project itself — external NuGet packages are skipped. Shipping
 * the beta NuGet in the scaffold would therefore surface as a dead import.
 * Instead every generated `.helpers/register-*.ts` uses the SDK primitive
 * `builder.addExecutable('deno', ...)`, which works today and needs no
 * integration package. Revisit when Aspire 13.3 lands (GH aspire#15119 /
 * aspire#16220).
 */
export interface TsAspireConfigOptions {
  /** Selected database engine (drives Postgres/MySql packages). */
  readonly dbEngine?: DbEngineChoice;
  /** All configured database engines when more than one is present. */
  readonly dbEngines?: readonly DbEngineChoice[];
}

/**
 * Generate the contents of `aspire.config.json` for TypeScript AppHost mode.
 *
 * Produces the configuration for `aspire run` / `aspire restore` pointing
 * to `apphost.ts` as the TypeScript entry point. The `packages` section is
 * populated based on `options` so every `builder.addXxx(...)` capability
 * emitted by the helpers generator has a matching SDK export after
 * `aspire restore` rebuilds `.modules/aspire.ts`.
 *
 * @param options - Which integration packages the scaffold needs.
 * @returns Serialized JSON string with trailing newline.
 */
export function generateTsAspireConfig(options?: TsAspireConfigOptions): string {
  const packages: Record<string, string> = {};
  const dbEngines = options?.dbEngines ??
    (options?.dbEngine ? [options.dbEngine] : []);

  // Database integrations — mirror the engine→method map in
  // generate-register-infrastructure.ts (Postgres/addPostgres,
  // Mysql/addMySql, Mssql/addSqlServer, Sqlite/addConnectionString
  // (no NuGet needed)).
  // These are official Microsoft NuGets whose `[AspireExport]` wrappers are
  // correctly re-emitted into `.modules/aspire.ts` by `aspire restore` under
  // the `preview` channel, unlike the community Deno one — see the comment
  // on `TsAspireConfigOptions` above.
  for (const engine of dbEngines) {
    switch (engine) {
      case 'postgres':
        packages[SCAFFOLD_ASPIRE_INTEGRATIONS.POSTGRES.PACKAGE_ID] =
          SCAFFOLD_ASPIRE_INTEGRATIONS.POSTGRES.VERSION;
        break;
      case 'mysql':
        packages[SCAFFOLD_ASPIRE_INTEGRATIONS.MYSQL.PACKAGE_ID] =
          SCAFFOLD_ASPIRE_INTEGRATIONS.MYSQL.VERSION;
        break;
      case 'mssql':
        packages[SCAFFOLD_ASPIRE_INTEGRATIONS.MSSQL.PACKAGE_ID] =
          SCAFFOLD_ASPIRE_INTEGRATIONS.MSSQL.VERSION;
        break;
      case 'sqlite':
      case 'none':
        // No integration NuGet needed.
        break;
    }
  }

  const config: Record<string, unknown> = {
    appHost: {
      path: 'apphost.ts',
      language: 'typescript/nodejs',
    },
    sdk: {
      version: SCAFFOLD_VERSIONS.ASPIRE_SDK,
    },
    channel: 'preview',
    profiles: {
      https: {
        applicationUrl: `https://localhost:${PORT_RANGES.ASPIRE_DASHBOARD};http://localhost:${
          PORT_RANGES.ASPIRE_DASHBOARD + 1
        }`,
        environmentVariables: {
          ASPIRE_DASHBOARD_OTLP_HTTP_ENDPOINT_URL: `http://localhost:${PORT_RANGES.OTEL_COLLECTOR}`,
          ASPIRE_ALLOW_UNSECURED_TRANSPORT: 'true',
          ASPIRE_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS: 'true',
          ASPIRE_RESOURCE_SERVICE_ENDPOINT_URL: `https://localhost:${
            PORT_RANGES.ASPIRE_DASHBOARD + 3
          }`,
        },
      },
    },
  };

  if (Object.keys(packages).length > 0) {
    config.packages = packages;
  }

  return JSON.stringify(config, null, 2) + '\n';
}
