# Research

Rebased knowledge against fetched main `204a71b1ef0133faa07ce5c191e4170b5cb76171` (same as assigned baseline). No prior covering PR found. NetScript MCP find_guidance and search_docs consulted first.

The saga manifest declares `database/sagas.prisma` through withDbSchemas. CLI copyPluginSchemasToRootDb already installs/collision-checks it. Add the exact outbox model from the command-store schema there. Prisma schema cannot encode the fixture CHECK constraints: publish a companion SQL migration asset via existing withMigrations manifest axis, preserving the application-owned migration workflow. The fixture requires nonnegative attempt_count, paired claim token/until and paired acceptance identity/time; due index is command_outbox_due. Generated migration plus the declared companion SQL must be applied/tested together. No runtime DDL.

Database relay factory uses a true callback transaction, finite deadline and ReadCommitted. Raw SQL has fixed identifiers and bound data. Existing relay interface has host fakes, so return an intersection with a separate retention contract instead of making every fake implement new methods.

Atomic Prisma replay markers are keyed by instance/key hash and have creation time only. Canonical SagaRuntimeState envelope metadata has terminal statuses completed/failed/cancelled/compensated, completedAt with terminal updatedAt fallback (existing sagaRetentionRemaining policy). Pending/running/compensating must always survive. Unknown/missing parents fail closed. Retention must run before deleting canonical terminal state; this change does not delete canonical state/history.

No B1 engine transitions are edited. PostgreSQL test recipes generate a real Prisma client with locked standalone fixture imports; native isolated Unix-socket PostgreSQL is available through the previously extracted tools. CI command-postgres has an existing unrelated saga-provider failure to compare before attribution.
