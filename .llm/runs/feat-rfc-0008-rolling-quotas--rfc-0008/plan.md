# Plan: RFC 0008 — Opt-in rolling quotas for protected service reads

## Run Metadata

| Field          | Value                                                               |
| -------------- | ------------------------------------------------------------------- |
| Run ID         | `feat-rfc-0008-rolling-quotas--rfc-0008`                            |
| Branch         | `feat/rfc-0008-rolling-quotas`                                      |
| Phase          | `plan`                                                              |
| Target         | `packages/service` (`@netscript/service/rate-limit`) + service docs |
| Archetype      | `4 - Public DSL / Builder` (`packages/service`)                     |
| Scope overlays | `SCOPE-service.md`, `SCOPE-docs.md`                                 |
| Workload tier  | `feature`                                                           |
| Tracking issue | `#2653` (milestone `0.0.10`)                                        |
| Sub-issues     | `#2675` (S1 — this PR), `#2676` (S2 — Gate 5b(a), blocked on `#2648`) |

## Archetype

`ARCHETYPE-4-dsl-builder.md` (`@netscript/service` is classified as Archetype 4 in
`docs/architecture/doctrine/10-codebase-verdict-and-handoff.md`), with `SCOPE-service.md` and
`SCOPE-docs.md` overlays for the rate-limit middleware/stores and service reference/README docs.

## Current Doctrine Verdict

`packages/service` (`@netscript/service`): Archetype 4, verdict `Refactor` ("Finish builder
separation while preserving bootstrap/runtime wiring"). The `src/rate-limit/` slice already follows
strict `domain/`, `ports/`, `adapters/`, `middleware/` layering with zero doctrine findings; this
work adds zero debt and keeps every new/modified file well within F-1 (<= 300 lines in `domain/`)
and F-16 (<= 12 children per folder) limits.

## Axioms in Play

| Axiom | Why it matters |
| ----- | -------------- |
| `A1`  | Public types first: `RATE_LIMIT_POLICY_KINDS`, `RateLimitPolicyKind`, `RateLimitPolicy`, `RateLimitPolicyConfig`, `RateLimitDecision.retryAt`, `RateLimitStore.validate?`. |
| `A2`  | Simple over easy: single discriminated union `policy` option instead of boolean flags or duplicated store factories; fixed retention constants (no retention tuning footgun). |
| `A7`  | Web Platform and built-in `BigInt` / `AbortSignal`; zero new external dependencies. |
| `A8`  | One concern per folder, one reason per file: pure GCRA math isolated in `domain/gcra.ts`, shared verbatim by memory and KV adapters. |
| `A11` | Named typed extension axis (`RateLimitPolicy`) with finite constant vocabulary (`RATE_LIMIT_POLICY_KINDS`). |
| `A14` | Full RFC 0008 technical verification gates (Gates 1–11) preserve invariants and backwards compatibility. |

## Goal

Implement accepted RFC 0008 (`rfcs/0008-rolling-service-quotas.md`) end-to-end across
`@netscript/service/rate-limit`, service documentation, and generated corpora, while cleanly
separating the `#2648`-blocked Redis `MULTI`/`EXEC` command-error certification (`Gate 5b(a)`) into
sub-issue `#2676` so `#2675` (S1) lands all runnable capability and gates immediately on `main`.

## Scope

### Slice S1 (`#2675` — implemented on `feat/rfc-0008-rolling-quotas`)
- `packages/service/src/rate-limit/domain/rate-limit.ts`: add `RATE_LIMIT_POLICY_KINDS`,
  `RateLimitPolicyKind`, `RateLimitPolicy`, policy validation, optional `retryAt` on
  `RateLimitDecision`, updated `RateLimitRequest` JSDoc; keep `rateLimitWindow()` fixed-window
  behavior unchanged.
- `packages/service/src/rate-limit/domain/gcra.ts`: pure `BigInt` rational GCRA state, fixed
  constants (`GCRA_CLOCK_SKEW_BOUND_MS = 5_000`, `MAX_GCRA_TTL_MS = 31_536_000_000`),
  `validateGcraPolicy()`, `parseStoredGcraState()`, `evaluateGcra()`, safe-time and next-commit
  representability checks, contention/capacity advisory fallback helpers, and skew-bounded eviction
  predicate.
- `packages/service/src/rate-limit/ports/rate-limit-store.ts`: add `RateLimitPolicyConfig` and
  optional synchronous `validate?(config: RateLimitPolicyConfig): void` on `RateLimitStore`.
- `packages/service/src/rate-limit/adapters/memory-rate-limit-store.ts`: add `policy?`, synchronous
  construction validation, `validate()`, transport-agnostic GCRA dispatch with O(1) per-key state
  and skew-bounded rotating eviction (`resetAt + 5_000 <= now`), preserving default fixed-window
  byte-for-byte.
- `packages/service/src/rate-limit/adapters/kv-rate-limit-store.ts`: add `policy?`, synchronous
  construction validation, zero-IO `validate()`, transport-agnostic single-key CAS GCRA dispatch
  with fixed `(resetAt - now) + 5_000` retention and stale-persisted `lastObservedResetAt` advisory
  fallback, preserving default fixed-window keys and zero-margin TTL byte-for-byte.
- `packages/service/src/rate-limit/middleware/options.ts` and `rate-limit-middleware.ts`: update
  policy-aware JSDoc, call `store.validate?.({ limit, windowMs })` synchronously at middleware
  construction, and compute `Retry-After` from `decision.retryAt ?? decision.resetAt`.
- `packages/service/src/rate-limit/mod.ts` (and `packages/service/mod.ts` if `deno doc --lint`
  requires transitive `RateLimitPolicyConfig` export).
- New test suites covering RFC 0008 Gates 1, 2, 3, 4, 5a, 5b(b)–(c) (plus inert `KvStore` atomic
  throw test), 6a, 6b, 7, 8, 9a, 9b, and 10 (without modifying `rate-limit_test.ts` or
  `rate-limit-address-key_test.ts`).
- Docs & generated corpora: `packages/service/README.md`, `docs/site/reference/service/index.md`,
  `docs/site/services-sdk/how-to/protect-an-anonymous-route.md`, and regenerated MCP export corpus
  / agent docs prose if freshness checks require it.

### Slice S2 (`#2676` — blocked on `#2648`, separate future PR)
- End-to-end Gate 5b(a) inert-transport `RedisKvAdapter` `MULTI`/`EXEC` command-error regression
  through `createKvRateLimitStore(..., { policy: { kind: 'gcra' } })` once `#2648` lands on `main`,
  plus removing the pre-`#2648` Redis caveat from service docs and closing `#2653`.

## Non-Scope

- Modifying `packages/kv/` adapters (`#2648` is separate).
- Changing default fixed-window behavior, key layout, zero-margin TTL, or `{ allowed, resetAt }`
  shape.
- Moving `.withRateLimit()` after auth or adding oRPC procedure middleware (separate RFC lane).
- Mixed-policy shared buckets, configurable retention margins, sliding-log policy, weighted cost,
  or IETF `RateLimit` headers (all explicitly deferred in RFC 0008 § Future work).
- Adding any new dependencies or touching `deno.lock`.

## Hidden Scope

- `deno doc --lint` on root `packages/service/mod.ts` when `RateLimitStore` gains optional
  `validate?: (config: RateLimitPolicyConfig) => void` (may require re-exporting
  `type RateLimitPolicyConfig` at root `mod.ts`).
- `deno task check:mcp-export-corpus` and `deno task check:agent-docs-prose` / `check:assets-barrel`
  in CI `quality` require generated corpus refresh whenever exports or docs change.
- `deno task docs:jsdoc-examples` and `deno task docs:readme-fences` compile every code fence in
  JSDoc and package READMEs.

## Locked Decisions

| ID | Decision | Rationale |
| -- | -------- | --------- |
| `LD-1` | Implement accepted RFC 0008 verbatim (GCRA exact `BigInt`, `RATE_LIMIT_POLICY_KINDS`, `RateLimitPolicy`, `RateLimitPolicyConfig`, `RateLimitStore.validate?`, `RateLimitDecision.retryAt`, `GCRA_CLOCK_SKEW_BOUND_MS = 5_000`, `MAX_GCRA_TTL_MS = 31_536_000_000`). | Owner-accepted RFC 0008 (`ba432422`). |
| `LD-2` | Keep `PLAN-EVAL: N/A` for this implementation run. | RFC 0008 already passed multi-round DESIGN-EVAL and Claude Fable 5.2 `PLAN-EVAL: APPROVED` (PR #2656) before owner acceptance; zero unresolved design trade-offs remain. |
| `LD-3` | Split `#2653` into S1 (`#2675`, full implementation + Gates 1–11 minus `#2648`-blocked 5b(a)) and S2 (`#2676`, Gate 5b(a) post-`#2648`). | Respects RFC 0008 non-goal of not editing `packages/kv/`, lands full functionality immediately, and preserves `#2653` open until `#2648` enables Gate 5b(a). |
| `LD-4` | Keep store logic 100% transport-agnostic (no Hono/oRPC imports in `domain/`, `ports/`, `adapters/`). | Parallel oRPC middleware RFC lane must be able to reuse stores without rework. |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| Whether `packages/service/mod.ts` must re-export `type RateLimitPolicyConfig` for `deno doc --lint` | safe to defer to implementation verification | Determined mechanically by `deno task doc:lint --root packages/service --pretty`; if flagged as `private-type-ref`, re-export alongside `RateLimitStore` and log in `drift.md`. |

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| Fixed-window regression (extra `retryAt: undefined` key or added `+5_000` TTL margin) | Separate fixed-window and GCRA paths cleanly; leave `rate-limit_test.ts` and `rate-limit-address-key_test.ts` untouched; add explicit Gate 10 zero-margin TTL regression test. |
| Subtle `BigInt` overflow or off-by-one at `MAX_SAFE_INTEGER` or `MAX_GCRA_TTL_MS` boundary | Follow exact RFC formulas (`ceilDiv`, `retryBase + W` representability check) and assert exact RFC Gate 6b overflow oracle and boundary fixtures. |
| Memory store `maxKeys` saturation evicting skew-retained entries prematurely | Apply `BigInt(entry.resetAt) + BigInt(GCRA_CLOCK_SKEW_BOUND_MS) <= BigInt(request.now)` rotating eviction and verify Gate 6b backward-step parity and Gate 7 saturation horizon. |
| Stale generated MCP/agent-docs corpora breaking CI `quality` | Run `check:mcp-export-corpus`, `check:agent-docs-prose`, `check:assets-barrel`, `docs:accuracy`, `docs:jsdoc-examples`, `docs:readme-fences` locally and regenerate if stale. |
| Unintended `deno.lock` churn | Never delete lock files or run `deno cache --reload`; verify `git diff deno.lock` is empty. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| -- | ------ | ---- |
| `AP-1` | avoid | Keep `domain/gcra.ts` focused and <= 250 lines; split test suites cleanly under `packages/service/tests/`. |
| `AP-11` / `AP-16` | avoid | Use role-named `domain/gcra.ts`, no `utils`/`helpers` folders, zero `any` or `as unknown as`. |
| `AP-14` / `AP-15` | avoid | No upstream re-exports beyond existing `@netscript/kv` port types; caller-oriented vocabulary from RFC 0008. |
| `AP-25` | avoid | Zero load-time side effects or background timers in `domain/` or store adapters. |

## Fitness Gates

| Gate | Required | Expected evidence |
| ---- | -------- | ----------------- |
| `F-1`..`F-19` | yes | `deno task quality:gate` (`quality:scan` + `arch:check`) + `audit-jsr-package.ts --root packages/service` |
| `F-6` / `F-7` | yes | `deno task doc:lint --root packages/service --pretty`, `deno task docs:jsdoc-examples`, `deno task docs:readme-fences`, `deno publish --dry-run --allow-dirty` in `packages/service` |
| Static | yes | Scoped `run-deno-check.ts`, `run-deno-lint.ts`, `run-deno-fmt.ts` on `packages/service` |
| Runtime/Tests | yes | All RFC 0008 Gates 1–10 tests (`deno test --allow-all packages/service/tests/`) |
| Release/E2E | n/a | No scaffold/CLI/DB/Aspire/plugin copy-mode files modified |

## Arch-Debt Implications

| Entry | Action | Notes |
| ----- | ------ | ----- |
| `.llm/harness/debt/arch-debt.md` | none | No new or deepened architecture debt introduced. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| ----- | ---- | ---------------- | --------------- |
| 1 | Unit & integration tests (Gates 1–10) | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/service/tests/` | All pass (existing tests unmodified) |
| 2 | Scoped check / lint / fmt | `.llm/tools/run-deno-check.ts`, `run-deno-lint.ts`, `run-deno-fmt.ts` on `--root packages/service --ext ts,tsx` | Exit 0 |
| 3 | JSR & doc lint | `deno task doc:lint --root packages/service --pretty`, `deno task docs:jsdoc-examples`, `deno task docs:readme-fences`, `deno task docs:accuracy`, `audit-jsr-package.ts --root packages/service --text`, `(cd packages/service && deno publish --dry-run --allow-dirty)` | Exit 0, 0 new warnings |
| 4 | Quality & architecture gate | `deno task quality:gate` | Exit 0 |
| 5 | Corpus freshness | `deno task check:mcp-export-corpus`, `deno task check:agent-docs-prose`, `deno task check:assets-barrel`, `deno task check:publish-assets` | Exit 0 |
| 6 | Independent IMPL-EVAL | Separate-session Claude Fable 5.2 via `delegate_task` (`isolation: 'worktree'`) | `[PHASE: IMPL-EVAL] [VERDICT: PASS]` at exact head |
| 7 | PR & merge gates | CI `quality`, `check-test`, `close-gate` (with `status:ready-merge` mirror), `deno task check:review-threads`, `mergeStateStatus: CLEAN` | All green |

## Dependencies

- External/new dependencies: none.
- Prerequisite tracked in S2 (`#2676`): `#2648` (Redis `EXEC` command-error confirmation).

## Drift Watch

- `packages/service/mod.ts` transitive export of `RateLimitPolicyConfig` if required by `deno doc --lint`.
- Generated corpus files updated by `gen:mcp-export-corpus` / `gen:agent-docs-prose`.
- Any concurrent merge to `origin/main` affecting `packages/service` or generated corpora.
