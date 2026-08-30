# Context Pack: #1730 provider-invisibility regression guard

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `test-ai-request-context-provider-guard--1730` |
| Branch | `test/ai-request-context-provider-guard` |
| Current phase | `gate — final S4 content state; exact-head receipts pending` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `none` |

## Current State

S1 and S2 were accepted before this fresh implementation thread began. S3 narrows the Anthropic
wire test to direct adapter serialization and explicitly assigns mutation-A bridge/`modelOptions`
coverage to the TanStack seam. The focused suite is green 9/9 and the test remains below F-10 at
495 LOC. The branch converged once with `main` `3e5cbabf` via merge commit `2b4f7407`; there were no
conflicts and raw post-merge status was clean. This committed state is the final content surface;
only ignored exact-head receipts and external PR metadata may change afterward.

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
- Merged current `main` exactly once without conflict; chose merge to preserve pushed slice hashes
  and their structured PR comments.
- Confirmed there is no prior top-level #1730 receipt set to archive.

## In Progress

- Commit this final S4 evidence state, then cut and field-audit the named exact-head receipts.

## Next Steps

1. Cut the seven named top-level receipts at the final immutable content head.
2. Run the named exact-head JSR supplemental and audit every receipt's `argv`, `durationMs`,
   `gitHead`, and `actualGitHead`.
3. Recompute sufficiency over the named receipt set, prove lock/carrier/status hygiene, push/comment,
   and stop for Tier-A.

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
| Static | PENDING_RECEIPTS | Final content state is committed before receipt execution. |
| Fitness | S3 shape PASS | 495 LOC; exact-head quality/delta evidence pending receipts. |
| Runtime | S2 PASS | Named mutation-red 0/1; restored focused suite 9/9; product diff empty |
| Consumer | N/A | No public-surface change |

## Open Questions

- None in the locked plan.

## Drift and Debt

- Drift: none.
- Debt: none created or deepened; pre-existing diagnostics remain explicit baselines.

## Commits

- See the draft PR's commit list + per-slice PR comments (V3 retired `commits.md`).
