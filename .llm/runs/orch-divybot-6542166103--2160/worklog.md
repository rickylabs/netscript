# Worklog

## Design

1. Public surface: existing GET/list saga instances; `state` is business data,
   top-level status/identifiers/timestamps are runtime data. Existing contract.
2. Vocabulary: SagaStateEnvelope, SagaInstanceReadModel, SagaStorePort and existing
   SAGA_INSTANCE_STATUSES. No new lifecycle or finite domain values.
3. Ports: existing findByCorrelation/load on SagaStorePort; Prisma indexed
   findFirst query; existing KV/date decoding and projection port.
4. Constants: existing lifecycle vocabulary and canonical KV store key namespace;
   no duplicated raw canonical keys or new protocol literals in production code.
5. Commit slices: S0 plan; S1 cohesive read-model/lookup/tests/docs slice; S2
   review fixes/evidence. Exact file families and gates are in plan.md.
6. Deferred scope: #2382 status lists and release/scaffold CI scheduling. No new
   clocks, transports, durability, cancellation or compensation behavior.
7. Contributor path: plugins/sagas/src/runtime/saga-instance-projection.ts owns
   envelope-to-query mapping; service helpers consume that mapping and store port.

## Preflight

Current main matches baseline. No covering PR found. RTK unavailable; using focused
raw commands and required structured gate wrappers. No local runtime resources
started. Owner evaluator override is recorded verbatim in supervisor.md.

## Reconcile S0

The assignment contains conflicting PR closure text: the specific operator process
asks for a leading Refs URL; later delivery instructions require the exact final
Closes line. Preserve the leading Refs URL and required trailing line. Coordinator
owns labels/milestones, scaffold runtime and merging. Final report uses excluded
atomic file handoff. No scope expansion to #2382.

## PLAN-EVAL round 1

FAIL_PLAN: explicit backend matrix, persisted format discriminator and exact file
inventory needed. All three clarified in plan.md before implementation.
Baseline tests: 271 pass, 0 fail, 18 environment-dependent skips. Baseline
quality:gate exits 0. Baseline JSR audit exits 0 (existing warnings).

## S1 implementation and validation

PLAN-EVAL round 2 PASS preceded source edits. Projections now preserve state and
Prisma carries an explicit version marker. Direct GET uses the existing store
index/load seam, with one indexed Prisma projection query when selected. The API
and runner share backend settings/processor overrides; no transition/replay/
compensation semantics were changed. Exact extra test files are in drift.md.

Local results and regression negative controls: gate-evidence.md and reports/.
326 tests pass, 18 skip; check/lint/fmt and quality:gate pass. Both JSR audits
pass. Doc lint remains red with exactly the baseline's privateTypeRef findings
(plugin 30, core 7); no green claim. Required scaffold.runtime is unproven locally
by instruction and will be requested from the coordinator at READY.

## Reconcile S1

Draft PR #2517 remains open. No review comments yet. No #2382 expansion, labels or
milestone changes. No deno.lock diff. Both baseline atomic transition and
compensation regressions remain in the full passing suite. The business-state
migration is documented for API and direct Prisma consumers, including old rows.
Independent slice review is next, before the implementation commit.

## IMPL-EVAL round 1 repair

Separate reviewer found one blocker: the Prisma stream startup reconciler still
expected the old flat projection. Added its versioned read path, sharing the
runtime read-model parser with HTTP, plus collision and legacy regressions.
Old stream mapper negative control fails exactly one regression test. All earlier
negative controls were rerun and still fail as intended. Full suite now 328 pass,
18 skip; scoped check/lint/fmt cover 262 files. quality:gate and plugin JSR audit
pass again; doc-lint grouped findings remain identical to baseline. Round 2 will
re-steer the same read-only evaluator before committing the cohesive S1 slice.

## Independent S1 sign-off

IMPL-EVAL round 2 PASS: the same separate read-only Claude reviewer approved the
cohesive implementation commit after reviewing the stream repair and independently
checking the 19 acceptance/backend/reconciliation tests. See evaluate.md. The
implementation commit includes worklog/context-pack and all local proof. Next:
push, phase comment, ready-for-review transition, exact-pushed-head final review
in that same evaluator session, review-thread gate and current CI snapshot.
The final immutable verdict is posted as PR evidence, avoiding a post-review commit.
