# Worklog

## Design

1. Public surface: @netscript/mcp/docs exposes the one full compressed documentation corpus and
   its verified decoder/composition functions. Existing MCP tools gain deterministic slug aliases
   and a release citation; CLI offline docs preserve decoded content.
2. Vocabulary: AgentDocsPage (path, gzip, SHA-256, size); corpus citation (framework version,
   content hash); canonical page slug (pages/...); confidence (high/medium/low).
3. Ports: existing DocsCorpusPort, no new IO port. Web CompressionStream/crypto only for transport.
4. Constants: canonical carrier path; generated framework version; existing confidence policy gains
   named coverage thresholds if required. No second document selection list.
5. Commit slices: ordered in plan.md, each updates this file and context-pack.md. Bootstrap first.
6. Deferred: runtime/scaffold changes, remote loading, undocumented APIs, release cuts.
7. Contributor path: .llm/tools/docs/generated-carriers.md explains adding a page and refreshing
   consumers. Guidance ranking policy and issue fixture identify intent extension points.

## Bootstrap

Matrix resolved; owner evaluator override recorded in supervisor.md. Working tree was clean.
RTK absent. Issue acceptance and comments read; no duplicate PR. Local MCP research completed.
