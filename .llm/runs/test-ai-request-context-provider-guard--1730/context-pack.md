# Context Pack: #1730 provider-invisibility regression guard

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `test-ai-request-context-provider-guard--1730` |
| Branch | `test/ai-request-context-provider-guard` |
| Current phase | `plan` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `none` |

## Current State

S1 research and the locked plan are complete at base `952cc106`. No implementation file has been
edited. The run is stopped at the owner-required Tier-A boundary before S2.

## Completed

- Read the required harness, tools, PR, RTK, doctrine, and JSR instructions.
- Re-baselined issue #1730 and the named test/loop/bridge surfaces against current `origin/main`;
  after a moving-base race, rebased and repeated the full candidate census at `952cc106`.
- Selected the authoritative Archetype 4 / Keep verdict.
- Locked the exhaustive provider-bound field list and test-only product ceiling.
- Baseline-ran every candidate gate. All are green except pre-existing doc-lint (128 private refs,
  0 missing JSDoc, exit 1), which is contracted as a delta.
- Recorded `PLAN-EVAL: N/A` with a mechanical-scope justification.

## In Progress

- S1 commit, explicit-refspec push, draft PR creation, metadata, and structured PLAN comment.

## Next Steps

1. Stop for separate Tier-A substantive review of S1.
2. S2: implement the every-request retry+continuation guard.
3. Apply mutation B, capture the named red test and output, restore `loop.ts`, and prove green.
4. Stop for Tier-A before S3.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Assert `messages/system/tools/options` minus `context`. | `plan.md` D1 | Exhaustive owned-request projection. |
| Record inner attempts under retry wrapper. | `plan.md` D3 | Covers initial, retry, continuation. |
| Rename/document Anthropic coverage. | `plan.md` D5 | TanStack seam remains mutation-A guard. |
| Product ceiling is one test file. | `plan.md` | Temporary loop mutation must never be staged. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/test-ai-request-context-provider-guard--1730/*` | new | S1 research/plan/design/handoff artifacts |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | Base classified | `research.md` / `worklog.md`; final S4 pending |
| Fitness | Base classified | `quality:gate` PASS; JSR/doc-lint baselines recorded |
| Runtime | Pending | S2 mutation + retry/continuation proof |
| Consumer | N/A | No public-surface change |

## Open Questions

- None in the plan. Tier-A review is the only continuation gate.

## Drift and Debt

- Drift: none.
- Debt: none created or deepened; pre-existing diagnostics remain explicit baselines.

## Commits

- See the draft PR's commit list + per-slice PR comments (V3 retired `commits.md`).
