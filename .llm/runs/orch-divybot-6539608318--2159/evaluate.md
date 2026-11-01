# Independent implementation and slice review — round 1

**PASS.** I found no blocking defects in the working-tree slice. I read the code and tests only; I did not run any gates.

- **Single commit.** Every adapter writes replay marker, state, correlation and history in one commit:
  - **KV and Redis:** one `atomic()` call checks the state versionstamp, the correlation owner, and that the `transition-v1` replay marker is absent. A loser that sees the marker returns `committed: false`; any other loser throws a version mismatch.
  - **Ordinary Prisma:** one interactive transaction. The marker goes in first with `createMany({ skipDuplicates: true })`; `expectedVersion: 0` uses `create`, later versions use a version-guarded `updateMany`. The correlation owner is verified, then history is written. Any throw rolls back the marker as well.
  - **Prisma command adapter and memory store:** unchanged; both already commit atomically.
- **No pre-handler writes.** The engine no longer uses injected `appliedKeys` when a store is configured, on either the ordinary or compensation path. The pre-handler check is the read-only `hasAppliedTransition`, which only reads committed digests. The old granular `save`/`saveCorrelation`/`appendTransition` path is gone.
- **Bridge.** `engine.usesAtomicReplay` skips `SagaIdempotencyPort` reservation for `publish` and cascaded `send` whenever a store is configured. Storeless composition keeps the old behaviour.
- **Orphaned legacy markers.** The atomic key is nested one level deeper (`applied/<id>/transition-v1/<hash>`), so old raw-key markers can't alias it. The supervisor orphan test seeds both legacy markers in the same keyspace and asserts one commit.
- **Crash proof.** It goes through the production `SagaRuntimeSupervisor` with the durable bridge and applied-key stores injected. The test pauses at `commitTransition`, sends SIGKILL, restarts on the same persisted KV or real Redis, and asserts one history row and version 1. The handler runs twice in the crash case and once in the orphan case, and the duplicate publish after resume is a no-op.
- **Capabilities.** KV and ordinary Prisma advertise `transitionOutbox: 'unsupported'` and reject command intents before writing anything. `isSagaTransitionStore` still requires `same_commit`, so `durableWorkerCommands` sagas on those stores are refused at registration. `register` refuses non-atomic stores before any handler runs.
- **Wrappers.** The projection and recording decorators pass through the delegate's exact capabilities and `hasAppliedTransition`, and the recording store logs a `commitTransition` operation.
- **Retention.**
  - **KV:** the new digests sit inside the `applied` family, which the retention sweep lists by prefix. Expiry is set only on terminal commits, and `delete` removes them. The sweep's comment that these families have no child keys is now inaccurate, but it doesn't break: the digests are still leaf keys and the cursor still advances correctly.
  - **Ordinary Prisma:** markers are kept after delete, matching the existing command adapter. Retention belongs to `createPrismaSagaCommandRetention`, and the README says so.

**Non-blocking notes:**

- A CAS loser throws `validationFailed`, which is marked `retryable: false`. Nothing breaks today because delivery hands the error back to the queue, which redelivers regardless of the flag. A future change that starts using `classifyRetry` would send these losers to the dead-letter path, so `SagasError.retryable` is the more accurate code.
- If two ordinary-Prisma writers create the same new instance at once, the loser gets P2002 rather than a version mismatch. It still rolls back cleanly and is redelivered.

**Before sign-off:**

- The PostgreSQL process-kill tests (ordinary and command adapter) and the per-write rollback test have not finished yet, and the negative controls have not run. Both must pass and be recorded. Any PostgreSQL gate that can't run must be marked unproven.
- The final verdict still has to name the exact pushed SHA. The PR stays Refs-only with the effects-outbox follow-up and no closing keyword.

VERDICT: PASS

After review, both PostgreSQL crash tests and the per-write rollback test passed. All acceptance
negative controls failed as expected; see memory-negative-controls.md. Version conflicts were
changed to retryable errors, with a regression assertion. Final pushed-head review is pending.
