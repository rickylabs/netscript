---
name: claude-manager
description: >
  Find, launch, steer, monitor, and repair Claude Code supervisor sessions for NetScript,
  including Zed Claude ACP sessions, Claude remote-control sessions, OpenHands evaluator handoffs,
  and WSL-hosted Codex implementation agents.
---

# Claude Manager

Use this skill when the task involves Claude Code session orchestration rather than package code.
Claude is the supervisor. OpenHands evaluates. WSL Codex implements harness slices that must be
visible from Codex Desktop/mobile.

## Workflow

1. Re-baseline the worktree and branch first.
2. If the user says `use harness`, read `.agents/skills/netscript-harness/SKILL.md`. If a native
   Claude `/netscript-harness` skill is unavailable, load the repo file directly.
3. Use `claude --bg` for non-blocking launches. Use `--permission-mode bypassPermissions` in the
   trusted agentic environment unless the user asks for supervised permissions.
4. Prefer native Claude status surfaces before custom polling:
   - `claude agents --json` for running subagents.
   - `claude remote-control --spawn=worktree` for mobile/web steering of local Claude sessions.
   - `claude --help`, `claude remote-control --help`, and `claude agents --help` before relying on
     remembered CLI flags.
5. Keep wrappers and `.llm/tools` as deterministic fallbacks, not as competing sources of truth.
6. For implementation slices that need Codex mobile visibility, use the WSL Codex daemon path from
   `.agents/skills/codex-wsl-remote/SKILL.md`.

## Delegation Contract

- Claude supervisor sessions may gather state, write prompts, launch/check agents, and update
  harness artifacts.
- PLAN-EVAL uses OpenHands with minimax M3 unless the run artifact records a blocked launch.
- IMPL-EVAL uses OpenHands with qwen 3.7 max unless the run artifact records a blocked launch.
- Implementation slices use daemon-attached WSL Codex sessions with recorded thread id, worktree,
  daemon proof, and steering command.
- Do not count Claude internal subagents or plugin helper agents as NetScript implementation agents.
- Do not send a second implementation launch into the same worktree while one is active; steer the
  existing session instead.

## Reasoning Policy

| Task | Effort |
| ---- | ------ |
| Mechanical status checks, prompt delivery, no-edit smokes | `low` |
| Daily supervision and ordinary implementation | `medium` |
| Debugging, self-evaluation, ambiguous fixes | `high` |
| Explicit user request or unusually complex/high-risk design | `xhigh` |

## Commands

```powershell
deno task agentic:check-claude
deno task agentic:smoke-claude-remote -- --pretty
deno task agentic:sync-claude
```

Use `--live --prompt <file>` with `agentic:smoke-claude-remote` only when a real Claude background
session should be started.

## Common Pitfalls

- Assuming a repo skill is globally installed. Check `.claude/skills/` or read `.agents/skills/...`
  directly.
- Waiting for full session completion when the job is only to steer. Background launches should
  return quickly and provide a status handle.
- Treating a successful local process as mobile-visible. Require remote-control or daemon evidence.
- Letting stale `.claude/skills` drift from `.agents/skills`; run `agentic:check-claude`.

## Checklist

- [ ] Current branch/worktree is verified.
- [ ] Harness skill was loaded for harnessed work.
- [ ] Evaluator surface is OpenHands when evaluating.
- [ ] Implementation surface is WSL Codex when slice work must be mobile-visible.
- [ ] Claude remote-control or Codex daemon visibility is proven before claiming phone visibility.
