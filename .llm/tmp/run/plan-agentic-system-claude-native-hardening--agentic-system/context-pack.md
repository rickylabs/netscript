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

Update after PLAN-EVAL + follow-up (2026-06-18):

- PLAN-EVAL PASS: OpenHands/minimax M3, action run `27721989442`.
- F-1 fixed: hook commands include `--no-lock`; regression check in `agentic:check-claude`.
- F-2 fixed: `claude-remote-smoke.ts` has `--env-aware` skip behavior + per-command exit code output.
- F-3 fixed: no unrelated `deno.lock` churn in branch.
- F-4 recorded as process debt: future harness work must not commit before PLAN-EVAL PASS.
- Claude workflow policy recorded in `CLAUDE.md` and `worklog.md`.
- All 4 local gates confirmed green: agentic:sync-claude:check, agentic:check-claude,
  agentic:smoke-claude-remote, deno check .llm/tools/agentic/*.ts.
- Branch is clean and at parity with origin (top commit: 6dc9140a).
- commits.md updated with 6 commits total.
- **Next step: IMPL-EVAL** — trigger via `@openhands-agent` comment on PR #50, qwen 3.7 max.
