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

## IMPL-EVAL Trigger

Date: 2026-06-18

IMPL-EVAL comment posted on PR #50 via @openhands-agent with:
- model: openrouter/qwen/qwen3.7-max
- output: pr-comment
- iterations: 800
- Harness mode: yes (use harness)

All local gates were confirmed green before trigger (see IMPL-EVAL Readiness section above).
Claude supervisor session status: re-baselined, artifacts verified, IMPL-EVAL triggered.
No implementation slices were needed — this is a docs/tooling PR with no remaining heavy work.
- Comment ID: 4736384438
- Comment URL: https://github.com/rickylabs/netscript/pull/50#issuecomment-4736384438

## Implementation Coverage Matrix (supervisor re-verification, 2026-06-18)

User challenged whether the IMPL-EVAL trigger was premature. Replacement supervisor session
re-verified all plan slices against actual file evidence. Matrix below.

| Plan Slice | Planned Concept | File Evidence | Commit | Gap Verdict |
| ---------- | --------------- | ------------- | ------ | ----------- |
| S1 | CLAUDE.md — Claude bootstrap + @AGENTS.md include | `CLAUDE.md` line 1-4: `@AGENTS.md`, supervisor rules, reasoning policy, workflow policy | 2857f552 | **NONE** |
| S1 | .claude/settings.json — hooks with --no-lock | `.claude/settings.json`: PreToolUse + Stop hooks, both use `--no-lock` flag | 2857f552 | **NONE** |
| S2 | sync-claude-skills.ts — skill mirror generator | `.llm/tools/agentic/sync-claude-skills.ts`: 140-line Deno script, collectSkills + diffMaps, `deno task agentic:sync-claude` registered in deno.json | 2857f552 | **NONE** |
| S2 | validate-claude-surface.ts — surface validator | `.llm/tools/agentic/validate-claude-surface.ts`: 132-line Deno script, checks CLAUDE.md, settings.json, .gitignore, sync check, hook lock regression; `deno task agentic:check-claude` in deno.json | 2857f552 | **NONE** |
| S2 | .claude/skills/ — mirrored skill directory | 15 mirrored SKILL.md files present in `.claude/skills/` (aspire, claude-manager, codex-wsl-remote, deno-fresh, design, fresh-ui-horizontal, impeccable, jsr-audit, netscript-cli, netscript-deno-toolchain, netscript-doctrine, netscript-harness, netscript-pr, netscript-tools, openhands-handoff, rtk, skill-creator) | 2857f552 | **NONE** |
| S3 | claude-manager skill | `.agents/skills/claude-manager/SKILL.md`: substantive skill with delegation contract, reasoning policy table, workflow steps | 2857f552 | **NONE** |
| S3 | codex-wsl-remote skill update | `.agents/skills/codex-wsl-remote/SKILL.md`: updated with launch model table, medium reasoning defaults | 2857f552 | **NONE** |
| S3 | .agents/skills/README.md — aspire entry fix | `.agents/skills/README.md` updated | 2857f552 | **NONE** |
| S4 | Reasoning policy in CLAUDE.md | `CLAUDE.md` lines 18-23: low/medium/high/xhigh policy table | 2857f552 | **NONE** |
| S5 | Hook --no-lock + lock regression check | validate-claude-surface.ts `runHookLockCheck()` runs hook 3x, compares deno.lock before/after | d77df74e | **NONE** |
| S5 | claude-remote-smoke.ts --env-aware | `.llm/tools/agentic/claude-remote-smoke.ts`: 144-line Deno script, `--env-aware` skip path, per-command exit code, `deno task agentic:smoke-claude-remote` in deno.json | d77df74e | **NONE** |
| S5 | claude-hook-log.ts | `.llm/tools/agentic/claude-hook-log.ts`: 44-line JSONL logger, writes `.llm/tmp/claude/hooks/` | 2857f552 | **NONE** |
| S6 | Claude workflow policy | `CLAUDE.md` lines 26-33: workflow policy section; worklog Claude Workflows Design Addendum | 6dc9140a | **NONE** |
| S7 | Harness artifacts + IMPL-EVAL handoff | All run artifacts committed; PLAN-EVAL PASS recorded; gates PASS; IMPL-EVAL triggered | 6c6a4091 / a1e08661 | **NONE** |

**Overall verdict: No implementation gap. IMPL-EVAL trigger was valid, not premature.**

All 7 plan slices are concretely implemented in working Deno TypeScript files, settings, and skill
docs. The prior supervisor session did not self-certify — it ran all 4 local gates and reported
them green before triggering IMPL-EVAL. The challenge was resolved by reading actual file content;
no WSL Codex implementation slice is needed.

Next action: monitor IMPL-EVAL comment at https://github.com/rickylabs/netscript/pull/50#issuecomment-4736384438.
