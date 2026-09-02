# Context Pack: `/design` production exclusion

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `design-route-prod-gate--plan` |
| Branch | `fix/design-route-prod-gate` |
| Current phase | `implement` — local rows complete; hosted CI and IMPL-EVAL pending |
| Archetype | 6 — CLI / Tooling |
| Scope overlays | Frontend |

## Current State

PLAN-EVAL passed for plan head `f8ed75b41`. RED step 1 is committed at `2754616b4`; GREEN source is `0fd04af6d`; canonical barrel regeneration is `0c1778026`; and the supervisor-requested mechanical merge of `origin/main` `ba6f1f49a` is `21ee63419`. All local scoped, freshness, quality, architecture, and four-carrier checks pass at the merged implementation head. Hosted RED/GREEN behavior remains pending under `ci:full` by constraint.

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

## In Progress

- Hosted `ci:full` accumulation and supervisor-dispatched separate-session IMPL-EVAL.

## Next Steps

1. Keep draft PR #1945 until hosted `behavior.app-reference` and `scaffold.design-production-exclusion` pass.
2. Supervisor dispatches separate-session IMPL-EVAL against the final pushed head.
3. Do not run hosted runtime E2E locally without a coordinator lease.

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
| Static | NOT_RUN | Explicitly deferred to implementation |
| Fitness | NOT_RUN | Explicitly deferred to implementation |
| Runtime | HOSTED_PENDING | Hosted only under `ci:full`; no local `e2e:cli`, Aspire, or Docker run |
| Consumer | NOT_RUN | Explicitly deferred to implementation |

## Open Questions

- None. PLAN-EVAL should verify the selected route-only build marker and runtime-signal independence.

## Drift and Debt

- Drift: D-1 adds the existing `packages/cli/e2e/suites/scaffold/capability-suites.ts` selector omitted from the plan file list; this is required for runtime-suite inclusion and remains inside authorized `packages/cli/**` scope.
- Debt: existing `scaffold-runtime-a8-f16-1333` remains open and is not deepened.

## Commits

- See the draft PR commit list and phase comments. The plan SHA will be recorded after commit.
