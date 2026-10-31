# Reconciliation plan — mc009d-r2-2396

Plan & Design — READY FOR REVIEW.

Scope: resolve existing PR2421 against main7ee9c3ed04607eb0967f9ef0ef4cd874652817aa.
The feature and public contracts were already accepted. Archetypes remain5 (plugins),
3/4 (native runtime/builder),6 (generated CLI/MCP carriers). No new public API or dependency.
JSR surface risk is canonical carrier completeness; previous source publish evidence retained.

Locked decisions: merge main normally; retain both sides of the debt registry without changing
bounds; regenerate conflicted carriers through checked-in generators; preserve all feature
source/tests. Explicit corpus --allow-dirty is permitted while merging the full source union
(the canonical generator supports it); final freshness validates the committed union.

One logical implementation slice: normal merge plus regenerated carriers, run worklog/context
and reconciliation memory. Run generators gen:agent-docs-prose, gen:mcp-export-corpus,
gen:publish-assets, gen:assets-barrel in dependency order. Stage regenerated output as conflict
resolution. Proving gates: check:agent-docs-prose, check:mcp-export-corpus,
check:publish-assets, check:assets-barrel, quality:gate, structured root check and structured
factory/native service tests recorded by the original run. Run CI quality prerequisites where
applicable, including Aspire inventory freshness. Commit and push coherent result to original
PR; then perform the owner-authorized independent exact-head merge-delta IMPL-EVAL and publish
its verdict on PR. No later commit may invalidate that verdict.

Risks: main drift (fetch/recheck before final head), lost debt (verify both parent IDs), stale
carriers (four checks), authored-source merge conflicts (inspect and record before resolving),
private data in raw logs (keep raw logs outside Git, publish only relative-path summaries).
Required hosted runtime proof remains coordinator-owned and unproven until actually run.
Published graph remains release-owned accepted debt, unchanged. Existing doc findings remain
reported honestly; no acceptance or gate relaxation.

Open decisions: none that affect implementation. Pending hosted runtime and published graph
proof are safe to defer to their explicitly assigned coordinator/release gates.

Deferred: feature redesign, upstream router defects, new tests for unchanged source, releases.
Contributor path: .llm/runs/fix-native-host-policy--2396/context-pack.md.
