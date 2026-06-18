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

## Claude Workflow Policy

- Treat Claude dynamic workflows / Ultracode as an expensive supervisor accelerator for hard
  planning, research synthesis, and orchestration design.
- Do not use Claude workflows as the default implementation lane for NetScript harness slices.
- Prefer WSL Codex subagents for implementation so the work remains mobile-visible, daemon-attached,
  and token-efficient.
- When a workflow is justified, cap its role to producing a compact plan, agent briefs, or
  evaluator prompts that are then handed to OpenHands or WSL Codex.
