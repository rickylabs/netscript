# W2-B preflight — versioned stream SSE and telemetry envelope

Observed on 2026-08-06 before dispatch:

- The official docs use ordinary `EventSource.onmessage` and one change object, while the real wire
  emits named `data` events containing arrays plus named `control` offset frames.
- No single exported versioned schema currently governs server emission, generated consumers, Fresh
  helpers, docs, replay semantics, and W3C/correlation propagation.
- W3-A's reconnect/runtime work depends on this contract and cannot dispatch until W2-B lands.

## Required supervisor mission

1. Define the package-owned versioned schema/type contract first: exhaustive event names plus data
   batches, control/offset, error, and heartbeat payloads; ordering, deletion, replay, malformed
   frames, correlation identity, `traceparent`, and `tracestate` semantics.
2. Export the contract through the intended public package modules with coherent input/output types,
   documentation, isolated declarations, and no private validator leakage.
3. Make server emission and generated consumers derive from or conformance-test against the same
   authority. Reject parallel hand-written event-name/payload tables.
4. Update Fresh 2.x helpers and the official native `EventSource` example to consume named events
   and schema-validated payloads. Keep interactive browser handling in the smallest appropriate
   island/helper and avoid deprecated Fresh patterns.
5. Prove the documented example works unchanged against a real generated stream service, including
   batching, deletion, offset/replay, reconnect, error/heartbeat, and malformed-frame controls.
6. Capture one correlated Aspire OTEL trace spanning producer → durable stream → SSE consumer with
   repository-standard correlation and W3C context. Use exact AppHost targeting and owned cleanup.
7. Run schema/contract/server/Fresh tests, public export and doc lint, scoped check/lint/fmt,
   package quality, serial publish dry-run, docs links/accuracy, consumer gates, and exact runtime
   smoke.
8. Open a draft PR with `Closes #1329` only after all eight rows are evidenced; leave it at
   `status:impl-eval` for separate Qwen evaluation.

The real wire and exported contract are authorities. A docs-only correction or a consumer that
continues to reverse-engineer untyped frames is false completion.
