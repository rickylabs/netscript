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

Update after PLAN-EVAL:

- PLAN-EVAL PASS: OpenHands/minimax M3, action run `27721989442`.
- Follow-up slice addresses F-1/F-2: hook `--no-lock`, hook lock regression, env-aware Claude smoke.
- Claude workflow policy added: use dynamic workflows/Ultracode only as an expensive supervisor
  accelerator, prefer WSL Codex for implementation, keep OpenHands for evaluation.
