---
rfc: 0000            # assigned by a maintainer at acceptance; keep 0000 while drafting
title: Opt-in rolling quotas for protected service reads
status: Draft        # Draft | Discussion | FCP | Accepted | Rejected | Withdrawn
authors: ['@rickylabs']
created: 2026-11-24
tracking-issue: https://github.com/rickylabs/netscript/issues/2653
target-milestone: 0.0.10
---

# Opt-in rolling quotas for protected service reads

## Summary

This RFC proposes an opt-in rolling quota policy for both first-party rate-limit stores in
`@netscript/service/rate-limit` (`createMemoryRateLimitStore` and `createKvRateLimitStore`), while
preserving the existing fixed-window policy as the unchanged default. Both stores gain an optional
`policy` configuration accepting a discriminated union `RateLimitPolicy` defaulting to
`{ kind: 'fixed-window' }`, with `{ kind: 'gcra', burst?: number }` implementing the Generic Cell
Rate Algorithm (GCRA) over exact rational integer arithmetic in O(1) storage per key and a single
version-checked KV atomic commit per attempt. `RateLimitDecision` preserves `resetAt` as the full
quota recovery instant (epoch-aligned window end for fixed windows; full bucket recovery for GCRA)
and adds an optional `retryAt` field carrying the earliest next eligible epoch millisecond on
rolling denials; middleware and callers derive `Retry-After` uniformly from
`decision.retryAt ?? decision.resetAt`.

## Motivation

### Boundary amplification in fixed-window quotas

Protected service reads (such as filtered lists, search queries, status reads, and authenticated
resource lookups) often enforce tight per-client or per-principal quotas to bound database load and
prevent scraping. Today, both first-party stores in `@netscript/service/rate-limit` implement
epoch-aligned fixed windows (`[W, W + windowMs)` where `W = now - (now % windowMs)`). Because window
boundaries are anchored to wall-clock multiples of `windowMs`, identical short bursts receive
different admission decisions depending solely on where they land relative to a clock boundary: a
caller arriving immediately before and after a boundary can consume up to `2 * limit` reservations
within milliseconds.

### Measured baseline against `main`

Measured against `main` (`87965d800b7d61312e8612c82bdb0cb98bdf5b29`) importing directly from
`./packages/service/src/rate-limit/mod.ts` (not the published JSR release):

```sh
deno eval '
import { createMemoryRateLimitStore } from "./packages/service/src/rate-limit/mod.ts";

for (const arrivals of [[100, 200, 300, 400], [59_850, 59_950, 60_050, 60_150]]) {
  const store = createMemoryRateLimitStore();
  const decisions = [];
  for (const now of arrivals) {
    const result = await store.consume({ key: "sample", limit: 2, windowMs: 60_000, now });
    decisions.push(result.allowed);
  }
  console.log(decisions);
}
'
```

Observed output (measured, exit code `0`):

```text
[ true, true, false, false ]
[ true, true, true, true ]
```

Running the same two sequences across all three local store configurations (`createMemoryRateLimitStore`,
`createKvRateLimitStore` over `MemoryKvAdapter`, and `createKvRateLimitStore` over `DenoKvAdapter`
backed by `Deno.openKv(':memory:')`) produced identical results (measured, exit code `0`):

| Store configuration (measured on `main`) | `[100, 200, 300, 400]` | `[59_850, 59_950, 60_050, 60_150]` |
| --- | --- | --- |
| `createMemoryRateLimitStore()` | `[true, true, false, false]`, `resetAt: 60000` | `[true, true, true, true]`, `resetAt: 60000, 60000, 120000, 120000` |
| `createKvRateLimitStore(new MemoryKvAdapter(), ...)` | `[true, true, false, false]`, `resetAt: 60000` | `[true, true, true, true]`, `resetAt: 60000, 60000, 120000, 120000` |
| `createKvRateLimitStore(new DenoKvAdapter(memKv), ...)` | `[true, true, false, false]`, `resetAt: 60000` | `[true, true, true, true]`, `resetAt: 60000, 60000, 120000, 120000` |

Both sequences submit four requests spaced 100 ms apart against `limit: 2, windowMs: 60_000`, yet
the boundary-straddling sequence admits all four requests.

### Current surface baseline (source-inspected)

Every baseline statement below is source-inspected from `main` (`87965d80`):

| Source location | Current contract / behavior | Design consequence |
| --- | --- | --- |
| [`packages/service/src/rate-limit/domain/rate-limit.ts`](../packages/service/src/rate-limit/domain/rate-limit.ts) (lines 4–39) | `RateLimitRequest` takes `{ key, limit, windowMs, now, signal? }` with positive safe integer `limit`/`windowMs` and non-negative safe integer epoch ms `now`. `RateLimitDecision` is `{ allowed: boolean; resetAt: number }`, documenting `resetAt` as *"Epoch milliseconds at which this fixed window ends."* `rateLimitWindow()` validates inputs and computes `now - now % windowMs + windowMs`. | Any rolling policy must define compatible `resetAt` semantics and expose retry timing without breaking existing `{ allowed, resetAt }` consumers or imposing hidden `limit` cliffs. |
| [`packages/service/src/rate-limit/ports/rate-limit-store.ts`](../packages/service/src/rate-limit/ports/rate-limit-store.ts) (lines 17–20) | `RateLimitStore` exposes a single method `consume(request: RateLimitRequest): Promise<RateLimitDecision>`. | Keeping the port method signature unchanged preserves drop-in compatibility with custom stores and `ServiceRateLimitOptions`. |
| [`packages/service/src/rate-limit/adapters/memory-rate-limit-store.ts`](../packages/service/src/rate-limit/adapters/memory-rate-limit-store.ts) (lines 10–68) | `MemoryRateLimitStoreOptions` has `{ maxKeys?: number }` (default `10_000`). Stores `{ count, resetAt }` keyed by `JSON.stringify([request.key, request.windowMs])`, performs synchronous reservations, evicts up to 32 expired entries (`counter.resetAt <= request.now`) via rotating `Map` scan, rejects new keys at capacity without evicting live quotas, and holds no timers. | Rolling memory state must remain O(1) per key so `maxKeys` continues to bound process memory without timers or extra eviction passes. |
| [`packages/service/src/rate-limit/adapters/kv-rate-limit-store.ts`](../packages/service/src/rate-limit/adapters/kv-rate-limit-store.ts) (lines 11–69) | `KvRateLimitStoreOptions` has `{ prefix: KvKey; maxAttempts?: number }` (default `8`, max `32`). Requires `kv.atomic` at construction. Uses single-key `kv.get` + `kv.atomic([{ key, versionstamp }], [{ type: 'set', key, value: count + 1, expireIn: resetAt - request.now }])` on `[...prefix, request.key, request.windowMs, resetAt]`. No `kv.list()` scans; rejects without writing when exhausted; throws `TypeError` on corrupt KV state. | Rolling KV state must preserve single-key CAS, zero scans, zero writes on rejection, bounded `maxAttempts`, and positive `expireIn`. |
| [`packages/service/src/rate-limit/middleware/rate-limit-middleware.ts`](../packages/service/src/rate-limit/middleware/rate-limit-middleware.ts) (lines 29–96) | Calls `store.consume(...)` with `now()`, and on `!decision.allowed` sets `Retry-After` to `String(Math.max(1, Math.ceil((decision.resetAt - now()) / 1000)))` and returns `429` JSON `{ error: 'RATE_LIMITED' }`. | Middleware must prefer an explicit next-eligible timestamp (`decision.retryAt ?? decision.resetAt`) so rolling rejections emit accurate `Retry-After` headers while custom fixed-window stores stay unchanged. |
| [`packages/service/src/builder/service-builder-impl.ts`](../packages/service/src/builder/service-builder-impl.ts) (lines 310–313, 458–461, 515–524) | `.withRateLimit()` delegates to `this.use()`, which runs before `build()` installs `authn`/`authz`. | Pre-auth route quotas work automatically via `.withRateLimit()`; post-auth principal-keyed protected reads call `store.consume()` directly after authentication. Both paths rely on the same `RateLimitStore` and `RateLimitDecision` contract. |
| [`packages/kv/types/kv-store.ts`](../packages/kv/types/kv-store.ts) (lines 149–196) | `KvStore` offers `get`, optional `getMany`, and optional `atomic(checks, mutations)` where `AtomicMutation` is `set` (with `expireIn?`), `delete`, `sum`, `min`, `max`. Combine mutations (`sum`/`min`/`max`) are `bigint`-only and carry no `expireIn` or conditional clamp. | Atomic rolling reservations must use `get` + versionstamp-checked `atomic([{ key, versionstamp }], [{ type: 'set', ..., expireIn }])`. |
| [`packages/kv/adapters/deno-kv.adapter.ts`](../packages/kv/adapters/deno-kv.adapter.ts) (lines 202–235), [`packages/kv/adapters/redis.adapter.ts`](../packages/kv/adapters/redis.adapter.ts) (lines 273–435), [`packages/kv/adapters/memory.adapter.ts`](../packages/kv/adapters/memory.adapter.ts) (lines 197–219, 504–520) | `DenoKvAdapter` delegates to native `kv.atomic()` (64 KiB per-value limit). `RedisKvAdapter` serializes in-process `atomic()` via `atomicTail`, uses `WATCH`/`MGET`/`MULTI`/`EXEC` with up to `REDIS_ATOMIC_MAX_ATTEMPTS = 5` retries on `EXEC` conflict (`packages/kv/adapters/redis/types.ts:103`), JSON-encodes values via `encodeStoredValue`, and maps `expireIn` with `if (mutation.type === 'set' && mutation.expireIn) multi.psetex(...)`. `MemoryKvAdapter` checks `expireIn ? Date.now() + expireIn : undefined`. | Both `RedisKvAdapter` and `MemoryKvAdapter` treat `expireIn: 0` as falsy (no TTL — permanent key!). Rolling KV writes MUST guarantee `expireIn >= 1`. Deno KV's 64 KiB value limit and Redis JSON payload encoding penalize O(limit) state. |
| [`packages/kv/adapters/redis/serialization.ts`](../packages/kv/adapters/redis/serialization.ts) (lines 37–46) | `keyToRedisKey` concatenates `KvKey` parts with `:` using `String(part)` without type tags or escaping (also noted in [`packages/kv/README.md`](../packages/kv/README.md), lines 109–113). | Rolling KV keys should use a distinct namespace segment and tagged value schema, and operators must use separate KV prefixes for independent policies. |
| [`packages/service/tests/rate-limit_test.ts`](../packages/service/tests/rate-limit_test.ts) (lines 175, 209–212) | Existing tests assert exact deep equality `{ allowed: true, resetAt: 2000 }` and `{ allowed: false, resetAt: 5000 }` on fixed-window store decisions. | Fixed-window decisions MUST keep returning `{ allowed, resetAt }` without adding extra keys, preserving strict structural parity. |
| [`packages/contracts/src/domain/schemas.ts`](../packages/contracts/src/domain/schemas.ts) (lines 68–71, 110–113) | Common `RateLimitError` contract carries `{ retryAfter: number; limit: number }` with `retryAfter` integer `>= 1` seconds. | Exposing exact next-eligible timing on `RateLimitDecision` lets direct procedure callers populate `RateLimitError.retryAfter` with the same formula as HTTP middleware. |

### Goals

1. Eliminate wall-clock boundary doubling for callers that opt into rolling quotas in either
   `createMemoryRateLimitStore` or `createKvRateLimitStore`.
2. Preserve 100% backwards compatibility for default fixed-window callers, existing custom
   `RateLimitStore` implementations, and existing `RateLimitDecision` assertions.
3. Guarantee O(1) bounded storage per key for arbitrary positive safe integer `limit` and
   `windowMs`, keeping `MemoryRateLimitStore.maxKeys` and Deno KV/Redis value bounds intact.
4. Preserve single-key versionstamp CAS atomicity in shared KV with zero scans, zero writes on
   denial, and bounded retry budgets.
5. Achieve deterministic bit-for-bit parity between memory and KV adapters under injected clocks,
   and linearizable non-over-admission under concurrent shared-KV callers.
6. Define clear, monotonic semantics for `resetAt` and the next eligible instant for `Retry-After`.

### Non-goals

- Changing the default policy of `createMemoryRateLimitStore`, `createKvRateLimitStore`, or
  `createRateLimitMiddleware` from fixed-window.
- Implementing per-credential dynamic monotonic poll pacing for OAuth device-grant flows (tracked
  separately in [#2365](https://github.com/rickylabs/netscript/issues/2365), where the upstream
  provider can dynamically increase the polling interval for the lifetime of a grant).
- Moving `.withRateLimit()` after `.withAuthn()`/`.withAuthz()` on `ServiceBuilder`, or adding
  procedure-level oRPC rate-limit middleware (a separate builder/auth pipeline concern).
- Adding new packages, external dependencies, Redis-specific Lua scripts, or background timers.

## Guide-level explanation

*Note: Code snippets in this section illustrate the proposed API (not yet implemented).*

### Preserving existing fixed-window defaults

Existing code continues to work with zero changes. Omitting `policy` keeps epoch-aligned fixed
windows with identical keys, storage, and `{ allowed, resetAt }` decision objects:

```ts
// Proposed API (unchanged existing call — defaults to { kind: 'fixed-window' })
import { createMemoryRateLimitStore } from '@netscript/service/rate-limit';

const fixedStore = createMemoryRateLimitStore();
```

### Opting into rolling quotas (memory and shared KV)

Pass `policy: { kind: 'gcra' }` to either first-party store factory to enable alignment-independent
rolling admission with O(1) storage per key:

```ts
// Proposed API (not yet implemented)
import { getKv } from '@netscript/kv';
import { createService } from '@netscript/service';
import { createKvRateLimitStore } from '@netscript/service/rate-limit';

const kv = await getKv();
const readQuotaStore = createKvRateLimitStore(kv, {
  prefix: ['protected-reads', 'items-rolling'],
  policy: { kind: 'gcra' },
});

const app = createService({}, { name: 'catalog' })
  .withRateLimit({
    routes: ['/api/items', '/api/rpc/items/*'],
    limit: 60,
    windowMs: 60_000,
    store: readQuotaStore,
  })
  .build();
```

For local development and deterministic unit tests, `createMemoryRateLimitStore({ policy: { kind: 'gcra' } })`
implements the exact same admission transition in memory:

```ts
// Proposed API (not yet implemented)
import { createMemoryRateLimitStore } from '@netscript/service/rate-limit';

const store = createMemoryRateLimitStore({ policy: { kind: 'gcra' } });
```

With `limit: 2, windowMs: 60_000`, both `[100, 200, 300, 400]` and
`[59_850, 59_950, 60_050, 60_150]` produce `[true, true, false, false]`. A denied request at
`60_050` returns `retryAt: 89_850` (one refill interval `windowMs / limit = 30_000` ms after the
first arrival at `59_850`) and `resetAt: 119_850` (when the full burst of two recovers). The
middleware automatically emits `Retry-After: 30` (computed from `retryAt`), rather than forcing the
client to wait the full 60 seconds for the entire bucket to refill.

### Controlling burst separately from sustained rate

When `burst` is omitted, `{ kind: 'gcra' }` defaults burst capacity to the request's `limit` so
existing `(limit, windowMs)` configurations work without an extra parameter. Callers that want
smoother spacing on expensive reads can specify an explicit `burst`:

```ts
// Proposed API (not yet implemented)
import { createKvRateLimitStore } from '@netscript/service/rate-limit';
import type { KvStore } from '@netscript/kv';

declare const kv: KvStore;

// Sustained rate: 60 reads / 60s (1/s), maximum instantaneous burst: 5
const smoothReads = createKvRateLimitStore(kv, {
  prefix: ['protected-reads', 'search-smooth'],
  policy: { kind: 'gcra', burst: 5 },
});
```

Setting `burst: 1` enforces strict minimum spacing of `windowMs / limit` between accepted reads
(with static rate configured at the store/route, distinct from `#2365`'s dynamic grant-lifetime
`slow_down` interval updates).

### Direct store callers (principal-keyed protected reads)

Protected service handlers that enforce per-principal quotas after authentication call
`store.consume()` directly and read `decision.retryAt ?? decision.resetAt` for retry timing:

```ts
// Proposed API (not yet implemented)
import type { RateLimitStore } from '@netscript/service/rate-limit';

declare const store: RateLimitStore;
declare const principalSubject: string;

const now = Date.now();
const decision = await store.consume({
  key: principalSubject,
  limit: 30,
  windowMs: 60_000,
  now,
});

if (!decision.allowed) {
  const nextEligibleAt = decision.retryAt ?? decision.resetAt;
  const retryAfterSeconds = Math.max(1, Math.ceil((nextEligibleAt - now) / 1000));
  // Return 429 or contract RateLimitError({ retryAfter: retryAfterSeconds, limit: 30 })
  void retryAfterSeconds;
}
```

## Reference-level explanation

### Architecture, package placement, and doctrine alignment

All changes stay inside the existing `@netscript/service` package (`packages/service/`, Archetype 4
per [`docs/architecture/doctrine/06-archetypes.md`](../docs/architecture/doctrine/06-archetypes.md))
and its self-contained `src/rate-limit/` slice. No new package, no new subpath, and no new external
dependencies are introduced.

Layering follows [`docs/architecture/doctrine/05-folder-structure.md`](../docs/architecture/doctrine/05-folder-structure.md)
and [`docs/architecture/doctrine/07-composition-and-extension.md`](../docs/architecture/doctrine/07-composition-and-extension.md):

| Module | Layer | Responsibility |
| --- | --- | --- |
| `packages/service/src/rate-limit/domain/rate-limit.ts` | `domain` | `RateLimitRequest`, `RateLimitDecision` (with optional `retryAt`), `RATE_LIMIT_POLICY_KINDS`, `RateLimitPolicyKind`, `RateLimitPolicy`, input validation, fixed-window calculation, and policy validation. Imports no adapters or I/O. |
| `packages/service/src/rate-limit/domain/gcra.ts` | `domain` | Pure GCRA state representation (`StoredGcraState`), exact `BigInt` rational transition `evaluateGcra()`, conservative exhaustion decision helpers, and KV state validation. Shared verbatim by both stores. |
| `packages/service/src/rate-limit/ports/rate-limit-store.ts` | `ports` | Unchanged `RateLimitStore` interface (JSDoc updated to cover both fixed-window and rolling policies). |
| `packages/service/src/rate-limit/adapters/memory-rate-limit-store.ts` | `adapters` | `MemoryRateLimitStoreOptions.policy?`; dispatches fixed-window (default) or GCRA using `evaluateGcra()`. |
| `packages/service/src/rate-limit/adapters/kv-rate-limit-store.ts` | `adapters` | `KvRateLimitStoreOptions.policy?`; dispatches fixed-window (default) or GCRA single-key CAS using `evaluateGcra()`. |
| `packages/service/src/rate-limit/middleware/rate-limit-middleware.ts` | `middleware` | Computes `Retry-After` from `decision.retryAt ?? decision.resetAt`. |
| `packages/service/src/rate-limit/mod.ts` | subpath manifest | Exports `RATE_LIMIT_POLICY_KINDS`, `type RateLimitPolicyKind`, `type RateLimitPolicy` alongside existing exports. |
| `packages/service/mod.ts` | root manifest | Continues re-exporting `RateLimitDecision` (automatically gaining optional `retryAt?: number`); store factories and policy types remain on `@netscript/service/rate-limit` to keep the root surface lean ([`docs/architecture/doctrine/02-public-surface.md`](../docs/architecture/doctrine/02-public-surface.md)). |

`RateLimitPolicy` is modeled as a named, typed extension axis (Doctrine Axiom A11) with a finite
constant vocabulary (`RATE_LIMIT_POLICY_KINDS`) and discriminated union, avoiding boolean flags or
duplicated store factory pairs.

### Public API and type surface

```ts
// Proposed public contract in @netscript/service/rate-limit (not yet implemented)

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
 * - `'fixed-window'`: epoch-aligned fixed windows (default).
 * - `'gcra'`: alignment-independent Generic Cell Rate Algorithm with O(1)
 *   storage per key; `burst` defaults to the request's `limit`.
 */
export type RateLimitPolicy =
  | { readonly kind: 'fixed-window' }
  | { readonly kind: 'gcra'; readonly burst?: number };

/** Result of a quota reservation, including conservative contention rejection. */
export interface RateLimitDecision {
  /** True only when a slot was atomically reserved. */
  readonly allowed: boolean;
  /**
   * Epoch milliseconds at which the key's quota fully resets
   * (epoch-aligned window end for fixed windows; full burst recovery for GCRA).
   */
  readonly resetAt: number;
  /**
   * Earliest epoch milliseconds at which one subsequent reservation may succeed
   * when `allowed` is `false`. Omitted when `allowed` is `true` and omitted by
   * the default fixed-window policy (where it equals `resetAt`).
   * Callers computing `Retry-After` use `decision.retryAt ?? decision.resetAt`.
   */
  readonly retryAt?: number;
}

export interface MemoryRateLimitStoreOptions {
  /** Maximum retained client keys, including expired keys awaiting eviction. Default 10,000. */
  readonly maxKeys?: number;
  /** Quota policy. Defaults to `{ kind: 'fixed-window' }`. */
  readonly policy?: RateLimitPolicy;
}

export interface KvRateLimitStoreOptions {
  /** Dedicated namespace; separate independent limiters with different prefixes. */
  readonly prefix: KvKey;
  /** Maximum read/CAS attempts per reservation. Default 8, maximum 32. */
  readonly maxAttempts?: number;
  /** Quota policy. Defaults to `{ kind: 'fixed-window' }`. */
  readonly policy?: RateLimitPolicy;
}
```

Every new symbol must carry explicit TypeScript annotations compatible with `isolatedDeclarations`,
zero `any` casts, and complete JSDoc with compiling `@example` fences per
[`docs/architecture/doctrine/02-public-surface.md`](../docs/architecture/doctrine/02-public-surface.md).

#### Policy and input validation

1. At store construction:
   - `policy === undefined` normalizes to `{ kind: 'fixed-window' }`.
   - Any non-object `policy` or `policy.kind` outside `RATE_LIMIT_POLICY_KINDS` throws `TypeError`.
   - For `{ kind: 'gcra', burst }`, if `burst !== undefined`, `burst` must be a positive safe integer
     (`Number.isSafeInteger(burst) && burst >= 1`), else throws `RangeError`.
2. At `consume(request)`:
   - Existing `limit`, `windowMs`, `now`, and `signal` checks apply identically across policies:
     `limit` and `windowMs` must be positive safe integers; `now` must be a non-negative safe
     integer; `request.signal?.throwIfAborted()` runs before state access and between KV attempts.
   - Safe-time overflow (`now + ceil(B * W / L) > Number.MAX_SAFE_INTEGER`, or
     `resetAt > Number.MAX_SAFE_INTEGER`) throws `RangeError('rateLimit window exceeds safe time')`
     before mutating state or checking capacity.

### Compatible decision semantics (`resetAt` and `retryAt` / `Retry-After`)

In fixed-window quotas, two distinct concepts coincide at a single timestamp:

1. **Full quota reset (`resetAt`)**: the instant at which the key's entire quota returns to its
   clean, unconsumed state (assuming no further arrivals).
2. **Next eligible instant (`retryAt`)**: the earliest instant at which a single subsequent request
   can be admitted after a denial.

Under any rolling policy with `limit > 1` (both GCRA and strict sliding-window log), those two
instants diverge whenever a burst consumes multiple slots at staggered times or refills one slot per
interval. Keeping `resetAt` as full quota recovery and adding optional `retryAt` for next-slot
eligibility avoids overloading `resetAt` with non-monotonic allow-vs-deny jumps while remaining
100% compatible with existing stores and callers:

| Outcome | Fixed-window (default) | GCRA (`policy: { kind: 'gcra', burst? }`) |
| --- | --- | --- |
| `allowed: true` | `{ allowed: true, resetAt: W_end }` (`retryAt` omitted) | `{ allowed: true, resetAt: ceil(newTat / L) }` (`retryAt` omitted) |
| `allowed: false` (quota exhausted) | `{ allowed: false, resetAt: W_end }` (`retryAt` omitted) | `{ allowed: false, resetAt: ceil(tat / L), retryAt: ceil((tat - (B - 1) * W) / L) }` |
| `allowed: false` (KV CAS `maxAttempts` exhausted) | `{ allowed: false, resetAt: W_end }` (`retryAt` omitted) | `{ allowed: false, resetAt: max(lastObservedResetAt, retryAt), retryAt: now + ceil(W / L) }` |
| `allowed: false` (memory `maxKeys` full on new key) | `{ allowed: false, resetAt: W_end }` (`retryAt` omitted) | `{ allowed: false, resetAt: now + ceil(B * W / L), retryAt: now + ceil(W / L) }` |

#### Normative decision invariants

Across all policies and all outcomes (except thrown validation/abort/IO errors):

1. When `allowed === true`: `resetAt > request.now` and `retryAt === undefined`.
2. When `allowed === false`: `request.now < (retryAt ?? resetAt) <= resetAt`, and both are safe
   integers.
3. Under fixed-window: decisions have the exact two-property shape `{ allowed, resetAt }`, so
   `decision.retryAt ?? decision.resetAt === decision.resetAt`.
4. Middleware `Retry-After` computation in
   `packages/service/src/rate-limit/middleware/rate-limit-middleware.ts`:

```ts
// Proposed middleware change (not yet implemented)
if (!decision.allowed) {
  const nextEligibleAt = decision.retryAt ?? decision.resetAt;
  context.header(
    'Retry-After',
    String(Math.max(1, Math.ceil((nextEligibleAt - now()) / 1000))),
  );
  return context.json({ error: 'RATE_LIMITED' }, 429);
}
```

Callers that only inspect `decision.resetAt` remain fail-safe (conservative: `resetAt >= retryAt`),
and custom `RateLimitStore` implementations that omit `retryAt` continue to work unchanged.

### Recommended rolling algorithm: exact rational GCRA

#### State representation (O(1) per key)

Each active key stores one fixed-size record representing its Theoretical Arrival Time (TAT) — the
exact instant when the leaky bucket becomes empty (full burst capacity restored) — as a rational
number `tatMs + tatRem / den` in epoch milliseconds:

```ts
/** Internal persisted state for one GCRA key (O(1) size, JSON- and V8-clone-safe). */
interface StoredGcraState {
  readonly v: 1;
  readonly p: 'gcra';
  /** Whole epoch milliseconds of the Theoretical Arrival Time. */
  readonly tatMs: number;
  /** Rational remainder numerator in [0, den - 1]. */
  readonly tatRem: number;
  /** Denominator (the `limit` active when written). */
  readonly den: number;
}
```

Why `{ tatMs, tatRem, den }` instead of floating-point milliseconds or `BigInt` persistence:

- **Zero floating-point drift**: Non-divisible ratios like `windowMs = 1_000, limit = 3`
  (`333.333... ms`) stay exact across arbitrary sequences with no accumulated rounding error.
- **Zero `BigInt` serialization overhead**: Plain safe integers serialize directly in both Deno KV
  structured clone and `RedisKvAdapter`'s plain-JSON fast path (`packages/kv/adapters/redis/codec.ts`,
  lines 58–60), bypassing the `bigints` metadata envelope.
- **Safe dynamic `limit` changes**: Storing `den` allows a rolling deployment that changes `limit`
  on an active key to rescale the stored TAT conservatively (`ceilDiv(oldScaled * L, D)`) without
  corrupting the fractional remainder or resetting live quota.
- **O(1) size**: At most ~75 bytes JSON in Redis (including the `StoredValue` versionstamp envelope)
  and ~48 bytes in Deno KV, independent of `limit` and `windowMs`.

#### Pure transition function (exact `BigInt` arithmetic)

Let `L = BigInt(request.limit)`, `W = BigInt(request.windowMs)`,
`B = BigInt(policy.burst ?? request.limit)`, `N = BigInt(request.now) * L`, and
`ceilDiv(a, b) = (a + b - 1n) / b` for positive `a, b`.

In scaled units (where `1 ms = L` units), the emission interval `W / L` ms is exactly `W` units,
the delay variation tolerance `(B - 1) * (W / L)` ms is `(B - 1) * W` units, and the full burst
budget `B * (W / L)` ms is `B * W` units:

1. **Resolve current `tat`**:
   - If no stored state exists: `tat = N`.
   - Else validate `stored`: `v === 1`, `p === 'gcra'`, `tatMs >= 0`, `den >= 1`,
     `0 <= tatRem < den` (all safe integers); throw `TypeError('Invalid rate-limit state in KV')`
     on failure.
   - Compute `oldScaled = BigInt(stored.tatMs) * D + BigInt(stored.tatRem)` where `D = BigInt(stored.den)`.
   - Rescale to `L`: `rescaled = D === L ? oldScaled : ceilDiv(oldScaled * L, D)`.
   - `tat = rescaled > N ? rescaled : N` (if `rescaled <= N`, the key is idle / fully recovered).
2. **Evaluate tentative reservation**:
   - `newTat = tat + W`.
   - Check overflow: if `ceilDiv(newTat, L) > BigInt(Number.MAX_SAFE_INTEGER)`, throw
     `RangeError('rateLimit window exceeds safe time')`.
3. **Admit or deny**:
   - **Deny** when `newTat - N > B * W`:
     - Because `tat <= N` implies `newTat - N === W <= B * W` (for `B >= 1`), denial guarantees
       `tat > N` and `allowAtScaled = tat - (B - 1n) * W >= N + 1n`.
     - `retryAt = Number(ceilDiv(allowAtScaled, L))` (strictly `> request.now`).
     - `resetAt = Number(ceilDiv(tat, L))` (check `<= Number.MAX_SAFE_INTEGER`; always `>= retryAt`).
     - Return `{ allowed: false, resetAt, retryAt }` with **no state mutation and no KV write**.
   - **Admit** when `newTat - N <= B * W`:
     - `resetAt = Number(ceilDiv(newTat, L))` (strictly `> request.now` since `W >= 1`).
     - `nextState = { v: 1, p: 'gcra', tatMs: Number(newTat / L), tatRem: Number(newTat % L), den: request.limit }`.
     - `expireIn = Math.max(1, resetAt - request.now)`.
     - Return `{ allowed: true, resetAt }` and persist `nextState` with TTL `expireIn`.

#### Exact millisecond eligibility property

When GCRA denies a request with `retryAt`:

- At `now' = retryAt - 1`, `N' = (retryAt - 1) * L < allowAtScaled`, so `tat + W - N' > B * W` and
  a retry is still **denied**.
- At `now' = retryAt`, `N' = retryAt * L >= allowAtScaled`, so `max(tat, N') + W - N' <= B * W` and
  a retry is **admitted** (assuming no intervening reservation consumed the slot).

#### Admission envelope (honest specification)

GCRA is a **leaky-bucket / token-bucket rolling rate limiter**, not a strict sliding-window count:

- **Shift-invariant**: Shifting every arrival timestamp by any constant `c` produces identical
  `allowed` results and shifts `resetAt`/`retryAt` by exactly `c`. Both issue #2653 alignment
  sequences (`[100, 200, 300, 400]` and `[59_850, 59_950, 60_050, 60_150]` at `limit: 2, windowMs: 60_000`)
  return `[true, true, false, false]`.
- **Instantaneous burst bound**: At most `burst` (default `limit`) requests are ever admitted in an
  arbitrarily short interval, regardless of clock alignment. Boundary doubling (`2 * limit` in 2 ms)
  is eliminated.
- **Sustained rate bound**: Over any interval of length `Δt`, at most
  `burst + floor(Δt * limit / windowMs)` requests are admitted, so long-run throughput never exceeds
  `limit / windowMs`.
- **Single-window difference vs strict sliding log**: Starting from idle with `burst = limit`, a
  caller can send `limit` requests immediately plus `limit - 1` paced requests spaced by
  `windowMs / limit` inside one half-open interval `[t, t + windowMs)` (up to `2 * limit - 1`
  total, e.g., `[59_850, 59_950, 89_850]` admits 3 requests for `limit: 2, windowMs: 60_000`).
  Unlike fixed windows, those extra `limit - 1` requests cannot arrive as a burst; they are strictly
  paced at one per `windowMs / limit`. See [Rationale and alternatives](#rationale-and-alternatives)
  and [Unresolved questions](#unresolved-questions).

### Storage bounds and memory eviction (`MemoryRateLimitStore`)

- Each key in `Map<string, MemoryGcraEntry>` stores `{ tatMs, tatRem, den, resetAt }` (four safe
  numbers — O(1) memory per key, matching fixed-window's `{ count, resetAt }`).
- Map key stays `JSON.stringify([request.key, request.windowMs])`, isolating different window
  durations on the same store instance just like fixed-window.
- Rotating eviction remains identical (`memory-rate-limit-store.ts:44-51`): on every `consume()`,
  inspect at most 32 entries from the front of the `Map` and delete entries where
  `entry.resetAt <= request.now`. Because `entry.resetAt === ceil(tat / den)`, any entry with
  `entry.resetAt <= request.now` is already 100% idle (`tat <= request.now * den`), so deletion is
  **lossless**.
- Live entries (`entry.resetAt > request.now`) are never evicted to admit new keys.
- When a new key arrives and `entries.size >= maxKeys`, the store rejects conservatively without
  mutating the map (`{ allowed: false, resetAt: now + ceil(B * W / L), retryAt: now + ceil(W / L) }`).
- Zero timers and zero shutdown lifecycle required.

### Shared KV key layout, atomicity, and contention (`KvRateLimitStore`)

- **Key tuple**: `[...prefix, 'v1', 'gcra', request.key, request.windowMs]`.
  - Distinct arity (`prefix.length + 4`) and literal tag segments (`'v1'`, `'gcra'`) separate GCRA
    keys from fixed-window keys (`[...prefix, request.key, request.windowMs, resetAt]`).
  - Operators switching an existing limiter from fixed-window to GCRA should still allocate a fresh
    `prefix` (consistent with [`packages/service/README.md`](../packages/service/README.md) §
    "Anonymous route rate limits").
  - Pre-existing backend note (source-inspected in
    [`packages/kv/adapters/redis/serialization.ts`](../packages/kv/adapters/redis/serialization.ts),
    lines 37–46): `RedisKvAdapter` joins key parts with `:` without escaping, so custom keys
    containing `:` share the same backend encoding constraint already documented in
    [`packages/kv/README.md`](../packages/kv/README.md) (lines 109–113).
- **Atomic primitives**: Uses only `kv.get(key)` and single-key
  `kv.atomic([{ key, versionstamp: entry?.versionstamp ?? null }], [{ type: 'set', key, value: nextState, expireIn }])`.
  - Zero `kv.list()` scans; zero `getMany()` multi-key reads; zero multi-key transactions.
  - `expireIn = Math.max(1, resetAt - request.now)` is always a positive safe integer bounded by
    `1 <= expireIn <= ceil(B * W / L)` (at most `windowMs` when `burst === limit`), because any
    admitted reservation satisfies `newTat - N <= B * W` (even after a backward clock jump, larger
    deficits are denied without writing). This avoids the falsy `expireIn: 0` permanent-key trap in
    both `RedisKvAdapter` (`packages/kv/adapters/redis.adapter.ts:425`) and `MemoryKvAdapter`
    (`packages/kv/adapters/memory.adapter.ts:513`), and satisfies Deno KV's positive TTL requirement.
  - Denied requests return immediately after `kv.get()` without calling `kv.atomic()`, so rejected
    traffic performs no KV writes and never extends TTL.
- **Contention and retry behavior**:
  - Retries failed CAS commits up to `maxAttempts` (default `8`, allowed `1..32`), checking
    `request.signal?.throwIfAborted()` before each `get()` and before each `atomic()`.
  - On `DenoKvAdapter`: native optimistic concurrency check on the single key.
  - On `RedisKvAdapter`: in-process calls serialize on `atomicTail`; `tryCommit()` checks the
    versionstamp after `WATCH` + `MGET` and returns `{ ok: false }` immediately on mismatch (no
    wasted internal retries), letting `KvRateLimitStore` re-read and recompute GCRA state cleanly.
    If another process writes between `WATCH` and `EXEC`, `RedisKvAdapter` retries internally up to
    `REDIS_ATOMIC_MAX_ATTEMPTS = 5` and returns `{ ok: false }` if the check fails on retry.
  - On `MemoryKvAdapter`: checks and writes execute synchronously in one turn.
  - If all `maxAttempts` fail due to CAS conflict, `KvRateLimitStore` rejects conservatively with
    `allowed: false`, `retryAt = now + Math.ceil(windowMs / limit)`, and
    `resetAt = Math.max(lastObservedResetAt, retryAt)`. It never admits a request without a
    committed reservation.
  - Storage I/O failures and corrupt stored values (`TypeError`) propagate to the caller/error
    handler and never fail open.
- **Cardinality note**: As with fixed-window KV counters, TTL bounds each key's lifetime rather
  than total live key count across distinct keys; backend capacity controls and bounded/canonical
  keys remain the operator's responsibility.

### Memory and KV parity

Because both `createMemoryRateLimitStore` and `createKvRateLimitStore` invoke the exact same pure
domain function `evaluateGcra()` over exact `BigInt` rational math:

- Under any sequential or deterministic-clock workload without capacity pressure or CAS exhaustion,
  `MemoryRateLimitStore`, `KvRateLimitStore(MemoryKvAdapter)`, `KvRateLimitStore(DenoKvAdapter)`,
  and `KvRateLimitStore(RedisKvAdapter)` return identical `{ allowed, resetAt, retryAt? }` values.
- Under concurrent shared-KV reservations against the same key, serializable CAS guarantees at most
  `burst` simultaneous admissions at one instant (conservative rejection under extreme contention),
  matching fixed-window's concurrent safety contract.

### Clock assumptions and edge cases

1. **Epoch-millisecond clock**: `RateLimitRequest.now` remains wall-clock epoch milliseconds (from
   `options.now ?? Date.now`), required because distributed replicas sharing KV do not share a
   monotonic `performance.now()` epoch and callers expect epoch-ms `resetAt`/`retryAt`.
2. **Multi-host clock skew**: Replicas sharing a KV prefix require NTP-synchronized clocks (skew
   `Δ << windowMs`), matching the existing requirement in
   [`packages/service/README.md`](../packages/service/README.md) (line 799). Unlike fixed-window or
   weighted two-window counters, GCRA has no shared epoch boundary where skew splits keys across
   adjacent windows. Because `base = max(tat, now * L)`, a ahead-of-time replica advances `tat` by
   at most `Δ` (making behind-time peers conservatively stricter), while a behind-time replica never
   moves `tat` backwards.
3. **Single-host backward clock step**: If `now` steps backwards while a key is active, `tat` stays
   monotonic (`base = tat`), live memory entries stay above `request.now` (not evicted), and
   `newTat - N` increases by the backward step — causing conservative rejection until the clock
   catches up or TTL expires. `expireIn = Math.max(1, resetAt - request.now)` remains strictly
   positive.
4. **Injected test clock vs backend TTL clock**: KV adapters interpret `expireIn` relative to the
   backend's wall clock (`Date.now() + expireIn` in `MemoryKvAdapter`). Fast-forwarding an injected
   `now` in tests works deterministically without sleeping because `evaluateGcra()` checks logical
   idle expiry (`tat <= now * L`) directly against `request.now`.
5. **Sub-millisecond emission intervals (`windowMs < limit`)**: Because arithmetic scales by `L`,
   `limit: 1_000, windowMs: 100` works without division by zero, admitting `burst` immediately and
   refilling at `10` requests per millisecond with `resetAt >= now + 1` and `retryAt >= now + 1`.

### Implementation gating test plan

Any implementation PR following acceptance of this RFC MUST pass all of the following test suites
(plus existing tests unmodified):

| Gate / Test group | Required assertions | Backends covered |
| --- | --- | --- |
| 1. Issue #2653 deterministic alignment parity | Both `[100, 200, 300, 400]` and `[59_850, 59_950, 60_050, 60_150]` with `limit: 2, windowMs: 60_000` return `[true, true, false, false]`; exact `resetAt` and `retryAt`; `retryAt - 1` denied and `retryAt` admitted. | `MemoryRateLimitStore`, `KvRateLimitStore(MemoryKvAdapter)`, `KvRateLimitStore(DenoKvAdapter)` |
| 2. Exact rational & sub-ms arithmetic | Non-divisible `limit: 3, windowMs: 1_000` (exact `334` ms eligibility, no drift over 100+ ticks); sub-ms `limit: 1_000, windowMs: 100`; high `limit: 100_000, windowMs: 3_600_000` (proving O(1) state with no limit cliff). | Pure domain unit test + Memory + KV |
| 3. Explicit `burst` behavior | Default `burst = limit`; `burst: 1` strict spacing; `burst < limit`; invalid `burst` (`0`, `-1`, `0.5`, `NaN`, `Infinity`) throws `RangeError` at construction. | Memory + KV |
| 4. Shared KV concurrency | 30 concurrent `Promise.all` reservations at identical `now` against `limit: 5, windowMs: 1_000` admit `0 < admitted <= 5` (never `> 5`); subsequent sequential calls fill exactly remaining `5 - admitted` slots; next call denied with exact `retryAt`; `kv.list` throws if ever invoked. | `MemoryRateLimitStore`, `KvRateLimitStore(MemoryKvAdapter)`, `KvRateLimitStore(DenoKvAdapter)` |
| 5. KV CAS exhaustion, write-free denial & TTL | Forced `{ ok: false }` on `kv.atomic` stops after `maxAttempts` reads/commits and returns `{ allowed: false, resetAt, retryAt }` with `now < retryAt <= resetAt`; quota-exhausted denial performs `0` `kv.atomic` writes; `expireIn >= 1` on every write; real-clock TTL eviction removes expired KV key; two store instances sharing one `kv` and `prefix` enforce one shared rolling quota. | `KvRateLimitStore(MemoryKvAdapter)` + mock wrapper |
| 6. Clock edge cases | Backward clock step (`now` decreases) never over-admits and never drops live state; fast-forwarded injected `now` past `tat` resets bucket logically even before real-time KV TTL expires; `limit` change on active key rescales `den` without corrupting state; near-`MAX_SAFE_INTEGER` overflow throws `RangeError`. | Memory + KV |
| 7. Memory capacity & rotating eviction | `MemoryRateLimitStore({ maxKeys: 2, policy: { kind: 'gcra' } })` rejects 3rd key with `now < retryAt <= resetAt` without evicting live keys, and reclaims capacity once `now >= resetAt`. | `MemoryRateLimitStore` |
| 8. Corrupt state & cancellation | Malformed KV values (bare number, missing tag, `tatRem >= den`, negative `tatMs`) throw `TypeError`; aborted `AbortSignal` rejects before IO and between CAS attempts without admitting. | Memory + KV |
| 9. Middleware `Retry-After` integration | Rolling rejection sets whole-second `Retry-After` from `decision.retryAt` (rounded up at response-time `now()`); fixed-window and custom stores without `retryAt` fall back to `decision.resetAt`; CORS headers wrap `429`; unselected routes perform zero store IO. | `createService().withRateLimit()` + `createRateLimitMiddleware()` |
| 10. Default compatibility regression | Existing `packages/service/tests/rate-limit_test.ts` and `rate-limit-address-key_test.ts` pass unmodified, including exact deep equality `{ allowed: false, resetAt: 5000 }` on default fixed-window stores. | Existing test suite |
| 11. Static, docs, quality, publish gates | Scoped `run-deno-check.ts`, `run-deno-lint.ts`, `run-deno-fmt.ts`, `deno task doc:lint --root packages/service`, `deno task docs:jsdoc-examples`, `deno task quality:gate`, and `deno publish --dry-run --allow-dirty` in `packages/service` all exit `0`. | Repository tooling |

## Drawbacks

1. **Not a strict sliding-window count**: With default `burst = limit`, GCRA admits up to
   `2 * limit - 1` requests across one rolling `windowMs` starting from idle (`limit` immediately +
   `limit - 1` paced at `windowMs / limit`). Callers expecting a strict `count(now - windowMs, now] <= limit`
   invariant (for example, strict upstream billing contracts where `[59_850, 59_950, 89_850]` must
   reject the third request at `89_850`) must either set `burst: 1` (sacrificing burstiness) or wait
   for a future capped sliding-log policy.
2. **Additional field on `RateLimitDecision`**: Direct `store.consume()` callers adopting rolling
   policies should read `decision.retryAt ?? decision.resetAt` for optimal retry timing (reading
   only `resetAt` remains safe but waits for full bucket recovery).
3. **Slightly larger stored record**: A GCRA KV entry stores a small 5-field JSON object (~75 bytes
   with versionstamp envelope in Redis) instead of fixed-window's single integer, and uses one
   mutable key per `(key, windowMs)` rather than rotating keys per epoch window (though contention
   per live key is identical within any active window).
4. **Hot-key CAS ceiling remains**: As in fixed-window, `KvStore.atomic()` uses optimistic CAS
   bounded by `maxAttempts` (default 8, max 32); extreme single-key write contention can cause
   conservative rejections before `limit` slots are consumed.

## Rationale and alternatives

### Comparison across candidate designs

| Dimension | 1. Strict rolling admission (Sliding Window Log) | 2. Approximate rolling counters (Weighted Two-Window) | 3. Explicit burst/refill budget (GCRA — **Recommended**) | 4. Fixed windows + reducing duplicate reads (Alternative) |
| --- | --- | --- | --- | --- |
| **Sequence A** `[100, 200, 300, 400]` (`L=2, W=60s`) | `[T, T, F, F]`; `retryAt = 60_100` (`Retry-After: 60`) | `[T, T, F, F]` | `[T, T, F, F]`; `retryAt = 30_100` (`Retry-After: 30`) | `[T, T, F, F]`; `resetAt = 60_000` |
| **Sequence B** `[59_850, 59_950, 60_050, 60_150]` | `[T, T, F, F]`; `retryAt = 119_850` (`Retry-After: 60`) | `est < L`: `[T, T, T, F]` (**3 admitted!**); `est + 1 <= L`: `[T, T, F, F]` | `[T, T, F, F]`; `retryAt = 89_850` (`Retry-After: 30`) | `[T, T, T, T]` (**4 admitted** unless collapsed to 1 read) |
| **Sequence C** `[59_850, 59_950, 89_850]` (3rd at +30s) | `[T, T, F]` (strict `<= 2` in 60s) | `est + 1 <= L`: denies `89_850`, **admits at `90_000`** (3 in 30.15s) | `[T, T, T]` (paced refill after `W/L = 30s`) | `[T, T, T]` |
| **Sequence D** `[0, 100]` then `60_050` (>60s later) | `[T, T]` → `T` (exact) | **`F` (false deny!)** until `~90_000` (previous window assumed uniform) | `[T, T]` → `T` (exact) | `[T, T]` → `T` |
| **Max in any rolling `windowMs`** | **`limit` (1.0× exact)** | `~1.5 * limit` (plus false denials) | `limit + burst - 1` (`2 * limit - 1` at `burst = limit`, paced; `limit` at `burst = 1`) | `2 * limit` (2× instantaneous spike) |
| **Max instantaneous burst** | `limit` (shift-invariant) | `limit` or `limit + 1` (boundary-sensitive) | `burst` (default `limit`; shift-invariant) | `2 * limit` at clock boundary |
| **Storage bound per key** | **O(limit)** — up to `limit` timestamps per key. Hits Deno KV's 64 KiB value limit around a few thousand entries; amplifies Redis JSON payloads (~6–14 B × `limit` per read and write) and breaks `MemoryRateLimitStore.maxKeys` RAM cap (`10_000 × 1_000 × 8 B ≈ 80 MB`) unless a hard `maxLimit` cap (e.g., `<= 256` or `<= 1_000`) and total-entry cap are imposed. | **O(1)** — two counters + window id (1 packed key or 2 epoch keys). | **O(1)** — one fixed record `{ v, p, tatMs, tatRem, den }` (~48–75 B) for any positive safe integer `limit` (`1..MAX_SAFE_INTEGER`). Zero `maxLimit` cliff. | **O(1)** (unchanged fixed-window counter) + external cache/coalescing state elsewhere. |
| **KV atomicity & contention** | Single-key `kv.get` + `kv.atomic([check], [set])` if stored as one array, **but** O(limit) read/decode/encode/write widens the CAS conflict window under concurrency. Multi-key per-timestamp storage would require `kv.list()` scans (forbidden) or multi-key atomic limits. | Two-key layout requires `getMany(2)` + 2-key `AtomicCheck` (contention across window boundary and optional `getMany` fallback). Packed 1-key layout uses 1 `get` + 1-key CAS with `expireIn: 2 * windowMs`. | Single-key `kv.get` + `kv.atomic([{ key, versionstamp }], [{ type: 'set', key, value, expireIn }])`. Tiny constant payload minimizes CAS window; zero scans; zero writes on deny; bounded `maxAttempts` (`1..32`). | Unchanged single-key `kv.get` + `kv.atomic` on fixed window key. |
| **Memory / KV parity** | Exact parity possible **within the `maxLimit` cap**, provided memory enforces the same cap and sorted insertion. | Exact parity possible with integer cross-multiplication, **if** both use identical packed 2-window state; two-key KV can diverge under partial TTL eviction if `prev` expires early. | **Exact bit-for-bit parity** via shared pure `evaluateGcra()` across memory, `MemoryKvAdapter`, `DenoKvAdapter`, and `RedisKvAdapter` for all valid inputs. | Unchanged fixed-window parity; duplicate-read reduction lives outside the store so store parity is unchanged. |
| **Clock assumptions** | Epoch ms across hosts; skewed hosts can insert out-of-order timestamps (requires sorted insert, not blind append); backward jump keeps live entries conservative, needs `max(newest, now) + windowMs - now` for `expireIn`. | Epoch ms across hosts; still anchored to epoch boundaries so inter-host skew near `W` splits keys and distorts `w = (W + windowMs - now) / windowMs`. | Epoch ms across hosts; **no epoch boundaries to disagree on**; `tat` is monotonically non-decreasing (`base = max(tat, now * L)`), so clock skew/backward steps fail conservative and `expireIn >= 1`. | Epoch ms across hosts; skew near epoch boundary widens 2× leakage window. |
| **Default compatibility** | Additive opt-in policy, **except** arbitrary `limit` values accepted by `RateLimitRequest` would fail at runtime with `RangeError` above `maxLimit` unless `RateLimitStore` exposes a cap. | Additive opt-in policy; `Retry-After` is awkward when `c_curr >= limit` (even after `W_end`, `c_curr` becomes `c_prev` so `est + 1 <= limit` still denies at `W_end`!). | **100% additive opt-in**; fixed-window defaults untouched; every valid `(limit, windowMs)` works without hidden store caps; `retryAt ?? resetAt` is backward-compatible. | 100% compatible; zero changes to `@netscript/service/rate-limit`. |

### Why GCRA is recommended

1. **General-purpose O(1) bound without a `limit` cliff**: `@netscript/service/rate-limit` is a
   general framework store whose contract (`RateLimitRequest`) accepts any positive safe integer
   `limit` and `windowMs`. A sliding-window log cannot serve common hourly or daily quotas (such as
   `limit: 5_000, windowMs: 3_600_000`) within Deno KV's 64 KiB value cap or `MemoryRateLimitStore`'s
   `maxKeys` memory bound, and it cannot validate its `limit` cap at middleware construction time
   without leaking store-specific limits onto `RateLimitStore`. GCRA gives constant ~48–75 byte state
   per key across the full `1..Number.MAX_SAFE_INTEGER` domain.
2. **Eliminates clock-boundary sensitivity and cliff retries**: GCRA is 100% shift-invariant, passes
   both issue #2653 alignment sequences identically, removes the 2× instantaneous boundary spike, and
   releases capacity smoothly at one slot per `windowMs / limit` instead of creating synchronized
   thundering-herd retries at `oldest + windowMs`.
3. **Minimal CAS footprint in shared KV**: One tiny read and one single-key versionstamp CAS keeps
   serialization and round-trip cost identical to fixed windows on `DenoKvAdapter` and
   `RedisKvAdapter`, with no `kv.list()` scans and no multi-key coordination.
4. **Cleanly rejects approximate two-window counters**: Weighted two-window counters fail the core
   correctness goal in both directions — under `est < limit` they over-admit on issue #2653's exact
   boundary sequence (`[true, true, true, false]`), while under `est + 1 <= limit` they still admit
   3 requests in 30.15 s and **falsely reject** legitimate requests that arrive more than `windowMs`
   after an early-window burst (Sequence D), with inconsistent `Retry-After` math when `c_curr >= limit`.
5. **Complements rather than competes with duplicate-read reduction**: Coalescing duplicate client
   reads (such as SDK GET deduplication, TanStack Query `staleTime`, `ETag`/`304`, or server-side
   single-flight caches) reduces legitimate read load and should still be used where responses are
   shareable, but it cannot substitute for a server-side quota boundary against uncached,
   parameterized, multi-client, or adversarial reads.
6. **Preserves room for strict sliding-log if ever required**: Because `RateLimitPolicy` is a
   discriminated union, a future capped `{ kind: 'sliding-log', maxLimit?: number }` variant could
   be added behind the same option and `RateLimitDecision` contract without breaking GCRA or
   fixed-window callers.

## Breaking changes and migration

This RFC introduces **no breaking changes**:

- `createMemoryRateLimitStore()` and `createKvRateLimitStore(kv, { prefix })` continue to default to
  `{ kind: 'fixed-window' }` with identical key layouts, eviction, and exact `{ allowed, resetAt }`
  decision objects.
- `RateLimitStore`, `RateLimitRequest`, and `ServiceRateLimitOptions` remain source- and
  runtime-compatible. Custom `RateLimitStore` implementations that omit `retryAt` continue to
  compile and work in `createRateLimitMiddleware()`.
- **Migration for opting in**:
  1. Choose a **new, dedicated KV `prefix`** when switching a deployed limiter from fixed-window to
     `policy: { kind: 'gcra' }` so old fixed-window counters expire naturally without sharing a
     namespace.
  2. Pass `policy: { kind: 'gcra' }` (or `{ kind: 'gcra', burst }`) to `createMemoryRateLimitStore`
     or `createKvRateLimitStore`.
  3. Direct callers of `store.consume()` that format `Retry-After` or `RateLimitError.retryAfter`
     should update from `decision.resetAt` to `decision.retryAt ?? decision.resetAt`. Callers using
     `createRateLimitMiddleware()` / `.withRateLimit()` get this automatically.

## Prior art

- **RFC 9110 § 10.2.3 (`Retry-After`)**: Defines `Retry-After` as delay-seconds indicating how long
  the service is expected to be unavailable to the requesting client; `Math.max(1, Math.ceil((nextEligibleAt - now) / 1000))`
  matches NetScript's existing whole-second ceiling convention.
- **IETF HTTP `RateLimit` Header Fields draft**: Separates `reset` (seconds until quota resets) from
  `Retry-After` (seconds until a rejected client may retry), directly motivating keeping `resetAt`
  as full quota reset and adding `retryAt` for next-slot eligibility.
- **GCRA (ITU-T I.371 / Brandur's "Scaling your API with rate limiters" / `redis-cell`)**: Standard
  O(1) single-timestamp formulation mathematically isomorphic to a continuous-time leaky/token bucket,
  requiring only one CAS key in distributed stores.
- **NetScript `#2224` (`packages/service/src/rate-limit/`)**: Established the zero-timer bounded
  memory store, single-key CAS KV store with bounded `maxAttempts`, `AbortSignal` propagation, and
  explicit `ServiceProxyTrust` / IPv6 `/64` bucketing that this RFC preserves.
- **NetScript `#2365` (device-grant polling cadence)**: Separate domain requirement for dynamic
  per-credential intervals that increase monotonically on upstream `slow_down` responses over a
  grant's lifetime; intentionally decoupled from static route/read quotas here.

## Unresolved questions

1. **Primary rolling algorithm — GCRA vs capped strict sliding-window log**: Should the initial
   rolling policy be GCRA (O(1) storage per key, arbitrary safe-integer `limit`, shift-invariant
   burst bound `<= burst`, up to `2 * limit - 1` paced requests in one `windowMs` from idle), or do
   protected service reads require a strict `<= limit` count in every rolling `windowMs` interval
   even if that requires O(limit) storage per key and a hard `maxLimit` cap (e.g., `<= 256` or
   `<= 1_000`)?
2. **`RateLimitDecision` retry timing surface**: Should `RateLimitDecision` add optional
   `retryAt?: number` while keeping `resetAt` as full quota recovery (recommended), or redefine
   `resetAt` to mean "next eligible instant when `allowed === false`" (zero new fields, but
   non-monotonic allow-vs-deny meaning)?
3. **`burst` knob scope in v1**: Should `{ kind: 'gcra', burst?: number }` include optional `burst`
   in the first implementation — and if so, should `burst > limit` be allowed (general token bucket:
   rate `limit / windowMs`, capacity `burst`) or constrained to `1 <= burst <= limit` — or should v1
   fix `burst = limit` and defer explicit `burst`?
4. **Policy option ergonomics**: Is the discriminated union `{ kind: 'fixed-window' } | { kind: 'gcra'; burst?: number }`
   preferred as the single canonical shape, or should string shorthand (`'fixed-window' | 'gcra'`)
   also be accepted?
5. **KV key scoping across `limit` changes**: Should GCRA keys omit `limit`
   (`[...prefix, 'v1', 'gcra', request.key, request.windowMs]`) and store `den` to preserve live
   quotas across rolling deploys that adjust `limit` (recommended), or include `limit` in the key
   (simpler stored shape, resets active buckets when `limit` changes)?
6. **Conservative `retryAt` under KV CAS exhaustion and memory `maxKeys` saturation**: Should
   contention/capacity rejections report `retryAt = now + Math.ceil(windowMs / limit)` (one refill
   interval, recommended for CAS contention), or should memory `maxKeys` saturation report
   `retryAt = now + windowMs` (more conservative while waiting for other keys to expire)?

## Future possibilities

- **Optional capped `'sliding-log'` policy**: If a strict compliance or billing quota later needs
  exact `count(now - windowMs, now] <= limit` for small limits (e.g., `limit <= 256`), it can be
  added as `{ kind: 'sliding-log', maxLimit?: number }` on `RateLimitPolicy` without changing
  `RateLimitStore` or `RateLimitDecision`.
- **Weighted request cost**: GCRA naturally supports `cost > 1` (e.g., expensive aggregate reads
  consuming multiple units by advancing `tat` by `cost * W`) with zero change to the O(1) stored
  state schema.
- **Post-authentication rate-limit stage**: A future `ServiceBuilder` / oRPC middleware seam can
  run a `RateLimitStore` after `authn`/`authz` so principal-keyed protected reads need no per-handler
  boilerplate.
- **Standard `RateLimit` / `RateLimit-Policy` response headers**: Because `resetAt` already records
  full quota recovery, optional header emission can project `resetAt` cleanly alongside
  `Retry-After`.
