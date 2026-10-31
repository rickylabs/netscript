# Drift

- RTK absent: focused raw commands replace the unavailable proxy.
- Owner-specific process overrides generic dispatch: no issue closing keyword, no taxonomy
  mutation, no local scaffold.runtime E2E, stop at READY. Canonical final uses file handoff.

Authorized second-cycle round 1 identified a real scaffold compatibility prerequisite.
Choose evaluator option (b): include Garnet launch flags in CLI generation rather than ship
consumers that fail against default scaffolds. Existing externally managed apps need migration.
No local scaffold E2E; coordinator-owned e2e-cli verdict required before readiness.

Implementation evidence: whole queue suite 131 pass, 2 CI-only sentinels ignored. Reverting
only redis.adapter.ts to main causes all 10 core acceptance tests to fail at runtime on
Redis and Garnet (6 redelivery timeouts, 2 absent heartbeat failures, 2 incorrect nack counts).
Implementation restored in finally. Full-export doc-lint has exactly one unchanged baseline
private-type-ref in packages/kv/types/watchable-kv.ts; new Redis diagnostics fixed.

JSR audit identifies pre-existing F-16 adapters cardinality worsening from 15 to 19. Record
the added navigation cost and closing gate in redis-lease-cardinality debt; do not hide it
behind the green quality/architecture exit status. No functional acceptance was weakened.

Ready-head CI quality failed on MCP export corpus freshness, after lint/fmt/docs checks passed.
Refresh through deno task gen:mcp-export-corpus and verify dependent generated carriers.
This necessary generated-data delta was omitted from the initial public-surface gate list;
record it explicitly and re-evaluate the new exact head. No runtime source change is needed.
