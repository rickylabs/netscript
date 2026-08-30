# Context Pack: Claude hook cwd independence

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-claude-hook-log-cwd--1774` |
| Branch | `fix/claude-hook-log-cwd-independent` |
| Current phase | `plan` |
| Archetype | N/A — repository agentic tooling |
| Scope overlays | none |

## Current State

Research is complete on the exact requested baseline. The current relative handler passes for both
events at root and fails for both from the nested run cwd. The plan must now lock the combined
exec-form settings plus project-root logger repair and the unchanged RED→GREEN fixture.

## Completed

- Loaded all owner-selected skills and the harness activation/run-loop/plan-gate authorities.
- Verified clean tracked baseline, no upstream branch, valid GitHub identity, and issue #1774.
- Re-derived both event failures and recorded raw output.
- Confirmed `${CLAUDE_PROJECT_DIR}` is Claude's documented portable project-root contract.
- Confirmed minimum permission classes and explicitly deferred the sibling `wslHome()` defect.

## In Progress

- Plan & Design checkpoint.

## Next Steps

1. Lock design and executable gate plan.
2. Commit and push `plan.md` plus the Design checkpoint.
3. Stop for separate-session PLAN-EVAL.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Combined settings + logger repair | `research.md` | Settings-only and script-only are each incomplete. |
| `wslHome()` deferred | Issue scope / research | Confirmed sibling defect; unrelated launcher contract. |

## Files Changed

Only harness run artifacts are created in this phase.

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | NOT_RUN | Planning phase |
| Fitness | NOT_RUN | Planning phase |
| Runtime | NOT_RUN | Planning phase |
| Consumer | NOT_RUN | Planning phase |

## Open Questions

- None that would force implementation rework; plan details remain to be locked.

## Drift and Debt

- Drift: owner-selected Codex medium planning session recorded in `supervisor.md` and `drift.md`.
- Debt: none created.

## Commits

- See the draft PR's commit list + per-slice PR comments.
