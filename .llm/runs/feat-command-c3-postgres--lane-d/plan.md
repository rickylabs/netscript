# C3 locked leaf plan

Implements S7–S9 of the approved whole-chain plan in ../feat-command-c1-contracts--lane-d/plan.md.
Its independent PLAN-EVAL PASS controls this leaf; do not repeat it. Archetype 2 database
integration, with service consumer conformance. No new debt. S7: true transaction-client callback
port, consumer schema/migration/generated Prisma bridge and negative type fixtures. S8: PostgreSQL
store with parameterized claim, completion, audit and outbox on one callback-derived client. ON
CONFLICT DO NOTHING RETURNING; indexed follower select; restore local lock_timeout only on
successful claims; terminal busy rollback; retryable serialization/deadlock without callback
retries. S9: real-provider concurrency/fault/clean-connection conformance and split-commit negative
control, docs, consumer and publish gates. Every new named test receives a semantic mutation check
with restored pass. RED precedes product implementation. Required gates: structured
check/test/lint/fmt, quality:scan, arch:check, full export docs, JSR audit, isolated
publish/declaration, real PostgreSQL provider, generated consumers refreshed with Deno 2.9.5,
independent exact-head IMPL-EVAL, full CLI runtime E2E, current-head green CI and acceptance
evidence. CLI generation remains deferred to RFC stage 8. Consumer owns generated
client/models/migrations; no runtime DDL, queue dependency, fake certification, transaction retries
or root side writes.
