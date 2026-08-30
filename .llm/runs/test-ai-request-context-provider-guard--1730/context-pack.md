# Context Pack: #1730 provider-invisibility regression guard

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `test-ai-request-context-provider-guard--1730` |
| Branch | `test/ai-request-context-provider-guard` |
| Current phase | `impl — S3 complete; convergence and S4 pending` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `none` |

## Current State

S1 and S2 were accepted before this fresh implementation thread began. S3 now narrows the Anthropic
wire test to its actual boundary: direct adapter serialization. Its comment explicitly assigns
bridge/`modelOptions` leakage (mutation A) to the TanStack seam test because the Anthropic adapter
drops unsupported model options. The focused suite is green 9/9 and the test remains below F-10 at
495 LOC. The branch still needs its one documented `main` convergence before final S4 receipts.

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
- Recorded the owner-provided independent acceptance of S2 without repeating its demonstration.
- Renamed/documented the Anthropic test as direct adapter-serialization coverage; the TanStack seam
  remains the mutation-A detector.
- Kept `request_context_test.ts` at 495 LOC; no product, lock, docs, README, or generated carrier
  moved.

## In Progress

- S3 commit, explicit-refspec push, structured IMPL comment, then the documented `main`
  convergence point before S4.

## Next Steps

1. Commit/push/comment S3.
2. Integrate `origin/main` once and record the chosen strategy.
3. Land the final evidence artifact state, then cut and audit named exact-head S4 receipts.

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
| Static | S3 focused PASS | Focused structured test 9/9 and format PASS; final S4 pending. |
| Fitness | S3 shape PASS | 495 LOC; `quality:gate` and full exact-head set pending S4. |
| Runtime | S2 PASS | Named mutation-red 0/1; restored focused suite 9/9; product diff empty |
| Consumer | N/A | No public-surface change |

## Open Questions

- None in the locked plan.

## Drift and Debt

- Drift: none.
- Debt: none created or deepened; pre-existing diagnostics remain explicit baselines.

## Commits

- See the draft PR's commit list + per-slice PR comments (V3 retired `commits.md`).
