/** Service rate-limit configuration. @module */
import type { Principal } from '../../auth/types.ts';
import type { ServiceContext } from '../../types.ts';
import type { RateLimitStore } from '../ports/rate-limit-store.ts';

/** Explicit proxy trust, checked from the socket peer through XFF right to left. */
export type ServiceProxyTrust = false | ((address: string) => boolean);

/**
 * Inputs passed to a custom `.withProcedureRateLimit()` bucket key resolver.
 */
export interface ProcedureRateLimitKeyContext {
  /** Authenticated principal, when authentication ran and succeeded for this call. */
  readonly principal?: Principal;
  /** Caller-supplied or HTTP-resolved client address for unauthenticated public procedures. */
  readonly clientAddress?: string;
  /** Canonical oRPC procedure path segments (for example `['v1', 'orders', 'getOrder']`). */
  readonly procedurePath: readonly string[];
}

/**
 * Procedure-level quota configuration for `.withProcedureRateLimit()`.
 *
 * Wraps an RFC 0008 {@link RateLimitStore} inside the oRPC procedure pipeline.
 * Must use a disjoint store / serialized key prefix from any HTTP-edge
 * `.withRateLimit()` stage so HTTP requests are never double-counted.
 *
 * @example
 * ```ts
 * import {
 *   createMemoryRateLimitStore,
 *   type ServiceProcedureRateLimitOptions,
 * } from '@netscript/service/rate-limit';
 * const options: ServiceProcedureRateLimitOptions = {
 *   limit: 120,
 *   windowMs: 60_000,
 *   store: createMemoryRateLimitStore(),
 *   key: ({ principal, clientAddress, procedurePath }) =>
 *     principal
 *       ? `${String(principal.claims.tenantId ?? 'global')}:${principal.subject}:${procedurePath.join('.')}`
 *       : `addr:${clientAddress ?? 'unknown'}:${procedurePath.join('.')}`,
 * };
 * ```
 */
export interface ServiceProcedureRateLimitOptions {
  /**
   * Quota budget per `windowMs` (maximum accepted calls per fixed window, or
   * sustained rate numerator `limit / windowMs` and default burst for GCRA stores).
   */
  readonly limit: number;
  /**
   * Quota window duration in milliseconds (epoch-aligned for fixed-window stores,
   * or rate denominator `limit / windowMs` for GCRA stores).
   */
  readonly windowMs: number;
  /** Atomic quota store; must be disjoint from any HTTP-edge `withRateLimit()` store. */
  readonly store: RateLimitStore;
  /**
   * Bucket key resolver. Defaults to `${tenantId}:${principal.subject}` when
   * authenticated, or `addr:${rateLimitAddressKey(clientAddress, ipv6Prefix)}`
   * (falling back to `'addr:unknown'` with a one-time warning) when unauthenticated.
   */
  readonly key?: (context: ProcedureRateLimitKeyContext) => string | Promise<string>;
  /**
   * Explicit proxy trust used when deriving `clientAddress` from HTTP requests if
   * `context.clientAddress` is not explicitly supplied. Defaults to `false`.
   */
  readonly trustProxy?: ServiceProxyTrust;
  /**
   * Native IPv6 address-key prefix length, 0–128; defaults to /64.
   * Mapped IPv4 uses native IPv4 keys; custom keys are unchanged.
   */
  readonly ipv6Prefix?: number;
  /** Clock returning epoch milliseconds; defaults to `Date.now`. */
  readonly now?: () => number;
}

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
  /**
   * Quota budget per `windowMs` (maximum accepted requests per fixed window, or
   * sustained rate numerator `limit / windowMs` and default burst for GCRA stores).
   */
  readonly limit: number;
  /**
   * Quota window duration in milliseconds (epoch-aligned for fixed-window stores,
   * or rate denominator `limit / windowMs` for GCRA stores).
   */
  readonly windowMs: number;
  /** Atomic store; share it across instances for a distributed quota. */
  readonly store: RateLimitStore;
  /** Bucket key; defaults to the resolved client address, or a shared `unknown` bucket. */
  readonly key?: (context: ServiceContext) => string | Promise<string>;
  /** Default false, matching the auth transport policy. Trust only known proxy addresses. */
  readonly trustProxy?: ServiceProxyTrust;
  /**
   * Native IPv6 address-key prefix length, 0–128; defaults to /64.
   * Mapped IPv4 uses native IPv4 keys; custom keys are unchanged.
   */
  readonly ipv6Prefix?: number;
  /** Clock returning epoch milliseconds; defaults to Date.now. */
  readonly now?: () => number;
}
