---
layout: layouts/base.vto
title: '@netscript/mcp'
templateEngine: [vento, md]
---

# `@netscript/mcp`

The Model Context Protocol server for NetScript workspaces. This page describes the package's public
surface and is maintained by hand; the authoritative, always-current symbol list is
[`deno doc jsr:@netscript/mcp{{ releaseSpecifier }}`](https://jsr.io/@netscript/mcp/doc). For the
full index of packages and plugins return to the [reference overview](/reference/).

`@netscript/mcp` publishes 13 token-bounded MCP tools that let a coding agent monitor a running app,
debug a correlated execution, read framework-semantic telemetry, run the doctor, search the public
documentation, and trigger allowlisted CLI commands — over newline-delimited JSON-RPC on stdio, with
no npm MCP SDK on the dependency graph.

Most consumers never import this package: `netscript agent init` installs it as an MCP server and
`netscript agent mcp` runs it. See [Agent tooling](/capabilities/agent-tooling/) for the CLI ×
skills × MCP combo, and the package README for the mental model and recipes.

Two entrypoints carry the surface:

- `@netscript/mcp` — tool contracts, the registry, the protocol runner, ports, and default adapters.
- [`@netscript/mcp/cli`](#sub-path-exports) — the executable composition that binds the real
  telemetry, docs, doctor, and process adapters.

## Server composition

| Symbol                 | Kind      | Summary                                                                        |
| ---------------------- | --------- | ------------------------------------------------------------------------------ |
| `createMcpServer`      | function  | Create the MCP server with `initialize` / `tools/list` / `tools/call` support. |
| `createToolRegistry`   | function  | Immutable, enumerable definitions of the 13 tools.                             |
| `McpServer`            | interface | Callable server subset: `handle(message)` plus the registered `tools`.         |
| `McpServerOptions`     | interface | Composition seams: `probe`, `environment`, `flows`, `truncation`.              |
| `MCP_PROTOCOL_VERSION` | const     | The MCP protocol version the runner implements (`2025-11-25`).                 |

## Tool contracts

| Symbol                | Kind      | Summary                                                    |
| --------------------- | --------- | ---------------------------------------------------------- |
| `TOOL_NAMES`          | const     | The 13 tool names, in registry order.                      |
| `TOOL_INPUT_SCHEMAS`  | const     | Standard Schema input contract per tool.                   |
| `TOOL_OUTPUT_SCHEMAS` | const     | Standard Schema output contract per tool.                  |
| `validateSchema`      | function  | Validate a value against a tool schema, throwing on drift. |
| `ToolDefinition`      | interface | A tool's name, contracts, and flow.                        |
| `ToolFlow`            | type      | The function a tool executes; depends only on ports.       |
| `ToolName`            | type      | Union of the 13 tool names.                                |

### Per-tool field overview

The table below is a **top-level field overview** — input names and result field names per tool,
taken from the live `tools/list`. It is not the complete contract: types, enum values, numeric
bounds, array maxima, nested shapes, and required-vs-optional result fields live in the published
Standard Schema contracts (`TOOL_INPUT_SCHEMAS` / `TOOL_OUTPUT_SCHEMAS`), which every `tools/list`
response returns in full. **Bold** inputs are required; every other input is optional. Every `limit`
input caps the result count server-side before truncation applies.

| Tool                          | Inputs                                                | Result fields                                                                                                                                                     |
| ----------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `get_app_status`              | `service`, `limit`                                    | `status`, `counts`, `domains`                                                                                                                                     |
| `list_runs`                   | `domain`, `status`, `service`, `sinceUnixMs`, `limit` | `count`, `runs`                                                                                                                                                   |
| `get_run`                     | **`id`**                                              | `id`, `summary`, `traceId`, `outcome`, `errorMessage`, `spans`, `logs`                                                                                            |
| `get_recent_errors`           | `service`, `domain`, `sinceUnixMs`, `limit`           | `count`, `groups`                                                                                                                                                 |
| `get_last_job_result`         | `jobId`, `jobName`, `service`, `sinceUnixMs`          | `found`, `jobName`, `jobId`, `status`, `outcome`, `exitCode`, `startUnixMs`, `completedUnixMs`, `durationMs`, `errorMessage`, `traceId`                           |
| `analyze_service_performance` | **`service`**, `sinceUnixMs`, `limit`                 | `service`, `sinceUnixMs`, `sampleCount`, `errorCount`, `errorRate`, `averageDurationMs`, `p50DurationMs`, `p95DurationMs`, `throughputPerMinute`, `topOperations` |
| `analyze_db_bottlenecks`      | `service`, `sinceUnixMs`, `limit`                     | `sinceUnixMs`, `sampleCount`, `operations`                                                                                                                        |
| `doctor`                      | `endpoint`                                            | `status`, `endpoint`, `counts`, `checks`, `families`                                                                                                              |
| `search_docs`                 | **`query`**, `limit`                                  | `count`, `matches`                                                                                                                                                |
| `list_docs`                   | `limit`                                               | `count`, `docs`                                                                                                                                                   |
| `get_doc`                     | **`slug`**, `section`                                 | `slug`, `title`, `section`, `content`                                                                                                                             |
| `list_commands`               | `filter`, `limit`                                     | `count`, `commands`                                                                                                                                               |
| `execute_command`             | **`command`**, `args`                                 | `exitCode`, `durationMs`, `outputTail`, `truncated`, `timedOut`                                                                                                   |

**Truncation semantics.** After a flow succeeds, `truncateResult` recursively bounds the result
using `DEFAULT_TRUNCATION_POLICY` — arrays are capped at 50 elements and strings at 2,000 UTF-16
code units — before the runner serializes it. The analytics tools (`analyze_service_performance`,
`analyze_db_bottlenecks`) additionally never return raw spans: their results are computed
aggregates. `execute_command` returns only a bounded combined output tail (4,096 bytes by default)
and flags `truncated` when output was cut. A failed flow returns a structured tool error (a stable
`code` plus a message), not a truncated success.

## Output bounds

Every successful result is bounded server-side before the runner serializes it, so a tool can never
flood the model's context.

| Symbol                      | Kind      | Summary                                                                 |
| --------------------------- | --------- | ----------------------------------------------------------------------- |
| `truncateResult`            | function  | Recursively bound arrays and strings in a JSON-compatible result.       |
| `DEFAULT_TRUNCATION_POLICY` | const     | The default bounds: 50 array items, 2,000 UTF-16 code units per string. |
| `TruncationPolicy`          | interface | `maxItems` and `maxStringLength`.                                       |

## Command policy

`execute_command` is **default-deny**: a normalized command path must match an allow rule and no
deny rule. Deny beats allow; anything unmatched is denied.

| Symbol                   | Kind      | Summary                                                          |
| ------------------------ | --------- | ---------------------------------------------------------------- |
| `decideCommand`          | function  | Decide whether a normalized command path is allowed by a policy. |
| `DEFAULT_COMMAND_POLICY` | const     | Conservative allowlist shipped with the server.                  |
| `CommandPolicy`          | interface | Ordered `allow` / `deny` prefix rules.                           |
| `CommandPolicyDecision`  | type      | The decision returned for a command path.                        |

The default policy **allows** `db init|generate|migrate|seed|status|introspect`, `generate`,
`contract`, `service list`, `plugin install|list|sync|doctor`, and
`ui:add|ui:init|ui:list|ui:update`; it **denies** `deploy`, `init`, `marketplace`, `db reset`,
`plugin remove`, and `ui:remove`.

## Ports

Every tool flow depends on a port, never on a concrete client — which is why this package can report
on the CLI without depending on it. `@netscript/cli` implements the ports and injects them at its
own composition root.

| Symbol                | Kind      | Summary                                                     |
| --------------------- | --------- | ----------------------------------------------------------- |
| `TelemetryProbePort`  | interface | Telemetry endpoint reachability check.                      |
| `DocsCorpusPort`      | interface | Public Markdown corpus: search, list, get.                  |
| `CommandCatalogPort`  | interface | Supplies the live CLI command tree to `list_commands`.      |
| `CommandExecutorPort` | interface | Runs an allowed command, returning structured process data. |
| `ProjectDoctorPort`   | interface | Typed project and plugin diagnostics.                       |
| `DoctorCheckFamily`   | interface | One group of doctor checks aggregated into the verdict.     |

## Default adapters

| Symbol                 | Kind     | Summary                                                            |
| ---------------------- | -------- | ------------------------------------------------------------------ |
| `FilesystemDocsCorpus` | class    | `DocsCorpusPort` over a local Markdown root (default `docs/site`). |
| `SpawnCommandExecutor` | class    | `CommandExecutorPort` that spawns the `netscript` binary.          |
| `StaticCommandCatalog` | class    | `CommandCatalogPort` used when no live catalog is injected.        |
| `PluginDoctorFamily`   | class    | Plugin diagnostics as a doctor check family.                       |
| `slugifyDocsHeading`   | function | Normalize a Markdown heading into a `get_doc` section slug.        |

## Sub-path exports

### `@netscript/mcp/cli`

The executable composition. It binds the real telemetry query, filesystem docs corpus, Aspire /
project-wiring / plugin doctor families, and the process executor, and runs them over stdio.

| Symbol               | Kind      | Summary                                                                                                       |
| -------------------- | --------- | ------------------------------------------------------------------------------------------------------------- |
| `runMcpStdioServer`  | function  | Run the server on Deno standard input and output.                                                             |
| `createMcpCliServer` | function  | Compose the server with optional outer CLI adapters.                                                          |
| `resolveDocsRoot`    | function  | Resolve the docs root from `--docs-root`, `NETSCRIPT_DOCS_ROOT`, or the project root.                         |
| `McpCliOptions`      | interface | `commandCatalog`, `commandExecutor`, `commandPolicy`, `projectDoctor`, `projectRoot`, `docsRoot`, `endpoint`. |

Telemetry endpoint discovery is ordered: an explicit `endpoint` option, then
`NETSCRIPT_TELEMETRY_ENDPOINT`, then `ASPIRE_DASHBOARD_PORT`, then `http://localhost:18888`. Only
`http:` and `https:` endpoints are accepted, and an unreachable endpoint yields a structured warning
rather than a crash.

## Data boundary

The server reads telemetry, project metadata, generated registries, and public documentation. It
never returns project source, environment-variable values, credentials, or secrets. Stdio is
process-local; the only outbound traffic is the telemetry probe to the resolved endpoint.

---

Back to the [reference overview](/reference/).
