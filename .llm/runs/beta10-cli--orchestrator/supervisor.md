# Supervisor — beta.10 CLI coverage + stabilization (milestone 12)

| Field | Value |
| --- | --- |
| Role | Orchestrator (coordinates; does not implement) |
| Agent / provider | Claude · Anthropic |
| Model / effort | `fable-5` · low — restored default orchestrator (PR #784, 2026-07-16) |
| Lane | `planning_decisions` |
| Mode | tmux daemon-attached · Remote Control ON · `bypassPermissions` |
| Session id | `session_017LHrkXyMzsQwb9bqr82EFK` (recorded 2026-07-16; requested = observed: Claude · Anthropic · Fable 5 · low) |
| Host | WSL2 (`/home/codex`) |
| Checkout | `/home/codex/repos/netscript-beta10-cli` (worktree cut from `origin/main`) |
| Branch | `feat/beta10-cli-integration` (baseline = `origin/main`) |
| Milestone | [0.0.1-beta.10](https://github.com/rickylabs/netscript/milestone/12) |

## Routing overrides in force (per `lane-policy.md`, Fable 5 restored 2026-07-16)

- **Orchestrator (this session)** → Claude · Fable 5 · low. Token-limit fallback: Codex · Sol · high.
- **Implementation** → Codex · GPT-5.6 Sol · medium (normal) / high (complex), launched **only**
  through `deno task agentic:launch-codex-slice`. The orchestrator never writes framework source.
- **Adversarial review of Codex work** → Fable 5, effort-paired (low↔Sol-medium, high↔Sol-high),
  opposite-family; its token-limit fallback stays Claude-family (Opus), never Sol.
- **Delegated chores** → Opus 4.8 · medium (code) / Sonnet 5 · high (docs, cleanup, easy).
- **Claude Code workflows** → Opus 4.8 · low (expensive accelerator; not the default impl lane).
- Drive every lane through `.llm/tools/agentic/` (`agentic:*`). Never ad-hoc `wsl.exe`/PowerShell.

## Scope — beta.10 = complete CLI coverage + bugfixes/stabilization

**IN SCOPE**
- **#769** (p0 release-blocker) — `netscript agent init` writes an unversioned `jsr:@netscript/cli`
  MCP config that cannot resolve. Fix on PR #770.
- **Stabilization**: #763, #762 (PR #772), #774, #773, #781, #782, #783.
- **Epic #721 agentic-combo** (MCP server + public skills + CLI): S1–S9 = #725–#733; umbrella PR #715.

**OUT OF SCOPE — do not touch (postponed to `0.0.1-beta.13`)**
- The entire **Dev Dashboard** epic #400 (#410–#557) and #734. The dashboard prototype is **paused**.
- Open dashboard PRs **#780 / #778 / #775** are parked — do not advance, merge, or rebase them.

## Harness invariants

- Generator session ≠ evaluator session; no implementation lane self-certifies.
- Launch identity is data: record requested-vs-observed provider/model/effort in `worklog.md`.
- **Owner ratifies promotion.** Work autonomously through implementation → PR → evaluation → green
  CI, but hold **merge / publish / release / issue-close** for explicit owner sign-off over Remote
  Control. #582 owns rollout/promotion; this run selects and validates, it does not promote.
- A run dir without this `supervisor.md` is not activated.
