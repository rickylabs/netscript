# Context Pack: agent init skill discoverability

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1023-agent-init-skill-surface--skills-discoverability` |
| Branch | `fix/1023-agent-init-skill-surface` |
| Current phase | `plan` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `docs` |

## Current State

Research confirms the issue's cause: source content/manifest and generated asset freshness, not installer iteration. The exact supplied repro command is stale, but the actual contributor entrypoint run from a temp cwd reproduces the three-skill/164-line/dead-Aspire-route artifact.

## Completed

- Requested skills and harness references loaded.
- Repro and focused source/draft/docs baseline completed.
- Plan and Design checkpoint prepared.

## In Progress

- Bootstrap commit, draft PR, then separate-session PLAN-EVAL.

## Next Steps

1. Commit/push the harness plan and open the draft PR.
2. Obtain PLAN-EVAL PASS in the bound formal evaluator lane.
3. Implement and validate the two planned slices.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Preserve installer logic | source/research | It already writes every non-manifest embedded entry. |
| Manifest-derived route test | issue/plan | Prevents all dangling installed-skill routes. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-1023-agent-init-skill-surface--skills-discoverability/` | new | harness research/plan/design state |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Plan | awaiting evaluator | research/plan/worklog |
| Static/Fitness/Consumer | not run | implementation prohibited before PLAN-EVAL |

## Open Questions

- None.

## Drift and Debt

- Drift: requested repro entry/flag stale; actual behavior reproduced through the live entrypoint.
- Debt: none created or closed.

## Commits

- See the draft PR's commit list + per-slice PR comments.

