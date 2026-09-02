# Context Pack: #1920 MCP export-corpus CI gate

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `ci-mcp-export-corpus-gate--1920` |
| Branch | `ci/mcp-export-corpus-gate` |
| Current phase | `implement` |
| Archetype | `2 — Integration` (`packages/mcp`; generated internal asset only) |
| Scope overlays | `none` |

## Current State

Research and design are locked at the exact dispatched base. Determinism passed across two warm
generations and one pristine-cache generation. The generated corpus is intentionally present as an
unstaged implementation change while the harness bootstrap is committed independently.

## Completed

- Loaded required harness/toolchain/PR/RTK skills plus doctrine required by the package artifact.
- Confirmed clean branch, exact base, existing gate catalog entry, absent CI invocation, sibling
  step shape, and classifier architecture.
- Recorded `PLAN-EVAL: N/A` for this mechanical slice.
- Captured the expected stale-base exit 1 and three successful, byte-identical generations.

## In Progress

- Bootstrap artifact commit and draft-PR opening, followed by the workflow edit.

## Next Steps

1. Commit bootstrap artifacts and open the draft PR.
2. Wire the workflow step, prove trigger coverage and RED/GREEN teeth, validate, commit, push, and
   comment the implementation evidence.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Existing gate runner only | plan D2 | No new task or catalog entry. |
| `RUN_DENO` step condition | plan D1 | Matches corpus-affecting input classification. |
| Throwaway-worktree RED | plan D4 | Prevents a live generated file from masking staleness. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/ci-mcp-export-corpus-gate--1920/**` | new | Harness context and evidence |
| `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts` | changed | Deterministic generator output at pinned base; intentionally excluded from bootstrap commit |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | planned | `plan.md` validation table |
| Fitness | determinism passed; teeth pending | `evidence.md` |
| Runtime | N/A | No runtime behavior change |
| Consumer | planned | RED/GREEN corpus freshness proof |

## Open Questions

- None unless a stop condition or concurrent-main collision appears.

## Drift and Debt

- Drift: local `rtk` tool unavailable; focused raw fallbacks are in use.
- Debt: none created or deepened.

## Commits

- See the draft PR's commit list + per-slice PR comments (V3 retired `commits.md`).
