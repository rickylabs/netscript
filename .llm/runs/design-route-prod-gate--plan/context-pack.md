# Context Pack: `/design` production exclusion

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `design-route-prod-gate--plan` |
| Branch | `fix/design-route-prod-gate` |
| Current phase | `implement repair` — #1481 code complete; hosted gate blocked by #1971 |
| Archetype | 6 — CLI / Tooling |
| Scope overlays | Frontend |

## Current State

PLAN-EVAL passed for plan head `f8ed75b41`; #1481 implementation is complete. Supervisor repair `de4d31b69` correctly places the design-production gate after `DATABASE_CODEGEN`, and branch head `9630583c8` includes current `main`. Both hosted runtime tiers now fail only at `scaffold.design-production-exclusion` because generated Fresh apps map `zod` to bare `catalog:`, which Vite cannot load after database codegen makes that route import reachable. Product remediation is deliberately split to release blocker #1971; stack #1971 → #1945.

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

## In Progress

- #1945 is merge-blocked on #1971; no source workaround belongs on this branch.

## Next Steps

1. Land #1971 without changing #1945's correct post-codegen gate order.
2. Sync the #1971 fix into #1945 and rerun PostgreSQL + SQLite hosted runtime tiers.
3. Only after both tiers and `behavior.app-reference` pass, dispatch a fresh separate-session IMPL-EVAL.

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
| Runtime | FAIL_BLOCKED | Head `9630583c8`: PostgreSQL job `100484648723` and SQLite job `100484648739` each report 20 passed / 1 failed only at `scaffold.design-production-exclusion`; blocker #1971 |
| Consumer | BLOCKED | The post-codegen Fresh production build cannot complete until #1971 resolves Vite loading `catalog:` |

## Open Questions

- None inside #1481. The Vite/catalog product fix is explicitly owned by #1971.

## Drift and Debt

- Drift: D-1 adds the existing `packages/cli/e2e/suites/scaffold/capability-suites.ts` selector omitted from the plan file list; this is required for runtime-suite inclusion and remains inside authorized `packages/cli/**` scope.
- Debt: existing `scaffold-runtime-a8-f16-1333` remains open and is not deepened.

## Commits

- See PR #1945's commit list and phase comments; the next docs-only head records this blocked handoff.
