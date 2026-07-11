# #409 T8 Flow-B E2E Worklog

## Design

- Public surface: `scaffold.runtime` gains generated-only Flow-B fixture, real streams consumer,
  and live Aspire grouped-trace validator gates. No package public export changes.
- Domain vocabulary: TC-1/2 span identity/kind, TC-3 status, TC-6/7 namespaced correlation and
  outcome floor, TC-9 W3C parent continuity, TC-14 fan-in links.
- Ports: the validator consumes `AspireTelemetryQuery`; the consumer uses the real durable-streams
  HTTP protocol and shared `createStreamsInstrumentation()` / `createFanInLinks` behavior.
- Constants: new gate/resource ids live in `cli-surface.ts`.
- Slice: generated fixture + callback, real stream consumer, T7 query assertions, suite wiring.
- Deferred: none planned. The red callback evidence below requires supervisor rescope because the
  generated project maps telemetry to published beta.5.

## Implementation

- Added a generated-only health-job callback fixture using local T6 `@netscript/sdk/client`.
- Added a post-start job configuration gate that grants the generated callback network permission.
- Added a real streams resource wait and consumer. The consumer creates the stream when the
  scaffold's startup producer missed it, reads it through the live service, and emits a real
  SDK-backed `stream.subscribe` span with T5 fan-in link attributes to Aspire OTLP/HTTP.
- Replaced the inline raw-dashboard assertion path with a checked module using
  `AspireTelemetryQuery`. A live-response shim converts Aspire OTLP `resourceSpans` and corrects
  OTLP wire SpanKind values before handing data to the T7 contract.
- Assertions are named with #402 TC ids and cover queue parenting, dispatch/job parenting,
  callback parenting, trigger no-fresh-trace, links, and the attribute floor.

## Evidence

| Gate | Result |
| --- | --- |
| Focused runtime/suite registry tests | PASS, 12 passed / 0 failed |
| Scoped CLI check wrapper | PASS, 596 files, 0 findings |
| Scoped CLI lint wrapper | PASS, 596 files, 0 findings |
| Scoped CLI fmt wrapper | PASS, 596 files, 0 findings |
| `scaffold.runtime` real stream leg | PASS: fixture, streams wait, callback job configuration, and `behavior.otel.stream-consumer` |
| `scaffold.runtime` grouped trace | RED: `TC-1/TC-9 FAIL: job trace contains rpc.client`; observed live trace ends `...queue.enqueue,queue.dequeue,job.execute` |

## Drift

- D1 owner waiver: slice PLAN-EVAL artifacts and external evaluator dispatch are waived by Tier-A
  supervisor session `fb43bc3e`.
- D2 inherited integration mismatch: generated local-source scaffold maps `@netscript/telemetry/*`
  to published beta.5. Mapping local T6 SDK alone does not produce the callback span. Mapping local
  telemetry subpaths globally makes published workers/triggers services fail startup. Closing this
  requires either scaffold-local package mapping support scoped per resource/subprocess or a product
  source change outside the brief's e2e-only fence.
- No telemetry package source was modified. No `deno.lock` change is owned by this slice.

## Reconcile

- #409 must remain open: the epic merge gate is correctly red on the missing real callback span.
- The e2e now fails by named TC instead of the former partial trigger-to-worker assertion.
