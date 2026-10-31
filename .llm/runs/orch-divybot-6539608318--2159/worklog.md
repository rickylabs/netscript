# Worklog

## Design

1. Public surface: generalized atomic SagaTransitionCommitPort, separate worker-command guarantee;
   optional applied-digest lookup; same handler DSL and state envelope. Durable stores fail closed.
2. Domain vocabulary: committed replay marker is evidence of a completed transition; reservation
   is not. Version-zero means absent state. Conflicting versions are retryable failure, not replay.
3. Ports: SagaStorePort plus SagaTransitionCommitPort; KvStore.atomic and Prisma interactive
   transaction are the external persistence boundaries. Existing lifecycle/clock ports unchanged.
4. Constants: existing saga-inbound-v1 / saga-compensation-v1 digest namespaces and finite
   same_commit / unsupported capability values. Reuse existing state/status/retention vocabulary.
5. Commit slices: bootstrap this plan; then one atomic-persistence implementation slice with
   ports, stores, engine, bridge, decorators and behavioral/crash tests; structured gates prove it.
6. Deferred scope: effect dispatcher recovery needs an integrated scheduler/compensation protocol;
   owner-approved single dependent follow-up, no closing keyword or full acceptance claim.
7. Contributor path: packages/plugin-sagas-core/src/ports/saga-transition-commit-port.ts defines
   how to implement a store. README describes guarantees and adapter migration.

## Routing override (owner, verbatim)

"Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only."

## Intake

Baseline main verified. No duplicate PR. Memory consulted before code reads. RTK absent; use
native commands with structured evidence. PLAN-EVAL pending; no implementation begun.

## Slice 1 — atomic canonical transition persistence

Independent PLAN-EVAL: round 1 requested explicit production reservation coverage; round 2 PASS.
Independent implementation/slice review: PASS, read-only separate Claude Opus 5.5 session. See
plan-eval.md and evaluate.md. Adopted its retryable-conflict improvement and corrected a retention
cursor comment. Final exact-pushed-head evaluation remains required.

All stored handlers and compensation commits now use SagaTransitionCommitPort. The engine and
bridge ignore legacy reservations for stored sagas; only committed digests suppress replay.
KV uses one CAS; ordinary Prisma uses one interactive transaction with conflict-ignore marker
insertion. The existing command protocol is retained, with strict worker capability checks.
Projection/recording wrappers preserve state/replay guarantees without inventing command support.

Local gates: 256 tests passed, 0 failed, 2 intentional ignores with real KV/Redis/Postgres providers;
178 source/test files check/lint/fmt clean; quality:gate receipt exit 0; JSR audit dry-run OK.
PostgreSQL wrapper includes six generated-client cases; real relay and publisher conformance also
run in the full suite. Doc-lint inherited core/plugin counts 7/30 reproduced on clean baseline.
Negative controls: baseline engine/bridge breaks all six crash proofs/upgrade controls plus the
handler/store-failure retry regression; absent KV checks breaks all three backend race tests;
absent Prisma transaction breaks write-seam rollback. No negative mutant is in this branch.

Reconcile: #2159 remains open; slice 2 is deferred exactly as owner permits, as one dependent
follow-up for the coordinator. No closing keyword, taxonomy change, merge, tag or release.
No local scaffold.runtime; e2e-cli CI must be armed by the coordinator. Source is ready for the
slice commit, push and exact-head review. No lock changes.
