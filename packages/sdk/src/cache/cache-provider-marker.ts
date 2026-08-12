import type { CacheProvider } from './cache-provider.ts';

/**
 * Internal marker proving that a provider owns the package cache span.
 *
 * This identity is deliberately package-instance-local because the dependency-closure coherence
 * gate, not this marker, owns coherent SDK closure enforcement. An unsupported split closure
 * treats a foreign `CacheQuery` as unowned and wraps it again, producing duplicate spans with
 * incomplete topology; successful calls omit outcome rather than masquerading as provider errors.
 * A contract-version value stored under `Symbol.for()` could provide cross-instance recognition
 * and version discrimination, but that would create a separate split-closure compatibility
 * contract.
 */
export const cacheTelemetryOwner: unique symbol = Symbol('netscript.cache.telemetry-owner');

/** Test whether a provider owns cache telemetry at the mandatory seam. */
export function ownsCacheTelemetry(provider: CacheProvider): boolean {
  return cacheTelemetryOwner in provider && Reflect.get(provider, cacheTelemetryOwner) === true;
}
