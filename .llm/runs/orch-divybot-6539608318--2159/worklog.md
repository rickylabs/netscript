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
