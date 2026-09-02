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

Slices 1 and 2 are complete locally: deterministic generation, CI wiring, YAML/classifier proof,
RED/GREEN teeth, and the requested structured check are green. `origin/main` advanced to
`37452f11f` with classifier and published-surface changes, so slice 3 must integrate it and
regenerate before final handoff.

## Completed

- Loaded required harness/toolchain/PR/RTK skills plus doctrine required by the package artifact.
- Confirmed clean branch, exact base, existing gate catalog entry, absent CI invocation, sibling
  step shape, and classifier architecture.
- Recorded `PLAN-EVAL: N/A` for this mechanical slice.
- Captured the expected stale-base exit 1 and three successful, byte-identical generations.
- Added and parsed the exact CI step; proved all generator input classes select it.
- Proved stale exit 1 in a throwaway worktree and fresh/catalog-runner exit 0 in the live tree.
- Opened draft PR #1929 with the requested labels, `status:impl`, and milestone `0.0.7`.

## In Progress

- Final-main integration and post-integration regeneration/validation.

## Next Steps

1. Commit/push slice 2 and post its draft-PR evidence comment.
2. Integrate `origin/main` at `37452f11f`, regenerate, and repeat load-bearing validations.
3. Commit/push slice 3, update PR body/comment, and hand off to the supervisor for independent
   review and IMPL-EVAL.

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
| `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts` | changed | Deterministic generator output at pinned base; must be regenerated after main integration |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS at dispatched base | Parsed YAML, classifier assertion, structured check in `evidence.md` |
| Fitness | PASS at dispatched base | Determinism and RED/GREEN teeth in `evidence.md` |
| Runtime | N/A | No runtime behavior change |
| Consumer | PASS at dispatched base | RED/GREEN corpus freshness proof |

## Open Questions

- No design question. The detected main collision is handled by planned slice 3.

## Drift and Debt

- Drift: local `rtk` tool unavailable; `origin/main` moved and changed the corpus/classifier.
- Debt: none created or deepened.

## Commits

- See the draft PR's commit list + per-slice PR comments (V3 retired `commits.md`).
