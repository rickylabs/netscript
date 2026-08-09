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

## Post-failure live diagnosis

Diagnostic commit `cb6c95599` made TC-14 print every relevant identity before any selector or
product repair. A retained generated service reproduced the mismatch with:

- selected Flow-B producer trace: `36877bd0933da790de3f5f17d7c885dd`;
- consumer trace/span: `0a17c1c06c30cada853b5849bea776ba` / `06d3f0d130f712a6`;
- link count: 3;
- linked traces: `a44ea6b1b08b60a32f0c31b24e12432a`,
  `da802c02af034aac6cf9ac2bb142065b`, and `dc7c11ab60e258dbe898f22b9f32cd49`.

Dashboard attributes resolve the selected producer to the real `flow-b-callback` `job.execute`
trace with correlation `trg_evt_50c283fa-6224-47ff-ae38-7cd2e1908dda`. The three links instead
resolve to `stream.publish` spans for collection `job`, with message/correlation ids
`flow-b-callback`, `health-check`, and `workers-plugin-health-check`. They are startup job snapshots,
not the Flow-B execution record.

This classifies the failure as a **gate-side record-selection defect**. `createDurableStream`
creates a publish span and stores its W3C `traceparent`/`tracestate` in each SSE record; the consumer
correctly reconstructs links from the three records it actually consumed. The diagnostic then
incorrectly treats the first batch wholesale as Flow-B evidence and separately copies the real
Flow-B correlation onto that consumer span. The observed mismatch therefore does not identify a
product context drop. End-to-end propagation remains unproven until the gate selects the actual
`flow-b-callback` execution record before constructing its span.

No repair was implemented before this classification was reported. The isolated diagnostic AppHost
was stopped; scoped teardown removed owned `postgres-b73d5698`; the final leak artefact contains only
the known foreign `redis-jfgcbtaf`.

## Serialized verdict after record-selection repair

- Grant: milestone-orchestrator ledger row 39, committed and pushed before the run.
- Command, run once: `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`.
- Raw exit code: **1**.
- Full aggregate: **passed=73 failed=1**.
- `runtime.wait.streams`: **PASS**, 237 ms.
- `behavior.otel.stream-consumer`: **FAIL**, 20,533 ms.
- `behavior.otel.traces` / TC-14: **NOT EXECUTED** after the preceding critical failure.
- `cleanup.aspire-stop`: **PASS**, 437 ms.
- No retry was attempted.

The bounded selector exhausted all 40 batches and its 20-second wall-clock limit while looking for
correlation `trg_evt_146400d1-7068-49e7-bdec-475ce8b026af`. It observed only
`flow-b-callback`, `health-check`, and `workers-plugin-health-check`. Therefore this pass produced no
selected execution record, no consumer span, and no producer/link trace-id comparison. Claiming a
TC-14 result from the aggregate would be false.

The focused negative evidence remains explicit:

- `TC-14 rejects a matched record without traceparent` passes by asserting the guard throws a
  TC-14 failure;
- `TC-14 rejects a matched record whose trace differs from the producer` passes by asserting a
  different W3C trace id throws a TC-14 failure.

Those tests prove the gate detects context loss once the matching record exists. The serialized
failure shows the generated stream did not expose such a record within the required bound. Owner
ruling 2026-08-09 splits that product prerequisite and row-6 runtime proof to #1398 while retaining
TC-14 here as the follow-up acceptance test.

The subsequent no-token empirical audit in `join-audit.md` distinguishes absence from an unknown
join key: a fresh execution completed, but a subscription held from the pre-trigger committed offset
received no data for 25 seconds, and the post-trigger snapshot retained the same three startup job
records and offset. Only definition-level job id/name overlap with `job.execute`; execution id,
`trg_evt_*`, and producer trace id appear in no stream record. The execution record is not published,
so this is a product finding outside #1395 rather than another selector repair.

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
| 6 | Aspire proves producer → durable stream → SSE consumer as one end-to-end trace | **SPLIT TO #1398** | The selector repair skipped unrelated startup records correctly, but empirical audit proved completed executions are not published. Owner ruling moves the product prerequisite/proof to #1398; TC-14 remains here as its acceptance test. |
| 7 | Drift tests cover event name/envelope/cardinality/telemetry | PROVEN | Contract negatives and real-server proxy conformance. |
| 8 | Complete shapes appear in task and generated/reference API docs | PROVEN | Official task docs, exported module/symbol JSDoc, full core export-map doc lint. |

Rows 1–5, 7, and 8 are proven. By owner ruling 2026-08-09, row 6 is explicitly dispositioned as a
split to #1398 rather than silently treated as proof from #1395. The PR therefore carries
`Closes #1329` and advances to `status:impl-eval`; the separate evaluator is launched only by the
orchestrator.

Post-failure `agentic:review-threads` passed with exit 0: 0 threads, 0 unanswered. No evaluator was
launched by the implementation session.

## Fresh `./streams` doc baseline

At head, `deno doc --lint packages/fresh/src/runtime/streams/mod.ts` reports exactly **11**
`private-type-ref` diagnostics. The same command in the untouched PLAN-EVAL v4 checkout
`/home/codex/repos/ns005-planeval-v4` reports exactly **11**. The new SSE helper/core exports add
zero diagnostics. An older, non-authoritative planning checkout reports 7 because it predates the
carried-in StreamDB aliases; it is not the plan baseline used for this slice.
