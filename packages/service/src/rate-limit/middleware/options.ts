/** Service rate-limit configuration. @module */
import type { ServiceContext } from '../../types.ts';
import type { RateLimitStore } from '../ports/rate-limit-store.ts';

/** Explicit proxy trust, checked from the socket peer through XFF right to left. */
export type ServiceProxyTrust = false | ((address: string) => boolean);

/**
 * Route-scoped quota configuration for `.withRateLimit()`.
 *
 * @example
 * ```ts
 * import { createMemoryRateLimitStore, type ServiceRateLimitOptions } from '@netscript/service/rate-limit';
 * const options: ServiceRateLimitOptions = {
 *   routes: ['/device/start', '/device/poll'], limit: 10, windowMs: 60_000,
 *   store: createMemoryRateLimitStore(),
 * };
 * ```
 */
export interface ServiceRateLimitOptions {
  /** Exact URL paths, or subtree patterns ending in `/*`. Matches every method. */
  readonly routes: readonly string[];
  /** Maximum accepted requests per key per fixed window. */
  readonly limit: number;
  /** Epoch-aligned window duration in milliseconds. */
  readonly windowMs: number;
  /** Atomic store; share it across instances for a distributed quota. */
  readonly store: RateLimitStore;
  /** Bucket key; defaults to the resolved client address, or a shared `unknown` bucket. */
  readonly key?: (context: ServiceContext) => string | Promise<string>;
  /** Default false, matching the auth transport policy. Trust only known proxy addresses. */
  readonly trustProxy?: ServiceProxyTrust;
  /** Clock returning epoch milliseconds; defaults to Date.now. */
  readonly now?: () => number;
}
