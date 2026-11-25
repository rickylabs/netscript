# Worklog: RFC 0008 — Opt-in rolling quotas for protected service reads (#2653 / #2675)

## Run Metadata

| Field          | Value                                                               |
| -------------- | ------------------------------------------------------------------- |
| Run ID         | `feat-rfc-0008-rolling-quotas--rfc-0008`                            |
| Branch         | `feat/rfc-0008-rolling-quotas`                                      |
| Archetype      | `4 - Public DSL / Builder`                                          |
| Scope overlays | `SCOPE-service.md`, `SCOPE-docs.md`                                 |
| Workload tier  | `feature`                                                           |
| Tracking issue | `#2653` (milestone `0.0.10`)                                        |
| Sub-issues     | `#2675` (S1 — active PR), `#2676` (S2 — Gate 5b(a), blocked on `#2648`) |

## Owner direction (2026-11-25, verbatim)

> "Then all merged RFC Ready for start implementation should be launched in separate main lanes with Neon and Fable 5.2 as reviewer (sub lane of it) + hydrogen on subsequent pass (where needed)"
>
> "Make sure relevant issues are assigned to milestone 0.0.10"
>
> "Merge all what is ready to merge as it lands"

### Route & PLAN-EVAL Record

- **Workload tier:** `feature` (privileged `complex`/`architecture` rows not requested or selected).
- **Builder:** `antigravity` / `gemini-4-neon` (`thought_level: xhigh`, Google family) per verbatim owner direction.
- **IMPL-EVAL (round 1):** `claudeAgent` / `claude-fable-5-2` (`effort: high`, Anthropic family vs Google family) via `delegate_task` (`role: 'review'`, `isolation: 'worktree'`).
- **IMPL-EVAL (subsequent pass, only if needed):** `antigravity` / `gemini-4-hydrogen` (`thought_level: xhigh`) per verbatim owner override (must quote owner override in verdict if used).
- **PLAN-EVAL: N/A** — Concrete risk-selection reason (per `.llm/harness/workflow/run-loop.md` §4): accepted RFC 0008 (`rfcs/0008-rolling-service-quotas.md`, merged from PR #2656 at `ba432422`) already passed four independent DESIGN-EVAL passes plus Claude Fable 5.2 `PLAN-EVAL: APPROVED`, locking the exact public API, single-package module layout (`packages/service/src/rate-limit/`), BigInt GCRA formulas, fixed retention constants, startup validation hook (`RateLimitStore.validate?`), and verification gates 1–11 with zero unresolved architectural trade-offs. Mandatory separate-session IMPL-EVAL still applies.

## Design

### Public Surface

- `@netscript/service/rate-limit`:
  - `RATE_LIMIT_POLICY_KINDS: readonly ['fixed-window', 'gcra']`
  - `type RateLimitPolicyKind`
  - `type RateLimitPolicy` (`{ readonly kind: 'fixed-window' } | { readonly kind: 'gcra'; readonly burst?: number }`)
  - `interface RateLimitPolicyConfig` (`{ readonly limit: number; readonly windowMs: number }`)
  - `RateLimitDecision.retryAt?: number` (exact representable next commit instant on GCRA quota exhaustion; advisory backoff on KV CAS exhaustion or memory capacity saturation; omitted on allow and fixed-window)
  - `RateLimitStore.validate?: (config: RateLimitPolicyConfig) => void` (synchronous zero-IO startup validation hook)
  - `MemoryRateLimitStoreOptions.policy?: RateLimitPolicy`
  - `KvRateLimitStoreOptions.policy?: RateLimitPolicy`
  - `createRateLimitMiddleware()` invokes `store.validate?.({ limit, windowMs })` at construction and derives `Retry-After` from `decision.retryAt ?? decision.resetAt`
- `@netscript/service` (root):
  - Continues re-exporting `RateLimitDecision`, `RateLimitRequest`, `RateLimitStore`, `ServiceRateLimitOptions`, `ServiceProxyTrust` (plus `type RateLimitPolicyConfig` if required by `deno doc --lint`).
  - Fluent chain `createService(router, config).withRateLimit(options).build()` stays unchanged; `withRateLimit()` delegates directly to `createRateLimitMiddleware(options)`, failing fast at startup when a rolling policy exceeds `MAX_GCRA_TTL_MS`.

### Domain Vocabulary

- `RateLimitPolicyKind` — finite string literal union `'fixed-window' | 'gcra'` derived from `RATE_LIMIT_POLICY_KINDS`.
- `RateLimitPolicy` — discriminated union selecting fixed-window (default) or GCRA (`burst?`).
- `RateLimitPolicyConfig` — `{ readonly limit: number; readonly windowMs: number }` validated synchronously at startup.
- `StoredGcraState` (internal) — O(1) four-field persisted record `{ readonly v: 1; readonly p: 'gcra'; readonly tatMs: number; readonly tatRem: number }`.
- `RateLimitDecision` — `{ readonly allowed: boolean; readonly resetAt: number; readonly retryAt?: number }`.

### Ports

- `RateLimitStore` (`packages/service/src/rate-limit/ports/rate-limit-store.ts`) — preserves `consume(request: RateLimitRequest): Promise<RateLimitDecision>` and adds optional synchronous `validate?: (config: RateLimitPolicyConfig) => void`. Consumes existing `@netscript/kv` `KvStore` (`get` + `atomic`) with no new KV port methods.
- Store adapters (`memory-rate-limit-store.ts`, `kv-rate-limit-store.ts`) stay completely transport-agnostic (zero Hono or oRPC imports).

### Constants

- `RATE_LIMIT_POLICY_KINDS = ['fixed-window', 'gcra'] as const` (public).
- `GCRA_CLOCK_SKEW_BOUND_MS = 5_000` (internal, `domain/gcra.ts`).
- `MAX_GCRA_TTL_MS = 31_536_000_000` (internal, `domain/gcra.ts`; 365 days aligned with `DenoKvAdapter`).

### Validation Rules and Where They Fire

1. **Store construction** (`createMemoryRateLimitStore`, `createKvRateLimitStore`): `policy` validated synchronously (`TypeError` for non-object or unknown `kind`; `RangeError` for non-positive-safe-integer `burst`). Zero KV I/O.
2. **Startup / middleware construction** (`store.validate({ limit, windowMs })`, invoked by `createRateLimitMiddleware()` / `.withRateLimit()` immediately after `rateLimitWindow({ key: '', limit, windowMs, now: 0 })`): validates positive safe integers `limit`/`windowMs` and, for GCRA, `ceilDiv(B * W, L) + 5_000 <= MAX_GCRA_TTL_MS` (`RangeError('rateLimit retention exceeds maximum supported TTL')`). Zero KV I/O.
3. **Per-request `consume(request)` (defense-in-depth before state lookup/IO)**: validates `limit`, `windowMs`, `now`, `signal?.throwIfAborted()`, upfront TTL ceiling (`MAX_GCRA_TTL_MS`), and upfront safe-time check (`ceilDiv(N + W, L) <= MAX_SAFE`). Inside `evaluateGcra()`, checks admission `ceilDiv(newTat, L) <= MAX_SAFE` and quota-denial next-commit representability `ceilDiv(max(tat, retryAt * L) + W, L) <= MAX_SAFE`, throwing `RangeError('rateLimit window exceeds safe time')` with zero mutation/KV write if unrepresentable.

### Commit Slices (PR for `#2675`)

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Bootstrap run artifacts & sub-issues `#2675`/`#2676` | Plan & Design checkpoint complete; draft PR opened | `.llm/runs/feat-rfc-0008-rolling-quotas--rfc-0008/*` |
| 2 | Core GCRA domain, port, memory/KV stores, middleware, exports | Scoped `check`, `lint`, `fmt`, `doc:lint`, existing `rate-limit_test.ts` + `rate-limit-address-key_test.ts` pass unmodified | `packages/service/src/rate-limit/**`, `packages/service/mod.ts` (if `doc:lint` requires) |
| 3 | Full RFC 0008 verification suite (Gates 1–4, 5a, 5b(b)–(c), 6a–6b, 7–8, 9a–9b, 10) | `run-deno-test.ts -- --allow-all packages/service/tests/` passes | `packages/service/tests/rate-limit-gcra-domain_test.ts`, `packages/service/tests/rate-limit-gcra-stores_test.ts`, `packages/service/tests/rate-limit-gcra-middleware_test.ts` |
| 4 | Service README, docs site reference/how-to, and generated MCP/agent-docs corpora | `docs:jsdoc-examples`, `docs:readme-fences`, `docs:accuracy`, `check:mcp-export-corpus`, `check:agent-docs-prose`, `check:assets-barrel`, `quality:gate`, `publish:dry-run` all pass | `packages/service/README.md`, `docs/site/reference/service/index.md`, `docs/site/services-sdk/how-to/protect-an-anonymous-route.md`, generated corpora |

### Deferred Scope

- `#2676` (S2): Gate 5b(a) end-to-end `RedisKvAdapter` `MULTI`/`EXEC` command-error test — blocked on `#2648` (PR `#2649`) in `packages/kv/`.
- RFC 0008 § Future work: mixed-policy shared buckets, configurable retention margins, sliding-log policy, weighted request cost, post-auth middleware ordering, IETF `RateLimit` headers, `#2365` device-grant polling cadence.

### Contributor Path

To add a new rolling quota policy kind (for example a future capped `'sliding-log'`):
1. Add the kind to `RATE_LIMIT_POLICY_KINDS` and a discriminated variant to `RateLimitPolicy` in `packages/service/src/rate-limit/domain/rate-limit.ts`.
2. Add a dedicated pure domain module under `packages/service/src/rate-limit/domain/` following `domain/gcra.ts`.
3. Wire startup validation (`validate()`) and `consume()` dispatch in `adapters/memory-rate-limit-store.ts` and `adapters/kv-rate-limit-store.ts` using policy-scoped keys.
4. Add unit/parity/middleware tests under `packages/service/tests/` and update `packages/service/README.md` + `docs/site/reference/service/index.md` + generated corpora.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-11-25 | S0 | Bootstrap & Plan | Read skills, RFC 0008, rate-limit source/tests, CI workflows; created native sub-issues `#2675` (S1) and `#2676` (S2) under `#2653` on milestone `0.0.10`; moved `#2653` to `status:impl`; wrote run artifacts with `PLAN-EVAL: N/A`. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| `PLAN-EVAL: N/A` | Accepted RFC 0008 already passed DESIGN-EVAL + Claude Fable 5.2 PLAN-EVAL APPROVED (PR #2656) | `rfcs/0008-rolling-service-quotas.md`, `run-loop.md` §4 |
| Split `#2653` into `#2675` (S1) and `#2676` (S2) | Prerequisite `#2648` is still open; S1 lands full implementation + Gates 1–11 except `#2648`-blocked Gate 5b(a) | `rfcs/0008-rolling-service-quotas.md` § Gate 5b & Non-goals |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| Owner model/evaluator override + T3 dispatch | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| ---- | ---------------- | ------ | ----- |
| Scoped check | `run-deno-check.ts --root packages/service --ext ts,tsx` | NOT_RUN | Pending implementation |
| Scoped lint | `run-deno-lint.ts --root packages/service --ext ts,tsx` | NOT_RUN | Pending implementation |
| Scoped fmt | `run-deno-fmt.ts --root packages/service --ext ts,tsx` | NOT_RUN | Pending implementation |
| Doc lint | `deno task doc:lint --root packages/service --pretty` | NOT_RUN | Pending implementation |
| JSDoc examples | `deno task docs:jsdoc-examples` | NOT_RUN | Pending implementation |
| README fences | `deno task docs:readme-fences` | NOT_RUN | Pending implementation |
| Publish dry-run | `(cd packages/service && deno publish --dry-run --allow-dirty)` | NOT_RUN | Pending implementation |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| `quality:gate` (`quality:scan` + `arch:check`) | NOT_RUN | pending | — |
| `audit-jsr-package.ts --root packages/service` | NOT_RUN | pending | Baseline `dry-run: OK`, 0 blocking findings |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| RFC 0008 Gates 1–10 tests | NOT_RUN | pending | Baseline 28/28 existing rate-limit tests pass |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| -------- | ------ | -------- | ----- |
| MCP export corpus & agent docs freshness | NOT_RUN | pending | `check:mcp-export-corpus`, `check:agent-docs-prose`, `check:assets-barrel` |

## Handoff Notes

- Pending implementation slices S2–S4 before separate-session Claude Fable 5.2 IMPL-EVAL.
