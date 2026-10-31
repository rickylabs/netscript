# Task memory

- 2026-10-31: #2517 current-main baseline includes versioned JSON projection mapper; missing scalar SagaInstance.status/filter is the remaining #2382 seam.
- 2026-10-31: plugin database/*.migration.sql assets are auto-discovered by packages/database/scripts/plugin-migrations.ts and appended AFTER Prisma creates schema migration. Immutable content hashes forbid editing an already shipped sidecar; add a new name.
- 2026-10-31: rtk is absent here; Deno 2.9.7 and gh/claude are installed. Use structured .llm/tools/run-deno-* wrappers; no local scaffold.runtime for this leaf.

- Migration delivery has two seams: declare SQL in sagasPlugin.withMigrations (src/public/mod.ts) AND publish database/**/*.migration.sql. The installer copies only manifest-declared assets; a file alone is insufficient.
- Installed-schema PostgreSQL coverage is packages/database/tests/saga-command-postgres_test.ts, run by .llm/tools/command-postgres-conformance.sh. It initially expects one pending outbox sidecar; upgrade fixture must withhold the new status sidecar during old-schema deploy.
- run-deno-check.ts already passes --unstable-kv by default; use --deno-arg --frozen (separate arguments), not a top-level --unstable-kv flag.
- Deno 2.9.7 supports node:sqlite DatabaseSync with JSON ->> expressions; CAST(... AS TEXT) matches PostgreSQL projectionVersion comparison for the exact portable UPDATE. This supplements, never proves PostgreSQL DO/CHECK behavior.

- A sagas Prisma schema column addition must also update the hand-written saga_instances CREATE TABLE in packages/plugin-sagas-core/tests/fixtures/transition-store/postgres-conformance.ts.template. That client is generated from the plugin schema even though the table is created manually.
- For an upgrade fixture derived by removing a new field from current schema, assert information_schema lacks the field before migration and contains it afterward; otherwise a regex mismatch can silently turn upgrade coverage into a fresh/SQL-only migration.
- Scoped saga doc-lint baseline has 30 private-type-ref findings; restoring all changed production modules reproduces identical package/entrypoint findings. Do not call this gate green or add unrelated suppressions.
