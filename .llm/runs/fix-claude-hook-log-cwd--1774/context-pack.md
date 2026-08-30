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

Research and Plan & Design are complete on the exact requested baseline. The combined exec-form
settings plus project-root logger repair, minimum permissions, unchanged RED→GREEN fixture, and gate
set are locked. Implementation is stopped pending a separate-session PLAN-EVAL `PASS`.

## Completed

- Loaded all owner-selected skills and the harness activation/run-loop/plan-gate authorities.
- Verified clean tracked baseline, no upstream branch, valid GitHub identity, and issue #1774.
- Re-derived both event failures and recorded raw output.
- Confirmed `${CLAUDE_PROJECT_DIR}` is Claude's documented portable project-root contract.
- Confirmed minimum permission classes and explicitly deferred the sibling `wslHome()` defect.
- Locked `plan.md` and the complete `worklog.md` Design checkpoint.
- Selected PLAN-EVAL as an owner-required hard stop.

## In Progress

- Separate-session PLAN-EVAL, to be dispatched by the supervisor.

## Next Steps

1. Supervisor dispatches the recorded native opposite-family PLAN-EVAL route.
2. Evaluator writes `plan-eval.md` with `PASS` or `FAIL_PLAN`.
3. Only after `PASS`, implementation begins with the dedicated failing RED fixture commit.

## Key Decisions

| Decision                          | Source                 | Notes                                                               |
| --------------------------------- | ---------------------- | ------------------------------------------------------------------- |
| Combined settings + logger repair | `research.md`          | Settings-only and script-only are each incomplete.                  |
| `wslHome()` deferred              | Issue scope / research | Confirmed sibling defect; unrelated launcher contract.              |
| Exact permission contract         | `plan.md` D5           | Three named env keys, active hook-log write subtree, no read grant. |
| Unchanged RED→GREEN fixture       | `plan.md` D7–D8        | Live settings, both events, root/nested/sibling discrimination.     |

## Files Changed

Only harness run artifacts are changed through Plan. Product/config implementation files remain at
baseline.

## Gates

| Gate family | Current status | Evidence                                                     |
| ----------- | -------------- | ------------------------------------------------------------ |
| Static      | NOT_RUN        | Awaiting PLAN-EVAL before RED/GREEN implementation.          |
| Fitness     | NOT_RUN        | Awaiting PLAN-EVAL; Claude surface and assertions selected.  |
| Runtime     | NOT_RUN        | Root/nested/sibling process fixture planned after PLAN-EVAL. |
| Consumer    | NOT_RUN        | Planning phase                                               |

## Open Questions

- None. PLAN-EVAL may return findings, but the generator leaves no known rework-forcing decision
  open.

## Drift and Debt

- Drift: owner-selected Codex medium planning session recorded in `supervisor.md` and `drift.md`; no
  additional plan drift.
- Debt: none created.

## Commits

- See the draft PR's commit list + per-slice PR comments.
