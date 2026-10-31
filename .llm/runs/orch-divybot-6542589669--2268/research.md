# Research

Current main includes #2515's one-stream process adapter. Existing MCP composition binds Aspire ps to the project AppHost for discovery, but the telemetry read path normalizes the dashboard URL to its origin, loses login authentication, falls back to a conventional dashboard, and the shared query adapter swallows all failures as empty arrays. Empty service performance reports numeric zero latency. Service/time provenance is not present across the three tools.

Invoked in-repo MCP over stdio in order: find_guidance with intent "bind MCP performance and app status telemetry to the live Aspire AppHost using supported dashboard trace queries", then search_docs "Aspire telemetry traces metrics". Guidance points to the MCP reference/tool catalog and observability explanation. Inspected TelemetryQueryPort through deno doc. Prior run memory confirms RTK absence, structured-wrapper recipes, and Claude null-stdin/resume launch.

Primary upstream sources checked against Aspire v13.5.3:
- https://aspire.dev/dashboard/apis/ — supported resource/log/span/trace read API; native metrics have no listed query endpoint.
- https://github.com/microsoft/aspire/blob/v13.5.3/src/Aspire.Cli/Commands/TelemetryCommandHelpers.cs — --apphost retrieves DashboardInfoV2 (API URL + token); --dashboard-url accepts a login URL and exchanges its token for an API key.
- https://github.com/microsoft/aspire/blob/v13.5.3/src/Aspire.Dashboard/DashboardEndpointsBuilder.cs — supported OTLP response envelopes and validateToken exchange. API snapshot does not expose a since timestamp parameter.
- Local aspire otel spans/traces --help confirms apphost, dashboard-url, JSON, limit and non-interactive options.

Use packages/mcp's existing executeAspireCliCommand seam, one snapshot per requested kind (spans; logs for status). No autonomous timer or poll. Normalize supported OTLP with the shared @netscript/telemetry/query reader using an in-memory response, rather than duplicating OTLP parsing. Filter time/service locally because the dashboard snapshot does not support since. Infer telemetry emitter resources from OTLP resource attributes retained by the shared normalizer. App status retains plugin doctor health and distinguishes emitter counts from runtime declarations.

Doctrine: archetype 2 integration inside archetype 6 tooling package, existing composition/flow pattern. Read axioms, public-surface, module/adapter and layering guidance; use a consumed snapshot port and named adapter. No new dependencies or root export are needed. Existing query adapter remains for other flows; the three assigned tools use the new strict snapshot path.
