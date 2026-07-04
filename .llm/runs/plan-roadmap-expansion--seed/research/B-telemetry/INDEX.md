# Topic B (telemetry) — research (B3)

External state-of-the-art research feeding the telemetry-revamp design. Read-only findings, no
recommendations picked (per the topic mandate — flow/milestone choice is delegated to the supervisor).

| File | Covers |
|---|---|
| `otel-semconv-w3c-state-of-art.md` | OTel semantic-conventions stability tiers (messaging/RPC/GenAI), W3C Trace Context + Baggage standardization levels, span-links spec for fan-in/messaging, cross-process/subprocess propagation (env-var carrier spec), Deno's native OTel support + its "links without attributes" limitation, OTLP export spec. Research tasks (3) from the topic spec. |
| `aspire-otlp-ingestion-and-query-api-landscape.md` | Aspire dashboard OTLP ingestion + `/api/telemetry/*` HTTP query API (ports, auth, retention), NetScript's own existing reference code that already consumes this API, comparable query surfaces (Jaeger api_v3, SigNoz Query Service, Encore dashboard). Research tasks (5) and (6) from the topic spec. |

See `matrix/B-telemetry/INDEX.md` for a one-line verdict per individual external resource cited within
these two files.
