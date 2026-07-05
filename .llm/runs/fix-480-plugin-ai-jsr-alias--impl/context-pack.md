# Context Pack: fix plugin install ai JSR alias

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `fix-480-plugin-ai-jsr-alias--impl` |
| Branch | `fix/480-plugin-ai-jsr-alias` |
| Current phase | `implement` |
| Archetype | `6 - CLI / Tooling` |
| Scope overlays | `none` |

## Current State

The branch fixes #480 by adding the missing `ai` public bare alias for the JSR plugin installer path. Targeted unit/type-check gates and the scratch JSR-path AI/Auth installs pass.

## Completed

- Read requested skills and relevant harness/doctrine files.
- Verified root cause against current tree.
- Swept adjacent official-plugin lists and classified skipped sites.
- Added AI resolver alias and unit test.
- Ran prod-path scratch installs for AI and Auth without `--local-path`.

## In Progress

- Commit, push, PR, and PR comment.

## Next Steps

1. Inspect status/diff and lock hygiene.
2. Commit and push with explicit refspec.
3. Open PR with closing keyword, labels, milestone, and evidence.
4. Comment with slice scope, commit hash, and test evidence.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| Fix only the public alias map. | `plan.md` | The e2e lists already include AI. |
| Do not change `OFFICIAL_PLUGIN_DIRS`. | `research.md` | It gates local copied plugin path rewriting and excludes Auth too. |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| `packages/cli/src/public/features/plugins/install/plugin-package-resolver.ts` | changed | Added `ai` alias. |
| `packages/cli/src/public/features/plugins/install/plugin-package-resolver_test.ts` | changed | Added resolver test. |
| `.llm/runs/fix-480-plugin-ai-jsr-alias--impl/` | new | Harness evidence. |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | partial pass | Unit and check wrapper pass; lint/fmt wrappers hit root-config CLI exclude with zero findings. Direct lint on touched files passes. |
| Fitness | reviewed | No new command files, adapters, side-effect locations, or folders. |
| Runtime | pass | AI/Auth prod-path installs exit 0. |
| Consumer | pass | Scratch scaffold and generated config/appsettings entries verified. |

## Open Questions

- None.

## Drift and Debt

- Drift: implementation proceeded from owner-provided verified plan; separate IMPL-EVAL remains pending on PR.
- Debt: none created or deepened.

## Commits

- See the draft PR's commit list plus per-slice PR comments.
