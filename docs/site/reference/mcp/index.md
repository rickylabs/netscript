---
layout: layouts/base.vto
title: '@netscript/mcp'
---

# `@netscript/mcp`

The Model Context Protocol server for NetScript workspaces. This page describes the package's public
surface and is maintained by hand; the authoritative, always-current symbol list is
[`deno doc jsr:@netscript/mcp`](https://jsr.io/@netscript/mcp/doc). For the full index of packages
and plugins return to the [reference overview](/reference/).

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

The tools are `get_app_status`, `list_runs`, `get_run`, `get_recent_errors`, `get_last_job_result`,
`analyze_service_performance`, `analyze_db_bottlenecks`, `doctor`, `search_docs`, `list_docs`,
`get_doc`, `list_commands`, and `execute_command`.

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
`contract`, `service list|status`, `plugin add|list|sync|doctor`, and the `ui` verbs; it **denies**
`deploy`, `init`, `marketplace`, `db reset`, and `plugin remove`.

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
