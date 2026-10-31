# Service consumers and JSDoc policy

Root CI shards include service tests outside plugins/sagas/tests/runtime. When stored-engine
registration requires atomic capability, migrate service fixtures to createProjectingSagaStore;
the legacy ProjectingSagaStore constructor intentionally advertises only granular persistence.
Regression command: structured test wrapper over .llm/tools/fitness/check-public-jsdoc-codenames_test.ts,
plugins/sagas/services/src/prisma-retention_test.ts and
plugins/sagas/tests/services/publish-http-boundary_test.ts (7 passed, zero failures).
Public JSDoc must not name internal issue ids, even for protocol provenance; use domain language.
CI failure details are in test.report.json within per-shard gate-receipt artifacts. Receipt stdout
is bounded and may omit diagnostics. Download exact artifacts instead of relying on log tails.
