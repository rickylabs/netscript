# Context Pack

Run: `plan-agentic-system-claude-native-hardening--agentic-system`

Base: `origin/feat/package-quality` at `d1a5f212`.

Purpose: make Claude Code a tracked first-class repo surface while preserving the existing
supervisor/evaluator/implementation split.

Key files:

- `CLAUDE.md`
- `.claude/settings.json`
- `.claude/skills/**/SKILL.md`
- `.llm/tools/agentic/*.ts`
- `.agents/skills/claude-manager/SKILL.md`
- `.agents/skills/codex-wsl-remote/SKILL.md`

Next expected step after PR creation: trigger PLAN-EVAL through OpenHands/minimax M3 against the
draft PR artifacts.
