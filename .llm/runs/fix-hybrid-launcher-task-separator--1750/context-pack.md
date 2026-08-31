# Context Pack: canonical agentic task separator

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-hybrid-launcher-task-separator--1750` |
| Branch | `fix/hybrid-launcher-task-separator` |
| Current phase | implement — RED |
| Archetype | N/A — internal tooling |
| Scope overlays | none |

## Current State

The branch is clean at owner-locked base `58a4a10e`. Surveyed all 32 exposed `agentic:*` tasks:
26 use finite parsers, 21 reject a leading separator, five accept separators too broadly, and six
permissive/no-parser utilities are outside the strict contract. PLAN-EVAL is recorded N/A.

## Completed

- Required skills/harness references loaded.
- Branch/base/worktree and boundary state verified.
- Complete task/parser survey and locked design recorded.

## In Progress

- RED parser and lifecycle tests.

## Next Steps

1. Commit RED tests and artifacts.
2. Verify RED from that commit in a clean throwaway worktree.
3. Implement shared exact-leading normalization across all 26 strict entry points.
4. Run targeted/static/dry-run gates, commit GREEN, push explicit refspec, and open the draft PR.

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

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | NOT_RUN | GREEN phase |
| Fitness | planned | Separator contract tests |
| Runtime | planned | Fake hybrid direct/task lifecycle |
| Consumer | N/A | Internal tooling only |

## Open Questions

- None.

## Drift and Debt

- Drift: owner-locked base trails the now-advanced local `main`; intentionally preserved.
- Debt: none.

## Commits

- See the draft PR's commit list + per-slice PR comments after publication.
