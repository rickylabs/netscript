# IMPL-EVAL — PR #799 reconcile origin/main into feat/beta10-integration

- Evaluator: Claude · Fable 5 · low (route `review_codex`, opposite family to Codex Sol·medium generator)
- Subject: worktree `/home/codex/repos/b10-mainrec`, branch `chore/reconcile-main-into-beta10` @ `bf2629e5` (merge of `d962502f` integration + `10162bfd` origin/main tip)
- Date: 2026-07-17

## Verdict

**FAIL_FIX**

The merge implements the owner-ratified routing doctrine correctly and is a pure semantic union, but the conflict resolution introduced a duplicate import in `packages/cli/src/public/features/plugins/ai/ai-plugin-command.ts` that breaks `deno check` on the CLI entrypoints (finding 1). One-line fix; plan remains valid.

## Probe results

| Probe | Result | Evidence |
| --- | --- | --- |
| 1. Main containment | PASS | `git log --oneline origin/main --not HEAD` → empty. `git diff HEAD origin/main --stat -- packages/mcp skills` → empty. Full agentic combo (packages/mcp, skills/, agent CLI) carried; second parent is `10162bfd` (#715). |
| 2. Routing doctrine | PASS | `routing-policy.ts`: review ladder intact — `review_codex_light` Opus·high (fallback Sonnet·high), `review_codex` Fable·low `included` (fallback Opus·low), `review_codex_complex` Fable·medium `included` (fallback Opus·medium), `review_codex_fast` Opus·medium (fallback Sonnet·high). `planning_decisions` + `deep_analysis` primaries = Fable·low `included` (`default_orchestrator` / `default_complex_decision_subagent`) with Codex Sol·high token-limit fallbacks — #784 state. No lane entry carries `subscriptionState: 'outside_plan'` (only the type const and guard logic at lines 45/481/518). `lane-policy.md` matches row-for-row incl. the #794 pairing table and the "Fable 5 restored as default (2026-07-16)" section; `mobile_orchestration` lane removed. Zero occurrences of `temporary_while_fable_outside_subscription` in routing/config/tests. |
| 3. Union plausibility | PASS | `git diff d962502f...HEAD --stat` → 251 files, 15055+/423−. Only merge-exclusive files (changed vs a parent but not on the other side's diff) are the six `.llm/runs/chore-reconcile-main-into-beta10--release-union/*` harness artifacts of this run itself — expected. |
| 4a. Routing/config tests | PASS | `deno test --no-lock -A .llm/tools/agentic/runtime/ .llm/tools/agentic/config/` → 153 passed, 0 failed. |
| 4b. MCP stdio smoke | PASS | `deno test --no-lock -A packages/mcp/tests/stdio_test.ts` → 1 passed, 0 failed. |
| 4c. deno check entrypoints | **FAIL** | `deno check --no-lock --unstable-kv packages/mcp/mod.ts packages/mcp/cli.ts packages/cli/mod.ts packages/cli/maintainer.ts packages/cli/scaffolding.ts` → 2 × TS2300 Duplicate identifier `netscriptJsrSpecifier` in `packages/cli/src/public/features/plugins/ai/ai-plugin-command.ts`. |
| 5. Suppressions | PASS | `git diff HEAD^1 HEAD` grep for `@ts-ignore`/`@ts-expect-error`/`@ts-nocheck`/`deno-lint-ignore`/`as never`/`eslint-disable` → only prose hits inside run-artifact Markdown; no code suppressions added. |

## Findings

1. **BLOCKING — duplicate import from merge resolution.** `packages/cli/src/public/features/plugins/ai/ai-plugin-command.ts` imports `netscriptJsrSpecifier` from `../../../../kernel/constants/jsr-specifiers.ts` twice (lines 6 and 9 of the merged file). Each parent (`HEAD^1` line 8, `HEAD^2` line 6) has it exactly once at different positions; the resolution kept both. `deno check --unstable-kv` fails with 2 × TS2300 on the CLI entrypoints. Fix: delete one of the two identical import lines and re-run probe 4c.
2. **Minor, non-blocking — forbidden token in historical artifacts.** `temporary_while_fable_outside_subscription` still appears in `.llm/runs/beta10--orchestrator/worklog.md` + `supervisor.md` (pre-existing on the integration parent, historical narrative) and in `.llm/runs/chore-reconcile-main-into-beta10--release-union/plan.md` line 30 (the acceptance criterion quoting the token). No occurrence in routing files, config, or tests; the merge actually *removed* the last live occurrence from main's `lane-policy.md`. Judged non-blocking as these are immutable run history / the criterion's own text — flag to owner if the "zero anywhere" criterion is meant literally over run artifacts.

## Rationale

Approved scope (semantic union + routing doctrine) is fully realized and independently verified; the single blocker is a mechanical merge artifact, so `FAIL_FIX` per verdict-definitions ("a required gate fails" — the type-check gate — "plan remains valid").

## Cycle 2

**Verdict: PASS** (2026-07-17, branch tip `1320b1da`)

Fix commit `1320b1da` ("fix(cli): remove duplicate JSR specifier import") re-verified in `/home/codex/repos/b10-mainrec` after fetch + reset to origin tip:

- `git show --stat 1320b1da` → exactly one file, `packages/cli/src/public/features/plugins/ai/ai-plugin-command.ts`, 1 deletion; nothing else changed.
- `grep netscriptJsrSpecifier` on the file → single import (line 8) + single use (line 12). Cycle 1 finding 1 resolved.
- `deno check --no-lock --unstable-kv packages/cli/bin/netscript.ts packages/cli/bin/netscript-dev.ts` → exit 0, no errors.

All Cycle 1 probes (main containment, routing doctrine, union purity, 153/153 routing+config tests, mcp stdio smoke, no suppressions) remain valid — the fix commit's diff is confined to the single duplicate-import line. Finding 2 (token in historical run artifacts) stands as non-blocking, owner's call.
