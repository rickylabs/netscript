# Context Pack: `/design` production exclusion

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `design-route-prod-gate--plan` |
| Branch | `fix/design-route-prod-gate` |
| Current phase | `delta repair` — #1481/#1971 runtime green; current-main exact-head gates pending |
| Archetype | 6 — CLI / Tooling |
| Scope overlays | Frontend |

## Current State

PLAN-EVAL passed for plan head `f8ed75b41`; #1481 implementation is complete. #1971 landed through main and hosted run `33715250068` at exact head `98699f4bd` proves both runtime tiers green: PostgreSQL 102/102 and SQLite/Garnet 97/97, including `scaffold.design-production-exclusion` and `behavior.app-reference`. The remaining red was one stale core order assertion (5235 passed / 1 failed) that assumed no gate could sit between database codegen and the generated service-client contract. Current main `e14322c511` (#1956) is integrated with both product features preserved; D-2 records the bounded assertion repair.

## Completed

- Read required harness/CLI/Fresh/PR skills, harness activation/run loop/lane policy/plan gate, Archetype 6, frontend overlay, doctrine/tooling guidance, and the JSR audit rubric.
- Read issue #1481 and RFC 0005 §5 in full.
- Re-baselined branch/head and inspected repository evidence for `/design` intent.
- Confirmed Fresh Vite 1.1.2 supports `ignore?: RegExp[]`.
- Identified `generated.quality-negative` as the closest non-vacuous gate pattern.
- Accounted for open debt `scaffold-runtime-a8-f16-1333` by planning no new top-level scaffold-gate child.
- Wrote research, plan, design checkpoint, supervisor identity, context, and drift artifacts.
- Received separate-session `PASS_PLAN` at evaluator commit `5566a89f6`.
- Ran RED step 1 through the structured test wrapper; exit 1 is the expected evidence.
- Implemented GREEN step 3 and passed the focused E2E registration/order tests (32/32).
- Regenerated the embedded asset barrel through its generator; no lockfile changed.
- Mechanically merged `origin/main` `ba6f1f49a`, retained both concurrent scaffold gate IDs, and regenerated the conflicted barrel from merged sources.
- Passed the final local gate set at `21ee63419`: check 733 files; focused tests 88/88; lint/fmt 12 files each; freshness, quality, architecture, and four carrier checks all exit 0.
- Verified the corrected post-codegen gate order at `9630583c8` and reproduced the hosted product blocker locally with a fresh SQLite scaffold.
- Filed #1971 with raw before/after-codegen evidence, P0/milestone ownership, and the #1945 dependency.
- Merged exact `origin/main` `574e9ce57` as `9c1f8765e`; regenerated the sole conflicted carrier (`embedded.generated.ts`) and passed the exact post-sync CLI check (979 files) plus suite-registry test (20/20).
- Merged exact `origin/main` `5778d70bb` (including the #1971 fix in #1974 and cleanup-race fix #1979) as `bcb83330b`; retained both design-exclusion and service-client surfaces, regenerated the embedded carrier, and passed the fresh Tier-A preflight.

## In Progress

- Run fresh static/Tier-A receipts at the current-main merge head, push, obtain current-head hosted CI, then dispatch one separate-session delta IMPL-EVAL.

## Next Steps

1. Commit and run current-main exact-head scoped/Tier-A gates; push the immutable packet.
2. Confirm fresh core CI and both hosted runtime tiers at that head.
3. Dispatch a fresh separate-session delta IMPL-EVAL; on PASS, map #1481/#1971 acceptance and PR DoD with exact receipts.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| `/design` is development-only | `plan.md` § Decision | Scaffold inclusion is not a production reachability promise. |
| Both RFC exclusions land | `plan.md` § Locked mechanism | Vite build mode drives structural ignore; runtime env drives middleware refusal. |
| No production bypass now | `plan.md` § Decision | Future opt-in is deferred and must preserve independent acknowledgements. |
| Hosted gate uses mutation proof | `plan.md` § E2E gate | Plant route back, require detector failure, restore, clean rebuild. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/design-route-prod-gate--plan/supervisor.md` | new | Lane/session/baseline identity |
| `.llm/runs/design-route-prod-gate--plan/research.md` | new | Evidence and resolved questions |
| `.llm/runs/design-route-prod-gate--plan/plan.md` | new | Locked implementation plan |
| `.llm/runs/design-route-prod-gate--plan/worklog.md` | new | Design checkpoint and phase progress |
| `.llm/runs/design-route-prod-gate--plan/context-pack.md` | new | Resumable handoff |
| `.llm/runs/design-route-prod-gate--plan/drift.md` | new | Append-only drift state |
| `.llm/runs/design-route-prod-gate--plan/codex-thread-ids.md` | launcher-produced/new | Same-thread steering proof; preserved intact |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Plan-Gate | PASS | `plan-eval.md` at `5566a89f6`, evaluated plan head `f8ed75b41` |
| Static | PASS | Final local implementation set: check 733 files; focused tests 88/88; scoped lint/fmt 12/12 files; supervisor reorder adds an explicit after-`DATABASE_CODEGEN` order assertion |
| Fitness | PASS | `quality:gate`, explicit `arch:check`, asset freshness, and four-carrier checks exited 0 before hosted evaluation |
| Runtime | PASS_OLD_HEAD | Head `98699f4bd`: PostgreSQL job `100523051743` passed 102/102; SQLite/Garnet job `100523052025` passed 97/97; both include design exclusion and development reference behavior |
| Consumer | PASS_OLD_HEAD | Post-codegen production build and downstream browser reference gates pass in both hosted tiers; fresh current-main evidence pending |

## Open Questions

- None inside #1481/#1971. Fresh current-head validation/evaluation is procedural, not an open design decision.

## Drift and Debt

- Drift: D-1 adds the existing suite selector required for runtime inclusion. D-2 adds the existing service-client order test whose stale adjacency assertion conflicts with the intentional design gate. Both remain inside authorized `packages/cli/**` scope.
- Debt: existing `scaffold-runtime-a8-f16-1333` remains open and is not deepened.

## Commits

- See PR #1945's commit list and phase comments; the next docs-only head records this blocked handoff.
