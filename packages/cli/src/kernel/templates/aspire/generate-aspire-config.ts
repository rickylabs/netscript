/**
 * @module templates/aspire/generate-aspire-config
 *
 * Tier 1 generator for `aspire.config.json` (project root).
 *
 * Produces the minimal Aspire CLI configuration pointing to the AppHost
 * project directory.
 */

import { SCAFFOLD_ASPIRE_INTEGRATIONS } from '../../constants/scaffold/scaffold-aspire.ts';
import { SCAFFOLD_DEFAULTS } from '../../constants/scaffold/scaffold-defaults.ts';
import { SCAFFOLD_VERSIONS } from '../../constants/scaffold/scaffold-versions.ts';
import type { CacheBackendChoice } from '../../domain/cache-backend.ts';
import type { DbEngineChoice } from '../../domain/db-engine.ts';

const ASPIRE_EPHEMERAL_PORT = 0;

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
    appHostPath: options?.appHostPath ?? SCAFFOLD_DEFAULTS.ASPIRE_LEGACY_APPHOST_PATH,
  };
  return JSON.stringify(config, null, 2) + '\n';
}

/**
 * Options controlling which NuGet integration packages are declared in the
 * TypeScript AppHost `aspire.config.json`. Each flag toggles an
 * `[AspireExport]`-annotated NuGet. Without the matching package,
 * `aspire restore` omits the capability from `.aspire/modules/aspire.mts`, and the
 * generated `.helpers/register-*.ts` call (e.g. `builder.addPostgres(...)`)
 * throws at runtime.
 *
 * ### Deno orchestration — Aspire.Hosting.JavaScript
 *
 * We emit `Aspire.Hosting.JavaScript` (the Aspire fork's JavaScript hosting
 * integration). After `aspire restore` re-emits `.aspire/modules/aspire.mts`,
 * this exposes `builder.addDenoApp(name, appDir, script)` — the fork's
 * first-class Deno runtime host. Service and plugin `.helpers/register-*.ts`
 * use it instead of the hand-rolled `addExecutable('deno', ...)`, which gives
 * native Deno OpenTelemetry (`WithDenoDefaults()` sets `OTEL_DENO=true` and
 * wires the OTLP exporter — no app-side SDK). The prior CommunityToolkit
 * `addDenoApp` was skipped because its `[AspireExport]` was not honoured for
 * external NuGets in Aspire 13.2; the fork's integration is honoured.
 *
 * Background processors still use `addExecutable('deno', ...)` because they
 * require `--unstable-worker-options` before the script path, which
 * `addDenoApp` (fixed `deno run -A <script>`) cannot express.
 */
export interface TsAspireConfigOptions {
  /** Selected database engine (drives Postgres/MySql packages). */
  readonly dbEngine?: DbEngineChoice;
  /** All configured database engines when more than one is present. */
  readonly dbEngines?: readonly DbEngineChoice[];
  /** Selected cache backend. */
  readonly cacheBackend?: CacheBackendChoice;
  /** Whether a cache resource is configured. */
  readonly cache?: boolean;
}

/**
 * Generate the contents of `aspire.config.json` for TypeScript AppHost mode.
 *
 * Produces the configuration for `aspire start` / `aspire restore` pointing
 * to `apphost.mts` as the TypeScript entry point. The `packages` section is
 * populated based on `options` so every `builder.addXxx(...)` capability
 * emitted by the helpers generator has a matching SDK export after
 * `aspire restore` rebuilds `.aspire/modules/aspire.mts`.
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
  // correctly re-emitted into `.aspire/modules/aspire.mts` by `aspire restore`,
  // unlike the community Deno one — see the comment
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

  if (options?.cache !== false && options?.cacheBackend !== 'deno-kv') {
    const integration = options?.cacheBackend === 'garnet'
      ? SCAFFOLD_ASPIRE_INTEGRATIONS.GARNET
      : SCAFFOLD_ASPIRE_INTEGRATIONS.REDIS;
    packages[integration.PACKAGE_ID] = integration.VERSION;
  }

  packages[SCAFFOLD_ASPIRE_INTEGRATIONS.BROWSERS.PACKAGE_ID] =
    SCAFFOLD_ASPIRE_INTEGRATIONS.BROWSERS.VERSION;

  // JavaScript hosting integration — supplies `builder.addDenoApp(...)` used by
  // the generated service/plugin register helpers. Empty version = fork
  // dev-mode source resolution (see SCAFFOLD_ASPIRE_INTEGRATIONS.JAVASCRIPT).
  packages[SCAFFOLD_ASPIRE_INTEGRATIONS.JAVASCRIPT.PACKAGE_ID] =
    SCAFFOLD_ASPIRE_INTEGRATIONS.JAVASCRIPT.VERSION;

  const config: Record<string, unknown> = {
    appHost: {
      path: 'apphost.mts',
      language: 'typescript/nodejs',
    },
    sdk: {
      version: SCAFFOLD_VERSIONS.ASPIRE_SDK,
    },
    profiles: {
      https: {
        applicationUrl:
          `https://localhost:${ASPIRE_EPHEMERAL_PORT};http://localhost:${ASPIRE_EPHEMERAL_PORT}`,
        environmentVariables: {
          ASPIRE_DASHBOARD_OTLP_HTTP_ENDPOINT_URL:
            `http://localhost:${ASPIRE_EPHEMERAL_PORT}`,
          ASPIRE_ALLOW_UNSECURED_TRANSPORT: 'true',
          ASPIRE_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS: 'true',
          ASPIRE_RESOURCE_SERVICE_ENDPOINT_URL: `https://localhost:${ASPIRE_EPHEMERAL_PORT}`,
        },
      },
    },
  };

  if (Object.keys(packages).length > 0) {
    config.packages = packages;
  }

  return JSON.stringify(config, null, 2) + '\n';
}
