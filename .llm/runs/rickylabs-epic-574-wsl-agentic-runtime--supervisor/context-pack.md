# Context Pack: epic #574 supervisor

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `rickylabs-epic-574-wsl-agentic-runtime--supervisor` |
| Branch | `rickylabs-epic-574-wsl-agentic-runtime` |
| Current phase | `plan` |
| Archetype | Group-specific |
| Scope overlays | none |

## Current State

Epic #574 and all eight children have been re-baselined against `main` at `f7898dba`. The harness is
activated. The next legal action is to establish PR 0A's branch/native WSL worktree, create its
nested plan artifacts, open the early draft PR, and dispatch PLAN-EVAL.

## Completed

- Read repository guidance, relevant skills, all `.llm/harness/**`, and the agentic suite.
- Recorded issue dependencies, route overrides, current daemon state, risks, and group order.
- Verified secret-safe GitHub token resolution and a managed Codex daemon control socket.

## In Progress

- Supervisor bootstrap commit, push, issue taxonomy, and umbrella draft PR.

## Next Steps

1. Push the supervisor baseline and open the umbrella draft PR without closing #574.
2. Create the #575 native WSL worktree and nested run.
3. Open PR 0A early and dispatch separate OpenHands PLAN-EVAL.
4. After PASS, launch exactly one GPT-5.6 Sol high Codex thread through the checked-in launcher.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| Sequential child layering | #574 | #575 through #582 in listed delivery order. |
| One thread for PR 0A | codex-wsl-remote skill | Resume/steer; never duplicate send. |
| No Fable spend | Owner directive | Opus remains interim intended orchestrator. |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| `.llm/runs/rickylabs-epic-574-wsl-agentic-runtime--supervisor/` | new | Tracked supervisor run. |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | N/A | Planning artifacts only. |
| Fitness | PLAN-EVAL pending per child | Child run artifacts. |
| Runtime | Pending | #575 and later canaries. |
| Consumer | N/A | No product API changed. |

## Open Questions

- None block preparing PR 0A.

## Drift and Debt

- Drift: lane-policy model name and Codex version skew are recorded in `drift.md`.
- Debt: none created by supervisor bootstrap.

## Commits

- See the draft PR's commit list + per-slice PR comments.

