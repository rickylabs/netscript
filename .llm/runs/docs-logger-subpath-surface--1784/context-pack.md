# Context Pack: logger sub-path reference surface

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-logger-subpath-surface--1784` |
| Branch | `docs/logger-subpath-surface` |
| Current phase | `gate` |
| Archetype | `N/A` for implementation; underlying logger is Doctrine Archetype 2 |
| Scope overlays | `docs` |

## Current State

The original 13/13 symbol inventories remain intact. A valid Augment finding showed that the
`LoggingPlugin` row overclaimed correlated logging: `LoggingPlugin.init()` stores request state in
a closure shared by both installed interceptors. The bounded repair removes that guarantee without
documenting the source defect as intended behavior.

## Completed

- Required skill/harness/doctrine reads and issue/umbrella reads.
- Missing-page and missing-symbol stop-condition audit.
- Source, `deno doc`, and generator-chain research.
- Plan/design checkpoint with justified `PLAN-EVAL: N/A`.
- Prose implementation.
- Exact-head IMPL-EVAL of the preceding product head, carried in `impl-eval.md` by the supervisor.
- Source verification for the bounded `LoggingPlugin` wording repair.

## In Progress

- S3 wording/run-artifact commit, S4 derived regeneration, and final-head validation.

## Next Steps

1. Commit the one-row wording repair plus run-ledger updates as S3.
2. Regenerate and verify exactly four assets, then commit S4.
3. Run every required gate at the new head and update PR evidence SHAs.
4. Push by explicit refspec for fresh supervisor-dispatched IMPL-EVAL.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| One existing page, two tables | #1784 / brief | Separate pages are forbidden. |
| Exact `deno doc` sets | source / doctrine A14 | 26 rows, 25 distinct names. |
| `Logger` is a re-export | both sub-path source files | No duplicate standalone description. |
| Describe installed interceptors without claiming correlation | `orpc-plugin.ts` read/write ordering | Shared closure state cannot support an unconditional guarantee. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `docs/site/reference/logger/index.md` | changed | One-row `LoggingPlugin` wording repair. |
| `.llm/runs/docs-logger-subpath-surface--1784/{context-pack,drift,worklog}.md` | changed | Repair evidence and deferred source-defect record. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | pending repair head | Previous head passed; full list must be rerun after S4. |
| Fitness | N/A | No package/plugin source change. |
| Runtime | N/A | Static-only; Aspire/Docker forbidden. |
| Consumer | pending repair head | Regenerate after S3, then rerun on S4. |

## Open Questions

- None.

## Drift and Debt

- Drift: the shared `origin/main` tracking ref advanced after the locked-baseline research; the
  branch remains based on the owner-specified `38439740f` and was not rebased. The oRPC plugin's
  shared request-correlation closure is an observed source defect deferred to its owning lane.
- Debt: none.

## Commits

- See the PR commit list and phase comments after push.
