/**
 * @module templates/aspire/generate-standalone-appsettings
 *
 * Tier 1 generator for the `appsettings.json` of a project scaffolded with
 * `--no-aspire` (#1996): the same file and schema every service, database and
 * config command reads, without AppHost wiring.
 */

import { SCAFFOLD_DEFAULTS } from '../../constants/scaffold/scaffold-defaults.ts';
import type { CacheBackendChoice } from '../../domain/cache-backend.ts';
import type { DbEngineChoice } from '../../domain/db-engine.ts';
import {
  buildCacheBlock,
  buildDatabaseBlock,
  type CacheBlock,
  type DatabaseBlock,
} from './generate-appsettings.ts';

/** Example service wiring for `generateStandaloneAppsettings()`. */
export interface StandaloneAppsettingsServiceOption {
  /** Service key in `NetScriptConfig.Services`. */
  readonly name: string;
  /** Port the service binds when it runs without an orchestrator. */
  readonly port: number;
}

/** Options for generating an Aspire-free `appsettings.json`. */
export interface StandaloneAppsettingsOptions {
  /** Project name (required by NetScript config schema). */
  readonly name: string;
  /** Database engine to register. `'none'` leaves `Databases` empty. */
  readonly dbEngine?: DbEngineChoice;
  /** Whether to register a shared cache resource. */
  readonly cache?: boolean;
  /** Shared cache backend to register. */
  readonly cacheBackend?: CacheBackendChoice;
  /** Optional example service to register. */
  readonly service?: StandaloneAppsettingsServiceOption;
}

/**
 * Re-point a scaffolded database block at infrastructure the developer
 * provisions: `External` mode, no container data path or persistence.
 * SQLite is file-backed and has no provisioning mode.
 */
function toExternalDatabaseBlock(block: DatabaseBlock): DatabaseBlock {
  return block.Engine === 'Sqlite'
    ? { Engine: block.Engine, DatabaseName: block.DatabaseName }
    : { Engine: block.Engine, Mode: 'External', DatabaseName: block.DatabaseName };
}

/**
 * Re-point a scaffolded cache block at infrastructure the developer
 * provisions. Deno KV runs in-process (`Local`); server caches are `External`.
 */
function toExternalCacheBlock(block: CacheBlock): CacheBlock {
  return block.Engine === 'DenoKv'
    ? { Engine: block.Engine, Mode: 'Local', DataPath: block.DataPath }
    : { Engine: block.Engine, Mode: 'External' };
}

/**
 * Generate the `appsettings.json` for a project scaffolded with `--no-aspire`.
 *
 * Same file and schema the service, database and config commands read, so a
 * project without Aspire is operable by the same CLI. Carries the project's
 * infrastructure inventory only — no AppHost wiring (no `Apps`, `Tools`,
 * `Otel` collector or container `Parameters`); databases and caches are
 * `External` because the developer provisions them and supplies their
 * connection strings through the environment.
 *
 * @param options - Project name, database engine, cache, example service.
 * @returns Serialized JSON string with trailing newline.
 */
export function generateStandaloneAppsettings(options: StandaloneAppsettingsOptions): string {
  const dbEngine = options.dbEngine ?? SCAFFOLD_DEFAULTS.DB_ENGINE;
  const cacheEnabled = options.cache ?? SCAFFOLD_DEFAULTS.CACHE_ENABLED;
  const cacheBackend = options.cacheBackend ?? SCAFFOLD_DEFAULTS.CACHE_BACKEND;

  const db = buildDatabaseBlock(dbEngine, options.name);
  const cache = cacheEnabled ? buildCacheBlock(cacheBackend) : undefined;
  const services: Record<string, unknown> = options.service
    ? {
      [options.service.name]: {
        Runtime: 'deno',
        Port: options.service.port,
        Entrypoint: 'src/main.ts',
      },
    }
    : {};

  const netScriptConfig = {
    Name: options.name,
    Version: '1.0.0',
    ...(db ? { PrimaryDatabase: db.key } : {}),
    ...(cache ? { PrimaryCache: cache.key } : {}),
    Databases: db ? { [db.key]: toExternalDatabaseBlock(db.block) } : {},
    Cache: cache ? { [cache.key]: toExternalCacheBlock(cache.block) } : {},
    Services: services,
    Plugins: {},
    BackgroundProcessors: {},
  };
  return JSON.stringify({ NetScript: netScriptConfig }, null, 2) + '\n';
}
