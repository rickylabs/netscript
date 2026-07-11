# #409 T8 Flow-B E2E Worklog

## Design

- Public surface: `scaffold.runtime` gains generated-only Flow-B fixture, real streams consumer,
  and live Aspire grouped-trace validator gates. No package public export changes.
- Domain vocabulary: TC-1/2 span identity/kind, TC-6/7 namespaced correlation and
  outcome floor, TC-9 W3C parent continuity, TC-14 fan-in links.
- Ports: the validator consumes `AspireTelemetryQuery`; the consumer uses the real durable-streams
  HTTP protocol and shared `createStreamsInstrumentation()` / `createFanInLinks` behavior.
- Constants: new gate/resource ids live in `cli-surface.ts`.
- Slice: generated fixture + callback, real stream consumer, T7 query assertions, suite wiring.
- Deferred: none.

## Implementation

- Added a generated-only health-job callback fixture using local T6 `@netscript/sdk/client`. The
  callback calls the generated users service through real oRPC and records a fixture-owned
  `flow-b.callback` boundary span with canonical correlation/outcome attributes.
- Added a preparation gate that creates a resource-private Deno config/import map, switches only
  `workers-api` to local workers service/SDK/telemetry sources, wires the workers subprocess to the
  users service, and supplies the generated job registry and trigger target. Published
  workers/triggers startup mappings remain untouched.
- Added a real streams resource wait and consumer. The consumer creates the stream when the
  scaffold's startup producer missed it, reads it through the live service, and emits a real
  SDK-backed `stream.subscribe` span with T5 fan-in link attributes to Aspire OTLP/HTTP.
- Replaced the inline raw-dashboard assertion path with a checked module using
  `AspireTelemetryQuery`. A live-response shim converts Aspire OTLP `resourceSpans` and corrects
  OTLP wire SpanKind values before handing data to the T7 contract.
- Assertions are named with #402 TC ids and cover queue parenting, dispatch ancestry across the
  queue boundary, `job.execute -> flow-b.callback -> rpc.client`, trigger no-fresh-trace, links,
  and the callback/fan-in attribute floor.

## Evidence

| Gate | Result |
| --- | --- |
| Scoped CLI check wrapper | PASS, 597 files, 0 findings |
| Scoped CLI lint wrapper | PASS, 597 files, 0 findings |
| Scoped CLI fmt wrapper | PASS, 597 files, 0 findings |
| `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | PASS, 57 passed / 0 failed |
| `behavior.otel.stream-consumer` | PASS, real durable-stream read and SDK-backed fan-in link |
| `behavior.otel.traces` | PASS, live T7 `AspireTelemetryQuery` read side; all TC-named assertions passed |
| Lock/cast hygiene | PASS: no slice-owned `deno.lock` diff; no new `as` casts |

## Drift

- D1 owner waiver: slice PLAN-EVAL artifacts and external evaluator dispatch are waived by Tier-A
  supervisor session `fb43bc3e`.
- D2 resolved by Tier-A rescope: the generated fixture now uses a workers-api-only config and
  explicit bare local service entrypoint; no global remap is applied.
- D3 base movement: merged `origin/main` as directed. PR #597 was not yet reachable from
  `origin/main` in this checkout, so fetched and merged `refs/pull/597/head` to reconcile its
  `scaffold.ui-local-source` fixture pattern and suite changes before implementation.
- D4 real workers-router oRPC probe returned 404 even with aligned local client/server sources.
  A product fix was not required for this slice: the callback uses the scaffold's generated users
  oRPC service, preserving the required real `rpc.client` edge without changing product source.
- No telemetry package source was modified. No `deno.lock` change is owned by this slice.

## Reconcile

- #409 acceptance is satisfied in the e2e/CLI layer; PR lifecycle and `Closes #409` remain with the
  Tier-A supervisor.
- The final grouped trace is real and non-mocked: one trigger/dispatch/queue/job/callback trace,
  plus a real streams fan-in span link queried through the Aspire dashboard adapter.
