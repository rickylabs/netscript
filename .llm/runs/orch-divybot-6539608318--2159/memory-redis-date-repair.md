# Redis compensation crash and repair

Startup/idle health was insufficient. The scaffold's webhook path publishes the Flow-B compensation
message after the early readiness gate. Reproducing that message in an actual CLI-generated project
with the shared bootstrap and isolated Redis kills the listener: snapshotTransitionCommit calls
getTime on metadata.createdAt, which Redis persisted as a JSON string. Native KV preserves Date,
so the earlier process/crash tests did not expose a second-transition reload.

KvSagaStore now decodes declared envelope/history dates at its read boundary: load, loadMany,
entries, transitions, and ancillary retention reloads. The adapter-local wire types admit Date or
string; public ports still return Date. State and payload values are untouched. Invalid dates fail
closed. The Prisma command store already has its own JSON hydration; its behavior is unchanged.

Negative control on the new six-case round-trip suite: four native/memory cases pass, both Redis
date/compensation cases fail before the repair. After repair they all pass. An additional malformed
date control passes. The projection test now checks raw Redis remains string-valued while canonical
load returns Date, retaining every projection assertion.

Actual generated-project positive proof: publish the same Flow-B request, then 30 health reads stay
ready. The committed generated-glue process test also processes compensation and verifies canonical
version 2 before asserting the strict ready payload. Pre-enqueue its native-KV message before the
child starts: cross-process native queue wakeup uses a periodic poll and is outside this defect.

Structured saga core/store/runtime/service suite with real isolated Redis: 269 passed, zero failed,
five provider-specific ignores. Scoped check/lint/fmt cover five changed source/test files. Remove
temporary E2E diagnostic wrappers after diagnosis; retain the ordinary doctor gate and its exact
readiness contract. The generated Aspire inventory retains only the generated-process test row.
