# Task memory

- 2026-10-31: #2517 current-main baseline includes versioned JSON projection mapper; missing scalar SagaInstance.status/filter is the remaining #2382 seam.
- 2026-10-31: plugin database/*.migration.sql assets are auto-discovered by packages/database/scripts/plugin-migrations.ts and appended AFTER Prisma creates schema migration. Immutable content hashes forbid editing an already shipped sidecar; add a new name.
- 2026-10-31: rtk is absent here; Deno 2.9.7 and gh/claude are installed. Use structured .llm/tools/run-deno-* wrappers; no local scaffold.runtime for this leaf.
