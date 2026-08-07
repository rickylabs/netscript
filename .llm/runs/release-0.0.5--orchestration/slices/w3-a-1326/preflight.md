# W3-A preflight — durable producer reconnect semantics

Observed on 2026-08-06 before dispatch:

- `DurableStreamProducer` attempts its initial connection once, latches `#connectError`, and skips
  every later event despite logging that reconnection will occur.
- There is no retry timer, recovery transition, bounded buffer/backpressure authority, readiness
  failure, or shutdown-during-backoff contract.
- W2-B must first establish the standardized versioned stream envelope used by W3-A telemetry.

## Required supervisor mission

1. Specify a finite connection state machine first: initial connect, ready, disconnected, backoff,
   reconnecting, stopping, and stopped, with legal transitions and observable readiness.
2. Define bounded retry/backoff with injectable clock/randomness, cancellation, and shutdown. Tests
   must never depend on wall-clock sleeps.
3. Define write behavior per state: bounded buffering, ordering, overflow policy, explicit rejection
   or drop receipts, and flush/recovery semantics. Silent loss is prohibited.
4. Cover initial outage, server-late-start, mid-session outage, repeated failure, ordered recovery,
   overflow, cancellation, and shutdown during backoff with deterministic tests and negative
   controls.
5. Prove a real generated producer recovers across an Aspire stream-service outage without process
   restart, preserving the documented ordering/loss contract and leaving exact owned cleanup.
6. Emit spans/metrics/logs for connection state, retry/backoff, buffered/dropped/rejected writes,
   and recovery using W2-B's standardized envelope/correlation fields. Operator text must name only
   real transitions.
7. Run focused package/runtime tests, scoped source wrappers, doctrine/package gates, public doc
   lint, serial publish dry-run, consumer proof, and correlated runtime/OTEL gates.
8. Open a draft PR with `Closes #1326` only after all seven rows are evidenced; leave it at
   `status:impl-eval` for separate Qwen evaluation.

A loop that retries forever, an unbounded queue, or warning-only loss is not recovery. The evaluator
must be able to force every transition and overflow branch deterministically.
