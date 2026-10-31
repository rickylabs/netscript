**Direct-dispatch compatibility correction: PASS.** I found no blockers. I reviewed the five files in the correction read-only and did not run the tests or the negative control.

- **Persistence is never skipped.** `WorkerDispatchContext.deadLetters` is now optional, but the dispatcher falls back to `createDefaultJobDeadLetterStore(context.queueName)`. That gives the same KV store under the same `workers:job-dlq:<queue>` namespace as before, so dropping the field changes where nothing is written. The ordering and requeue-on-failure behaviour from S2 is unchanged.
- **The namespace logic lives in one place.** `Worker` and the dispatcher both call that one factory, and `Worker.deadLetters` stays required.
- **It also fixes callers the CI run didn't name.** Besides the saga relay template, two other files build this context directly without the field: `plugins/sagas/tests/runtime/fixtures/apply-publish-order-effect.ts` and `plugins/triggers/src/runtime/scheduled-idempotency_test.ts`. Making the field optional means they type-check again too.
- **The regression test works.** It removes the field from a real context, runs a failing zero-retry job through a fresh in-memory shared KV, and finds one record under `workers:job-dlq:jobs`. It first checks the shared KV is uninitialized and closes it afterwards, so it can't pass by accident. Removing the fallback would make it fail to type-check or throw, so it is a valid negative control.

**Advisory (not blocking).** A direct caller that leaves out the field now writes to the shared KV when a job is exhausted. If that KV isn't available, `processWorkerJob` rejects instead of returning quietly as it used to. That is the intended guarantee that persistence is never skipped. CI on the saga and trigger fixtures will show whether any of them depended on the old quiet failure.

VERDICT: PASS
