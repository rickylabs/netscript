# Shared docs generation

Canonical prose carrier now lives under packages/mcp/src/infrastructure/docs/ and is exposed
by @netscript/mcp/docs. CLI consumes that public subpath. Generator path authority is
.llm/tools/docs/agent-docs-page-carrier.ts (AGENT_DOCS_PAGE_CARRIER).
Keep site composition policy copied beside transport; no MCP imports of CLI internals.
A move into MCP enables noUncheckedIndexedAccess: use Object.entries when reading file maps.

withReadinessCheck and getMany are absent in the rendered prose at baseline; do not claim a
matching page from literal search. Empty queries return explicit low-confidence no-seam text
and the release corpus citation. API details remain discoverable via export tools.
