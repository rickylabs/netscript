# Worklog: Claude hook cwd independence

## Run Metadata

| Field          | Value                                                            |
| -------------- | ---------------------------------------------------------------- |
| Run ID         | `fix-claude-hook-log-cwd--1774`                                  |
| Branch         | `fix/claude-hook-log-cwd-independent`                            |
| Archetype      | N/A — repository agentic tooling, not a published package/plugin |
| Scope overlays | none                                                             |

## Design

### Public Surface

- `.claude/settings.json` is the checked-in Claude integration entrypoint. Its existing `PreToolUse`
  and `Stop` event/matcher behavior remains stable; only command execution becomes project-rooted
  exec form.
- `.llm/tools/agentic/claude/claude-hook-log.ts` remains a private executable sink. It exports no
  API and preserves stdin JSON → append-only JSONL behavior.
- `deno task agentic:claude-hook-log` and `deno task agentic:check-claude` remain the contributor
  task surfaces; no new task or command is introduced.

### Domain Vocabulary

- **Claude project root** — the active worktree path supplied/substituted by Claude as
  `CLAUDE_PROJECT_DIR`.
- **Turn cwd** — the directory inherited by a hook process; explicitly not a project-root source.
- **Configured handler** — one command hook beneath `PreToolUse` or `Stop` in live settings.
- **Active event log** — `<project-root>/.llm/tmp/claude/hooks/<run-id>/events.jsonl`.
- **Sibling decoy** — a temporary checkout-shaped cwd with a distinctive fake relative logger, used
  to prove the active project root wins over cwd.
- **RED fixture** — the committed test that fails against the current relative settings before any
  production repair.

No new exported type or interface is required. Test-only JSON configuration shapes must use typed
narrowing from `unknown`, never `any` or casting escapes.

### Ports

- Claude hook configuration supplies `CLAUDE_PROJECT_DIR` and substitutes the same placeholder in
  exec arguments.
- `Deno.stdin.readable` supplies the event payload.
- `Deno.env.get` consumes exactly the three named hook environment keys.
- `Deno.mkdir` and `Deno.writeTextFile` append inside the active hook-log subtree.
- `Deno.Command` is test/validator process execution. No shell is used after GREEN.

No new production port abstraction is justified; these are existing edge APIs.

### Constants

- `HOOK_EVENTS` — `PreToolUse`, `Stop`; test-only finite event set.
- `PROJECT_ROOT_PLACEHOLDER` — `${CLAUDE_PROJECT_DIR}`; configuration contract.
- Minimum env keys — `CLAUDE_PROJECT_DIR`, `NETSCRIPT_RUN_ID`, `CLAUDE_SESSION_ID`.
- Hook-log relative root — `.llm/tmp/claude/hooks`.
- Sibling-decoy exit/marker — a distinctive test-only value that cannot be confused with the real
  logger's success.

Do not add production constants unless repeated use in the actual implementation justifies them.

### Commit Slices

| #  | Slice                                                                                                                | Gate                                                                      | Files                                                                   |
| -- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| S3 | Commit/push the live-settings root/nested/sibling fixture while it is RED for both events.                           | Structured focused test exits nonzero and reports nested module failures. | `claude-hook-log_test.ts`, run artifacts                                |
| S4 | Apply combined exec-form/project-output repair and permission/task/validator/docs alignment; do not edit S3 fixture. | Same focused test GREEN; `agentic:check-claude` GREEN.                    | settings, logger, validator, `deno.json`, agentic README, run artifacts |
| S5 | Run/record all selected structured gates and prepare separate IMPL-EVAL handoff.                                     | Full validation table green; raw git/lock review.                         | run artifacts and PR surface only                                       |

Bootstrap, Research, and Plan are already independent pushed phase commits. S3 must be visible as a
failing commit before S4.

### Deferred Scope

- `wslHome()` and the retired `/home/codex` launcher default — separate launcher/home contract.
- General hook wrapper/framework — unnecessary for two identical handlers.
- Hook schema/blocking/log-retention behavior — unrelated to cwd resolution.
- CI workflow and leased Aspire/Docker/browser/scaffold gates — irrelevant and unauthorized here.

### Contributor Path

A contributor changing Claude hook logging starts in `.claude/settings.json`, follows its one
project-rooted command to `claude-hook-log.ts`, then runs `claude-hook-log_test.ts` and
`agentic:check-claude`. The focused test enumerates both required events and demonstrates how to add
a new cwd/worktree case without changing production code.

## Progress Log

| Time       | Slice     | Step       | Notes                                                                                                                     |
| ---------- | --------- | ---------- | ------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-30 | Bootstrap | Activated  | Loaded required authorities; verified branch/baseline; pushed first commit and opened draft PR #1775.                     |
| 2026-08-30 | Research  | Re-derived | Both configured events pass at root and fail from nested cwd with `Module not found`; raw output pushed in `research.md`. |
| 2026-08-30 | Plan      | Locked     | Combined settings/logger repair, granular permissions, RED→GREEN fixture, gate set, and sibling-defect deferral recorded. |

## Decisions

| Decision                                            | Reason                                                              | Source                         |
| --------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------ |
| Combined exec-form settings and project-root output | Either half alone leaves one cwd-relative failure.                  | `research.md`, `plan.md` D1–D4 |
| Exact env/write grants; no runtime read             | Permission probe proves the smaller contract.                       | `research.md`, `plan.md` D5    |
| Parse live settings in unchanged test               | Prevent duplicated-command false green and preserve historical RED. | `plan.md` D7                   |
| Sibling decoy distinguishes active worktree         | Exit-only/root-only tests cannot exclude cwd sibling resolution.    | `plan.md` D8                   |
| Defer `wslHome()`                                   | Unrelated launcher contract and tests; no silent scope widening.    | `plan.md` D9                   |

## Drift

| Drift                                        | Severity | Logged in drift.md |
| -------------------------------------------- | -------- | ------------------ |
| Owner-selected Codex medium planning session | minor    | yes                |

## Gate Results

### Plan Gate

| Gate                                                   | Result | Evidence                                               | Notes                         |
| ------------------------------------------------------ | ------ | ------------------------------------------------------ | ----------------------------- |
| Research current                                       | READY  | `research.md` raw root/nested output at exact baseline | Await evaluator confirmation. |
| Decisions/open sweep/slices/risks/gates/deferred scope | READY  | `plan.md`                                              | Await separate PLAN-EVAL.     |
| jsr-audit                                              | N/A    | Non-package/plugin tooling                             | No published surface.         |

### Static Gates

| Gate                     | Command or check                       | Result  | Notes                                       |
| ------------------------ | -------------------------------------- | ------- | ------------------------------------------- |
| Focused RED/GREEN        | Structured test wrapper                | NOT_RUN | Implementation prohibited before PLAN-EVAL. |
| Check/lint/fmt/root test | Structured wrappers/tasks in `plan.md` | NOT_RUN | Implementation phase gates.                 |

### Fitness Gates

| Gate                                         | Result  | Evidence                                 | Notes                                  |
| -------------------------------------------- | ------- | ---------------------------------------- | -------------------------------------- |
| Claude surface validator                     | NOT_RUN | `deno task agentic:check-claude` planned | Mandatory after changes.               |
| No host path / no `any` / permission minimum | NOT_RUN | Fixture + focused review planned         | Executable assertions, not prose-only. |

### Runtime Gates

| Gate                                            | Result  | Evidence                 | Notes                 |
| ----------------------------------------------- | ------- | ------------------------ | --------------------- |
| Actual root/nested/sibling Deno child processes | NOT_RUN | S3/S4 fixture            | Both events required. |
| Aspire/Docker/browser/scaffold                  | N/A     | Scope and lease boundary | Must not run.         |

### Consumer Gates

| Consumer                          | Result | Evidence                 | Notes |
| --------------------------------- | ------ | ------------------------ | ----- |
| Published package/plugin consumer | N/A    | No export/package change | —     |

## Handoff Notes

- PLAN-EVAL must be performed by a separate native Claude/Fable session dispatched by the
  supervisor; this Codex session does not evaluate its own plan.
- Inspect `research.md` raw RED first, then plan decisions D1–D10, exact handler contract, fixture
  discrimination, and validation table.
- Do not implement or add `plan-eval.md` in this session.
