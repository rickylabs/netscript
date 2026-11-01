# Research

Current main baseline is 462f15c099c3d2d4600c4442111dce51edf0d4b2 (#2517). Issue #2382 has two acceptance boxes: canonical persisted/returned status with legacy compatibility, and KV/Prisma list parity for all states. No orchid-triage comment or competing PR was found. #2517 is merged and partially addresses this: versioned JSON already carries canonical status and read mapping preserves it; relational filters still use JSON/isCompleted, no scalar canonical column exists.

Consulted existing repository memory first (validation recipes, RTK absence, close-gate, migration tooling). In-repo MCP find_guidance(intent) then search_docs(query) consulted; existing sidecar tooling is the applicable seam.

- Canonical vocabulary: SAGA_INSTANCE_STATUSES/SagaInstanceStatus from plugin-sagas-core/domain.
- Projection writer: plugins/sagas/src/runtime/saga-instance-projection.ts. Prisma writes isCompleted plus v2 nested JSON; KV writes canonical document.
- Shared mapper/filter: services/src/routers/v1-helpers.ts; list/get in v1-handlers.ts. instance-query.ts already composes existing backends; no new query path needed.
- Schema: plugins/sagas/database/sagas.prisma. Plugin publish includes database/**/*.migration.sql.
- Migration delivery: packages/database/scripts/plugin-migrations.ts discovers immutable sidecars, appends to Prisma-created migration before deployment, records hashed markers. Existing command-outbox sidecar is immutable.
- Before #2517 flat rows contained runtime status in state.status, with isCompleted for completed rows. Versioned JSON uses projectionVersion=2 and state.status for runtime; nested state is business data. Legacy overwritten business data cannot be recovered.

## Architecture and publish surface

Archetype 5, runtime subtype (folds Arch 3). Core owns lifecycle vocabulary; plugin only persists/projects it. No new public exports, dependencies, permissions, or core conventions. Existing explicit return types retained; SQL and schema already included in publish map; README explains upgrade. Planned JSR surface audit: metadata/exports valid, no new slow types, no extra runtime imports. Full plugin check/doc-lint and audit tool selected below. No new architecture debt planned.
