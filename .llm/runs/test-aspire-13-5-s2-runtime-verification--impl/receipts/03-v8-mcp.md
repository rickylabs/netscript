# V8 Aspire MCP verification

At `2026-08-29T22:47:46.164Z`, a throwaway stdio JSON-RPC client spawned exactly `aspire agent mcp`
from the generated project root. With a 30 s bound per response it sent `initialize`, `tools/list`,
`list_apphosts`, `doctor`, and `list_resources`. All five responses completed without JSON-RPC
errors by `2026-08-29T22:47:59.284Z`; stdin was closed and the server exited naturally with code 0,
so no signal was required.

The 13.5.3 server exposes 14 tools, identical to the captured 13.4.6 baseline. `refresh_tools` is
present. Contrary to the 13.5 documentation expectation, `get_integration_docs` is absent. The
`list_resources` response continues to omit environment values and explicitly explains the
redaction.

Evidence: `00-aspire-13.4.6-mcp-baseline.json`, `03-v8-mcp-transcript.json`,
`03-v8-mcp-summary.json`, and `03-v8-mcp-tool-diff.json`.
