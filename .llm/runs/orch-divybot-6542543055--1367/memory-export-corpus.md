# Public type changes require MCP export corpus regeneration

Adding optional fields to Aspire PluginEntry/DenoServiceSpec and a streams contribution constructor
changes the generated MCP API signature corpus, even without adding export names. Run
`deno task gen:mcp-export-corpus` then gen:agent-docs-prose and gen:publish-assets. Require
check:mcp-export-corpus, check:agent-docs-prose, check:publish-assets, and staged/committed
check:assets-barrel; fixing only the first CI freshness gate leaves the next one red.

During a normal --no-commit main merge, the API read set is staged/dirty. Native generation accepts
--allow-dirty for that coherent union; checks intentionally reject that flag. Imported main changes
are not newly authored leaf scope. Never strip upstream run evidence when merging main.

Aspire-related new files also require regenerating the tracked Aspire surface manifest through
aspire-surface-manifest.ts, then check:aspire-version-parity. New storage fixture/probe/tests add
four rows under existing ownership rules. Do not change pins, scanner scope or enforcement to
repair inventory freshness. Full CI quality continues beyond the docs/API freshness gates.
