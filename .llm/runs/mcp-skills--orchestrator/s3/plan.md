# Plan: `@netscript/mcp` S3 telemetry adapters and monitoring tools

## Metadata

| Field | Value |
| --- | --- |
| Run | `mcp-skills--orchestrator/s3` |
| Branch | `feat/netscript-mcp-skills-s3-telemetry` |
| Target | `packages/mcp` |
| Archetype | `6 — CLI / Tooling` |
| Overlays | none |

## Goal and Scope

Implement endpoint discovery and four bounded NetScript-semantic telemetry tools: `get_app_status`, `list_runs`, `get_run`, and `get_recent_errors`.

Deferred: S4 analytics, docs tools, CLI triggers, generic raw trace/log listing, scaffold changes, and PR creation.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Consume `TelemetryQueryPort` and `createTelemetryQuery` from `@netscript/telemetry/query` | Reuses the package-owned port and Aspire adapter. |
| D2 | Specific attribute value reads import constants from `@netscript/telemetry/attributes` where exported; domain classification alone uses one documented MCP-owned namespace-prefix table | Prevents plugin-layer dependency inversion while keeping value semantics typed. |
| D3 | One pure resolver shared by doctor/query composition, ordered explicit → `NETSCRIPT_TELEMETRY_ENDPOINT` → `http://localhost:<ASPIRE_DASHBOARD_PORT>` → `http://localhost:18888`; no `ASPIRE_DASHBOARD_URL`/`ASPNETCORE_URLS` arm | `env-file-values.ts:213` emits the port and `aspire-telemetry-query.ts:39` establishes HTTP query semantics. Infrastructure may probe HTTPS only after HTTP connection failure and doctor reports the successful scheme. |
| D4 | Pure aggregation owns identity precedence `execution → job → saga instance → trigger` and domain precedence `saga → trigger → worker → stream → service`; one table maps job/saga/trigger/stream/worker/SSE to stable prefixes `netscript.job.`, `netscript.saga.`, `netscript.trigger.`, `netscript.stream.`, `netscript.worker.`, `netscript.sse.` | Makes multi-tag spans deterministic without importing plugin-streams-core. SSE classifies as stream. |
| D5 | Flows query bounded upstream windows, then return compact typed summaries | Preserves token discipline and avoids raw Aspire semantics. |
| D6 | `get_run` locates a matching identity span, fetches/assembles its trace, bounds tree depth/count, and correlates bounded logs by trace ID | Gives end-to-end semantic context without dumping telemetry. |
| D7 | Error logs are severity-matched case-insensitively; error spans use statusCode 2 | Uses the read-model contracts without inventing backend-specific codes. |
| D8 | Preserve S1 horizontal package shape under existing accepted debt | S3 is additive and does not broaden structural scope. |
| D9 | App status is `fail` when any recent span has status 2 or any recent error-severity log exists; otherwise `warn` when resources are empty or recent spans are empty; otherwise `pass` | Makes empty/disconnected telemetry distinguishable from observed healthy activity. Domain rollups include zero-count domains for stable output. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Endpoint alias order/scheme | resolved now | Exact D3 order; empty/invalid values ignored; optional HTTPS is probe fallback only. |
| Missing telemetry behavior | resolved now | Successful empty bounded summary; adapter already degrades connectivity failures. |
| Identity/domain precedence | resolved now | Exact D4 precedence and prefix table; service is fallback. |
| Overall app status | resolved now | Exact D9 thresholds. |
| S4 metrics/analytics | safe to defer | Explicitly outside S3. |

## Commit Slices

1. Endpoint/query composition — proves shared precedence and workspace adapter wiring; modifies `packages/mcp/deno.json`, `packages/mcp/src/application/flows/doctor-flow.ts`, `packages/mcp/src/application/runner/mcp-server.ts`, `packages/mcp/cli.ts`; creates `packages/mcp/src/domain/telemetry-endpoint.ts`, `packages/mcp/src/infrastructure/telemetry-query-adapter.ts`, `packages/mcp/tests/telemetry-endpoint_test.ts`; updates all S3 run artifacts. Gate: endpoint tests + scoped check.
2. Semantic aggregation and four flows — proves grouping/filtering/tree/error behavior and bounds; creates `packages/mcp/src/domain/telemetry-summaries.ts`, `packages/mcp/src/application/telemetry-aggregation.ts`, `packages/mcp/src/application/flows/get-app-status-flow.ts`, `packages/mcp/src/application/flows/list-runs-flow.ts`, `packages/mcp/src/application/flows/get-run-flow.ts`, `packages/mcp/src/application/flows/get-recent-errors-flow.ts`, `packages/mcp/tests/telemetry-fixtures.ts`, `packages/mcp/tests/telemetry-aggregation_test.ts`, `packages/mcp/tests/telemetry-flows_test.ts`; modifies `packages/mcp/src/domain/tool-contracts.ts`, `packages/mcp/src/application/runner/mcp-server.ts`, `packages/mcp/cli.ts`; updates all S3 run artifacts. Gate: fixture tests + all MCP tests.
3. Merge-readiness evidence — proves wrapper check/lint/fmt, tests, architecture, doc lint, and publish dry-run; changes run artifacts only except diagnostic corrections confined to Slice 1–2 files. Scope expansion requires rescope.

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Prefix table drifts from instrumentation | Keep exactly one documented table; direct tests cover all six prefixes; drift records plugin stream ownership for later migration. |
| Service name is absent on spans/logs | Resolve from standard resource/service attributes when exported; otherwise bounded `unknown`. |
| Multiple run IDs on one span | Fixed identity precedence and direct tests. |
| Tree cycles/orphans | Visited set, bounded depth/count, deterministic root/orphan ordering. |
| Query result limits hide a match | Use bounded over-fetch constants and communicate `found: false`; never unbounded queries. |
| Sibling overlap in `cli.ts`/contracts | Minimal additive edits only. |

## Gates and Debt

Required universal evidence: F-1 through F-12 and F-15 through F-19 via scoped wrappers, `deno task arch:check`, doc lint, publish dry-run, and manual inspection where the fitness script reports pending; F-13/F-14 are N/A or CLI-output scoped as defined by the matrix. All F-CLI-1 through F-CLI-31 are reported individually as `PASS`, `N/A`, or `PENDING_SCRIPT` with manual structural evidence under accepted `MCP-A6-V2-SHAPE`; debt does not waive reporting. Consumer smoke is `deno eval --no-lock 'import { createMcpServer } from "./packages/mcp/mod.ts"; const probe={probe:()=>Promise.resolve({reachable:true,message:"ok"})}; const server=createMcpServer({probe}); if(server.tools.length!==13) throw new Error("tool count"); console.log("tools=13")'`, requiring exit 0 and `tools=13`. Existing debt remains accepted; no new debt expected.

Anti-pattern focus: AP-1/AP-21 monoliths, AP-2/AP-22 speculative seams/barrels, AP-11/AP-25 effects outside infrastructure, AP-19 permission drift, and hardcoded telemetry vocabulary.
