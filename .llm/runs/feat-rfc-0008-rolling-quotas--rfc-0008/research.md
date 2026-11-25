# Research: RFC 0008 — Opt-in rolling quotas for protected service reads (#2653)

## Baseline against `origin/main`

- Checked out `feat/rfc-0008-rolling-quotas` at `af5107b8d1038cd35d0b2835e1012bc80ba4447ac` (`origin/main`, 2026-11-25), which includes accepted RFC 0008 (`rfcs/0008-rolling-service-quotas.md`, merged from PR #2656 at `ba432422a076f4c40d984a6d2e832ca9d83de030`).
- Tracking issue #2653 is open on milestone `0.0.10` (`type:feat`, `area:service`, `priority:p2`, `rfc`).
- Prerequisite issue #2648 (`Redis atomic: reject unconfirmed EXEC command results`, PR #2649) is still open on `main`; `packages/kv/adapters/redis.adapter.ts:356` still checks only `(await multi.exec()) === null`.
- Open PR overlap check (`gh pr list --json number,title,headRefName,files`):
  - Zero open PRs modify `packages/service/**`, `docs/site/reference/service/index.md`, or `docs/site/services-sdk/how-to/protect-an-anonymous-route.md`.
  - PRs #2673 and #2674 (oRPC RFC drafts) touch only `rfcs/0000-*.md`.
  - PRs #2665 and #2666 (directory packages) touch generated MCP/CLI corpora (`export-surface-corpus.generated.ts`, `agent-docs-prose.generated.ts`, `agent-docs.generated.ts`), which CI freshness gates validate against the branch's own source.
- NetScript MCP server is not attached in this session; all public surface and docs claims are grounded directly via `deno doc` against the locked workspace versions (`Deno 2.9.7`, `TypeScript 6.0.3`) and source inspection.

## Source-inspected findings

1. **`packages/service/src/rate-limit/` current layout (7 modules)**:
   - `domain/rate-limit.ts` (39 lines): `RateLimitRequest`, `RateLimitDecision` (`{ allowed: boolean; resetAt: number }`), `rateLimitWindow()`.
   - `ports/rate-limit-store.ts` (20 lines): `RateLimitStore` (`consume(request: RateLimitRequest): Promise<RateLimitDecision>`).
   - `adapters/memory-rate-limit-store.ts` (68 lines): `MemoryRateLimitStoreOptions` (`{ maxKeys?: number }`), `createMemoryRateLimitStore()`, rotating 32-entry scan (`counter.resetAt <= request.now`), key `JSON.stringify([request.key, request.windowMs])`.
   - `adapters/kv-rate-limit-store.ts` (69 lines): `KvRateLimitStoreOptions` (`{ prefix: KvKey; maxAttempts?: number }`), `createKvRateLimitStore()`, single-key `kv.get` + `kv.atomic`, key `[...prefix, request.key, request.windowMs, resetAt]`, zero-margin `expireIn: resetAt - request.now`.
   - `middleware/options.ts` (40 lines): `ServiceProxyTrust`, `ServiceRateLimitOptions` (currently fixed-window-only JSDoc on `limit` and `windowMs`).
   - `middleware/rate-limit-middleware.ts` (96 lines): calls `rateLimitWindow({ key: '', limit, windowMs, now: 0 })` at construction; computes `Retry-After` from `decision.resetAt`.
   - `mod.ts` (29 lines): subpath entrypoint `@netscript/service/rate-limit`.
   - `packages/service/mod.ts` (218 lines): root entrypoint re-exports `ServiceRateLimitOptions`, `ServiceProxyTrust`, `RateLimitStore`, `RateLimitRequest`, `RateLimitDecision` (lines 215–218).
   - `packages/service/src/builder/service-builder-impl.ts` (lines 310–313): `withRateLimit(options)` delegates directly to `this.use(createRateLimitMiddleware(options))`.

2. **Baseline test & doctrine status**:
   - Existing rate-limit tests (`rate-limit_test.ts`, `rate-limit-address-key_test.ts`, `client-address_test.ts`): 28 passed, 0 failed (561 ms).
   - `check-doctrine.ts --root packages/service`: `FAIL=0, WARN=5, INFO=1` (all pre-existing outside `src/rate-limit/`).
   - `audit-jsr-package.ts --root packages/service`: `dry-run: OK`, `slowTypeWarnings=1` (sanctioned oRPC-bound), 0 blocking findings.

3. **JSR surface & `deno doc --lint` pre-check (jsr-audit rubric)**:
   - Adding `readonly validate?: (config: RateLimitPolicyConfig) => void` to `RateLimitStore` means `packages/service/mod.ts` (which re-exports `RateLimitStore`) will reference `RateLimitPolicyConfig`. Under `deno doc --lint`, every type referenced by an exported symbol at an entrypoint must be exported by that entrypoint (avoiding `private-type-ref`). We must verify `deno task doc:lint --root packages/service --pretty` and re-export `type RateLimitPolicyConfig` on `packages/service/mod.ts` if required by `deno doc --lint` (recording any variance in `drift.md`).
   - All new exports (`RATE_LIMIT_POLICY_KINDS`, `RateLimitPolicyKind`, `RateLimitPolicy`, `RateLimitPolicyConfig`) must carry explicit `isolatedDeclarations`-compatible annotations (e.g. `export const RATE_LIMIT_POLICY_KINDS: readonly ['fixed-window', 'gcra'] = ['fixed-window', 'gcra'] as const;`), zero `any` / casts, and complete JSDoc with compiling `@example` fences.
   - Store logic stays completely transport-agnostic (imports only `domain/`, `ports/`, and `@netscript/kv` types; zero Hono or oRPC imports), so moving middleware into oRPC requires zero store rework.

4. **CI freshness & Redis test environment**:
   - `ci.yml` `quality` job checks `docs:accuracy`, `docs:jsdoc-examples`, `docs:readme-fences`, `check:agent-docs-prose`, `check:mcp-export-corpus`, `check:assets-barrel`, `check:publish-assets`, and `publish:dry-run`.
   - `ci.yml` `check-test-shard` starts `redis:7-alpine` with `NETSCRIPT_TEST_REDIS_URL=redis://127.0.0.1:6379` on all 6 test shards, and `packages/service/tests/` can import `@netscript/kv/redis` (already used in `packages/service/tests/signal-exit_test.ts`).
   - Gate 5b(b) (two-client `RedisKvAdapter` concurrency) and Gate 5b(c) (serialization-disjoint prefixes on `RedisKvAdapter`) can run in CI immediately under `NETSCRIPT_TEST_REDIS_URL`, while Gate 5b(a) (Redis `MULTI`/`EXEC` command-error rejection on `RedisKvAdapter`) is strictly blocked on #2648 (PR #2649) and tracked cleanly as sub-issue #2676.

## Open questions

None — all design trade-offs are locked in accepted RFC 0008 (`rfcs/0008-rolling-service-quotas.md`).
