---
layout: layouts/base.vto
title: Agent tooling
description: What NetScript gives the coding agents that build your app — CLI, skills, the framework MCP server, and agent-readable docs.
templateEngine: [vento, md]
order: 5
oldUrl: /capabilities/agent-tooling/
---

# Agent tooling

The rest of this pillar is about the AI you build *into* your app — the
[engine](/ai/engine/), the [MCP client stack](/ai/mcp/),
[durable chat](/ai/durable-chat/). This page is the mirror image: what NetScript
gives the coding agents (and the humans pairing with them) that build your app.
One vocabulary across three surfaces:

- the `netscript` CLI performs direct, scriptable operations;
- installed skills explain which NetScript workflow to use and when to hand off to
  the CLI;
- the MCP server returns compact framework-aware diagnostics, telemetry summaries,
  and public docs.

There is a fourth surface that is easy to miss: this documentation site is itself
built to be read by agents — every page has a Markdown twin, and the whole corpus
is published behind `llms.txt`. We cover that
[below](#reading-these-docs-as-an-agent).

Prefer the CLI when a command already expresses the operation — it is easier to
reproduce in a terminal or CI job, and the
[CLI reference]({{ "cli:reference" |> xref |> url }}) is the task-oriented map of
what exists. Use MCP for interactive investigation, especially when one
framework-aware tool replaces several telemetry queries or when an agent needs to
discover a document before reading it.

{{ comp callout { type: "note", title: "Two different MCP surfaces — don't conflate them" } }}
This page documents the NetScript MCP <strong>server</strong>: a standalone stdio
server that gives a coding agent diagnostics, telemetry summaries, and doc search
<em>about</em> the project it is editing. That is a separate surface from the
<a href="/ai/mcp/"><code>@netscript/ai/mcp</code> client stack</a>, which wires
<em>external</em> MCP servers <em>into</em> your product's own agent loop. Server
in, client out. The server's full per-tool contracts live in the
<a href="/reference/mcp/"><code>@netscript/mcp</code> reference</a>.
{{ /comp }}

## Install into a project

```bash
netscript agent init
```

Host detection installs the matching files. If neither host directory exists,
NetScript prepares both hosts. Use `--host claude`, `--host vscode`, or
`--host all` to select explicitly.

| Host        | Files written                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| Claude Code | `.mcp.json`, NetScript skills under `.claude/skills/`, and a marked NetScript section in `AGENTS.md` |
| VS Code     | `.vscode/mcp.json`                                                                                   |

The generated MCP configuration runs `netscript agent mcp` for the current
project. Re-running `agent init` is idempotent: unchanged files are left alone,
and existing host configuration is preserved alongside the `netscript` server
entry.

The host command includes the absolute project `deno.json` path. Deno 2.9
normally holds newly published registry versions behind a 24-hour minimum
dependency age; the generated JSR workspace keeps that policy while excluding
only exact-version packages in the matching NetScript release train. Loading the
project configuration explicitly lets a newly released `@netscript/cli` MCP
server start immediately without changing the age policy for third-party
dependencies.

## Run the server

The generated host configuration runs `netscript agent mcp`, which starts the MCP
server over standard input/output. Its flags:

| Flag                    | Purpose                                                                                       |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| `--project-root <path>` | NetScript project root used for execution and doctor flows. `agent init` writes this for you. |
| `--endpoint <url>`      | Telemetry endpoint URL; overrides discovery (below). Only `http:` and `https:` are accepted.  |
| `--docs-root <path>`    | Public documentation root for the docs tools; overrides the default corpus (below).           |

## What the server exposes

Thirteen tools, every one returning a bounded structured result. Grouped by what
an agent is trying to do:

- **Read the running app** — seven telemetry read models: `get_app_status`,
  `list_runs`, `get_run`, `get_recent_errors`, `get_last_job_result`,
  `analyze_service_performance`, and `analyze_db_bottlenecks`. Each replaces a
  handful of raw telemetry queries with one aggregate answer.
- **Diagnose the project** — `doctor` aggregates telemetry reachability, Aspire
  markers, project wiring, and plugin diagnostics into one verdict; the plugin
  slice has a direct twin in `netscript plugin doctor`.
- **Search the docs** — `search_docs`, `list_docs`, and `get_doc` form a
  search-to-get funnel over the documentation corpus (next section).
- **Bridge to the CLI** — `list_commands` discovers the current command tree
  (the machine-readable twin of `netscript --help`), and `execute_command` runs
  an allowlisted `netscript …` command with policy checking, timeout handling,
  and a bounded output tail.

We keep the per-tool schemas, output bounds, and the full `execute_command`
policy in the [`@netscript/mcp` reference]({{ "ref:mcp" |> xref |> url }}) rather
than restating them here; for the commands themselves, the
[CLI reference]({{ "cli:reference" |> xref |> url }}) is the cheat-sheet.

## Documentation corpus

Without an override, `list_docs`, `search_docs`, and `get_doc` index the
documentation shipped with the installed `@netscript/mcp` package (one document
under the `mcp` slug). Point the server at a richer corpus — a project docs
folder or a checkout of this site — with `--docs-root <path>` or the
`NETSCRIPT_DOCS_ROOT` environment variable. A configured path that does not exist
returns a structured `docs_corpus_not_found` error naming the missing path; the
server never silently reports an empty corpus.

## Token-efficient use

Tool inputs cap result counts, and the server truncates oversized results and
command output. Start with the narrowest filter that answers the question. For
documentation, use the search-to-get funnel: call `search_docs`, choose a slug,
then call `get_doc` for that document or section.

## Data boundary

The MCP server reads NetScript telemetry, project metadata and generated
registries used for diagnostics, and public documentation. It does not return
project source code, environment-variable values, credentials, or secrets.

Telemetry requests go only to the resolved dashboard endpoint. Discovery uses, in
order, the `--endpoint` option, `NETSCRIPT_TELEMETRY_ENDPOINT`,
`ASPIRE_DASHBOARD_PORT`, and the local default `http://localhost:18888`.

`execute_command` is default-deny. Explicit rules allow selected database,
generation, contract, service-read, plugin, and UI commands. Deny rules take
priority; deployment, project initialization, marketplace operations, database
reset, plugin removal, and every unmatched command are rejected with a structured
denial before a process is started. The rule-by-rule policy lives in the
[`@netscript/mcp` reference]({{ "ref:mcp" |> xref |> url }}).

## Troubleshooting

Start with the `doctor` tool: it aggregates four check families — `telemetry`,
`aspire`, `project`, and `plugins` — into one verdict. Each check carries a
`pass`, `warn`, or `fail` status, and warnings and failures may include a
suggested fix. Reading the result:

- **`telemetry` warns or fails** — no reachable telemetry endpoint. Verify the
  app is running, then check the discovery chain: `--endpoint`,
  `NETSCRIPT_TELEMETRY_ENDPOINT`, `ASPIRE_DASHBOARD_PORT`, and the local default
  `http://localhost:18888`. Telemetry tools still respond while the endpoint is
  down — nothing crashes: `get_app_status` reports `status: "warn"` with zero
  counts, the list and analytics tools (`list_runs`, `get_recent_errors`,
  `analyze_service_performance`, `analyze_db_bottlenecks`, …) return their
  ordinary empty or zero-valued results, and `get_run` returns a structured
  `run_not_found` error.
- **`aspire` or `project` warns** — the project root is wrong or the workspace is
  missing expected markers. Confirm the `--project-root` written into your host
  configuration points at the project (re-run `netscript agent init` after moving
  a project).
- **`plugins` warns or fails** — plugin diagnostics found an issue; the
  equivalent direct command is `netscript plugin doctor`.
- **Docs tools return `docs_corpus_not_found`** — the configured `--docs-root` /
  `NETSCRIPT_DOCS_ROOT` path does not exist; fix the path or remove the override
  to fall back to the packaged corpus.
- **`execute_command` returns a denial** — the command did not match the
  allowlist (see the data boundary above); run it directly in a terminal instead.

## Reading these docs as an agent

The site you are reading ships its own agent affordances, no MCP server
required:

- **Every page has a Markdown twin.** The "View as Markdown" link near the top of
  each page points at clean Markdown distilled from the rendered page — component
  markup already resolved, links absolute — so an agent reads source-quality
  text instead of parsing HTML chrome. The twin lives at the page URL plus
  `index.md`: this page's twin is [`/ai/agent-tooling/index.md`](/ai/agent-tooling/index.md),
  and the same suffix works on any page.
- **A tiered `llms.txt`.** [`/llms.txt`](/llms.txt) is the index tier: every real
  page as an absolute canonical link with a one-line summary, grouped by section,
  plus a short note telling agents how to reach the twins.
  [`/llms-full.txt`](/llms-full.txt) is the full tier: every page's Markdown twin
  concatenated into one corpus for bulk ingestion.

The ladder, cheapest first: start at `llms.txt`, fetch the twin of the one page
you need, and reach for `llms-full.txt` only when you genuinely want everything.
And the two halves meet: point the MCP server's `--docs-root` at a checkout of
this site and `search_docs` runs over the same corpus.

## Run the protocol smoke

```bash
deno test --allow-all packages/cli/e2e/tests/agent/agent-mcp-stdio_test.ts
```

The smoke starts the public CLI binary, initializes MCP over stdio, verifies the
13-tool catalog, and checks docs, diagnostics, unreachable telemetry, and command
denial behavior.

## Where to go next

{{ comp.cardsGrid({ columns: 3, cards: [
  { eyebrow: "Reference", title: "@netscript/mcp", body: "Per-tool contracts, output bounds, and the execute_command policy of the agent-facing MCP server.", href: resolveXref("ref:mcp").href, icon: "R" },
  { eyebrow: "Reference", title: "CLI reference", body: "The task-oriented cheat-sheet for every netscript command, including agent init and agent mcp.", href: resolveXref("cli:reference").href, icon: "C" },
  { eyebrow: "Guide", title: "MCP client stack", body: "The other MCP surface: consume external MCP servers as tools inside your own product's agents.", href: "/ai/mcp/", icon: "M" }
] }) }}
