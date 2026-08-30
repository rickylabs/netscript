# Changelog

## 0.0.7

- `agent init` now installs canonical cross-host skills and project guidance together with an
  updated tool bundle that writes atomic reports, surfaces silent check failures, audits public API
  quality, verifies `quality-allow` owners against GitHub (the bundle declares environment and
  network permissions, but environment access is optional and network access is used only when
  resolving a `quality-allow` issue), honors subtree/config lint exclusions, and fails closed when
  Deno processes fewer files than selected.
- Generated workspace `check`, `lint`, and `fmt-check` flows accept `--skip-apphost` so project-only
  quality runs can omit AppHost sources.
- `plugin auth session list` requires an explicit `--stream-url` instead of assuming the legacy
  localhost endpoint and explains how to discover the Aspire streams endpoint.
- Database scaffolds emit only the selected provider's connection helpers, use generated Prisma
  clients in seeds, and project missing rows as defined 404 responses.
- Generated design registries include the complete component manifest and collection membership
  instead of a partial catalog.
- Generated Aspire background registration fails before processor startup when a declared service
  or plugin reference has no resolvable HTTP endpoint.
- The Prisma MySQL adapter exposes the connected adapter contract and classified connection-error
  hook, ships an executable Prisma 7/mysql2 example, stops root-exporting the legacy
  `DenoMySqlClient`, `DenoMySqlConnection`, and `ExecuteResult` types, narrows result column types,
  and deprecates the misleading `verify_identity` TLS selector without changing its legacy runtime
  behavior.
- AI MCP pools isolate per-server startup/stop failures, expose synchronous per-server status and
  ready clients, and propagate cancellation through resource reads, registration discovery, and
  shutdown.
- AI requests can carry application context into tool handlers without forwarding it to providers,
  and request cancellation now reaches tool dispatch.
- SDK cache queries return fetched data when persistence fails, bound telemetry namespace
  cardinality, retain incomplete-topology evidence, honor fresh cached entries under stale-only
  refresh policy, and deduplicate background refresh persistence.
- SDK service clients preserve exact contract errors through `safe()` and `isDefinedError`;
  failures now carry `undefined` rather than `null`, `SafeFailure` splits into literal defined and
  non-defined arms, default `TError` changes from `unknown` to `Error`, `safe()` no longer accepts
  non-Promise thenables, and `baseContract` rejects error codes outside its six declared literals
  (`NOT_FOUND`, `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `RATE_LIMITED`, and
  `SERVICE_UNAVAILABLE`).

## 0.0.6

- `plugin doctor` now treats package-backed plugins as in-process package installations instead of
  requiring conventional local plugin directories.
- Published plugin manifest permissions now contribute to generated service runtime permissions;
  explicit appsettings and contribution-specific permissions retain precedence.
- `plugin list` renders package-backed sources as `package:<configured-specifier>` rather than
  implying or omitting a local workdir.
