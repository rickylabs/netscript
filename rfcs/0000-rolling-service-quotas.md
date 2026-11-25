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
preserving the existing fixed-window policy as the unchanged default. Callers sharing a rolling
store or KV prefix operate under a **single-coherent-policy precondition** via an optional `policy`
configuration accepting a discriminated union `RateLimitPolicy` defaulting to
`{ kind: 'fixed-window' }`, with `{ kind: 'gcra', burst?: number }` implementing the Generic Cell
Rate Algorithm (GCRA) over exact rational integer arithmetic using an O(1) four-field stored quota
record per key (and O(1) per-key memory in the standalone memory store) plus a single
version-checked KV atomic commit per attempt (with Redis commit confirmation conditional on
[#2648](https://github.com/rickylabs/netscript/issues/2648)). GCRA retention is fixed (no retention
option): each admitted KV write retains the record for its remaining active rolling horizon plus a
fixed `5_000` ms clock-skew bound (`GCRA_CLOCK_SKEW_BOUND_MS`), standalone `MemoryRateLimitStore`
applies the same `resetAt + GCRA_CLOCK_SKEW_BOUND_MS <= now` eviction horizon so cross-key backward
clock steps `< 5_000` ms preserve debt identically across memory and KV, and upfront validation
enforces a `365`-day ceiling (`MAX_GCRA_TTL_MS = 31_536_000_000` ms) aligned with Deno KV's adapter
TTL limits so no accepted rolling configuration can ever emit a backend-rejected TTL.
`RateLimitDecision` preserves `resetAt` as full quota recovery (epoch-aligned window end for fixed
windows; full bucket recovery for GCRA) and adds an optional `retryAt` field carrying the exact
earliest representable next eligible epoch millisecond on quota-exhaustion denials (or throwing
`RangeError` when no representable commit instant exists), and an advisory backoff timestamp on
contention and capacity denials; middleware and callers derive `Retry-After` uniformly from
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
| [`packages/service/src/rate-limit/domain/rate-limit.ts`](../packages/service/src/rate-limit/domain/rate-limit.ts) (lines 4–39) | `RateLimitRequest` takes `{ key, limit, windowMs, now, signal? }` with positive safe integer `limit`/`windowMs` and non-negative safe integer epoch ms `now`; `limit` JSDoc says *"Maximum reservations in one window"*. `RateLimitDecision` is `{ allowed: boolean; resetAt: number }`, documenting `resetAt` as *"Epoch milliseconds at which this fixed window ends."* `rateLimitWindow()` validates inputs and computes `now - now % windowMs + windowMs`. | Any rolling policy must define compatible `resetAt` semantics, distinguish exact vs advisory retry timing without breaking `{ allowed, resetAt }` consumers, and update policy-dependent JSDoc on `RateLimitRequest`. |
| [`packages/service/src/rate-limit/middleware/options.ts`](../packages/service/src/rate-limit/middleware/options.ts) (lines 20–40) | `ServiceRateLimitOptions.limit` JSDoc says *"Maximum accepted requests per key per fixed window"* and `windowMs` says *"Epoch-aligned window duration in milliseconds."* | Implementation must update these JSDoc descriptions to cover both fixed-window and opt-in rolling stores. |
| [`packages/service/src/rate-limit/ports/rate-limit-store.ts`](../packages/service/src/rate-limit/ports/rate-limit-store.ts) (lines 17–20) | `RateLimitStore` exposes a single method `consume(request: RateLimitRequest): Promise<RateLimitDecision>`. | Keeping the port method signature unchanged preserves drop-in compatibility with custom stores and `ServiceRateLimitOptions`. |
| [`packages/service/src/rate-limit/adapters/memory-rate-limit-store.ts`](../packages/service/src/rate-limit/adapters/memory-rate-limit-store.ts) (lines 10–68) | `MemoryRateLimitStoreOptions` has `{ maxKeys?: number }` (default `10_000`). Stores `{ count, resetAt }` keyed by `JSON.stringify([request.key, request.windowMs])`, performs synchronous reservations, evicts up to 32 expired entries (`counter.resetAt <= request.now`) via rotating `Map` scan, rejects new keys at capacity without evicting live quotas, and holds no timers. | Rolling memory state must remain O(1) per key so `maxKeys` continues to bound standalone memory-store usage without timers or extra eviction passes. |
| [`packages/service/src/rate-limit/adapters/kv-rate-limit-store.ts`](../packages/service/src/rate-limit/adapters/kv-rate-limit-store.ts) (lines 11–69) | `KvRateLimitStoreOptions` has `{ prefix: KvKey; maxAttempts?: number }` (default `8`, max `32`). Requires `kv.atomic` at construction. Uses single-key `kv.get` + `kv.atomic([{ key, versionstamp }], [{ type: 'set', key, value: count + 1, expireIn: resetAt - request.now }])` on `[...prefix, request.key, request.windowMs, resetAt]`. No `kv.list()` scans; rejects without writing when exhausted; throws `TypeError` on corrupt KV state. | Rolling KV state must preserve single-key CAS, zero scans, zero writes on rejection, bounded `maxAttempts`, positive `expireIn` within backend adapter limits, and fixed-window zero-margin regression parity. |
| [`packages/service/src/rate-limit/middleware/rate-limit-middleware.ts`](../packages/service/src/rate-limit/middleware/rate-limit-middleware.ts) (lines 29–96) | Calls `store.consume(...)` with `now()`, and on `!decision.allowed` sets `Retry-After` to `String(Math.max(1, Math.ceil((decision.resetAt - now()) / 1000)))` and returns `429` JSON `{ error: 'RATE_LIMITED' }`. | Middleware must prefer an explicit retry timestamp (`decision.retryAt ?? decision.resetAt`) so rolling rejections emit accurate `Retry-After` headers while custom fixed-window stores stay unchanged. |
| [`packages/service/src/builder/service-builder-impl.ts`](../packages/service/src/builder/service-builder-impl.ts) (lines 310–313, 458–461, 515–524) | `.withRateLimit()` delegates to `this.use()`, which runs before `build()` installs `authn`/`authz`. | Pre-auth route quotas work automatically via `.withRateLimit()`; post-auth principal-keyed protected reads call `store.consume()` directly after authentication. Both paths rely on the same `RateLimitStore` and `RateLimitDecision` contract. |
| [`packages/kv/types/kv-store.ts`](../packages/kv/types/kv-store.ts) (lines 149–196) | `KvStore` offers `get`, optional `getMany`, and optional `atomic(checks, mutations)` where `AtomicMutation` is `set` (with `expireIn?`), `delete`, `sum`, `min`, `max`. Combine mutations (`sum`/`min`/`max`) are `bigint`-only and carry no `expireIn` or conditional clamp. | Atomic rolling reservations must use `get` + versionstamp-checked `atomic([{ key, versionstamp }], [{ type: 'set', ..., expireIn }])`. |
| [`packages/kv/adapters/deno-kv.adapter.ts`](../packages/kv/adapters/deno-kv.adapter.ts) (lines 202–235), [`packages/kv/adapters/redis.adapter.ts`](../packages/kv/adapters/redis.adapter.ts) (lines 273–435), [`packages/kv/adapters/memory.adapter.ts`](../packages/kv/adapters/memory.adapter.ts) (lines 197–219, 504–522, 586–601) | `DenoKvAdapter` passes `{ expireIn: mutation.expireIn }` verbatim to `Deno.Kv.atomic().set()` (`deno-kv.adapter.ts:216`), which enforces Deno KV's 64 KiB per-value cap and rejects `expireIn` values whose `Utc::now() + expireIn` exceeds `chrono::DateTime<Utc>::MAX_DATETIME` (`TypeError: Invalid mutation: expireIn is too large`). `RedisKvAdapter` serializes in-process `atomic()` via `atomicTail`, uses `WATCH`/`MGET`/`MULTI`/`EXEC` with up to `REDIS_ATOMIC_MAX_ATTEMPTS = 5` retries on null `EXEC` (`packages/kv/adapters/redis/types.ts:103`), JSON-encodes values via `encodeStoredValue`, and maps `expireIn` with `if (mutation.type === 'set' && mutation.expireIn) multi.psetex(...)` (`redis.adapter.ts:425`). **Crucially, `redis.adapter.ts:352–361` checks only `(await multi.exec()) === null` and reports `{ ok: true }` even when a queued command inside `EXEC` returned an error** (tracked in [#2648](https://github.com/rickylabs/netscript/issues/2648)). `MemoryKvAdapter` checks `expireIn ? Date.now() + expireIn : undefined` (`memory.adapter.ts:513`) and pushes an `expirationHeap` entry per expiring write, purging stale entries during its 1-second sweep. | (1) Shared-KV guarantees on `RedisKvAdapter` MUST be conditional on confirmed write outcomes (`#2648`). (2) Both `RedisKvAdapter` and `MemoryKvAdapter` treat `expireIn: 0` as falsy (no TTL — permanent key!), while `DenoKvAdapter` rejects oversized `expireIn` with `TypeError`, so rolling KV validation MUST bound `1 <= expireIn <= MAX_GCRA_TTL_MS` upfront before IO. (3) O(1) memory claims must be scoped to the stored quota record and standalone `MemoryRateLimitStore`, not `MemoryKvAdapter`'s transient expiration heap. |
| [`packages/kv/adapters/redis/serialization.ts`](../packages/kv/adapters/redis/serialization.ts) (lines 37–46) | `keyToRedisKey` concatenates `KvKey` parts with `:` using `String(part)` without type tags or escaping (also noted in [`packages/kv/README.md`](../packages/kv/README.md), lines 109–113). | **In Redis, tuple arity alone cannot isolate keys.** Independent limiters and policy cutovers must use key prefixes that are **disjoint after serialization**. |
| [`packages/service/tests/rate-limit_test.ts`](../packages/service/tests/rate-limit_test.ts) (lines 175, 209–212) | Existing tests assert exact deep equality `{ allowed: true, resetAt: 2000 }` and `{ allowed: false, resetAt: 5000 }` on fixed-window store decisions. | Fixed-window decisions MUST keep returning `{ allowed, resetAt }` without adding extra keys, and fixed-window KV writes MUST preserve zero-margin `expireIn = resetAt - request.now`. |
| [`packages/contracts/src/domain/schemas.ts`](../packages/contracts/src/domain/schemas.ts) (lines 68–71, 110–113) | Common `RateLimitError` contract carries `{ retryAfter: number; limit: number }` with `retryAfter` integer `>= 1` seconds. | Exposing exact quota-denial and advisory fallback retry timing on `RateLimitDecision` lets direct procedure callers populate `RateLimitError.retryAfter` with the same formula as HTTP middleware. |

### Goals

1. Eliminate wall-clock boundary doubling for callers that opt into rolling quotas in either
   `createMemoryRateLimitStore` or `createKvRateLimitStore`.
2. Preserve 100% backwards compatibility for default fixed-window callers, existing custom
   `RateLimitStore` implementations, zero-margin fixed-window KV TTLs, and existing
   `RateLimitDecision` assertions.
3. Scope rolling quota sharing to a single-coherent-policy caller precondition per store/prefix with
   an O(1) four-field stored quota record per key (and O(1) per-key memory in standalone
   `MemoryRateLimitStore`) across arbitrary positive safe integer `limit` values, subject to a
   single documented `365`-day retention TTL ceiling aligned with `DenoKvAdapter` (requests with
   different `(limit, windowMs, burst)` tuples hit independent policy-scoped buckets rather than
   being rejected at runtime).
4. Derive GCRA physical KV retention from the active rolling horizon plus a fixed `5_000` ms
   clock-skew bound (`GCRA_CLOCK_SKEW_BOUND_MS`) with no retention configuration option, preventing
   premature TTL loss under bounded clock skew independent of emission interval.
5. Preserve single-key versionstamp CAS atomicity in shared KV with zero scans, zero writes on
   denial, and bounded retry budgets — making Redis guarantees explicitly conditional on confirmed
   `EXEC` outcomes ([#2648](https://github.com/rickylabs/netscript/issues/2648)).
6. Achieve deterministic bit-for-bit parity between memory and KV adapters under explicit
   single-policy, confirmed-commit, and bounded-skew preconditions, and linearizable
   non-over-admission under concurrent shared-KV callers.
7. Define unambiguous semantics separating `resetAt` (full quota recovery), exact representable
   `retryAt` (guaranteed committable on quota exhaustion, or explicit `RangeError` when no
   representable commit instant exists), and advisory fallback `retryAt`/`resetAt` (CAS contention
   exhaustion and memory capacity saturation).

### Non-goals

- Changing the default policy of `createMemoryRateLimitStore`, `createKvRateLimitStore`, or
  `createRateLimitMiddleware` from fixed-window.
- Supporting mixed-policy rollout against a shared bucket or shared time-debt carryover across
  heterogeneous `(limit, windowMs, burst)` callers (deferred to [Future work](#future-work)).
- Exposing a configurable physical KV retention option (deferred to [Future work](#future-work)).
- Implementing per-credential dynamic monotonic poll pacing for OAuth device-grant flows (tracked
  separately in [#2365](https://github.com/rickylabs/netscript/issues/2365)).
- Moving `.withRateLimit()` after `.withAuthn()`/`.withAuthz()` on `ServiceBuilder`, or adding
  procedure-level oRPC rate-limit middleware.
- Modifying `packages/kv/` adapters in this RFC (Redis `EXEC` command-error confirmation is tracked
  separately in [#2648](https://github.com/rickylabs/netscript/issues/2648)).
- Adding new packages, external dependencies, Redis-specific Lua scripts, or background timers.

## Guide-level explanation

*Note: Code snippets in this section illustrate the proposed API (not yet implemented).*

### Preserving existing fixed-window defaults

Existing code continues to work with zero changes. Omitting `policy` keeps epoch-aligned fixed
windows with identical keys, storage, zero-margin TTLs, and `{ allowed, resetAt }` decision
objects:

```ts
// Proposed API (unchanged existing call — defaults to { kind: 'fixed-window' })
import { createMemoryRateLimitStore } from '@netscript/service/rate-limit';

const fixedStore = createMemoryRateLimitStore();
```

### Opting into rolling quotas (memory and shared KV)

Pass `policy: { kind: 'gcra' }` to either first-party store factory to enable alignment-independent
rolling admission with an O(1) stored record per key and automatic skew-bounded KV retention. All
callers sharing a rolling store/prefix use one coherent `(limit, windowMs, burst)` policy:

```ts
// Proposed API (not yet implemented)
import { getKv } from '@netscript/kv';
import { createService } from '@netscript/service';
import { createKvRateLimitStore } from '@netscript/service/rate-limit';

const kv = await getKv();
const readQuotaStore = createKvRateLimitStore(kv, {
  prefix: ['protected-reads-gcra', 'items'],
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
implements the exact same admission transition and validation rules in memory:

```ts
// Proposed API (not yet implemented)
import { createMemoryRateLimitStore } from '@netscript/service/rate-limit';

const store = createMemoryRateLimitStore({ policy: { kind: 'gcra' } });
```

With `limit: 2, windowMs: 60_000`, both `[100, 200, 300, 400]` and
`[59_850, 59_950, 60_050, 60_150]` produce `[true, true, false, false]`. A quota-exhausted denial at
`60_050` returns `retryAt: 89_850` (exact earliest representable next eligible instant: one refill
interval `windowMs / limit = 30_000` ms after the first arrival at `59_850`) and `resetAt: 119_850`
(full burst recovery). The middleware automatically emits `Retry-After: 30` (computed from
`retryAt`), rather than forcing the client to wait the full 60 seconds for the entire bucket to
refill.

### Controlling burst separately from sustained rate

When `burst` is omitted, `{ kind: 'gcra' }` defaults burst capacity to the request's `limit` so
existing `(limit, windowMs)` configurations work without an extra parameter. Callers that want
smoother spacing on expensive reads can specify an explicit `burst`:

```ts
// Proposed API (not yet implemented)
import { createKvRateLimitStore } from '@netscript/service/rate-limit';
import type { KvStore } from '@netscript/kv';

declare const kv: KvStore;

// Sustained rate: 60 reads / 60s (1/s), maximum single-timestamp burst: 5
const smoothReads = createKvRateLimitStore(kv, {
  prefix: ['protected-reads-gcra', 'search'],
  policy: { kind: 'gcra', burst: 5 },
});
```

Setting `burst: 1` enforces minimum spacing of `windowMs / limit` between accepted reads
(with static rate configured at the store/route, distinct from `#2365`'s dynamic grant-lifetime
`slow_down` interval updates).

### Direct store callers (principal-keyed protected reads)

Protected service handlers that enforce per-principal quotas after authentication call
`store.consume()` directly and read `decision.retryAt ?? decision.resetAt` for retry timing (exact
on quota exhaustion under unchanged state and bounded skew, advisory backoff on contention or
capacity saturation):

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
  const retryAt = decision.retryAt ?? decision.resetAt;
  const retryAfterSeconds = Math.max(1, Math.ceil((retryAt - now) / 1000));
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
| `packages/service/src/rate-limit/domain/rate-limit.ts` | `domain` | `RateLimitRequest` (updating `limit` and `windowMs` JSDoc for both policies), `RateLimitDecision` (adding optional `retryAt` with exact vs advisory JSDoc), `RATE_LIMIT_POLICY_KINDS`, `RateLimitPolicyKind`, `RateLimitPolicy`, input validation, fixed-window calculation, and policy validation. Imports no adapters or I/O. |
| `packages/service/src/rate-limit/domain/gcra.ts` | `domain` | Fixed retention constants (`GCRA_CLOCK_SKEW_BOUND_MS`, `MAX_GCRA_TTL_MS`), pure GCRA state representation (`StoredGcraState`), exact `BigInt` rational transition `evaluateGcra()`, upfront TTL-ceiling and safe-time/next-commit representability checks, advisory contention/capacity fallback helpers, and KV state validation. Shared verbatim by both stores. |
| `packages/service/src/rate-limit/ports/rate-limit-store.ts` | `ports` | Unchanged `RateLimitStore` interface (JSDoc updated to cover both fixed-window and rolling policies). |
| `packages/service/src/rate-limit/adapters/memory-rate-limit-store.ts` | `adapters` | `MemoryRateLimitStoreOptions.policy?`; dispatches fixed-window (default) or GCRA using `evaluateGcra()`. |
| `packages/service/src/rate-limit/adapters/kv-rate-limit-store.ts` | `adapters` | `KvRateLimitStoreOptions.policy?`; dispatches fixed-window (default, zero-margin TTL unchanged) or GCRA single-key CAS using `evaluateGcra()` and fixed retention. |
| `packages/service/src/rate-limit/middleware/options.ts` | `middleware` | Updates `ServiceRateLimitOptions.limit` and `ServiceRateLimitOptions.windowMs` JSDoc to describe both fixed-window and rolling policies accurately. |
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
 * Rolling quota sharing is scoped to a single coherent policy precondition:
 * callers sharing a store/prefix to share one quota must pass the same
 * `(limit, windowMs, burst)` tuple; differing tuples select independent
 * policy-scoped buckets.
 *
 * - `'fixed-window'`: epoch-aligned fixed windows (default).
 * - `'gcra'`: alignment-independent Generic Cell Rate Algorithm with an O(1)
 *   stored record per key and fixed skew-bounded retention; `burst`
 *   defaults to the request's `limit`.
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

export interface MemoryRateLimitStoreOptions {
  /** Maximum retained client keys, including expired keys awaiting eviction. Default 10,000. */
  readonly maxKeys?: number;
  /** Quota policy. Defaults to `{ kind: 'fixed-window' }`. */
  readonly policy?: RateLimitPolicy;
}

export interface KvRateLimitStoreOptions {
  /**
   * Dedicated namespace; separate independent limiters and policy changes with
   * prefixes that are disjoint after backend serialization.
   */
  readonly prefix: KvKey;
  /** Maximum read/CAS attempts per reservation. Default 8, maximum 32. */
  readonly maxAttempts?: number;
  /** Quota policy. Defaults to `{ kind: 'fixed-window' }`. */
  readonly policy?: RateLimitPolicy;
}
```

Note that `KvRateLimitStoreOptions` deliberately exposes **no retention option** (no
`clockSkewMarginMs` field). GCRA physical retention is derived automatically from the fixed rule in
[Fixed physical retention and clock-skew bound](#fixed-physical-retention-and-clock-skew-bound).

In `packages/service/src/rate-limit/middleware/options.ts`, `ServiceRateLimitOptions.limit` and
`ServiceRateLimitOptions.windowMs` JSDoc must be updated from fixed-window-only wording to:

- `limit`: *"Quota budget per `windowMs` (maximum accepted requests per fixed window, or sustained rate numerator `limit / windowMs` and default burst for GCRA stores)."*
- `windowMs`: *"Quota window duration in milliseconds (epoch-aligned for fixed-window stores, or rate denominator `limit / windowMs` for GCRA stores)."*

Every new or updated symbol must carry explicit TypeScript annotations compatible with
`isolatedDeclarations`, zero `any` casts, and complete JSDoc with compiling `@example` fences per
[`docs/architecture/doctrine/02-public-surface.md`](../docs/architecture/doctrine/02-public-surface.md).

#### Policy, TTL-ceiling, and safe-time overflow validation

Fixed internal GCRA retention constants (shared by both stores for validation parity):

- `GCRA_CLOCK_SKEW_BOUND_MS = 5_000` (5 seconds fixed clock-skew/transit retention margin added to
  every GCRA KV write).
- `MAX_GCRA_TTL_MS = 31_536_000_000` (365 days = `365 * 24 * 60 * 60 * 1_000` ms normative upper
  bound on GCRA KV `expireIn`).

Validation rules:

1. **At store construction**:
   - `policy === undefined` normalizes to `{ kind: 'fixed-window' }`.
   - Any non-object `policy` or `policy.kind` outside `RATE_LIMIT_POLICY_KINDS` throws `TypeError`.
   - For `{ kind: 'gcra', burst }`, if `burst !== undefined`, `burst` must be a positive safe integer
     (`Number.isSafeInteger(burst) && burst >= 1`), else throws `RangeError`.
2. **At `consume(request)` (shared upfront checks before state access)**:
   - Existing `limit`, `windowMs`, `now`, and `signal` checks apply identically across policies:
     `limit` and `windowMs` must be positive safe integers; `now` must be a non-negative safe
     integer; `request.signal?.throwIfAborted()` runs before state access and between KV attempts.
   - For `{ kind: 'fixed-window' }`: existing `rateLimitWindow()` validation and zero-margin TTL
     (`expireIn = resetAt - request.now`) remain 100% unchanged.
   - For `{ kind: 'gcra' }`, evaluated in arbitrary-precision `BigInt` (`L = BigInt(limit)`,
     `W = BigInt(windowMs)`, `B = BigInt(policy.burst ?? limit)`, `N = BigInt(now) * L`,
     `MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER)`):
     - **Upfront TTL-ceiling check (aligned with Deno KV adapter limits)**: Compute the worst-case
       GCRA KV retention `maxTtlMs = ceilDiv(B * W, L) + BigInt(GCRA_CLOCK_SKEW_BOUND_MS)`. If
       `maxTtlMs > BigInt(MAX_GCRA_TTL_MS)`, throw
       `RangeError('rateLimit retention exceeds maximum supported TTL')` **before any state lookup
       or KV I/O** (enforced identically in `MemoryRateLimitStore` and `KvRateLimitStore` so memory
       and KV accept the exact same rolling configurations). Because every admitted GCRA write
       satisfies `1 <= resetAt - request.now <= ceilDiv(B * W, L)`, every KV write has
       `5_001 <= expireIn <= MAX_GCRA_TTL_MS`, which is unconditionally accepted by `DenoKvAdapter`
       ([`packages/kv/adapters/deno-kv.adapter.ts:216`](../packages/kv/adapters/deno-kv.adapter.ts#L216),
       where Deno KV rejects `expireIn` exceeding `chrono::DateTime<Utc>::MAX_DATETIME - Utc::now()`,
       measured at `8_208_471_366_461_230` ms on Deno `2.9.7`), `RedisKvAdapter`
       ([`packages/kv/adapters/redis.adapter.ts:425`](../packages/kv/adapters/redis.adapter.ts#L425),
       which requires truthy `expireIn >= 1`), and `MemoryKvAdapter`
       ([`packages/kv/adapters/memory.adapter.ts:513`](../packages/kv/adapters/memory.adapter.ts#L513),
       where `Date.now() + MAX_GCRA_TTL_MS << Number.MAX_SAFE_INTEGER`). **No accepted rolling
       configuration can ever produce a TTL rejected by `DenoKvAdapter`, `RedisKvAdapter`, or
       `MemoryKvAdapter`.**
     - **Upfront safe-time check**: If `ceilDiv(N + W, L) > MAX_SAFE` (meaning even one emission
       interval from `request.now` cannot produce a safe `resetAt` or `retryAt`), throw
       `RangeError('rateLimit window exceeds safe time')`.
3. **Exact `retryAt` representability at the safe-time overflow edge**:
   - Inside `evaluateGcra()`, admission versus quota-exhaustion denial is decided in `BigInt`:
     - On an **admission** (`newTat - N <= B * W`): check `ceilDiv(newTat, L) <= MAX_SAFE`; if it
       overflows, throw `RangeError('rateLimit window exceeds safe time')` before mutating state or
       calling `kv.atomic()`.
     - On a **quota-exhaustion denial** (`newTat - N > B * W`):
       1. `retryAtBig = ceilDiv(tat - (B - 1n) * W, L)` is the exact earliest integer epoch
          millisecond at which the quota becomes eligible — **never earlier and never rounded down**.
       2. Check whether a subsequent reservation at `retryAtBig` can actually **commit cleanly**
          within safe integer time: let `retryN = retryAtBig * L` and
          `retryBase = tat > retryN ? tat : retryN`. Because `max(tat, t * L) + W` is monotonically
          non-decreasing in `t`, if `ceilDiv(retryBase + W, L) > MAX_SAFE`, **no representable
          safe-integer commit instant exists at `retryAtBig` or any later timestamp**. In that case,
          `consume()` MUST reject explicitly with `RangeError('rateLimit window exceeds safe time')`
          (performing zero state mutation and zero KV writes) rather than advertising an
          uncommittable or earlier `retryAt`.
       3. When `ceilDiv(retryBase + W, L) <= MAX_SAFE`, combined with the upfront
          `maxTtlMs <= MAX_GCRA_TTL_MS` check, retrying at `Number(retryAtBig)` under unchanged
          state, coherent policy, and retained KV state is guaranteed to **admit and commit cleanly**
          without throwing `RangeError` or a KV TTL `TypeError`.
     - Concrete overflow edge trace (`M = Number.MAX_SAFE_INTEGER`, `limit = windowMs = burst = 2`):
       - Starting at `now = M - 2`: Req 1 admits (`resetAt = M - 1`), Req 2 admits (`resetAt = M`),
         and Req 3 **throws `RangeError('rateLimit window exceeds safe time')`** because retrying at
         `M - 1` would require committing `tat = M + 1 > M` (no representable commit instant exists).
       - Starting at `now = M - 3`: Req 1 admits (`resetAt = M - 2`), Req 2 admits
         (`resetAt = M - 1`), Req 3 denies cleanly (`{ allowed: false, resetAt: M - 1, retryAt: M - 2 }`),
         **Req 4 at the advertised `retryAt = M - 2` admits cleanly** (`{ allowed: true, resetAt: M }`,
         KV `expireIn = 5_002`), and Req 5 at `M - 2` **throws `RangeError`**.
   - On a **memory `maxKeys` saturation fallback**: check
     `BigInt(request.now) + ceilDiv(B * W, L) <= MAX_SAFE` before returning fallback `resetAt`,
     throwing `RangeError('rateLimit window exceeds safe time')` if it overflows.

### Compatible decision semantics (`resetAt` and `retryAt` / `Retry-After`)

In fixed-window quotas, full quota reset and next eligible instant coincide at `W_end`. Under GCRA
with `burst > 1`, they diverge on quota exhaustion. Furthermore, conservative denials caused by KV
CAS exhaustion or memory `maxKeys` saturation do **not** observe an authoritative future eligibility
instant — CAS exhaustion holds only a stale read under concurrent writes, and memory saturation
depends on when *other* keys expire and get reclaimed by the bounded 32-entry rotating scan.

Therefore, `RateLimitDecision` explicitly separates **exact timestamps** (quota exhaustion under
unchanged stored state, single coherent policy, and retained KV state) from **advisory fallback
timestamps** (contention and capacity denials):

| Outcome | Timing class | Fixed-window (default) | GCRA (`policy: { kind: 'gcra', burst? }`) |
| --- | --- | --- | --- |
| `allowed: true` | Exact (under single policy & retention) | `{ allowed: true, resetAt: W_end }` (`retryAt` omitted) | `{ allowed: true, resetAt: Number(ceilDiv(newTat, L)) }` (`retryAt` omitted) |
| `allowed: false` — quota exhausted (representable next commit) | **Exact** (under unchanged state, single policy, retained record) | `{ allowed: false, resetAt: W_end }` (`retryAt` omitted) | `{ allowed: false, resetAt: Number(ceilDiv(tat, L)), retryAt: Number(ceilDiv(tat - (B - 1n) * W, L)) }` |
| `allowed: false` — KV CAS `maxAttempts` exhausted | **Advisory fallback** (stale observation under write contention; not an eligibility guarantee) | `{ allowed: false, resetAt: W_end }` (`retryAt` omitted) | `{ allowed: false, resetAt: Math.max(lastObservedResetAt, retryAt), retryAt: Number(BigInt(now) + ceilDiv(W, L)) }` |
| `allowed: false` — memory `maxKeys` full on new key | **Advisory fallback** (depends on other keys' expiry and rotating eviction; not an eligibility guarantee) | `{ allowed: false, resetAt: W_end }` (`retryAt` omitted) | `{ allowed: false, resetAt: Number(BigInt(now) + ceilDiv(B * W, L)), retryAt: Number(BigInt(now) + ceilDiv(W, L)) }` |

**Explicit definition of `lastObservedResetAt` (KV CAS exhaustion):** On the final CAS read attempt
(`attempt === maxAttempts`), `lastObservedResetAt` is derived strictly from the **persisted** record
read from KV — **never** from the tentative uncommitted post-write `newTat`:

- If the final read observes an **absent** (`entry === null`, per the `KvStore.get` contract) or
  **logically idle** (`storedTat <= request.now * L`) KV entry:
  `lastObservedResetAt = Number(BigInt(request.now) + ceilDiv(W, L))` (which equals `retryAt`, so
  `Math.max(lastObservedResetAt, retryAt) === retryAt`).
- If the final read observes a **persisted live** record (`entry !== null` with valid
  `StoredGcraState` and `storedTat > request.now * L`):
  `lastObservedResetAt = Number(ceilDiv(storedTat, L))` (i.e. `stored.tatMs + (stored.tatRem > 0 ? 1 : 0)`).
- **Adapter distinction for a persisted `null` value**: Under `KvStore.get`, an absent key returns
  `entry === null`. When another writer corrupts a key by persisting a literal `null` value,
  `MemoryKvAdapter` returns a non-null entry (`{ value: null, versionstamp }`), which fails
  `StoredGcraState` validation and throws `TypeError`, whereas `DenoKvAdapter`
  ([`packages/kv/adapters/deno-kv.adapter.ts:84–96`](../packages/kv/adapters/deno-kv.adapter.ts#L84-L96))
  maps a `null` value to `null` (indistinguishable from absence at read time), causing
  `KvRateLimitStore` to submit an absent-versionstamp CAS (`versionstamp: null`) that Deno KV
  rejects (`{ ok: false }`) and therefore resolves via conservative CAS contention fallback after
  `maxAttempts` rather than `TypeError`. Non-null malformed values throw `TypeError` across all
  adapters.

Concrete CAS exhaustion illustration (`limit: 3, windowMs: 60_000, burst: 3, now: 100`, where
`ceilDiv(W, L) = 20_000`):

- If the final read sees an absent/idle KV entry and CAS fails on all `maxAttempts`:
  `retryAt = 20_100`, `lastObservedResetAt = 20_100`, returning
  `{ allowed: false, retryAt: 20_100, resetAt: 20_100 }`.
- If two prior admissions at `now = 100` persisted `tatMs = 40_100, tatRem = 0`, the third request
  at `now = 100` is locally eligible (tentative post-write reset `60_100`), attempts CAS, and fails
  on all `maxAttempts`: `retryAt = 20_100`, `lastObservedResetAt = 40_100` (the stale persisted
  reset, strictly distinct from the uncommitted tentative `60_100`), returning
  `{ allowed: false, retryAt: 20_100, resetAt: 40_100 }`.

Concrete memory saturation illustration: with `MemoryRateLimitStore({ maxKeys: 1, policy: { kind: 'gcra' } })`,
if key `"a"` occupies the single slot until `resetAt = 60_000`, a new key `"b"` arriving at `now = 1`
with `limit = 2, windowMs = 60_000` receives the advisory fallback
`{ allowed: false, retryAt: 30_001, resetAt: 60_001 }`. Because capacity remains occupied by `"a"`
until `60_000`, retrying `"b"` at `30_001` is still denied until `"a"` expires and is reclaimed.
`retryAt` in this branch is strictly an advisory backoff hint for `Retry-After`, not an admission
promise.

#### Normative decision invariants

Across all policies and all outcomes (except thrown validation, safe-time/TTL `RangeError`, abort,
corrupt-state `TypeError`, or I/O errors):

1. When `allowed === true`: `resetAt > request.now` and `retryAt === undefined`.
2. When `allowed === false`: `request.now < (retryAt ?? resetAt) <= resetAt`, and both values are
   safe integers.
3. Exact committable eligibility (`retryAt - 1` denies and `retryAt` admits and commits cleanly
   without `RangeError` or KV TTL `TypeError`) is guaranteed **only** for GCRA quota-exhaustion
   denials under unchanged stored state, a single coherent `(limit, windowMs, burst)` policy, and
   physical KV retention within the documented `GCRA_CLOCK_SKEW_BOUND_MS = 5_000` ms bound.
   Contention (`maxAttempts`) and capacity (`maxKeys`) denials return the specified advisory
   fallback timestamps instead.
4. Under fixed-window: decisions keep the exact two-property shape `{ allowed, resetAt }`, so
   `decision.retryAt ?? decision.resetAt === decision.resetAt`.
5. Middleware `Retry-After` computation in
   `packages/service/src/rate-limit/middleware/rate-limit-middleware.ts`:

```ts
// Proposed middleware change (not yet implemented)
if (!decision.allowed) {
  const retryAt = decision.retryAt ?? decision.resetAt;
  context.header(
    'Retry-After',
    String(Math.max(1, Math.ceil((retryAt - now()) / 1000))),
  );
  return context.json({ error: 'RATE_LIMITED' }, 429);
}
```

Callers that only inspect `decision.resetAt` remain conservative (`resetAt >= retryAt`), and custom
`RateLimitStore` implementations that omit `retryAt` continue to work unchanged.

### Recommended rolling algorithm: exact rational GCRA

#### State representation (O(1) four-field stored record per key)

Each active key stores one fixed four-field record representing its Theoretical Arrival Time (TAT) —
the exact instant when the leaky bucket becomes empty (full burst capacity restored) — as a rational
number `tatMs + tatRem / request.limit` in epoch milliseconds:

```ts
/** Internal persisted state for one GCRA key (O(1) record, JSON- and V8-clone-safe). */
interface StoredGcraState {
  readonly v: 1;
  readonly p: 'gcra';
  /** Whole epoch milliseconds of the Theoretical Arrival Time. */
  readonly tatMs: number;
  /** Rational remainder numerator in [0, request.limit - 1]; must be 0 when tatMs === Number.MAX_SAFE_INTEGER. */
  readonly tatRem: number;
}
```

Why `{ v, p, tatMs, tatRem }` instead of floating-point milliseconds or `BigInt` persistence:

- **Zero floating-point drift**: Non-divisible ratios like `windowMs = 1_000, limit = 3`
  (`333.333... ms`) stay exact across arbitrary sequences with no accumulated rounding error.
- **Zero `BigInt` serialization overhead**: Plain safe integers serialize directly in both Deno KV
  structured clone and `RedisKvAdapter`'s plain-JSON fast path (`packages/kv/adapters/redis/codec.ts`,
  lines 58–60), bypassing the `bigints` metadata envelope.
- **Exact policy-scoped bucket keys**: Because each bucket key encodes
  `(request.windowMs, request.limit, effectiveBurst)`, every persisted `StoredGcraState` under a
  key uses the same denominator `request.limit`; no stored `den` or rescaling is needed.
- **O(1) stored record size**: The stored quota record always contains exactly four bounded fields
  independent of `limit` and `windowMs` (measured with `encodeStoredValue` in
  `packages/kv/adapters/redis/codec.ts` at `90` bytes for small timestamps with a 20-character
  versionstamp / `96` bytes with a 26-character versionstamp, up to `117` / `123` bytes with
  `MAX_SAFE_INTEGER - 1` fields — always O(1) in `limit` and orders of magnitude below Deno KV's
  64 KiB value limit). Note that O(1) applies to the **stored quota record** and the **standalone
  `MemoryRateLimitStore`**; backing KV adapters maintain their own internal structures (for example,
  `MemoryKvAdapter` pushes one `expirationHeap` entry per expiring write and purges stale entries
  during its 1-second sweep per `packages/kv/adapters/memory.adapter.ts:519–522, 586–601`).

#### Pure transition function (exact `BigInt` arithmetic)

Let `L = BigInt(request.limit)`, `W = BigInt(request.windowMs)`,
`B = BigInt(policy.burst ?? request.limit)`, `N = BigInt(request.now) * L`,
`MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER)`, `GCRA_CLOCK_SKEW_BOUND_MS = 5_000`,
`MAX_GCRA_TTL_MS = 31_536_000_000`, and `ceilDiv(a, b) = (a + b - 1n) / b` for positive `a, b`.

In scaled units (where `1 ms = L` units), the emission interval `W / L` ms is exactly `W` units,
the delay variation tolerance `(B - 1) * (W / L)` ms is `(B - 1) * W` units, and the full burst
budget `B * (W / L)` ms is `B * W` units:

1. **Upfront bounds checks (before state access)**:
   - TTL ceiling: if `ceilDiv(B * W, L) + BigInt(GCRA_CLOCK_SKEW_BOUND_MS) > BigInt(MAX_GCRA_TTL_MS)`,
     throw `RangeError('rateLimit retention exceeds maximum supported TTL')`.
   - Safe time: if `ceilDiv(N + W, L) > MAX_SAFE`, throw
     `RangeError('rateLimit window exceeds safe time')`.
2. **Resolve current `tat` and `lastObservedResetAt`**:
   - Default `lastObservedResetAt = Number(BigInt(request.now) + ceilDiv(W, L))`.
   - If the KV lookup returns `entry === null` (or the key is absent in `MemoryRateLimitStore`):
     `tat = N`. (Note: on `DenoKvAdapter`, a corrupted key storing literal `null` is mapped to
     `entry === null` at `packages/kv/adapters/deno-kv.adapter.ts:84–96`, so it enters the
     absent-versionstamp CAS branch and rejects via CAS contention fallback rather than throwing
     `TypeError`.)
   - Else validate `entry.value` (`stored`): non-null object with `v === 1`, `p === 'gcra'`, safe
     integers `tatMs >= 0`, `0 <= tatRem < request.limit`, and
     `(tatMs < Number.MAX_SAFE_INTEGER || tatRem === 0)`; throw
     `TypeError('Invalid rate-limit state in KV')` on failure (including `entry.value === null` on
     adapters such as `MemoryKvAdapter` that expose a persisted `null` entry).
   - Compute `storedTat = BigInt(stored.tatMs) * L + BigInt(stored.tatRem)`.
   - If `storedTat > N`: set `tat = storedTat` and `lastObservedResetAt = Number(ceilDiv(storedTat, L))`;
     else set `tat = N` (key is logically idle / fully recovered, keeping `lastObservedResetAt = Number(BigInt(request.now) + ceilDiv(W, L))`).
3. **Evaluate admission vs denial in `BigInt`**:
   - `newTat = tat + W`.
   - **Quota-exhaustion denial** when `newTat - N > B * W`:
     - Denial guarantees `tat > N` and `allowAtScaled = tat - (B - 1n) * W >= N + 1n`.
     - `resetAtBig = ceilDiv(tat, L)` (guaranteed `<= MAX_SAFE` by state validation).
     - `retryAtBig = ceilDiv(allowAtScaled, L)` (strictly `> BigInt(request.now)` and `<= resetAtBig`,
       exact ceiling, never rounded down).
     - **Next-commit representability check**: let `retryN = retryAtBig * L` and
       `retryBase = tat > retryN ? tat : retryN`. If `ceilDiv(retryBase + W, L) > MAX_SAFE`, throw
       `RangeError('rateLimit window exceeds safe time')` (no representable safe-integer commit
       instant exists; zero state mutation and zero KV write).
     - Otherwise return `{ allowed: false, resetAt: Number(resetAtBig), retryAt: Number(retryAtBig) }`
       with **no state mutation and no KV write**.
   - **Admission** when `newTat - N <= B * W`:
     - `resetAtBig = ceilDiv(newTat, L)`. If `resetAtBig > MAX_SAFE`, throw
       `RangeError('rateLimit window exceeds safe time')` before mutating state or writing KV.
     - `resetAt = Number(resetAtBig)` (mathematically guaranteed `1 <= resetAt - request.now <= ceilDiv(B * W, L)`).
     - `nextState = { v: 1, p: 'gcra', tatMs: Number(newTat / L), tatRem: Number(newTat % L) }`.
     - In `KvRateLimitStore`, compute fixed retention
       `expireIn = (resetAt - request.now) + GCRA_CLOCK_SKEW_BOUND_MS` (mathematically guaranteed
       `5_001 <= expireIn <= MAX_GCRA_TTL_MS` from the upfront TTL-ceiling check).
     - Return `{ allowed: true, resetAt }` and persist `nextState`.

#### Exact millisecond eligibility property (quota denial)

When GCRA returns a quota-exhaustion denial `{ allowed: false, resetAt, retryAt }`, assuming
unchanged stored state, a single coherent `(limit, windowMs, burst)` policy, and physical KV
retention within `GCRA_CLOCK_SKEW_BOUND_MS`:

- At `now' = retryAt - 1`, `N' = BigInt(retryAt - 1) * L < allowAtScaled`, so `tat + W - N' > B * W`
  and a retry is still **denied**.
- At `now' = retryAt`, `N' = BigInt(retryAt) * L >= allowAtScaled`, so `max(tat, N') + W - N' <= B * W`,
  `ceilDiv(max(tat, N') + W, L) <= MAX_SAFE` (verified before returning `retryAt`), and
  `5_001 <= expireIn <= MAX_GCRA_TTL_MS` (verified upfront), so a retry **admits and commits
  cleanly** without throwing `RangeError` or a KV TTL `TypeError`.

#### Admission envelope (caller-timestamp space and real-elapsed-time bound)

GCRA is a **leaky-bucket / token-bucket rolling rate limiter**, not a strict sliding-window count.
Under a single coherent `(limit, windowMs, burst)` policy and physical retention within the
documented skew bound:

- **Shift-invariant in caller timestamps (`request.now`) within safe-time representability**:
  Shifting every caller arrival timestamp by any constant `c` that preserves safe-integer
  representability of all inputs, outputs (`resetAt`/`retryAt`), and next-commit instants produces
  identical `allowed` results and shifts `resetAt`/`retryAt` by exactly `c`. (Shifts that cross the
  safe-time representability boundary are explicitly excluded: for example, shifting the
  `now = M - 3` overflow witness by `+1` ms to `M - 2` turns its third request from a quota denial
  into `RangeError` because no representable next commit exists.) Both issue #2653 alignment
  sequences (`[100, 200, 300, 400]` and `[59_850, 59_950, 60_050, 60_150]` at
  `limit: 2, windowMs: 60_000`) return `[true, true, false, false]`.
- **Single-timestamp burst bound (`Δt = 0` in caller timestamps)**: At most `burst` (default
  `limit`) requests are ever admitted at any single caller timestamp `now`, regardless of clock
  alignment. Epoch-boundary doubling (`2 * limit` across a minute boundary) is eliminated.
- **Short-interval and sustained rate envelope (`Δt >= 0` in caller timestamps)**: Over any closed
  caller-timestamp interval `[t, t + Δt]` of length `Δt` ms, at most
  `burst + floor(Δt * limit / windowMs)` requests are admitted. Whenever `Δt < windowMs / limit`
  (i.e., `floor(Δt * limit / windowMs) === 0`), this equals `burst`. When `windowMs < limit`
  (sub-millisecond refill, e.g., `limit: 1_000, windowMs: 100, burst: 2`), distinct integer
  timestamps even 1 ms apart admit up to `burst + floor(Δt * limit / windowMs)` (for example, 2 at
  `t = 0` and 2 at `t = 1`, totaling 4 across 1 ms, within the closed-interval bound `2 + 10 = 12`).
- **Real-elapsed-time guarantee under bounded replica clock error (`±ε`)**: Because `evaluateGcra()`
  operates on caller-supplied `request.now`, if every replica's clock stays within `±ε` of true
  time (maximum pairwise offset `<= 2ε`, with clock skew plus transit/drift `< 5_000` ms so
  physical retention holds), requests arriving during real elapsed time `[t_real, t_real + Δt_real]`
  span caller timestamps of width at most `Δt_real + 2ε`, so at most
  `burst + floor((Δt_real + 2ε) * limit / windowMs)` requests are admitted over real elapsed time
  `Δt_real`.
- **Single-window difference vs strict sliding log (`limit + burst - 1` upper bound)**: Over any
  half-open rolling interval `[t, t + windowMs)` in caller timestamps, `limit + burst - 1`
  (`2 * limit - 1` at default `burst = limit`) is an **upper bound** (not always attained for small
  integer windows: for example, at `windowMs = 1, limit = burst = 3`, the half-open interval
  `[t, t + 1)` contains only a single integer millisecond timestamp `t` and admits at most `3`
  requests, not `5`). When `windowMs >= limit`, starting from idle with `burst = limit`, a caller
  can reach `limit` requests at `t` plus `limit - 1` paced requests spaced by `windowMs / limit`
  inside `[t, t + windowMs)` (e.g., `[59_850, 59_950, 89_850]` admits 3 requests for
  `limit: 2, windowMs: 60_000`). Unlike fixed windows or weighted two-window counters, those extra
  requests are paced at `limit / windowMs` rather than arriving in a second boundary burst. See
  [Rationale and alternatives](#rationale-and-alternatives) and
  [Unresolved questions](#unresolved-questions).

#### Single coherent policy precondition and policy cutover

- **Single coherent policy (caller precondition)**: Sharing a rolling quota across callers sharing
  a store instance or KV prefix requires those callers to supply the same
  `(limit, windowMs, burst)` tuple. This is a **caller precondition**, not a runtime rejection of
  differing tuples: because `(request.windowMs, request.limit, effectiveBurst)` is part of the
  bucket key, requests with differing tuples select **independent** buckets rather than throwing or
  sharing debt. Mixed-policy rollout against a shared quota state is out of scope for this design
  and deferred to [Future work](#future-work).
- **Policy-scoped bucket keys**: Both stores encode `(request.windowMs, request.limit, effectiveBurst)`
  in the bucket key (`JSON.stringify([request.key, request.windowMs, request.limit, effectiveBurst])`
  in memory; `[...prefix, 'v1', 'gcra', request.key, request.windowMs, request.limit, effectiveBurst]`
  in KV), guaranteeing stored `tatRem` always matches `request.limit` without a stored `den` field.
- **Policy cutover and prefix isolation semantics**: Operators migrating from fixed-window to GCRA
  or changing `(limit, windowMs, burst)` deploy with a **new KV `prefix` that is disjoint after
  backend serialization** (essential on `RedisKvAdapter`, where `keyToRedisKey` joins unescaped `:`
  segments). **Prefix isolation creates independent buckets**: during a rolling deployment while
  old and new replicas coexist, each policy's admission envelope applies strictly **per namespace**
  (and combined traffic across the two independent namespaces is bounded by the sum of both
  namespaces' envelopes until the old replicas drain).

### Storage bounds and memory eviction (`MemoryRateLimitStore`)

- Each key in `Map<string, MemoryGcraEntry>` stores `{ tatMs, tatRem, resetAt }` (three safe
  numbers — **O(1) per key** and **O(`maxKeys`) total** in the standalone memory store, comparable
  to fixed-window's `{ count, resetAt }`).
- Map key is `JSON.stringify([request.key, request.windowMs, request.limit, effectiveBurst])`.
- **Skew-bounded rotating eviction for GCRA** (matching KV's fixed `GCRA_CLOCK_SKEW_BOUND_MS = 5_000`
  ms retention horizon):
  - Fixed-window entries keep the exact existing eviction test (`counter.resetAt <= request.now`,
    `memory-rate-limit-store.ts:44–51`).
  - GCRA entries are evicted during the 32-entry rotating scan **only** when
    `BigInt(entry.resetAt) + BigInt(GCRA_CLOCK_SKEW_BOUND_MS) <= BigInt(request.now)`.
  - Why not `entry.resetAt <= request.now`? With `L = B = 1, W = 1_000`, admitting key `"a"` at
    `now = 100` (`resetAt = 1_100`), then consuming key `"b"` at `now = 1_100`, then consuming key
    `"a"` at `now = 1_099` (a 1 ms backward clock step) would let `"b"`'s scan delete `"a"` and
    over-admit `"a"` within 999 caller ms, breaking parity with KV (which retains `"a"` until
    `+5_000` ms and denies at `1_099` with `retryAt = 1_100`). Keeping GCRA memory entries until
    `entry.resetAt + 5_000 <= request.now` preserves live debt across cross-key backward clock steps
    strictly smaller than `5_000` ms while remaining logically idle as soon as `request.now >= entry.resetAt`
    (`tat <= request.now * L`).
- Live or skew-retained entries (`BigInt(entry.resetAt) + 5_000n > BigInt(request.now)`) are never
  evicted to admit new keys.
- When a new key arrives and `entries.size >= maxKeys`, the store rejects conservatively without
  mutating the map and returns the **advisory fallback**
  `{ allowed: false, resetAt: Number(BigInt(now) + ceilDiv(B * W, L)), retryAt: Number(BigInt(now) + ceilDiv(W, L)) }`
  (overflow-checked against `Number.MAX_SAFE_INTEGER`).
- Zero timers and zero shutdown lifecycle required.

### Shared KV key layout, atomicity, and contention (`KvRateLimitStore`)

- **Key tuple and serialization-disjoint prefixes**:
  - GCRA key tuple:
    `[...prefix, 'v1', 'gcra', request.key, request.windowMs, request.limit, effectiveBurst]`.
  - Fixed-window key tuple remains unchanged: `[...prefix, request.key, request.windowMs, resetAt]`.
  - On `DenoKvAdapter` and `MemoryKvAdapter`, typed tuple segments separate key arities.
  - **On `RedisKvAdapter`, tuple arity alone cannot isolate keys** because `keyToRedisKey`
    concatenates every `KvKey` part with unescaped `:` (`packages/kv/adapters/redis/serialization.ts:37–46`;
    also noted in `packages/kv/README.md:109–113`). Independent limiters, fixed-window vs GCRA
    migrations, and policy cutovers MUST therefore use **prefixes that are disjoint after
    serialization** (for example, distinct leading segments `['reads-fixed']` vs `['reads-gcra-v1']`
    where neither serialized prefix is a prefix of the other).
- **Atomic primitives and fixed TTL retention**:
  - Uses only `kv.get(key)` and single-key
    `kv.atomic([{ key, versionstamp: entry?.versionstamp ?? null }], [{ type: 'set', key, value: nextState, expireIn }])`.
  - Zero `kv.list()` scans; zero `getMany()` multi-key reads; zero multi-key transactions.
  - Under `{ kind: 'gcra' }`, every admitted write uses fixed retention
    `expireIn = (resetAt - request.now) + GCRA_CLOCK_SKEW_BOUND_MS` (`GCRA_CLOCK_SKEW_BOUND_MS = 5_000` ms).
    Because `1 <= resetAt - request.now <= ceilDiv(B * W, L)` and upfront validation enforces
    `ceilDiv(B * W, L) + 5_000 <= MAX_GCRA_TTL_MS` (`31_536_000_000` ms), `expireIn` is always in
    `[5_001, 31_536_000_000]` — avoiding the falsy `expireIn: 0` permanent-key trap in
    `RedisKvAdapter` (`packages/kv/adapters/redis.adapter.ts:425`) and `MemoryKvAdapter`
    (`packages/kv/adapters/memory.adapter.ts:513`) AND staying strictly below `DenoKvAdapter`'s
    maximum TTL ceiling (`packages/kv/adapters/deno-kv.adapter.ts:216`).
  - Under `{ kind: 'fixed-window' }` (default), writes preserve exact unchanged zero-margin
    `expireIn = resetAt - request.now` (`packages/service/src/rate-limit/adapters/kv-rate-limit-store.ts:53`).
  - Denied requests return immediately after `kv.get()` without calling `kv.atomic()`, so rejected
    traffic performs zero KV writes and never extends TTL.
- **Confirmed-write precondition (Redis dependency [#2648](https://github.com/rickylabs/netscript/issues/2648))**:
  - `KvRateLimitStore`'s guarantee that it never admits a request without a committed reservation
    holds **conditionally on the `KvStore.atomic()` adapter confirming every queued mutation
    outcome**:
    - `DenoKvAdapter`: native optimistic concurrency check on the single key; confirmed on `main`.
    - `MemoryKvAdapter`: synchronous single-turn check and write; confirmed on `main` (note: pushes
      an `expirationHeap` entry per expiring write, cleared on its 1-second sweep).
    - `RedisKvAdapter`: in-process calls serialize on `atomicTail`; across processes/clients,
      `tryCommit()` runs `WATCH` → `MGET` → versionstamp check → `MULTI` → `PSETEX` → `EXEC`
      (retrying null `EXEC` up to `REDIS_ATOMIC_MAX_ATTEMPTS = 5`, returning `{ ok: false }`
      immediately on versionstamp mismatch). However, on `main` (`87965d80`),
      `packages/kv/adapters/redis.adapter.ts:352–361` checks only `(await multi.exec()) === null`
      and reports `{ ok: true }` even when a queued command inside `EXEC` returned a command error.
      **Landing [#2648](https://github.com/rickylabs/netscript/issues/2648) (validating every `EXEC`
      command receipt and throwing on command errors or malformed replies without retrying as
      contention) is a hard prerequisite** before certifying `RedisKvAdapter` for shared rolling
      quotas.
- **Contention and retry behavior**:
  - Retries failed CAS commits (`result.ok === false`) up to `maxAttempts` (default `8`, allowed
    `1..32`), checking `request.signal?.throwIfAborted()` before each `get()` and before each
    `atomic()`.
  - If all `maxAttempts` fail due to CAS conflict, `KvRateLimitStore` rejects conservatively and
    returns the **advisory fallback**
    `{ allowed: false, resetAt: Math.max(lastObservedResetAt, retryAt), retryAt: Number(BigInt(request.now) + ceilDiv(W, L)) }`,
    where `lastObservedResetAt` is computed from the final read attempt's **persisted** state
    (`retryAt` if absent/logically idle; stale stored `Number(ceilDiv(storedTat, L))` if live, never
    the tentative post-write `newTat`). It never admits a request without a confirmed atomic commit.
  - Storage I/O errors, unconfirmed-commit errors (`#2648`), and corrupt non-null stored values
    (`TypeError`) propagate to the caller/error handler and never fail open. For a corrupted key
    storing literal `null`, `MemoryKvAdapter` exposes `{ value: null, versionstamp }` and throws
    `TypeError`, whereas `DenoKvAdapter` (`packages/kv/adapters/deno-kv.adapter.ts:84–96`) maps the
    read to `entry === null`, causing absent-versionstamp CAS rejection and conservative contention
    fallback after `maxAttempts` (never failing open).
- **Cardinality note**: As with fixed-window KV counters, TTL bounds each key's lifetime rather
  than total live key count across distinct keys; backend capacity controls and bounded/canonical
  keys remain the operator's responsibility.

### Memory and KV parity

Because both `createMemoryRateLimitStore` and `createKvRateLimitStore` invoke the exact same pure
domain function `evaluateGcra()` (including upfront `MAX_GCRA_TTL_MS` validation and exact `BigInt`
rational math), parity and shared concurrency guarantees hold under three explicit preconditions:

1. **Single coherent policy**: all callers sharing a store/prefix use identical
   `(limit, windowMs, burst)`.
2. **Confirmed atomic writes**: `KvStore.atomic()` returns `{ ok: true }` only when the write
   actually committed without command error (holds on `main` for `MemoryKvAdapter` and
   `DenoKvAdapter`; requires [#2648](https://github.com/rickylabs/netscript/issues/2648) for
   `RedisKvAdapter`).
3. **Bounded clock/transit gap**: the gap between backend elapsed time and reader caller-clock
   progress remains strictly below `GCRA_CLOCK_SKEW_BOUND_MS` (`5_000` ms) — see
   [Fixed physical retention and clock-skew bound](#fixed-physical-retention-and-clock-skew-bound).

Under those preconditions:

- Sequential or deterministic-clock workloads without capacity saturation or CAS exhaustion produce
  identical `{ allowed, resetAt, retryAt? }` values (and identical `RangeError` rejections) across
  `MemoryRateLimitStore`, `KvRateLimitStore(MemoryKvAdapter)`, `KvRateLimitStore(DenoKvAdapter)`,
  and (post-`#2648`) `KvRateLimitStore(RedisKvAdapter)`.
- Concurrent shared-KV reservations at the same timestamp `now` against a shared key admit at most
  `burst` requests (with conservative advisory rejection if `maxAttempts` exhausts under extreme
  contention).

### Fixed physical retention and clock-skew bound

1. **Epoch-millisecond clock**: `RateLimitRequest.now` remains wall-clock epoch milliseconds (from
   `options.now ?? Date.now`), required because distributed replicas sharing KV do not share a
   monotonic `performance.now()` epoch and callers expect epoch-ms `resetAt`/`retryAt`.
2. **Why retention must include a clock-skew bound independent of emission interval**:
   - Logical expiry compares `tat <= request.now * L` against the caller's `request.now`.
   - Physical KV expiry deletes the key after `ttlAnchor + expireIn` against the KV backend's clock,
     where `ttlAnchor` is the backend/adapter timestamp at which the expiration deadline is anchored
     when submitting the atomic write (for example, Deno KV computes `Utc::now() + expireIn` before
     submitting the atomic mutation in Deno 2.9.7 `ext/kv/lib.rs:840–877`, and Deno KV's expiration
     contract permits later physical deletion after that deadline — which is safe because logical
     idle checks treat retained expired keys as idle).
   - Without a skew margin added above `resetAt - writerNow`, **any** policy — regardless of how
     large its emission interval `windowMs / limit` is — can lose live quota early under a 1 ms
     lagging peer:
     - *Short-TAT case*: With `limit = windowMs = 60_000, burst = 1` admitted at `writerNow = 100`
       (`resetAt = 101`, base TTL `1` ms), a zero-margin key expires after 1 ms of backend time, so
       a 1 ms-lagging peer still reporting `readerNow = 100` reads `null` and admits a second
       request at `now = 100`.
     - *Full-second-window case*: With `limit = burst = 1, windowMs = 1_000` admitted at
       `writerNow = 100` (`resetAt = 1_100`, base TTL `1_000` ms), a zero-margin key expires after
       `1_000` ms of backend time, so a 1 ms-lagging peer reporting `readerNow = 1_099` reads
       `null` and admits against a missing key — two admissions only `999` logical ms apart!
3. **Fixed retention rule (`expireIn = (resetAt - request.now) + 5_000`) and proof**:
   - Every admitted GCRA write sets `expireIn = (resetAt - writerNow) + GCRA_CLOCK_SKEW_BOUND_MS`
     with fixed `GCRA_CLOCK_SKEW_BOUND_MS = 5_000` ms (where `1 <= resetAt - writerNow <= ceilDiv(B * W, L)`,
     reaching `windowMs + 5_000` ms at full default burst).
   - Define `backendElapsed` from the adapter's TTL anchor (`ttlAnchor` at write submission) to the
     subsequent read, and define the clock/transit gap as
     `Δ_gap = backendElapsed - (readerNow - writerNow)` (combining writer-ahead-of-reader clock
     skew, backend-vs-caller clock drift, write-to-read transit latency, and any backward clock
     step on a host).
   - **Precondition**: Whenever `Δ_gap < 5_000` ms, any reader with `readerNow < resetAt`
     (i.e. `readerNow - writerNow < resetAt - writerNow`) satisfies:
     `backendElapsed = (readerNow - writerNow) + Δ_gap < (resetAt - writerNow) + 5_000 = expireIn`.
     The KV record is therefore guaranteed to remain physically present throughout its entire
     logical lifetime — **completely independent of `windowMs / limit`**.
   - In both counterexamples above (tested without an intervening renewing write in the expiry
     fixture, and in a separate fixture for on-time renewal):
     - `limit = windowMs = 60_000, burst = 1, writerNow = 100`: `expireIn = 5_001` ms; at
       `backendElapsed = 1` ms, a lagging peer at `readerNow = 100` still reads `tat = 101` and is
       denied (zero KV write), and without a renewing write the original key expires once
       `backendElapsed >= 5_001` ms; in a separate fixture, an on-time peer at `readerNow = 101`
       treats the retained record as logically idle, admits, and writes a fresh `expireIn = 5_001` ms
       from its new write anchor.
     - `limit = burst = 1, windowMs = 1_000, writerNow = 100`: `expireIn = 6_000` ms; at
       `backendElapsed = 1_000` ms, a 1 ms-lagging peer at `readerNow = 1_099` still reads
       `tat = 1_100` and is denied (`retryAt = 1_100, resetAt = 1_100`, zero KV write), and without
       a renewing write the original key expires once `backendElapsed >= 6_000` ms; in a separate
       fixture, an on-time peer at `readerNow = 1_100` admits and refreshes the TTL from its new
       write anchor.
   - Because logical idle expiry still compares `tat <= request.now * L`, the fixed `5_000` ms
     retention margin **never extends logical quota** (`resetAt` and `retryAt` are unchanged).
   - If `Δ_gap >= 5_000` ms (for example, unsynchronized hosts skewed by `>= 5` seconds or a
     backward NTP jump `>= 5` seconds), physical expiry can discard live state before a severely
     lagging peer reaches `resetAt`; NTP synchronization well within `5_000` ms (matching
     [`packages/service/README.md`](../packages/service/README.md), line 799) is therefore a
     required operational precondition for distributed KV quotas.
4. **Multi-host skew and single-host backward clock steps (while `Δ_gap < 5_000` ms)**:
   - Unlike fixed-window or weighted two-window counters, GCRA has no shared epoch boundary where
     skew splits keys across adjacent windows. While the record is retained,
     `tat = max(storedTat, now * L)` ensures an ahead-of-time replica advances `tat` monotonically
     (making behind-time peers conservatively stricter) and a behind-time replica or backward clock
     step never moves `tat` backwards.
   - In `MemoryRateLimitStore`, because GCRA rotating eviction retains entries until
     `BigInt(entry.resetAt) + BigInt(GCRA_CLOCK_SKEW_BOUND_MS) <= BigInt(request.now)`, cross-key
     backward clock steps strictly smaller than `5_000` ms preserve live debt identically to KV
     (for example, with `L = B = 1, W = 1_000`: admitting `"a"` at `100`, consuming `"b"` at
     `1_100`, and consuming `"a"` at `1_099` retains `"a"` and denies with `retryAt = 1_100` in
     both stores). Backward clock steps `>= 5_000` ms after an intervening higher-timestamp request
     can trigger rotating eviction of an entry whose `resetAt + 5_000 <= interveningNow`, matching
     KV's `5_000` ms skew bound.
5. **Injected test clock vs backend TTL clock**:
   - KV adapters interpret `expireIn` against the backend's own clock (`Date.now() + expireIn` in
     `MemoryKvAdapter`; server clock in Deno KV and Redis).
   - Fast-forwarding an injected `request.now` past `resetAt` works deterministically even while
     the KV entry is still physically present, because `evaluateGcra()` treats `tat <= request.now * L`
     as logically idle.
   - Deterministic injected-clock and concurrency fixtures do not lose keys during short pauses
     (`< 5_000` ms), and tests that explicitly exercise the `5_000` ms retention boundary control the
     backend expiry clock independently of `request.now`.
6. **Sub-millisecond emission intervals (`windowMs < limit`)**:
   - Because arithmetic scales by `L`, `limit: 1_000, windowMs: 100` works without division by zero,
     enforcing `<= burst` at a single caller timestamp and `<= burst + floor(Δt * limit / windowMs)`
     across closed caller-timestamp intervals `Δt`, with `resetAt >= now + 1` and
     `retryAt >= now + 1`.

### Technical verification gates

The rolling-quota implementation MUST satisfy all of the following verification gates (with
existing fixed-window tests passing unmodified):

| Gate / Test group | Required assertions | Backends covered |
| --- | --- | --- |
| 1. Issue #2653 deterministic alignment parity | Both `[100, 200, 300, 400]` and `[59_850, 59_950, 60_050, 60_150]` with `limit: 2, windowMs: 60_000` return `[true, true, false, false]`; exact quota-denial `resetAt` (`60_100` / `119_850`) and `retryAt` (`30_100` / `89_850`); `retryAt - 1` denied and `retryAt` admitted. | `MemoryRateLimitStore`, `KvRateLimitStore(MemoryKvAdapter)`, `KvRateLimitStore(DenoKvAdapter)` |
| 2. Exact rational, upper-bound & short-interval envelope | Non-divisible `limit: 3, windowMs: 1_000` (exact `334` ms eligibility, no drift over 100+ ticks); `windowMs: 1, limit: 3, burst: 3` (half-open 1 ms interval `[t, t + 1)` admits at most `3`, demonstrating `limit + burst - 1` is an upper bound); sub-ms `limit: 1_000, windowMs: 100, burst: 2` (2 admitted at `t = 0`, 3rd denied with `retryAt = 1`, 2 more admitted at `t = 1`); high `limit: 100_000, windowMs: 3_600_000` (O(1) stored record with no limit cliff). | Pure domain unit test + Memory + KV |
| 3. Explicit `burst` behavior | Default `burst = limit`; `burst: 1` strict spacing; `burst < limit`; invalid `burst` (`0`, `-1`, `0.5`, `NaN`, `Infinity`) throws `RangeError` at construction. When `burst > limit` is supported, `limit: 1, windowMs: 1_000, burst: 5` admits 5 at `now = 0` (5th write has `resetAt: 5_000` and KV `expireIn: 10_000`) and denies the 6th with exact `retryAt: 1_000, resetAt: 5_000`. | Memory + KV |
| 4. Shared KV concurrency (physical-expiry-free) | 30 concurrent `Promise.all` reservations at identical `now` against `limit: 5, windowMs: 60_000` (under non-expiring backend clock or within the `5_000` ms retention window) admit `0 < admitted <= 5` (never `> 5`); subsequent sequential calls at the same `now` fill exactly the remaining `5 - admitted` slots; next call denied with exact `retryAt`; `kv.list` throws if ever invoked. | `MemoryRateLimitStore`, `KvRateLimitStore(MemoryKvAdapter)`, `KvRateLimitStore(DenoKvAdapter)` |
| 5a. KV CAS exhaustion (advisory), write-free denial & TTL | Forced `{ ok: false }` on `kv.atomic` stops after `maxAttempts` reads/commits and returns **advisory fallback** `{ allowed: false, retryAt, resetAt: Math.max(lastObservedResetAt, retryAt) }` for **both** (i) absent/idle KV entry (`limit: 3, windowMs: 60_000, burst: 3, now: 100` → `{ retryAt: 20_100, resetAt: 20_100 }`) and (ii) persisted live record after 2 prior admissions (`tatMs = 40_100` → `{ retryAt: 20_100, resetAt: 40_100 }`, asserting stale persisted `40_100` rather than tentative uncommitted `60_100`); quota-exhausted denial performs `0` `kv.atomic` writes; GCRA KV writes emit `expireIn = (resetAt - now) + 5_000`; real-clock TTL eviction removes expired KV key; two store instances sharing one `kv`, the **same serialized `prefix`**, and the **same `(limit, windowMs, burst)` policy tuple** enforce one shared rolling quota, whereas **distinct serialized prefixes** enforce independent quotas. | `KvRateLimitStore(MemoryKvAdapter)` + mock wrapper |
| 5b. Redis confirmed-write & two-client concurrency (prerequisite: [#2648](https://github.com/rickylabs/netscript/issues/2648)) | (a) Command error inside Redis `MULTI`/`EXEC` throws and NEVER returns `{ allowed: true }`. (b) Conflicting concurrent reservations across **two separate `RedisKvAdapter` clients** (not sharing `atomicTail`) against the same key never admit `> burst` at one timestamp. (c) Prefixes that are disjoint after Redis `:` serialization isolate independent limiters even with colon-bearing keys, and each namespace enforces its own policy envelope independently during coexistence. | `KvRateLimitStore(RedisKvAdapter)` (inert transport for EXEC error + two-client Redis/Garnet fixture when Redis is in scope) |
| 6a. Split backend-clock & request-clock fixed retention boundary (separate observation vs renewal fixtures) | Independently controlled backend expiry clock (measured from the adapter's write TTL anchor) and caller `request.now` verifying fixed retention `expireIn = (resetAt - now) + 5_000`, using **separate fixtures** so on-time renewal never masks original-write expiry: **(i) Original-write expiry (no intervening renewing admission):** for both `(L = W = 60_000, B = 1, now = 100 → expireIn = 5_001)` and `(L = B = 1, W = 1_000, now = 100 → expireIn = 6_000)`, after backend `+1` ms / `+1_000` ms a lagging peer at `now = 100` / `1_099` still reads the retained record and is denied (`retryAt = 101` / `1_100`, `0` KV writes), and advancing backend elapsed time to `5_001` / `6_000` ms without any renewing write physically evicts the original key; **(ii) On-time logical-idle admission & TTL refresh (fresh fixture):** for both policies, after backend `+1` ms / `+1_000` ms an on-time peer at `now = 101` / `1_100` treats the retained record as logically idle, admits, and writes a fresh `expireIn = 5_001` / `6_000` ms from the new write anchor, remaining present past the original deadline and expiring at the refreshed deadline. | `KvRateLimitStore` over clock-controlled KV test wrapper |
| 6b. Safe-time overflow oracle, Deno KV TTL-ceiling & cross-key backward step | **Overflow oracle (through advertised `retryAt`)** with `limit = windowMs = burst = 2` (`M = Number.MAX_SAFE_INTEGER`): (a) at `now = M - 2`: Req 1 admits (`resetAt = M - 1`), Req 2 admits (`resetAt = M`), Req 3 **throws `RangeError`** (no representable next commit instant; zero state mutation/KV write); (b) at `now = M - 3`: Req 1 admits (`M - 2`), Req 2 admits (`M - 1`), Req 3 denies cleanly (`{ allowed: false, resetAt: M - 1, retryAt: M - 2 }`), **Req 4 at advertised `retryAt = M - 2` admits cleanly** (`{ allowed: true, resetAt: M }`, KV `expireIn = 5_002`), Req 5 at `M - 2` **throws `RangeError`**; (c) `now = M` throws `RangeError` upfront. **Deno KV TTL-ceiling gate**: `windowMs = 31_535_995_000, limit = burst = 1` (`expireIn = MAX_GCRA_TTL_MS = 31_536_000_000`) commits with `ok: true` on `DenoKvAdapter(Deno.openKv(':memory:'))` and `MemoryKvAdapter`; `windowMs = 31_535_995_001` (`MAX_GCRA_TTL_MS + 1`) and `windowMs = M - 10` throw `RangeError('rateLimit retention exceeds maximum supported TTL')` **before any KV IO** in both `MemoryRateLimitStore` and `KvRateLimitStore`. **Cross-key backward clock step parity**: with `L = B = 1, W = 1_000`, admit key `"a"` at `now = 100`, consume key `"b"` at `now = 1_100`, then consume `"a"` at `now = 1_099` → **denied** (`retryAt = 1_100, resetAt = 1_100`) on **both** `MemoryRateLimitStore` (skew-bounded rotating scan retains `"a"` until `resetAt + 5_000 = 6_100`) and clock-controlled `KvRateLimitStore`. | Pure domain + `MemoryRateLimitStore` + `KvRateLimitStore(MemoryKvAdapter)` + `KvRateLimitStore(DenoKvAdapter)` |
| 7. Memory `maxKeys` saturation (advisory) & skew-bounded rotating eviction | With `maxKeys: 1`, key `"a"` admitted to `resetAt = 60_000`, new key `"b"` at `now = 1` (`limit: 2, windowMs: 60_000`) returns **advisory fallback** `{ allowed: false, retryAt: 30_001, resetAt: 60_001 }` without evicting `"a"`, and retrying `"b"` at `now = 30_001` or `now = 60_000` is STILL denied while `"a"` stays within its `5_000` ms skew retention horizon; once `now = 65_000` (`resetAt + GCRA_CLOCK_SKEW_BOUND_MS`), rotating eviction reclaims `"a"` and admits `"b"`. | `MemoryRateLimitStore` |
| 8. Corrupt state, adapter `null` distinction & cancellation | Non-null malformed KV values (bare number, missing tag, `tatRem >= limit`, negative `tatMs`, `tatMs === Number.MAX_SAFE_INTEGER && tatRem > 0`) throw `TypeError` across all KV adapters. Persisted literal `null` value: on `MemoryKvAdapter` (`entry = { value: null, versionstamp }`) throws `TypeError`; on `DenoKvAdapter` (`entry === null` per `deno-kv.adapter.ts:84–96`) fails absent-versionstamp CAS and resolves via conservative CAS contention fallback after `maxAttempts` (never admits). Invalid `policy` throws `TypeError`; aborted `AbortSignal` rejects before IO and between CAS attempts without admitting. | Memory + `MemoryKvAdapter` + `DenoKvAdapter` |
| 9. Middleware `Retry-After` integration | Rolling quota denial sets whole-second `Retry-After` from `decision.retryAt` (rounded up at response-time `now()`); fixed-window and custom stores without `retryAt` fall back to `decision.resetAt`; CORS headers wrap `429`; unselected routes perform zero store IO. | `createService().withRateLimit()` + `createRateLimitMiddleware()` |
| 10. Default fixed-window compatibility & zero-margin TTL regression | Existing `packages/service/tests/rate-limit_test.ts` and `rate-limit-address-key_test.ts` pass unmodified, including exact deep equality `{ allowed: false, resetAt: 5000 }` on default fixed-window stores, PLUS explicit assertion that default `{ kind: 'fixed-window' }` `KvRateLimitStore` writes pass exact zero-margin `expireIn === resetAt - request.now` (no `+ 5_000` skew margin added). | Existing test suite + `KvRateLimitStore` |
| 11. Static, docs, quality, publish gates | Scoped `run-deno-check.ts`, `run-deno-lint.ts`, `run-deno-fmt.ts`, `deno task doc:lint --root packages/service`, `deno task docs:jsdoc-examples`, `deno task quality:gate`, and `deno publish --dry-run --allow-dirty` in `packages/service` all exit `0`. | Repository tooling |

## Drawbacks

1. **Not a strict sliding-window count**: With default `burst = limit`, GCRA admits up to the upper
   bound `2 * limit - 1` requests across one half-open rolling `windowMs` starting from idle
   (`limit` at `t` plus `limit - 1` paced at `windowMs / limit`, when `windowMs >= limit`). Callers
   expecting a strict `count(now - windowMs, now] <= limit` invariant (for example, strict upstream
   billing contracts where `[59_850, 59_950, 89_850]` must reject the third request at `89_850`)
   must either set `burst: 1` (sacrificing burstiness) or wait for a future capped sliding-log
   policy.
2. **Additional field and exact-vs-advisory distinction on `RateLimitDecision`**: Direct
   `store.consume()` callers adopting rolling policies should read `decision.retryAt ?? decision.resetAt`
   for optimal retry timing and understand that contention/capacity denials return advisory backoff
   rather than exact eligibility.
3. **Slightly larger stored record, fixed 5 s idle retention, and 365-day ceiling**: A GCRA KV
   entry stores a fixed four-field safe-integer object (`90`–`123` bytes in Redis codec encoding)
   instead of fixed-window's bare integer, retains idle KV keys for `5_000` ms past `resetAt` to
   prevent skew-induced early eviction, and caps `ceil(burst * windowMs / limit) + 5_000` at
   `31_536_000_000` ms (365 days) so no accepted configuration can exceed Deno KV's adapter TTL
   limit.
4. **No in-place mixed-policy rollout**: Because rolling quota sharing relies on a single-coherent-policy
   caller precondition (differing tuples hit independent buckets), changing `(limit, windowMs, burst)`
   during a rolling deploy requires a new serialization-disjoint KV prefix, creating independent
   per-namespace buckets during coexistence.
5. **Redis prerequisite and prefix discipline**: Shared-KV commit guarantees on `RedisKvAdapter`
   depend on [#2648](https://github.com/rickylabs/netscript/issues/2648), and Redis's unescaped `:`
   key serialization requires operators to choose prefixes that are disjoint after serialization.
6. **Hot-key CAS ceiling remains**: As in fixed-window, `KvStore.atomic()` uses optimistic CAS
   bounded by `maxAttempts` (default 8, max 32); extreme single-key write contention can cause
   conservative advisory rejections before `limit` slots are consumed.

## Rationale and alternatives

### Comparison across candidate designs

| Dimension | 1. Strict rolling admission (Sliding Window Log) | 2. Approximate rolling counters (Weighted Two-Window) | 3. Explicit burst/refill budget (GCRA — **Recommended**) | 4. Fixed windows + reducing duplicate reads (Alternative) |
| --- | --- | --- | --- | --- |
| **Sequence A** `[100, 200, 300, 400]` (`L=2, W=60s`) | `[T, T, F, F]`; `retryAt = 60_100` (`Retry-After: 60`) | `[T, T, F, F]` | `[T, T, F, F]`; `retryAt = 30_100` (`Retry-After: 30`) | `[T, T, F, F]`; `resetAt = 60_000` |
| **Sequence B** `[59_850, 59_950, 60_050, 60_150]` | `[T, T, F, F]`; `retryAt = 119_850` (`Retry-After: 60`) | `est < L`: `[T, T, T, F]` (**3 admitted!**); `est + 1 <= L`: `[T, T, F, F]` | `[T, T, F, F]`; `retryAt = 89_850` (`Retry-After: 30`) | `[T, T, T, T]` (**4 admitted** unless collapsed to 1 read) |
| **Sequence C** `[59_850, 59_950, 89_850]` (3rd at +30s) | `[T, T, F]` (strict `<= 2` in 60s) | `est + 1 <= L`: denies `89_850`, **admits at `90_000`** (3 in 30.15s) | `[T, T, T]` (paced refill after `W/L = 30s`) | `[T, T, T]` |
| **Sequence D** `[0, 100]` then `60_050` (>60s later) | `[T, T]` → `T` (exact) | **`F` (false deny!)** until `~90_000` (previous window assumed uniform) | `[T, T]` → `T` (exact) | `[T, T]` → `T` |
| **Max in any half-open rolling `[t, t + windowMs)` (caller timestamps)** | **`limit` (1.0× exact)** | Up to **`2 * limit - 1`** under `est + 1 <= limit` (e.g., `L = 10, W = 1_000`: 10 at `999` + 9 at `1_900` = **19** in 901 ms!) or **`2 * limit`** under `est < limit` (10 at `999` + 10 at `1_901` = **20** in 902 ms!), **plus** false denials (Sequence D) | **Upper bound `limit + burst - 1`** (`2 * limit - 1` at `burst = limit`, paced at `W / L`; `limit` at `burst = 1`; strictly lower for tiny integer windows such as `windowMs = 1, limit = burst = 3`, which admits at most `3`) | **`2 * limit`** (2× instantaneous boundary spike) |
| **Max burst (explicit intervals)** | `limit` at `Δt = 0` and for any `Δt < windowMs` (shift-invariant within safe-time representability) | **Single timestamp (`Δt = 0`)**: at most `limit` under either predicate. **Across epoch boundary `[W - 1, W + 1]` (`Δt = 2` ms, integer `W >= 2`)**: up to **`limit + floor(limit / W)`** (`est + 1 <= limit`) or **`limit + ceil(limit / W)`** (`est < limit`) — e.g. `10` / `11` for `L = 10, W = 1_000`, and **`15`** under either predicate for `L = 10, W = 2` (`10` at `1` and `5` at `3`). **Single timestamp late in next window** (e.g. `t = 1_900`/`1_901` after `10` at `999`): up to `limit - 1` (`est + 1 <= limit`) or `limit` (`est < limit`), totaling `19` or `20` inside `< windowMs`. | **Single timestamp (`Δt = 0`)**: **`burst`** (shift-invariant within safe-time representability). **Closed interval `[t, t + Δt]`**: up to **`burst + floor(Δt * limit / windowMs)`** in caller timestamps (and `burst + floor((Δt_real + 2ε) * limit / windowMs)` over real elapsed time under `±ε` clock error). | **`2 * limit`** across a 2 ms epoch boundary (`[W - 1, W]`) |
| **Storage bound per key** | **O(limit)** stored timestamps per key. **Measured on `DenoKvAdapter` (`Deno.openKv(':memory:')`, plain numeric epoch-ms array `number[]`)**: passing samples up to `7_280` timestamps (`5_000`, `7_000`, `7_280`) round-trip in one value, while `7_300`, `8_000`, and `10_000` are rejected with `TypeError: Value too large (max 65536 bytes)`. Distinct from that 64 KiB backend ceiling, linear O(limit) payloads still inflate every Redis JSON/Deno KV read/write, widen the CAS conflict window, and multiply standalone `MemoryRateLimitStore` RAM (`maxKeys × limit`, e.g., `10_000 × 5_000` numbers), requiring a much smaller **explicit product cap** (e.g., `maxLimit <= 256` or `<= 1_000`) and total-entry cap. | **O(1)** stored record — two counters + window id (1 packed key or 2 epoch keys). | **O(1) stored quota record** (fixed four-field safe-integer object, `90`–`123` bytes in Redis codec encoding, independent of `limit` and `windowMs`) and **O(1) per-key memory** (`3` numbers) in standalone `MemoryRateLimitStore`. Zero `limit`-size cliff; bounded only by the `365`-day `MAX_GCRA_TTL_MS` ceiling. (Adapter internals such as `MemoryKvAdapter`'s `expirationHeap` retain their own sweep behavior.) | **O(1)** stored fixed-window counter + external cache/coalescing state elsewhere. |
| **KV atomicity & contention** | Single-key `kv.get` + `kv.atomic([check], [set])` if stored as one array, **but** O(limit) read/decode/encode/write widens the CAS conflict window linearly with `limit`. Multi-key per-timestamp storage would require `kv.list()` scans (forbidden) or multi-key atomic limits. | Two-key layout requires `getMany(2)` + 2-key `AtomicCheck` (contention across window boundary and optional `getMany` fallback). Packed 1-key layout uses 1 `get` + 1-key CAS with `expireIn: 2 * windowMs`. | Single-key `kv.get` + `kv.atomic([{ key, versionstamp }], [{ type: 'set', key, value, expireIn }])`. Constant small record minimizes CAS window; zero scans; zero writes on deny; bounded `maxAttempts` (`1..32`). Redis commit confirmation conditional on [#2648](https://github.com/rickylabs/netscript/issues/2648); Redis prefixes must be disjoint after serialization. | Unchanged single-key `kv.get` + `kv.atomic` on the epoch-aligned window key (same `#2648` Redis caveat). |
| **Memory / KV parity** | Exact parity possible **within `maxLimit`**, given single policy, confirmed commits, and skew-bounded retention. | Exact parity possible with integer cross-multiplication **if** both use identical packed 2-window state and skew-bounded retention; two-key KV can diverge if `prev` expires early. | **Exact bit-for-bit parity** via shared pure `evaluateGcra()` (including upfront `MAX_GCRA_TTL_MS` validation) across memory, `MemoryKvAdapter`, `DenoKvAdapter`, and (post-`#2648`) `RedisKvAdapter` under single policy and `Δ_gap < 5_000` ms. | Unchanged fixed-window parity; duplicate-read reduction lives outside the store. |
| **Clock assumptions** | Epoch ms across hosts; skewed hosts can insert out-of-order timestamps (requires sorted insert); physical TTL needs skew margin; backward jump keeps retained entries conservative. | Epoch ms across hosts; still anchored to epoch boundaries so inter-host skew near `W` splits keys and distorts `w = (W + windowMs - now) / windowMs`. | Epoch ms across hosts; **no epoch boundaries to disagree on**; fixed `(resetAt - now) + 5_000` ms retention protects live TATs against any `Δ_gap < 5_000` ms independent of `windowMs / limit`, and `tat = max(storedTat, now * L)` fails conservative under skew and backward steps. | Epoch ms across hosts; skew near epoch boundary widens 2× leakage window. |
| **Default compatibility** | Additive opt-in policy, **except** arbitrary `limit` values accepted by `RateLimitRequest` would fail at runtime with `RangeError` above `maxLimit` unless `RateLimitStore` exposes a cap. | Additive opt-in policy; `Retry-After` is awkward when `c_curr >= limit` (even after `W_end`, `c_curr` becomes `c_prev` so `est + 1 <= limit` still denies at `W_end`). | **100% additive opt-in**; fixed-window defaults and zero-margin TTL untouched; arbitrary safe-integer `limit` works without a `limit` cliff (up to `365`-day retention ceiling); `retryAt ?? resetAt` is backward-compatible with exact vs advisory distinction. | 100% compatible; zero changes to `@netscript/service/rate-limit`. |

### Why GCRA is recommended

1. **General-purpose O(1) stored record without a `limit` cliff**: `@netscript/service/rate-limit`
   is a general framework store whose contract (`RateLimitRequest`) accepts arbitrary positive safe
   integer `limit` values. Measured on `DenoKvAdapter` (`Deno.openKv(':memory:')`), a plain numeric
   epoch-ms timestamp array round-trips for passing samples `5_000`, `7_000`, and `7_280` entries in
   one Deno KV value, and hits the backend's 64 KiB cap (`TypeError: Value too large (max 65536 bytes)`)
   at `7_300`, `8_000`, and `10_000` entries — ruling out high-volume quotas (such as `limit: 10_000`
   or `100_000` per hour/day) without multi-key splitting. Separate from that measured backend
   limit, linear O(limit) payloads still degrade performance well below 64 KiB by amplifying every
   Deno KV/Redis read-encode-write payload, widening the optimistic CAS conflict window under
   concurrency, and multiplying `MemoryRateLimitStore`'s heap footprint (`maxKeys × limit`, e.g.,
   `10_000 × 5_000` numbers). A production sliding-window log therefore requires a much lower
   explicit product cap (such as `maxLimit <= 256` or `<= 1_000`) that cannot be validated at
   middleware construction time without leaking store-specific limits onto `RateLimitStore`. GCRA
   keeps the stored quota record (`4` fields, `90`–`123` bytes in Redis codec encoding) and
   standalone memory-store entry (`3` numbers) strictly O(1) for every `limit` up to
   `Number.MAX_SAFE_INTEGER`, bounded only by the `365`-day `MAX_GCRA_TTL_MS` retention ceiling.
2. **Eliminates clock-boundary sensitivity and cliff retries**: Under a single coherent policy and
   within safe-integer representability of inputs, outputs, and next-commit instants, GCRA is
   shift-invariant in caller timestamps, passes both issue #2653 alignment sequences identically,
   eliminates 2× boundary spikes, and releases capacity smoothly at one slot per `windowMs / limit`
   instead of creating synchronized thundering-herd retries at `oldest + windowMs`.
3. **Minimal CAS footprint in shared KV**: One small read and one single-key versionstamp CAS keeps
   serialization and round-trip cost comparable to fixed windows on `DenoKvAdapter` and (once
   `#2648` lands) `RedisKvAdapter`, with no `kv.list()` scans and no multi-key coordination.
4. **Cleanly rejects approximate two-window counters**: Weighted two-window counters fail in both
   directions — under `est < limit` they over-admit on issue #2653's boundary sequence
   (`[true, true, true, false]`) and reach `2 * limit` inside one rolling window (e.g., 10 at `999`
   + 10 at `1_901` = 20 for `limit = 10, windowMs = 1_000`), while under `est + 1 <= limit` they
   still reach `2 * limit - 1` inside one rolling window with a single-millisecond late burst of
   `limit - 1` (10 at `999` + 9 at `1_900` = 19 in 901 ms) AND **falsely reject** legitimate
   requests arriving more than `windowMs` after an early-window burst (Sequence D), with awkward
   `Retry-After` math when `c_curr >= limit`.
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
  `{ kind: 'fixed-window' }` with identical key layouts, eviction, zero-margin KV TTLs, and exact
  `{ allowed, resetAt }` decision objects.
- `RateLimitStore`, `RateLimitRequest`, and `ServiceRateLimitOptions` remain source- and
  runtime-compatible. Custom `RateLimitStore` implementations that omit `retryAt` continue to
  compile and work in `createRateLimitMiddleware()`.
- **Migration for opting in or changing rolling policy**:
  1. Choose a **new KV `prefix` that is disjoint after serialization** (especially on
     `RedisKvAdapter`, where `keyToRedisKey` joins unescaped `:` segments) when switching a deployed
     limiter from fixed-window to `policy: { kind: 'gcra' }`, or when changing
     `(limit, windowMs, burst)` (remembering that prefix isolation creates independent buckets so
     each policy's envelope applies per namespace during rolling coexistence).
  2. Pass `policy: { kind: 'gcra' }` (or `{ kind: 'gcra', burst }`) to `createMemoryRateLimitStore`
     or `createKvRateLimitStore`. Ensure NTP clock synchronization across KV-sharing hosts stays
     well within the fixed `5_000` ms `GCRA_CLOCK_SKEW_BOUND_MS` bound, and keep
     `ceil(burst * windowMs / limit) + 5_000 <= 31_536_000_000` ms (365 days).
  3. On Redis deployments, wait for [#2648](https://github.com/rickylabs/netscript/issues/2648)
     before relying on `RedisKvAdapter` for confirmed atomic reservations.
  4. Direct callers of `store.consume()` that format `Retry-After` or `RateLimitError.retryAfter`
     should update from `decision.resetAt` to `decision.retryAt ?? decision.resetAt`. Callers using
     `createRateLimitMiddleware()` / `.withRateLimit()` get this automatically.

## Prior art

- **RFC 9110 § 10.2.3 (`Retry-After`)**: Defines `Retry-After` as delay-seconds indicating how long
  the service is expected to be unavailable to the requesting client; `Math.max(1, Math.ceil((retryAt - now) / 1000))`
  matches NetScript's existing whole-second ceiling convention.
- **IETF HTTP `RateLimit` Header Fields draft**: Separates `reset` (seconds until quota resets) from
  `Retry-After` (seconds until a rejected client may retry), directly motivating keeping `resetAt`
  as full quota reset and adding `retryAt` for next-slot eligibility / backoff.
- **GCRA (ITU-T I.371 / Brandur's "Scaling your API with rate limiters" / `redis-cell`)**: Standard
  O(1)-record single-timestamp formulation mathematically isomorphic to a continuous-time
  leaky/token bucket, requiring only one CAS key in distributed stores.
- **NetScript `#2224` (`packages/service/src/rate-limit/`)**: Established the zero-timer bounded
  memory store, single-key CAS KV store with bounded `maxAttempts`, `AbortSignal` propagation, and
  explicit `ServiceProxyTrust` / IPv6 `/64` bucketing that this RFC preserves.
- **NetScript `#2365` (device-grant polling cadence)**: Separate domain requirement for dynamic
  per-credential intervals that increase monotonically on upstream `slow_down` responses over a
  grant's lifetime; intentionally decoupled from static route/read quotas here.
- **NetScript `#2648` (Redis atomic `EXEC` command-error confirmation)**: Tracks rejecting
  unconfirmed Redis `MULTI`/`EXEC` command receipts in `packages/kv/adapters/redis.adapter.ts`, a
  prerequisite for Redis shared-KV commit guarantees in this RFC.

## Unresolved questions

1. **Primary rolling algorithm — GCRA vs capped strict sliding-window log**: Should the initial
   rolling policy be GCRA (O(1) stored record per key, arbitrary safe-integer `limit` up to the
   365-day retention ceiling, shift-invariant single-timestamp burst `<= burst` within safe-time
   representability, upper bound `2 * limit - 1` paced requests in one half-open `windowMs` from
   idle), or do protected service reads require a strict `<= limit` count in every rolling
   `windowMs` interval even if that requires O(limit) per-key storage and an explicit product cap
   (e.g., `maxLimit <= 256` or `<= 1_000`, distinct from Deno KV's 64 KiB single-value limit where
   `7_280` plain epoch-ms entries passed and `7_300` were rejected)?
2. **`RateLimitDecision` retry timing surface**: Should `RateLimitDecision` add optional
   `retryAt?: number` (exact representable next commit instant on quota exhaustion, advisory on
   contention/capacity) while keeping `resetAt` as full quota recovery (recommended), or redefine
   `resetAt` to mean "next eligible instant / backoff when `allowed === false`" (zero new fields,
   but non-monotonic allow-vs-deny meaning)?
3. **`burst` knob scope in v1**: Should `{ kind: 'gcra', burst?: number }` include optional `burst`
   in the first implementation — and if so, should `burst > limit` be allowed (general token bucket:
   rate `limit / windowMs`, capacity `burst`, subject to `MAX_GCRA_TTL_MS`) or constrained to
   `1 <= burst <= limit` — or should v1 fix `burst = limit` and defer explicit `burst`?
4. **Policy option ergonomics**: Is the discriminated union `{ kind: 'fixed-window' } | { kind: 'gcra'; burst?: number }`
   preferred as the single canonical shape, or should string shorthand (`'fixed-window' | 'gcra'`)
   also be accepted?
5. **Conservative advisory `retryAt` under memory `maxKeys` saturation**: Should both KV CAS
   exhaustion and memory `maxKeys` saturation report advisory `retryAt = Number(BigInt(now) + ceilDiv(W, L))`,
   or should memory `maxKeys` saturation report advisory `retryAt = now + windowMs`?
6. **Fixed GCRA retention constants**: Do the proposed fixed constants (`GCRA_CLOCK_SKEW_BOUND_MS = 5_000` ms
   clock-skew bound and `MAX_GCRA_TTL_MS = 31_536_000_000` ms / 365-day retention ceiling) match
   target deployment tolerances, or should either fixed constant use a different value (keeping
   retention non-configurable in v1)?

## Future work

Every item below is explicitly deferred out of scope for this RFC:

- **Mixed-policy rollout and shared time-debt carryover**: Supporting heterogeneous
  `(limit, windowMs, burst)` callers sharing one live quota bucket during rolling deployments
  (for example, persisting a rate denominator `den`, defining exact `(B - 1) * (W / L)` eligibility
  transitions across simultaneous `limit` and `burst` changes, and verifying interleaved rollout
  sequences) instead of requiring one coherent policy per store/prefix.
- **Configurable physical KV retention**: Exposing a retention margin option (such as
  `clockSkewMarginMs` or retention profiles) if deployments require clock-skew tolerances larger
  than the fixed `5_000` ms bound or shorter idle KV lifetimes, along with explicit fixed-window
  interaction rules and backend TTL bounds.
- **Optional capped `'sliding-log'` policy**: Adding `{ kind: 'sliding-log', maxLimit?: number }`
  on `RateLimitPolicy` for strict `count(now - windowMs, now] <= limit` compliance or billing
  quotas under an explicit product cap without changing `RateLimitStore` or `RateLimitDecision`.
- **Weighted request cost**: Supporting `cost > 1` on `RateLimitRequest` (advancing `tat` by
  `cost * W`) for expensive aggregate reads without changing the O(1) stored state schema.
- **Post-authentication rate-limit stage**: Adding a `ServiceBuilder` / oRPC middleware seam that
  runs a `RateLimitStore` after `authn`/`authz` so principal-keyed protected reads need no
  per-handler boilerplate.
- **Standard `RateLimit` / `RateLimit-Policy` response headers**: Projecting `resetAt` cleanly
  alongside `Retry-After` using the IETF `RateLimit` header fields format.
- **Dynamic monotonic device-grant polling cadence ([#2365](https://github.com/rickylabs/netscript/issues/2365))**:
  Per-credential polling intervals that grow monotonically across upstream `slow_down` responses
  over a grant's lifetime, kept distinct from static route/read quotas.
- **Redis atomic `EXEC` command-error confirmation ([#2648](https://github.com/rickylabs/netscript/issues/2648))**:
  Validating per-command replies inside `packages/kv/adapters/redis.adapter.ts` `MULTI`/`EXEC`,
  tracked separately as a prerequisite before certifying `RedisKvAdapter` for shared rolling quotas.
