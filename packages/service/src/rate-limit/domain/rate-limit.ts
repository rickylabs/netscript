/** Fixed-window rate-limit values. @module */

/** Input to one atomic quota reservation. */
export interface RateLimitRequest {
  /** Caller-defined bucket identity, shared across the selected routes. */
  readonly key: string;
  /** Maximum reservations in one window; a positive safe integer. */
  readonly limit: number;
  /** Window duration in milliseconds; a positive safe integer. */
  readonly windowMs: number;
  /** Epoch milliseconds supplied by the middleware's clock. */
  readonly now: number;
  /** Request cancellation, checked before IO and between CAS attempts. */
  readonly signal?: AbortSignal;
}

/** Result of a quota reservation, including conservative contention rejection. */
export interface RateLimitDecision {
  /** True only when a slot was atomically reserved. */
  readonly allowed: boolean;
  /** Epoch milliseconds at which this fixed window ends. */
  readonly resetAt: number;
}

/** @internal Validates a reservation and calculates its epoch-aligned window end. */
export function rateLimitWindow(request: RateLimitRequest): number {
  for (const [name, value] of [['limit', request.limit], ['windowMs', request.windowMs]] as const) {
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new RangeError(`rateLimit.${name} must be a positive safe integer`);
    }
  }
  if (!Number.isSafeInteger(request.now) || request.now < 0) {
    throw new RangeError('rateLimit.now must be non-negative epoch milliseconds');
  }
  const resetAt = request.now - request.now % request.windowMs + request.windowMs;
  if (!Number.isSafeInteger(resetAt)) throw new RangeError('rateLimit window exceeds safe time');
  request.signal?.throwIfAborted();
  return resetAt;
}
