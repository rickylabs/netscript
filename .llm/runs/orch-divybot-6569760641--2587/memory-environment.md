# Environment and prior evidence — 2026-11-02

Deno on PATH is CI's 2.9.7. RTK is absent; use direct commands and structured
repository wrappers. No global memory service or memory directory is available.
Prior lessons were read from `.llm/runs/orch-divybot-6562102567--2570-phase2/memory-*.md`.
The fresh branch baseline is merged #2586. Its remaining #2587 scope is real
record events and automatic post-seed job execution, not the chart/health polish.
Database CLI lifecycle finishes before plugin registration. Use a durable handoff,
not a trigger from the seed process. Preserve seed idempotency and genuine runtime evidence.
