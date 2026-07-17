# Research — `@netscript/mcp` S3 telemetry tools

Re-baselined 2026-07-12 against mandatory baseline `3870c553`. The branch is clean, `packages/mcp/mod.ts` exists, and S1 contracts/registry/doctor are present.

## Findings

- `deno doc packages/telemetry/query.ts` verifies `createTelemetryQuery(options): TelemetryQueryPort`; the port supplies resources, spans, logs, traces, and trace lookup. Read models are immutable and filters support service/resource, since time, and limit.
- `packages/telemetry/deno.json` publishes `./query` and `./attributes`. S3 can use workspace imports `@netscript/telemetry/query` and `@netscript/telemetry/attributes` without an external dependency.
- Telemetry attributes are centrally exported constants; S3 must never spell `netscript.*` keys locally.
- The Aspire adapter defaults to `http://localhost:18888` and accepts a discovered endpoint. S1 doctor currently owns explicit/env/default selection inside its flow, so S3 must extract one shared pure resolver.
- S1 registry accepts partial flow injection. S3 can bind only four tools while leaving S4+ planned.
- Telemetry server-side filters are deliberately narrow. NetScript domain grouping is client-side application logic, not a duplicate of Aspire raw trace/log tools.
- Current MCP output schemas are intentionally shallow; S3 may tighten only the four owned shapes while retaining bounded arrays.
- The owner-locked package folder shape remains covered by accepted debt `MCP-A6-V2-SHAPE`; S3 adds only role-correct domain/application/infrastructure files and does not deepen that deviation.

## Endpoint discovery evidence

Repository evidence fixes the resolver order: explicit input; `NETSCRIPT_TELEMETRY_ENDPOINT`; `ASPIRE_DASHBOARD_PORT` converted to `http://localhost:<port>`; default `http://localhost:18888`. `ASPIRE_DASHBOARD_URL` is excluded because it has zero occurrences in the tree. Evidence: `packages/cli/src/kernel/adapters/windows/environment/env-file-values.ts:213` emits `ASPIRE_DASHBOARD_PORT`; `packages/telemetry/src/adapters/aspire-query/aspire-telemetry-query.ts:39` establishes the HTTP query default. HTTPS URLs in `generate-aspire-config.ts` belong to launch-profile/resource endpoint surfaces, not the telemetry query API. A probe may try the HTTPS form after an HTTP connection failure and doctor reports the scheme that succeeded. Empty/invalid candidates are ignored; infrastructure alone reads `Deno.env`.

Stream semantic constants are currently exported by `packages/plugin-streams-core/src/telemetry/attributes.ts`, not `@netscript/telemetry`. Importing that plugin package would invert layering. Domain classification therefore uses one MCP-owned stable namespace-prefix table; specific value reads continue to use telemetry constants where exported.

## Planned JSR Surface Scan

- No new package export is required; `mod.ts` remains the public library entry and `cli.ts` the executable entry.
- Workspace imports are declared in `packages/mcp/deno.json`; no catalog or lock deletion/reload.
- Exported declarations receive explicit types/JSDoc; full-export doc lint and package dry-run remain required.
- Tests remain excluded from publish output. No new permissions beyond existing env/net are introduced.

## Open Questions

None that force rework. Unavailable telemetry returns empty semantic summaries consistent with the upstream adapter.
