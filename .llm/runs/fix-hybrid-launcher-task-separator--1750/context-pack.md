# Context Pack: canonical agentic task separator

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-hybrid-launcher-task-separator--1750` |
| Branch | `fix/hybrid-launcher-task-separator` |
| Current phase | gate complete; publication and supervisor IMPL-EVAL handoff next |
| Archetype | N/A — internal tooling |
| Scope overlays | none |

## Current State

RED commit `94178f9ef` is preserved. GREEN centralizes exact-leading normalization across all 26
finite parsers. Focused tests pass 20/20, the full agentic suite passes 498/498, and structured
check/lint/fmt each process all 167 agentic TypeScript files. Direct and task dry-runs both exit 0;
unknown/later/second separator commands each exit 2. PLAN-EVAL is N/A; IMPL-EVAL is supervisor-owned.

## Completed

- Required skills/harness references loaded.
- Branch/base/worktree and boundary state verified.
- Complete task/parser survey and locked design recorded.
- Genuine RED committed and verified from a clean detached worktree.
- Shared exact-leading contract implemented across all 26 strict task entries.
- Parser, lifecycle, full agentic, static, and dry-run gates passed.

## In Progress

- Final diff/lock hygiene, GREEN commit, explicit push, and draft PR publication.

## Next Steps

1. Verify final status and byte-identical `deno.lock`.
2. Commit GREEN and push `HEAD:refs/heads/fix/hybrid-launcher-task-separator`.
3. Open the draft PR with `Closes #1750`, required labels, and milestone `0.0.7`.
4. Post the structured implementation evidence comment and stop for supervisor IMPL-EVAL.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Strip exactly one leading `--` | issue / plan D1 | Canonical Deno task form. |
| Reject any remaining `--` | issue / plan D2 | Second and non-leading separators fail closed. |
| Do not edit README | issue / plan D4 | Existing command is intentional. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-hybrid-launcher-task-separator--1750/*` | new | Harness bootstrap, survey, plan, and evidence. |
| `.llm/tools/agentic/lib/task-arguments.ts` | new | Shared exact-leading separator normalizer. |
| `.llm/tools/agentic/{claude,codex,github,opencode,openhands,runtime,teardown,wsl}/**` | changed | 26 strict entries normalize before parsing. |
| `.llm/tools/agentic/task-separator_test.ts` | new | Survey, direct/task lifecycle, fail-closed, and no-child coverage. |
| `.llm/tools/agentic/claude/*launcher_test.ts` | changed | Parser contract coverage. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS | check/lint/fmt: 167/167 files, exits 0 |
| Fitness | PASS | focused 20/20; full agentic 498/498 |
| Runtime | PASS | one fake child + bridge evidence per valid form; zero on parser failures; dry-run exits 0 |
| Consumer | N/A | Internal tooling only |

## Open Questions

- None. Publication metadata is prescribed by the owner.

## Drift and Debt

- Drift: owner-locked base trails the now-advanced local `main`; intentionally preserved.
- Debt: none.

## Commits

- See the draft PR's commit list + per-slice PR comments after publication.
