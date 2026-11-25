import { assert, assertEquals, assertThrows } from '@std/assert';
import {
  ceilDiv,
  evaluateGcra,
  GCRA_CLOCK_SKEW_BOUND_MS,
  gcraCapacityFallback,
  gcraContentionFallback,
  isGcraEntryEvictable,
  MAX_GCRA_TTL_MS,
  parseStoredGcraState,
  prepareGcraRequest,
  type StoredGcraState,
  validateGcraPolicy,
} from '../src/rate-limit/domain/gcra.ts';
import {
  normalizeRateLimitPolicy,
  RATE_LIMIT_POLICY_KINDS,
  type RateLimitPolicy,
} from '../src/rate-limit/domain/rate-limit.ts';

Deno.test('GCRA policy vocabulary and normalization validate inputs synchronously', () => {
  assertEquals(RATE_LIMIT_POLICY_KINDS, ['fixed-window', 'gcra']);
  assertEquals(normalizeRateLimitPolicy(undefined), { kind: 'fixed-window' });
  assertEquals(normalizeRateLimitPolicy({ kind: 'fixed-window' }), { kind: 'fixed-window' });
  assertEquals(normalizeRateLimitPolicy({ kind: 'gcra' }), { kind: 'gcra' });
  assertEquals(normalizeRateLimitPolicy({ kind: 'gcra', burst: 5 }), { kind: 'gcra', burst: 5 });

  // Caller mutation after normalization must not affect normalized copy.
  const mutable: { kind: 'gcra'; burst?: number } = { kind: 'gcra', burst: 3 };
  const normalized = normalizeRateLimitPolicy(mutable);
  mutable.burst = 99;
  assertEquals(normalized, { kind: 'gcra', burst: 3 });

  for (const invalid of [null, 'gcra', 42, [], {}, { kind: 'sliding-log' }]) {
    assertThrows(
      () => normalizeRateLimitPolicy(invalid as RateLimitPolicy),
      TypeError,
    );
  }
  for (const burst of [0, -1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assertThrows(() => normalizeRateLimitPolicy({ kind: 'gcra', burst }), RangeError);
  }
});

Deno.test('GCRA Gate 2: non-divisible limit=3, windowMs=1000 has exact 334ms eligibility and zero drift over 150 ticks', () => {
  let stored: StoredGcraState | undefined;
  const run = (now: number) => {
    const prepared = prepareGcraRequest({ key: 'k', limit: 3, windowMs: 1_000, now });
    const result = evaluateGcra(prepared, stored);
    if (result.allowed) stored = result.nextState;
    return result;
  };

  // Initial burst of 3 at t=0: TAT advances to 1000 + 0/3.
  assertEquals(run(0).decision, { allowed: true, resetAt: 334 });
  assertEquals(run(0).decision, { allowed: true, resetAt: 667 });
  assertEquals(run(0).decision, { allowed: true, resetAt: 1_000 });
  assertEquals(stored, { v: 1, p: 'gcra', tatMs: 1_000, tatRem: 0 });

  // 4th at t=0 denied; allowAtScaled = 1000*3 - 2*1000 = 1000 -> ceil(1000/3) = 334.
  assertEquals(run(0).decision, { allowed: false, resetAt: 1_000, retryAt: 334 });
  assertEquals(run(333).decision, { allowed: false, resetAt: 1_000, retryAt: 334 });
  assertEquals(run(334).decision, { allowed: true, resetAt: 1_334 });
  assertEquals(stored, { v: 1, p: 'gcra', tatMs: 1_333, tatRem: 1 });

  // Next slot becomes eligible at ceil((4000 - 2000)/3) = 667.
  assertEquals(run(666).decision, { allowed: false, resetAt: 1_334, retryAt: 667 });
  assertEquals(run(667).decision, { allowed: true, resetAt: 1_667 });
  assertEquals(stored, { v: 1, p: 'gcra', tatMs: 1_666, tatRem: 2 });

  // Third slot finishes exact 1000ms cycle at t=1000 with zero remainder drift.
  assertEquals(run(999).decision, { allowed: false, resetAt: 1_667, retryAt: 1_000 });
  assertEquals(run(1_000).decision, { allowed: true, resetAt: 2_000 });
  assertEquals(stored, { v: 1, p: 'gcra', tatMs: 2_000, tatRem: 0 });

  // Sustain 150 more ticks (50 full seconds = 150 paced admissions) without any drift.
  let now = 1_000;
  for (let tick = 1; tick <= 150; tick++) {
    const denied = run(now);
    assertEquals(denied.allowed, false);
    const retryAt = denied.decision.retryAt!;
    assertEquals(run(retryAt - 1).allowed, false);
    const admitted = run(retryAt);
    assertEquals(admitted.allowed, true);
    now = retryAt;
  }
  // After 3 initial + 3 + 150 = 156 admissions = 52 exact seconds from t=0, TAT is exact integer 52_000.
  assertEquals(stored, { v: 1, p: 'gcra', tatMs: 52_000, tatRem: 0 });
});

Deno.test('GCRA Gate 2: small-window upper bound, sub-ms interval, shift invariance, and high limit O(1) record', () => {
  // 1. Half-open 1ms interval [t, t+1) with windowMs=1, limit=3, burst=3 admits at most 3 (not 5).
  let tiny: StoredGcraState | undefined;
  const runTiny = (now: number) => {
    const res = evaluateGcra(prepareGcraRequest({ key: 'k', limit: 3, windowMs: 1, now }, 3), tiny);
    if (res.allowed) tiny = res.nextState;
    return res.decision;
  };
  assertEquals(runTiny(10), { allowed: true, resetAt: 11 });
  assertEquals(runTiny(10), { allowed: true, resetAt: 11 });
  assertEquals(runTiny(10), { allowed: true, resetAt: 11 });
  assertEquals(runTiny(10), { allowed: false, resetAt: 11, retryAt: 11 });
  assertEquals(runTiny(11), { allowed: true, resetAt: 12 });

  // 2. Sub-ms refill: limit=1000, windowMs=100, burst=2.
  let subMs: StoredGcraState | undefined;
  const runSubMs = (now: number) => {
    const res = evaluateGcra(
      prepareGcraRequest({ key: 'k', limit: 1_000, windowMs: 100, now }, 2),
      subMs,
    );
    if (res.allowed) subMs = res.nextState;
    return res.decision;
  };
  assertEquals(runSubMs(0), { allowed: true, resetAt: 1 });
  assertEquals(runSubMs(0), { allowed: true, resetAt: 1 });
  assertEquals(runSubMs(0), { allowed: false, resetAt: 1, retryAt: 1 });
  assertEquals(runSubMs(1), { allowed: true, resetAt: 2 });
  assertEquals(runSubMs(1), { allowed: true, resetAt: 2 });
  assertEquals(runSubMs(1), { allowed: false, resetAt: 2, retryAt: 2 });

  // 3. Shift invariance in caller timestamps.
  const evaluateSequence = (arrivals: readonly number[]) => {
    let state: StoredGcraState | undefined;
    return arrivals.map((now) => {
      const res = evaluateGcra(
        prepareGcraRequest({ key: 'k', limit: 2, windowMs: 60_000, now }),
        state,
      );
      if (res.allowed) state = res.nextState;
      return res.decision;
    });
  };
  const shift = 59_750;
  const base = evaluateSequence([100, 200, 300, 400]);
  const shifted = evaluateSequence([100 + shift, 200 + shift, 300 + shift, 400 + shift]);
  assertEquals(
    shifted,
    base.map((d) => ({
      allowed: d.allowed,
      resetAt: d.resetAt + shift,
      ...(d.retryAt === undefined ? {} : { retryAt: d.retryAt + shift }),
    })),
  );

  // 4. High limit (100_000 / hour): constant four-field O(1) stored record.
  const highEval = evaluateGcra(
    prepareGcraRequest({ key: 'k', limit: 100_000, windowMs: 3_600_000, now: 1_000 }),
  );
  assert(highEval.allowed);
  assertEquals(Object.keys(highEval.nextState).sort(), ['p', 'tatMs', 'tatRem', 'v']);
  assertEquals(highEval.nextState, { v: 1, p: 'gcra', tatMs: 1_036, tatRem: 0 });
  assertEquals(highEval.expireIn, 36 + GCRA_CLOCK_SKEW_BOUND_MS);
});

Deno.test('GCRA Gate 6b: safe-time overflow oracle and TTL ceiling boundaries', () => {
  const M = Number.MAX_SAFE_INTEGER;

  // (a) now = M - 2, limit = windowMs = burst = 2: Req 1 admits (M-1), Req 2 admits (M), Req 3 throws.
  let stateA: StoredGcraState | undefined;
  const a1 = evaluateGcra(prepareGcraRequest({ key: 'k', limit: 2, windowMs: 2, now: M - 2 }, 2));
  assert(a1.allowed);
  assertEquals(a1.decision, { allowed: true, resetAt: M - 1 });
  stateA = a1.nextState;

  const a2 = evaluateGcra(
    prepareGcraRequest({ key: 'k', limit: 2, windowMs: 2, now: M - 2 }, 2),
    stateA,
  );
  assert(a2.allowed);
  assertEquals(a2.decision, { allowed: true, resetAt: M });
  stateA = a2.nextState;

  assertThrows(
    () =>
      evaluateGcra(
        prepareGcraRequest({ key: 'k', limit: 2, windowMs: 2, now: M - 2 }, 2),
        stateA,
      ),
    RangeError,
    'rateLimit window exceeds safe time',
  );

  // (b) now = M - 3: Req 1 (M-2), Req 2 (M-1), Req 3 denies (retryAt=M-2, resetAt=M-1),
  //     Req 4 at M-2 admits (resetAt=M, expireIn=5002), Req 5 at M-2 throws RangeError.
  let stateB: StoredGcraState | undefined;
  const b1 = evaluateGcra(prepareGcraRequest({ key: 'k', limit: 2, windowMs: 2, now: M - 3 }, 2));
  assert(b1.allowed);
  assertEquals(b1.decision, { allowed: true, resetAt: M - 2 });
  stateB = b1.nextState;

  const b2 = evaluateGcra(
    prepareGcraRequest({ key: 'k', limit: 2, windowMs: 2, now: M - 3 }, 2),
    stateB,
  );
  assert(b2.allowed);
  assertEquals(b2.decision, { allowed: true, resetAt: M - 1 });
  stateB = b2.nextState;

  const b3 = evaluateGcra(
    prepareGcraRequest({ key: 'k', limit: 2, windowMs: 2, now: M - 3 }, 2),
    stateB,
  );
  assertEquals(b3.allowed, false);
  assertEquals(b3.decision, { allowed: false, resetAt: M - 1, retryAt: M - 2 });

  const b4 = evaluateGcra(
    prepareGcraRequest({ key: 'k', limit: 2, windowMs: 2, now: M - 2 }, 2),
    stateB,
  );
  assert(b4.allowed);
  assertEquals(b4.decision, { allowed: true, resetAt: M });
  assertEquals(b4.expireIn, 5_002);
  stateB = b4.nextState;

  assertThrows(
    () =>
      evaluateGcra(
        prepareGcraRequest({ key: 'k', limit: 2, windowMs: 2, now: M - 2 }, 2),
        stateB,
      ),
    RangeError,
    'rateLimit window exceeds safe time',
  );

  // (c) now = M throws upfront.
  assertThrows(
    () => prepareGcraRequest({ key: 'k', limit: 2, windowMs: 2, now: M }, 2),
    RangeError,
    'rateLimit window exceeds safe time',
  );

  // TTL-ceiling validation boundaries (365-day MAX_GCRA_TTL_MS = 31_536_000_000).
  assertEquals(MAX_GCRA_TTL_MS, 31_536_000_000);
  assertEquals(GCRA_CLOCK_SKEW_BOUND_MS, 5_000);
  validateGcraPolicy(1, 31_535_995_000);
  validateGcraPolicy(3, 94_607_985_000, 1);
  validateGcraPolicy(10, 40_000_000_000, 1);

  for (
    const [limit, windowMs, burst] of [
      [1, 31_535_995_001, undefined],
      [1, 400 * 86_400_000, undefined],
      [1, 10_000_000_000, 4],
      [3, 94_607_985_001, 1],
      [1, M - 10, undefined],
    ] as const
  ) {
    assertThrows(
      () => validateGcraPolicy(limit, windowMs, burst),
      RangeError,
      'rateLimit retention exceeds maximum supported TTL',
    );
  }

  // Fallback helpers and eviction predicate.
  const preparedFallback = prepareGcraRequest({ key: 'k', limit: 3, windowMs: 60_000, now: 100 });
  assertEquals(gcraContentionFallback(preparedFallback, 20_100), {
    allowed: false,
    resetAt: 20_100,
    retryAt: 20_100,
  });
  assertEquals(gcraContentionFallback(preparedFallback, 40_100), {
    allowed: false,
    resetAt: 40_100,
    retryAt: 20_100,
  });
  assertEquals(gcraCapacityFallback(preparedFallback), {
    allowed: false,
    resetAt: 60_100,
    retryAt: 20_100,
  });

  // Capacity fallback overflow throws RangeError when full burst horizon exceeds MAX_SAFE_INTEGER.
  const edgePrepared = prepareGcraRequest({ key: 'k', limit: 2, windowMs: 2, now: M - 1 }, 2);
  assertThrows(
    () => gcraCapacityFallback(edgePrepared),
    RangeError,
    'rateLimit window exceeds safe time',
  );

  // Skew-bounded eviction horizon check.
  assertEquals(isGcraEntryEvictable(60_000, 64_999), false);
  assertEquals(isGcraEntryEvictable(60_000, 65_000), true);
  assertEquals(ceilDiv(10n, 3n), 4n);
});

Deno.test('GCRA state parser validates stored records and rejects malformed states', () => {
  assertEquals(parseStoredGcraState({ v: 1, p: 'gcra', tatMs: 100, tatRem: 2 }, 3), {
    v: 1,
    p: 'gcra',
    tatMs: 100,
    tatRem: 2,
  });
  assertEquals(
    parseStoredGcraState({ v: 1, p: 'gcra', tatMs: Number.MAX_SAFE_INTEGER, tatRem: 0 }, 3),
    { v: 1, p: 'gcra', tatMs: Number.MAX_SAFE_INTEGER, tatRem: 0 },
  );

  for (
    const invalid of [
      null,
      undefined,
      42,
      'gcra',
      [],
      {},
      { v: 2, p: 'gcra', tatMs: 100, tatRem: 0 },
      { v: 1, p: 'fixed-window', tatMs: 100, tatRem: 0 },
      { v: 1, p: 'gcra', tatMs: -1, tatRem: 0 },
      { v: 1, p: 'gcra', tatMs: 1.5, tatRem: 0 },
      { v: 1, p: 'gcra', tatMs: 100, tatRem: -1 },
      { v: 1, p: 'gcra', tatMs: 100, tatRem: 3 },
      { v: 1, p: 'gcra', tatMs: Number.MAX_SAFE_INTEGER, tatRem: 1 },
    ]
  ) {
    assertThrows(
      () => parseStoredGcraState(invalid, 3),
      TypeError,
      'Invalid rate-limit state in KV',
    );
  }
});
