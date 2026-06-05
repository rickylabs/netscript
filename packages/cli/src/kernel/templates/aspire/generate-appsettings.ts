/**
 * @module templates/aspire/generate-appsettings
 *
 * Tier 1 generator for `appsettings.json`.
 *
 * Produces the initial NetScript infrastructure config compatible with
 * the `@netscript/aspire` `parseAppSettings()` schema. Every section
 * (`Services`, `Databases`, `Apps`, `PrimaryDatabase`) is driven by
 * options — nothing is hardcoded per engine or per service.
 */

import { PORT_RANGES } from '../../constants/port-ranges.ts';
import { SCAFFOLD_DEFAULTS } from '../../constants/scaffold/scaffold-defaults.ts';
import type { DbEngineChoice } from '../../domain/db-engine.ts';

/** Example service wiring for `generateAppsettings()`. */
export interface AppsettingsServiceOption {
  /** Service key in `NetScriptConfig.Services`. */
  readonly name: string;
  /** HTTP port. Must fall in `PORT_RANGES.SERVICE`. */
  readonly port: number;
}

/** Options for generating `appsettings.json`. */
export interface AppsettingsOptions {
  /** Project name (required by NetScript config schema). */
  readonly name?: string;
  /** Application name. Defaults to SCAFFOLD_DEFAULTS.APP_NAME. */
  readonly appName?: string;
  /** Application port. Defaults to PORT_RANGES.APP start. */
  readonly appPort?: number;
  /** OTEL collector endpoint port. Defaults to PORT_RANGES.OTEL_COLLECTOR. */
  readonly otelPort?: number;
  /** Aspire dashboard port. Defaults to PORT_RANGES.ASPIRE_DASHBOARD. */
  readonly dashboardPort?: number;
  /** Database engine to register. `'none'` omits the Databases block. */
  readonly dbEngine?: DbEngineChoice;
  /** Optional example service to register. */
  readonly service?: AppsettingsServiceOption;
}

/** JSON shape of a Databases entry. */
interface DatabaseBlock {
  readonly Engine: 'Postgres' | 'Mysql' | 'Mssql' | 'Sqlite';
  readonly Mode?: 'Container' | 'External';
  readonly DatabaseName?: string;
  readonly Persistent?: boolean;
}

interface ToolBlock {
  readonly Enabled: boolean;
  readonly TaskName: string;
  readonly Database: string;
  readonly Description: string;
}

/**
 * Derive an Aspire-safe container database resource name from a project name.
 *
 * Aspire's resource-name validator (`PostgresServerResource._addDatabaseInternal`,
 * likewise for MySql) accepts only `[A-Za-z0-9-]` — no underscores, no dots.
 * This helper kebab-cases the project name, strips leading/trailing dashes,
 * falls back to `'app'` for empty input, and appends a `-db` suffix.
 *
 * Must be used anywhere the scaffold emits `DatabaseName` for a container
 * engine (appsettings.json AND the helpers-generator config in pipeline.ts),
 * otherwise the two code paths drift and the AppHost throws at startup.
 *
 * @param projectName - Raw project name from `--name` / interactive prompt.
 * @param suffix - Optional database key/engine suffix for multi-engine projects.
 * @returns Kebab-cased resource name, e.g. `aspire_full` → `aspire-full-db` or
 *   `aspire_full` + `mysql` → `aspire-full-mysql-db`.
 */
export function deriveContainerDbResourceName(projectName: string, suffix?: string): string {
  const kebab = projectName
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'app';
  const safeSuffix = suffix
    ?.toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return safeSuffix ? `${kebab}-${safeSuffix}-db` : `${kebab}-db`;
}

/**
 * Derive a SQLite-safe file name from a project name. SQLite's DatabaseName
 * is a file path, not an Aspire resource name, so it's exempt from the
 * kebab-only validator and may use underscores.
 *
 * @param projectName - Raw project name from `--name` / interactive prompt.
 * @returns File name with `.db` suffix, e.g. `my app` → `my_app.db`.
 */
export function deriveSqliteDbFileName(projectName: string): string {
  const safe = projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  return `${safe}.db`;
}

/**
 * Build the `Databases` section and `PrimaryDatabase` key for a chosen
 * engine. Returns a key, block, and primary-key so the caller can splat
 * them into the NetScript config.
 *
 * SQLite lives outside Aspire's managed container integrations, so the
 * helpers generator emits `addConnectionString()` for it rather than
 * `addSqlite()`. The appsettings block is otherwise shaped the same as
 * the container engines.
 *
 * @param engine - Choice from the interactive prompt / `--db` flag.
 * @param projectName - Project name used to derive `DatabaseName`.
 * @returns `undefined` when `engine === 'none'`; otherwise a `{ key, block }`.
 */
function buildDatabaseBlock(
  engine: DbEngineChoice,
  projectName: string,
): { readonly key: string; readonly block: DatabaseBlock } | undefined {
  if (engine === 'none') return undefined;
  // Container engines use the kebab-safe name. SQLite is
  // exempt because its DatabaseName is a file path, not an Aspire resource
  // name. See `deriveContainerDbResourceName` for the validator contract.
  const kebabDbName = deriveContainerDbResourceName(projectName);
  const sqliteDbFile = deriveSqliteDbFileName(projectName);
  switch (engine) {
    case 'postgres':
      return {
        key: 'postgres',
        block: {
          Engine: 'Postgres',
          Mode: 'Container',
          DatabaseName: kebabDbName,
          Persistent: true,
        },
      };
    case 'mysql':
      return {
        key: 'mysql',
        block: {
          Engine: 'Mysql',
          Mode: 'Container',
          DatabaseName: kebabDbName,
          Persistent: true,
        },
      };
    case 'mssql':
      return {
        key: 'mssql',
        block: {
          Engine: 'Mssql',
          Mode: 'Container',
          DatabaseName: kebabDbName,
          Persistent: true,
        },
      };
    case 'sqlite':
      return {
        key: 'sqlite',
        block: {
          Engine: 'Sqlite',
          DatabaseName: sqliteDbFile,
        },
      };
  }
}

/**
 * Build default development tools for a scaffolded project.
 *
 * When a database is present, enable Prisma Studio by default so the TS
 * AppHost emits the same Prisma UI resource the main repo exposes.
 *
 * @param primaryDatabase - Primary database key, when configured.
 * @returns Tool map compatible with `NetScript.Tools`.
 */
export function buildDefaultTools(
  primaryDatabase?: string,
): Record<string, ToolBlock> {
  if (!primaryDatabase) {
    return {};
  }

  return {
    'prisma-studio': {
      Enabled: true,
      TaskName: 'db:studio',
      Database: primaryDatabase,
      Description: 'Prisma Studio for database management',
    },
  };
}

/**
 * Generate the contents of `appsettings.json`.
 *
 * Produces a config compatible with `@netscript/aspire` `parseAppSettings()`.
 *
 * @param options - Database engine, optional example service, port overrides.
 * @returns Serialized JSON string with trailing newline.
 */
export function generateAppsettings(options?: AppsettingsOptions): string {
  const name = options?.name ?? 'my-app';
  const appName = options?.appName ?? SCAFFOLD_DEFAULTS.APP_NAME;
  const appPort = options?.appPort ?? PORT_RANGES.APP.start;
  const otelPort = options?.otelPort ?? PORT_RANGES.OTEL_COLLECTOR;
  const dbEngine = options?.dbEngine ?? SCAFFOLD_DEFAULTS.DB_ENGINE;

  const db = buildDatabaseBlock(dbEngine, name);

  const services: Record<string, unknown> = {};
  if (options?.service) {
    services[options.service.name] = {
      Runtime: 'deno',
      Port: options.service.port,
      Entrypoint: 'src/main.ts',
    };
  }

  const netScriptConfig: Record<string, unknown> = {
    Name: name,
    Version: '1.0.0',
    Otel: {
      HttpEndpoint: `http://localhost:${otelPort}`,
      Protocol: 'http/protobuf',
    },
  };

  if (db) {
    netScriptConfig.PrimaryDatabase = db.key;
  }

  Object.assign(netScriptConfig, {
    Databases: db ? { [db.key]: db.block } : {},
    Cache: {},
    Services: services,
    Plugins: {},
    BackgroundProcessors: {},
    Apps: {
      [appName]: {
        Runtime: 'deno',
        Type: 'app',
        Port: appPort,
        ...(options?.service ? { ServiceReferences: [options.service.name] } : {}),
      },
    },
    Tools: buildDefaultTools(db?.key),
  });

  const config = { NetScript: netScriptConfig };
  return JSON.stringify(config, null, 2) + '\n';
}
