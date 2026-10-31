# Plan & Design — READY FOR REVIEW

## Locked design

1. Add SagaInstance.status as required String @default("running") plus [sagaName,status] index. Keep isCompleted for existing cleanup compatibility. Reuse canonical TS union; avoid a provider-specific Prisma enum. Persist metadata.status on both create and update.
2. Replace JSON/boolean list filtering with scalar status equality through buildSagaInstanceWhere and existing findMany/count. Extend existing v1-types only; preserve instance-query/direct-GET seams.
3. Prefer validated scalar row.status in shared mapping; absent legacy columns still use existing v2/flat mapping. Never interpret business fields as runtime state in v2.
4. Add immutable status.migration.sql sidecar, appended after Prisma column/index creation by existing database tooling. Backfill all pre-fix rows: v2 validated state.status first; otherwise is_completed -> completed; otherwise valid flat state.status; else running. Do not alter JSON state, versions, dates, identifiers or old SQL sidecars. Add a canonical-values CHECK constraint. Migration runs once with immutable marker, not at runtime.
5. Upgrade: synchronize plugin assets, generate/apply normal app DB migration, regenerate Prisma client before deploying writer/read service; stop older binaries during migration (no mixed-version writes to required defaulted column). Legacy rows remain readable before rewrite via mapper; post-migration list filters use backfilled column. State-only business values unavailable in legacy rows are not invented.

## Slices

- S0: plan/research/design/run bootstrap and draft PR; validate complete design, baseline, scope.
- S1: schema/sidecar, writer/mapper/filter and types, regression suite, README, run evidence. Gates: structured check/test/lint/fmt, negative controls, quality:scan + arch:check, doc-lint/JSR audit; independent Claude slice review before sign-off commit; push and phase comment.
- S2: closure evidence/run context and dated lesson, separate review. Exact pushed-head final IMPL-EVAL after ready transition; preserve full SHA without changing the head after verdict.

## Regression proof

Exercise same canonical fixtures through real KV and Prisma projection classes and actual list API for every SAGA_INSTANCE_STATUSES entry. Verify create AND update persist status; filtered lists/count/pagination use scalar canonical status and preserve business state. Test legacy flat/v2 rows and scalar-authoritative migrated pre-fix rows. Negative controls restore baseline production writer/mapper/filter (tests retained) and require parity and pre-fix tests to fail, then restore fix. Verify sidecar discovered/appended once through existing migration tooling; execute backfill against isolated PostgreSQL if available, otherwise explicitly unproven.

## Gates and open decisions

Run smallest scoped source wrappers (include --unstable-kv); relevant saga service/projection and migration-tool tests, quality:gate, doc-lint and scoped JSR audit. Full local scaffold.runtime explicitly forbidden by owner; required e2e-cli CI scaffold.runtime verdict must be requested in READY for coordinator to arm. No publish or release gate is claimed. Broader gates that cannot run are recorded unproven.

PLAN-EVAL mandatory before code (separate Anthropic session, owner-selected claude-opus-5-5/high). IMPL-EVAL mandatory, same evaluator restear; no blockers before ready; final reviews exact pushed head. Feature limits 2 plan/5 implementation, two consecutive terminal failures escalate.

Open-decision sweep: no design questions outstanding. PostgreSQL availability is a validation detail safe to resolve during S1; cannot replace required CI runtime verdict.

## Risks / mitigations

- Backfill may lock a large table: application-managed reviewed migration during upgrade; no automatic runtime writes.
- Default cannot repair old mixed-version writers: stop old processes and regenerate schema/client before restart, documented.
- JSON ambiguity on legacy rows: retain legacy precedence; v2 explicit version discriminator protects business payload.
- Persisted invalid scalar status: validate reads and SQL CHECK; no silent normalization of invalid new data.

Deferred: runtime state machine changes, KV changes, stream semantics, canonical store redesign, historic lost business-data recovery, local scaffold E2E. No accepted architecture debt. Contributor entry point: plugins/sagas/README.md instance API migration section.
