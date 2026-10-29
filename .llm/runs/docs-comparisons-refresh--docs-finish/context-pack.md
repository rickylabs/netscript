# Context

Plan bootstrapped; waiting for ordered integration of content PR #2471. No comparison source rewritten yet. Native scenario picker already exists in baseline.

Ordered integration: content #2471 merged as 55a65e2b911414134817d405e0ffaf5133aaf180 after independent MERGE and all CI green. Merge takes main for every prior content/navigation/renderer page; preserves only the started scenario picker, its tests and styles. Why already has no comparison table in the merged content pass. No predecessor content is reintroduced.

Authored six scenarios in comparisons/_data.ts with seven exact TypeScript/TSX sources and a schema-checked MCP recipe. Added a reusable consumer check deriving local public export/dependency maps from repository config, preserving app type inference instead of imposing package isolated-declaration rules. Initial structured checks: seven API sources pass; data check/lint pass; picker fixture 2/2 pass. Site link check caught one nonexistent contracts guide URL, corrected to services guide before final verification.
