# Supervisor Identity — beta7-ship--orchestrator

- **Model**: Claude Fable 5 · medium (background, bypassPermissions, owner-directed launch)
- **Session**: `df71d36c-90d7-4539-979f-587d9da23119` (`claude attach df71d36c`)
- **Host**: WSL2 ext4, /home/codex
- **Checkout/worktree**: `/home/codex/repos/netscript-547-lffix/.claude/worktrees/beta7-ship-orchestrator`
- **Branch**: `worktree-beta7-ship-orchestrator`
- **Baseline**: `06214bea` (origin/main, post PR #623)
- **Run dir**: `.llm/runs/beta7-ship--orchestrator/`

## Lane assignments (per `.llm/harness/workflow/lane-policy.md`, 2026-07-11)

| Lane | Route | Notes |
| --- | --- | --- |
| Supervisor / orchestration | Claude · Fable 5 · medium | This session (owner override active through 2026-07-12) |
| Implementation slices (source) | Codex · GPT-5.6 Sol · medium, WSL daemon-attached | via `deno task agentic:launch-codex-slice`, fallback direct `codex debug app-server send-message-v2` with drift note |
| Small fixes | Codex · GPT-5.6 Luna · max | |
| Documentation authoring | Claude sub-agents (Fable, low) | per CLAUDE.md documentation-authoring exception; no `packages/`/`plugins/` source |
| Review of Codex slices | This supervisor (Tier-A substantive review) | PLAN-EVAL external dispatch owner-waived → drift D1 |
| Validation of Claude-authored docs | Opposite family (Codex GPT-5.6 Sol) separate session | per doc exception conditions |

## Recorded overrides / drift seeds

- **D1**: External evaluator dispatch owner-waived for this run (carried from beta.6 run).
  Supervisor performs substantive per-slice review; opposite-family validation retained for docs.
- Publish authorization: `0.0.1-beta.7` only.
