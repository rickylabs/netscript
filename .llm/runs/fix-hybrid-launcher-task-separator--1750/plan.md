# Plan: canonical agentic task separator

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-hybrid-launcher-task-separator--1750` |
| Branch | `fix/hybrid-launcher-task-separator` |
| Phase | `plan` |
| Target | internal agentic launcher/parser tooling |
| Archetype | N/A — no package/plugin surface changes; Archetype-6 fail-closed CLI guidance applies |
| Scope overlays | none |

## Current Doctrine Verdict

N/A. The codebase verdict governs `packages/**` and `plugins/**`; both are excluded.

## Goal

Make every strict `agentic:*` task parser accept exactly one leading Deno task separator while
preserving fail-closed behavior for every later separator and every other unknown argument.

## Scope

- Shared argument-boundary primitive under `.llm/tools/agentic/lib/`.
- The 26 strict task entry points enumerated in `research.md`.
- Parser, direct-script, task-invocation, and hybrid lifecycle tests.
- Harness run evidence and PR handoff.

## Non-Scope

- Permissive/no-argument task utilities, routing/model/provider policy, packages, plugins,
  `runtime/sender-*`, `codex-thread-read`, and `deno.lock`.
- A live Remote Control launch, ready-for-review transition, label changes after PR creation, or
  IMPL-EVAL dispatch.
- README edits: the documented leading-separator form is the canonical contract being implemented.

## Hidden Scope

- Five strict parsers already accept `--` anywhere and must be tightened, not left untouched.
- Help prechecks must normalize before scanning so a second/non-leading `--` cannot bypass strict
  parsing.
- Parser failure must happen before any child spawn; the lifecycle test records fake-child count.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Accept and discard exactly one leading `--`. | Matches the canonical README and Deno 2.9.5 task forwarding. |
| D2 | Reject every remaining `--` as `Unknown argument: --`. | Preserves the finite parser and makes second/non-leading separators fail closed. |
| D3 | Centralize D1/D2 in one shared pure helper used by all 26 strict entries. | Prevents parser-by-parser drift while keeping each existing vocabulary unchanged. |
| D4 | Keep the README unchanged. | Its example already expresses the chosen contract. |
| D5 | Use fake lifecycle dependencies/subprocesses only. | Proves one child and bridge evidence without violating the live-supervisor boundary. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Separator position and multiplicity | resolved now | D1 and D2 lock the only permitted shape. |
| Permissive utility behavior | safe to defer | Those six entries do not claim finite parsing and are outside the survey predicate. |
| Live supervisor proof | safe to defer | Explicitly supervisor-owned; lifecycle fake and dry-run evidence are required here. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Broad survey misses a task | Encode the 32-task survey and 26 strict mappings in tests against `deno.json`. |
| Helper weakens unknown rejection | Helper handles only `--`; existing parsers continue handling all other tokens. |
| Help path bypasses later-separator rejection | Normalize before any `includes('--help')` precheck. |
| False RED from uncommitted implementation | Verify the RED commit in a separate clean throwaway worktree. |
| Parser failure leaks a child | Subprocess lifecycle test uses a fake `claude` executable and asserts zero invocations. |
| Validation mutates lock | Hash/compare `deno.lock` before handoff. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-11 / AP-25 | risk | Keep parser normalization pure and child lifecycle at existing edges. |
| General permissive parsing | existing | Tighten the five unconditional-separator parsers. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| Strict separator contract | yes | Shared-helper, parser, task-map, and lifecycle tests |
| Static check/lint/fmt | yes | Structured wrappers scoped to `.llm/tools/agentic` TypeScript |
| Runtime lifecycle | yes | Fake Claude direct/task runs prove one child + PID/cwd/session/bridge; failures prove zero children |
| JSR/package doctrine | no | No package/plugin surface touched |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| none | none | No relevant debt and no deferred violation introduced. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | RED | targeted structured test wrapper in clean RED worktree | non-zero from leading-separator assertions |
| 2 | Tests | targeted structured test wrapper for separator + affected launchers | exit 0 |
| 3 | Check | structured check wrapper on `.llm/tools/agentic` | exit 0 |
| 4 | Lint | structured lint wrapper on `.llm/tools/agentic` | exit 0 |
| 5 | Format | structured fmt wrapper on `.llm/tools/agentic` TypeScript | exit 0 |
| 6 | Dry-run | direct and task `codex-resume --dry-run` with invalid-safe fixtures | equivalent exit/output, no send |
| 7 | Hygiene | raw Git status/diff and `deno.lock` hash | only owned files; lock byte-identical |

## Drift Watch

- Any strict task parser outside the 26-entry survey.
- Any required change to README, routing policy, sender ownership, or package/plugin code.
- Any lifecycle test that requires a real provider or globally serialized supervisor.
