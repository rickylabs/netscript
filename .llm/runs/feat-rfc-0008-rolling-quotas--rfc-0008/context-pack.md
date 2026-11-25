# Context Pack: RFC 0008 — Opt-in rolling quotas for protected service reads

## Run Metadata

| Field          | Value                                            |
| -------------- | ------------------------------------------------ |
| Run ID         | `feat-rfc-0008-rolling-quotas--rfc-0008`         |
| Branch         | `feat/rfc-0008-rolling-quotas`                   |
| Current phase  | `impl-eval`                                      |
| Archetype      | `4 - Public DSL / Builder`                       |
| Scope overlays | `SCOPE-service.md`, `SCOPE-docs.md`              |

## Current State

All S1 (`#2675`) implementation slices, tests (Gates 1–4, 5a, 5b(b)–(c), 6a–6b, 7–8, 9a–9b, 10),
docs updates, and generated MCP/agent-docs corpora are implemented and locally verified green.
Ready to push, open PR for `#2675` (`Part of #2653`), and dispatch separate-session Claude Fable 5.2
IMPL-EVAL (`effort: high`, `isolation: 'worktree'`).

## Completed

- Bootstrap, research, plan, and design checkpoint (`4b26b7dfc`) with native sub-issues `#2675` (S1) and `#2676` (S2) under `#2653` (milestone `0.0.10`).
- Core GCRA domain (`domain/gcra.ts`), policy types & validation (`domain/rate-limit.ts`), startup validation port (`ports/rate-limit-store.ts`), transport-agnostic memory/KV store adapters, middleware startup validation + `Retry-After` (`retryAt ?? resetAt`), and exports (`f7d675e20`).
- Full RFC 0008 verification suite (`07734cc04`): 668/668 tests passing in `packages/service/tests/` (existing `rate-limit_test.ts` and `rate-limit-address-key_test.ts` unmodified).
- Service README, docs site reference/how-to (`5e4cb3916`), and regenerated MCP export/agent-docs/publish-assets corpora.
- Full local validation green: scoped check/lint/fmt, `doc:lint` (8/8 entrypoints), `docs:jsdoc-examples`, `docs:readme-fences`, `docs:accuracy`, `docs:links`, `quality:gate`, `audit-jsr-package.ts`, `deno publish --dry-run --allow-dirty`, corpus freshness checks, and zero `deno.lock` churn.

## In Progress

- Pushing branch, opening PR for `#2675`, CI checks, and Claude Fable 5.2 IMPL-EVAL.

## Next Steps

1. Commit regenerated corpora + updated run artifacts, push `feat/rfc-0008-rolling-quotas`, open PR (`Closes #2675`, `Part of #2653`), and link PR.
2. Dispatch separate-session Claude Fable 5.2 IMPL-EVAL (`effort: high`, `isolation: 'worktree'`).
3. Address any findings if raised; once IMPL-EVAL PASSES at exact head and CI + `close-gate` + `check:review-threads` are green, merge with `--squash --match-head-commit` and report to coordinator.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| `PLAN-EVAL: N/A` | `run-loop.md` §4 / RFC 0008 PR #2656 | Accepted RFC already passed DESIGN-EVAL + Fable 5.2 PLAN-EVAL APPROVED. |
| Split `#2653` into `#2675` (S1) + `#2676` (S2) | RFC 0008 Gate 5b & Non-goals | Prerequisite `#2648` is open; S1 delivers all non-`#2648` scope and keeps `#2653` open. |
| Re-export `type RateLimitPolicyConfig` on `packages/service/mod.ts` | `deno doc --lint` | Keeps standalone `./mod.ts` at 0 `private-type-ref`. |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| `packages/service/src/rate-limit/domain/gcra.ts` | new | Pure exact-BigInt GCRA domain logic, retention constants, state parser, fallbacks |
| `packages/service/src/rate-limit/domain/rate-limit.ts` | changed | `RATE_LIMIT_POLICY_KINDS`, `RateLimitPolicyKind`, `RateLimitPolicy`, `RateLimitDecision.retryAt`, validation |
| `packages/service/src/rate-limit/ports/rate-limit-store.ts` | changed | `RateLimitPolicyConfig`, optional `RateLimitStore.validate?` |
| `packages/service/src/rate-limit/adapters/memory-rate-limit-store.ts` | changed | Opt-in GCRA policy, `validate()`, skew-bounded eviction, byte-for-byte fixed-window default |
| `packages/service/src/rate-limit/adapters/kv-rate-limit-store.ts` | changed | Opt-in GCRA policy, zero-IO `validate()`, single-key CAS + fixed skew retention, zero-margin fixed-window default |
| `packages/service/src/rate-limit/middleware/options.ts` | changed | Policy-aware JSDoc for `limit` and `windowMs` |
| `packages/service/src/rate-limit/middleware/rate-limit-middleware.ts` | changed | Startup `store.validate?.({ limit, windowMs })` and `retryAt ?? resetAt` `Retry-After` |
| `packages/service/src/rate-limit/mod.ts` | changed | Exports policy types/constants and `RateLimitPolicyConfig` |
| `packages/service/mod.ts` | changed | Transitive `type RateLimitPolicyConfig` re-export for `deno doc --lint` |
| `packages/service/tests/rate-limit-gcra-*.ts` | new | 4 focused test files covering Gates 1–10 |
| `packages/service/README.md`, `docs/site/reference/service/index.md`, `docs/site/services-sdk/how-to/protect-an-anonymous-route.md` | changed | Rolling quota documentation and reference table |
| `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts`, `packages/mcp/src/infrastructure/docs/agent-docs-prose.generated.ts`, `packages/mcp/src/publish-assets.generated.ts` | changed | Regenerated MCP/docs corpora |
| `.llm/runs/feat-rfc-0008-rolling-quotas--rfc-0008/*` | new | Harness run artifacts |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static      | PASS           | Scoped check/lint/fmt (136/136), `doc:lint` (8/8), `docs:jsdoc-examples`, `docs:readme-fences`, `docs:accuracy`, `docs:links`, `publish:dry-run` |
| Fitness     | PASS           | `quality:gate` (`quality:scan` + `arch:check`), `audit-jsr-package.ts` |
| Runtime     | PASS           | 668/668 tests in `packages/service/tests/` (`rate-limit_test.ts` + `rate-limit-address-key_test.ts` unmodified) |
| Consumer    | PASS           | `check:mcp-export-corpus`, `check:agent-docs-prose`, `check:publish-assets`, `release-embedded-docs-corpus_test.ts` (4/4) |

## Open Questions

- None.

## Drift and Debt

- Drift: minor — owner model/evaluator override, T3 dispatch, and transitive `RateLimitPolicyConfig` export on `packages/service/mod.ts` recorded in `drift.md`.
- Debt: none.

## Commits

- See the PR's commit list + per-slice PR comments (V3 retired `commits.md`).
