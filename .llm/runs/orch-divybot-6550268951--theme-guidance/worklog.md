# Worklog

## Design

1. Public surface: generated apps' AGENTS.md and ui:add page nextSteps. Existing function contracts unchanged.
2. Vocabulary: app preset, HTML shell, shared chrome and navigation; existing ConventionReference IDs extended.
3. Ports: existing scaffold/template interfaces; no new external interface.
4. Constants: LOOK_AND_FEEL_REFERENCES, THEME_GUIDE_SLUG, CUSTOMIZE_GUIDE_SLUG; retain PAGE_FRAME_GUIDANCE.
5. Commit slices: bootstrap plan; one implementation slice in the four assigned files, proven by semantic tests and configured gates; close evidence after independent review. Every implementation commit updates this run.
6. Deferred scope: recipe/docs/carrier updates owned by #2554; no command or token engine redesign.
7. Contributor path: packages/cli/src/kernel/templates/app/agent-conventions.ts defines generated app guidance.

PLAN-EVAL: N/A — mechanical bounded guidance update with owner-provided contract.

## Bootstrap

Read supplied leaf profile, skills and relevant harness/doctrine rules; no target profiles/ read.
Queried feature routing and checked issue comments, linked docs PR, duplicate PR search and available local memory.

## Implementation and gate evidence

Applied complete owner diff with `git apply`; kept four-file product scope. Corrected token init to explicitly select current preset, and replaced absolute per-page styling prohibition with app-wide theme guidance. Strengthened page nextSteps assertions for both commands and removal of stale advice.

| Gate | Result | Evidence |
| --- | --- | --- |
| Structured focused tests | PASS, exit 0 | 35 passed, 0 failed/ignored across agent-conventions, web-scaffold, app-navigation, public-command-tree; 25.8 seconds |
| Structured check | PASS, exit 0 | 4 changed TS files, 0 findings, --unstable-kv |
| Structured lint | PASS, exit 0 | 4 selected/processed files, root recommended/jsr rules without CLI exclusion |
| Structured fmt | PASS, exit 0 | 4 selected/processed files, root formatting options without CLI exclusion |
| quality:gate | PASS, exit 0 | quality:scan + dependency alignment + architecture checks; existing warnings only |
| release:preflight | PASS, exit 0 | text imports, import attributes, file URL/import.meta, self-imports |
| docs:accuracy | PASS, exit 0 | 214 source pages, 210 corpus files, 111/111 public commands |
| JSR package audit | PASS command, exit 0 | dry-run OK; 24 existing warning findings; public exports unchanged |
| Full scaffold.runtime --cleanup --format pretty | UNPROVEN, exit 1 | preflight.aspire doctor failed; cleanup cannot connect to Docker unix socket; runtime did not start |
| maint:leak-check | Read-only report, exit 0 | Docker inspection unavailable; 24 survivors with unproven ownership, left untouched |

Commands use `.llm/tools/run-deno-{test,check,lint,fmt}.ts`. Test targets:
- packages/cli/src/kernel/templates/app/agent-conventions_test.ts
- packages/cli/src/kernel/application/ui/page/web-scaffold_test.ts
- packages/cli/src/kernel/application/ui/page/app-navigation_test.ts
- packages/cli/src/public/features/root/public-command-tree_test.ts

First test invocation used the wrong public-command-tree path; corrected immediately and reran all four suites. First fmt wrapper refused root's CLI exclusion; reran with same formatting rules and explicit no-exclude config. Neither failed attempt counts as PASS.

No carrier source changed: this generator is executed by the app scaffold directly, while assets embedding consumes kernel/assets and docs/skills sources. Companion #2554 owns prose/MCP/skill carriers. Existing public-command-tree integration tests verify all named paths exist in both scaffold modes.

## Reconcile

PR #2555 exists as draft on assigned branch; companion #2554 remains OPEN. Original issue acceptance includes docs/carriers outside this code PR and remains unchecked; do not apply status:ready-merge or claim full issue closure now. Assignment requires closing line in PR body, so merge must wait for companion acceptance. No new architectural debt.

## Independent slice review and sign-off

Independent Claude Opus 5.5/high requested, observed model claude-opus-5-5: **PASS on code correctness**; no blocking changes. Independently repeated 35 tests and scoped fmt, and verified a fresh scaffold. See evaluate.md for advisories and merge limitations. Review observed bootstrap PR/worklog during execution; implementation evidence and final PR checklist are reconciled before sign-off commit.

Final diff review: four product files, scoped harness artifacts only; no imports, exports, dependency pins or generated carriers changed. git diff --check passes. Review thread gate: PASS, 0 threads.
