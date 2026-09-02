# Context Pack: `/design` production exclusion

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `design-route-prod-gate--plan` |
| Branch | `fix/design-route-prod-gate` |
| Current phase | `plan` — ready for separate-session PLAN-EVAL |
| Archetype | 6 — CLI / Tooling |
| Scope overlays | Frontend |

## Current State

Issue #1481 is fully researched and planned against `origin/main` `850cc7757`. The plan rules `/design` a developer-only reference, delivers both RFC 0005 exclusions, and adds a hosted mutation-proved production-build gate. No implementation or implementation gate has run.

## Completed

- Read required harness/CLI/Fresh/PR skills, harness activation/run loop/lane policy/plan gate, Archetype 6, frontend overlay, doctrine/tooling guidance, and the JSR audit rubric.
- Read issue #1481 and RFC 0005 §5 in full.
- Re-baselined branch/head and inspected repository evidence for `/design` intent.
- Confirmed Fresh Vite 1.1.2 supports `ignore?: RegExp[]`.
- Identified `generated.quality-negative` as the closest non-vacuous gate pattern.
- Accounted for open debt `scaffold-runtime-a8-f16-1333` by planning no new top-level scaffold-gate child.
- Wrote research, plan, design checkpoint, supervisor identity, context, and drift artifacts.

## In Progress

- Commit/push plan artifacts and open the structured draft PR.

## Next Steps

1. Supervisor dispatches a fresh native opposite-family PLAN-EVAL against the reported plan SHA.
2. If and only if the verdict is `PASS`, resume this same implementation lane/thread.
3. Implement the single atomic slice in the plan’s RED/GREEN order.
4. Run scoped gates; obtain hosted `ci:full` `scaffold.runtime` evidence through the coordinator lease.
5. Dispatch mandatory separate-session IMPL-EVAL.

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
| Plan-Gate | PENDING | Must be a separate session on this plan SHA |
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
