# Corpus laziness and search admission

Do not import/decode the full corpus from MCP's version metadata module: unrelated root imports
would inherit 209 decompressions. Keep fixed provenance in small publish-assets.generated.ts;
loadReleaseDocsSource dynamically imports @netscript/mcp/docs internals on first request and caches
verified immutable data. The fresh-child decompression regression guards this boundary.

Literal search must admit identifier fragments (ReadinessHandler in createReadinessHandler).
Whole-word preference, bounded term frequency and exact phrase preference affect ranking only;
a zero-match no-seam answer must never be caused by silently narrowing literal matching.
