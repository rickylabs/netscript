# Live telemetry acceptance fixture

Aspire 13.5.3 aspire-ts-empty creates apphost.mts and apphost.run.json; first start migrates launch configuration to aspire.config.json. Modify the migrated config for subsequent starts. A manual HTTP/JSON OTLP emitter needs a configured HTTPS ASPIRE_DASHBOARD_OTLP_HTTP_ENDPOINT_URL and matching exporter endpoint/protocol; the empty template initially configures only gRPC. Preserve exporter API-key headers and TLS verification.

A small Deno executable with a health endpoint, in-memory KV reads and manual OTLP spans is sufficient to verify a real AppHost/dashboard without Docker or the expensive scaffold.runtime suite. Bind through the project root, compare complete trace ID sets against CLI results filtered to the same timestamps, and assert actual login/API credentials are absent from tool envelopes. Reuse the reader after exact-AppHost stop to prove failed discovery is not cached.

Keep fixture paths, allocated endpoint values and credential-bearing logs outside Git. Publish only sanitized counts/verdicts and hashes. Declare --owned-root on leak checks for a fixture outside the worktree; report unknown resources without mutating them. No container was used by this fixture.
