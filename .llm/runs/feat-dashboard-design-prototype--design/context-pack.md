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

- **Slice 2**: dashboard design brief + proposed components (`resources/design/dashboard/`).
  Delegation split per owner directive: Fable 5 keeps the tricky design/creativity core; Opus 4.8
  sub-agent authors the 26 pending preview stories (`tools/design-sync/previews/<unit>.preview.js`,
  read by `emitCards`) + mechanical doc polish; WSL Codex = chores only.

## Done gates

- PLAN-EVAL **PASS** (minimax-M3, `plan-eval.md` committed dfd9d8ca; version-label note fixed in
  plan.md/pr-body.md). Slice 0 canvas round-trip **PASS** (create/finalize/write/read/delete via
  native `DesignSync` tool).
- **Slice 1 COMPLETE**: `tools/design-sync/` v1 (11 modules + card/conventions templates +
  config.json + `design:sync` task + `.ds-sync/` gitignore). `design:sync check` **PASS** —
  parity 44/44 cards, idempotence `dfac420b48f8`, traps 4×PASS/2 by-design WARN; scoped
  check/lint/fmt clean. Key mechanics: zero-Tailwind registry ⇒ concat closure (no Fresh build);
  cn shim drops clsx/tailwind-merge (React = only npm dep); `subpaths` graph fold-in gives the
  canvas the 8 interactive primitives; `markdown` excluded (template-sourced chat stack). See
  drift.md D3.

## Board state (filed)

- Draft PR **#506** (`Closes #425`, Part of #400) — the commit trail.
- New tracking issue **#507** (Backlog / Triage; type:feat, epic:dev-dashboard, area:fresh-ui,
  area:tooling, priority:p1, status:plan).
- Supersession comments posted on #425 (4891488892) and #400 (4891489240).

## Next Steps

1. Slice 2: design brief + proposed components (Fable 5); in parallel delegate the 26 preview
   stories (`tools/design-sync/previews/*.preview.js`) + doc polish to an Opus 4.8 sub-agent.
2. Slice 3: re-run `design:sync`, seed project `ec262e10-d4ad-451f-9aeb-e51955db3634` via
   DesignSync `finalize_plan` + `write_files` (localPath from `.ds-sync/bundle/`).
3. Owner lane directive 2026-07-06 (in force, also in memory): Fable 5 = all design/creativity
   work; WSL Codex = chores only, never design; Opus 4.8 = the rest; Sonnet 5 = workflow stages.
4. OQ-2 RESOLVED: pkg `@netscript/ns-one` / global `NSOne`. OQ-4 RESOLVED-MOOT: concat closure,
   no Fresh build (drift.md D3).

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| LD-1…LD-7 | plan.md § Locked Decisions | owner-ratified in session 2026-07-06 |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| `.llm/runs/feat-dashboard-design-prototype--design/*` | new | run artifacts |
| `tools/design-sync/**` (11 src + 2 templates) | new | slice 1 |
| `resources/design/dashboard/.design-sync/config.json` | new | projectId + subpaths + exclusions |
| `deno.json` (`design:sync` task), `.gitignore` (`.ds-sync/`) | modified | slice 1 |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static      | **PASS** (slice-1 scope) | scoped wrappers, 11 files clean |
| Fitness     | **PASS** (build-side) | idempotence + parity + traps green; canvas-side at slice 3 |
| Runtime     | **PASS** (slice 0) | canvas round-trip CRUD green |
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
