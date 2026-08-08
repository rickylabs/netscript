# Serialized runtime gate: W2-B #1329

## Grant and command

- Grant: milestone-orchestrator ledger row 21, received before this run.
- Pre-run leak check: exit 0; Aspire/Docker probes `ok`. The only survivor was foreign
  `redis-jfgcbtaf`, owned by `/home/codex/repos/w6-review-desk`; it was left untouched.
- Command (run once):
  `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`
- Raw exit code: **1**.
- Full aggregate: **passed=74 failed=1**.
- Failed gate: `behavior.otel.traces` — 58,790 ms.
- Cleanup gate: `cleanup.aspire-stop` — PASS, 1,584 ms.
- No retry was attempted.

## #1329-specific runtime results

| Gate | Result | What executed |
| ---- | ------ | ------------- |
| `runtime.wait.streams` | PASS (217 ms) | The generated durable stream service reached runtime readiness. |
| `behavior.otel.stream-consumer` | PASS (943 ms) | The Deno-side consumer read the real generated service through the exported named-event binding, committed the opaque control offset, reconnected from it, observed a derived heartbeat, ran the malformed-control parser assertion without offset advancement, and executed the docs example extracted verbatim against that service. |
| Extracted native example | PASS within `behavior.otel.stream-consumer` | `runDocumentedStreamExample()` read the official docs source, appended only the test receipt/cleanup suffix, and imported that exact source against the generated service. A separate focused server test proves its ordered three-change upsert/upsert/delete batch materializes one retained record. |
| `behavior.otel.traces` | **FAIL (58,790 ms)** | `TC-14 FAIL: SSE consumer W3C link points into the producer Flow-B trace`. The consumer link trace id did not equal the actual Flow-B producer trace id. The ids were not printed; the equality assertion result is the recorded evidence. |

The malformed control was not injected through the real generated service. It is a synthetic invalid
`control` payload evaluated by the exported parser inside the real-service consumer gate, using the
offset committed by that live service. Likewise, ordered deletion is proven by the focused verbatim
example test and by the real `DurableStreamTestServer` conformance test, not by observing a delete in
the generated Flow-B stream.

## Post-run ownership verification

Post-run leak check exited 0 and its artefact reports Aspire/Docker probes `ok`. The only survivor
is still the same foreign `redis-jfgcbtaf` container owned by
`/home/codex/repos/w6-review-desk`; no W2-B-owned AppHost, process, or container survived.

## Issue #1329 acceptance audit

| # | Acceptance row | Verdict | Evidence / limitation |
| - | -------------- | ------- | --------------------- |
| 1 | One exported versioned schema covers names/payloads/data/control/error/heartbeat | PROVEN | Core v1 authority, six contract tests, full export doc lint. |
| 2 | Server, generated consumers, Fresh helpers, and docs use/conform to it | PROVEN | Real server proxy conformance, generated/Fresh tests, named generated runtime consumer, copy-exact docs test. |
| 3 | Official example works unchanged against a real service | PROVEN | Verbatim extraction executed inside the passing generated-service consumer gate. |
| 4 | Replay/ordering/batching/deletion/reconnect/malformed behavior documented | PROVEN | Task docs plus contract/runtime tests. Runtime provenance is split as disclosed above; malformed/deletion are not injected through the generated service. |
| 5 | Data carries correlation plus W3C trace context | PROVEN | Producer, schema, telemetry, and real-server conformance tests; live generated consumer accepted schema-valid fields. |
| 6 | Aspire proves producer → durable stream → SSE consumer as one end-to-end trace | **NOT PROVEN** | Exact TC-14 W3C trace-id equality assertion failed. |
| 7 | Drift tests cover event name/envelope/cardinality/telemetry | PROVEN | Contract negatives and real-server proxy conformance. |
| 8 | Complete shapes appear in task and generated/reference API docs | PROVEN | Official task docs, exported module/symbol JSDoc, full core export-map doc lint. |

Because row 6 is not proven, adding `Closes #1329`, setting `status:impl-eval`, or claiming the PR is
ready would be dishonest. The draft PR continues to reference the issue without a closing keyword.

Post-failure `agentic:review-threads` passed with exit 0: 0 threads, 0 unanswered. PR and issue
remain at `status:impl`; no evaluator was launched.

## Fresh `./streams` doc baseline

At head, `deno doc --lint packages/fresh/src/runtime/streams/mod.ts` reports exactly **11**
`private-type-ref` diagnostics. The same command in the untouched PLAN-EVAL v4 checkout
`/home/codex/repos/ns005-planeval-v4` reports exactly **11**. The new SSE helper/core exports add
zero diagnostics. An older, non-authoritative planning checkout reports 7 because it predates the
carried-in StreamDB aliases; it is not the plan baseline used for this slice.
