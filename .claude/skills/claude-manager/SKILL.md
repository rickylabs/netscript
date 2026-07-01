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

## Claude Workflows / Ultracode Policy

Claude Code can orchestrate dynamic workflows for substantive tasks when Ultracode is enabled. This
is powerful but can burn tokens quickly, so use it only where the extra orchestration changes the
outcome.

- Use Claude workflows for high-value supervisor work: cross-PR synthesis, slice graph planning,
  evaluator prompt generation, workflow design, or ambiguity reduction before implementation.
- Do not use Claude workflows as the default NetScript implementation agent. WSL Codex remains the
  preferred implementation lane because it is daemon-attached, mobile-visible, and cheaper to steer
  slice-by-slice.
- Keep OpenHands as the evaluator. Claude workflows may prepare evaluator inputs, but they do not
  replace PLAN-EVAL or IMPL-EVAL.
- For cost control, route Claude dynamic-workflow stages by model: **Sonnet 5 by default**, and
  **Opus only for genuinely complex, thinking-heavy stages** (hard planning, adversarial
  verify/judge). **Never use Fable 5 inside a workflow** — it is the most powerful *and* the
  priciest model, so fanning it out burns plan tokens; reserve Fable 5 for a single
  deliberately-spawned sub-agent on an extremely complex, single-threaded engineering task. Run
  supervisor/evaluator sessions on **Opus 4.8 at high effort**. Launch workflow-oriented Claude
  sessions with `opusplan` or `high` only when planning complexity justifies it; reserve
  Ultracode/xhigh for explicit user requests or extreme design uncertainty.
- A workflow output is acceptable only if it produces compact artifacts: updated harness plan,
  slice briefs, agent prompts, or decision records. It should not leave hidden untracked work.

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
