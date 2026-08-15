# Context Pack: OpenHands dispatch claim and refusal

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `release-0.0.7-internals--orchestration/slices/openhands-dispatch-claim-and-refusal` |
| Branch | `fix/openhands-dispatch-claim-and-refusal` |
| Current phase | plan blocked before PLAN-EVAL |
| Archetype | `6-cli-tooling` |
| Scope overlays | none |

## Current State

Bootstrap and live research are complete. Draft PR #1658 targets `main` at immutable baseline
`7737d8903`. The frozen four-file contract is insufficient: it excludes the real dispatch CLI that
must supply phase/head and excludes directly affected tests required by live acceptance. No valid
implementation-authoritative plan exists until the coordinator rescope is explicit.

## Completed

- Verified worktree, branch, baseline, and pre-existing coordinator thread metadata.
- Bootstrap commit `ca2266ecb` pushed with explicit refspec.
- Draft PR #1658 opened with closing keywords only for #1611 and #1613, requested labels, and
  milestone `0.0.7`.
- Live issues and baseline source/tests researched with exact line evidence in `research.md`.
- Blocked Design checkpoint and PLAN-EVAL-required judgement recorded.

## In Progress

- Nothing. This thread is stopped at the contract-rescope boundary.

## Next Steps

1. Coordinator replaces the exact file contract and locks formal/non-formal CLI semantics.
2. Plan artifacts are revised to an authoritative exact edit list and ordered slices.
3. Coordinator launches a separate native opposite-family PLAN-EVAL.
4. Implementation begins only after PLAN-EVAL PASS.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Preserve the existing `(generation, phase, head)` atomic claim | issue #1611; source | Manual and automatic paths must share it. |
| Make every denial/exhaustion visible before spend | issue #1613 | Reply must be non-recursive. |
| PLAN-EVAL required | harness + `plan.md` | CI trigger/write-permission and claim protocol changes are decision-heavy and silent on failure. |
| Do not widen the contract locally | coordinator directive | Block and escalate instead. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| assigned run directory | new/updated | Bootstrap, research, blocked plan, Design checkpoint, context, drift, thread identity |

No production or test source file was changed.

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| `check` | NOT_RUN | planning-only turn; contract blocked |
| `test` | NOT_RUN | planning-only turn; contract blocked |
| `quality-job` | NOT_RUN | planning-only turn; contract blocked |
| JSR | N/A | no publishable surface |

## Open Questions

- See `research.md` § Open questions requiring coordinator disposition.

## Drift and Debt

- Drift: significant frozen-contract mismatch recorded in `drift.md`.
- Debt: none created; no implementation landed.

## Commits

- See draft PR #1658 commit list and phase comments.
