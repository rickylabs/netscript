# Context Pack: epic #574 supervisor

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `rickylabs-epic-574-wsl-agentic-runtime--supervisor` |
| Branch | `rickylabs-epic-574-wsl-agentic-runtime` |
| Current phase | `implement` |
| Archetype | Group-specific |
| Scope overlays | none |

## Current State

The canonical stack is umbrella #583 (`b58b4c2a`) -> foundation #584 (`9b75470`) -> controller #585
(`f1dfdc9`). PR 0A implementation and Tier-A sign-off are complete, but four owner-interactive
canaries explicitly block its merge. Independent stacked development continues: PR 0B's research,
Design, and owner-waived Plan-Gate are complete, and S1 is authorized on its sole WSL Codex thread.

## Completed

- Read repository guidance, relevant skills, all `.llm/harness/**`, and the agentic suite.
- Recorded issue dependencies, route overrides, current daemon state, risks, and group order.
- Verified secret-safe GitHub token resolution and a managed Codex daemon control socket.
- Opened foundation PR #584 on its own branch and completed implementation/sign-off at `9b75470`.
- Opened controller PR #585 as a true stack on #584; Plan-Gate passed at `f1dfdc9`.

## In Progress

- #576 S1 contract/state/ports/pure-planner implementation on thread
  `019f4b72-2ea4-7050-917e-6d6918371265`.

## Next Steps

1. Complete and Tier-A review #576's five planned slices on PR #585.
2. Keep #575/#584 draft until the owner executes and evidences all four interactive canaries.
3. Stack #577 from the eventual canonical #576 head; do not attribute child commits to #583.

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
| Fitness | PR 0A signed off; PR 0B Plan-Gate PASS | Child run artifacts. |
| Runtime | PARTIAL | PR 0A safe independent gates pass; four owner canaries remain. |
| Consumer | N/A | No product API changed. |

## Open Questions

- Owner interaction is required only for the four #575 browser/mobile/host canaries; it does not
  block the independent #576 stack.

## Drift and Debt

- Drift: lane-policy model name and Codex version skew are recorded in `drift.md`.
- Debt: none created by supervisor bootstrap.

## Commits

- See the draft PR's commit list + per-slice PR comments.
