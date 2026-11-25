# Worklog: RFC draft: opt-in rolling quotas for protected service reads (#2653)

## Run Metadata

| Field          | Value |
| -------------- | ----- |
| Run ID         | `plan-rfc-rolling-service-quotas-2653--rfc` |
| Branch         | `plan/rfc-rolling-service-quotas-2653` |
| Issue          | #2653 — design draft PR; body carries `Refs #2653` only (no closing keyword anywhere, including prose) |
| Classification | design draft awaiting owner |
| Archetype      | RFC document (`rfcs/0000-*.md`); no framework source |
| Scope overlays | `SCOPE-docs.md` |
| Milestone      | `0.0.10` |

## Coordinator bootstrap (2026-11-24)

Baseline `main` = `87965d800b7d61312e8612c82bdb0cb98bdf5b29`; `v0.0.10-canary.4` = `7c51c7efb64cbf65c567232245c13fea69f45fe4`.

### Owner model authorization

> Owner explicitly authorized T3 dispatch, with rationale for Neon: it first found or co-found these gaps. Exact public builder model settings: […] providerInstanceId antigravity, model gemini-4-neon, options {thought_level:'xhigh'} for N2 #2651, […] N5 #2653, #2146 and #451. […] If Antigravity is out of quota or unavailable, report before falling back. No silent switches.
>
> […] For Neon builds Codex Sol independent review is authorized, […]

Quoted verbatim from the owner's batch directive. `[…]` marks elided text that concerns lanes or parties outside this run's public record; nothing that governs this lane is elided.

### Route record

| Role | Requested identity | Transport | Family |
| ---- | ------------------ | --------- | ------ |
| Builder | providerInstanceId `antigravity`, model `gemini-4-neon`, options `{thought_level: 'xhigh'}` | T3 `delegate_task`, isolation `worktree` | Google |
| Design reviewer | providerInstanceId `codex`, model `gpt-6.2-sol`, options `{reasoningEffort: 'xhigh'}`, a separate session (OpenAI vs Google) | separate session | OpenAI |

- Workload tier: `feature`. The privileged `complex`/`architecture` rows are not authorized for
  this lane and are not selected.
- PLAN-EVAL: N/A — design-only deliverable; the independent design review is the gate.
- Design review: one independent design verdict at the exact head; documentation cap of two rounds. The design verdict is not an IMPL-EVAL and does not authorize implementation.
- No implementation lane self-certifies. Automated green gates are evidence, not review.
- Fallback: none without an owner report first. If the builder or reviewer provider is unavailable
  or out of quota, the coordinator reports before any fallback; no silent model or provider switch.

### Scope

- `rfcs/0000-rolling-service-quotas.md` from `rfcs/0000-template.md`.
- Compatible decision semantics for fixed-window (default, unchanged) and opt-in rolling policies in both first-party rate-limit stores (memory and shared KV).
- Compare strict rolling admission, approximate rolling counters, and explicit burst/refill budgets; keeping fixed windows plus reducing duplicate reads stays a listed alternative.
- Specify storage bounds, atomicity under concurrent reservations, memory/KV parity, `resetAt` meaning, and how callers get the next eligible instant for `Retry-After`.
- Reproduce the issue's deterministic alignment example against current `main` source and label it measured; label everything else source-inspected.

### Boundaries and shared seams

- Design only: no edits under `packages/` or `plugins/`.
- No accepted governing RFC exists; this draft does not authorize implementation.
- Ask the coordinator before touching another lane's files.

### Gates

- `deno fmt --check` on the RFC file is not a verdict source for Markdown; keep the file template-shaped and link-clean (`deno task docs:links` if it covers `rfcs/`).
- Any TypeScript snippet that claims to run is run against current `main` and its output recorded in this run dir.

## Design

Design-only deliverable (`SCOPE-docs.md`; no framework source under `packages/` or `plugins/`):

1. **Proposed public surface (design draft only; not implemented)**:
   - `@netscript/service/rate-limit`: `RATE_LIMIT_POLICY_KINDS`, `RateLimitPolicyKind`,
     `RateLimitPolicy` (`{ kind: 'fixed-window' } | { kind: 'gcra'; burst?: number }`); additive
     optional `policy?: RateLimitPolicy` on `MemoryRateLimitStoreOptions` and
     `KvRateLimitStoreOptions` (no retention option — `clockSkewMarginMs` dropped in favor of fixed
     retention); additive optional `retryAt?: number` on `RateLimitDecision` (exact representable
     next commit instant on quota exhaustion, or explicit `RangeError` when unrepresentable;
     advisory backoff on contention/capacity); policy-aware JSDoc updates on
     `RateLimitRequest.limit/windowMs` and `ServiceRateLimitOptions.limit/windowMs`.
   - `@netscript/service`: automatically inherits optional `retryAt?: number` via existing
     `RateLimitDecision` re-export; no new root exports.
2. **Domain vocabulary**: `RateLimitPolicy`, `RateLimitPolicyKind`, four-field `StoredGcraState`
   (`{ v: 1, p: 'gcra', tatMs, tatRem }`, internal), `GCRA_CLOCK_SKEW_BOUND_MS = 5_000`,
   `MAX_GCRA_TTL_MS = 31_536_000_000`, `resetAt` (full quota reset; advisory horizon on
   contention/capacity denials), `retryAt` (exact representable next commit instant on quota denial
   under single coherent policy and bounded skew; advisory backoff on contention/capacity denials),
   `retryAt ?? resetAt` for `Retry-After`.
3. **Ports**: `RateLimitStore` unchanged (`consume(request: RateLimitRequest): Promise<RateLimitDecision>`);
   consumes existing `KvStore` (`get` + `atomic`, with Redis commit confirmation conditional on
   `#2648`) with no new KV port methods.
4. **Constants**: `RATE_LIMIT_POLICY_KINDS = ['fixed-window', 'gcra'] as const`; internal
   `GCRA_CLOCK_SKEW_BOUND_MS = 5_000` ms and `MAX_GCRA_TTL_MS = 31_536_000_000` ms (365 days).
5. **Commit slices (design draft run)**:
   - S0 (coordinator bootstrap): `supervisor.md`, `worklog.md`, `drift.md` (`db048698`).
   - S1 (round 1 draft): `rfcs/0000-rolling-service-quotas.md` + `worklog.md` measured evidence,
     design checkpoint, and link/snippet validation (`c8250ac1`).
   - S2 (round 2 revision): addresses DESIGN-EVAL round-1 accepted blockers 1–5 and all 3 advisories
     (`e847c4f8`).
   - S3 (round 3 final revision): locks single coherent policy per store, fixed `5_000` ms
     skew-bounded retention (dropping `clockSkewMarginMs`), exact next-commit representability at
     safe-time overflow, upfront `365`-day TTL validation aligned with `DenoKvAdapter`, measured
     strict-log Deno KV figures (`5_000`/`7_000` OK, `8_000`/`10_000` rejected), explicit
     `## Future work`, and all round-2 advisories.
6. **Deferred scope**: Implementation under `packages/service/`, mixed-policy rollout and shared
   time-debt carryover, configurable physical KV retention, `#2648` Redis atomic `EXEC`
   command-error confirmation in `packages/kv/`, `#2365` device-grant dynamic monotonic polling
   cadence, post-auth `ServiceBuilder` rate-limit stage ordering, capped `sliding-log` policy,
   weighted request cost, and `RateLimit` response headers.
7. **Contributor path**: Read `rfcs/0000-rolling-service-quotas.md` and current
   `packages/service/src/rate-limit/{domain,ports,adapters,middleware}/`; once accepted and numbered,
   add `domain/gcra.ts`, wire single-policy `policy` and fixed skew-bounded retention into both
   store adapters (preserving zero-margin fixed-window TTL), update middleware `Retry-After` to
   `decision.retryAt ?? decision.resetAt` and policy-dependent JSDoc, and run the technical
   verification gates (including `#2648` before certifying Redis).

## Measured Evidence

### 1. Deterministic alignment reproduction on `main` (`87965d80`)

Label: **measured** (run against local `main` source `./packages/service/src/rate-limit/mod.ts`, not
the published JSR release).

Command (issue #2653 alignment example):

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

Output (exit code `0`):

```text
[ true, true, false, false ]
[ true, true, true, true ]
```

Extended verification across `createMemoryRateLimitStore`, `createKvRateLimitStore(MemoryKvAdapter)`,
and `createKvRateLimitStore(DenoKvAdapter(Deno.openKv(":memory:")))` (exit code `0`):

```text
memory mid-window [{"allowed":true,"resetAt":60000},{"allowed":true,"resetAt":60000},{"allowed":false,"resetAt":60000},{"allowed":false,"resetAt":60000}]
memory boundary-straddling [{"allowed":true,"resetAt":60000},{"allowed":true,"resetAt":60000},{"allowed":true,"resetAt":120000},{"allowed":true,"resetAt":120000}]
kv-memory mid-window [{"allowed":true,"resetAt":60000},{"allowed":true,"resetAt":60000},{"allowed":false,"resetAt":60000},{"allowed":false,"resetAt":60000}]
kv-memory boundary-straddling [{"allowed":true,"resetAt":60000},{"allowed":true,"resetAt":60000},{"allowed":true,"resetAt":120000},{"allowed":true,"resetAt":120000}]
kv-deno mid-window [{"allowed":true,"resetAt":60000},{"allowed":true,"resetAt":60000},{"allowed":false,"resetAt":60000},{"allowed":false,"resetAt":60000}]
kv-deno boundary-straddling [{"allowed":true,"resetAt":60000},{"allowed":true,"resetAt":60000},{"allowed":true,"resetAt":120000},{"allowed":true,"resetAt":120000}]
```

### 2. Surface, guidance, and validation gates

- `deno doc packages/service/src/rate-limit/mod.ts` (filtered across `RateLimitDecision`,
  `RateLimitRequest`, `RateLimitStore`, `ServiceRateLimitOptions`, `MemoryRateLimitStoreOptions`,
  `KvRateLimitStoreOptions`) and `deno doc packages/service/mod.ts --filter ServiceBuilder.withRateLimit`:
  exit code `0` (**measured**).
- Local NetScript MCP `find_guidance` (`deno run -A packages/cli/bin/netscript.ts agent mcp`,
  `intent: "service rate-limit stores memory kv atomic rolling quota retry-after"`): exit code `0`,
  high-confidence hits on `pages/reference/service#rate-limits-and-client-addresses` and
  `pages/services-sdk/how-to/protect-an-anonymous-route` (**measured**).
- Pure `BigInt` GCRA arithmetic check via `deno eval` (verifies the RFC's exact integer formulas on
  Sequence A, Sequence B, `limit: 3 / windowMs: 1000`, sub-ms `limit: 1000 / windowMs: 100`, and
  `burst: 1`): exit code `0` (**measured**).
- `deno task docs:links` (default roots; source-inspected `.llm/tools/validation/check-internal-doc-links.ts:103-113`
  confirms default roots exclude `rfcs/`, so default `docs:links` is N/A for `rfcs/` coverage):
  exit code `0` (`docs=105 broken-links=0 broken-anchors=0 orphans=0`).
- `deno run --no-lock --allow-read .llm/tools/validation/check-internal-doc-links.ts --root rfcs/0000-rolling-service-quotas.md --pretty`:
  exit code `0` (`docs=1 broken-links=0 broken-anchors=0 orphans=0`) (**measured**).
- Public-text & close-gate hygiene check (zero closing keywords near `#N`, zero process language in
  RFC body, zero machine paths/hosts/secrets/private-project names, zero edits outside `rfcs/` and
  run dir): exit code `0` (**measured**).

### 3. Source-inspected baseline claims

Every claim in `rfcs/0000-rolling-service-quotas.md` describing current `main` (`87965d80`)
behavior is **source-inspected** against the files below:

- `packages/service/src/rate-limit/domain/rate-limit.ts` (lines 4–39)
- `packages/service/src/rate-limit/ports/rate-limit-store.ts` (lines 17–20)
- `packages/service/src/rate-limit/adapters/memory-rate-limit-store.ts` (lines 10–68)
- `packages/service/src/rate-limit/adapters/kv-rate-limit-store.ts` (lines 11–69)
- `packages/service/src/rate-limit/middleware/options.ts` (lines 1–40)
- `packages/service/src/rate-limit/middleware/rate-limit-middleware.ts` (lines 29–96)
- `packages/service/src/builder/service-builder-impl.ts` (lines 310–313, 458–461, 515–524)
- `packages/service/tests/rate-limit_test.ts` (lines 116–289)
- `packages/service/README.md` (lines 766–829)
- `packages/kv/types/kv-store.ts` (lines 149–196)
- `packages/kv/adapters/deno-kv.adapter.ts` (lines 105–119, 202–235)
- `packages/kv/adapters/memory.adapter.ts` (lines 197–219, 504–522, 586–601)
- `packages/kv/adapters/redis.adapter.ts` (lines 102, 273–435 — including lines 352–361 null-only
  `EXEC` check tracked in `#2648`)
- `packages/kv/adapters/redis/types.ts` (line 103)
- `packages/kv/adapters/redis/codec.ts` (lines 38–133)
- `packages/kv/adapters/redis/serialization.ts` (lines 37–46)
- `packages/kv/README.md` (lines 109–113)
- `packages/contracts/src/domain/schemas.ts` (lines 68–71, 110–113)
- `.llm/tools/validation/check-internal-doc-links.ts` (lines 103–113)

### 4. Derived design claims & round-2 formula verification

Proposed GCRA transitions, exact-vs-advisory retry contracts, overflow oracle behavior, mixed-policy
time-debt semantics, retention preconditions, and algorithm comparison envelopes are **derived**
from the proposed design (not baseline source behavior). Round-2 formula checks via `deno eval`
(exit code `0`) verified:

- Weighted two-window counterexample (`limit = 10, windowMs = 1_000`): `10` at `t = 999` + `9` at
  `t = 1_900` (`est + 1 <= limit`) = `19` in 901 ms; `10` at `t = 999` + `10` at `t = 1_901`
  (`est < limit`) = `20` in 902 ms (**derived**, formula-checked).
- Safe-time overflow oracle (`now = Number.MAX_SAFE_INTEGER - 2, limit = windowMs = burst = 2`):
  Req 1 admits (`MAX - 1`), Req 2 admits (`MAX`), Req 3 denies cleanly (`allowed: false`,
  `resetAt = MAX`, `retryAt = MAX - 1`, no throw); `now = Number.MAX_SAFE_INTEGER` throws
  `RangeError` (**derived**, formula-checked).
- `burst > limit` (`limit = 1, windowMs = 1_000, burst = 5`): 5 admitted at `now = 0`, 6th denied
  with `retryAt = 1_000, resetAt = 5_000` (**derived**, formula-checked).
- Mixed-policy burst decrease (`limit = 10, windowMs = 10_000`: old `burst = 10` admits 10 at `0` →
  `tat = 10_000`; new `burst = 2` at `1_000` denies with `retryAt = 9_000, resetAt = 10_000`;
  interleaved old `burst = 10` at `1_000` admits to `tat = 11_000`) (**derived**, formula-checked).
- Sub-millisecond short-interval envelope (`limit = 1_000, windowMs = 100, burst = 2`): 2 admitted
  at `t = 0`, 3rd denied with `retryAt = 1`, 2 more admitted at `t = 1` (**derived**,
  formula-checked).
- `encodeStoredValue` (`packages/kv/adapters/redis/codec.ts`) serialized envelope length on `main`:
  `99` bytes (small state, 20-char versionstamp) to `140` bytes (`MAX_SAFE_INTEGER` state, 20-char
  versionstamp; `146` bytes with 26-char generated versionstamp) (**measured** against local codec).

### 5. Round-3 measured Deno KV adapter bounds & derived formula verification

**Measured** against local `main` (`87965d80`, Deno `2.9.7`, `Deno.openKv(':memory:')` via
`DenoKvAdapter` at `packages/kv/adapters/deno-kv.adapter.ts:216` and `encodeStoredValue` at
`packages/kv/adapters/redis/codec.ts`):

- **Deno KV `expireIn` limits (`DenoKvAdapter.atomic`)**:
  - Non-integers, negatives, `NaN`, `Infinity`: throw `TypeError: expireIn must be a non-negative integer`.
  - Upper bound (against `chrono::DateTime<Utc>::MAX_DATETIME`): binary-search max accepted at test
    time `8_208_471_366_461_230` ms; `+1` threw `TypeError: Invalid mutation: expireIn is too large: 8208471366461231`.
  - Proposed normative ceiling `MAX_GCRA_TTL_MS = 31_536_000_000` ms (365 days): committed with
    `ok: true` on both `DenoKvAdapter` and `MemoryKvAdapter`.
- **Deno KV strict-log numeric timestamp array (`number[]`) value limits**:
  - `5_000` timestamps: round-tripped (`ok: true, len: 5000`).
  - `7_000` timestamps: round-tripped (`ok: true, len: 7000`).
  - `8_000` timestamps: rejected (`TypeError: Value too large (max 65536 bytes)`).
  - `10_000` timestamps: rejected (`TypeError: Value too large (max 65536 bytes)`).
- **4-field `StoredGcraState` (`{ v: 1, p: 'gcra', tatMs, tatRem }`) Redis `encodeStoredValue` size**:
  `90` bytes (small state, 20-char stamp) / `96` bytes (26-char stamp) up to `117` bytes
  (`MAX_SAFE_INTEGER - 1` fields, 20-char stamp) / `123` bytes (26-char stamp).

**Derived** Round-3 formula verification via `deno eval --unstable-kv` (exit code `0`):

- **Overflow edge oracle through advertised `retryAt`** (`M = Number.MAX_SAFE_INTEGER`, `L = W = B = 2`):
  - `now = M - 2`: Req 1 admits (`M - 1`), Req 2 admits (`M`), Req 3 throws
    `RangeError: rateLimit window exceeds safe time` (no representable commit instant exists).
  - `now = M - 3`: Req 1 admits (`M - 2`), Req 2 admits (`M - 1`), Req 3 denies
    `{ allowed: false, resetAt: M - 1, retryAt: M - 2 }`, Req 4 at advertised `retryAt = M - 2`
    admits cleanly (`{ allowed: true, resetAt: M }`, `expireIn = 5_002`), Req 5 at `M - 2` throws
    `RangeError: rateLimit window exceeds safe time`.
- **TTL-ceiling boundary**: `windowMs = 31_535_995_000, L = B = 1, now = 100` → `expireIn = 31_536_000_000`
  (commits on `DenoKvAdapter` and `MemoryKvAdapter`); `windowMs = 31_535_995_001` throws
  `RangeError: rateLimit retention exceeds maximum supported TTL` before KV IO.
- **Fixed retention (`expireIn = (resetAt - now) + 5_000`)**: `limit = windowMs = 60_000, burst = 1, now = 100`
  writes `expireIn = 5_001`; `limit = burst = 1, windowMs = 1_000, now = 100` writes `expireIn = 6_000`
  (preventing 1 ms-lag early admission at `now = 1_099`).
- **CAS exhaustion `lastObservedResetAt`** (`L = 3, W = 60_000, B = 3, now = 100`): absent/idle
  returns `{ retryAt: 20_100, resetAt: 20_100 }`; persisted live after 2 admissions (`tatMs = 40_100`,
  tentative post-write `60_100`) returns `{ retryAt: 20_100, resetAt: 40_100 }`.
- **Upper-bound & weighted boundary witnesses**: `windowMs = 1, L = B = 3` admits at most `3` in
  `[t, t + 1)`; weighted two-window (`L = 10, W = 1_000`) admits `10` at `Δt = 0` under both
  predicates, `10`/`11` across `[999, 1_001]`, and `19`/`20` with late single-ms burst at
  `1_900`/`1_901`.
- **`burst > limit`** (`L = 1, W = 1_000, B = 5, now = 0`): 5th admit has `resetAt = 5_000, expireIn = 10_000`;
  6th denies with `retryAt = 1_000, resetAt = 5_000`.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-11-24 | S0 | bootstrap | Coordinator bootstrap commit: `supervisor.md`, `worklog.md`, `drift.md`. |
| 2026-11-24 | S1 | research | Verified branch HEAD `db048698`, read issue #2653, doctrine, skills, `packages/service/src/rate-limit/`, and `packages/kv/` adapters; queried `deno doc` and local MCP `find_guidance`; reproduced alignment example against `main` source (measured). |
| 2026-11-24 | S1 | draft | Authored `rfcs/0000-rolling-service-quotas.md` from `rfcs/0000-template.md` and recorded design checkpoint + measured/source-inspected ledgers in `worklog.md`; opened draft PR #2656 at `c8250ac1`. |
| 2026-11-24 | S2 | revision-r2 | Addressed DESIGN-EVAL round-1 accepted blockers 1–5 and all 3 advisories (Blocker 6 declined by coordinator — owner authorization quote and round-1 hygiene line left unaltered). Verified derived formulas, link check, and hygiene. |
| 2026-11-24 | S3 | revision-r3 | Third and final revision per authorized round-3 scope (`#issuecomment-7122007586`) + round-2 advisories (`#issuecomment-7121965164`): single coherent policy per store (4-field state, policy-scoped key, mixed-policy rollout deferred), fixed `5_000` ms skew-bounded retention (`clockSkewMarginMs` dropped), next-commit safe-time check at `retryAt` overflow edge, `365`-day `MAX_GCRA_TTL_MS` validation aligned with measured `DenoKvAdapter` limits, measured strict-log Deno KV figures (`5_000`/`7_000` OK, `8_000`/`10_000` rejected), explicit `## Future work`, `lastObservedResetAt` definition, upper-bound/weighted-interval wording, and process-free technical gates. |
| 2026-11-25 | S4 | revision-r4 | Owner-approved Neon continuation (`gemini-4-neon`, separate-session review to follow): closed all 7 in-scope technical defects from Round-3 DESIGN-EVAL (`#issuecomment-7128326516`) — (1) clarified single-coherent-policy as caller precondition and aligned Gate 5a shared-prefix/tuple wording, (2) aligned standalone `MemoryRateLimitStore` GCRA rotating eviction to `entry.resetAt + GCRA_CLOCK_SKEW_BOUND_MS <= request.now` with cross-key backward-step parity in Gate 6b and updated Gate 7 reclamation timing, (3) split Gate 6a into separate original-write expiry vs on-time renewal fixtures anchored to adapter TTL submission time, (4) scoped shift invariance to representable shifts, (5) generalized weighted `[W - 1, W + 1]` boundary row to `limit + floor(limit / W)` / `limit + ceil(limit / W)` with `L = 10, W = 2` (`15`) witness, (6) corrected `entry === null` absence check and documented/gated `MemoryKvAdapter` vs `DenoKvAdapter` persisted-`null` behavior, and (7) replaced `7_000` ceiling wording with measured passing samples up to `7_280` (`7_300` rejected) distinct from explicit product caps. Preserved all 6 owner product decisions in `## Unresolved questions`. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Recommend GCRA (`{ kind: 'gcra', burst?: number }`) over sliding-window log and weighted two-window | O(1) four-field stored record per key (`90`–`123` bytes in Redis codec) and O(1) per-key memory in standalone `MemoryRateLimitStore` for any safe-integer `limit` (strict log hits Deno KV's 64 KiB cap between `7_000` and `8_000` timestamps and still incurs linear O(limit) CAS/memory overhead below that ceiling, forcing an explicit low `maxLimit` product cap); single-key CAS; 100% shift-invariant; weighted two-window reaches `2 * limit - 1` / `2 * limit` in one rolling window plus false denials. | `rfcs/0000-rolling-service-quotas.md` § Rationale and alternatives |
| Keep `resetAt` as full quota recovery and add optional `retryAt?: number` on `RateLimitDecision`, splitting exact vs advisory denials | Preserves fixed-window `{ allowed, resetAt }` exact object shape and custom `RateLimitStore` compatibility while giving quota-exhaustion denials exact next-slot eligibility and labeling contention/capacity fallback values honestly as advisory backoff. | `rfcs/0000-rolling-service-quotas.md` § Compatible decision semantics |
| Place `policy?: RateLimitPolicy` on store options (`MemoryRateLimitStoreOptions` / `KvRateLimitStoreOptions`) rather than `RateLimitRequest` | Keeps `RateLimitStore` port unchanged, prevents silent fallback on custom stores, prevents mixing policies on one KV prefix, and validates configuration at construction. | `rfcs/0000-rolling-service-quotas.md` § Public API and type surface |
| Condition Redis shared-KV commit guarantees on `#2648` and require serialization-disjoint prefixes | `redis.adapter.ts:352–361` checks only `exec() === null` without inspecting per-command errors; `keyToRedisKey` joins unescaped `:` segments so tuple arity alone cannot isolate keys in Redis. | Source inspection + DESIGN-EVAL round 1 |
| Lock one coherent rolling policy per store/prefix and defer mixed-policy rollout to `## Future work` | Removes `den` rescaling complexity and `(B - 1) * T` vs `B * T` multi-policy ambiguity; encodes `(windowMs, limit, effectiveBurst)` in bucket keys with a 4-field state; documents that prefix isolation creates independent per-namespace buckets during cutover. | Round-3 scope item 1 + DESIGN-EVAL round 2 |
| Replace `clockSkewMarginMs` with fixed `GCRA_CLOCK_SKEW_BOUND_MS = 5_000` ms retention (`expireIn = (resetAt - now) + 5_000`) and upfront `MAX_GCRA_TTL_MS = 31_536_000_000` ms ceiling | Eliminates conflicting option semantics and emission-interval dependence (preventing both 1 ms and 1,000 ms lagging-peer early admissions while `Δ_gap < 5_000` ms); upfront `ceilDiv(B * W, L) + 5_000 <= MAX_GCRA_TTL_MS` guarantees no accepted configuration can emit a TTL rejected by `DenoKvAdapter` (`deno-kv.adapter.ts:216`), `RedisKvAdapter` (`redis.adapter.ts:425`), or `MemoryKvAdapter` (`memory.adapter.ts:513`); preserves zero-margin fixed-window TTL unchanged. | Round-3 scope items 2, 3, 5 + measured Deno KV probe |
| Verify next-commit representability (`ceilDiv(max(tat, retryAt * L) + W, L) <= MAX_SAFE`) before returning quota-exhaustion `retryAt` | Guarantees `retryAt` is never earlier / never rounded down and is always committable cleanly under unchanged state; throws explicit `RangeError` when no representable commit instant exists (e.g., `MAX_SAFE_INTEGER - 2` Req 3), while `MAX_SAFE_INTEGER - 3` returns committable `retryAt = MAX - 2`. | Round-3 scope item 4 + DESIGN-EVAL round 2 |
| Define `lastObservedResetAt` explicitly from the final CAS read's persisted state (never tentative post-write `newTat`) | Eliminates ambiguity between absent/idle (`retryAt`) and persisted live (`ceilDiv(storedTat, L)`) advisory fallback values on KV CAS exhaustion. | DESIGN-EVAL round 2 advisory |

## Drift

See `drift.md`.
