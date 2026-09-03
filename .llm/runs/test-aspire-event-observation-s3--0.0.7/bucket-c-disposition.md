# Bucket C disposition — #1906 slice 3

No Bucket-C loop stands in for Aspire resource readiness. All eight sites are legitimately
timing-based at an application, transport, telemetry, direct-child, or in-process fixture boundary.

| Site | Disposition | Reason |
| --- | --- | --- |
| `application/gates/http-gate.ts` | Retain | Repeats an HTTP request until the gate's application response contract returns 2xx. It neither invokes Aspire nor reads resource state. |
| `scaffold/consume-flow-b-stream.ts` | Retain | Selects a correlation-matched application SSE record and waits for eventual trace export. Resource endpoint allocation is already obtained through `resolveResourceUrlsFromAppHost`. |
| `scaffold/select-flow-b-stream-change.ts` | Retain | Reads control-delimited application SSE batches until the expected semantic correlation ID appears. The loop consumes stream records, not lifecycle or health snapshots. |
| `scaffold/probe-app-home.ts` | Retain | After the app endpoint is resolved through the shared Aspire follower, retries the HTTP render contract so first compilation may settle. It asserts HTML/application behavior, not aggregate health. |
| `scaffold/probe-project-boundary-dev.ts` | Retain | Starts a Fresh/Vite child directly and observes its own startup marker, exit status, and HTTP response. The process is not started or managed as an Aspire resource. |
| `scaffold/durable-cli-parity.ts` | Retain | Queries worker executions and saga instances until the invoked application-domain operations appear. Resource URLs are event-resolved before those domain assertions begin. |
| `scaffold/run-documented-stream-example.ts` | Retain | Executes the documented EventSource client and waits for its first application SSE payload; no Aspire command or state is involved. |
| `scaffold/ui-ai-gates.ts` | Retain | Bounds a round trip against an ephemeral in-process `Deno.serve` MCP fixture. It is neither an AppHost resource nor a readiness probe. |

The nearby constants/comments now name those effect boundaries explicitly so later cleanup does not
mistake them for resource-state polling.
