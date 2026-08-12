# Research — fix-cut-regenerates-agent-docs-prose--w6

## Re-baseline

- Carried-in source: owner defect report for release PR #1627 at `9400e613e`.
- Re-derived against `origin/main` at `bf4b877f17b5cf34a96b6b40a424f19ca5073ddf` on 2026-08-13.
- The branch starts clean at that exact baseline.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | `prepareRelease` runs three post-bump generators and omits `gen:agent-docs-prose`. | `.llm/tools/release/prepare-release.ts` |
| 2 | `PREPARED_RELEASE_GENERATED_OUTPUTS` omits both committed agent-docs corpus outputs. | `.llm/tools/release/prepare-release.ts` |
| 3 | `gen:agent-docs-prose` builds `docs/site` before generating/checking the corpus. | root `deno.json` task definition |
| 4 | The existing test already contains one failing expectation for the prose output, but does not independently discriminate both outputs and gate order. | `.llm/tools/release/prepare-release_test.ts` |

## jsr-audit surface scan

N/A: this is release automation and its committed generated assets; no package/plugin public API or
publish surface is changed.

## Open questions

None. The owner locked the generator, staged outputs, ordering constraint, and decisive rehearsal.
