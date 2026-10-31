# Research

- Consulted repository memories from #2149 before source inspection; no memory connector exposed. RTK unavailable; focused raw reads and structured wrappers apply.
- NetScript MCP find_guidance(intent) then search_docs consulted. Reuse plugin-owned manifests, generated registries, core saga selectors and existing CLI commands.
- Baseline is current remote main. #2300 and #2343 are merged and partially satisfy #2108, which explicitly remains open for consumer proof. No duplicate full proof PR found. No orchid-triage comment present.
- DB-free init spells `--db none`; plugin install spells `--no-db`.
- Existing saga canonical-backend and KV-only runner tests already prove selector parity, no incidental Prisma access and duplicate replay. Retain and rerun; add negative control evidence.
- Existing docs describe `Sagas.Projection.Backend`, `NETSCRIPT_SAGA_PROJECTION`, fallback to store selection/KV, and reinstall migration.
- Runtime suites currently support PostgreSQL and SQLite; `DatabaseEngine` has no none value. Do not silently add a CI tier.
- #2149 adds auth KV-only install/generate/doctor coverage; extend consumer proof to all three background plugins with kv-oauth.
