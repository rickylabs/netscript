# Research

Issue #2039 inspected live. Current main baseline `2f82548cf95a5841557b789d0713e04225e1c9da`. MCP `find_guidance` consulted before design; use existing package boundaries and native Deno/Web Platform APIs.

Scope: Align the supported Collection runtime across SDK query collections, Fresh live queries and durable stream producers.

Design evidence: Pin qualified DB 0.6.17/react-db 0.1.95/query-db-collection 1.2.1/durable-state 0.3.1 in owning manifests/catalog, guard isolated consumer graphs, prove real worker stream Collection through actual adapter with production SSR, client hydration and teardown; preserve public builder contracts
