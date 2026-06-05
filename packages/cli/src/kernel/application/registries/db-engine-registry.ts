/**
 * @module application/registries/db-engine-registry
 *
 * Provider registry for database engines supported by the CLI capability.
 */

import { ScaffoldValidationError } from '../../domain/errors.ts';
import type { DbEngine, DbEngineProvider } from '../../domain/db-engine.ts';
import {
  mssqlProvider,
  mysqlProvider,
  postgresProvider,
  sqliteProvider,
} from '../../adapters/database/providers/database-providers.ts';
import { Registry } from '../abstracts/registry.ts';

/** Ordered default database engine providers. */
export const DEFAULT_DB_ENGINE_PROVIDERS: readonly DbEngineProvider[] = Object.freeze([
  postgresProvider,
  mysqlProvider,
  mssqlProvider,
  sqliteProvider,
]);

/** Registry that resolves database engine metadata by engine identifier. */
export class DbEngineRegistry extends Registry<DbEngine, DbEngineProvider> {
  override readonly id = 'db-engines';

  readonly #providers = new Map<DbEngine, DbEngineProvider>();

  /**
   * Creates a new registry from provider metadata.
   *
   * @param providers - Providers to register. Defaults to all supported engines.
   */
  constructor(providers: readonly DbEngineProvider[] = DEFAULT_DB_ENGINE_PROVIDERS) {
    super();
    for (const provider of providers) {
      this.register(provider.engine, provider);
    }
  }

  /** Register or replace provider metadata for an engine. */
  override register(engine: DbEngine, provider: DbEngineProvider): void {
    this.#providers.set(engine, provider);
  }

  /**
   * Resolve provider metadata for an engine.
   *
   * @param engine - Database engine identifier.
   * @returns Matching engine provider.
   * @throws {ScaffoldValidationError} When the engine is not registered.
   */
  override get(engine: DbEngine): DbEngineProvider {
    const provider = this.#providers.get(engine);
    if (!provider) {
      throw new ScaffoldValidationError(`Unsupported database engine: ${engine}`, {
        engine,
        supportedEngines: this.engines(),
      });
    }
    return provider;
  }

  /** List registered providers in deterministic order. */
  override entries(): readonly (readonly [DbEngine, DbEngineProvider])[] {
    return [...this.#providers.entries()].sort(([left], [right]) => left.localeCompare(right));
  }

  /**
   * Check whether an engine is registered.
   *
   * @param engine - Database engine identifier.
   * @returns `true` when a provider exists for the engine.
   */
  has(engine: DbEngine): boolean {
    return this.#providers.has(engine);
  }

  /**
   * List supported engine identifiers in registry order.
   *
   * @returns Supported database engines.
   */
  engines(): readonly DbEngine[] {
    return [...this.#providers.keys()];
  }

  /**
   * Return the immutable provider map.
   *
   * @returns Provider map keyed by engine.
   */
  getAll(): ReadonlyMap<DbEngine, DbEngineProvider> {
    return this.#providers;
  }
}
