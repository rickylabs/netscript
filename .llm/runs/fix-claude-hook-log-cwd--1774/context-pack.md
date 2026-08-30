# Context Pack: Claude hook cwd independence

## Run Metadata

| Field          | Value                                 |
| -------------- | ------------------------------------- |
| Run ID         | `fix-claude-hook-log-cwd--1774`       |
| Branch         | `fix/claude-hook-log-cwd-independent` |
| Current phase  | `plan-eval`                           |
| Archetype      | N/A — repository agentic tooling      |
| Scope overlays | none                                  |

## Current State

Cycle-1 PLAN-EVAL returned `FAIL_PLAN` at `26102943`; evaluator artifacts are present through
`842816a2` and remain untouched by this generator. The requested plan-text amendment now locks the
session-launch-root-only contract, reachable decoy evidence, exact host-path scan set, and #1776
deferral. Implementation is stopped pending one separate-session cycle-2 PLAN-EVAL `PASS`.

## Completed

- Loaded all owner-selected skills and the harness activation/run-loop/plan-gate authorities.
- Verified clean tracked baseline, no upstream branch, valid GitHub identity, and issue #1774.
- Re-derived both event failures and recorded raw output.
- Corrected `${CLAUDE_PROJECT_DIR}` to its documented session launch-root contract; it does not
  follow `EnterWorktree`.
- Confirmed minimum permission classes and deferred the sibling `wslHome()` defect to #1776.
- Locked `plan.md` and the complete `worklog.md` Design checkpoint.
- Selected PLAN-EVAL as an owner-required hard stop.
- Synchronized draft PR #1775 to `status:plan-eval` with milestone `0.0.7`, the required labels, and
  a PLAN phase comment; no evaluator was dispatched.
- Preserved `plan-eval.md` bit-identically while amending only generator-owned run text.
- Left the branch on its original base; the owner reports current `main` is inert for this surface
  and explicitly prohibited rebasing.

## In Progress

- Separate-session cycle-2 PLAN-EVAL, to be dispatched by the supervisor.

## Next Steps

1. Supervisor dispatches one cycle-2 confirmation on the recorded native opposite-family route.
2. Evaluator records `PASS` or `FAIL_PLAN` without generator self-evaluation.
3. Only after `PASS`, implementation begins with the dedicated failing RED fixture commit.

## Key Decisions

| Decision                          | Source               | Notes                                                                           |
| --------------------------------- | -------------------- | ------------------------------------------------------------------------------- |
| Combined settings + logger repair | `research.md`        | Settings-only and script-only are each incomplete.                              |
| Launch-root-only repair           | `plan.md` D1/D3      | Session launch checkout wins over nested/foreign cwd; no `EnterWorktree` claim. |
| `wslHome()` deferred              | `plan.md` D9 / #1776 | Confirmed sibling defect; tracked launcher contract.                            |
| Exact permission contract         | `plan.md` D5         | Three named env keys, launch-root hook-log subtree, no read grant.              |
| Unchanged RED→GREEN fixture       | `plan.md` D7–D8      | Both events; nested failure plus reachable decoy RED/GREEN evidence.            |

## Files Changed

Only harness run artifacts are changed through Plan. Product/config implementation files remain at
baseline.

## Gates

| Gate family | Current status | Evidence                                                               |
| ----------- | -------------- | ---------------------------------------------------------------------- |
| Static      | NOT_RUN        | Awaiting PLAN-EVAL before RED/GREEN implementation.                    |
| Fitness     | NOT_RUN        | Awaiting PLAN-EVAL; Claude surface and assertions selected.            |
| Runtime     | NOT_RUN        | Launch-root/nested/temp-decoy process fixture planned after PLAN-EVAL. |
| Consumer    | NOT_RUN        | Planning phase                                                         |

## Open Questions

- None. PLAN-EVAL may return findings, but the generator leaves no known rework-forcing decision
  open.

## Drift and Debt

- Drift: the corrected launch-root premise, owner-selected planning route, and repo-REST PR-sync
  fallback are recorded in `drift.md`; the premise correction narrows claims without redesigning the
  repair.
- Debt: none created.

## Commits

- See the draft PR's commit list + per-slice PR comments.
