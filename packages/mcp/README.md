# @netscript/mcp

[![JSR](https://jsr.io/badges/@netscript/mcp)](https://jsr.io/@netscript/mcp)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**The Model Context Protocol server for NetScript: 13 token-bounded tools that let a coding agent
monitor a running app, debug a correlated execution, read framework-semantic telemetry, run the
doctor, and search the docs — all over stdio.**

It also triggers allowlisted CLI commands through a default-deny policy, and carries no npm MCP SDK
on its dependency graph.

---

## 🧭 Why

An agent working on a NetScript app has to answer operational questions — _did the last import job
succeed, why is the checkout service slow, which query is hammering the database, is my Aspire
wiring broken_ — and it usually answers them by shelling out, tailing logs, and pasting thousands of
tokens of raw trace JSON into its own context. That is slow, expensive, and lossy: the agent burns
its budget re-deriving structure NetScript already knows.

`@netscript/mcp` closes that gap. It exposes NetScript's own read models — the
[`TelemetryQueryPort`](https://jsr.io/@netscript/telemetry/doc/query) trace/span/log reader, the
project's generated registries, the plugin doctor, and the public docs corpus — as MCP tools whose
results are **summaries, not dumps**. Every successful result is bounded server-side before it
reaches the model, and the analytics tools return percentiles, error rates, and ranked operations
rather than the spans they were computed from. The tools are NetScript-semantic, not generic OTLP:
they speak `worker`, `saga`, `trigger`, `stream`, and `service`, because they classify spans by the
`netscript.*` attribute conventions the framework already emits.

The server is one third of the NetScript agentic surface — the CLI is the hands, the skills are the
doctrine, MCP is the eyes. It deliberately **wraps the CLI rather than reimplementing it**:
`list_commands` reflects the live command tree, and `execute_command` shells the CLI through a
default-deny policy. An agent that can run `netscript db migrate` directly should just run it; MCP
exists for what a shell cannot cheaply give it — bounded aggregation, cross-domain diagnostics, and
documentation lookup.

---

## Install

Most users never import this package. Install the server into a project with the CLI:

```bash
netscript agent init
```

That writes `.mcp.json` (Claude Code) and/or `.vscode/mcp.json` pointing at `netscript agent mcp`,
and installs the version-matched NetScript skills. Start the app, and the agent can ask its
questions:

> _"Is the app healthy?"_ → `get_app_status` · _"Why did the last import job fail?"_ →
> `get_last_job_result`, then `get_run` · _"What is slowing down `checkout`?"_ →
> `analyze_service_performance`

To embed the server in your own host process, add it as a library:

```bash
deno add jsr:@netscript/mcp
```

Run the standalone stdio entrypoint directly when you are integrating another MCP host:

```bash
deno x -A jsr:@netscript/mcp@<version>/cli
```

Pin `<version>` to match your installed CLI; bare `jsr:@netscript/*` specifiers do not resolve on
the pre-release line, and `netscript agent init` writes the correct pinned form for you.

## Quick example

`netscript agent init` writes the host configuration for you. The Claude Code form is equivalent to:

```json
{
  "mcpServers": {
    "netscript": {
      "command": "deno",
      "args": [
        "run",
        "-A",
        "jsr:@netscript/cli@<version>",
        "agent",
        "mcp",
        "--project-root",
        "<project-root>"
      ]
    }
  }
}
```

The process speaks newline-delimited JSON-RPC over standard input and output. After MCP
initialization, `tools/list` returns the 13 bounded NetScript tools for telemetry, diagnostics,
documentation, and allowlisted CLI actions.

## Docs

- [MCP package reference](https://rickylabs.github.io/netscript/reference/mcp/)
- [Agent tooling](https://rickylabs.github.io/netscript/capabilities/agent-tooling/)

---

## 🧩 Mental model

```text
       agent (Claude Code, VS Code, …)
                 │  JSON-RPC over stdio
       ┌─────────▼──────────┐
       │  runner + policy   │  initialize · tools/list · tools/call
       │  (truncation)      │  every result bounded before it is returned
       └─────────┬──────────┘
                 │  13 tool flows
   ┌─────────────┼───────────────┬──────────────────┐
   ▼             ▼               ▼                  ▼
telemetry     docs corpus    doctor families    command policy
(read model)  (public .md)   (aspire/wiring/    (default-deny
                              plugins)           allowlist)
   │                              │                  │
   ▼                              ▼                  ▼
Aspire dashboard HTTP      project metadata      `netscript` binary
```

Three ideas carry the design.

**Tools are flows over ports.** A tool is a name, an input contract, an output contract, and a flow.
The flow depends only on a port — `TelemetryProbePort`, `DocsCorpusPort`, `CommandCatalogPort`,
`CommandExecutorPort`, `ProjectDoctorPort` — never on a concrete client. That is why this package
can report on the CLI without depending on it: `@netscript/cli` implements the ports and injects
them at its own composition root, so the dependency points inward and no cycle exists.

**Results are bounded by construction.** `truncateResult` walks every successful result and caps
arrays at 50 elements and strings at 2,000 UTF-16 code units before the runner serializes it. The
analytics tools go further and never return raw spans at all. A failure is a structured tool error,
not a crash: an unreachable telemetry endpoint produces a `warn`/`fail` result the agent can reason
about.

**Execution is default-deny.** `execute_command` matches a normalized command path against an
ordered policy. Deny rules win; unmatched paths are denied. Destructive and account-bound verbs are
never reachable through MCP.

---

## 🧰 Tool catalog

| Tool                          | Required input | Bounded result                                              |
| ----------------------------- | -------------- | ----------------------------------------------------------- |
| `get_app_status`              | —              | Health verdict, counts, per-domain summaries                |
| `list_runs`                   | —              | Recent executions filtered by domain, status, service, time |
| `get_run`                     | `id`           | One correlated execution with bounded spans and logs        |
| `get_recent_errors`           | —              | Recent errors grouped by service and domain                 |
| `get_last_job_result`         | —              | The latest matching job outcome                             |
| `analyze_service_performance` | `service`      | Duration percentiles, throughput, error rate                |
| `analyze_db_bottlenecks`      | —              | Ranked database and KV operations                           |
| `doctor`                      | —              | Telemetry, Aspire, wiring, and plugin checks with fixes     |
| `search_docs`                 | `query`        | Ranked public-document matches with snippets                |
| `list_docs`                   | —              | Public-document summaries                                   |
| `get_doc`                     | `slug`         | One public document, or one named section of it             |
| `list_commands`               | —              | Live CLI command descriptors from the injected catalog      |
| `execute_command`             | `command`      | Policy decision, exit status, bounded output tail           |

### Recipes

- **Triage a failing app.** `doctor` first — it aggregates telemetry reachability, Aspire markers,
  project wiring, and plugin diagnostics into one verdict with suggested fixes, so a single call
  usually names the broken seam.
- **Find why the last job failed.** `get_last_job_result` (optionally filtered by `jobName` or
  `service`) returns the outcome plus its execution `id`; feed that `id` to `get_run` for the spans
  and logs of just that execution.
- **Investigate a slow service.** `analyze_service_performance` with `{ service: "checkout" }`
  returns p50/p95 duration, throughput, and error rate over the window — not the spans. Narrow the
  window with `sinceUnixMs`.
- **Read the docs without burning context.** Funnel, never dump: `search_docs` to locate a slug,
  then `get_doc` with that slug and — when you only need one part — a `section` heading.
- **Discover and run a safe command.** `list_commands` reflects the CLI's live command tree (so it
  never drifts from the installed binary); `execute_command` runs an allowlisted one, e.g.
  `{ command: "db", args: ["migrate"] }`. A denied path returns `command_denied` _before_ the
  executor is invoked.

---

## 📦 Public surface

The default entrypoint publishes the contracts, registry, and generic server composition; `./cli`
publishes the executable composition that binds the real adapters.

| Export                                                                      | Entry   | Role                                                        |
| --------------------------------------------------------------------------- | ------- | ----------------------------------------------------------- |
| `createToolRegistry()`                                                      | `.`     | Immutable, enumerable definitions of the 13 tools           |
| `createMcpServer()`                                                         | `.`     | Protocol runner: `initialize` / `tools/list` / `tools/call` |
| `TOOL_NAMES`, `TOOL_INPUT_SCHEMAS`, `TOOL_OUTPUT_SCHEMAS`, `validateSchema` | `.`     | Standard Schema contracts for every tool                    |
| `DEFAULT_TRUNCATION_POLICY`, `truncateResult`                               | `.`     | Server-side output bounds                                   |
| `DEFAULT_COMMAND_POLICY`, `decideCommand`                                   | `.`     | The default-deny allowlist and its decision function        |
| `TelemetryProbePort`, `DocsCorpusPort`, `ProjectDoctorPort`, …              | `.`     | Port contracts an embedder implements                       |
| `EmbeddedDocsCorpus`, `FilesystemDocsCorpus`, process/command adapters      | `.`     | Default infrastructure adapters                             |
| `createMcpCliServer()`                                                      | `./cli` | Full composition: telemetry, docs, doctor, CLI trigger      |
| `runMcpStdioServer()`                                                       | `./cli` | Newline-delimited JSON-RPC stdio loop                       |
| `resolveDocsRoot()`                                                         | `./cli` | Explicit docs-root resolution from flag or environment      |

Full symbol reference: [`deno doc jsr:@netscript/mcp`](https://jsr.io/@netscript/mcp/doc).

---

## ⚙️ Configuration

### Telemetry endpoint discovery

Telemetry tools and `doctor` share one ordered policy:

1. an explicit `endpoint` option (the CLI surfaces it as `--endpoint`);
2. `NETSCRIPT_TELEMETRY_ENDPOINT`;
3. `ASPIRE_DASHBOARD_PORT`, converted to a local HTTP endpoint with an HTTPS fallback;
4. `http://localhost:18888`.

Only `http:` and `https:` endpoints are accepted. An unreachable endpoint yields a structured
warning or failure result rather than a crash.

### Composition seams

`createMcpCliServer(options)` / `runMcpStdioServer(options)` accept:

| Option            | Purpose                                                        |
| ----------------- | -------------------------------------------------------------- |
| `commandCatalog`  | Supplies the live CLI command tree to `list_commands`          |
| `commandExecutor` | Runs an allowed command, returning structured process data     |
| `commandPolicy`   | Replaces the ordered allow/deny prefixes for `execute_command` |
| `projectDoctor`   | Supplies typed project and plugin diagnostics                  |
| `projectRoot`     | Root for execution and doctor flows                            |
| `docsRoot`        | Overrides the package-shipped docs with a public Markdown root |
| `endpoint`        | Overrides telemetry endpoint discovery                         |

Without an override, `list_docs`, `search_docs`, and `get_doc` index the README shipped with the
installed `@netscript/mcp` package under the `mcp` slug. Set `--docs-root <path>` (or
`NETSCRIPT_DOCS_ROOT`) to use a project or site corpus instead. A configured path that does not
exist returns `docs_corpus_not_found` with the missing path and `--docs-root` remediation; it never
silently reports an empty corpus.

The generic `createMcpServer(options)` takes the lower-level seams instead — `probe`, `environment`,
`flows`, and `truncation`, the last of which overrides the 50-item / 2,000-character output bounds.

### Command policy

`DEFAULT_COMMAND_POLICY` **allows** `db init|generate|migrate|seed|status|introspect`, `generate`,
`contract`, `service list`, `plugin install|list|sync|doctor`, and
`ui:add|ui:init|ui:list|ui:update`. It **denies** `deploy`, `init`, `marketplace`, `db reset`,
`plugin remove`, and `ui:remove`. Deny beats allow; anything unmatched is denied by default. Pass
your own `CommandPolicy` to tighten or (deliberately) widen it.

### Data boundary and permissions

The server reads telemetry, project metadata, generated registries, and public documentation. It
never returns project source, environment-variable values, credentials, or secrets. Stdio is
process-local; the only outbound traffic is the telemetry probe to the resolved endpoint.

The executable needs `--allow-env` (endpoint discovery), `--allow-net` (telemetry), `--allow-read`
(project metadata and docs), and `--allow-run` only when `execute_command` is wired to a process
executor. The `netscript` binary grants these at its edge; embedders should grant only what their
chosen adapters use.

---

## 🔭 Observability

This package is a telemetry **consumer**, not a producer: it emits no spans of its own. It reads
through `TelemetryQueryPort` from `@netscript/telemetry/query` and classifies what it reads using
the `netscript.*` attribute convention, mapping namespace prefixes onto the five semantic domains it
exposes:

| Domain    | Classified from                         |
| --------- | --------------------------------------- |
| `worker`  | `netscript.worker.*`                    |
| `saga`    | `netscript.saga.*`                      |
| `trigger` | `netscript.trigger.*`                   |
| `stream`  | `netscript.stream.*`, `netscript.sse.*` |
| `service` | `netscript.job.*`                       |

Execution lookups (`get_run`, `get_last_job_result`) key off the first execution identifier a span
carries — `netscript.execution.id`, then the job, saga-instance, and trigger ids — and widen to the
whole trace from there. The attribute convention itself is owned by `@netscript/telemetry` — see
[the telemetry convention](https://rickylabs.github.io/netscript/reference/telemetry/convention/).

---

## 🏗 Architecture

Archetype 6 (CLI/Tooling) — a thin protocol router over flows. The package is layered
`domain → application → infrastructure`: tool contracts, schemas, port interfaces, and pure policy
in `src/domain/`; the tool flows and the protocol runner in `src/application/`; and the concrete
telemetry, docs, doctor, and process adapters in `src/infrastructure/`. Dependencies point inward —
flows know ports, never adapters.

The transport is deliberately minimal — UTF-8 newline-delimited JSON-RPC implementing `initialize`,
`tools/list`, and `tools/call` against protocol version `2025-11-25` — rather than the npm MCP SDK.
That keeps the published dependency graph and the lockfile stable, which matters because this
package ships inside the CLI binary.

The CLI surface (`netscript agent mcp`, `netscript agent init`) lives in `@netscript/cli`, not here;
this package stays a library engine. See
[Agent tooling](https://rickylabs.github.io/netscript/capabilities/agent-tooling/) for the whole
combo.

### Testing

There is no `./testing` entrypoint, and none is needed: every flow depends on a port, so a test
supplies a fake and asserts on the bounded result.

```ts
import { assertEquals } from '@std/assert';
import { createMcpServer, type TelemetryProbePort } from '@netscript/mcp';

const probe: TelemetryProbePort = {
  probe: (endpoint: string) =>
    Promise.resolve({ reachable: true, status: 200, message: `reached ${endpoint}` }),
};

const server = createMcpServer({ probe });
const response = await server.handle({ jsonrpc: '2.0', id: 1, method: 'tools/list' });
assertEquals((response?.result?.tools as unknown[]).length, 13);
```

Assert against `TOOL_INPUT_SCHEMAS` / `TOOL_OUTPUT_SCHEMAS` via `validateSchema`, so a flow that
drifts from its published contract fails locally rather than at the agent.

---

## 🧱 Compatibility

| Runtime       | Support                                                                    |
| ------------- | -------------------------------------------------------------------------- |
| Deno 2.9+     | Full — both the `.` library surface and the `./cli` executable composition |
| Node.js / Bun | Not supported — both entrypoints reach for `Deno.*`                        |

The `.` entrypoint is Deno-only, not just `./cli`: it re-exports the default adapters
`FilesystemDocsCorpus` (`Deno.readDir`, `Deno.readTextFile`, `Deno.stat`) and `SpawnCommandExecutor`
(`Deno.Command`), and `./cli` additionally uses `Deno.stdin` and `Deno.env`.

That constrains the **server**, not the **client**. An MCP host only has to spawn a process and
speak JSON-RPC over stdio, so any MCP-capable client — Claude Code, VS Code, and others — can
consume this server regardless of the runtime it is written in.

---

## 📖 Documentation

- **Reference**:
  [rickylabs.github.io/netscript/reference/mcp/](https://rickylabs.github.io/netscript/reference/mcp/)
- **Agent tooling**:
  [rickylabs.github.io/netscript/capabilities/agent-tooling/](https://rickylabs.github.io/netscript/capabilities/agent-tooling/)
- **Telemetry convention**:
  [rickylabs.github.io/netscript/reference/telemetry/convention/](https://rickylabs.github.io/netscript/reference/telemetry/convention/)

---

## 📝 License

Apache-2.0 — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to
JSR with cryptographically verified provenance.
