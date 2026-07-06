# Context Pack: Dev Dashboard E2E Claude Design prototype + design-sync system

## Run Metadata

| Field          | Value                                     |
| -------------- | ----------------------------------------- |
| Run ID         | `feat-dashboard-design-prototype--design` |
| Branch         | `feat/dashboard-design-prototype`         |
| Current phase  | `plan` (awaiting PLAN-EVAL)               |
| Archetype      | N/A (repo tooling + design artifacts)     |
| Scope overlays | none                                      |

## Current State

Run bootstrapped 2026-07-06 in worktree `.llm/tmp/design-proto-wt` @ `317e4b50` (beta.5 cut).
Four-lane research complete and condensed into research.md. Plan locked with the owner in-session
(LD-1…LD-7): full E2E Claude Design prototype of the beta.6 Dev Dashboard on a NEW design system
synced at 100% parity from today's fresh-ui, via a production-grade reusable `tools/design-sync/`
system; fully-agentic canvas lane over the Claude Design MCP with owner steering; #425 (DDX-15)
superseded-in-execution; new issue to file in Backlog / Triage. This run is fully decoupled from
the beta.6 implementation supervisor.

## Completed

- Research (four parallel lanes: seed-corpus mining, GitHub board sweep, fresh-ui inventory,
  eis-chat + Claude Design capabilities).
- Plan + Design checkpoint (worklog.md § Design, 8 slices).
- Run dir scaffolding (supervisor.md first).

## In Progress

- Bootstrap tail: commit + push branch, open draft PR, file new issue + board comments, dispatch
  PLAN-EVAL.

## Next Steps

1. Commit run dir; push `feat/dashboard-design-prototype` (explicit refspec); open draft PR (WSL gh).
2. File new issue (Backlog / Triage, `Part of #400`); supersession comments on #425/#400.
3. Dispatch PLAN-EVAL (OpenHands minimax-M3, separate session). **Hard stop before slice 1.**
4. Owner: `claude mcp add … claude-design …` + `/design-login`; then slice 0 canvas smoke.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| LD-1…LD-7 | plan.md § Locked Decisions | owner-ratified in session 2026-07-06 |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| `.llm/runs/feat-dashboard-design-prototype--design/*` | new | run artifacts (6 files) |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static      | NOT_RUN        | after slice 1 |
| Fitness     | NOT_RUN        | idempotence/parity/traps defined in plan.md |
| Runtime     | NOT_RUN        | slice 0 MCP smoke blocked on owner login |
| Consumer    | N/A            | no package surface |

## Open Questions

- OQ-1 MCP viability (slice 0 gate) · OQ-2 synthetic pkg name · OQ-3 shots in-repo · OQ-4 closure
  build source — see research.md.

## Drift and Debt

- Drift: DDX-15 scope expansion + DDX-0 inversion; Tier-A lane override (see drift.md).
- Debt: none created; DataTable grid-collapse verification noted in plan.md.

## Commits

- See the draft PR's commit list + per-slice PR comments (V3 retired `commits.md`).
