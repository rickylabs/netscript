# Context Pack: CLI and plugin subpath reference surfaces

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-cli-plugin-subpath-surface--1788` |
| Branch | `docs/cli-plugin-subpath-surface` |
| Current phase | implement |
| Archetype | 6 — CLI/tooling described; plugin surface inspected |
| Scope overlays | docs |

## Current State

CLI prose is complete and passes source format plus per-entrypoint symbol accounting. Plugin still
has 126 page-wide missing unique symbols with mixed existing coverage. PLAN-EVAL is recorded N/A
and the four-slice implementation shape is locked.

## Completed

- Required skills, workflow, docs overlay, doctrine public-surface guidance, issues, pages, export
  maps, source declaration locations, and generator chain read.
- CLI and plugin entrypoints enumerated with `deno doc --json`.
- CLI page corrected: 23/23 scaffolding and 29/29 testing symbols accounted.

## In Progress

- Slice 1 sign-off commit, then Slice 2 CLI-derived asset regeneration.

## Next Steps

1. Complete CLI page and regenerate its four assets.
2. Complete plugin page while preserving existing accurate coverage.
3. Regenerate final assets, run all gates, push explicit refspec, and open the requested PR.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| One PR | `plan.md` D1 | Shared issue, derived chain, and gates; reviewable tabular diff. |
| Re-export notes | `plan.md` D2 | Entry point completeness without duplicate descriptions. |
| No self-dispatched evaluator | Owner brief | Supervisor owns Tier-A and IMPL-EVAL. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/docs-cli-plugin-subpath-surface--1788/*` | new | Harness identity, research, plan, design, drift, and resumable state |
| `docs/site/reference/cli/index.md` | changed | Corrected claim, added one missing symbol and explicit re-export accounting |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static docs | PASS (partial) | CLI `check:source-format` exit 0 |
| Fitness/source accuracy | PASS (partial) | CLI `deno doc --json` accounting exit 0 |
| Runtime | N/A | Docs-only; Aspire/Docker prohibited |
| Consumer/generated | NOT_RUN | Pending regeneration |

## Open Questions

- None.

## Drift and Debt

- Drift: measured plugin coverage differs by entrypoint; one-PR sizing decision recorded.
- Debt: none created or changed.

## Commits

- See the PR commit list and per-slice comments after push.
