# @netscript/mcp

`@netscript/mcp` is the token-bounded MCP engine for NetScript diagnostics, framework-aware
telemetry summaries, public documentation, and controlled CLI actions. Its 13 tools share the same
vocabulary as the NetScript CLI and installed agent skills.

## Public API

- `createToolRegistry()` returns immutable enumerable tool definitions.
- `createMcpServer()` composes the protocol runner with truncation defaults.
- `runMcpStdioServer()` runs the newline-delimited JSON-RPC stdio transport.
- Standard-Schema input and output contracts are exported for every tool.
- `createMcpCliServer()` composes the executable server with replaceable CLI, project-doctor, docs,
  telemetry, and command-policy seams.

```ts
import { createToolRegistry } from '@netscript/mcp';

for (const tool of createToolRegistry()) console.log(tool.name, tool.kind);
```

Prefer the CLI for direct scripted operations. Use MCP for compact interactive diagnostics and
framework-semantic summaries.

## Tool catalog

| Tool                          | Bounded result                                                  |
| ----------------------------- | --------------------------------------------------------------- |
| `get_app_status`              | Overall health, counts, and runtime-domain summaries            |
| `list_runs`                   | Recent filtered execution summaries                             |
| `get_run`                     | One correlated execution with bounded spans and logs            |
| `get_recent_errors`           | Recent errors grouped by service and domain                     |
| `get_last_job_result`         | The latest matching job outcome                                 |
| `analyze_service_performance` | Duration percentiles, throughput, and error rate                |
| `analyze_db_bottlenecks`      | Ranked database and KV operations                               |
| `doctor`                      | Telemetry, Aspire, wiring, and plugin checks with fixes         |
| `search_docs`                 | Ranked public-document matches and snippets                     |
| `list_docs`                   | Public-document summaries                                       |
| `get_doc`                     | One public document or named section                            |
| `list_commands`               | Current CLI command descriptors from an injected catalog        |
| `execute_command`             | Policy-gated execution with exit status and bounded output tail |

The documentation tools form a search-to-get funnel: locate a slug with `search_docs`, then retrieve
only the needed document or section with `get_doc`. Limits and server-side truncation keep results
bounded.

## Executable composition

The `@netscript/mcp/cli` export provides `createMcpCliServer()`, `runMcpStdioServer()`, and
`resolveDocsRoot()`. `McpCliOptions` accepts these outer composition seams:

| Seam                  | Purpose                                                       |
| --------------------- | ------------------------------------------------------------- |
| `CommandCatalogPort`  | Supplies the live CLI command tree to `list_commands`         |
| `CommandExecutorPort` | Runs an allowed command and returns structured process data   |
| `CommandPolicy`       | Defines ordered allow and deny prefixes for `execute_command` |
| `ProjectDoctorPort`   | Supplies typed project and plugin diagnostics                 |
| `docsRoot`            | Selects the public Markdown corpus                            |
| `endpoint`            | Overrides telemetry endpoint discovery                        |

The public CLI composition injects the real command catalog and project doctor while preserving
package direction: MCP does not import the CLI package.

## Telemetry endpoint discovery

Telemetry tools and `doctor` share one discovery policy:

1. an explicit `endpoint` option (the CLI exposes it as `--endpoint`);
2. `NETSCRIPT_TELEMETRY_ENDPOINT`;
3. `ASPIRE_DASHBOARD_PORT`, converted to a local HTTP endpoint with an HTTPS fallback;
4. `http://localhost:18888`.

Only valid HTTP or HTTPS endpoints are accepted. An unreachable endpoint produces a structured
warning or failure result rather than crashing the server.

## Doctor composition

`doctor` aggregates telemetry reachability, NetScript Aspire markers, project wiring, and plugin
diagnostics. Plugin diagnostics are dependency-inverted: MCP does not import or duplicate
`@netscript/cli`; the CLI composition supplies its typed plugin-doctor adapter. The standalone
plugin family returns a visible warning rather than claiming success.

## Data boundary and command policy

The server may read telemetry, NetScript project metadata, generated registries, and public
documentation. It never returns project source code, environment-variable values, credentials, or
secrets. Stdio is process-local; outbound telemetry probes use the resolved endpoint only.

`execute_command` is default-deny. Explicit rules allow selected database, generation, contract,
service-read, plugin, and UI command paths. Deny rules take precedence and block deployment, project
initialization, marketplace operations, database reset, and plugin removal. Unmatched paths return
`command_denied` before the executor is called.

## Required permissions

The executable needs environment access to resolve telemetry settings, network access to query and
probe the selected HTTP endpoint, read access for project metadata and docs, and run access only
when `execute_command` is enabled with a process executor. The public CLI binary grants these at its
edge. Embedders should grant only the capabilities used by their selected adapters.

## Transport

The stdio transport is UTF-8 newline-delimited JSON-RPC and implements `initialize`, `tools/list`,
and `tools/call`. It intentionally uses a minimal zero-dependency transport instead of the npm MCP
SDK, keeping the published graph and lockfile stable.

## Archetype 6 v2 deviations

The owner-approved package skeleton uses the horizontal
`domain → application → presentation/infrastructure` layout from the package design instead of the
newer kernel/vertical CLI feature tree. The package has no Cliffy command tree, templates, output
renderer, extension axes, or public/maintainer split, so creating those seams would be speculative.
Debt `MCP-A6-V2-SHAPE` requires reassessment when those concerns emerge.
