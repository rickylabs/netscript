# Context Pack: OpenHands dispatch claim and refusal

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `release-0.0.7-internals--orchestration/slices/openhands-dispatch-claim-and-refusal` |
| Branch | `fix/openhands-dispatch-claim-and-refusal` |
| Current phase | S5 complete; stopped for Tier-A final slice review |
| Archetype | `6-cli-tooling` |
| Scope overlays | none |

## Current State

Tier-A signed off S4 at `ad19d0e20` with no changes. Evidence-only S5 is complete: final `check`,
`test`, and `quality-job` receipts all PASS at immutable checkpoint `1390d3ead`, which remains
reachable from the branch head. Root `test` is the only behavioral proof (4,147 passed, 19 ignored,
0 failed); `check` and `quality-job` are required but non-covering package/plugin receipts. The DoD
truth audit finds rows 1–7 evidence-ready and row 8 open solely because separate-session IMPL-EVAL
has not run. The draft PR body and lifecycle state were deliberately not changed.

## Completed

- Bootstrap commit `ca2266ecb`; draft PR #1658 with only #1611/#1613 closing keywords.
- Live issue and source/test research at plan head `670e37bea`.
- Correct stop/rescope record for the invalid original envelope.
- Verification of the amended `leaf-contracts.json` at `feaf2da31`.
- Repaired plan, Design checkpoint, research resolution, and resolved drift entry.
- Separate PLAN-EVAL PASS at `e15d78588`.
- S1 targeted RED (exit 1 before exports existed) and GREEN (exit 0, 16/16 tests).
- S1 durable `check` PASS/0 and `test` PASS/0 receipts at `4aa04de34`.
- Tier-A S1 sign-off commit `6f725ad3b`.
- S2 targeted RED (exit 1 before the tuple surface existed) and GREEN (exit 0, 75/75 tests).
- S2 durable `check` PASS/0 and `test` PASS/0 receipts at `28a8a9184`.
- Tier-A S2 sign-off commit `0886c2427`.
- S3 targeted RED (exit 1 before the injected runner existed) and GREEN (exit 0, 80/80 tests).
- S3 durable `check` PASS/0 and `test` PASS/0 receipts at `d7fdbb1d9`.
- Tier-A S3 sign-off commit `d3d31b3d0`.
- S4 targeted RED (exit 1; 7 passed / 3 failed before workflow helpers) and focused GREEN (exit 0;
  policy + workflow suites 26/26).
- S4 durable `check`, `test`, and `quality-job` PASS/0 receipts at `9b71e1bd2`; root test reported
  4,147 passed, 19 ignored, 0 failed.
- Tier-A S4 sign-off commit `ad19d0e20`.
- S5 same-head final `check`, `test`, and `quality-job` PASS receipts at `1390d3ead`.
- DoD row-by-row and N1–N5 disposition audit recorded in `worklog.md`.

## In Progress

- Nothing. S5 is complete and stopped for Tier-A.

## Next Steps

1. Tier-A substantively reviews S5 evidence and either requests a run-artifact repair or signs off.
2. Coordinator launches separate-session IMPL-EVAL after Tier-A; this thread must not trigger it.
3. Coordinator/evaluator owns PR-body checkboxes and the later lifecycle transition.

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

| Slice | Gate | Current status | Evidence |
| --- | --- | --- | --- |
| S1 | `check` | PASS | `receipts/slice-1/check.json`, exit 0 at `4aa04de34`; package/plugin selection does not cover S1 |
| S1 | `test` | PASS | `receipts/slice-1/test.json`, exit 0 at `4aa04de34`; 4,138 passed, 19 ignored, 0 failed; load-bearing |
| S1 | `quality-job` | NOT_RUN | not an S1 gate; scheduled for S4/S5 and not independent behavioral proof |
| S2 | `check` | PASS | `receipts/slice-2/check.json`, cached exit 0 at `28a8a9184`; package/plugin selection does not cover S2 |
| S2 | `test` | PASS | `receipts/slice-2/test.json`, exit 0 at `28a8a9184`; 4,140 passed, 19 ignored, 0 failed; load-bearing |
| S2 | `quality-job` | NOT_RUN | not an S2 gate; scheduled for S4/S5 and not independent behavioral proof |
| S3 | `check` | PASS | `receipts/slice-3/check.json`, exit 0 at `d7fdbb1d9`; package/plugin selection does not cover S3 |
| S3 | `test` | PASS | `receipts/slice-3/test.json`, exit 0 at `d7fdbb1d9`; 4,145 passed, 19 ignored, 0 failed; load-bearing |
| S3 | `quality-job` | NOT_RUN | not an S3 gate; scheduled for S4/S5 and not independent behavioral proof |
| S4 | `check` | PASS | `receipts/slice-4/check.json`, exit 0 at `9b71e1bd2`; package/plugin selection does not cover S4 |
| S4 | `test` | PASS | `receipts/slice-4/test.json`, exit 0 at `9b71e1bd2`; 4,147 passed, 19 ignored, 0 failed; load-bearing |
| S4 | `quality-job` | PASS | `receipts/slice-4/quality-job.json`, exit 0 at `9b71e1bd2`; non-covering package/plugin quality inputs |
| S5 | `check` | PASS | `receipts/slice-5/check.json`, exit 0 at `1390d3ead`; cached package/plugin selection does not cover leaf |
| S5 | `test` | PASS | `receipts/slice-5/test.json`, exit 0 at `1390d3ead`; 4,147 passed, 19 ignored, 0 failed; load-bearing |
| S5 | `quality-job` | PASS | `receipts/slice-5/quality-job.json`, exit 0 at `1390d3ead`; required but non-covering package/plugin inputs |
| all | JSR | N/A | no publishable surface |

## Open Questions

None.

## Drift and Debt

- Drift: original significant contract mismatch resolved by `feaf2da31` before implementation.
- Debt: none anticipated or created.

## Commits

- Draft PR #1658 commit list and phase comments are the trail.
