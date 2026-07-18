---
layout: layouts/base.vto
title: Agent tooling
description: Install and use NetScript's shared CLI, skills, and MCP vocabulary.
---

# Agent tooling

NetScript gives developers and coding agents one vocabulary across three surfaces:

- the `netscript` CLI performs direct, scriptable operations;
- installed skills explain which NetScript workflow to use and when to hand off to the CLI;
- the MCP server returns compact framework-aware diagnostics, telemetry summaries, and public docs.

Prefer the CLI when a command already expresses the operation. It is easier to reproduce in a
terminal or CI job. Use MCP for interactive investigation, especially when one framework-aware tool
replaces several telemetry queries or when an agent needs to discover a document before reading it.

## Install into a project

```bash
netscript agent init
```

Host detection installs the matching files. If neither host directory exists, NetScript prepares
both hosts. Use `--host claude`, `--host vscode`, or `--host all` to select explicitly.

| Host        | Files written                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| Claude Code | `.mcp.json`, NetScript skills under `.claude/skills/`, and a marked NetScript section in `AGENTS.md` |
| VS Code     | `.vscode/mcp.json`                                                                                   |

The generated MCP configuration runs `netscript agent mcp` for the current project. Re-running
`agent init` is idempotent: unchanged files are left alone, and existing host configuration is
preserved alongside the `netscript` server entry.

## Run the server

The generated host configuration runs `netscript agent mcp`, which starts the MCP server over
standard input/output. Its flags:

| Flag                    | Purpose                                                                                       |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| `--project-root <path>` | NetScript project root used for execution and doctor flows. `agent init` writes this for you. |
| `--endpoint <url>`      | Telemetry endpoint URL; overrides discovery (below). Only `http:` and `https:` are accepted.  |
| `--docs-root <path>`    | Public documentation root for the docs tools; overrides the default corpus (below).           |

## Documentation corpus

Without an override, `list_docs`, `search_docs`, and `get_doc` index the documentation shipped with
the installed `@netscript/mcp` package (one document under the `mcp` slug). Point the server at a
richer corpus — a project docs folder or a checkout of this site — with `--docs-root <path>` or the
`NETSCRIPT_DOCS_ROOT` environment variable. A configured path that does not exist returns a
structured `docs_corpus_not_found` error naming the missing path; the server never silently reports
an empty corpus.

## Tool catalog

Every tool returns a bounded structured result. A CLI twin is listed where a direct command covers
the same user intent; `—` means the MCP operation is an aggregate or read model rather than a CLI
command.

| Tool                          | What one call replaces                                                         | CLI twin                                            |
| ----------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------- |
| `get_app_status`              | Health and recent activity across NetScript runtime domains                    | —                                                   |
| `list_runs`                   | Search and grouping of recent jobs, sagas, triggers, and other executions      | —                                                   |
| `get_run`                     | Correlation of one execution's spans, logs, outcome, and error                 | —                                                   |
| `get_recent_errors`           | Cross-service error search and grouping                                        | —                                                   |
| `get_last_job_result`         | Finding the latest matching job execution and its outcome                      | —                                                   |
| `analyze_service_performance` | Duration percentiles, throughput, and error-rate calculations                  | —                                                   |
| `analyze_db_bottlenecks`      | Ranking database and KV operations by latency and frequency                    | —                                                   |
| `doctor`                      | Telemetry reachability, Aspire markers, project wiring, and plugin diagnostics | `netscript plugin doctor` covers plugin diagnostics |
| `search_docs`                 | Search over the public documentation corpus                                    | —                                                   |
| `list_docs`                   | A bounded inventory of public documents                                        | —                                                   |
| `get_doc`                     | Reading one document or named section without loading the full corpus          | —                                                   |
| `list_commands`               | Machine-readable discovery of the current CLI command tree                     | `netscript --help`                                  |
| `execute_command`             | Policy checking, execution, timeout handling, and a bounded output tail        | Run the allowed `netscript …` command directly      |

## Token-efficient use

Tool inputs cap result counts, and the server truncates oversized results and command output. Start
with the narrowest filter that answers the question. For documentation, use the search-to-get
funnel: call `search_docs`, choose a slug, then call `get_doc` for that document or section.

## Data boundary

The MCP server reads NetScript telemetry, project metadata and generated registries used for
diagnostics, and public documentation. It does not return project source code, environment-variable
values, credentials, or secrets.

Telemetry requests go only to the resolved dashboard endpoint. Discovery uses, in order, the
`--endpoint` option, `NETSCRIPT_TELEMETRY_ENDPOINT`, `ASPIRE_DASHBOARD_PORT`, and the local default
`http://localhost:18888`.

`execute_command` is default-deny. Explicit rules allow selected database, generation, contract,
service-read, plugin, and UI commands. Deny rules take priority; deployment, project initialization,
marketplace operations, database reset, plugin removal, and every unmatched command are rejected
with a structured denial before a process is started.

## Troubleshooting

Start with the `doctor` tool: it aggregates four check families — `telemetry`, `aspire`, `project`,
and `plugins` — into one verdict, and each check carries a `pass`, `warn`, or `fail` status with a
suggested fix. Reading the result:

- **`telemetry` warns or fails** — no reachable telemetry endpoint. Verify the app is running, then
  check the discovery chain: `--endpoint`, `NETSCRIPT_TELEMETRY_ENDPOINT`, `ASPIRE_DASHBOARD_PORT`,
  and the local default `http://localhost:18888`. Telemetry tools still respond while the endpoint
  is down — they return a structured `warn`/`fail` result (for example `get_app_status` with
  `status: "warn"` and zero counts), never a crash.
- **`aspire` or `project` warns** — the project root is wrong or the workspace is missing expected
  markers. Confirm the `--project-root` written into your host configuration points at the project
  (re-run `netscript agent init` after moving a project).
- **`plugins` warns or fails** — plugin diagnostics found an issue; the equivalent direct command is
  `netscript plugin doctor`.
- **Docs tools return `docs_corpus_not_found`** — the configured `--docs-root` /
  `NETSCRIPT_DOCS_ROOT` path does not exist; fix the path or remove the override to fall back to the
  packaged corpus.
- **`execute_command` returns a denial** — the command did not match the allowlist (see the data
  boundary above); run it directly in a terminal instead.

## Run the protocol smoke

```bash
deno test --allow-all packages/cli/e2e/tests/agent/agent-mcp-stdio_test.ts
```

The smoke starts the public CLI binary, initializes MCP over stdio, verifies the 13-tool catalog,
and checks docs, diagnostics, unreachable telemetry, and command denial behavior.
