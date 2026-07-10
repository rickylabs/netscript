# Context Pack: Codex sender ownership and remote recovery

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `feat-epic-574-codex-sender-lock--pr-4` |
| Branch | `feat/epic-574-codex-sender-lock` |
| Current phase | `plan-eval` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `docs` |

## Current State

Plan slice authored at HEAD `4756eb4`, descended from integration baseline `fe3c63fb`. No source implementation has begun. The external Claude coordinator owns PLAN-EVAL, Tier-A review/sign-off, and merge.

## Completed

- Activated named skills and harness; selected Archetype 6.
- Re-baselined canonical runtime contracts and #580 deferred points.
- Locked durable ownership format/semantics and active-work-safe anchored repair algorithm.
- Recorded owner-accepted interactive canary boundary honestly.

## In Progress

- Slice 1 validation, commit, explicit-refspec push, and PR plan comment.

## Next Steps

1. Coordinator performs separate PLAN-EVAL and records PASS/required changes.
2. Only after PASS, implement slice 2 and hand it to Tier-A for substantive review before sign-off.
3. Implement slice 3, run full gates, and hand off for coordinator Tier-A/IMPL-EVAL workflow.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| Extend canonical runtime contracts | issue brief + research | No parallel schema/controller. |
| Atomic per-worktree privacy-safe ownership | plan L2–L5 | Duplicate launch blocks before spawn; resume steers existing thread. |
| Anchored repair with active-work refusal | plan L6–L9 | No broad process killing or actual daemon mutation in tests. |

## Files Changed

- Run artifacts only in slice 1; `codex-thread-ids.md` existed before worker edits and is preserved as run identity evidence.

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Plan | awaiting coordinator | `research.md`, `plan.md`, `worklog.md ## Design` |
| Static/Fitness/Runtime/Consumer | not run | implementation prohibited before Plan-Gate PASS |

## Open Questions

- None that force implementation rework; coordinator may request Plan-Gate corrections.

## Drift and Debt

- Drift: stale local fetch refspec and owner-accepted interactive canaries recorded in `drift.md`.
- Debt: none expected.

## Commits

- See draft PR #589 commit list and per-slice comments.
