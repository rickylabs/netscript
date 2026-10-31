# MCP without a connector

No NetScript connector appears in the tool catalog, but the local server works over stdio: send newline-delimited initialize and tools/call JSON-RPC messages to `deno run --no-lock -A packages/mcp/cli.ts` with stdin closed after the messages. `find_guidance` takes intent/limit; `search_docs` takes query/limit. The review repair queried both before implementation; results are in review-mcp-guidance.jsonl. Avoid storing environment stderr or local paths in public run evidence.
