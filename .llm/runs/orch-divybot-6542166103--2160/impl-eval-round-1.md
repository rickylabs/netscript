# IMPL-EVAL round 1

**VERDICT: FAIL_FIX.** S1 has one blocker, so it is not approved for its implementation commit yet.

I made no writes, edits, git changes, comments, resource starts or label changes, and I did not run the local scaffold runtime.

## Blocker

**B1: The stream reconciler still reads the old Prisma row format.**

S1 changes what the Prisma projection stores. New rows hold the full read model plus `projectionVersion: 2`, with business data nested under `state.state` (`plugins/sagas/src/runtime/saga-instance-projection.ts:140-143`). One reader of that table was not updated:

- When the projection is Prisma, the API service starts the stream mirror at startup (`plugins/sagas/services/src/main.ts:83-84`). The mirror pages through every `SagaInstance` row and maps each one with `mapSagaRecordToEntity` (`plugins/sagas/streams/producer.ts:149-179`).
- That mapper still expects the old flat row. It emits `state: record.state`, so the `/sagas/instances` stream entity's `state` becomes the whole v2 document: `projectionVersion`, nested `state`, runtime `status`, identifiers and timestamps.
- Its `status` comes only from `isCompleted`, so `compensating`, `failed` and other non-completed statuses all become `running`.
- The live transition path in the same stream emits the business state directly (`mapSagaProjectionToEntity`, `producer.ts:182-195`).

The result is that the same entity changes shape between live updates and a service restart. Stream consumers lose business fields at `state.<field>`. This breaks the acceptance rule that business state is verbatim in projections. Before S1, business fields sat at the top level of the reconciled `state`.

No test catches this. The tests only cover the transition mapper, and `streams/producer.ts` is not in the S1 file inventory or in `drift.md`.

**Fix:**
1. Add a drift entry for `plugins/sagas/streams/producer.ts`.
2. In `mapSagaRecordToEntity`, check for `SAGA_INSTANCE_PROJECTION_VERSION`. For v2 rows, take `state`, `status`, `lastMessageType` and the dates from the nested document. Ideally reuse the same validation as `mapPrismaRecordToInstance`. Keep the current behaviour for legacy rows.
3. Add a regression test where a v2 row's business state has colliding `status` and `metadata` fields and a runtime status other than running or completed. Assert the reconciled entity's `state` equals the business payload and `status` is the runtime status.
4. Add a negative control: the old mapper must fail that test.

## Checked, no blocker
- **KV GET:** exactly two gets, correlation index then envelope, through `findByCorrelation` + `load` on a store opened with `openSagaRuntimeKv`. Missing or dangling correlations return 404 without scanning.
- **Prisma projection GET:** one `findFirst` on `(sagaName, correlationId)`. Dropping the ordering is safe: the engine's instance ID is always `${sagaId}:${correlationKey}` and the upsert is keyed by it, so there is one row per key.
- **Backend wiring:** all six store/projection combinations are tested through the real route. The runner and API share one settings loader, including the processor override. Prisma store with KV projection needs only the runtime delegates.
- **#2499 and #2512:** in `saga-projection-atomic_test.ts` only the expected persisted document changed. The transition, replay and compensation code is untouched.
- **#2382:** not started. `$.status` stays at the top level of the JSON, so list filtering is unchanged.
- **Contract:** the change is JSDoc only. The new helpers are not re-exported from `runtime/mod.ts`, so the public surface is unchanged.
- **Other changes:** the runner's settings loader now also applies the processor override to settings that come from the plugin context, and falls back to the project file when the context has none. That is an intended change and is recorded in drift.
- **Doc lint:** I found nothing in the diff that adds a new finding.

After the fix, S1 needs another round in this session before its implementation commit. Even with a pass, the required `scaffold.runtime` verdict is still unproven until the coordinator arms the e2e-cli CI gate and it reports. External CI and the review-thread check have not run.

VERDICT: FAIL_FIX
