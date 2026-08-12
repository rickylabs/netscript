# Research — fix-cut-regenerates-agent-docs-prose--w6

## Re-baseline

- Carried-in source: owner defect report for release PR #1627 at `9400e613e`.
- Re-derived against `origin/main` at `bf4b877f17b5cf34a96b6b40a424f19ca5073ddf` on 2026-08-13.
- The branch starts clean at that exact baseline.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | `prepareRelease` runs three post-bump generators and omits `gen:agent-docs-prose`. | `.llm/tools/release/prepare-release.ts` |
| 2 | Both corpus outputs are already staged transitively because `PREPARED_RELEASE_GENERATED_OUTPUTS` spreads `PUBLISH_ASSET_OUTPUTS`; no new output declaration is needed. | `.llm/tools/generate-publish-assets.ts`, `.llm/tools/release/prepare-release.ts` |
| 3 | `gen:agent-docs-prose` builds `docs/site` before generating/checking the corpus. | root `deno.json` task definition |
| 4 | The existing test already contains one failing expectation for the prose output, but does not independently discriminate both outputs and gate order. | `.llm/tools/release/prepare-release_test.ts` |
| 5 | A real 0.0.7 render differs from `rebaseAgentDocsProse` on 20 files and canonical SHA-256 (`c9268f…` vs `18138d…`); literal rewriting misses rendered bare-version prose such as `@0.0.7`. | disposable cut `/tmp/netscript-w6-postfix.9vF9Mh/repo` |
| 6 | `verifyGreenCanaryPair` currently requires parent metadata to survive unchanged through `isExactAgentDocsProvenanceReplacement`, so a genuine render's new `sourceCommit` / timestamp cannot inherit parent canary evidence. | `.llm/tools/release/github-release.ts` |
| 7 | Writer reproduction currently checks publish assets, MCP corpus, and the CLI barrel, but not semantic agent-docs freshness against the rendered site. | `assertPreparedReleaseGeneratedOutputsFresh` |

## jsr-audit surface scan

N/A: this is release automation and its committed generated assets; no package/plugin public API or
publish surface is changed.

## Open questions

None after the owner-directed RCA correction. The locked contract now includes semantic freshness
and strict canary-parent acceptance/rejection in the same PR.
