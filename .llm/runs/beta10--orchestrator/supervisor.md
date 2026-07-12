# Supervisor — beta.10 (Dev Dashboard, milestone 12)

| Field | Value |
| --- | --- |
| Role | Orchestrator (coordinates; does not implement) |
| Agent / provider | Claude · Anthropic |
| Model / effort | `opus-4.8` · medium |
| Lane | `planning_decisions` / `mobile_orchestration` (same lane) |
| Mode | Foreground interactive, remote control on |
| Session id | _record on launch_ |
| Host | WSL2 (`/home/codex`) |
| Checkout | `/home/codex/repos/ns-dashboard-design-orchestrator` |
| Branch | `main` @ `93546ae3` (baseline) |
| Milestone | [0.0.1-beta.10](https://github.com/rickylabs/netscript/milestone/12) — 44 open / 3 closed |

## Routing overrides in force

Fable 5 is outside the Anthropic subscription. Per the amended
`.llm/harness/workflow/lane-policy.md` and `routing-policy.ts`:

- Orchestrator and mobile orchestration → **Opus 4.8 · medium** (condition
  `temporary_while_fable_outside_subscription`; reverts to Fable 5 when it returns).
- Fable 5 is **not removed** — it stays selectable on explicit owner request as an outside-plan,
  approval-gated route. It is never auto-selected.
- Every other lane is unchanged. Implementation stays on WSL Codex; evaluation stays opposite-family.
- OpenRouter-through-Claude-Code is a **proven transport**; the evaluator rules that govern OpenHands
  govern it identically. GLM 5.2 remains scoped to **pure design work** (`major_ui_ux_*` lanes only).

## Two parallel streams

**Stream A — design prototype (dashboard).** Claude Design MCP (`claude-design`, HTTP, user scope).
Revamp the Dev Dashboard prototype in Claude Design while Stream B runs. Plan of record:
`.llm/runs/feat-dashboard-design-prototype--design/plan.md` (issues #507, #509, epic #400).

**Stream B — non-dashboard (delegated).** Everything in milestone 12 that is not a dashboard/DDX
issue. Brief: `briefs/non-dashboard.md`. Lane: Opus 4.8 · high.

The streams are independent by construction: Stream B touches `packages/`, `.llm/tools/`, CI and
docs; Stream A touches the Claude Design project and `packages/fresh-ui` registry sync only. When the
new prototype lands, only dashboard issues remain and they can be built against the already-shipped
MCP/CLI surface.

## Slice 0 — Claude Design MCP pre-flight (blocking for Stream A)

Do not start Stream A design work until this passes:

1. `claude-design` MCP tools resolve in-session (`list_projects` / `get_project`).
2. `get_file` reads the prototype project — ground truth, no manual download.
3. If any canvas call returns **401**, the owner runs `/design-login` (owner-run step; one command,
   not a blocker to plan around).
4. Record requested-vs-observed route identity in `worklog.md`.

Known flakiness: this server has documented 404/401 intermittency
(anthropics/claude-code#69310, #69313). Keep the pre-flight smoke gate; do not treat a single 404 as
a hard failure without a retry.
