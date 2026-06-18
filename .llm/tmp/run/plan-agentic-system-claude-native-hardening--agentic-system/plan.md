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
- Treat Claude dynamic workflows / Ultracode as a high-cost supervisor accelerator, not the default
  implementation lane. Use it to produce compact plans, slice briefs, evaluator prompts, and
  orchestration decisions; hand implementation to daemon-attached WSL Codex and evaluation to
  OpenHands.

## Commit Slices

1. Claude bootstrap and project settings.
2. Skill mirror generator and validator.
3. Repo `claude-manager` skill and stale skill-doc cleanup.
4. Claude/Codex reasoning and delegation policy updates.
5. Evaluator follow-up: hook `--no-lock`, hook lock regression, env-aware Claude smoke evidence.
6. Claude workflow policy: document when to use `opusplan`/Ultracode, how to cap token burn, and
   how workflow outputs feed WSL Codex/OpenHands instead of replacing them.
7. Harness artifacts, gates, draft PR, and evaluator handoff.

## Risks

- Mirrored skills can drift. Mitigation: `agentic:sync-claude:check` and `agentic:check-claude`.
- Claude remote-control behavior can vary by installed CLI version. Mitigation: smoke script checks
  local `claude` help output, reports environment/exit code, skips cleanly when `claude` is absent
  in CI, and requires explicit `--live` for real launches.
- Hooks can add noise or lockfile churn. Mitigation: v1 hooks use `--no-lock`, append JSONL under
  `.llm/tmp/claude/`, and `agentic:check-claude` verifies `deno.lock` remains unchanged after hook
  runs.
- Claude workflows can burn tokens rapidly. Mitigation: default to WSL Codex for implementation,
  reserve Ultracode/xhigh for explicit or extreme supervisor tasks, and require workflow output to
  be compact harness artifacts rather than hidden implementation.

## Deferred Scope

- Replacing WSL Codex implementation sessions with Claude remote-control worktrees.
- Claude plugin packaging for repo skills.
- Agent SDK-based orchestration beyond documented Claude workflow policy.
