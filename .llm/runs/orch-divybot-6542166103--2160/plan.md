# Plan & Design — READY FOR REVIEW

Issue #2160; milestone 0.0.9 group B1. Archetypes 3 and 5, API/docs scope.

## Locked decisions

1. Preserve the business payload exactly at API `state` and KV projection `state`.
   Prisma's existing JSON column stores `{ state: <business>, status, metadata,
   ...runtime identifiers }`. Runtime status stays at its existing JSON path so
   this change does not implement #2382. Legacy rows use an explicit fallback;
   already-overwritten historical business values cannot be recovered.
2. KV GET uses SagaStorePort.findByCorrelation then load, mapping the envelope
   directly. No projection list or history access. Missing index/envelope is 404.
3. Inject the canonical store into the service, honoring independent store and
   projection backend configuration and the existing openSagaRuntimeKv seam.
4. Prisma GET uses one findFirst predicate on the existing indexed sagaName and
   correlationId columns; no ordering, list, count, migration or new unique key.
5. Share the envelope-to-read-model mapper with the KV writer; transition supplies
   optional lastMessageType only on projections. Direct GET may omit this field.
6. Document state migration, retained historical limitations and direct-read
   freshness/optional lastMessageType in the sagas README and user docs.

## Ordered slices

S0: tracked run bootstrap and plan; draft PR, separate PLAN-EVAL.
S1: implement projections, direct lookup, service wiring, contract clarification,
regression tests and migration docs in one cohesive slice (<30 source files).
Gates: structured check/test/lint/fmt, quality:gate, package JSR audit/doc lint,
negative controls (old projection writer and old scan lookup), separate slice
review before commit, push and phase evidence comment.
S2: evaluator-driven fixes if necessary; final exact-pushed-head IMPL-EVAL,
ready transition, review-thread check, CI snapshot, final READY handoff.
Every slice updates worklog/context-pack; no merge or release.

## Risks and mitigations

- Payload shape migration: explicit docs; keep API contract's state/status split.
- Stale/corrupt/missing index: test absent and dangling correlations, reject with 404.
- Independent backend configuration: inject selected canonical store; test seam.
- Query regressions: spies fail on list/count/sort; count exactly two KV gets at
  multiple cardinalities, including arbitrary non-derived instance identifiers.
- Persisted metadata dates: use existing store decoder and projection date mapper.
- Historical flat Prisma rows: retain truthful legacy fallback, never interpret
  nested business metadata as runtime metadata for new projections.

## Open decisions

None that force implementation rework. Coordinator scheduling of scaffold.runtime
is safe to defer; required verdict remains unproven until CI supplies evidence.

## Gates and deferred scope

Run focused core/plugin runtime and API tests through structured wrappers. Run
quality:gate (quality scan + architecture), scoped wrappers and public docs/JSR
checks. Full local scaffold.runtime forbidden by owner; request coordinator's
CI e2e-cli verdict in READY. No labels/milestones changed. #2382 status list
semantics, compensation, atomic commits and unrelated debt are deferred.
No new architecture debt planned; report baseline gate failures accurately.

## PLAN-EVAL round 1 corrections (locked)

- Prisma projection JSON is the full SagaInstanceReadModel plus the explicit
  `projectionVersion: 2` marker, defined by a shared named constant. The reader
  checks that marker, validates the new document, and returns nested business
  `state` unchanged. Legacy flat rows are not guessed from state/metadata keys;
  return their existing payload verbatim with runtime fields derived separately.
  Historical overwritten values need a new transition or application-led replay;
  no read-time migration can recreate missing data.
- `services/src/instance-query.ts` resolves service read wiring from the same
  env+appsettings backend resolver with `defaultBackend: 'kv'`. `main.ts` supplies
  merged process/context env and service appsettings, exactly as runner settings.
  Only a direct canonical read needs a store. Its KV opener is
  `openSagaRuntimeKv`, preserving NETSCRIPT_SAGA_KV_PATH. Prisma canonical reads
  validate only isPrismaSagaStoreClient; projection delegates are unnecessary.
- Backend matrix (all six combinations tested through this wiring helper):

  | Canonical | Projection | GET | list |
  | --- | --- | --- | --- |
  | kv | kv | canonical index+envelope, two KV gets | KV projection |
  | prisma | kv | canonical findByCorrelation+load, two unique queries | KV projection |
  | kv | prisma | one indexed projection findFirst | Prisma projection |
  | prisma | prisma | one indexed projection findFirst | Prisma projection |
  | kv | none | canonical index+envelope, two KV gets | empty |
  | prisma | none | canonical findByCorrelation+load, two unique queries | empty |

  Context has optional `sagaStore` for direct reads; GET chooses it when present.
  `useKvProjection` remains specifically the list backend selector. Projection
  none returns the existing empty DB adapter for lists and injects canonical store
  for GET. Only Prisma projection requires the full query/stream client.
- No docs expansion needs a human decision: the assignment explicitly authorizes
  sagas migration documentation; the old docs/pages path was a discovery error.
  supervisor.md now lists the actual authorized sagas documentation file.

## S1 exact file inventory

Production: plugins/sagas/src/runtime/saga-instance-projection.ts;
plugins/sagas/services/src/instance-query.ts (new);
plugins/sagas/services/src/main.ts;
plugins/sagas/services/src/database-client.ts;
plugins/sagas/services/src/routers/v1-types.ts;
plugins/sagas/services/src/routers/v1-helpers.ts;
plugins/sagas/services/src/routers/v1-handlers.ts;
packages/plugin-sagas-core/src/contracts/v1/sagas.contract.ts (JSDoc only).

Tests: plugins/sagas/services/src/instance-query_test.ts (new);
plugins/sagas/services/src/instance-read_test.ts (new);
plugins/sagas/services/src/prisma-retention_test.ts;
plugins/sagas/tests/runtime/fixtures/runner-prisma-client.ts;
plugins/sagas/tests/runtime/saga-kv-only-runner_test.ts;
plugins/sagas/src/runtime/saga-instance-projection_redis_test.ts.

Docs: plugins/sagas/README.md; docs/site/durable-workflows/sagas.md.
Run: current scoped run directory, including memory, gate evidence and evaluations.
Any additional source file requires explicit drift recording before it is edited.
