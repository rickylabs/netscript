# Research — fix-1531-corpus--leaf

## Re-baseline

- Carried-in source: issue #1531 dispatch measurements.
- Re-derived against `main` @ `0551ff59283adccf75e251cd5e8c78d45bb35643` on 2026-08-12.
- The dispatch measurements reproduce: 60 `api-clients` occurrences in the compressed corpus, zero
  under `docs/site`, 74 changed site files since `eda49bb2e`, 174 corpus files, and no workflow
  reference to the corpus generator/check.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | The checked-in corpus is version `0.0.5`, source commit `eda49bb2e`, extracted `2026-08-09T10:03:43Z`, with 174 files. | `.llm/assets/agent-docs/provenance.json` |
| 2 | The stale corpus contains 60 `api-clients` and eight `@contracts` occurrences; the MCP generated asset contains 13 `api-clients` occurrences. | `gzip -dc ... | grep -o ... | wc -l`; direct generated-file grep |
| 3 | `docs/site` contains zero `api-clients` occurrences and 74 files changed between the snapshot and the branch base. | `rg -o`; `git diff --name-only eda49bb2e..0551ff592 -- docs/site` |
| 4 | `gen:agent-docs-prose` rebuilds from an external bundle but has no checked-in site-build orchestration or workflow caller. | `deno.json`; `.llm/tools/docs/build-agent-docs-bundle.ts`; `.github/workflows/ci.yml` |
| 5 | `check:publish-assets` rewrites the committed blob and cannot prove source freshness. | `.llm/tools/generate-publish-assets.ts`; issue negative-control evidence |
| 6 | The existing docs accuracy assertion rejects `lib/api-clients.ts`, `@contracts`, and `@/lib/` only while walking `docs/site`. | `.llm/tools/docs/check-accuracy-and-discoverability.ts` |

## jsr-audit surface scan (package/plugin waves)

- N/A: this is a docs/tooling generated-asset correction with no public package API or export-map
  change. Only checked-in generated package content is rebuilt.

## Open questions

- Closed in design: preserve the two externally sourced `context/*` entries from the committed
  corpus while deterministically replacing the site-derived `llms*` and `pages/*` entries. Content
  selection remains owned by #1260.
