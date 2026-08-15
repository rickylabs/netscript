# Context Pack: OpenHands dispatch claim and refusal

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `release-0.0.7-internals--orchestration/slices/openhands-dispatch-claim-and-refusal` |
| Branch | `fix/openhands-dispatch-claim-and-refusal` |
| Current phase | implementation S1; awaiting durable gates and Tier-A slice review |
| Archetype | `6-cli-tooling` |
| Scope overlays | none |

## Current State

PLAN-EVAL passed in separate evaluator commit `e15d78588` against plan head `cea999d18`. S1 is the
only authorized implementation slice. Its RED/GREEN loop now proves literal candidates reach the
trusted policy, the five reportable reasons are explicit, status/refusal markers stop recursion,
and controlled refusal replies are source-attributable, sanitized, command-token-free, and immune
to the watcher fallback verdict vocabulary. Durable gates and the S1 evidence handoff remain.

## Completed

- Bootstrap commit `ca2266ecb`; draft PR #1658 with only #1611/#1613 closing keywords.
- Live issue and source/test research at plan head `670e37bea`.
- Correct stop/rescope record for the invalid original envelope.
- Verification of the amended `leaf-contracts.json` at `feaf2da31`.
- Repaired plan, Design checkpoint, research resolution, and resolved drift entry.
- Separate PLAN-EVAL PASS at `e15d78588`.
- S1 targeted RED (exit 1 before exports existed) and GREEN (exit 0, 16/16 tests).

## In Progress

- Commit S1, produce durable receipts at the committed head, then push/comment and stop for Tier-A.

## Next Steps

1. Record S1 durable `check` and `test` receipts and the truthful coverage distinction.
2. Push S1 and post its scoped PR evidence comment.
3. Stop for Tier-A substantive slice review; do not begin S2.

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
| `check` | NOT_RUN | durable S1 receipt pending committed head; does not select this leaf |
| `test` | targeted GREEN | structured wrapper exit 0, 16/16; durable S1 receipt pending |
| `quality-job` | NOT_RUN | planning-only turn |
| JSR | N/A | no publishable surface |

## Open Questions

None.

## Drift and Debt

- Drift: original significant contract mismatch resolved by `feaf2da31` before implementation.
- Debt: none anticipated or created.

## Commits

- Draft PR #1658 commit list and phase comments are the trail.
