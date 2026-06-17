# Plan & Design — READY FOR REVIEW

This draft PR hardens the NetScript agentic system by making Claude Code a tracked first-class repo
surface while preserving the existing doctrine:

- Claude supervises.
- OpenHands evaluates.
- WSL Codex implements mobile-visible slices when implementation agents are required.

## Changes

- Add `CLAUDE.md` importing `AGENTS.md`.
- Add shared `.claude/settings.json` hooks for lightweight lifecycle logging.
- Generate `.claude/skills` from `.agents/skills`.
- Add `agentic:*` Deno tasks for Claude surface checks and remote-control smoke.
- Add repo `claude-manager` skill.
- Update stale skill docs and Codex WSL reasoning defaults.

## Gates

- `deno task agentic:sync-claude:check`
- `deno task agentic:check-claude`
- `deno task agentic:smoke-claude-remote`
- `deno check .llm/tools/agentic/*.ts`

Do not merge until the Plan-Gate and the final evaluator pass are complete.
