# NetScript Claude Code Bootstrap

@AGENTS.md

## Claude Supervisor Rules

- Treat this file as Claude-specific startup context only. Cross-agent doctrine remains in
  `AGENTS.md`, `.agents/skills/`, and `.llm/harness/`.
- For harnessed NetScript work, Claude coordinates. OpenHands evaluates. WSL Codex implements
  slice work when a mobile-visible implementation agent is required.
- Before invoking a repo skill by name, check whether it exists in `.claude/skills/`. If it does
  not, read the matching `.agents/skills/<name>/SKILL.md` directly.
- Use `.llm/tools/agentic/validate-claude-surface.ts` when Claude configuration, skills, hooks, or
  agent orchestration docs change.
- Keep `.claude/skills/` generated from `.agents/skills/`; do not hand-edit mirrored files.

## Reasoning Policy

- Use low effort for mechanical, no-reasoning tasks.
- Use medium effort for daily implementation and supervision.
- Use high effort when the agent must self-evaluate, debug an unclear failure, or choose among
  plausible fixes.
- Use xhigh only when explicitly requested or when the task is unusually complex and high-risk.
