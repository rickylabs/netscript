# Context Pack: fresh/sdk cache-tier convergence

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-fresh-cache-tier-convergence--1252` |
| Branch | `fix/fresh-cache-tier-convergence` |
| Current phase | `plan` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `frontend` |

## Current State

Issue #1252 and Pulseboard `56accbb` have been read. Current main is re-baselined, the contract and
four green commit slices are locked, and no implementation source has been edited. D6 explicitly
composes evaluation through draft→ready augment/OpenHands/orchestrator gates instead of local
PLAN-EVAL.

## Completed

- Activated required harness/doctrine/PR/Fresh/tooling/JSR skills.
- Read harness workflow, Archetype 4, frontend overlay, doctrine public-surface/folder/fitness rules.
- Read issue body plus corrective comments and the full three-file reference patch.
- Fast-forwarded branch to current `origin/main` `9bcfd18f2`.
- Recorded pre-existing `deno.lock` ownership and JSR/doc baseline findings.
- Locked research, plan, Design checkpoint, and composed-waiver artifact.

## In Progress

- S0 bootstrap commit, explicit refspec push, and draft PR creation.

## Next Steps

1. Commit only run artifacts (exclude `deno.lock`), push explicit refspec, open labeled draft PR.
2. Write S1 SDK RED test, capture failure, implement cache-aware server `queryOptions`, and green it.
3. Write S2 Fresh timestamp/first-paint RED tests, implement mount reconciliation, and green them.
4. Write S3 standard invalidation endpoint RED integration, implement server/client seam, and green it.
5. Run S4 scoped/quality/JSR no-deepening gates and prepare draft→ready evaluation handoff.

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
| `deno.lock` | pre-existing/unowned | never stage, revert, or attribute |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | baseline recorded | structured Fresh/SDK doc lint |
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

