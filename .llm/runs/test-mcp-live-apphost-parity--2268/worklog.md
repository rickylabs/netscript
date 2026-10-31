# Worklog

## Design

1. Public surface: reusable live verification command plus safe JSON evidence.
2. Vocabulary: expected RPC traces, observed MCP/CLI identities, exact project
   binding, nonempty parity, actionable wrong binding, safe evidence.
3. Ports: existing AspireTelemetrySnapshot, native CLI executor, createMcpCliServer;
   injected snapshot/CLI acquisition only in focused comparator tests.
4. Constants: bounded RPC request count, telemetry acquisition deadline, resource
   identity from generated service; no hardcoded dashboard or service endpoint.
5. Slices: S0 plan/draft; S1 verifier/test/real producer and proof; S2 review/evidence.
6. Deferred: production behavior redesign, local full scaffold.runtime, other cells.
7. Contributor path: .llm/tools/e2e verifier and colocated comparison tests.

## Intake

Prior PR 2530 confirmed MERGED. Current main cecf776. Live tracker/issue comments
and open PR search confirm no competing 2268 live-proof claim. Claim posted to
2474 and 2268. Matrix resolved; owner Opus 5.5/high override retained. Read memory
from the previous leaf. RTK remains absent. Dotnet shim repaired only by task-scoped
SDK selection, not global configuration. Native Aspire doctor has no failed checks.
Initial netscript-dev init rejected the public-only --no-agent flag; retry uses
that maintainer command's supported options. No framework code edited yet.
