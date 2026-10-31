# Research — 2026-10-30

Baseline is current main `30c800958dbf512a4951d640f08748703a8b59e3`. No triage comment or covering PR exists. NetScript MCP find_guidance and search_docs consulted; neither supplies a test-lock recipe. Prior committed memory confirms RTK is absent and explicit --lock matters.

`deps:latest --filter '@opentelemetry/*'` reports API 1.10.0 (catalog ^1.9.1). `deps:latest --filter '@orpc/otel'` reports 1.16.1 (catalog ^1.15.5). No other dependency updates are authorized. `deps:why` identifies telemetry/tracing-plugin.ts as oRPC's consumer and 38 API source references; its native graph output is empty and is not proof of absence. Committed lock records API 1.9.1, instrumentation 0.223.0 and oRPC OTel 1.15.5. Cached upstream manifests confirm oRPC's instrumentation peer is >=0.203.0; instrumentation 0.300 requires API >=1.10 <1.11 and imports logs from that API. Instrumentation 0.223 accepts ^1.3.0, compatible with API 1.10.0.

Saga provider fixture builds a flattened import map and runs --no-lock; three provider tests share it. Three database command fixtures independently write temporary Deno configs and use --no-lock. Database command source imports are already rewritten to file URLs. Preserve that pattern and use native Deno's frozen lock for external dependency resolution. Audit remaining temporary config writers and classify synthetic/config-parser fixtures separately from resolving consumer tests.

Published surface scan: telemetry metadata/exports already present; only dependency catalog changes planned, no new public declarations/slow types. Existing test support belongs under .llm/tools/testing and is not published. Refresh only dependency locks required by API change, inspect exact package-version deltas, and run publish dry-run.
