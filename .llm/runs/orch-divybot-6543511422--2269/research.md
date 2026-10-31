# Research

Baseline 46b22e63608eb4ba067145445b523536d6e48aa9. Live issue 2269 and comments read;
no orchid-triage comment or existing PR covers this change. Consulted prior run memory
for generated corpus, MCP stdio, evaluator launch, and environment recipes.

Asked local MCP find_guidance about shared corpus and deterministic lookup, then search_docs.
It returned MCP README's faithful retrieval section and docs corpus architecture, confirming
DocsCorpusPort and createDocsFlows are the extension seam. Connected tools are unavailable.

Measured current carrier: 209 rows, 206 pages, 1,394,182 stored bytes, 2,965,177 decoded bytes.
MCP's curated publish asset: 271,009 bytes; independent selection excludes reported pages.
Full compressed embed is practical (well below JSR package budget); no lazy network fetch needed.
Existing page transport verifies each row hash and size and retains unchanged gzip bytes.
CLI already depends on MCP. MCP cannot depend on CLI internals. Therefore move the existing
carrier/transport/composition copy to MCP and expose a documented docs subpath; no new package.
Keep compatibility re-exports at CLI transport paths where useful, but exactly one stored corpus.

Canonical slug normalization removes /index but currently retains pages/. Guidance uses BM25
scores and curated concepts; absolute score confidence can misrepresent partial intent coverage.
Docs retrieval responses currently omit release version citations.

Read doctrine axioms/public surface/folder/archetypes, relevant rules, harness run-loop,
plan gate and archetype gate matrix. MCP remains integration/tooling; CLI remains archetype 6.
Planned public subpath is pure typed data/decoding, explicit annotations, ESM-only, registry-safe
TypeScript carrier (no JSON/text imports, package filesystem reads, or new dependencies).
