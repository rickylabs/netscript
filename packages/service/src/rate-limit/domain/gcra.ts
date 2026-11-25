/** Pure exact-rational GCRA rolling quota domain logic. @module */
import {
  type RateLimitDecision,
  type RateLimitRequest,
  validateRateLimitBounds,
  validateRateLimitRequest,
} from './rate-limit.ts';

/** Fixed clock-skew/transit retention margin (ms) added to every GCRA KV write. */
export const GCRA_CLOCK_SKEW_BOUND_MS: number = 5_000;

/** Normative 365-day ceiling (ms) on GCRA KV physical retention, aligned with Deno KV. */
export const MAX_GCRA_TTL_MS: number = 31_536_000_000;

const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);
const SKEW_BOUND_BIG = BigInt(GCRA_CLOCK_SKEW_BOUND_MS);
const MAX_TTL_BIG = BigInt(MAX_GCRA_TTL_MS);

/** Internal persisted state for one GCRA key (O(1) record, JSON- and V8-clone-safe). */
export interface StoredGcraState {
  readonly v: 1;
  readonly p: 'gcra';
  /** Whole epoch milliseconds of the Theoretical Arrival Time. */
  readonly tatMs: number;
  /** Rational remainder numerator in [0, limit - 1]; must be 0 when tatMs === Number.MAX_SAFE_INTEGER. */
  readonly tatRem: number;
}

/** Validated GCRA request inputs in exact BigInt units. */
export interface PreparedGcraRequest {
  readonly now: number;
  readonly limit: number;
  readonly windowMs: number;
  readonly effectiveBurst: number;
  readonly limitBig: bigint;
  readonly windowBig: bigint;
  readonly burstBig: bigint;
  readonly nowScaled: bigint;
  /** Safe integer `now + ceilDiv(windowMs, limit)` verified upfront. */
  readonly defaultResetAt: number;
}

/** Pure transition outcome shared by memory and KV adapters. */
export type GcraEvaluation =
  | {
    readonly allowed: true;
    readonly decision: RateLimitDecision;
    readonly nextState: StoredGcraState;
    readonly expireIn: number;
    readonly lastObservedResetAt: number;
  }
  | {
    readonly allowed: false;
    readonly decision: RateLimitDecision;
    readonly lastObservedResetAt: number;
  };

/** @internal Exact ceiling division for positive BigInt operands (`a >= 1n`, `b >= 1n`). */
export function ceilDiv(a: bigint, b: bigint): bigint {
  return (a + b - 1n) / b;
}

/** @internal Validates `(burst, limit, windowMs)` against positive bounds and `MAX_GCRA_TTL_MS`. */
export function validateGcraPolicy(
  limit: number,
  windowMs: number,
  burst?: number,
): void {
  validateRateLimitBounds(limit, windowMs);
  const effectiveBurst = burst ?? limit;
  const maxTtlMs = ceilDiv(BigInt(effectiveBurst) * BigInt(windowMs), BigInt(limit)) +
    SKEW_BOUND_BIG;
  if (maxTtlMs > MAX_TTL_BIG) {
    throw new RangeError('rateLimit retention exceeds maximum supported TTL');
  }
}

/** @internal Runs all upfront GCRA bounds, TTL-ceiling, safe-time, and abort checks before state IO. */
export function prepareGcraRequest(
  request: RateLimitRequest,
  burst?: number,
): PreparedGcraRequest {
  validateRateLimitRequest(request);
  validateGcraPolicy(request.limit, request.windowMs, burst);

  const effectiveBurst = burst ?? request.limit;
  const limitBig = BigInt(request.limit);
  const windowBig = BigInt(request.windowMs);
  const burstBig = BigInt(effectiveBurst);
  const nowScaled = BigInt(request.now) * limitBig;
  const defaultResetAtBig = ceilDiv(nowScaled + windowBig, limitBig);
  if (defaultResetAtBig > MAX_SAFE) {
    throw new RangeError('rateLimit window exceeds safe time');
  }
  request.signal?.throwIfAborted();

  return {
    now: request.now,
    limit: request.limit,
    windowMs: request.windowMs,
    effectiveBurst,
    limitBig,
    windowBig,
    burstBig,
    nowScaled,
    defaultResetAt: Number(defaultResetAtBig),
  };
}

/** @internal Validates a persisted KV record as a well-formed `StoredGcraState`. */
export function parseStoredGcraState(value: unknown, limit: number): StoredGcraState {
  if (
    typeof value !== 'object' || value === null || Array.isArray(value) ||
    !('v' in value) || !('p' in value) || !('tatMs' in value) || !('tatRem' in value)
  ) {
    throw new TypeError('Invalid rate-limit state in KV');
  }
  const { v, p, tatMs, tatRem } = value;
  if (
    v !== 1 ||
    p !== 'gcra' ||
    typeof tatMs !== 'number' || !Number.isSafeInteger(tatMs) || tatMs < 0 ||
    typeof tatRem !== 'number' || !Number.isSafeInteger(tatRem) || tatRem < 0 || tatRem >= limit ||
    (tatMs === Number.MAX_SAFE_INTEGER && tatRem !== 0)
  ) {
    throw new TypeError('Invalid rate-limit state in KV');
  }
  return { v: 1, p: 'gcra', tatMs, tatRem };
}

/** @internal Evaluates one exact BigInt GCRA transition from absent or persisted state. */
export function evaluateGcra(
  prepared: PreparedGcraRequest,
  stored?: StoredGcraState,
): GcraEvaluation {
  const {
    now,
    limitBig: L,
    windowBig: W,
    burstBig: B,
    nowScaled: N,
    defaultResetAt,
  } = prepared;

  let tat = N;
  let lastObservedResetAt = defaultResetAt;
  if (stored !== undefined) {
    const storedTat = BigInt(stored.tatMs) * L + BigInt(stored.tatRem);
    if (storedTat > N) {
      tat = storedTat;
      lastObservedResetAt = Number(ceilDiv(storedTat, L));
    }
  }

  const newTat = tat + W;
  if (newTat - N > B * W) {
    const resetAtBig = ceilDiv(tat, L);
    const allowAtScaled = tat - (B - 1n) * W;
    const retryAtBig = ceilDiv(allowAtScaled, L);
    const retryN = retryAtBig * L;
    const retryBase = tat > retryN ? tat : retryN;
    if (ceilDiv(retryBase + W, L) > MAX_SAFE) {
      throw new RangeError('rateLimit window exceeds safe time');
    }
    return {
      allowed: false,
      decision: {
        allowed: false,
        resetAt: Number(resetAtBig),
        retryAt: Number(retryAtBig),
      },
      lastObservedResetAt,
    };
  }

  const resetAtBig = ceilDiv(newTat, L);
  if (resetAtBig > MAX_SAFE) {
    throw new RangeError('rateLimit window exceeds safe time');
  }
  const resetAt = Number(resetAtBig);
  const nextState: StoredGcraState = {
    v: 1,
    p: 'gcra',
    tatMs: Number(newTat / L),
    tatRem: Number(newTat % L),
  };
  const expireIn = (resetAt - now) + GCRA_CLOCK_SKEW_BOUND_MS;
  return {
    allowed: true,
    decision: { allowed: true, resetAt },
    nextState,
    expireIn,
    lastObservedResetAt,
  };
}

/** @internal Advisory fallback returned when KV CAS attempts exhaust under write contention. */
export function gcraContentionFallback(
  prepared: PreparedGcraRequest,
  lastObservedResetAt: number,
): RateLimitDecision {
  const retryAt = prepared.defaultResetAt;
  return {
    allowed: false,
    resetAt: Math.max(lastObservedResetAt, retryAt),
    retryAt,
  };
}

/** @internal Advisory fallback returned when standalone memory `maxKeys` is saturated. */
export function gcraCapacityFallback(prepared: PreparedGcraRequest): RateLimitDecision {
  const fullResetAtBig = BigInt(prepared.now) +
    ceilDiv(prepared.burstBig * prepared.windowBig, prepared.limitBig);
  if (fullResetAtBig > MAX_SAFE) {
    throw new RangeError('rateLimit window exceeds safe time');
  }
  return {
    allowed: false,
    resetAt: Number(fullResetAtBig),
    retryAt: prepared.defaultResetAt,
  };
}

/** @internal True once a GCRA memory entry has passed its fixed skew-bounded retention horizon. */
export function isGcraEntryEvictable(resetAt: number, now: number): boolean {
  return BigInt(resetAt) + SKEW_BOUND_BIG <= BigInt(now);
}
