# Plan — Claude-Native Agentic System Hardening

## Profile

- Scope overlay: docs/infrastructure/tooling.
- Affected surfaces: `AGENTS.md` bootstrap, repo skills, `.llm/tools`, Claude Code project config,
  OpenHands/Codex orchestration doctrine.
- Current doctrine verdict: no package runtime surface change.

## Locked Decisions

- Keep `AGENTS.md` as the cross-agent source of truth and add `CLAUDE.md` as Claude-specific
  startup context.
- Keep `.agents/skills` as the canonical skill source; generate `.claude/skills` from it.
- Keep OpenHands as the evaluator for PLAN-EVAL and IMPL-EVAL.
- Keep daemon-attached WSL Codex as the implementation-agent path for mobile-visible slice work.
- Use Claude native hooks, project settings, `--bg`, `remote-control`, and `agents` status as
  complements and verified replacements only where smoke evidence exists.

## Commit Slices

1. Claude bootstrap and project settings.
2. Skill mirror generator and validator.
3. Repo `claude-manager` skill and stale skill-doc cleanup.
4. Claude/Codex reasoning and delegation policy updates.
5. Harness artifacts, gates, draft PR, and evaluator handoff.

## Risks

- Mirrored skills can drift. Mitigation: `agentic:sync-claude:check` and `agentic:check-claude`.
- Claude remote-control behavior can vary by installed CLI version. Mitigation: smoke script checks
  local `claude` help output and requires explicit `--live` for real launches.
- Hooks can add noise. Mitigation: v1 hooks only append JSONL under `.llm/tmp/claude/`.

## Deferred Scope

- Replacing WSL Codex implementation sessions with Claude remote-control worktrees.
- Claude plugin packaging for repo skills.
- Agent SDK-based orchestration.
