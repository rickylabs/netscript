## feat(telemetry): seam-event flow plane — unified envelope + HTTP boundary events

### Summary
Emit a uniform seam event at each framework boundary a request crosses — HTTP ingress/egress, contract procedure invoke/return, job enqueue/complete, saga transition, stream publish/delivery — onto an owned in-process bus exposed at `/_netscript/flows/subscribe` (SSE), keyed by the stamped `traceparent`.

### Scope
- Envelope (contract-first): `{ flowId (traceparent), seam, primitive, name, phase: start|end|error, payloadRef, attempt?, ts }` — reuses the #402 TC-1..14 attribute vocabulary; no parallel naming.
- Emitters piggyback on the existing lifecycle event points (execution events, saga history, trigger events, stream deliveries) + new HTTP boundary hooks at the router seam.
- Replaces the beta.6 join-layer in `/_netscript/flows` (#423) transparently — same SSE shape, higher fidelity.

### Non-goals
- Not OTLP; not an exporter; never proxied from `/api/telemetry/*` (#413 stays correlation-only). No UI (that's S13/#418). No durable storage beyond a bounded ring buffer (dev-time surface).

### Acceptance criteria
- One scaffold-app HTTP request yields a complete ordered seam-event chain incl. the HTTP boundary; S13 renders it with zero join heuristics.
- `deno check --unstable-kv` green; TC vocabulary lint clean.

### Dependencies
#408 (traceparent stamping), #423 (mount), feeds #418/S13. Co-lands sensibly with `epic:telemetry-revamp`.
