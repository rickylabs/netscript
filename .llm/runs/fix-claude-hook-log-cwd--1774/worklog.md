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

- **Claude session launch root** — the checkout root where the session started, supplied/substituted
  as `CLAUDE_PROJECT_DIR`; it does not follow `EnterWorktree`.
- **Turn cwd** — the directory inherited by a hook process; explicitly not a project-root source.
- **Configured handler** — one command hook beneath `PreToolUse` or `Stop` in live settings.
- **Launch-root event log** — `<session-launch-root>/.llm/tmp/claude/hooks/<run-id>/events.jsonl`.
- **Sibling decoy** — a `Deno.makeTempDir` cwd with a distinctive fake logger at the exact relative
  command path, used to prove the modeled session launch root wins over cwd.
- **RED fixture** — the committed test that fails against the current relative settings before any
  production repair.

No new exported type or interface is required. Test-only JSON configuration shapes must use typed
narrowing from `unknown`, never `any` or casting escapes.

### Ports

- Claude hook configuration supplies the session launch root as `CLAUDE_PROJECT_DIR` and substitutes
  the same placeholder in exec arguments.
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

| #  | Slice                                                                                                                | Gate                                                                                | Files                                                                   |
| -- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| S3 | Commit/push the live-settings root/nested/temp-decoy fixture while it is RED for both events.                        | Structured test reports nested failures and positive decoy marker/distinctive exit. | `claude-hook-log_test.ts`, run artifacts                                |
| S4 | Apply combined exec-form/project-output repair and permission/task/validator/docs alignment; do not edit S3 fixture. | Same focused test GREEN; `agentic:check-claude` GREEN.                              | settings, logger, validator, `deno.json`, agentic README, run artifacts |
| S5 | Run/record all selected structured gates and prepare separate IMPL-EVAL handoff.                                     | Full validation table green; raw git/lock review.                                   | run artifacts and PR surface only                                       |

Bootstrap, Research, and Plan are already independent pushed phase commits. S3 must be visible as a
failing commit before S4.

### Deferred Scope

- `wslHome()` and the retired `/home/codex` launcher default — separate launcher/home contract
  tracked by #1776.
- Execution/output that follows `EnterWorktree` rather than the session launch root.
- General hook wrapper/framework — unnecessary for two identical handlers.
- Hook schema/blocking/log-retention behavior — unrelated to cwd resolution.
- CI workflow and leased Aspire/Docker/browser/scaffold gates — irrelevant and unauthorized here.

### Contributor Path

A contributor changing Claude hook logging starts in `.claude/settings.json`, follows its one
project-rooted command to `claude-hook-log.ts`, then runs `claude-hook-log_test.ts` and
`agentic:check-claude`. The focused test enumerates both required events and demonstrates how to add
a new cwd/worktree case without changing production code.

## Progress Log

| Time       | Slice     | Step         | Notes                                                                                                                     |
| ---------- | --------- | ------------ | ------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-30 | Bootstrap | Activated    | Loaded required authorities; verified branch/baseline; pushed first commit and opened draft PR #1775.                     |
| 2026-08-30 | Research  | Re-derived   | Both configured events pass at root and fail from nested cwd with `Module not found`; raw output pushed in `research.md`. |
| 2026-08-30 | Plan      | Locked       | Combined settings/logger repair, granular permissions, RED→GREEN fixture, gate set, and sibling-defect deferral recorded. |
| 2026-08-30 | Plan      | PR sync      | Updated draft body/comment and moved exactly one lifecycle label to `status:plan-eval`; REST fallback recorded in drift.  |
| 2026-08-30 | PLAN-EVAL | Cycle 1      | `FAIL_PLAN` at `26102943`; evaluator artifact committed at `842816a2`; implementation remained stopped.                   |
| 2026-08-30 | Plan      | Amendment    | Corrected launch-root semantics and pinned decoy, host-path, and #1776 contracts for cycle 2.                             |
| 2026-08-30 | PLAN-EVAL | Cycle 2      | `PASS` at `2e5f50f0`; artifact-only verdict committed at `2cfc0b4c9`; both evaluator files remain bit-identical.          |
| 2026-08-30 | S3        | RED fixture  | Added live-settings coverage; root and decoys pass, while nested `PreToolUse` and `Stop` each fail before repair.         |
| 2026-08-30 | S3        | Fmt nit      | Applied the cycle-2 `research.md` table fix and formatted all five files changed by this slice.                           |
| 2026-08-30 | S3        | Boundary     | Committed/pushed RED at `f8e6ad0c9`; posted slice evidence and retained draft PR with `status:impl`.                      |
| 2026-08-30 | S4        | GREEN repair | Applied exec-form launch-root commands/output and exact permissions; unchanged fixture passes 9/9.                        |
| 2026-08-30 | S4        | Gate drift   | Aggregate Claude gate exposed two stale generated skill mirrors; canonical sync reconciled them and rerun passed.         |

## Decisions

| Decision                                            | Reason                                                              | Source                         |
| --------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------ |
| Combined exec-form settings and project-root output | Either half alone leaves one cwd-relative failure.                  | `research.md`, `plan.md` D1–D4 |
| Exact env/write grants; no runtime read             | Permission probe proves the smaller contract.                       | `research.md`, `plan.md` D5    |
| Parse live settings in unchanged test               | Prevent duplicated-command false green and preserve historical RED. | `plan.md` D7                   |
| Reachable decoy distinguishes launch root from cwd  | Positive RED plus negative GREEN prevents a vacuous marker check.   | `plan.md` D8                   |
| Defer `wslHome()` to #1776                          | Unrelated launcher contract and tests; deferral is tracked.         | `plan.md` D9                   |

## Drift

| Drift                                              | Severity    | Logged in drift.md |
| -------------------------------------------------- | ----------- | ------------------ |
| Owner-selected Codex medium planning session       | minor       | yes                |
| `gh pr edit` over-fetched scopes; REST fallback    | minor       | yes                |
| Active-worktree premise corrected to launch root   | significant | yes                |
| Fetched `origin/main` moved but hook surface inert | minor       | yes                |
| Mandatory gate found stale generated skill mirrors | minor       | yes                |

## Gate Results

### Plan Gate

| Gate                                                   | Result | Evidence                                               | Notes                        |
| ------------------------------------------------------ | ------ | ------------------------------------------------------ | ---------------------------- |
| Research current                                       | PASS   | `research.md` raw root/nested output at exact baseline | Cycle-2 evaluator confirmed. |
| Decisions/open sweep/slices/risks/gates/deferred scope | PASS   | Amended `plan.md`; verdict `2cfc0b4c9`                 | Plan gate cleared.           |
| jsr-audit                                              | N/A    | Non-package/plugin tooling                             | No published surface.        |

### Static Gates

| Gate                   | Command or check                       | Result  | Notes                                                           |
| ---------------------- | -------------------------------------- | ------- | --------------------------------------------------------------- |
| Focused RED fixture    | Structured test wrapper                | RED     | S3 exit 1; 7 passed, 2 nested-event failures.                   |
| Focused GREEN fixture  | Same unchanged structured test         | PASS    | S4 exit 0; 9 passed, 0 failed; fixture blob unchanged.          |
| Decoy assertions       | Focused child-process cases            | PASS    | RED marker/73; GREEN marker absent + launch-root record.        |
| S3 changed-file format | Structured fmt wrapper                 | PASS    | Exit 0; 5 selected / 5 processed / 0 findings.                  |
| S4 changed-file format | Structured fmt wrapper                 | PASS    | 10 changed counted; 8 authored processed, 2 generated excluded. |
| Check/lint/root test   | Structured wrappers/tasks in `plan.md` | NOT_RUN | S5 final gate set.                                              |

### Fitness Gates

| Gate                              | Result  | Evidence                         | Notes                             |
| --------------------------------- | ------- | -------------------------------- | --------------------------------- |
| Claude surface validator          | PASS    | Public + JSON invocations exit 0 | Hook lock check and sync green.   |
| No host path / permission minimum | PASS    | S4 unchanged fixture             | Exact six-file/config assertions. |
| No `any`                          | NOT_RUN | S5 source scan planned           | Full owned surface after repair.  |

### Runtime Gates

| Gate                                 | Result  | Evidence                 | Notes                           |
| ------------------------------------ | ------- | ------------------------ | ------------------------------- |
| Actual launch-root child processes   | PASS    | S4 fixture: both events  | Exit 0 and launch-root record.  |
| Actual nested-cwd child processes    | PASS    | S4 fixture: both events  | Exit 0 and launch-root record.  |
| Reachable temp-decoy child processes | PASS    | S3 RED / S4 GREEN        | Marker+73 before; bypass after. |
| Aspire/Docker/browser/scaffold       | NOT_RUN | Scope and lease boundary | Must remain not run.            |

### Consumer Gates

| Consumer                          | Result | Evidence                 | Notes |
| --------------------------------- | ------ | ------------------------ | ----- |
| Published package/plugin consumer | N/A    | No export/package change | —     |

## Handoff Notes

- Cycle-2 PLAN-EVAL passed in the separate evaluator session; implementation is authorized.
- S3 remains the independent pushed RED commit; its test blob is byte-identical under S4 GREEN.
- #1776 owns the deferred `wslHome()` `/home/codex` launcher defect for milestone 0.0.8.
- Do not edit either evaluator-owned plan-eval file or launch/simulate IMPL-EVAL in this session.
