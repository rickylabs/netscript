/**
 * @module infra/config/infrastructure
 */

import { CACHE_PROVIDERS, CACHE_URI_PREFIXES } from '../../constants/providers.ts';
import type { DatabaseConfig, InfrastructureConfig } from '../../domain/infrastructure-config.ts';
import { inferCacheProvider, inferDbProvider } from './infrastructure-connection-strings.ts';
import { resolveCache, resolveDatabase } from './infrastructure-resolvers.ts';

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Raw database/cache entries from appsettings.json NetScript section.
 */
export interface RawInfrastructureEntries {
  databases: Record<string, { Engine?: string; DatabaseName?: string }>;
  cache: Record<string, { Engine?: string }>;
  connectionStrings: Record<string, string>;
  otlpEndpoint: string;
}

/**
 * Detect and resolve all infrastructure configuration for Windows deployment.
 * Merges environment variables, appsettings.json, and Docker container inspection.
 */
export async function detectInfrastructure(
  raw: RawInfrastructureEntries,
): Promise<InfrastructureConfig> {
  // Resolve primary database (first entry or "netscript")
  const dbEntries = Object.entries(raw.databases);
  const [primaryDbName, primaryDbRaw] = dbEntries[0] ?? ['netscript', {}];

  const database = await resolveDatabase(
    primaryDbName,
    primaryDbRaw.Engine,
    raw.connectionStrings,
    primaryDbRaw.DatabaseName,
  );

  // Resolve additional databases (all others)
  const additionalDatabases: Record<string, DatabaseConfig> = {};
  for (const [name, entry] of dbEntries.slice(1)) {
    additionalDatabases[name] = await resolveDatabase(
      name,
      entry.Engine,
      raw.connectionStrings,
      entry.DatabaseName,
    );
  }

  // Also detect databases referenced in connection strings but not in appsettings config
  for (const [name, connStr] of Object.entries(raw.connectionStrings)) {
    if (
      name === primaryDbName ||
      name in additionalDatabases ||
      Object.values(CACHE_PROVIDERS).includes(name as CacheProvider)
    ) {
      continue;
    }
    // Heuristic: skip garnet/redis-like strings
    const lower = connStr.toLowerCase();
    const isCache = Object.values(CACHE_URI_PREFIXES)
      .flat()
      .some((p) => lower.startsWith(p));
    if (isCache) continue;

    additionalDatabases[name] = await resolveDatabase(name, undefined, raw.connectionStrings);
  }

  // Resolve primary cache (first cache entry or "garnet")
  const cacheEntries = Object.entries(raw.cache);
  const [primaryCacheName, primaryCacheRaw] = cacheEntries[0] ?? ['garnet', {}];

  const cache = await resolveCache(
    primaryCacheName,
    primaryCacheRaw.Engine,
    raw.connectionStrings,
  );

  return {
    database,
    cache,
    additionalDatabases,
    otlpEndpoint: raw.otlpEndpoint,
  };
}

type CacheProvider = (typeof CACHE_PROVIDERS)[keyof typeof CACHE_PROVIDERS];

export { inferCacheProvider, inferDbProvider };
