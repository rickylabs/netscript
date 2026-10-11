# Changelog

## Unreleased

- Add `KvSagaSchedulerStore` at `./stores` and bind the core `SagaScheduler` to originating instance
  deadlines. Bounded background sweeps preserve open sagas, expire every scoped scheduler outcome,
  resume after restart, and avoid replay deadline renewal or concurrent-claim cancellation.

- Retain applied replay keys for open sagas. `KvSagaAppliedKeyStore.activeTtlMs` is deprecated and
  no longer expires open markers; migrate callers to `completedRetentionDays`, aligned with the
  canonical store's terminal retention window. This changes the former active-key TTL behavior.
- Bound terminal history sweeps to Deno KV atomic limits and advance cursors past each processed
  key.

- Add the thin checked saga command outbox sink at `./integration/commands`.
