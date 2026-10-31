---
layout: layouts/base.vto
title: '@netscript/mcp'
templateEngine: [vento, md]
---

# `@netscript/mcp`

The Model Context Protocol server for NetScript workspaces. It publishes 26 token-bounded MCP tools
that let a coding agent monitor a running app, debug a correlated execution, read telemetry, run the
doctor, search the documentation, discover package exports inspect UI registries and trigger allowlisted CLI commands,
over newline-delimited JSON-RPC on stdio, with no npm MCP SDK in the dependency graph.

Most consumers never import this package: `netscript agent init` installs it as an MCP server and
`netscript agent mcp` runs it. See [Agent tooling](/ai/agent-tooling/) for how the CLI, skills and
MCP fit together. The complete symbol list is in
[`deno doc jsr:@netscript/mcp{{ releaseSpecifier }}`](https://jsr.io/@netscript/mcp/doc).

## Sub-path exports

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| `@netscript/mcp` | `./mod.ts` | [Tool contracts](#tool-contracts), the registry, the protocol runner, [ports](#ports) and [default adapters](#default-adapters). |
| `@netscript/mcp/docs` | `./docs.ts` | Complete shared release Markdown pages, integrity-checked decoding, and derived full-corpus composition. |
| `@netscript/mcp/cli` | `./cli.ts` | [Executable composition](#netscriptmcpcli) that binds the real telemetry, docs, doctor and process adapters. |
| `@netscript/mcp/openapi-projection` | `./openapi-projection.ts` | OpenAPI operation projection used by the API introspection tools. |

> [!TIP]
> Before unfamiliar NetScript API or architecture work, call `find_guidance` with the task and follow
> its ordered citations. Use `search_docs` for literal lookup and `get_doc` for exact retrieval of a known document or
> section; check `mode` and pass `full: true` with `nextCursor` for the complete text.

## Server composition

| Symbol | Kind | Description |
| --- | --- | --- |
| `createMcpServer` | function | Create the MCP server with `initialize` / `tools/list` / `tools/call` support. |
| `createToolRegistry` | function | Immutable, enumerable definitions of the 26 tools. |
| `McpServer` | interface | Callable server subset: `handle(message)` plus the registered `tools`. |
| `McpServerOptions` | interface | Composition seams: `probe`, `environment`, `flows`, `truncation`. |
| `MCP_PROTOCOL_VERSION` | const | The MCP protocol version the runner implements (`2025-11-25`). |

## Tool contracts

| Symbol | Kind | Description |
| --- | --- | --- |
| `TOOL_NAMES` | const | The 26 tool names, in registry order. |
| `TOOL_INPUT_SCHEMAS` | const | Standard Schema input contract per tool. |
| `TOOL_OUTPUT_SCHEMAS` | const | Standard Schema output contract per tool. |
| `validateSchema` | function | Validate a value against a tool schema, throwing on drift. |
| `ToolDefinition` | interface | A tool's name, contracts, and flow. |
| `ToolFlow` | type alias | The function a tool executes; depends only on ports. |
| `TelemetryProvenance` | interface | Window, sample counts, serving version, observed revisions and snapshot completeness carried by telemetry results and errors. |
| `ToolName` | type alias | Union of the 26 tool names. |

### Per-tool field overview

Input names and result field names per tool, from the live `tools/list`. **Bold** inputs are
required; every other input is optional. Every `limit` input caps the result count server-side
before truncation applies. Types, enum values, numeric bounds, array maxima, nested shapes and
required result fields are in the Standard Schema contracts (`TOOL_INPUT_SCHEMAS` /
`TOOL_OUTPUT_SCHEMAS`), which every `tools/list` response returns in full.

| Tool                          | Inputs                                                | Result fields                                                                                                                                                     |
| ----------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `get_app_status`              | `service`, `sinceUnixMs`, `limit` | `status`, `counts`, `domains`, `provenance`, optional `diagnostic` |
| `list_runs`                   | `domain`, `status`, `service`, `sinceUnixMs`, `limit` | `count`, `runs`                                                                                                                                                   |
| `get_run`                     | **`id`**                                              | `id`, `summary`, `traceId`, `outcome`, `errorMessage`, `spans`, `logs`                                                                                            |
| `get_recent_errors`           | `service`, `domain`, `sinceUnixMs`, `limit`           | `count`, `groups`                                                                                                                                                 |
| `get_last_job_result`         | `jobId`, `jobName`, `service`, `sinceUnixMs`          | `found`, `jobName`, `jobId`, `status`, `outcome`, `exitCode`, `startUnixMs`, `completedUnixMs`, `durationMs`, `errorMessage`, `traceId`                           |
| `analyze_service_performance` | **`service`**, `sinceUnixMs`, `limit`                 | `service`, `sinceUnixMs`, `sampleCount`, `errorCount`, `errorRate`, `averageDurationMs`, `p50DurationMs`, `p95DurationMs`, `throughputPerMinute`, `topOperations`, `provenance` |
| `analyze_db_bottlenecks`      | `service`, `sinceUnixMs`, `limit`                     | `sinceUnixMs`, `sampleCount`, `operations`, `provenance` |
| `doctor`                      | `endpoint`                                            | `status`, `endpoint`, `counts`, `checks`, `families`                                                                                                              |
| `search_docs`                 | **`query`**, `limit`                                  | `count`, `matches`                                                                                                                                                |
| `list_docs`                   | `limit`                                               | `count`, `docs`, and `corpus` (`kind`, resolved `root`, total `documentCount`)                                                                                    |
| `get_doc`                     | **`slug`**, `section`, `full`, `cursor`               | `contractVersion`, `mode`, `slug`, `title`, `section`, `content`, `outline`, `omitted`, `nextCursor`, `redirectedFrom`                                            |
| `find_guidance`               | **`intent`**, `limit`                                 | Bounded ordered section recommendations, cited code, related routes, confidence, fallback, and `truncated`                                                        |
| `find_export`                 | **`symbol`**, `limit`                                 | Exact `package` / `subpath` / declaration-kind matches, total count, and `truncated`                                                                              |
| `list_package_exports`        | **`package`**, `offset`, `limit`                      | A stable declaration page grouped by subpath, total/returned counts, `nextOffset`, and `truncated`                                                                |
| `get_export`                  | **`symbol`**, `package`, `subpath`                    | One exact declaration signature and JSDoc with explicit `truncated`; ambiguity is refused with bounded candidates                                                 |
| `search_exports`              | **`query`**, `package`, `kind`, `limit`               | Ranked partial-name or declaration-shape matches with signatures, scores, totals, and `truncated`                                                                 |
| `list_commands`               | `filter`, `limit`                                     | `count`, `commands`                                                                                                                                               |
| `execute_command`             | **`command`**, `args`                                 | `exitCode`, `durationMs`, `outputTail`, `truncated`, `timedOut`                                                                                                   |
| `record_drift`                | **`resource`**, **`summary`**, `details`              | `recorded`, `resource`, `receipt`                                                                                                                                 |
| `list_api_services`           | —                                                     | Service status, URLs, optional operation count, conflicts, and verbatim discovery source outcomes                                                                 |
| `list_service_operations`     | **`service`**, `filter`, `limit`                      | Bounded operation rows with optional `access`, plus `truncated` metadata                                                                                          |
| `get_operation_schema`        | **`service`**, **`operation`**, `view`                | Projected schema view, operation identity, optional `access`, access-aware `curlExample`, and `authNote`                                                          |

### Shared release corpus

MCP and the CLI offline documentation installer read the same full generated page carrier through
`@netscript/mcp/docs`. The subpath exports `EMBEDDED_AGENT_DOCS_PAGES`, the `AgentDocsPage` tuple,
`decodeAgentDocsPages` (gzip/size/SHA-256 verification), and `agentDocsFullCorpus` (the derived
concatenation). The corpus is decoded lazily for MCP documentation requests. Other MCP imports
load only the small release metadata.

Release `list_docs`, `get_doc`, `find_guidance`, and `search_docs` results include `citation` with
`frameworkVersion` and the content-addressed corpus `sha256`. Canonical page lookup accepts a
slug with or without `pages/` and a trailing `/index`. An empty literal search carries low
confidence and an explicit no-seam-documented fallback directing API queries to the export tools.

### Faithful documentation retrieval

`get_doc` reports `contractVersion: 2` and `mode` on every successful response. Documents and
sections whose JSON-escaped UTF-8 content fits 12 KiB return `mode: "verbatim"` with exact text.
Larger inputs return `mode: "extract"`: title, description, a whole-document navigation outline
(heading, slug, character count), selected source blocks, and verbatim sentences. Selection uses
four tiers, in order:

1. Whole fences, command lines and config-key lines, cheapest first.
2. Heading lines.
3. Sentences containing links or inline code.
4. Plain first sentences.

Selected spans are emitted in source order. A fence or sentence that cannot fit is omitted whole. The
`omitted.blocks` count includes partially omitted paragraphs, and `omitted.characters` counts source
characters not retained. The extract never paraphrases or cuts a snippet. Section-scoped extracts
restrict `content` to that section but keep the whole-document outline for navigating to other
sections; outline sizes describe the indexed section bodies.

For complete text, call `get_doc` with `full: true`. It returns `mode: "full"`, one exact source
page, and `nextCursor` when more text remains. Pass that value as `cursor` with the same `slug`,
`section` (if selected), and `full: true` until `nextCursor` is absent. Concatenating `content`
reconstructs the original document body byte for byte, including line endings and whitespace. YAML
front matter is metadata and is excluded; section retrieval keeps the existing trimmed section-body
convention. Full pages may divide fences, but preserve every character and never split a Unicode
surrogate pair. Read the assembled text before using a multi-page snippet.

Cursors are versioned and bound to canonical slug, section, and SHA-256 source digest. Malformed,
mismatched, or stale cursors return `invalid_doc_cursor`; restart without a cursor after a change.
`cursor` requires `full: true`. Default results are cached per indexed document/section. The source
admission ceiling is 4 Mi UTF-16 characters. Oversized sources are skipped during indexing;
retrieving one returns `doc_too_large` naming its slug, while list, search and guidance remain
available for accepted documents. Sources are never silently truncated. Outline/metadata exceeding
the 64 KiB response ceiling produces an explicit transport error directing the caller to full mode.

### Documentation sources

Documentation resolves in this order: explicit `--docs-root`, `NETSCRIPT_DOCS_ROOT`, an indexable
`<projectRoot>/.netscript/docs`, then a generated release-matched embedded fallback. An empty or
redirect-only project probe falls back to embedded; an invalid explicit/environment root remains a
structured error. `list_docs.corpus.kind` is `filesystem` or `embedded`, its `root` is the resolved
filesystem path or `null`, and `documentCount` is the total before the requested list limit.

### Operation access summary

`list_service_operations` and `get_operation_schema` share the same optional access result shape:

```json
{
  "authentication": "required",
  "securitySchemes": ["bearerAuth"],
  "scopes": ["catalog:read"],
  "roles": ["reader"]
}
```

`OperationAccessSummary` reports declared access facts only. `authentication` is
`none`, `optional`, or `required`; each list allows at most 50 non-empty strings, and each string is
bounded to 2,000 characters. It never contains a principal, token, cookie, secret, or credential
value.

| Retained OpenAPI operation                     | Tool result                                                |
| ---------------------------------------------- | ---------------------------------------------------------- |
| No own `security` property                     | `access` is absent, preserving the undeclared state        |
| `security: []`                                 | `authentication: 'none'`; schemes and scopes are empty     |
| `security: [{}, { bearerAuth: [] }]`           | `authentication: 'optional'`; `bearerAuth` is listed       |
| `security: [{ bearerAuth: ['catalog:read'] }]` | `authentication: 'required'`; scheme and scopes are listed |
| Required operation with `x-netscript-roles`    | Roles are copied into the bounded `roles` list             |

The root and `./cli` entrypoints export the read-tool result types with the types they reference, so
typed consumers never meet a private type:

| Symbol | Kind | Description |
| --- | --- | --- |
| `ServiceOperationSummary` | interface | One bounded `list_service_operations` row. |
| `ListServiceOperationsResult` | interface | Successful `list_service_operations` value. |
| `GetOperationSchemaResult` | interface | Successful `get_operation_schema` value. |
| `OperationAccessSummary` | interface | Declared access facts; also exported by `./openapi-projection`. |
| `SchemaViewName` | type alias | Projection view name; also exported by `./openapi-projection`. |

`get_operation_schema` produces different credential-free guidance for undeclared, public, optional,
and required operations. Only the required template includes the literal placeholder
`Authorization: Bearer <credential>`; no real credential is requested or echoed.

## Record drift

`record_drift` is an evidence-gated mutating tool that appends structured architecture or runtime
drift entries to `.netscript/agent/drift.jsonl`.

| Aspect | Behavior |
| --- | --- |
| Required evidence | A fresh successful diagnostic receipt for the target resource: created within 15 minutes, `exitStatus: 0`. `doctor`, the telemetry tools, the API introspection tools and `netscript plugin doctor --resource <resource>` produce receipts. |
| Target | `resource` names the target component, such as a plugin name, a service name or `'project'`. Receipts live at `.netscript/agent/diagnostics/<resource>.json`. |
| Mutation | Appends one JSON line to `.netscript/agent/drift.jsonl` with `timestamp`, `resource`, `summary`, optional `details`, and the attached evidence receipt. |
| Failure | No receipt, a receipt older than 15 minutes, or a receipt with a non-zero exit status fails with the structured error code `diagnostic_evidence_required`. |
| Preview | Inspecting receipt files or invoking `doctor` shows diagnostic state without appending to `drift.jsonl`. |

## Output bounds

Every successful result is bounded server-side before the runner serializes it, so a tool can never
flood the model's context.

- After a flow succeeds, `truncateResult` recursively bounds the result using
  `DEFAULT_TRUNCATION_POLICY`: arrays are capped at 50 elements and strings at 2,000 UTF-16 code
  units.
- `get_doc` is exempt from these recursive cuts; it uses the
  [faithful retrieval](#faithful-documentation-retrieval) budget and checks the complete MCP
  response against 64 KiB.
- The analytics tools (`analyze_service_performance`, `analyze_db_bottlenecks`) never return raw
  spans; their results are computed aggregates.
- `execute_command` returns only a bounded combined output tail (4,096 bytes by default) and flags
  `truncated` when output was cut.
- A failed flow returns a structured tool error (a stable `code` plus a message), not a truncated
  success.

| Symbol | Kind | Description |
| --- | --- | --- |
| `truncateResult` | function | Recursively bound arrays and strings in a JSON-compatible result. |
| `DEFAULT_TRUNCATION_POLICY` | const | The default bounds: 50 array items, 2,000 UTF-16 code units per string. |
| `TruncationPolicy` | interface | `maxItems` and `maxStringLength`. |

## Command policy

`execute_command` is default-deny: a normalized command path must match an allow rule and no deny
rule. Deny beats allow; anything unmatched is denied.

| Symbol | Kind | Description |
| --- | --- | --- |
| `decideCommand` | function | Decide whether a normalized command path is allowed by a policy. |
| `DEFAULT_COMMAND_POLICY` | const | Conservative allowlist shipped with the server. |
| `CommandPolicy` | interface | Ordered `allow` / `deny` prefix rules. |
| `CommandPolicyDecision` | type alias | The decision returned for a command path. |

| Default policy | Commands |
| --- | --- |
| Allow | `db init\|generate\|migrate\|seed\|status\|introspect`, `generate`, `contract`, `service list`, `plugin install\|list\|sync\|doctor`, `ui:add\|ui:init\|ui:list\|ui:update` |
| Deny | `deploy`, `init`, `marketplace`, `db reset`, `plugin remove`, `ui:remove` |

## Ports

Every tool flow depends on a port, never on a concrete client, so this package can report on the
CLI without depending on it. `@netscript/cli` implements the ports and injects them at its own
composition root.

| Symbol | Kind | Description |
| --- | --- | --- |
| `TelemetryProbePort` | interface | Telemetry endpoint reachability check. |
| `DocsCorpusPort` | interface | Public Markdown corpus: search, list, get. |
| `ExportSurfaceCorpusPort` | interface | Version-pinned normalized `deno doc --json` export data. |
| `CommandCatalogPort` | interface | Supplies the live CLI command tree to `list_commands`. |
| `CommandExecutorPort` | interface | Runs an allowed command, returning structured process data. |
| `ProjectDoctorPort` | interface | Typed project and plugin diagnostics. |
| `DoctorCheckFamily` | interface | One group of doctor checks aggregated into the verdict. |

## Generated export corpus

`EmbeddedExportSurfaceCorpus` is a separate corpus from public prose. Generation runs
`deno doc --json` over every publishable first-party package export map, normalizes one record per
exported declaration, and embeds deterministic gzip/base64 data. Runtime loading is lazy and
mirror-free: it verifies the schema and framework versions, SHA-256, compressed and uncompressed
byte sizes, and exact package/subpath/symbol counts before answering a query. `get_export` returns
only the selected symbol's bounded signature and JSDoc; no tool places a whole generated file into
model context.

## Default adapters

| Symbol | Kind | Description |
| --- | --- | --- |
| `EmbeddedDocsCorpus` | class | In-memory `DocsCorpusPort` used for package and outer-CLI Markdown assets. |
| `EmbeddedExportSurfaceCorpus` | class | Lazy mirror-free `ExportSurfaceCorpusPort` with version, hash, size, and count verification. |
| `FilesystemDocsCorpus` | class | `DocsCorpusPort` over an explicit, environment, or project-probed Markdown root. |
| `SpawnCommandExecutor` | class | `CommandExecutorPort` that spawns the `netscript` binary. |
| `StaticCommandCatalog` | class | `CommandCatalogPort` used when no live catalog is injected. |
| `PluginDoctorFamily` | class | Plugin diagnostics as a doctor check family. |
| `slugifyDocsHeading` | function | Normalize a Markdown heading into a `get_doc` section slug. |

## `@netscript/mcp/cli`

The executable composition. It binds the real telemetry query, the filesystem docs corpus, the
Aspire, project-wiring and plugin doctor families, and the process executor, and runs them over
stdio.

| Symbol | Kind | Description |
| --- | --- | --- |
| `runMcpStdioServer` | function | Run the server on Deno standard input and output. |
| `createMcpCliServer` | function | Compose the server with optional outer CLI adapters. |
| `resolveDocsRoot` | function | Resolve docs by flag, environment, then an indexable `.netscript/docs` project probe. |
| `McpCliOptions` | interface | Composition seams including `exportSurfaceCorpus`, docs, telemetry, doctor, commands, and project root. |

## Telemetry binding and sample evidence

The three status/performance tools bind to the server's project, selected with
`netscript agent mcp --project-root <project-root>`. On each call they select that project's exact
`aspire/apphost.mts` from `aspire ps`, then read the supported dashboard telemetry API. Start that
AppHost before requesting telemetry. Discovery runs once per call, so a later start or restart is
seen without restarting MCP.

Explicit dashboard configuration takes precedence: `--endpoint` (or the composition's `endpoint`),
then `NETSCRIPT_TELEMETRY_ENDPOINT`, then `ASPIRE_DASHBOARD_PORT`. The port variable is an explicit
HTTP dashboard override. Use a full endpoint for HTTPS. An endpoint may contain a dashboard login
URL; its token is exchanged privately for an API key using Aspire's supported authentication API.
Invalid overrides fail instead of selecting another dashboard. These three tools have no
conventional dashboard fallback.

Every response carries `provenance`: the requested inclusive `window`, selected span
`sampleCount`, optional `logCount`, `servingRevision` (the serving MCP package version), and any
observed `serviceRevisions` from `service.version`. A deployment commit is reported only if the
service emitted it. The span `totalCount`, `returnedCount`, acquisition `observedRange`, `limit`
and `sourceTruncated` describe the bounded snapshot before local window filtering. Resource
counts describe the dashboard's telemetry emitter inventory; plugin runtime health is separate.

`provenance.state` distinguishes `ready`, `no_data`, `partial`, `unbound` and `unavailable`.
A wrong project returns `telemetry_unbound` with a project/AppHost selection hint. Query,
authentication and malformed-response failures return `telemetry_unavailable`. An unknown or
ambiguous service filter returns `telemetry_unknown_service`, with a service/replica-name hint.
Failure sample counts are `null`; these errors contain no latency statistics. Successful empty
performance windows return `telemetry_no_data`, and an empty capped selection returns
`telemetry_partial`. Incomplete service spans return `telemetry_no_completed_samples`.
App status retains plugin health with a warning and diagnostic for empty or partial telemetry.

Performance statistics use completed spans: the top-level analysis `sampleCount` counts completed
service spans or DB/KV operations, while `provenance.sampleCount` counts all spans selected in the
window. A partial snapshot remains partial even when it contains samples. The default window is
15 minutes; `sinceUnixMs` can widen it. Status's `limit` caps each source read (default 100);
analysis reads at most 1,000 spans and its `limit` bounds the returned operation list.

Native metrics and histogram streams are **visible only in the dashboard Metrics view** through
this integration. The [supported dashboard read API](https://aspire.dev/dashboard/apis/) exposes
resources, spans, traces and logs. The latency percentiles above are calculated from sampled spans;
they are not queries of native histogram buckets. The capability is reported as
`nativeMetrics: "dashboard_only"`.

Credentials, dashboard URLs, configuration values and raw transport errors remain inside the
adapter. To extend acquisition, start at `src/ports/telemetry-snapshot-port.ts`; explicit query-port
flow injections retain their existing contract and identify their evidence as `injected_query`.

## Data boundary

The server reads telemetry, project metadata, generated registries, public documentation, and its
package-embedded public export corpus. It never returns project source, environment-variable values,
credentials, or secrets. Stdio is process-local; outbound telemetry traffic consists of authenticated reads and reachability probes
to the selected dashboard.

## Declared plugin runtime health

The CLI-hosted MCP `doctor` and `get_app_status` tools consume the plugin doctor's shared runtime
aggregation. Status polling reads fresh declared resources through `ProjectDoctorPort`'s
runtime-health operation without repeating static module validation. Both tools use the same
`@netscript/plugin/health` verdict. A healthy API with an unhealthy or missing declared child yields
`degraded`, with monitoring severity `fail`. `get_app_status` returns `healthStatus` and bounded
`pluginHealth` reports; each report includes API and child names, verdicts, and lifecycle states
including `crash-looping`. Filtering an API retains its declared children. A standalone MCP process
without the CLI project adapter, or a CLI project with no runtime declarations, retains the
telemetry verdict and omits runtime health fields. Runtime inspection failures preserve telemetry
counts/domains, report `healthStatus: unknown`, and include a bounded failed `runtimeChecks`
finding. Declared runtimes with an absent/unavailable AppHost report an inspection failure rather
than being mistaken for a no-plugin project. Each Aspire inspection command has a five-second
deadline.

These inspection failures are `fail` verdicts by design, even when polling a stopped development
app. Legacy adapters without a runtime-health operation use static doctor findings; their failures
also remain visible when a service filter is supplied.

Runtime ownership follows the generated child/API reference links described in the
[plugin health reference](/reference/plugin/#plugin-runtime-health-aggregation), with optional
`InstalledFrom` overrides. Installation metadata is not required. Invalid health-capable child
entries produce named warning checks in both tools; `get_app_status` includes those warnings in
`runtimeChecks` and reports `warn` while retaining telemetry. Failed findings take priority within
the bounded checks list. Static-only adapter warnings retain their existing telemetry verdict;
standalone MCP's unwired diagnostic warning remains visible in `doctor`.

A dead child remains `degraded` when a declared API has disabled health probes. A child-only plugin
with a dead child is `unhealthy`. Cross-plugin precedence comes from `summarizePluginHealth` in the
same shared package, so other consumers can use the identical roll-up.

The package forwards `PluginHealthDeclaration`, `PluginHealthStatus`, `PluginHealthSummary`, and
`PluginResourceHealth` to document the types used by `DoctorCheck.runtimeHealth`. Their contract and
aggregation implementation remain owned by `@netscript/plugin/health`.

## UI registry discovery

`list_registry_items` returns item metadata with `limit` (at most 20) and `offset`;
`search_registry_items` adds a required `query`. Both return `items`, `total` and an optional
`nextOffset`. `view_registry_item` accepts `name` and returns a portable item with copy bytes.
The standalone server uses the embedded Fresh UI registry without a network request.
Hosts can inject `McpCliOptions.uiRegistryCatalog` for a selected app's registries.

`get_registry_add_command` accepts a name, `@namespace/name`, or HTTP(S) item URL and returns
`{command: "netscript", args: ["ui:add", name]}`. It does not execute the command. Pass the
arguments directly to a process API after reviewing the installation; never join them into shell text.

Registry metadata uses the server's normal output bounds. Views preserve exact file contents and
fail with `tool_result_too_large` when the complete JSON-RPC response exceeds 64 KiB. Use
`netscript ui:view <name>` for larger items.

Registry composition exports: `createUiRegistryFlows` composes the four tools;
`UI_REGISTRY_PAGE_LIMIT` is their page bound. `UiRegistryCatalogPort` defines host registry
reads and `UiRegistryItemSummary` defines metadata entries.
