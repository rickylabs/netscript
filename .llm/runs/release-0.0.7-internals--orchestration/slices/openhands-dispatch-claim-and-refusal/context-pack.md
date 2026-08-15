# Context Pack: OpenHands dispatch claim and refusal

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `release-0.0.7-internals--orchestration/slices/openhands-dispatch-claim-and-refusal` |
| Branch | `fix/openhands-dispatch-claim-and-refusal` |
| Current phase | plan ready for Tier-A review; PLAN-EVAL required |
| Archetype | `6-cli-tooling` |
| Scope overlays | none |

## Current State

The coordinator resolved the prior contract blocker at central amendment `feaf2da31`. Research is
still current against immutable leaf baseline `7737d8903`; the plan now has an authoritative
eight-path edit surface, no open implementation decision, and five ordered slices. No implementation
or gate execution has started.

## Completed

- Bootstrap commit `ca2266ecb`; draft PR #1658 with only #1611/#1613 closing keywords.
- Live issue and source/test research at plan head `670e37bea`.
- Correct stop/rescope record for the invalid original envelope.
- Verification of the amended `leaf-contracts.json` at `feaf2da31`.
- Repaired plan, Design checkpoint, research resolution, and resolved drift entry.

## In Progress

- Nothing. This thread stops after committing/pushing the repaired plan and posting its PR comment.

## Next Steps

1. Tier-A coordinator substantively reviews the repaired plan.
2. Coordinator launches the required separate native opposite-family PLAN-EVAL.
3. Revise on `FAIL_PLAN`, or begin S1 only after `PASS`.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Optional `--phase plan|impl`; never `--head` | amendment `feaf2da31` | Formal mode is PR-only and live-head bound. |
| Non-formal PR/issue dispatch remains tuple-free | amendment `feaf2da31` | No formal plumbing leakage. |
| Marker exclusion and token-free refusal land before workflow broadening | `plan.md` S1/S4 | Prevents recursive or paid intermediate state. |
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
| `check` | NOT_RUN | planning-only turn |
| `test` | NOT_RUN | planning-only turn |
| `quality-job` | NOT_RUN | planning-only turn |
| JSR | N/A | no publishable surface |

## Open Questions

None.

## Drift and Debt

- Drift: original significant contract mismatch resolved by `feaf2da31` before implementation.
- Debt: none anticipated or created.

## Commits

- Draft PR #1658 commit list and phase comments are the trail.
