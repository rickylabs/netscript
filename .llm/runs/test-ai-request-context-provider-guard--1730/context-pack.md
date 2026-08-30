# Context Pack: #1730 provider-invisibility regression guard

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `test-ai-request-context-provider-guard--1730` |
| Branch | `test/ai-request-context-provider-guard` |
| Current phase | `impl — S2 complete, Tier-A review pending` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `none` |

## Current State

S2 is complete on top of S1 content head `fd5d0447`. The loop-level guard records the failed initial
attempt, successful retry, and post-tool continuation beneath `withRetryingChatClient`; every
recorded request keeps the identical `CONTEXT` reference while its provider-bound
`messages/system/tools/options` projection remains sentinel-free. Mutation B failed the named test,
the product mutation was restored, and the focused suite returned green. The run is stopped at the
owner-required Tier-A boundary before S3.

## Completed

- Read the required harness, tools, PR, RTK, doctrine, and JSR instructions.
- Re-baselined issue #1730 and the named test/loop/bridge surfaces against current `origin/main`;
  after a moving-base race, rebased and repeated the full candidate census at `952cc106`.
- Selected the authoritative Archetype 4 / Keep verdict.
- Locked the exhaustive provider-bound field list and test-only product ceiling.
- Baseline-ran every candidate gate. All are green except pre-existing doc-lint (128 private refs,
  0 missing JSDoc, exit 1), which is contracted as a delta.
- Recorded `PLAN-EVAL: N/A` with a mechanical-scope justification.
- Added the deterministic three-attempt retry/continuation recording provider in the owned test.
- Added the all-request, all-provider-bound-field absence assertion plus positive context identity.
- Demonstrated mutation B red in the named guard (0/1), restored `loop.ts`, and proved 9/9 green.
- Kept `request_context_test.ts` at 492 LOC; no product, lock, docs, README, or generated carrier
  moved.

## In Progress

- S2 explicit-refspec push, structured IMPL comment, and fresh Tier-A handoff.

## Next Steps

1. Stop for separate Tier-A substantive review of S2.
2. S3: rename and document the Anthropic adapter-wire test so it states its actual coverage.
3. Rerun the S3 focused proving gate and stop again for Tier-A before S4.

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
| `packages/ai/tests/request_context_test.ts` | modified | S2 retry/continuation provider-invisibility guard |
| `packages/ai/src/agent/loop.ts` | unchanged | Temporary mutation B restored; product diff is empty |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | Base classified | `research.md` / `worklog.md`; final S4 pending |
| Fitness | Base classified | `quality:gate` PASS; JSR/doc-lint baselines recorded |
| Runtime | S2 PASS | Named mutation-red 0/1; restored focused suite 9/9; product diff empty |
| Consumer | N/A | No public-surface change |

## Open Questions

- None in the plan. Fresh Tier-A review of S2 is the only continuation gate.

## Drift and Debt

- Drift: none.
- Debt: none created or deepened; pre-existing diagnostics remain explicit baselines.

## Commits

- See the draft PR's commit list + per-slice PR comments (V3 retired `commits.md`).
