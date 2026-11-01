# Worklog

## Routing override

Owner grant verbatim: "Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only." Implementation assigned Codex at high effort. Matrix resolution and feature loop policy recorded in supervisor.md; separate vendor/session preserved.

## Design

1. Public surface: existing instance list/get return SagaInstanceStatus identically for KV/Prisma; generated Prisma SagaInstance gains scalar status. No route/export additions.
2. Domain vocabulary: existing SAGA_INSTANCE_STATUSES, SagaInstanceStatus, SagaInstanceProjection, PrismaRecord; scalar status is runtime lifecycle; nested state remains business state; isCompleted retained for cleanup.
3. Ports: existing SagaInstanceProjectionPort, PrismaSagaInstanceProjectionClient and SagaServiceDatabaseClient, KV adapter, database sidecar migration functions. No new ports.
4. Constants: canonical statuses imported from core; projection version remains existing SAGA_INSTANCE_PROJECTION_VERSION=2; SQL finite literals mirror the canonical set and test enforces parity.
5. Commit slices: S0 bootstrap/draft; S1 canonical schema/writer/query + tests/docs with scoped and quality gates; S2 evidence/lesson/context and final exact-head review. Files/gates enumerated in plan.md and permitted supervisor surface.
6. Deferred: state-machine changes, KV redesign, history recovery, unrelated B1 work, local scaffold.runtime; coordinator owns labels/milestones and merge.
7. Contributor path: plugins/sagas/README.md Instance API state migration -> existing writer and mapper.

## Bootstrap

Baseline confirmed current main includes #2517. Issue/comments and PR search checked: no duplicate full implementation. Memory consulted; MCP guidance/docs asked before design. rtk absent on this host (confirmed from environment and prior memory), using raw commands with bounded output. No product files changed before PLAN-EVAL.

S0 reconcile: issue #2382 acceptance read live; coordinator #2474 owns labels/milestones/E2E. No mutation of those surfaces.

## Plan gate correction

Round 1 independent FAIL_PLAN: require declared migration manifest and actual old-schema PostgreSQL upgrade regression in existing CI. Revised plan and permitted files before product edits; no third round allowed after another terminal failure. Baseline scoped tests: 20 passed, 0 failed/ignored. Baseline quality:gate: PASS (quality scan, dependency and architecture gates), exit 0.

S0 identity correction: commit identity was missing locally despite assignment expectation; used existing repository author and authenticated GitHub public noreply identity via command-local git configuration. No shared/global git configuration changed.

## S1 candidate

PLAN-EVAL round 2 PASS received before product edits; round 1 retained separately. Added canonical scalar persistence, existing query filter/mapping changes, immutable backfill sidecar + manifest, indexed schema and upgrade documentation. Added all-status real projection/API parity, legacy-row, portable exact-UPDATE and native installed-old-schema upgrade regressions. Updated existing atomic projection expected row for new field. No alternate query/store wiring.

Gate results and negative-control evidence: validation.md and validation-summary.json. Two PostgreSQL cases remain locally skipped, never passed. doc-lint has exactly 30 pre-existing private-type-ref errors on candidate and restored production baseline.

S1 reconcile: PR #2522 targets main; scope still #2382 under #2474, no label/milestone edits. No lock drift or assignment-file changes. Independent slice review requested before sign-off commit.

IMPL-EVAL round 1 FAIL_FIX: hand-written PostgreSQL projection fixture lacked new schema column. Fixed its DDL and scalar assertions on create/update; repository scan found no other hand-written real projection tables. Added pre-upgrade information_schema assertion (column absent) and post-upgrade assertion (present), so regex drift cannot weaken the upgrade proof. Final local suite: 34 passed, 0 failed, 3 explicitly ignored native PostgreSQL cases. Fix requires no runtime/core contract expansion.

## S1 sign-off and close record

Same independent Claude reviewer returned PASS on IMPL-EVAL round 2 with substantive correctness/fixture review; evaluate.md preserves it. Required repair check/lint/fmt all exit 0, results added to validation-summary.json. The reviewed sign-off commit is executed under the repository author identity, with no attribution footers.

Final local source validation: whole-plugin check, 10-file lint/fmt, required quality/dependency/architecture gates pass; regression suite 34 passed/3 native PostgreSQL ignored; 2+1 negative-control failures and restored 3/3 green. Publish audit exit 0. Doc-lint baseline-red unchanged (30 identical private-type references). No accepted new architecture debt; no locks/caches deleted or reloaded, no resources started.

S1 reconcile: draft PR #2522, issue-specific highest-priority reference-only directive applied; coordinator controls issue lifecycle/labels/milestones/E2E/merge. Review-thread gate PASS with zero threads/unanswered. All files trace to approved migration/projection/test/run scope; no unrelated changes.

S2 closure: lesson and resumable context co-committed here; after push, mark ready and run final same-evaluator review at exact pushed SHA. Final CI snapshot, review-thread result and exact-head verdict go in PR timeline and excluded final report. Native command-postgres and coordinator-armed e2e-cli scaffold.runtime must be green before merge. Stop at READY, never merge/tag/release.
