# Research — #1253 MCP export corpus

## Issue-first findings

- Published `@netscript/mcp@0.0.5-canary.7` reproduces the report over newline-delimited stdio:
  `initialize` identifies canary.7, then `search_exports { query: "definePage" }` returns
  `export_corpus_error`.
- The canary package embeds `MCP_PACKAGE_VERSION = 0.0.5-canary.7`, while its generated corpus
  provenance and payload remain `0.0.4`.
- `EmbeddedExportSurfaceCorpus` deliberately rejects that mismatch. `withCorpus` then discards the
  exception and returns a generic message, so the version mismatch is not diagnosable.
- Release preparation regenerates/stages publish assets and the assets barrel after a bump, but not
  the export corpus. This makes every version bump capable of shipping a stale corpus.
- The default CLI composition embeds only the MCP README and `help.md`. SDK cache, hydration, and
  optimistic-mutation docs are absent, so the issue's `search_docs` observation is a corpus-coverage
  gap rather than a ranking defect.

## Authority and shape

- Issue #1253 is the specification.
- Archetype: package integration/adaptor (`packages/mcp`) with supporting release tooling.
- Public tool names/contracts remain stable; only failure detail and generated-asset lifecycle
  change.
- Milestone ruling D6 composes evaluation; no local PLAN-EVAL session is spawned.
