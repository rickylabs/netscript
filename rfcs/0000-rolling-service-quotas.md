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
Rate Algorithm (GCRA) over exact rational integer arithmetic using an O(1) stored quota record per
key (and O(1) per-key memory in the standalone memory store) plus a single version-checked KV atomic
commit per attempt (with Redis commit confirmation conditional on
[#2648](https://github.com/rickylabs/netscript/issues/2648)). `RateLimitDecision` preserves
`resetAt` as full quota recovery (epoch-aligned window end for fixed windows; full bucket recovery
for GCRA) and adds an optional `retryAt` field carrying the exact earliest next eligible epoch
millisecond on quota-exhaustion denials under unchanged state and coherent policy, or an advisory
backoff timestamp on contention and capacity denials; middleware and callers derive `Retry-After`
uniformly from `decision.retryAt ?? decision.resetAt`.

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
| [`packages/service/src/rate-limit/adapters/kv-rate-limit-store.ts`](../packages/service/src/rate-limit/adapters/kv-rate-limit-store.ts) (lines 11–69) | `KvRateLimitStoreOptions` has `{ prefix: KvKey; maxAttempts?: number }` (default `8`, max `32`). Requires `kv.atomic` at construction. Uses single-key `kv.get` + `kv.atomic([{ key, versionstamp }], [{ type: 'set', key, value: count + 1, expireIn: resetAt - request.now }])` on `[...prefix, request.key, request.windowMs, resetAt]`. No `kv.list()` scans; rejects without writing when exhausted; throws `TypeError` on corrupt KV state. | Rolling KV state must preserve single-key CAS, zero scans, zero writes on rejection, bounded `maxAttempts`, positive `expireIn`, and explicit retention preconditions. |
| [`packages/service/src/rate-limit/middleware/rate-limit-middleware.ts`](../packages/service/src/rate-limit/middleware/rate-limit-middleware.ts) (lines 29–96) | Calls `store.consume(...)` with `now()`, and on `!decision.allowed` sets `Retry-After` to `String(Math.max(1, Math.ceil((decision.resetAt - now()) / 1000)))` and returns `429` JSON `{ error: 'RATE_LIMITED' }`. | Middleware must prefer an explicit retry timestamp (`decision.retryAt ?? decision.resetAt`) so rolling rejections emit accurate `Retry-After` headers while custom fixed-window stores stay unchanged. |
| [`packages/service/src/builder/service-builder-impl.ts`](../packages/service/src/builder/service-builder-impl.ts) (lines 310–313, 458–461, 515–524) | `.withRateLimit()` delegates to `this.use()`, which runs before `build()` installs `authn`/`authz`. | Pre-auth route quotas work automatically via `.withRateLimit()`; post-auth principal-keyed protected reads call `store.consume()` directly after authentication. Both paths rely on the same `RateLimitStore` and `RateLimitDecision` contract. |
| [`packages/kv/types/kv-store.ts`](../packages/kv/types/kv-store.ts) (lines 149–196) | `KvStore` offers `get`, optional `getMany`, and optional `atomic(checks, mutations)` where `AtomicMutation` is `set` (with `expireIn?`), `delete`, `sum`, `min`, `max`. Combine mutations (`sum`/`min`/`max`) are `bigint`-only and carry no `expireIn` or conditional clamp. | Atomic rolling reservations must use `get` + versionstamp-checked `atomic([{ key, versionstamp }], [{ type: 'set', ..., expireIn }])`. |
| [`packages/kv/adapters/deno-kv.adapter.ts`](../packages/kv/adapters/deno-kv.adapter.ts) (lines 202–235), [`packages/kv/adapters/redis.adapter.ts`](../packages/kv/adapters/redis.adapter.ts) (lines 273–435), [`packages/kv/adapters/memory.adapter.ts`](../packages/kv/adapters/memory.adapter.ts) (lines 197–219, 504–522, 586–601) | `DenoKvAdapter` delegates to native `kv.atomic()` (64 KiB per-value limit). `RedisKvAdapter` serializes in-process `atomic()` via `atomicTail`, uses `WATCH`/`MGET`/`MULTI`/`EXEC` with up to `REDIS_ATOMIC_MAX_ATTEMPTS = 5` retries on null `EXEC` (`packages/kv/adapters/redis/types.ts:103`), JSON-encodes values via `encodeStoredValue`, and maps `expireIn` with `if (mutation.type === 'set' && mutation.expireIn) multi.psetex(...)`. **Crucially, `redis.adapter.ts:352–361` checks only `(await multi.exec()) === null` and reports `{ ok: true }` even when a queued command inside `EXEC` returned an error** (tracked in [#2648](https://github.com/rickylabs/netscript/issues/2648)). `MemoryKvAdapter` checks `expireIn ? Date.now() + expireIn : undefined` and pushes an `expirationHeap` entry per expiring write, removing stale heap entries asynchronously during its 1-second sweep. | (1) Shared-KV guarantees on `RedisKvAdapter` MUST be conditional on confirmed write outcomes (`#2648`). (2) Both `RedisKvAdapter` and `MemoryKvAdapter` treat `expireIn: 0` as falsy (no TTL — permanent key!), so rolling KV writes MUST guarantee `expireIn >= 1`. (3) O(1) memory claims must be scoped to the stored quota record and standalone `MemoryRateLimitStore`, not `MemoryKvAdapter`'s transient expiration heap. |
| [`packages/kv/adapters/redis/serialization.ts`](../packages/kv/adapters/redis/serialization.ts) (lines 37–46) | `keyToRedisKey` concatenates `KvKey` parts with `:` using `String(part)` without type tags or escaping (also noted in [`packages/kv/README.md`](../packages/kv/README.md), lines 109–113). | **In Redis, tuple arity alone cannot isolate keys.** Independent limiters and policy migrations must use key prefixes that are **disjoint after serialization**. |
| [`packages/service/tests/rate-limit_test.ts`](../packages/service/tests/rate-limit_test.ts) (lines 175, 209–212) | Existing tests assert exact deep equality `{ allowed: true, resetAt: 2000 }` and `{ allowed: false, resetAt: 5000 }` on fixed-window store decisions. | Fixed-window decisions MUST keep returning `{ allowed, resetAt }` without adding extra keys, preserving strict structural parity. |
| [`packages/contracts/src/domain/schemas.ts`](../packages/contracts/src/domain/schemas.ts) (lines 68–71, 110–113) | Common `RateLimitError` contract carries `{ retryAfter: number; limit: number }` with `retryAfter` integer `>= 1` seconds. | Exposing exact quota-denial and advisory fallback retry timing on `RateLimitDecision` lets direct procedure callers populate `RateLimitError.retryAfter` with the same formula as HTTP middleware. |

### Goals

1. Eliminate wall-clock boundary doubling for callers that opt into rolling quotas in either
   `createMemoryRateLimitStore` or `createKvRateLimitStore`.
2. Preserve 100% backwards compatibility for default fixed-window callers, existing custom
   `RateLimitStore` implementations, and existing `RateLimitDecision` assertions.
3. Guarantee an O(1) stored quota record per key (and O(1) per-key memory in the standalone
   `MemoryRateLimitStore`) for arbitrary positive safe integer `limit` and `windowMs`, keeping
   `MemoryRateLimitStore.maxKeys` and Deno KV/Redis value bounds intact.
4. Preserve single-key versionstamp CAS atomicity in shared KV with zero scans, zero writes on
   denial, and bounded retry budgets — making Redis guarantees explicitly conditional on confirmed
   `EXEC` outcomes ([#2648](https://github.com/rickylabs/netscript/issues/2648)).
5. Achieve deterministic bit-for-bit parity between memory and KV adapters under explicit coherent
   policy, confirmed-commit, and physical-retention preconditions, and linearizable non-over-admission
   under concurrent shared-KV callers.
6. Define clear semantics separating `resetAt` (full quota recovery), exact `retryAt` (quota
   exhaustion under unchanged state and policy), and advisory fallback `retryAt`/`resetAt` (CAS
   contention exhaustion and memory capacity saturation).

### Non-goals

- Changing the default policy of `createMemoryRateLimitStore`, `createKvRateLimitStore`, or
  `createRateLimitMiddleware` from fixed-window.
- Implementing per-credential dynamic monotonic poll pacing for OAuth device-grant flows (tracked
  separately in [#2365](https://github.com/rickylabs/netscript/issues/2365), where the upstream
  provider can dynamically increase the polling interval for the lifetime of a grant).
- Moving `.withRateLimit()` after `.withAuthn()`/`.withAuthz()` on `ServiceBuilder`, or adding
  procedure-level oRPC rate-limit middleware (a separate builder/auth pipeline concern).
- Modifying `packages/kv/` adapters in this RFC (Redis `EXEC` command-error confirmation is tracked
  separately in [#2648](https://github.com/rickylabs/netscript/issues/2648)).
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
rolling admission with an O(1) stored record per key:

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
implements the exact same admission transition in memory:

```ts
// Proposed API (not yet implemented)
import { createMemoryRateLimitStore } from '@netscript/service/rate-limit';

const store = createMemoryRateLimitStore({ policy: { kind: 'gcra' } });
```

With `limit: 2, windowMs: 60_000`, both `[100, 200, 300, 400]` and
`[59_850, 59_950, 60_050, 60_150]` produce `[true, true, false, false]`. A quota-exhausted denial at
`60_050` returns `retryAt: 89_850` (exact earliest next eligible instant: one refill interval
`windowMs / limit = 30_000` ms after the first arrival at `59_850`) and `resetAt: 119_850` (full
burst recovery). The middleware automatically emits `Retry-After: 30` (computed from `retryAt`),
rather than forcing the client to wait the full 60 seconds for the entire bucket to refill.

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
on quota exhaustion under unchanged state/policy, advisory backoff on contention or capacity
saturation):

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
| `packages/service/src/rate-limit/domain/gcra.ts` | `domain` | Pure GCRA state representation (`StoredGcraState`), exact `BigInt` rational transition `evaluateGcra()`, advisory contention/capacity fallback helpers, and KV state validation. Shared verbatim by both stores. |
| `packages/service/src/rate-limit/ports/rate-limit-store.ts` | `ports` | Unchanged `RateLimitStore` interface (JSDoc updated to cover both fixed-window and rolling policies). |
| `packages/service/src/rate-limit/adapters/memory-rate-limit-store.ts` | `adapters` | `MemoryRateLimitStoreOptions.policy?`; dispatches fixed-window (default) or GCRA using `evaluateGcra()`. |
| `packages/service/src/rate-limit/adapters/kv-rate-limit-store.ts` | `adapters` | `KvRateLimitStoreOptions.policy?` and `clockSkewMarginMs?`; dispatches fixed-window (default) or GCRA single-key CAS using `evaluateGcra()`. |
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
 * - `'fixed-window'`: epoch-aligned fixed windows (default).
 * - `'gcra'`: alignment-independent Generic Cell Rate Algorithm with an O(1)
 *   stored record per key; `burst` defaults to the request's `limit`.
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
   * - On a GCRA quota-exhaustion denial (unchanged stored state, coherent
   *   policy, and retained KV record), the exact earliest epoch millisecond at
   *   which one subsequent reservation succeeds.
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
   * Dedicated namespace; separate independent limiters with prefixes that are
   * disjoint after backend serialization.
   */
  readonly prefix: KvKey;
  /** Maximum read/CAS attempts per reservation. Default 8, maximum 32. */
  readonly maxAttempts?: number;
  /** Quota policy. Defaults to `{ kind: 'fixed-window' }`. */
  readonly policy?: RateLimitPolicy;
  /**
   * Extra physical KV TTL retention margin in milliseconds added to GCRA
   * writes (`expireIn = Math.max(1, resetAt - now) + clockSkewMarginMs`).
   * Logical expiry still uses `request.now`, so this never extends logical
   * quota; it prevents premature TTL eviction under peer clock skew or
   * backward clock steps smaller than the margin. Non-negative safe integer;
   * default `0`. Ignored by fixed-window mode (or rejected if non-zero in
   * fixed-window — see Unresolved questions).
   */
  readonly clockSkewMarginMs?: number;
}
```

In `packages/service/src/rate-limit/middleware/options.ts`, `ServiceRateLimitOptions.limit` and
`ServiceRateLimitOptions.windowMs` JSDoc must be updated from fixed-window-only wording to:

- `limit`: *"Quota budget per `windowMs` (maximum accepted requests per fixed window, or sustained rate numerator `limit / windowMs` and default burst for GCRA stores)."*
- `windowMs`: *"Quota window duration in milliseconds (epoch-aligned for fixed-window stores, or rate denominator `limit / windowMs` for GCRA stores)."*

Every new or updated symbol must carry explicit TypeScript annotations compatible with
`isolatedDeclarations`, zero `any` casts, and complete JSDoc with compiling `@example` fences per
[`docs/architecture/doctrine/02-public-surface.md`](../docs/architecture/doctrine/02-public-surface.md).

#### Policy, input, and overflow validation

1. At store construction:
   - `policy === undefined` normalizes to `{ kind: 'fixed-window' }`.
   - Any non-object `policy` or `policy.kind` outside `RATE_LIMIT_POLICY_KINDS` throws `TypeError`.
   - For `{ kind: 'gcra', burst }`, if `burst !== undefined`, `burst` must be a positive safe integer
     (`Number.isSafeInteger(burst) && burst >= 1`), else throws `RangeError`.
   - For `KvRateLimitStoreOptions.clockSkewMarginMs`, if provided, must be a non-negative safe
     integer (`Number.isSafeInteger(v) && v >= 0`), else throws `RangeError`.
2. At `consume(request)`:
   - Existing `limit`, `windowMs`, `now`, and `signal` checks apply identically across policies:
     `limit` and `windowMs` must be positive safe integers; `now` must be a non-negative safe
     integer; `request.signal?.throwIfAborted()` runs before state access and between KV attempts.
   - **Intentional safe-time overflow behavior** (evaluated in arbitrary-precision `BigInt` so
     intermediate products never lose precision):
     - Upfront check before state access: if `ceilDiv(N + W, L) > BigInt(Number.MAX_SAFE_INTEGER)`
       (meaning even one emission interval from `now` cannot produce a safe `resetAt`/`retryAt`),
       throw `RangeError('rateLimit window exceeds safe time')`.
     - Inside `evaluateGcra()`, **decide admission versus denial before checking tentative `newTat`
       for overflow**:
       - On a **quota-exhaustion denial**, only `ceilDiv(tat, L)` must fit in
         `Number.MAX_SAFE_INTEGER` (since `retryAt <= resetAt`). Thus at
         `now = Number.MAX_SAFE_INTEGER - 2` with `limit = windowMs = burst = 2`, the first two
         admissions succeed (`resetAt = MAX - 1` and `MAX`), and the third request **cleanly
         denies** with `{ allowed: false, resetAt: MAX, retryAt: MAX - 1 }` rather than throwing on
         the unused tentative `newTat = MAX + 1`.
       - On an **admission**, check `ceilDiv(newTat, L) <= BigInt(Number.MAX_SAFE_INTEGER)` (and
         for KV, `Math.max(1, resetAt - now) + clockSkewMarginMs <= Number.MAX_SAFE_INTEGER`) before
         committing; throw `RangeError('rateLimit window exceeds safe time')` if either overflows.
     - On a **memory `maxKeys` saturation fallback**, check
       `ceilDiv(N + B * W, L) <= BigInt(Number.MAX_SAFE_INTEGER)` before returning fallback
       `resetAt`, throwing `RangeError('rateLimit window exceeds safe time')` if it overflows.

### Compatible decision semantics (`resetAt` and `retryAt` / `Retry-After`)

In fixed-window quotas, full quota reset and next eligible instant coincide at `W_end`. Under GCRA
with `burst > 1`, they diverge on quota exhaustion. Furthermore, conservative denials caused by KV
CAS exhaustion or memory `maxKeys` saturation do **not** observe an authoritative future eligibility
instant — CAS exhaustion holds only a stale read under concurrent writes, and memory saturation
depends on when *other* keys expire and get reclaimed by the bounded 32-entry rotating scan.

Therefore, `RateLimitDecision` explicitly separates **exact timestamps** (quota exhaustion under
unchanged stored state, coherent policy, and retained KV state) from **advisory fallback
timestamps** (contention and capacity denials):

| Outcome | Timing class | Fixed-window (default) | GCRA (`policy: { kind: 'gcra', burst? }`) |
| --- | --- | --- | --- |
| `allowed: true` | Exact (under coherent policy & retention) | `{ allowed: true, resetAt: W_end }` (`retryAt` omitted) | `{ allowed: true, resetAt: ceil(newTat / L) }` (`retryAt` omitted) |
| `allowed: false` — quota exhausted | **Exact** (under unchanged state, coherent policy, retained record) | `{ allowed: false, resetAt: W_end }` (`retryAt` omitted) | `{ allowed: false, resetAt: ceil(tat / L), retryAt: ceil((tat - (B - 1) * W) / L) }` |
| `allowed: false` — KV CAS `maxAttempts` exhausted | **Advisory fallback** (stale observation under write contention; not an eligibility guarantee) | `{ allowed: false, resetAt: W_end }` (`retryAt` omitted) | `{ allowed: false, resetAt: Math.max(lastObservedResetAt, retryAt), retryAt: now + ceil(W / L) }` |
| `allowed: false` — memory `maxKeys` full on new key | **Advisory fallback** (depends on other keys' expiry and rotating eviction; not an eligibility guarantee) | `{ allowed: false, resetAt: W_end }` (`retryAt` omitted) | `{ allowed: false, resetAt: now + ceil(B * W / L), retryAt: now + ceil(W / L) }` |

Concrete saturation illustration: with `MemoryRateLimitStore({ maxKeys: 1, policy: { kind: 'gcra' } })`,
if key `"a"` occupies the single slot until `resetAt = 60_000`, a new key `"b"` arriving at `now = 1`
with `limit = 2, windowMs = 60_000` receives the advisory fallback
`{ allowed: false, retryAt: 30_001, resetAt: 60_001 }`. Because capacity remains occupied by `"a"`
until `60_000`, retrying `"b"` at `30_001` is still denied until `"a"` expires and is reclaimed.
`retryAt` in this branch is strictly an advisory backoff hint for `Retry-After`, not an admission
promise.

#### Normative decision invariants

Across all policies and all outcomes (except thrown validation, abort, corrupt-state, or I/O errors):

1. When `allowed === true`: `resetAt > request.now` and `retryAt === undefined`.
2. When `allowed === false`: `request.now < (retryAt ?? resetAt) <= resetAt`, and both values are
   safe integers.
3. Exact eligibility (`retryAt - 1` denies and `retryAt` admits) is guaranteed **only** for
   quota-exhaustion denials under unchanged stored state, coherent `(limit, windowMs, burst)`
   policy, and no physical KV expiry before `retryAt`. Contention (`maxAttempts`) and capacity
   (`maxKeys`) denials return the specified advisory fallback timestamps instead.
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

#### State representation (O(1) stored record per key)

Each active key stores one fixed five-field record representing its Theoretical Arrival Time (TAT) —
the exact instant when the leaky bucket becomes empty (full burst capacity restored) — as a rational
number `tatMs + tatRem / den` in epoch milliseconds:

```ts
/** Internal persisted state for one GCRA key (O(1) record, JSON- and V8-clone-safe). */
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

Why `{ v, p, tatMs, tatRem, den }` instead of floating-point milliseconds or `BigInt` persistence:

- **Zero floating-point drift**: Non-divisible ratios like `windowMs = 1_000, limit = 3`
  (`333.333... ms`) stay exact across arbitrary sequences with no accumulated rounding error.
- **Zero `BigInt` serialization overhead**: Plain safe integers serialize directly in both Deno KV
  structured clone and `RedisKvAdapter`'s plain-JSON fast path (`packages/kv/adapters/redis/codec.ts`,
  lines 58–60), bypassing the `bigints` metadata envelope.
- **Time-debt preservation across `limit` changes**: Storing `den` lets a caller with a different
  `limit` convert the stored wall-clock TAT conservatively (`ceilDiv(oldScaled * L, D)`, rounding
  upward by at most `1 / L` ms) instead of misinterpreting `tatRem` or throwing a schema error (see
  [Policy coherence and mixed-policy rollout semantics](#policy-coherence-and-mixed-policy-rollout-semantics)
  for exact multi-caller caveats).
- **O(1) stored record size**: The stored quota record always contains exactly five bounded fields
  independent of `limit` and `windowMs` (measured with `encodeStoredValue` in
  `packages/kv/adapters/redis/codec.ts` at 99 bytes for small timestamps up to 146 bytes with
  `MAX_SAFE_INTEGER` fields and a 26-character versionstamp — always O(1) in `limit` and orders of
  magnitude below Deno KV's 64 KiB value limit). Note that O(1) applies to the **stored quota
  record** and the **standalone `MemoryRateLimitStore`**; backing KV adapters have their own
  internal structures (for example, `MemoryKvAdapter` pushes one `expirationHeap` entry per expiring
  write and purges stale entries during its 1-second sweep per
  `packages/kv/adapters/memory.adapter.ts:519–522, 586–601`).

#### Pure transition function (exact `BigInt` arithmetic)

Let `L = BigInt(request.limit)`, `W = BigInt(request.windowMs)`,
`B = BigInt(policy.burst ?? request.limit)`, `N = BigInt(request.now) * L`,
`MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER)`, and `ceilDiv(a, b) = (a + b - 1n) / b` for positive
`a, b`.

In scaled units (where `1 ms = L` units), the emission interval `W / L` ms is exactly `W` units,
the delay variation tolerance `(B - 1) * (W / L)` ms is `(B - 1) * W` units, and the full burst
budget `B * (W / L)` ms is `B * W` units:

1. **Upfront safe-time check**:
   - If `ceilDiv(N + W, L) > MAX_SAFE`, throw `RangeError('rateLimit window exceeds safe time')`.
2. **Resolve current `tat`**:
   - If no stored state exists: `tat = N`.
   - Else validate `stored`: non-null object with `v === 1`, `p === 'gcra'`, safe integers
     `tatMs >= 0`, `den >= 1`, `0 <= tatRem < den`; throw
     `TypeError('Invalid rate-limit state in KV')` on failure.
   - Compute `oldScaled = BigInt(stored.tatMs) * D + BigInt(stored.tatRem)` where `D = BigInt(stored.den)`.
   - Rescale to `L`: `rescaled = D === L ? oldScaled : ceilDiv(oldScaled * L, D)`.
   - `tat = rescaled > N ? rescaled : N` (if `rescaled <= N`, the key is idle / fully recovered).
3. **Evaluate admission vs denial before checking `newTat` overflow**:
   - `newTat = tat + W`.
   - **Quota-exhaustion denial** when `newTat - N > B * W`:
     - Because `tat <= N` implies `newTat - N === W <= B * W` (for `B >= 1`), denial guarantees
       `tat > N` and `allowAtScaled = tat - (B - 1n) * W >= N + 1n`.
     - `resetAtBig = ceilDiv(tat, L)`. If `resetAtBig > MAX_SAFE`, throw
       `RangeError('rateLimit window exceeds safe time')`.
     - `retryAt = Number(ceilDiv(allowAtScaled, L))` (strictly `> request.now` and `<= resetAt`).
     - `resetAt = Number(resetAtBig)`.
     - Return `{ allowed: false, resetAt, retryAt }` with **no state mutation and no KV write**.
   - **Admission** when `newTat - N <= B * W`:
     - `resetAtBig = ceilDiv(newTat, L)`. If `resetAtBig > MAX_SAFE`, throw
       `RangeError('rateLimit window exceeds safe time')`.
     - `resetAt = Number(resetAtBig)` (strictly `> request.now` since `W >= 1`).
     - `nextState = { v: 1, p: 'gcra', tatMs: Number(newTat / L), tatRem: Number(newTat % L), den: request.limit }`.
     - Return `{ allowed: true, resetAt }` and persist `nextState` (in KV, with
       `expireIn = Math.max(1, resetAt - request.now) + clockSkewMarginMs`, throwing `RangeError` if
       `expireIn > Number.MAX_SAFE_INTEGER`).

#### Exact millisecond eligibility property (quota denial)

When GCRA denies a request due to **quota exhaustion**, assuming unchanged stored state, a coherent
`(limit, windowMs, burst)` policy, and that physical KV TTL does not discard the record before
`retryAt`:

- At `now' = retryAt - 1`, `N' = (retryAt - 1) * L < allowAtScaled`, so `tat + W - N' > B * W` and
  a retry is still **denied**.
- At `now' = retryAt`, `N' = retryAt * L >= allowAtScaled`, so `max(tat, N') + W - N' <= B * W` and
  a retry is **admitted**.

#### Admission envelope (coherent-policy specification)

GCRA is a **leaky-bucket / token-bucket rolling rate limiter**, not a strict sliding-window count.
When **all callers sharing a key use a coherent policy `(limit, windowMs, burst)`** and live KV
records are retained until `resetAt`:

- **Shift-invariant**: Shifting every arrival timestamp by any constant `c` produces identical
  `allowed` results and shifts `resetAt`/`retryAt` by exactly `c`. Both issue #2653 alignment
  sequences (`[100, 200, 300, 400]` and `[59_850, 59_950, 60_050, 60_150]` at `limit: 2, windowMs: 60_000`)
  return `[true, true, false, false]`.
- **Single-timestamp burst bound (`Δt = 0`)**: At most `burst` (default `limit`) requests are ever
  admitted at any single timestamp `now`, regardless of clock alignment. Epoch-boundary doubling
  (`2 * limit` across a minute boundary) is eliminated.
- **Short-interval and sustained rate envelope (`Δt >= 0`)**: Over any closed interval
  `[t, t + Δt]` of length `Δt` ms, at most `burst + floor(Δt * limit / windowMs)` requests are
  admitted. Whenever `Δt < windowMs / limit` (i.e., `floor(Δt * limit / windowMs) === 0`), this
  equals `burst`. When `windowMs < limit` (sub-millisecond refill, e.g., `limit: 1_000, windowMs: 100, burst: 2`),
  distinct timestamps even 1 ms apart admit up to `burst + floor(Δt * limit / windowMs)` (for
  example, 2 at `t = 0` and 2 at `t = 1`, totaling 4 across 1 ms) — matching the rate envelope rather
  than capping distinct timestamps at `burst`.
- **Single-window difference vs strict sliding log**: Starting from idle with `burst = limit`, a
  caller can send `limit` requests at `t` plus `limit - 1` paced requests spaced by `windowMs / limit`
  inside one half-open interval `[t, t + windowMs)` (up to `limit + burst - 1 = 2 * limit - 1`
  total, e.g., `[59_850, 59_950, 89_850]` admits 3 requests for `limit: 2, windowMs: 60_000`).
  Unlike fixed windows or weighted two-window counters, those extra `limit - 1` requests are paced
  at `limit / windowMs` rather than arriving in a second boundary burst. See
  [Rationale and alternatives](#rationale-and-alternatives) and
  [Unresolved questions](#unresolved-questions).

#### Policy coherence and mixed-policy rollout semantics

- **Normative coherent-policy requirement**: The admission envelope, shared burst ceiling, and exact
  `retryAt` guarantees above hold **only when every caller sharing a key enforces the same
  `(limit, windowMs, burst)` tuple**.
- **Strict rollout isolation (recommended)**: Operators changing `limit`, `windowMs`, or `burst` who
  need strict adherence to the new policy's envelope during a rolling deploy MUST **change the key
  scope** (use a new KV `prefix` that is disjoint after serialization). Changing `windowMs` already
  selects a distinct key because `windowMs` is part of the key tuple.
- **Mixed-policy time-debt carryover (when old and new `(limit, burst)` share a key)**: If a rolling
  deployment intentionally keeps the same KV `prefix` and `windowMs` while changing `limit` and/or
  `burst`, the shared record carries one wall-clock **time debt** `tat` (rounded upward by at most
  `1 / L` ms when `den !== limit`), and **each caller evaluates admission and increments `tat` using
  its own `(limit, windowMs, burst)`**:
  - *Burst decrease* (`B_new * T_new < B_old * T_old`): A new-policy caller inherits existing `tat`
    time debt and denies until `tat - now <= (B_new - 1) * T_new`. For example, if an old replica
    (`limit: 10, windowMs: 10_000, burst: 10`) admits 10 requests at `now = 0` (`tat = 10_000`), a
    new replica (`limit: 10, windowMs: 10_000, burst: 2`) at `now = 1_000` denies with
    `retryAt = 9_000, resetAt = 10_000`. Meanwhile, a still-live old replica at `now = 1_000` can
    still admit (pushing `tat = 11_000`) and lengthen the new replica's wait.
  - *Burst or rate increase* (`B_new * T_new > B_old * T_old`): A new-policy caller can admit
    earlier against existing `tat` than an old-policy replica would.
  - *Convergence*: Once every replica runs the new coherent policy, the new policy's stated envelope
    holds cleanly after existing `tat` drains (`now >= resetAt`).

### Storage bounds and memory eviction (`MemoryRateLimitStore`)

- Each key in `Map<string, MemoryGcraEntry>` stores `{ tatMs, tatRem, den, resetAt }` (four safe
  numbers — **O(1) per key** and **O(`maxKeys`) total** in the standalone memory store, matching
  fixed-window's `{ count, resetAt }`).
- Map key stays `JSON.stringify([request.key, request.windowMs])`, isolating different window
  durations on the same store instance just like fixed-window.
- Rotating eviction remains identical (`memory-rate-limit-store.ts:44–51`): on every `consume()`,
  inspect at most 32 entries from the front of the `Map` and delete entries where
  `entry.resetAt <= request.now`. Because `entry.resetAt === ceil(tat / den)`, any entry with
  `entry.resetAt <= request.now` is already 100% idle (`tat <= request.now * den`), so deletion is
  **lossless**.
- Live entries (`entry.resetAt > request.now`) are never evicted to admit new keys.
- When a new key arrives and `entries.size >= maxKeys`, the store rejects conservatively without
  mutating the map and returns the **advisory fallback**
  `{ allowed: false, resetAt: now + ceil(B * W / L), retryAt: now + ceil(W / L) }` (overflow-checked
  against `Number.MAX_SAFE_INTEGER`).
- Zero timers and zero shutdown lifecycle required.

### Shared KV key layout, atomicity, and contention (`KvRateLimitStore`)

- **Key tuple and serialization-disjoint prefixes**:
  - GCRA key tuple: `[...prefix, 'v1', 'gcra', request.key, request.windowMs]`.
  - On `DenoKvAdapter` and `MemoryKvAdapter`, typed tuple segments separate key arities.
  - **On `RedisKvAdapter`, tuple arity alone cannot isolate keys** because `keyToRedisKey`
    concatenates every `KvKey` part with unescaped `:` (`packages/kv/adapters/redis/serialization.ts:37–46`;
    also noted in `packages/kv/README.md:109–113`). Independent limiters, fixed-window vs GCRA
    migrations, and isolated policy rollouts MUST therefore use **prefixes that are disjoint after
    serialization** (for example, distinct leading segments `['reads-fixed']` vs `['reads-gcra']`
    where neither serialized prefix is a prefix of the other).
- **Atomic primitives and TTL retention**:
  - Uses only `kv.get(key)` and single-key
    `kv.atomic([{ key, versionstamp: entry?.versionstamp ?? null }], [{ type: 'set', key, value: nextState, expireIn }])`.
  - Zero `kv.list()` scans; zero `getMany()` multi-key reads; zero multi-key transactions.
  - `expireIn = Math.max(1, resetAt - request.now) + clockSkewMarginMs` (default
    `clockSkewMarginMs = 0`). Because every admitted reservation satisfies `newTat - N <= B * W`,
    `1 <= resetAt - request.now <= ceil(B * W / L)` (at most `windowMs` when `burst === limit`), so
    `expireIn` is always a positive safe integer `>= 1` (avoiding the falsy `expireIn: 0`
    permanent-key trap in `RedisKvAdapter` at `packages/kv/adapters/redis.adapter.ts:425` and
    `MemoryKvAdapter` at `packages/kv/adapters/memory.adapter.ts:513`, and satisfying Deno KV's
    positive TTL requirement).
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
    `{ allowed: false, resetAt: Math.max(lastObservedResetAt, retryAt), retryAt: now + Math.ceil(windowMs / limit) }`.
    It never admits a request without a confirmed atomic commit.
  - Storage I/O errors, unconfirmed-commit errors (`#2648`), and corrupt stored values (`TypeError`)
    propagate to the caller/error handler and never fail open.
- **Cardinality note**: As with fixed-window KV counters, TTL bounds each key's lifetime rather
  than total live key count across distinct keys; backend capacity controls and bounded/canonical
  keys remain the operator's responsibility.

### Memory and KV parity

Because both `createMemoryRateLimitStore` and `createKvRateLimitStore` invoke the exact same pure
domain function `evaluateGcra()` over exact `BigInt` rational math, parity and shared concurrency
guarantees hold under three explicit preconditions:

1. **Coherent policy**: all callers sharing a key use identical `(limit, windowMs, burst)`.
2. **Confirmed atomic writes**: `KvStore.atomic()` returns `{ ok: true }` only when the write
   actually committed without command error (holds on `main` for `MemoryKvAdapter` and
   `DenoKvAdapter`; requires [#2648](https://github.com/rickylabs/netscript/issues/2648) for
   `RedisKvAdapter`).
3. **Physical retention**: the KV backend does not physically expire a key while any reader still
   queries it with `request.now < resetAt` (see
   [Clock assumptions, retention, and edge cases](#clock-assumptions-retention-and-edge-cases)).

Under those preconditions:

- Sequential or deterministic-clock workloads without capacity saturation or CAS exhaustion produce
  identical `{ allowed, resetAt, retryAt? }` values across `MemoryRateLimitStore`,
  `KvRateLimitStore(MemoryKvAdapter)`, `KvRateLimitStore(DenoKvAdapter)`, and (post-`#2648`)
  `KvRateLimitStore(RedisKvAdapter)`.
- Concurrent shared-KV reservations at the same timestamp `now` against a shared key admit at most
  `burst` requests (with conservative advisory rejection if `maxAttempts` exhausts under extreme
  contention).

### Clock assumptions, retention, and edge cases

1. **Epoch-millisecond clock**: `RateLimitRequest.now` remains wall-clock epoch milliseconds (from
   `options.now ?? Date.now`), required because distributed replicas sharing KV do not share a
   monotonic `performance.now()` epoch and callers expect epoch-ms `resetAt`/`retryAt`.
2. **When physical KV TTL expiry can discard live quota**:
   - Logical expiry checks `tat <= request.now * L` against the caller's `request.now`.
   - Physical KV expiry deletes the key at `backendWriteTime + expireIn` against the KV backend's
     own clock.
   - **Concrete failure mode without a retention margin**: With `limit = windowMs = 60_000`,
     `burst = 1`, and `clockSkewMarginMs = 0`, an admission at `now = 100` writes `tat = 101` with
     `expireIn = 1` ms. After 1 ms of backend wall time, the backend physically deletes the key; a
     peer whose clock is 1 ms behind (still reporting `now = 100`) reads `null` and treats the
     bucket as fresh, admitting a second request at `now = 100`! The same early loss occurs after a
     single-host backward NTP step or a slow injected-clock test pause exceeding `expireIn`.
   - **Retention precondition and `clockSkewMarginMs` mitigation**:
     - With `clockSkewMarginMs = 0` (default), conservative behavior under clock skew and backward
       steps holds **only while the record remains physically present** (`backendElapsed < resetAt - writerNow`).
     - To prevent premature expiry across replicas with maximum peer skew plus write-to-read transit
       delay `Δ_max` (or backward NTP steps up to `Δ_max`), configure `clockSkewMarginMs > Δ_max`.
       Because logical idle expiry still compares `tat` against `request.now`, extra physical
       retention **never extends logical quota** (`resetAt` and `retryAt` are unchanged), while
       ensuring lagging peers still observe the stored TAT.
3. **Multi-host clock skew (given physical retention)**:
   - Replicas sharing a KV prefix require NTP-synchronized clocks (`Δ << windowMs`, matching
     [`packages/service/README.md`](../packages/service/README.md), line 799) plus sufficient
     physical retention (`clockSkewMarginMs > Δ_max` when emission intervals can be smaller than
     `Δ_max`).
   - Unlike fixed-window or weighted two-window counters, GCRA has no shared epoch boundary where
     skew splits keys across adjacent windows. While the record is retained, `base = max(tat, now * L)`
     ensures an ahead-of-time replica advances `tat` by at most `Δ` (making behind-time peers
     conservatively stricter) and a behind-time replica never moves `tat` backwards.
4. **Single-host backward clock step (given physical retention)**:
   - In `MemoryRateLimitStore`, live entries keep `entry.resetAt > request.now` (never evicted) and
     `tat` stays monotonic (`base = tat`), causing conservative rejection until `now` catches up.
   - In `KvRateLimitStore`, the same holds while the entry remains physically retained (guaranteed
     for backward steps `< clockSkewMarginMs` even when `resetAt - writerNow` is small).
5. **Injected test clock vs backend TTL clock**:
   - KV adapters interpret `expireIn` against the backend's own clock (`Date.now() + expireIn` in
     `MemoryKvAdapter`; server clock in Deno KV and Redis).
   - Fast-forwarding an injected `request.now` past `resetAt` works deterministically even while
     the KV entry is still physically present, because `evaluateGcra()` treats `tat <= request.now * L`
     as logically idle.
   - Conversely, deterministic injected-clock and same-timestamp concurrency fixtures MUST prevent
     accidental physical TTL expiry mid-test (by using a sufficiently large `windowMs` or
     `clockSkewMarginMs`, or controlling the backend expiry clock independently).
6. **Sub-millisecond emission intervals (`windowMs < limit`)**:
   - Because arithmetic scales by `L`, `limit: 1_000, windowMs: 100` works without division by zero,
     enforcing `<= burst` at a single timestamp and `<= burst + floor(Δt * limit / windowMs)` across
     short intervals `Δt`, with `resetAt >= now + 1` and `retryAt >= now + 1`.

### Implementation gating test plan

Any implementation PR following acceptance of this RFC MUST pass all of the following test suites
(plus existing tests unmodified):

| Gate / Test group | Required assertions | Backends covered |
| --- | --- | --- |
| 1. Issue #2653 deterministic alignment parity | Both `[100, 200, 300, 400]` and `[59_850, 59_950, 60_050, 60_150]` with `limit: 2, windowMs: 60_000` return `[true, true, false, false]`; exact quota-denial `resetAt` (`60_100` / `119_850`) and `retryAt` (`30_100` / `89_850`); `retryAt - 1` denied and `retryAt` admitted. | `MemoryRateLimitStore`, `KvRateLimitStore(MemoryKvAdapter)`, `KvRateLimitStore(DenoKvAdapter)` |
| 2. Exact rational & short-interval envelope | Non-divisible `limit: 3, windowMs: 1_000` (exact `334` ms eligibility, no drift over 100+ ticks); sub-ms `limit: 1_000, windowMs: 100, burst: 2` (2 admitted at `t = 0`, 3rd denied with `retryAt = 1`, 2 more admitted at `t = 1`, proving single-timestamp vs short-interval envelope); high `limit: 100_000, windowMs: 3_600_000` (proving O(1) stored record with no limit cliff). | Pure domain unit test + Memory + KV |
| 3. Explicit `burst` behavior | Default `burst = limit`; `burst: 1` strict spacing; `burst < limit`; invalid `burst` (`0`, `-1`, `0.5`, `NaN`, `Infinity`) throws `RangeError` at construction. If `burst > limit` is retained after RFC decision, also test `limit: 1, windowMs: 1_000, burst: 5` (5 admitted at `now = 0`, 6th denied with exact `retryAt: 1_000, resetAt: 5_000`, `expireIn: 5_000`). | Memory + KV |
| 4. Shared KV concurrency (physical-expiry-free) | 30 concurrent `Promise.all` reservations at identical `now` against `limit: 5, windowMs: 60_000` (large `windowMs` or controlled non-expiring backend clock so physical TTL cannot fire mid-fixture) admit `0 < admitted <= 5` (never `> 5`); subsequent sequential calls at the same `now` fill exactly the remaining `5 - admitted` slots; next call denied with exact `retryAt`; `kv.list` throws if ever invoked. | `MemoryRateLimitStore`, `KvRateLimitStore(MemoryKvAdapter)`, `KvRateLimitStore(DenoKvAdapter)` |
| 5a. KV CAS exhaustion (advisory), write-free denial & TTL | Forced `{ ok: false }` on `kv.atomic` stops after `maxAttempts` reads/commits and returns **advisory fallback** `{ allowed: false, retryAt: now + ceil(W/L), resetAt: Math.max(lastObservedResetAt, retryAt) }` (asserted separately from exact quota denial); quota-exhausted denial performs `0` `kv.atomic` writes; `expireIn >= 1` on every write; real-clock TTL eviction removes expired KV key; two store instances sharing one `kv` and serialized-disjoint `prefix` enforce one shared rolling quota. | `KvRateLimitStore(MemoryKvAdapter)` + mock wrapper |
| 5b. Redis confirmed-write & two-client concurrency (prerequisite: [#2648](https://github.com/rickylabs/netscript/issues/2648)) | (a) Command error inside Redis `MULTI`/`EXEC` throws and NEVER returns `{ allowed: true }`. (b) Conflicting concurrent reservations across **two separate `RedisKvAdapter` clients** (not sharing `atomicTail`) against the same key never admit `> burst` at one timestamp. (c) Prefixes that are disjoint after Redis `:` serialization isolate independent limiters even with colon-bearing keys. | `KvRateLimitStore(RedisKvAdapter)` (inert transport for EXEC error + two-client Redis/Garnet fixture when Redis is in implementation scope) |
| 6a. Split backend-clock & request-clock expiry boundary | Independently controlled backend expiry clock and caller `request.now` with `limit = windowMs = 60_000, burst = 1`, admitted at `now = 100` (`tat = 101`): (a) with `clockSkewMarginMs: 0`, peer at `now = 100` is denied before backend +1 ms expiry and sees a fresh bucket after backend +1 ms expiry; (b) with `clockSkewMarginMs: 5_000`, after backend +1 ms (still `< 5_001 ms`), peer at `now = 100` still reads TAT and is denied, while caller at `now = 101` treats the retained record as logically idle and is admitted; after backend advances past `5_001 ms`, key is physically evicted. | `KvRateLimitStore` over clock-controlled KV test wrapper |
| 6b. Overflow oracle & mixed-policy rollout | **Overflow oracle**: `now = Number.MAX_SAFE_INTEGER - 2, limit = windowMs = burst = 2` → Req 1 admits (`resetAt = MAX - 1`), Req 2 admits (`resetAt = MAX`), Req 3 denies cleanly (`allowed: false, resetAt = MAX, retryAt = MAX - 1`, no throw); `now = Number.MAX_SAFE_INTEGER` throws `RangeError`. **Mixed-policy rollout**: interleaved old/new `(limit, burst)` sharing a key, including a **burst decrease** (`limit = 10, windowMs = 10_000`: old `burst = 10` admits 10 at `0` → `tat = 10_000`; new `burst = 2` at `1_000` denies with `retryAt = 9_000, resetAt = 10_000`; interleaved old `burst = 10` at `1_000` admits to `tat = 11_000`), plus `den` rescaling on `limit` change and convergence once coherent. **Backward clock step** under retained state never over-admits. | Pure domain + Memory + KV |
| 7. Memory `maxKeys` saturation (advisory) & rotating eviction | With `maxKeys: 1`, key `"a"` admitted to `resetAt = 60_000`, new key `"b"` at `now = 1` (`limit: 2, windowMs: 60_000`) returns **advisory fallback** `{ allowed: false, retryAt: 30_001, resetAt: 60_001 }` without evicting `"a"`, and retrying `"b"` at `now = 30_001` is STILL denied while `"a"` remains live; once `now = 60_000`, rotating eviction reclaims `"a"` and admits `"b"`. | `MemoryRateLimitStore` |
| 8. Corrupt state & cancellation | Malformed KV values (bare number, missing tag, `tatRem >= den`, negative `tatMs`) throw `TypeError`; invalid `clockSkewMarginMs` (`-1`, `0.5`, `NaN`) throws `RangeError`; aborted `AbortSignal` rejects before IO and between CAS attempts without admitting. | Memory + KV |
| 9. Middleware `Retry-After` integration | Rolling quota denial sets whole-second `Retry-After` from `decision.retryAt` (rounded up at response-time `now()`); fixed-window and custom stores without `retryAt` fall back to `decision.resetAt`; CORS headers wrap `429`; unselected routes perform zero store IO. | `createService().withRateLimit()` + `createRateLimitMiddleware()` |
| 10. Default compatibility regression | Existing `packages/service/tests/rate-limit_test.ts` and `rate-limit-address-key_test.ts` pass unmodified, including exact deep equality `{ allowed: false, resetAt: 5000 }` on default fixed-window stores. | Existing test suite |
| 11. Static, docs, quality, publish gates | Scoped `run-deno-check.ts`, `run-deno-lint.ts`, `run-deno-fmt.ts`, `deno task doc:lint --root packages/service`, `deno task docs:jsdoc-examples`, `deno task quality:gate`, and `deno publish --dry-run --allow-dirty` in `packages/service` all exit `0`. | Repository tooling |

## Drawbacks

1. **Not a strict sliding-window count**: With default `burst = limit`, GCRA admits up to
   `2 * limit - 1` requests across one half-open rolling `windowMs` starting from idle (`limit` at
   `t` plus `limit - 1` paced at `windowMs / limit`). Callers expecting a strict
   `count(now - windowMs, now] <= limit` invariant (for example, strict upstream billing contracts
   where `[59_850, 59_950, 89_850]` must reject the third request at `89_850`) must either set
   `burst: 1` (sacrificing burstiness) or wait for a future capped sliding-log policy.
2. **Additional field and exact-vs-advisory distinction on `RateLimitDecision`**: Direct
   `store.consume()` callers adopting rolling policies should read `decision.retryAt ?? decision.resetAt`
   for optimal retry timing and understand that contention/capacity denials return advisory backoff
   rather than exact eligibility.
3. **Slightly larger stored record and retention trade-off**: A GCRA KV entry stores a fixed
   five-field safe-integer object instead of fixed-window's bare integer, and enabling
   `clockSkewMarginMs > 0` retains idle keys in KV slightly past `resetAt` to defend against early
   TTL loss under peer clock skew.
4. **Redis prerequisite and prefix discipline**: Shared-KV commit guarantees on `RedisKvAdapter`
   depend on [#2648](https://github.com/rickylabs/netscript/issues/2648), and Redis's unescaped `:`
   key serialization requires operators to choose prefixes that are disjoint after serialization.
5. **Hot-key CAS ceiling remains**: As in fixed-window, `KvStore.atomic()` uses optimistic CAS
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
| **Max in any half-open rolling `[t, t + windowMs)`** | **`limit` (1.0× exact)** | Up to **`2 * limit - 1`** under `est + 1 <= limit` (e.g., `L = 10, W = 1_000`: 10 at `999` + 9 at `1_900` = **19** in 901 ms!) or **`2 * limit`** under `est < limit` (10 at `999` + 10 at `1_901` = **20** in 902 ms!), **plus** false denials (Sequence D) | **`limit + burst - 1`** (`2 * limit - 1` at `burst = limit`, paced at `W / L`; `limit` at `burst = 1`) under coherent policy | **`2 * limit`** (2× instantaneous boundary spike) |
| **Max burst (single timestamp `Δt = 0` / short interval `Δt`)** | `limit` at `Δt = 0` and for any `Δt < windowMs` (shift-invariant) | `limit` or `limit + 1` at a boundary; up to `limit - 1` (or `limit`) in a single ms late in the next window while prior burst is still `< windowMs` old | **`burst`** at a single timestamp (`Δt = 0`, shift-invariant); over short interval `Δt`, up to **`burst + floor(Δt * limit / windowMs)`** (sub-ms refill can exceed `burst` across distinct timestamps) | **`2 * limit`** across a 2 ms epoch boundary |
| **Storage bound per key** | **O(limit)** stored timestamps per key. Hits Deno KV's 64 KiB value limit around a few thousand entries; amplifies Redis JSON payloads proportionally to `limit` per read/write and breaks `MemoryRateLimitStore.maxKeys` RAM cap (`10_000 × 1_000` numbers) unless a hard `maxLimit` cap (e.g., `<= 256` or `<= 1_000`) and total-entry cap are imposed. | **O(1)** stored record — two counters + window id (1 packed key or 2 epoch keys). | **O(1) stored quota record** (fixed five-field safe-integer object, independent of `limit` and `windowMs`) and **O(1) per-key memory in standalone `MemoryRateLimitStore`**. Zero `maxLimit` cliff. (Adapter internals such as `MemoryKvAdapter`'s `expirationHeap` retain their own sweep behavior.) | **O(1)** stored fixed-window counter + external cache/coalescing state elsewhere. |
| **KV atomicity & contention** | Single-key `kv.get` + `kv.atomic([check], [set])` if stored as one array, **but** O(limit) read/decode/encode/write widens the CAS conflict window under concurrency. Multi-key per-timestamp storage would require `kv.list()` scans (forbidden) or multi-key atomic limits. | Two-key layout requires `getMany(2)` + 2-key `AtomicCheck` (contention across window boundary and optional `getMany` fallback). Packed 1-key layout uses 1 `get` + 1-key CAS with `expireIn: 2 * windowMs`. | Single-key `kv.get` + `kv.atomic([{ key, versionstamp }], [{ type: 'set', key, value, expireIn }])`. Constant small record minimizes CAS window; zero scans; zero writes on deny; bounded `maxAttempts` (`1..32`). Redis commit confirmation conditional on [#2648](https://github.com/rickylabs/netscript/issues/2648); Redis prefixes must be disjoint after serialization. | Unchanged single-key `kv.get` + `kv.atomic` on the epoch-aligned window key (same `#2648` Redis caveat). |
| **Memory / KV parity** | Exact parity possible **within `maxLimit`**, given coherent policy, confirmed commits, and physical retention. | Exact parity possible with integer cross-multiplication **if** both use identical packed 2-window state and physical retention; two-key KV can diverge if `prev` expires early. | **Exact bit-for-bit parity** via shared pure `evaluateGcra()` across memory, `MemoryKvAdapter`, `DenoKvAdapter`, and (post-`#2648`) `RedisKvAdapter` under coherent policy and physical retention. | Unchanged fixed-window parity; duplicate-read reduction lives outside the store. |
| **Clock assumptions** | Epoch ms across hosts; skewed hosts can insert out-of-order timestamps (requires sorted insert); physical TTL needs retention margin for skewed peers; backward jump keeps retained entries conservative. | Epoch ms across hosts; still anchored to epoch boundaries so inter-host skew near `W` splits keys and distorts `w = (W + windowMs - now) / windowMs`. | Epoch ms across hosts; **no epoch boundaries to disagree on**; while physically retained (protected by optional `clockSkewMarginMs` when `Δ_max >= resetAt - now`), `tat` is monotonically non-decreasing (`base = max(tat, now * L)`), so skew and backward steps fail conservative. | Epoch ms across hosts; skew near epoch boundary widens 2× leakage window. |
| **Default compatibility** | Additive opt-in policy, **except** arbitrary `limit` values accepted by `RateLimitRequest` would fail at runtime with `RangeError` above `maxLimit` unless `RateLimitStore` exposes a cap. | Additive opt-in policy; `Retry-After` is awkward when `c_curr >= limit` (even after `W_end`, `c_curr` becomes `c_prev` so `est + 1 <= limit` still denies at `W_end`). | **100% additive opt-in**; fixed-window defaults untouched; every valid `(limit, windowMs)` works without hidden store caps; `retryAt ?? resetAt` is backward-compatible with exact vs advisory distinction. | 100% compatible; zero changes to `@netscript/service/rate-limit`. |

### Why GCRA is recommended

1. **General-purpose O(1) stored record without a `limit` cliff**: `@netscript/service/rate-limit`
   is a general framework store whose contract (`RateLimitRequest`) accepts any positive safe
   integer `limit` and `windowMs`. A sliding-window log cannot serve common hourly or daily quotas
   (such as `limit: 5_000, windowMs: 3_600_000`) within Deno KV's 64 KiB value cap or
   `MemoryRateLimitStore`'s `maxKeys` memory bound, and it cannot validate its `limit` cap at
   middleware construction time without leaking store-specific limits onto `RateLimitStore`. GCRA
   keeps the stored quota record and standalone memory-store entry O(1) across the full
   `1..Number.MAX_SAFE_INTEGER` domain.
2. **Eliminates clock-boundary sensitivity and cliff retries**: Under a coherent policy, GCRA is
   100% shift-invariant, passes both issue #2653 alignment sequences identically, eliminates 2×
   boundary spikes, and releases capacity smoothly at one slot per `windowMs / limit` instead of
   creating synchronized thundering-herd retries at `oldest + windowMs`.
3. **Minimal CAS footprint in shared KV**: One small read and one single-key versionstamp CAS keeps
   serialization and round-trip cost comparable to fixed windows on `DenoKvAdapter` and (once
   `#2648` lands) `RedisKvAdapter`, with no `kv.list()` scans and no multi-key coordination.
4. **Cleanly rejects approximate two-window counters**: Weighted two-window counters fail in both
   directions — under `est < limit` they over-admit on issue #2653's boundary sequence
   (`[true, true, true, false]`) and reach `2 * limit` inside one rolling window (e.g., 10 at `999`
   + 10 at `1_901` = 20 for `limit = 10, windowMs = 1_000`), while under `est + 1 <= limit` they
   still reach `2 * limit - 1` inside one rolling window with a sudden burst of `limit - 1` (10 at
   `999` + 9 at `1_900` = 19 in 901 ms) AND **falsely reject** legitimate requests arriving more
   than `windowMs` after an early-window burst (Sequence D), with awkward `Retry-After` math when
   `c_curr >= limit`.
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
  1. Choose a **new KV `prefix` that is disjoint after serialization** (especially on
     `RedisKvAdapter`, where `keyToRedisKey` joins unescaped `:` segments) when switching a deployed
     limiter from fixed-window to `policy: { kind: 'gcra' }`, or when changing `(limit, windowMs, burst)`
     without wanting mixed-policy time-debt overlap during rollout.
  2. Pass `policy: { kind: 'gcra' }` (or `{ kind: 'gcra', burst }`) to `createMemoryRateLimitStore`
     or `createKvRateLimitStore`, and set `clockSkewMarginMs` on `createKvRateLimitStore` if
     deployment clock skew can exceed the minimum emission interval `windowMs / limit`.
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
   rolling policy be GCRA (O(1) stored record per key, arbitrary safe-integer `limit`,
   shift-invariant single-timestamp burst `<= burst`, up to `2 * limit - 1` paced requests in one
   half-open `windowMs` from idle), or do protected service reads require a strict `<= limit` count
   in every rolling `windowMs` interval even if that requires O(limit) per-key storage and a hard
   `maxLimit` cap (e.g., `<= 256` or `<= 1_000`)?
2. **`RateLimitDecision` retry timing surface**: Should `RateLimitDecision` add optional
   `retryAt?: number` (exact on quota exhaustion, advisory on contention/capacity) while keeping
   `resetAt` as full quota recovery (recommended), or redefine `resetAt` to mean "next eligible
   instant / backoff when `allowed === false`" (zero new fields, but non-monotonic allow-vs-deny
   meaning)?
3. **`burst` knob scope in v1**: Should `{ kind: 'gcra', burst?: number }` include optional `burst`
   in the first implementation — and if so, should `burst > limit` be allowed (general token bucket:
   rate `limit / windowMs`, capacity `burst`) or constrained to `1 <= burst <= limit` — or should v1
   fix `burst = limit` and defer explicit `burst`?
4. **Policy option ergonomics**: Is the discriminated union `{ kind: 'fixed-window' } | { kind: 'gcra'; burst?: number }`
   preferred as the single canonical shape, or should string shorthand (`'fixed-window' | 'gcra'`)
   also be accepted?
5. **Policy-change key scoping vs shared time-debt carryover**: Should GCRA keys omit `limit`/`burst`
   (`[...prefix, 'v1', 'gcra', request.key, request.windowMs]`) and store `den` for time-debt
   carryover across deploys (with strict isolation obtained by changing prefix, recommended), or
   include `limit` (and `burst`) in the key so policy changes always start fresh buckets?
6. **Conservative advisory `retryAt` under memory `maxKeys` saturation**: Should both KV CAS
   exhaustion and memory `maxKeys` saturation report advisory `retryAt = now + Math.ceil(windowMs / limit)`,
   or should memory `maxKeys` saturation report advisory `retryAt = now + windowMs`?
7. **`KvRateLimitStoreOptions.clockSkewMarginMs` default and scope**: Should `clockSkewMarginMs`
   default to `0` (matching fixed-window TTL with explicit opt-in skew margin, recommended) or a
   small non-zero default (such as `1_000` ms)? And should setting a non-zero `clockSkewMarginMs`
   with `{ kind: 'fixed-window' }` throw `RangeError` or also extend fixed-window TTL?

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
