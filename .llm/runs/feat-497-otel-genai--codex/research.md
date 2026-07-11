# Research

- Issue #497 acceptance requires chat and tool spans with real provider token usage, with no OTel dependency in `@netscript/ai`.
- `packages/ai/src/agent/loop.ts` already drives the injected `TelemetryPort`: it starts run and turn chat spans, records `gen_ai.tool.call`, and applies provider-reported usage to both turn and aggregate run spans.
- The adapter can remain wholly in `@netscript/telemetry` and depend only on the AI port's public type surface.
- Telemetry's existing OTel adapter uses `@opentelemetry/api`; the package maps that dependency through the workspace catalog.
- The workspace lock pins `@opentelemetry/semantic-conventions` 1.41.1. GenAI constants are exported from its `incubating` subpath as `ATTR_GEN_AI_*`.
- Beta.7's SDK loader uses computed dynamic specifiers to keep optional, unmapped SDK modules outside the JSR graph. This slice will use statically mapped imports only.

