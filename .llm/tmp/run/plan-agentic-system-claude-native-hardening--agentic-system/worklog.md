# Worklog — Claude-Native Agentic System Hardening

## Design

### Public Surface

- `CLAUDE.md` is the Claude Code project bootstrap.
- `deno task agentic:sync-claude` generates `.claude/skills`.
- `deno task agentic:sync-claude:check` verifies the generated mirror.
- `deno task agentic:check-claude` validates the Claude project surface.
- `deno task agentic:smoke-claude-remote` validates local Claude CLI/remote-control availability.

### Domain Vocabulary

- Source skill: `.agents/skills/<name>/SKILL.md`.
- Claude mirror: `.claude/skills/<name>/SKILL.md`.
- Supervisor: Claude Code session that coordinates but does not certify its own work.
- Evaluator: OpenHands session using the configured evaluator model.
- Implementation agent: daemon-attached WSL Codex session with mobile-visible thread proof.

### Ports

- Claude CLI: called by the smoke tool only.
- Deno filesystem APIs: used for mirror generation, validation, and hook logging.
- GitHub/OpenHands: used after PR creation for evaluator handoff.

### Constants

- `sourceRoot`: `.agents/skills`
- `targetRoot`: `.claude/skills`
- Run ID: `plan-agentic-system-claude-native-hardening--agentic-system`

### Commit Slices

1. Add Claude bootstrap/settings and agentic tools.
2. Generate skill mirror and update skill/docs policy.
3. Record harness artifacts and gate evidence.

### Deferred Scope

- Live remote-control launch is optional and explicit via `--live`.
- Full replacement of WSL Codex implementation sessions is deferred until parity is proven.

### Contributor Path

Change a repo skill in `.agents/skills`, run `deno task agentic:sync-claude`, then run
`deno task agentic:check-claude`.

## Gate Evidence

| Gate | Result |
| ---- | ------ |
| `deno task agentic:sync-claude:check` | PASS |
| `deno task agentic:check-claude` | PASS |
| `deno task agentic:smoke-claude-remote` | PASS |
| `deno check .llm/tools/agentic/*.ts` | PASS |

Notes:

- `agentic:smoke-claude-remote` ran in non-live mode. It verified `claude --version`,
  `claude --help`, `claude remote-control --help`, and `claude agents --help` without launching a
  real background session.
- Agentic Deno tasks use `--no-lock` because the tools have no external imports and should not
  normalize `deno.lock`.
