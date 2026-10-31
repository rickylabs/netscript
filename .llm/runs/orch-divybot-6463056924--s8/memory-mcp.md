# NetScript MCP local research

Use the generated MCP configuration or local CLI `deno run --no-lock -A packages/cli/bin/netscript-dev.ts agent mcp --project-root . --docs-root docs/site` over stdio. Initialize JSON-RPC then send notifications/initialized. `find_guidance` accepts `{intent, limit?}` (not task); `search_docs` accepts `{query, limit?}`. Both succeeded for S8. Preserve the existing Markdown twins and llms.txt while changing chrome.
