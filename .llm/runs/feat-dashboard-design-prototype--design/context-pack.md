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

- **Slice 5**: re-sync checkpoint + owner review of pass-1 screens, then pass 2 (Plugin Control,
  Logs, Resource Control + 4 capability sections).
- **Side lane (issue #509, own worktree/branch)**: fresh-ui registry-wide pixel-perfect revamp —
  Fable-5 sub-agent in `.llm/tmp/fresh-ui-polish-wt` (branch `feat/fresh-ui-pixel-polish`), owner
  mandated 2026-07-06 ("now or never" Fable window; responsive/mobile first-class; extend registry;
  render/iterate on scaffolded /design page). Commits locally; supervisor reviews + lands. D5
  Tailwind-utility fix routed there.

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
  drift.md D3. Commit `4b31f44b`, PR comment 4892015865.
- **Slice 2 COMPLETE**: `resources/design/dashboard/{CLAUDE-DESIGN-BRIEF.md,PROPOSED-COMPONENTS.md}`
  — Fable-5 medium sub-agent authored per owner delegation refinement (supervisor is
  orchestration-only even on the design lane; locked into `claude-model-routing-cost-policy`
  memory). Supervisor review PASS vs proposal §3/§5.1/§9.1 + voice rules. Net-new verdicts:
  4 compose · 2 new-block (step-timeline, log-stream) · 2 new-component (trace-waterfall,
  stack-map). Commit `73bb9422`, PR comment 4892106915.
- **Slice 1.1 COMPLETE**: 26 authored preview stories (`tools/design-sync/previews/`, Opus 4.8
  delegated lane) → render-blank **PASS** (0 predicted blank), idempotence `98be0c4a39b7`,
  parity 44/44. weak-dts stays WARN by verdict (theme-toggle = true zero-prop component).
  Bundle fully authored, ready to seed. Commit + PR comment 4892143011.
- **Slice 3 COMPLETE**: canvas `NetScript — NS One` (`ec262e10-…`) seeded — DesignSync
  `finalize_plan` (`plan_ec262e10d4ad451f_52521883d287`, localDir `.ds-sync/bundle`) → one
  `write_files`, 180/180 via `localPath`; remote `list_files` verified == local tree. Canvas-side
  fitness green; pass 1 unblocked.
- **Slice 3.2 COMPLETE**: full authored-story coverage — Opus 4.8 lane authored the 18 missing
  stories (owner-reported name-only floor cards) + wrapped the 3 clipped overlay stories
  (CommandPalette/Toast/SidebarToggle) in `translateZ(0)` stages. `design:sync check` PASS:
  **44 authored / 0 floor**, idempotence `760154a732e6`; 44 `_preview/*.js` re-uploaded
  (`plan_…_41e3d1bcfd4d`). Surfaced drift **D5**: 7 L3 blocks (DataTable, StatsGrid, PageHeader,
  Pagination, DetailLayout, FilterForm, EmptyState) emit Tailwind utilities defined NOWHERE —
  canvas mitigated per-story; framework fix + DataTable↔ResponsiveTable reconciliation routed to
  **#509**. CodeBlock highlighting = fresh-ui L4-by-design → sync-back candidate (slice 7).
- **Slice 4 COMPLETE**: prototype pass 1 — Fable-5 lane authored 4 composed screens
  (`screens/01…04` + `proto.css` ~1090 lines + `DECISIONS.md`) narrating one coherent incident;
  DDX-0: all 7 promote-set blocks validated (+contract deltas for ns-waterfall/ns-stackmap/
  ns-step-timeline/ns-log-stream; Tabs skin, `ns-page-header--console`, `ns-envbar`, `ns-rail-grid`
  promoted for consideration). Supervisor review PASS (runtime refs, hex/className/voice 0,
  55/55 tokens defined, parse-clean). Uploaded `screens/*` (`plan_…_703d39e2ee7c`), tree verified.
- **Slice 3.3 COMPLETE (render gate)**: owner-driven ("you work in the dark") — local headless
  preview loop (http.server 8321/8322 + Edge `--headless --screenshot`) is now the **render gate**
  for every canvas-facing slice; all 48 surfaces triaged. Root causes: React string-`style` throw
  (3.2's overlay stages **never rendered** — drift D6), missing box-sizing preflight, D5 = closed
  ~60-utility set. Fixes: `HOST_ENV_RULES` host-env equivalence layer in `closure.ts`
  (preflight + utilities, tokens-mapped; supersedes per-story D5 mitigations; delete after #509
  ns-* conversion); 3 previews → object styles; ModelSelector OPEN staged; proto.css waterfall
  container-query tick fix + rail StatsGrid 2-col cap. Gate PASS idempotence `628396f31065`;
  re-shot + verified; 6 files re-uploaded (`plan_…_cedc9c41c89e`, `plan_…_1186fca9a929`).
  #509 agent messaged with findings 1–7 + reconciliation contract (no file overlap: it owns
  `packages/fresh-ui`, this run owns `tools/design-sync` + `resources/design/dashboard`).
- **Slice 3.1 COMPLETE (hotfix)**: `_ds_bundle.js` is a **platform-reserved path** — the canvas
  compiles uploaded `.tsx` into its own bundle there (no ReactDOM, no window globals), which broke
  every card (drift D4). Runtime renamed `_ns_runtime.js`, closure `_ns_styles.css`
  (mod.ts/bundle.ts/traps.ts/templates); `design:sync check` PASS, idempotence `9998ab57ac70`;
  47 files re-uploaded (`plan_ec262e10d4ad451f_4091c6c11b1a`), remote `_ds_bundle.css` deleted,
  tree verified. NEVER emit `_ds_*` asset names. Slice-4 agent re-briefed mid-flight.

## Board state (filed)

- Draft PR **#506** (`Closes #425`, Part of #400) — the commit trail.
- New tracking issue **#507** (Backlog / Triage; type:feat, epic:dev-dashboard, area:fresh-ui,
  area:tooling, priority:p1, status:plan).
- Supersession comments posted on #425 (4891488892) and #400 (4891489240).
- Issue **#509** (fresh-ui registry-wide pixel-perfect revamp: defaults/states/responsive/mobile/
  dark + registry extensions; Backlog / Triage; type:feat, area:fresh-ui, priority:p1,
  epic:dev-dashboard, status:plan) — owner-mandated side lane, Fable-5 agent running in
  `.llm/tmp/fresh-ui-polish-wt`.

## Next Steps

1. Slice 4: prototype pass 1 ×light/dark (shell + Stack Map + Flow/Trace + Catalog/API
   Explorer + Run Inspector) + DDX-0 promote-set verdicts — Fable-5 medium sub-agent.
2. Slice 5: re-sync checkpoint, then pass 2 (Plugin Control, Logs, Resource Control + 4
   capability sections).
3. Owner lane directive 2026-07-06 (in force, also in memory): Fable 5 = all design/creativity
   work but ALWAYS via a Fable-5 medium sub-agent (supervisor orchestration-only); WSL Codex =
   chores only, never design; Opus 4.8 = the rest; Sonnet 5 = workflow stages.
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
