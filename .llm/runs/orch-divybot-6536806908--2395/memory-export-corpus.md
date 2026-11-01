# Public API additions require the generated MCP corpus refresh

CI quality runs check:mcp-export-corpus even when scoped source gates pass. After changing
public queue/context/adapter types, commit source first, then run deno task gen:mcp-export-corpus.
The generator's package/plugin dirty guard is intentional; do not hand-edit compressed rows.
This slice updates only queue root/Redis rows and the plugin-workers worker row that exposes
queue types. Native freshness check and embedded-export-surface-corpus/export-surface-flows
tests pass. check:assets-barrel and check:publish-assets also pass without further output churn.
