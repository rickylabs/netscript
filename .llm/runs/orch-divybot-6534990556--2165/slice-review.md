# Independent implementation slice review

Separate Anthropic session; requested and observed claude-opus-5-5, high effort, stdin closed, read-only. Candidate review before delivery-supervisor sign-off commit; final exact-head review follows push.

No blockers: the uncommitted candidate meets the #2165 acceptance boxes and the negative controls are adequate.

**Acceptance**
- **Slot identity:** the cron adapter now builds the event id as `scheduled_<triggerId>_<UTC minute>` and copies it into `idempotencyKey`. `payload.scheduledAt` is the rounded minute and `firedAt` keeps the real firing time. The per-process counter is gone, so a restart can no longer reuse old ids.
- **Worker side:** `enqueueWorkerJob` already falls back to `event.idempotencyKey`. The job key in the worker store is therefore tied to the trigger and the minute, and the next minute after a restart gets a fresh key.
- **Payload-hash fallback:** both the KV store and the memory test store now hash `[triggerId, payload]`. The caller key and the request-header key still win in the existing order.
- **Definition key:** `deduplication.key` is applied once, before the claim, and the same key reaches the handler and the action dispatcher. When it returns `undefined`, the event's own key is kept. An explicit `enqueueJob` key still wins at enqueue time.
- **Integration test:** `scheduled-idempotency_test.ts` runs the real cron adapter, the real `createRuntimeTriggerProcessor` enqueue path, the real worker dispatcher and the real persisted worker idempotency store. Only the scheduler callback time and the queue transport are controlled.
  - **Restart:** the test closes and reopens the disk database or Redis namespace, and checks that the old worker markers are still there. Both triggers then execute their jobs in the next minute.
  - **Same cron, same instant:** both triggers process and both jobs run.
  - **Duplicate slot:** a second processor fires the same slot 123 ms later with attempt 2; it is deduplicated, and a queue redelivery is skipped by the worker store.
- **Real cron provider:** the adapter test drives the real memory provider's `trigger()` through `fireNow` with wall-clock time. Three firings with different timestamps across two scheduler instances produce one identity, and the test guards against crossing a minute boundary.

**Negative controls**
- I traced each acceptance test against the original code, and each one fails on an assertion:
  - **Restart:** the reused `scheduled_1` makes the worker skip the job.
  - **Same instant:** the payload hash without the trigger id collides between the two triggers.
  - **Duplicate slot:** no `TriggerDeduplicatedError` is raised.
  - **Real provider:** it produces several distinct ids instead of one.
- This matches the recorded 10 assertion failures, with no type or process errors.

**Compatibility**
- No exports, types or dependencies changed.
- Nothing outside tests parses the old `scheduled_N` format.
- The behaviour changes are deliberate and documented in the README: the event id format, the trigger id in the payload hash, the definition key now taking effect, and a second fire in the same minute (including `fireNow`) being deduplicated.

**Non-blocking advisories**
1. **Deferred replays with a definition key:** a replay normally carries its own replay id as the key. If a definition sets `deduplication.key` and its callback ignores the replay id, the replay gets the original event's key and collides with its completed claim. The builders don't expose `deduplication` today, so only hand-built definitions can hit this. Mention it in the README.
2. The testing `MemoryTriggerSchedulerAdapter` still emits `scheduled_N` with no idempotency key. It is a test double outside the declared scope; consider aligning it later.
3. As you said, broad `quality:gate` and full documentation lint stay not green because of the same failures on untouched baseline code. Report them that way in READY.

VERDICT: PASS
