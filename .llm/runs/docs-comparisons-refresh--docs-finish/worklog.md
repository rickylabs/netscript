# Worklog

## Design

1. Public surface: six scenario comparisons, native accessible picker, complete no-JS reading, capability table and honest alternative choices. Why links to comparisons.
2. Domain vocabulary: order lifecycle, scheduled sync, operational discovery, live projection, contract version, server-validated form; no new runtime terms.
3. Ports: existing contracts/SDK, workers/sagas/triggers/streams, Fresh builders; examples label application-owned implementation seams explicitly. MCP guidance precedes authoring.
4. Constants: stable scenario keys and component data attributes; existing code language registry and style tokens. No fixed ports.
5. Commit slices: merge main after content; scenario data/pages/picker/tests; prose carrier checkpoint; other generated carriers and gate evidence; evaluation repair only when needed. Each slice updates this record and context pack.
6. Deferred scope: runtime features, competitor implementations, performance benchmarks, and unrelated site content. CLI runtime remains unproven while Docker is unavailable.
7. Contributor path: docs/site/comparisons/_data.ts defines scenario contract, source code and links; verification imports that source rather than duplicating examples.

PLAN-EVAL: N/A. Owner fixes the six-case scope and native picker; public API correctness and no-JS rendering are verified directly and by independent implementation review.

Ordered integration: content #2471 merged as 55a65e2b911414134817d405e0ffaf5133aaf180 after independent MERGE and all CI green. Merge takes main for every prior content/navigation/renderer page; preserves only the started scenario picker, its tests and styles. Why already has no comparison table in the merged content pass. No predecessor content is reintroduced.

Authored six scenarios in comparisons/_data.ts with seven exact TypeScript/TSX sources and a schema-checked MCP recipe. Added a reusable consumer check deriving local public export/dependency maps from repository config, preserving app type inference instead of imposing package isolated-declaration rules. Initial structured checks: seven API sources pass; data check/lint pass; picker fixture 2/2 pass. Site link check caught one nonexistent contracts guide URL, corrected to services guide before final verification.
