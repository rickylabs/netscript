# Context Pack: fresh/sdk cache-tier convergence

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-fresh-cache-tier-convergence--1252` |
| Branch | `fix/fresh-cache-tier-convergence` |
| Current phase | `implement` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `frontend` |

## Current State

S1 is implemented and locally green: server-side generated query options share the action's
CacheQuery entry and browser query options remain direct when no provider is registered. D6
explicitly composes evaluation through draft→ready augment/OpenHands/orchestrator gates instead of
local PLAN-EVAL.

## Completed

- Activated required harness/doctrine/PR/Fresh/tooling/JSR skills.
- Read harness workflow, Archetype 4, frontend overlay, doctrine public-surface/folder/fitness rules.
- Read issue body plus corrective comments and the full three-file reference patch.
- Fast-forwarded, then rebased branch to current `origin/main` `26fe0da9b`.
- Recorded pre-existing `deno.lock` ownership and JSR/doc baseline findings.
- Locked research, plan, Design checkpoint, and composed-waiver artifact.
- S1 RED reproduced the bypass at the second read, then 3 focused tests and the 77-file SDK scoped
  check passed after implementation.

## In Progress

- S1 sign-off commit, push, and PR slice evidence.

## Next Steps

1. Write S2 Fresh timestamp/first-paint RED tests, implement mount reconciliation, and green them.
2. Write S3 standard invalidation endpoint RED integration, implement server/client seam, and green it.
3. Run S4 scoped/quality/JSR no-deepening gates and prepare draft→ready evaluation handoff.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Server → hydration → client precedence | owner contract; plan D2/D3 | initial data wins once; later client state wins |
| Conditional server cache use | plan D1 | browser remains direct when no provider is registered |
| Framework-owned invalidation HTTP edge | plan D5 | default standard path; path override/opt-out |
| No local PLAN-EVAL | owner D6 | composed gate only; no fake evaluator verdict |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-fresh-cache-tier-convergence--1252/*` | new | S0 harness artifacts |
| `packages/sdk/src/query-client/types.ts` | changed | cache-policy contract for query options |
| `packages/sdk/src/query/query-factory.ts` | changed | cache-aware server/direct browser queryFn selection |
| `packages/sdk/src/query/mod.ts` | changed | public environment-aware semantics |
| `packages/sdk/src/ports/query-factory.ts` | changed | public action method documentation |
| `packages/sdk/tests/query/query-factory_test.ts` | changed | RED regression + browser safeguard |
| `deno.lock` | pre-existing/unowned | never stage, revert, or attribute |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | S1 PASS | SDK focused tests + 77-file scoped check |
| Fitness | baseline recorded | Fresh/SDK JSR audits |
| Runtime | pending | S2/S3 RED-first tests |
| Consumer | pending | targeted package checks/tests |

## Open Questions

- None that would force implementation rework. Deferred auth/dehydration extensions are explicit.

## Drift and Debt

- Drift: branch lag, D6 evaluator composition, pre-existing lock edit, and pre-existing audit debt recorded.
- Debt: no new entry planned; any unsafe incomplete absorption becomes an honest 0.0.6 partial.

## Commits

- See the draft PR's commit list + per-slice PR comments after S0.
