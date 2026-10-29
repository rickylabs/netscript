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

Browser implementation gate: 140/140 passed in light/dark at 390/1280, including native picker selection, keyboard Home/Enter, panel and descendant fragments, no page errors, no horizontal overflow, axe serious/critical checks, and complete HTML/Markdown without JS. Screenshots inspected on mobile. Initial failures exposed missing raw-HTML heading ids; added explicit ids, then reran the full suite. Improved literal source-link spacing after visual inspection; focused browser rerun follows generation. Structured API/MCP tests 2/2 and picker fixtures 2/2 pass; source/data checks, lint and source-only format pass. Root tool lint initially refused excluded tooling; explicit docs config covers both helper files successfully.

Final gate reconciliation: all 13 root check tasks pass after the generated one-row Aspire inventory refresh; five docs gates and final site verify pass. Additional 36 API/corpus/auth/worker regressions pass. Both non-site prose entries retained byte-identically. Root/docs locks unchanged. Browser full 140 pass plus final focused 16 pass. Ready for independent comparison evaluation; runtime acceptance remains unproven locally because Docker is unavailable.

CI reconciliation: docs browser preparation checks browser test files with the docs formatter config, while the original local format invocation inherited the tools/root config. Reformatted only the new comparisons.spec.ts using the exact CI config; structured CI formatter selection passes all three files. This is whitespace/quote style only; browser behavior is unchanged.

CI test-shard reconciliation: root discovery compiled the carried picker fixture without the standalone Lume import map. Follow the existing markdown-render bridge: keep root-discovered scenario-picker_test.ts as a subprocess bridge, move both full rendering assertions to scenario-picker-fixture.ts, and include that fixture in the site test task. No tests deleted, skipped or weakened; both assertions run with the site’s authoritative import map.

Source audit correction before final sign-off: separate the shared stream schema from the service producer so the Fresh island never constructs server transport code. Separate pricing contract, server router and client modules so the consumer imports no service implementation. These remain six scenarios; ten TS/TSX modules now implement their boundaries honestly. Regenerate and recheck affected carriers/source/browser evidence before final review.
