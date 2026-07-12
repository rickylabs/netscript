/**
 * Factory for creating kvdex database instances backed by `@netscript/kv`.
 *
 * Provides {@linkcode createNetscriptDb}, which auto-detects the active KV
 * provider and returns a kvdex database wired to the correct backend:
 *
 * - **Deno KV** — passes the native `Deno.Kv` instance directly to kvdex
 *   (zero-overhead path).
 * - **Redis / Garnet** — wraps the `WatchableKv` adapter in a
 *   {@linkcode WatchableKvBridge} so kvdex sees a DenoKv-compatible interface.
 * - **Memory** — uses kvdex's built-in `MapKv` from `@olli/kvdex/kv/map`.
 *
 * @module
 */

import { kvdex, type SchemaDefinition } from '@olli/kvdex';
import { MapKv } from '@olli/kvdex/kv/map';
import { createPackageLogger } from '@netscript/logger';
import { getActiveProvider, getKv, getRawKv } from '../application/shared.ts';
import { WatchableKvBridge } from './denokv-bridge.ts';

import type { KvProvider } from '../application/shared.ts';
export type { KvProvider } from '../application/shared.ts';

const logger = createPackageLogger('kv:kvdex');

/** Accepted recursive collection schema published by kvdex. */
export type KvdexSchema = SchemaDefinition;

/**
 * Options for {@linkcode createNetscriptDb}.
 */
export interface CreateNetscriptDbOptions {
  /**
   * Force a specific provider instead of auto-detecting.
   *
   * - `"deno-kv"` — use native Deno KV (requires Deno runtime with KV support)
   * - `"redis"` — use the Redis/Garnet WatchableKv adapter via bridge
   * - `"memory"` — use kvdex's built-in MapKv (in-memory, no persistence)
   * - `"auto"` (default) — detect from the initialized `@netscript/kv` provider
   */
  provider?: KvProvider | 'memory';
}

/**
 * Create a kvdex database instance backed by the active `@netscript/kv`
 * provider.
 *
 * The returned database is fully typed according to the provided schema and
 * supports collections, secondary indexes, atomic operations, and all other
 * kvdex features.
 *
 * @param schema  - kvdex schema definition (collections, models, indices)
 * @param options - Optional overrides for provider selection
 * @returns A kvdex database instance
 *
 * @example
 * ```ts
 * import { collection, model } from '@olli/kvdex';
 * import { createNetscriptDb } from '@netscript/kv/kvdex';
 *
 * const db = await createNetscriptDb({
 *   users: collection(model<{ name: string; age: number }>(), {
 *     indices: {
 *       name: 'primary',
 *       age: 'secondary',
 *     },
 *   }),
 * });
 *
 * await db.users.add({ name: 'Alice', age: 30 });
 * const { result } = await db.users.findBySecondaryIndex('age', 30);
 * ```
 */
export async function createNetscriptDb<T extends KvdexSchema>(
  schema: T,
  options?: CreateNetscriptDbOptions,
): Promise<ReturnType<typeof kvdex<T>>> {
  const requestedProvider = options?.provider ?? 'auto';
  const resolvedProvider = resolveProvider(requestedProvider);

  logger.info('Creating kvdex database', { provider: resolvedProvider });

  switch (resolvedProvider) {
    case 'deno-kv': {
      const rawKv = await getRawKv();
      logger.debug('Using native Deno.Kv for kvdex (zero-overhead path)');
      return kvdex({ kv: rawKv, schema });
    }

    case 'redis': {
      const watchableKv = await getKv();
      const bridge = new WatchableKvBridge(watchableKv);
      logger.debug('Using WatchableKvBridge for kvdex (Redis/Garnet backend)');
      return kvdex({ kv: bridge, schema });
    }

    case 'memory': {
      const mapKv = new MapKv();
      logger.debug('Using MapKv for kvdex (in-memory backend)');
      return kvdex({ kv: mapKv, schema });
    }

    default: {
      // Unreachable if resolveProvider works correctly, but fail loudly
      throw new Error(
        `Unsupported kvdex provider: ${resolvedProvider}. ` +
          'Expected "deno-kv", "redis", or "memory".',
      );
    }
  }
}

/**
 * Resolve the effective provider when `"auto"` is requested.
 *
 * Falls back to `"memory"` when the shared KV singleton has not been
 * initialized yet (e.g. in test environments).
 */
function resolveProvider(
  requested: KvProvider | 'memory',
): 'deno-kv' | 'redis' | 'memory' {
  if (requested !== 'auto') {
    if (requested === 'nitro') {
      throw new Error(
        'Nitro provider is not yet supported for kvdex integration.',
      );
    }
    return requested as 'deno-kv' | 'redis' | 'memory';
  }

  const active = getActiveProvider();

  if (!active) {
    logger.warn(
      'No active KV provider detected; falling back to in-memory MapKv. ' +
        'Call getKv() before createNetscriptDb() to use the configured provider.',
    );
    return 'memory';
  }

  switch (active) {
    case 'deno-kv':
      return 'deno-kv';
    case 'redis':
      return 'redis';
    default:
      logger.warn(
        `Unknown active provider "${active}"; falling back to in-memory MapKv.`,
      );
      return 'memory';
  }
}
