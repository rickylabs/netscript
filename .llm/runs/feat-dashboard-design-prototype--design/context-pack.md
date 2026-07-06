# Context Pack: Dev Dashboard E2E Claude Design prototype + design-sync system

## Run Metadata

| Field          | Value                                     |
| -------------- | ----------------------------------------- |
| Run ID         | `feat-dashboard-design-prototype--design` |
| Branch         | `feat/dashboard-design-prototype`         |
| Current phase  | `plan-eval` (dispatched, awaiting verdict) |
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

- PLAN-EVAL (OpenHands minimax-M3, PR-comment lane) dispatched 2026-07-06 on draft PR **#506**
  (comment 4891516954). Supervisor watching via `gh-watch.ts --pr 506` background. **Hard stop
  before slice 1 until PASS.**

## Board state (filed)

- Draft PR **#506** (`Closes #425`, Part of #400) — the commit trail.
- New tracking issue **#507** (Backlog / Triage; type:feat, epic:dev-dashboard, area:fresh-ui,
  area:tooling, priority:p1, status:plan).
- Supersession comments posted on #425 (4891488892) and #400 (4891489240).

## Next Steps

1. PLAN-EVAL verdict → PASS: proceed to slice 0; FAIL_PLAN: fix plan boxes (max 2 cycles).
2. Owner: `claude mcp add … claude-design …` + `/design-login`; then slice 0 canvas smoke.
3. Owner lane directive 2026-07-06 (in force, also in memory): Fable 5 = all design/creativity
   work; WSL Codex = chores only, never design; Opus 4.8 = the rest; Sonnet 5 = workflow stages.

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
