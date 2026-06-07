/**
 * Shared KV instance lifecycle management.
 *
 * Uses a **provider registry** so that server-only adapters (Redis/Garnet)
 * are never statically imported from this module. Backend services opt-in
 * by importing `@netscript/kv/redis`, which self-registers via
 * {@linkcode registerKvAdapter}. Frontend/SSR apps that only import
 * `@netscript/kv` never pull `ioredis` into their bundle.
 *
 * @module
 */

import { createPackageLogger } from '@netscript/logger';
import { DenoKvAdapter } from '../adapters/deno-kv.adapter.ts';
import type { WatchableKv } from '../types/watchable-kv.ts';
import {
  autoDetectProvider,
  getDenoKvConnectionFromEnv,
  getRedisConnectionFromEnv,
  maskRedisUrl,
} from './auto-detect.ts';
import { KvConnectionError } from './errors.ts';

const logger = createPackageLogger('kv');
const DEFAULT_REDIS_NAMESPACE = 'kv';

// ---------------------------------------------------------------------------
// Adapter Registry — Dependency Inversion for optional KV backends
// ---------------------------------------------------------------------------

/**
 * Factory function that creates a `WatchableKv` for a given provider.
 *
 * Registered via {@linkcode registerKvAdapter} and invoked lazily by
 * {@linkcode initializeKv} when the matching provider is auto-detected.
 */
export type KvAdapterFactory = (options: {
  url?: string;
  namespace?: string;
}) => WatchableKv;

const adapterRegistry = new Map<string, KvAdapterFactory>();

/**
 * Register an adapter factory for a KV provider name.
 *
 * Called as a side-effect when importing a provider entrypoint
 * (e.g. `import '@netscript/kv/redis'` registers the `'redis'` factory).
 *
 * @param provider - Provider key (e.g. `'redis'`)
 * @param factory - Factory that creates a `WatchableKv` instance
 *
 * @example
 * ```ts
 * // In @netscript/kv/redis.ts (self-registration on import):
 * registerKvAdapter('redis', ({ url, namespace }) =>
 *   new RedisKvAdapter({ url, namespace }),
 * );
 * ```
 */
export function registerKvAdapter(
  provider: string,
  factory: KvAdapterFactory,
): void {
  adapterRegistry.set(provider, factory);
}

/**
 * Providers supported by the shared KV lifecycle helpers.
 */
export type KvProvider = 'redis' | 'deno-kv' | 'nitro' | 'auto';

/**
 * Options for configuring the shared KV instance.
 */
export interface SharedKvConfig {
  /**
   * Force a specific provider.
   *
   * `auto` inspects the environment and chooses the best available backend.
   */
  provider?: KvProvider;

  /**
   * Deno KV path or URL.
   */
  path?: string;

  /**
   * Explicit Redis connection URL.
   */
  redisUrl?: string;

  /**
   * Prefix used for Redis-backed keys.
   */
  redisNamespace?: string;

  /**
   * Skip environment-based provider detection.
   */
  skipServiceDiscovery?: boolean;
}

let sharedAdapter: WatchableKv | null = null;
let rawKvInstance: Deno.Kv | null = null;
let initPromise: Promise<WatchableKv> | null = null;
let activeProvider: Exclude<KvProvider, 'auto'> | null = null;
let activeKvPath: string | undefined;

/**
 * Resolve the shared `WatchableKv` singleton.
 *
 * @param config - Optional initialization overrides used on first access
 * @returns The shared KV adapter
 */
export function getKv(config?: SharedKvConfig): Promise<WatchableKv> {
  if (sharedAdapter) {
    return Promise.resolve(sharedAdapter);
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = initializeKv(config)
    .then((adapter) => {
      sharedAdapter = adapter;
      return adapter;
    })
    .finally(() => {
      initPromise = null;
    });

  return initPromise;
}

/**
 * Resolve the raw `Deno.Kv` instance when the shared provider is Deno KV.
 *
 * @param config - Optional initialization overrides used on first access
 * @returns The underlying Deno KV instance
 * @throws {KvConnectionError} When the active provider is not Deno KV
 */
export async function getRawKv(config?: SharedKvConfig): Promise<Deno.Kv> {
  await getKv(config);

  if (activeProvider !== 'deno-kv' || !rawKvInstance) {
    throw new KvConnectionError(
      'getRawKv() is only available when @netscript/kv is using the Deno KV provider.',
    );
  }

  return rawKvInstance;
}

/**
 * Return the currently active provider, if initialization has completed.
 *
 * @returns The active provider or `null` before initialization
 */
export function getActiveProvider(): KvProvider | null {
  return activeProvider;
}

/**
 * Return the Deno KV path currently in use, or the discovered default.
 *
 * @returns The active or discovered Deno KV path
 */
export function getKvPath(): string | undefined {
  return activeKvPath ?? getDenoKvConnectionFromEnv();
}

/**
 * Check whether the shared adapter has been initialized.
 *
 * @returns `true` when the singleton exists
 */
export function isKvInitialized(): boolean {
  return sharedAdapter !== null;
}

/**
 * Close and clear the shared adapter state.
 */
export async function closeKv(): Promise<void> {
  const adapter = sharedAdapter;
  const rawKv = rawKvInstance;
  sharedAdapter = null;
  initPromise = null;
  activeProvider = null;
  activeKvPath = undefined;
  rawKvInstance = null;

  if (adapter) {
    await adapter.close();
  }

  if (!adapter && rawKv) {
    rawKv.close();
  }
}

/**
 * Reset the shared state for tests or isolated validation runs.
 */
export async function resetKv(): Promise<void> {
  await closeKv();
}

async function initializeKv(config?: SharedKvConfig): Promise<WatchableKv> {
  const requestedProvider = config?.provider ?? 'auto';
  const selection = requestedProvider === 'auto' && !config?.skipServiceDiscovery
    ? autoDetectProvider()
    : resolveExplicitProvider(requestedProvider, config);

  if (selection.provider === 'redis') {
    const factory = adapterRegistry.get('redis');
    if (!factory) {
      throw new KvConnectionError(
        'Redis/Garnet KV provider was auto-detected but the Redis adapter is not registered. ' +
          "Add `import '@netscript/kv/redis';` to your service entrypoint to opt-in. " +
          'Frontend/SSR apps should use Deno KV instead (set CACHE_PROVIDER=denokv).',
      );
    }

    activeProvider = 'redis';
    activeKvPath = undefined;
    const namespace = config?.redisNamespace ?? DEFAULT_REDIS_NAMESPACE;
    logger.info('Initializing shared Redis KV adapter', {
      url: selection.url ? maskRedisUrl(selection.url) : undefined,
      namespace,
    });
    return factory({ url: selection.url, namespace });
  }

  if (selection.provider === 'nitro') {
    throw new KvConnectionError(
      'Nitro KV auto-detection is reserved for the future NitroKvAdapter and is not implemented yet.',
    );
  }

  activeProvider = 'deno-kv';
  activeKvPath = selection.url;
  logger.info('Initializing shared Deno KV adapter', {
    path: selection.url ?? ':default:',
  });
  rawKvInstance = await Deno.openKv(selection.url);
  return new DenoKvAdapter(rawKvInstance);
}

function resolveExplicitProvider(
  provider: KvProvider,
  config?: SharedKvConfig,
): { provider: Exclude<KvProvider, 'auto'>; url?: string } {
  if (provider === 'redis') {
    const url = config?.redisUrl ?? getRedisConnectionFromEnv();
    if (!url) {
      throw new KvConnectionError(
        'Redis provider requested but no Redis connection could be discovered.',
      );
    }

    return { provider, url };
  }

  if (provider === 'nitro') {
    return { provider };
  }

  return {
    provider: 'deno-kv',
    url: config?.path ?? getDenoKvConnectionFromEnv(),
  };
}
