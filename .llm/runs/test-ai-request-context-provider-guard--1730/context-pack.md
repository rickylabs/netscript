# Context Pack: #1730 provider-invisibility regression guard

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `test-ai-request-context-provider-guard--1730` |
| Branch | `test/ai-request-context-provider-guard` |
| Current phase | `IMPL-EVAL repair R1 — content ready; exact-head receipt re-cut pending` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `none` |

## Current State

S1–S4 remain Tier-A accepted. The separate-session IMPL-EVAL evidence commit `6977debd` returned
`FAIL_FIX` for one bounded hole: the loop guard ignored `ChatClientCallOptions`. R1 now records the
second `stream()` argument and projects every call-option field except `signal`; mutation B2 makes
the named guard red, then reverts to a 9/9 green focused suite. The test is 498 LOC. The optional
model-ID path is documented as incidentally owned by the existing basic single-text-turn loop test.

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
- Read the immutable IMPL-EVAL record first and repaired only F-1 through the existing test seam.
- Demonstrated mutation B2 red in the named guard (0/1, 1115 ms), restored product source, and
  proved the focused test file green (9/9, 212 ms).
- Corrected the durable prior-head receipt audit: the publish receipt is the root workspace task,
  attempt 2 at 30,719 ms, not a 150 ms package-cwd run.

## In Progress

- Commit R1's test and durable evidence state, then replace and field-audit the named receipts.

## Next Steps

1. Run the bounded green gates, prove the product/lock/carrier hygiene, and commit R1.
2. Cut the seven explicitly named top-level receipts at the immutable R1 head and audit each
   receipt's `argv`, `cwd`, `attempt`, `durationMs`, `gitHead`, and `actualGitHead`.
3. Push by explicit refspec, post one structured repair-slice comment, and stop for Tier-A.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Assert `messages/system/tools/options` minus `context`. | `plan.md` D1 | Exhaustive owned-request projection. |
| Record inner attempts under retry wrapper. | `plan.md` D3 | Covers initial, retry, continuation. |
| Rename/document Anthropic coverage. | `plan.md` D5 | TanStack seam remains mutation-A guard. |
| Project both `stream()` arguments. | IMPL-EVAL F-1 | Keep request `context` and call `signal` out; inspect every provider-bound field. |
| Document model-ID's incidental owner. | IMPL-EVAL F-2 | Avoid extra fixture surface while naming the existing detecting test. |
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
| Static | RE-CUT_PENDING | R1 content state must be committed before replacement receipt execution. |
| Fitness | R1 shape PASS | 498 LOC; exact-head quality/delta evidence pending receipts. |
| Runtime | R1 PASS | B2 named mutation-red 0/1; restored focused suite 9/9; product diff empty |
| Consumer | N/A | No public-surface change |

## Open Questions

- None in the locked plan.

## Drift and Debt

- Drift: none.
- Debt: none created or deepened; pre-existing diagnostics remain explicit baselines.

## Commits

- See the draft PR's commit list + per-slice PR comments (V3 retired `commits.md`).
