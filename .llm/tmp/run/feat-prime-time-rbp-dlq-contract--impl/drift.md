# Drift Log: rbp-dlq-contract implementation

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-06-20 — KvPolling DLQ reprocess uses public record defaults

- **What:** `KvPollingAdapter.reprocessDlq()` re-enqueues from `DeadLetterRecord<T>` through
  `DeadLetterStorePort.reprocess()`.
- **Source:** `packages/queue/adapters/kv-polling.adapter.ts`.
- **Expected:** Plan text said the KvPolling DLQ refactor should preserve behavior "byte-for-byte".
- **Actual:** The locked public `DeadLetterRecord<T>` contract stores payload, headers, delivery
  count, message id, and enqueue/failure timestamps, but intentionally omits KvPolling-private
  fields such as priority, deduplication id, and original max-attempt count. Reprocess resets those
  provider-private fields to current adapter defaults.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `rtk proxy deno test --unstable-kv --allow-env packages/queue/tests/kv-polling-dlq_test.ts`
  passed; `packages/queue/README.md` documents the provider-neutral `DeadLetterStorePort.reprocess()`
  contract.
