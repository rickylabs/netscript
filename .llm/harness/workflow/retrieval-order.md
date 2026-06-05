# Retrieval Order

Use the narrowest source that can answer the question. Prefer existing run artifacts and repo-native
sources before broad scans or web searches.

## Existing Run

1. `.llm/tmp/run/<run-id>/context-pack.md`
2. `.llm/tmp/run/<run-id>/plan.md`
3. `.llm/tmp/run/<run-id>/worklog.md`
4. `.llm/tmp/run/<run-id>/drift.md`
5. `.llm/tmp/run/<run-id>/commits.md`

For `.llm/tmp/` paths, verify with direct filesystem listing if an index/search tool misses the
directory.

## Doctrine and Harness

1. `.llm/harness/DOCTRINE-REF.md`
2. selected `archetypes/ARCHETYPE-*.md`
3. selected `archetypes/SCOPE-*.md`
4. relevant doctrine file and section
5. `gates/archetype-gate-matrix.md`

## Code

1. Relevant MCP local search when available.
2. Repo-native tools under `.llm/tools/`.
3. Focused shell search.
4. Surgical file reads.

Prefer `deno doc` for public `@netscript/*` package surfaces before reading source implementation.

## Dependency Docs

1. `.resources/deps-docs/`
2. run-local extracts in `.llm/tmp/docs/`
3. official upstream docs via docs/browser tooling
4. web search only when repo and curated docs are insufficient or freshness is required

## Knowledge Base

Use `.claude/` for descriptive current-state context. Use the doctrine for prescriptive
package/plugin rules.
