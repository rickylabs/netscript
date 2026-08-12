import type { CacheProvider } from './cache-provider.ts';

/**
 * Internal marker proving that a provider owns the package cache span.
 *
 * This identity is deliberately package-instance-local. Incoherent SDK closures are rejected by
 * the #1589 gate; a global symbol would instead mask incompatible cross-version closures. An
 * unsupported split closure may therefore duplicate spans rather than silently interoperate.
 */
export const cacheTelemetryOwner: unique symbol = Symbol('netscript.cache.telemetry-owner');

/** Test whether a provider owns cache telemetry at the mandatory seam. */
export function ownsCacheTelemetry(provider: CacheProvider): boolean {
  return cacheTelemetryOwner in provider && Reflect.get(provider, cacheTelemetryOwner) === true;
}
