/** Rate-limit domain values, policy contracts, and fixed-window calculations. @module */

/** Supported first-party quota policy kinds. */
export const RATE_LIMIT_POLICY_KINDS: readonly ['fixed-window', 'gcra'] = [
  'fixed-window',
  'gcra',
] as const;

/** Identifier of a first-party rate-limit policy. */
export type RateLimitPolicyKind = (typeof RATE_LIMIT_POLICY_KINDS)[number];

/**
 * Quota admission policy for first-party rate-limit stores.
 *
 * Rolling quota sharing is scoped to a single coherent policy precondition:
 * callers sharing a store/prefix to share one quota must pass the same
 * `(limit, windowMs, burst)` tuple; differing tuples select independent
 * policy-scoped buckets.
 *
 * - `'fixed-window'`: epoch-aligned fixed windows (default).
 * - `'gcra'`: alignment-independent Generic Cell Rate Algorithm with an O(1)
 *   stored record per key and fixed skew-bounded retention; `burst`
 *   defaults to the request's `limit`.
 *
 * @example
 * ```ts
 * import type { RateLimitPolicy } from '@netscript/service/rate-limit';
 * const rolling: RateLimitPolicy = { kind: 'gcra', burst: 5 };
 * console.log(rolling.kind);
 * ```
 */
export type RateLimitPolicy =
  | { readonly kind: 'fixed-window' }
  | { readonly kind: 'gcra'; readonly burst?: number };

/** Input to one atomic quota reservation. */
export interface RateLimitRequest {
  /** Caller-defined bucket identity, shared across the selected routes. */
  readonly key: string;
  /**
   * Quota budget per `windowMs` (maximum reservations per fixed window, or
   * sustained rate numerator `limit / windowMs` and default burst for GCRA);
   * a positive safe integer.
   */
  readonly limit: number;
  /**
   * Quota window duration in milliseconds (epoch-aligned window for fixed
   * windows, or rate denominator `limit / windowMs` for GCRA); a positive safe
   * integer.
   */
  readonly windowMs: number;
  /** Epoch milliseconds supplied by the middleware's clock. */
  readonly now: number;
  /** Request cancellation, checked before IO and between CAS attempts. */
  readonly signal?: AbortSignal;
}

/** Result of a quota reservation, including conservative contention/capacity rejection. */
export interface RateLimitDecision {
  /** True only when a slot was atomically reserved. */
  readonly allowed: boolean;
  /**
   * Epoch milliseconds at which the key's quota fully resets under unchanged
   * state and policy (epoch-aligned window end for fixed windows; full burst
   * recovery for GCRA). On contention or capacity exhaustion denials under
   * GCRA, this is an advisory upper-horizon timestamp rather than an exact
   * recovery guarantee.
   */
  readonly resetAt: number;
  /**
   * Retry target in epoch milliseconds when `allowed` is `false`:
   * - On a GCRA quota-exhaustion denial (unchanged stored state, single
   *   coherent policy, and retained KV record within the documented skew
   *   bound), the exact earliest representable epoch millisecond at which one
   *   subsequent reservation commits cleanly (never rounded down; if no
   *   representable commit instant exists, `consume()` rejects with
   *   `RangeError`).
   * - On KV CAS contention exhaustion or memory `maxKeys` saturation, an
   *   advisory backoff timestamp (`now < retryAt <= resetAt`), not an
   *   eligibility guarantee.
   *
   * Omitted when `allowed` is `true` and omitted by the default fixed-window
   * policy (where retry timing equals `resetAt`). Callers computing
   * `Retry-After` use `decision.retryAt ?? decision.resetAt`.
   */
  readonly retryAt?: number;
}

/** @internal Validates positive safe-integer quota bounds (`limit`, `windowMs`). */
export function validateRateLimitBounds(limit: number, windowMs: number): void {
  for (const [name, value] of [['limit', limit], ['windowMs', windowMs]] as const) {
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new RangeError(`rateLimit.${name} must be a positive safe integer`);
    }
  }
}

/** @internal Validates request quota bounds and non-negative epoch timestamp. */
export function validateRateLimitRequest(request: RateLimitRequest): void {
  validateRateLimitBounds(request.limit, request.windowMs);
  if (!Number.isSafeInteger(request.now) || request.now < 0) {
    throw new RangeError('rateLimit.now must be non-negative epoch milliseconds');
  }
}

/** @internal Validates and copies a first-party rate-limit policy at store construction. */
export function normalizeRateLimitPolicy(policy?: RateLimitPolicy): RateLimitPolicy {
  if (policy === undefined) return { kind: 'fixed-window' };
  if (typeof policy !== 'object' || policy === null || Array.isArray(policy)) {
    throw new TypeError('Rate-limit policy must be an object with a supported kind');
  }
  if (policy.kind === 'fixed-window') {
    return { kind: 'fixed-window' };
  }
  if (policy.kind === 'gcra') {
    if (
      policy.burst !== undefined &&
      (!Number.isSafeInteger(policy.burst) || policy.burst < 1)
    ) {
      throw new RangeError('Rate-limit GCRA burst must be a positive safe integer');
    }
    return policy.burst === undefined ? { kind: 'gcra' } : { kind: 'gcra', burst: policy.burst };
  }
  throw new TypeError('Rate-limit policy.kind must be "fixed-window" or "gcra"');
}

/** @internal Validates a reservation and calculates its epoch-aligned window end. */
export function rateLimitWindow(request: RateLimitRequest): number {
  validateRateLimitRequest(request);
  const resetAt = request.now - request.now % request.windowMs + request.windowMs;
  if (!Number.isSafeInteger(resetAt)) throw new RangeError('rateLimit window exceeds safe time');
  request.signal?.throwIfAborted();
  return resetAt;
}
