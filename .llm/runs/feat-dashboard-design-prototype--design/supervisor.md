# Supervisor Identity — feat-dashboard-design-prototype--design

Written at run start per `workflow/lane-policy.md` § Supervisor identity. A run dir without this
file is not activated. Other supervisors cross-peek a run by reading this file — it is how a run's
operating identity is discoverable without chat memory.

| Field | Value |
| --- | --- |
| Model | Claude Fable 5 (`claude-fable-5[1m]`) |
| Session | https://claude.ai/code/session_01Dgu7TfPnzpXUii84FSybbg |
| Host | Windows 11 Home 10.0.26200, user `chaut` |
| Checkout | `C:\Dev\repos\netscript-framework` |
| Worktree | `C:\Dev\repos\netscript-framework\.llm\tmp\design-proto-wt` |
| Branch | `feat/dashboard-design-prototype` |
| Baseline | `317e4b50` (origin/main, 2026-07-06, beta.5 cut) |
| Run ID | `feat-dashboard-design-prototype--design` |

## Run charter (one paragraph)

Deliver the beta.6 Dev Dashboard's missing design pre-step as a self-contained run, fully decoupled
from the beta.6 implementation supervisor: (1) a **production-grade reusable design-sync system**
(`tools/design-sync/`) that converts the current `@netscript/fresh-ui` copy-source registry into a
Claude Design-consumable design system (synthetic React package + compiled CSS closure) with
idempotent re-sync; (2) a **new Claude Design project** seeded at 100% component parity; (3) a
**full E2E prototype** of the dashboard (shell + 7 panels + 4 per-capability sections, light/dark),
driven agentically via the Claude Design MCP with the owner steering from the canvas UI; (4) a
**sync-back spec** making every new/changed component implementation-ready for fresh-ui (downstream
lanes, not this run). Supersedes-in-execution #425 (DDX-15); inverts the DDX-0→DDX-15 edge into the
eis-chat two-pass loop (prototype pass 1 validates the DDX-0 promote-set before DDX-0 lands).

## Lane table in force

| Tier | Binding | Role in this run |
| --- | --- | --- |
| A | Claude Fable 5 (this session) | Supervisor; **all design/creativity work** (canvas orchestration via Claude Design MCP, brief authoring, design decisions, shot review); slice review gate; board comments. Owner directive 2026-07-06: Fable 5 is THE design lane — "it outsmarts by far all others in creativity and design consistency" |
| B | Claude Opus 4.8 sub-agents (internal) | Everything that is neither design nor a chore: research condensation, mechanical doc assembly, code scaffolding support |
| C | Claude Workflow (Sonnet 5 stages) | Only if a batch fan-out is ever justified; **never Fable 5 in a workflow** |
| D | WSL Codex | **Chores and easy well-scoped tasks only — never design-related work** (owner directive 2026-07-06). In this run: gh board filing chores. fresh-ui implementation of prototyped components is a downstream handoff fed by the sync-back spec |
| E | OpenHands minimax-M3 (PLAN-EVAL) / qwen-3.7-max (IMPL-EVAL) | Separate-session evaluator verdicts |

## Recorded lane/eval overrides

- **Tier-A implements `tools/design-sync/`** (repo tooling, not `packages/`/`plugins/` source — the
  supervisor-does-not-write-framework-code boundary is not crossed). Authorization: owner directive
  in-session (2026-07-06): "fully agentic … we'll start it here as soon as we locked together the
  plan", sync-home fork answered `tools/design-sync`. Mirrored in `drift.md`.
- **Canvas lane is Tier-A via Claude Design MCP** (not a Codex/OpenHands lane — Claude Design is a
  Claude-native surface). Owner steers/iterates directly from the Claude Design dashboard.
  Fallback if the MCP endpoint is persistently 404/401 (known June-2026 flakiness): Tier-A prepares
  brief + design system + per-turn instructions; owner relays through the canvas UI. Slice 0 gates
  this.
