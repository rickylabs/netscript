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
| `deno task agentic:smoke-claude-remote` | PASS/SKIP env-aware: PASS where `claude` is installed; SKIP with exit 0 when `claude` is absent |
| `deno check .llm/tools/agentic/*.ts` | PASS |

Notes:

- `agentic:smoke-claude-remote` runs in non-live mode by default. It verifies `claude --version`,
  `claude --help`, `claude remote-control --help`, and `claude agents --help` without launching a
  real background session. With `--env-aware`, CI or evaluator hosts without `claude` on PATH report
  `SKIP` and exit 0 instead of false-failing the tooling gate.
- Agentic Deno tasks and Claude hooks use `--no-lock`; `agentic:check-claude` runs the hook three
  times and verifies `deno.lock` remains unchanged.

## PLAN-EVAL Follow-up

- PLAN-EVAL PASS: OpenHands/minimax M3, action run `27721989442`.
- F-1 fixed: `.claude/settings.json` hook commands now include `--no-lock`.
- F-2 fixed: `claude-remote-smoke.ts` has `--env-aware` skip behavior and prints per-command exit
  codes/environment.
- F-3 cleaned locally before this follow-up commit: no unrelated `deno.lock` churn is included.
- F-4 recorded as process debt: future harness work must not commit implementation before
  PLAN-EVAL PASS unless the user explicitly waives the gate.

## Claude Workflows Design Addendum

- Claude dynamic workflows / Ultracode are allowed only for supervisor-side synthesis and planning
  tasks where the extra orchestration materially reduces ambiguity.
- WSL Codex remains the default implementation agent for NetScript slices because it is
  daemon-attached, mobile-visible, and token-efficient.
- OpenHands remains mandatory for PLAN-EVAL and IMPL-EVAL.
- Workflow output must be compact and durable: harness plan updates, slice briefs, evaluator prompts,
  or decision records. It must not leave hidden implementation state outside the harness artifacts.

## IMPL-EVAL Readiness

Date: 2026-06-18

Status: **READY_FOR_IMPL_EVAL**

### Gate Results

| Gate | Result |
| ---- | ------ |
| `deno task agentic:sync-claude:check` | PASS |
| `deno task agentic:check-claude` | PASS |
| `deno task agentic:smoke-claude-remote` | PASS |
| `deno check .llm/tools/agentic/*.ts` | PASS |

All gates confirmed green locally after follow-up commits (`d77df74e`, `6dc9140a`).

### Commits in Scope

- 2857f552: docs(agentic): add Claude-native supervision surface
- d77df74e: docs(agentic): incorporate plan eval workflow policy
- c3a320bf: docs(harness): record agentic hardening commit
- 25128601: chore(openhands): apply agent changes
- b64b5e90: chore(openhands): record run trace 27721989442-1
- 6dc9140a: docs(harness): record workflow policy follow-up

### PLAN-EVAL

- PASS — OpenHands/minimax M3, action run `27721989442`.
- F-1/F-2/F-3/F-4 all addressed in follow-up commits.

### Next Step

Trigger IMPL-EVAL via `@openhands-agent` comment on PR #50 using qwen 3.7 max.
