/**
 * Auto-detection helpers for choosing the active KV provider.
 */

import { createPackageLogger } from '@netscript/logger';

const logger = createPackageLogger('kv');

const REDIS_ENV_KEYS = ['REDIS_URI', 'GARNET_URI'] as const;
const REDIS_CONNECTION_STRING_KEYS = [
  'ConnectionStrings__redis',
  'ConnectionStrings__garnet',
] as const;
const REDIS_SERVICE_DISCOVERY_KEYS = [
  'REDIS_TCP',
  'GARNET_TCP',
  'services__redis__tcp__0',
  'services__redis__http__0',
  'services__redis__0',
  'services__garnet__tcp__0',
  'services__garnet__http__0',
  'services__garnet__0',
] as const;
const DENO_KV_ENV_KEYS = ['KV_URL', 'DENO_KV_URL'] as const;
const DENO_KV_SERVICE_DISCOVERY_KEYS = [
  'services__kv__http__0',
  'services__kv__sqlite__0',
] as const;

export interface AutoDetectedProvider {
  provider: 'redis' | 'deno-kv';
  url?: string;
}

/**
 * Mask a Redis URL for safe logging.
 *
 * @param url - Raw Redis connection URL
 * @returns URL with the password redacted
 */
export function maskRedisUrl(url: string): string {
  return url.replace(/:[^:@]+@/, ':***@');
}

/**
 * Read a Redis connection string from the current environment.
 *
 * @returns A normalized Redis URL when one can be discovered
 */
export function getRedisConnectionFromEnv(): string | undefined {
  for (const key of REDIS_ENV_KEYS) {
    const value = Deno.env.get(key);
    if (value) {
      return value;
    }
  }

  for (const key of REDIS_CONNECTION_STRING_KEYS) {
    const connectionString = Deno.env.get(key);
    if (!connectionString) {
      continue;
    }

    const parts = connectionString.split(',');
    const hostPort = parts[0];
    const params = new Map(
      parts.slice(1).map((part) => {
        const [paramKey, paramValue] = part.split('=');
        return [paramKey.toLowerCase(), paramValue] as const;
      }),
    );

    const protocol = params.get('ssl')?.toLowerCase() === 'true' ? 'rediss' : 'redis';
    const password = params.get('password');

    return password ? `${protocol}://:${password}@${hostPort}` : `${protocol}://${hostPort}`;
  }

  for (const key of REDIS_SERVICE_DISCOVERY_KEYS) {
    const value = Deno.env.get(key);
    if (!value) {
      continue;
    }

    if (value.startsWith('redis://') || value.startsWith('rediss://')) {
      return value;
    }

    return `redis://${value.replace('tcp://', '').replace('http://', '')}`;
  }

  return undefined;
}

/**
 * Read a Deno KV path or URL from the current environment.
 *
 * @returns Deno KV connection information when present
 */
export function getDenoKvConnectionFromEnv(): string | undefined {
  for (const key of DENO_KV_SERVICE_DISCOVERY_KEYS) {
    const value = Deno.env.get(key);
    if (value) {
      return value;
    }
  }

  for (const key of DENO_KV_ENV_KEYS) {
    const value = Deno.env.get(key);
    if (value) {
      return value;
    }
  }

  return undefined;
}

/**
 * Detect the preferred KV provider from the current environment.
 *
 * @returns The chosen provider and any discovered connection URL/path
 */
export function autoDetectProvider(): AutoDetectedProvider {
  const cacheProvider = Deno.env.get('CACHE_PROVIDER')?.toLowerCase();

  if (cacheProvider === 'denokv' || cacheProvider === 'deno-kv') {
    const url = getDenoKvConnectionFromEnv();
    logger.debug('CACHE_PROVIDER forced Deno KV', { cacheProvider, url });
    return { provider: 'deno-kv', url };
  }

  if (cacheProvider === 'redis' || cacheProvider === 'garnet') {
    const url = getRedisConnectionFromEnv();
    if (url) {
      logger.debug('CACHE_PROVIDER forced Redis KV backend', {
        cacheProvider,
        url: maskRedisUrl(url),
      });
      return { provider: 'redis', url };
    }

    logger.warn('CACHE_PROVIDER requested Redis but no Redis connection was discovered', {
      cacheProvider,
    });
  }

  if (Deno.env.get('NITRO_PRESET')) {
    logger.debug('Nitro runtime detected; falling back to current Deno KV implementation', {
      nitroPreset: Deno.env.get('NITRO_PRESET'),
    });
  }

  const redisUrl = getRedisConnectionFromEnv();
  if (redisUrl) {
    logger.debug('Auto-detected Redis KV backend', { url: maskRedisUrl(redisUrl) });
    return { provider: 'redis', url: redisUrl };
  }

  const denoKvUrl = getDenoKvConnectionFromEnv();
  if (denoKvUrl) {
    logger.debug('Auto-detected Deno KV backend', { url: denoKvUrl });
    return { provider: 'deno-kv', url: denoKvUrl };
  }

  logger.debug('Falling back to local Deno KV');
  return { provider: 'deno-kv' };
}
