# Context Pack: `/design` production exclusion

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `design-route-prod-gate--plan` |
| Branch | `fix/design-route-prod-gate` |
| Current phase | `implement` — RED expectations landed locally |
| Archetype | 6 — CLI / Tooling |
| Scope overlays | Frontend |

## Current State

PLAN-EVAL passed for plan head `f8ed75b41`. The first implementation step is RED: focused tests now specify the middleware, Vite ignore, emitted file, and hosted gate registration/order contracts, and the structured wrapper fails on the deliberately missing asset key and gate ID.

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

## In Progress

- Commit RED step 1, then record hosted RED as pending without running local runtime E2E.

## Next Steps

1. Record hosted production RED as `HOSTED_PENDING`; do not run `e2e:cli` locally.
2. Implement manifest/load/write, middleware, Vite ignore, and hosted mutation probe.
3. Regenerate `embedded.generated.ts` only through `deno task gen:assets-barrel`.
4. Run local validation rows 1–7 plus the four-carrier pre-push chain.
5. Stop on the final implementation head for supervisor-triggered hosted CI and IMPL-EVAL.

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
| Runtime | NOT_RUN | Hosted only under `ci:full` with coordinator lease |
| Consumer | NOT_RUN | Explicitly deferred to implementation |

## Open Questions

- None. PLAN-EVAL should verify the selected route-only build marker and runtime-signal independence.

## Drift and Debt

- Drift: none at plan time.
- Debt: existing `scaffold-runtime-a8-f16-1333` remains open and is not deepened.

## Commits

- See the draft PR commit list and phase comments. The plan SHA will be recorded after commit.
