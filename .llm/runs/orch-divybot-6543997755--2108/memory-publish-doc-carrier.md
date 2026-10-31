# 2026-10-31 — Docs corpus has a publish wrapper

After gen:agent-docs-prose updates packages/mcp/src/infrastructure/docs/agent-docs-prose.generated.ts, run gen:publish-assets and check:publish-assets. check:assets-barrel alone does not refresh the MCP publish wrapper. CI quality stops at Publish asset freshness before its later Aspire parity step. Refreshing the wrapper changes only generated compressed data/digests, not executable logic.

On a main merge, the compressed per-page corpus can auto-merge cleanly while its provenance wrapper conflicts. Preserve both source pages/carrier changes and use canonical gen:publish-assets, then semantic docs freshness plus wrapper check. Never select one parent's provenance by hand.
