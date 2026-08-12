import type { CacheProvider } from './cache-provider.ts';

/** Internal marker proving that a provider owns the package cache span. */
export const cacheTelemetryOwner: unique symbol = Symbol('netscript.cache.telemetry-owner');

/** Test whether a provider owns cache telemetry at the mandatory seam. */
export function ownsCacheTelemetry(provider: CacheProvider): boolean {
  return cacheTelemetryOwner in provider && Reflect.get(provider, cacheTelemetryOwner) === true;
}
