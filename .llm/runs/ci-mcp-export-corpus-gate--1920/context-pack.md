# Context Pack: #1920 MCP export-corpus CI gate

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `ci-mcp-export-corpus-gate--1920` |
| Branch | `ci/mcp-export-corpus-gate` |
| Current phase | `gate` |
| Archetype | `2 — Integration` (`packages/mcp`; generated internal asset only) |
| Scope overlays | `none` |

## Current State

All three implementation slices are complete. The branch merged exact current main
`37452f11f5045f0f5a98e07d802bcc2a2e94333b` without rebasing, regenerated the expected corpus
collision, and repeated determinism, trigger, teeth, YAML, tooling, and hygiene validation.

## Completed

- Loaded required harness/toolchain/PR/RTK skills plus doctrine required by the package artifact.
- Confirmed clean branch, exact base, existing gate catalog entry, absent CI invocation, sibling
  step shape, and classifier architecture.
- Recorded `PLAN-EVAL: N/A` for this mechanical slice.
- Captured the expected stale-base exit 1 and three successful, byte-identical generations.
- Added and parsed the exact CI step; proved all generator input classes select it.
- Proved stale exit 1 in a throwaway worktree and fresh/catalog-runner exit 0 in the live tree.
- Opened draft PR #1929 with the requested labels, `status:impl`, and milestone `0.0.7`.
- Merged current main in `92ae7df426f069be2700bbd6b093fb55d8a4d1b3` and resolved only the
  generated corpus by running its generator.
- Proved final warm/pristine equality at file SHA `21cfdee7…`, payload SHA `81d49c6c…`, 273
  subpaths, and 7,809 symbols.
- Repeated current-main RED, integrated GREEN/catalog-runner, parsed YAML, classifier, structured
  check, and lock/diff-scope assertions with the expected real exits.

## In Progress

- Commit and publish the final evidence-only slice; supervisor evaluation remains independent.

## Next Steps

1. Commit/push slice 3 and update the draft PR body/comment.
2. Hand off to the supervisor for Tier-A slice review and separate-session IMPL-EVAL.

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
| `.github/workflows/ci.yml` | changed | One additive existing-gate invocation |
| `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts` | changed | Deterministic generator output at exact integrated main surface |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS after current-main integration | Parsed YAML, classifier assertion, structured check in `evidence.md` |
| Fitness | PASS after current-main integration | Warm/pristine determinism and RED/GREEN teeth in `evidence.md` |
| Runtime | N/A | No runtime behavior change |
| Consumer | PASS after current-main integration | Current-main RED and integrated-tree GREEN freshness proof |

## Open Questions

- No design question. Implementation is ready for the supervisor's independent review/evaluation.

## Drift and Debt

- Drift: local `rtk` tool unavailable; environment GitHub token lacked workflow scope; the expected
  main collision materialized and was resolved by regeneration.
- Debt: none created or deepened.

## Commits

- See the draft PR's commit list + per-slice PR comments (V3 retired `commits.md`).
