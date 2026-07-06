# Context Pack: Dev Dashboard E2E Claude Design prototype + design-sync system

## Run Metadata

| Field          | Value                                     |
| -------------- | ----------------------------------------- |
| Run ID         | `feat-dashboard-design-prototype--design` |
| Branch         | `feat/dashboard-design-prototype`         |
| Current phase  | `implement` (PLAN-EVAL **PASS** 2026-07-06, `plan-eval.md` @ dfd9d8ca; slice 0 complete) |
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

- **Slice 1**: `tools/design-sync/` v1 (converter + closure + conventions + previews + trap
  checks + idempotence). Canvas target locked: project **`NetScript — NS One`**
  (`ec262e10-d4ad-451f-9aeb-e51955db3634`) — goes into `.design-sync/config.json`.

## Done gates

- PLAN-EVAL **PASS** (minimax-M3, `plan-eval.md` committed dfd9d8ca; version-label note fixed in
  plan.md/pr-body.md). Slice 0 canvas round-trip **PASS** (create/finalize/write/read/delete via
  native `DesignSync` tool).

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

- **OQ-1 RESOLVED GREEN 2026-07-06:** canvas lane runs on the native `DesignSync` tool
  (claude.ai-login authorized; read smoke PASS; stale project `ea3fa1b9-…` visible and left
  untouched per LD-2). See drift.md latest entry.
- OQ-2 synthetic pkg name · OQ-3 shots in-repo · OQ-4 closure build source — see research.md.

## Drift and Debt

- Drift: DDX-15 scope expansion + DDX-0 inversion; Tier-A lane override (see drift.md).
- Debt: none created; DataTable grid-collapse verification noted in plan.md.

## Commits

- See the draft PR's commit list + per-slice PR comments (V3 retired `commits.md`).
