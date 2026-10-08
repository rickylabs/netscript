# C3 acceptance evidence

| Issue box | Evidence | State |
| --- | --- | --- |
| Caller transaction type without erasure | TransactionClientPort, cast-free withTransaction, real generated Prisma model/root-negative fixtures; s7-evidence.json | Proven locally |
| Generated schema/bridge logical rows; no runtime DDL | Consumer-owned schema.prisma, reviewed unique/check/index migration and callback-derived bridge; s7/s8 content review | Proven locally |
| Concurrent commit/rollback/follower/timeout/connection hygiene | Seven native Prisma/PostgreSQL cases, observed follower locks, terminal busy clean follow-up, retryability/no retry, actual deferred commit failure, actual root-write negative; s8-provider-evidence.json + s9-commit-evidence.json | Proven locally |
| Real-provider and publish gates | Isolated native provider gate, native database publish/isolated declarations, full export docs, JSR audit, prod-install and Deno 2.9.5 freshness; s9-qualification.json | Proven locally; current-head CI pending |
| IMPL-EVAL | Independent separate-family exact-product-head evaluation | Pending |

No issue box or PR readiness is claimed without linked evidence. Final full-chain scaffold runtime remains owned by the last leaf per the approved chain plan; this leaf changes no scaffold output or release artifact.
