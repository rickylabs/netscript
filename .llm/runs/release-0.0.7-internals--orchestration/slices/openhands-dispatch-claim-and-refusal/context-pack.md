# Context Pack: OpenHands dispatch claim and refusal

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `release-0.0.7-internals--orchestration/slices/openhands-dispatch-claim-and-refusal` |
| Branch | `fix/openhands-dispatch-claim-and-refusal` |
| Current phase | S1 complete; stopped for Tier-A slice review |
| Archetype | `6-cli-tooling` |
| Scope overlays | none |

## Current State

PLAN-EVAL passed in separate evaluator commit `e15d78588` against plan head `cea999d18`. S1 is the
only authorized implementation slice. Its RED/GREEN loop proves literal candidates reach the
trusted policy, the five reportable reasons are explicit, status/refusal markers stop recursion,
and controlled refusal replies are source-attributable, sanitized, command-token-free, and immune
to the watcher fallback verdict vocabulary. Durable `check` and `test` receipts pass at committed
head `4aa04de34`; `test` is the only receipt that behaviorally covers the leaf.

## Completed

- Bootstrap commit `ca2266ecb`; draft PR #1658 with only #1611/#1613 closing keywords.
- Live issue and source/test research at plan head `670e37bea`.
- Correct stop/rescope record for the invalid original envelope.
- Verification of the amended `leaf-contracts.json` at `feaf2da31`.
- Repaired plan, Design checkpoint, research resolution, and resolved drift entry.
- Separate PLAN-EVAL PASS at `e15d78588`.
- S1 targeted RED (exit 1 before exports existed) and GREEN (exit 0, 16/16 tests).
- S1 durable `check` PASS/0 and `test` PASS/0 receipts at `4aa04de34`.

## In Progress

- Nothing. S1 is being pushed/commented and this thread stops for Tier-A.

## Next Steps

1. Tier-A substantively reviews S1 and either requests a bounded repair or authorizes S2.
2. If authorized, begin S2 only; otherwise repair S1 without widening the envelope.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Optional `--phase plan|impl`; never `--head` | amendment `feaf2da31` | Formal mode is PR-only and live-head bound. |
| Non-formal PR/issue dispatch remains tuple-free | amendment `feaf2da31` | No formal plumbing leakage. |
| S1 precedes S4 because S4 consumes its policy API | evaluator N1 | Default-branch workflow/policy resolution means feature-branch intermediate commits do not affect live spend. |
| Generation retry is 5×1s | read-only phase workflow + amendment | Exhaustion becomes attributable denial. |
| PLAN-EVAL required | coordinator + harness | Not launched by this thread. |

## Exact Planned Implementation Files

1. `.github/scripts/openhands-comment-trigger.mjs`
2. `.github/scripts/openhands-comment-trigger.test.ts`
3. `.github/workflows/openhands-agent.yml`
4. `.llm/tools/agentic/lib/agentic-lib.ts`
5. `.llm/tools/agentic/lib/agentic-lib_test.ts`
6. `.llm/tools/agentic/openhands/dispatch-openhands.ts`
7. `.llm/tools/agentic/openhands/dispatch-openhands_test.ts`
8. `.llm/tools/agentic/openhands/phase-eval-workflow_test.ts`

`.github/workflows/openhands-phase-eval.yml` remains read-only precedent.

## Gates

| Gate | Current status | Evidence |
| --- | --- | --- |
| `check` | PASS | `receipts/slice-1/check.json`, exit 0 at `4aa04de34`; package/plugin selection does not cover S1 |
| `test` | PASS | `receipts/slice-1/test.json`, exit 0 at `4aa04de34`; 4,138 passed, 19 ignored, 0 failed; load-bearing |
| `quality-job` | NOT_RUN | not an S1 gate; scheduled for S4/S5 and not independent behavioral proof |
| JSR | N/A | no publishable surface |

## Open Questions

None.

## Drift and Debt

- Drift: original significant contract mismatch resolved by `feaf2da31` before implementation.
- Debt: none anticipated or created.

## Commits

- Draft PR #1658 commit list and phase comments are the trail.
