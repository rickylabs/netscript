# MCP + Public Skills Orchestrator — session identity

- **Role**: NETSCRIPT MCP & PUBLIC SKILLS ORCHESTRATOR (Tier-A supervisor)
- **Model**: Claude Fable 5 (low), bypassPermissions, autonomous background job, mobile remote-control enabled
- **Session**: https://claude.ai/code/session_01KiB1qvFSmaFh2ed3gaYe6C
- **Host**: WSL2 (Linux 6.18.33.2-microsoft-standard-WSL2), launch cwd `/home/codex/repos/ns-mcp-skills-orchestrator`
- **Worktree**: `/home/codex/repos/netscript-547-lffix/.claude/worktrees/mcp-skills-orchestrator`
- **Branch**: `feat/netscript-mcp-skills` (umbrella integration branch, from origin/main @ eac57c5f)
- **Attach**: steer via agentic suite / claude-manager skill; background job dir `/home/codex/.claude/jobs/078ecac1`
- **Mission**: NetScript agentic combo — first-party MCP server + public skills + CLI (Aspire model). Refs #302.
- **Stop-line**: never `release:publish`, `gh release create`, or merge `release/cut-*`; feature work merges via umbrella only — NEVER into main directly (owner reconfirmed 2026-07-12).
- **Milestone (owner directive 2026-07-12)**: epic #721 + children #725–#733 sit under milestone 12 (`0.0.1-beta.10`), not Backlog/Triage.
- **Siblings (do not touch)**: beta-9 implementation (milestone 11 issues), dashboard-design follow-up branches, epic #701 CLI coverage (beta.9 — MCP wraps that CLI surface, dependency only).

## Lane table in force (per lane-policy.md)

Tier A: this session (review + sign-off). Tier B: Opus 4.8 high (research/docs). Tier C: Workflows
Opus 4.8 low/med (script committed before run). Tier D: WSL Codex via
`deno run --no-lock -A .llm/tools/agentic/codex/launch-codex-slice.ts` (D4 fallback). Tier E:
OpenHands eval, separate session. Fable swarms PROHIBITED (D6).
