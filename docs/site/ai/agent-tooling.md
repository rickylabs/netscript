---
layout: layouts/base.vto
title: Agent tooling
description: What NetScript gives the coding agents that build your app — CLI, skills, the framework MCP server, and agent-readable docs.
templateEngine: [vento, md]
order: 5
oldUrl: /capabilities/agent-tooling/
---

# Agent tooling

This page covers what NetScript gives the coding agents that build your app, and the people pairing
with them. The rest of this section covers the AI you build into the app. Three surfaces share one
vocabulary:

- the `netscript` CLI performs direct, scriptable operations;
- installed skills explain which NetScript workflow to use and when to hand off to the CLI;
- the MCP server returns compact framework-aware diagnostics, telemetry summaries and public docs.

This documentation site is a fourth surface: every page has a Markdown twin, and the corpus is
published behind `llms.txt` (see [Reading these docs as an agent](#reading-these-docs-as-an-agent)).

Prefer the CLI when a command already expresses the operation, because it is easier to reproduce in
a terminal or CI job; the [CLI cheat sheet]({{ "cli:reference" |> xref |> url }}) maps what exists.
Use MCP for interactive investigation, especially when one framework-aware tool replaces several
telemetry queries or when an agent needs to discover a document before reading it.

> [!NOTE]
> The NetScript MCP server on this page gives a coding agent diagnostics, telemetry summaries and
> doc search about the project it is editing. The
> [`@netscript/ai/mcp` client stack](/ai/mcp/) is a separate surface that wires external MCP servers
> into your product's own agent loop. The server's per-tool contracts are in the
> [`@netscript/mcp` reference](/reference/mcp/).

## Install into a project

Set up a project for coding agents with one command:

```bash
netscript agent init
```

### Host detection

Select an agent host explicitly with `--host claude`, `--host vscode`, `--host opencode` or
`--host all` (all three). Without the flag, hosts resolve in this order, and the first source that
yields a host decides:

1. **Project markers** — an existing `.claude` directory (Claude Code), `.vscode` directory (VS
   Code), or `opencode.json`, `opencode.jsonc`, or `.opencode` (OpenCode).
2. **The invoking environment** — `CLAUDECODE` (Claude Code), `OPENCODE` or any `OPENCODE_*`
   variable (OpenCode), and a VS Code-family terminal (`TERM_PROGRAM=vscode`, `VSCODE_*`, or
   `CURSOR_*`).
3. **The default** — Claude Code.

The command prints the decision, for example
`Agent hosts: opencode (from environment: OPENCODE).`, followed by the editor decision. It prints
variable names only, never their values.

### Editor configuration

`--editor none|zed|vscode` is a separate, shared target: it applies the Deno editor setup that
`netscript init` offers to an existing project and adds native MCP wiring.
When omitted, one existing `.zed` or `.vscode` directory is honoured; if both exist, select
explicitly. With neither directory, the editor whose integrated terminal launched the command is
used: `TERM_PROGRAM` first, because each terminal rewrites it, then `ZED_TERM` (Zed), then
`VSCODE_*` or `CURSOR_*` (VS Code). Unsupported editor names fail with the supported list and
instructions to use `--editor none` plus a manual MCP configuration.

> [!CAUTION]
> Zed runs project MCP configuration only after you trust the worktree. Review the generated
> commands before you enable project settings.

Re-running with the same editor is idempotent and keeps unrelated MCP servers and settings alongside
the NetScript entries.

### Offline documentation

If network lookup is unavailable or the framework is unfamiliar, add `--with-docs`. This opt-in
expands a several-megabyte local corpus containing the release-built prose and task router plus
`deno doc` output for every export subpath of each exact NetScript package version found in the
project. Version disagreement or a failed documentation command aborts before the local docs tree
is written; without the flag, no offline corpus is installed. When the bundle is installed, every
generated host command receives the same absolute `--docs-root <project>/.netscript/docs` pair.

### Files written

Every host receives the canonical NetScript skill bundle under `.agents/skills/` and a marked
NetScript section in `AGENTS.md`. Host and editor targets add only their own integration files:

| Host or editor target | Additional files written |
| --- | --- |
| Claude Code host | `.mcp.json`, the single discovery bridge `.claude/skills/repo-skills/SKILL.md`, and `CLAUDE.md` with an `@AGENTS.md` import |
| VS Code editor | `.vscode/mcp.json`, `.netscript/schema/config-file.v1.json`, `.vscode/settings.json`, `.vscode/extensions.json`, `.vscode/launch.json`, `.vscode/tasks.json` |
| Zed editor | `.zed/settings.json` with `context_servers`, `.zed/debug.json`, `.zed/tasks.json`, `.netscript/schema/config-file.v1.json` |
| OpenCode host | `opencode.json` (or an existing `opencode.jsonc`) with `netscript` and `aspire` local MCP servers, the `deno lsp` language server, and the `deno fmt` formatter |

The generated MCP configuration runs `netscript agent mcp` for the current project. Re-running
`agent init` is idempotent: unchanged files are left alone, and existing host configuration is kept
alongside the `netscript` server entry.

OpenCode reads `opencode.json` from the project root and never reads `.mcp.json`, so it gets its own
writer:

- Each MCP server entry carries an explicit `timeout` (180 s for `netscript`, 120 s for `aspire`),
  because OpenCode's 5-second default does not cover a cold-cache JSR resolve.
- OpenCode leaves language servers and formatters off when `lsp` and `formatter` are omitted, and
  ships no Deno formatter, so the file also declares `lsp.deno` and `formatter.deno`. An existing
  `deno` entry and an explicit `false` are kept, including one inherited from `opencode.json` when
  the wiring goes into `opencode.jsonc`.
- OpenCode discovers `.agents/skills/` itself, so no extra skill tree is written for it.
- Both project files are read as JSONC and edited in place, so comments, trailing commas and
  unrelated settings survive. OpenCode merges both files and lets `opencode.jsonc` override
  `opencode.json`, so an existing `opencode.jsonc` receives the full wiring. A `netscript` or
  `aspire` server already declared in `opencode.json` is refreshed too, which keeps the effective
  command current. A malformed file stops `agent init` before it writes anything.

The host command includes the absolute project `deno.json` path. Deno 2.9 normally holds newly
published registry versions behind a 24-hour minimum dependency age. The generated JSR workspace
keeps that policy and excludes only exact-version packages in the matching NetScript release train,
so a newly released `@netscript/cli` MCP server starts immediately without changing the age policy
for third-party dependencies.

### Skills and `AGENTS.md`

Claude's bridge directs the agent to read skills from the authoritative `.agents/skills/` tree and
resolve bundled references there. A new `CLAUDE.md` starts with `@AGENTS.md`; an existing file
receives the import and the Claude-specific named-skill routing line once, with its content kept.
Upstream Aspire workflow skills are installed only in the standard `.agents/skills/` location, so
initialization creates no skill mirrors. Existing legacy mirrors and custom Claude skills are left
in place, and initialization warns when known legacy skill directories are present, because they are
no longer refreshed.

The marked `AGENTS.md` section makes MCP the default surface for NetScript work. When no
`netscript` MCP tools are listed, it tells the agent to call MCP `doctor` if the server is up, or
otherwise to run `netscript plugin doctor` from the shell (there is no bare `netscript doctor`). The
agent then re-runs `netscript agent init --host <host>` and restarts its host. Skills are named by
their registered name ("call the `netscript` skill"), and hosts that register those names load them
through their skill tool. On Claude Code, call the `repo-skills` bridge with the requested skill
name; the bridge permits reading `.agents/skills/<name>/SKILL.md` and its bundled references.

Before unfamiliar NetScript API or architecture work, call `find_guidance` with the task you intend
to complete and follow its ordered citations. Use `search_docs` for literal lookup and `get_doc` for
exact retrieval of a known document or section.

## Run the server

The generated host configuration runs `netscript agent mcp`, which starts the MCP server over
stdin/stdout. An MCP client launches this command; do not run it by hand. When stdin is an
interactive terminal, the command exits after it shows copyable Zed and VS Code configuration. When
stdin is piped, it writes no human-facing output that could corrupt the JSON-RPC stream.

| Flag                    | Purpose                                                                                       |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| `--project-root <path>` | NetScript project root used for execution and doctor flows. `agent init` writes this for you. |
| `--endpoint <url>`      | Telemetry endpoint URL; overrides discovery (below). Only `http:` and `https:` are accepted.  |
| `--docs-root <path>`    | Public documentation root for the docs tools; overrides the default corpus (below).           |

## What the server exposes

Twenty-six tools, each returning a bounded structured result, grouped by what an agent is trying to
do:

| Task | Tools | What they do |
| --- | --- | --- |
| Read the running app | `get_app_status`, `list_runs`, `get_run`, `get_recent_errors`, `get_last_job_result`, `analyze_service_performance`, `analyze_db_bottlenecks` | Seven telemetry read models; each replaces a handful of raw telemetry queries with one aggregate answer. |
| Diagnose the project | `doctor` | Aggregates telemetry reachability, Aspire markers, project wiring and plugin diagnostics into one verdict. The plugin slice has a direct twin in `netscript plugin doctor`. |
| Use the docs | `find_guidance`, `search_docs`, `list_docs`, `get_doc` | `find_guidance` returns ordered section-level guidance and cited code for a natural-language task; the other three keep the literal search-to-get funnel over the [documentation corpus](#documentation-corpus). |
| Discover exports | `find_export`, `list_package_exports`, `get_export`, `search_exports` | Locate package subpaths, page through package surfaces, return one bounded signature/JSDoc block, and find related helpers by partial name or declaration shape. |
| Bridge to the CLI | `list_commands`, `execute_command` | `list_commands` discovers the current command tree (the machine-readable twin of `netscript --help`); `execute_command` runs an allowlisted `netscript …` command with policy checking, timeout handling and a bounded output tail. |
| Record drift | `record_drift` | Appends an evidence-gated entry to the project drift log (`.netscript/agent/drift.jsonl`) when a fresh successful diagnostic receipt authorizes it. |
| Discover UI registry items | `list_registry_items`, `search_registry_items`, `view_registry_item`, `get_registry_add_command` | Inspect built-in or app-configured registries and obtain installation arguments without executing an install. |
| Inspect service APIs | `list_api_services`, `list_service_operations`, `get_operation_schema` | Expose live OpenAPI contracts before an agent guesses with curl. |

The per-tool schemas, output bounds and the full `execute_command` policy are in the
[`@netscript/mcp` reference]({{ "ref:mcp" |> xref |> url }}).

## Documentation corpus

The server selects its documentation in a fixed order: explicit `--docs-root <path>`, then
`NETSCRIPT_DOCS_ROOT`, then an indexable `<project>/.netscript/docs` bundle, then the generated
release-matched embedded corpus. The embedded fallback contains the bounded quickstart,
contract-to-page, service, builder, and route golden paths plus the MCP README and CLI help. An
empty, redirect-only, or otherwise non-indexable project bundle falls back to embedded; an invalid
explicit or environment root returns `docs_corpus_not_found` instead of hiding the operator error.

`list_docs` reports the selected corpus as `{ kind, root, documentCount }` alongside its bounded
`docs` rows. A filesystem selection reports the resolved root; embedded reports `root: null`, so an
agent or measured run can see that it is using the fallback instead of inferring degradation from
search results.

The export tools use a different, package-embedded corpus generated from Deno 2.9
`deno doc --json`. It is version- and hash-pinned, needs no project `docs/` directory, and returns
only bounded symbol records rather than generated files. Start with `find_export` when you know the
exact symbol, `list_package_exports` when exploring a package, `get_export` for one declaration,
or `search_exports` when you only know part of the helper name or its shape.

## Token-efficient use

Tool inputs cap result counts, and the server truncates oversized results and command output.
Start with the narrowest filter that answers the question. For documentation, call `search_docs`,
choose a slug, then call `get_doc` for that document or section.

## Data boundary

The MCP server reads NetScript telemetry, project metadata and the generated registries used for
diagnostics, public documentation and the package-embedded public export corpus. It does not return
project source code, environment-variable values, credentials or secrets.

Telemetry requests go only to the resolved dashboard endpoint. Discovery uses, in order, the
`--endpoint` option, `NETSCRIPT_TELEMETRY_ENDPOINT`, `ASPIRE_DASHBOARD_PORT` then a built-in fallback. That fallback does not follow an allocated dashboard port. Pass the
actual URL Aspire prints through `--endpoint` or `NETSCRIPT_TELEMETRY_ENDPOINT`.

`execute_command` is default-deny. Explicit rules allow selected database, generation, contract,
service-read, plugin and UI commands. Deny rules take priority: deployment, project initialization,
marketplace operations, database reset, plugin removal and every unmatched command are rejected with
a structured denial before a process starts. The rule-by-rule policy is in the
[`@netscript/mcp` reference]({{ "ref:mcp" |> xref |> url }}).

## Troubleshooting

Start with the `doctor` tool. It aggregates four check families (`telemetry`, `aspire`, `project`
and `plugins`) into one verdict. Each check carries a `pass`, `warn` or `fail` status, and warnings
and failures may include a suggested fix.

| Result | What to do |
| --- | --- |
| `telemetry` warns or fails | No telemetry endpoint is reachable. Check that the app is running, then check the discovery chain: `--endpoint`, `NETSCRIPT_TELEMETRY_ENDPOINT`, `ASPIRE_DASHBOARD_PORT` then a built-in fallback that may not match the current run. Set `--endpoint` to the URL Aspire prints. While the endpoint is down, telemetry tools still respond: `get_app_status` reports `status: "warn"` with zero counts, the list and analytics tools return empty or zero-valued results, and `get_run` returns a structured `run_not_found` error. |
| `aspire` or `project` warns | The project root is wrong or the workspace is missing expected markers. Confirm that the `--project-root` in your host configuration points at the project, and re-run `netscript agent init` after you move a project. |
| `plugins` warns or fails | Plugin diagnostics found an issue; the equivalent direct command is `netscript plugin doctor`. |
| Docs tools return `docs_corpus_not_found` | The configured `--docs-root` or `NETSCRIPT_DOCS_ROOT` path does not exist. Fix the path, or remove the override to fall back to the packaged corpus. |
| `execute_command` returns a denial | The command did not match the allowlist (see [Data boundary](#data-boundary)). Run it in a terminal instead. |

## Reading these docs as an agent

This site serves agents without an MCP server:

- **Every page has a Markdown twin.** The "View as Markdown" link near the top of each page points
  at clean Markdown distilled from the rendered page, with component markup resolved and links
  absolute. The twin lives at the page URL plus `index.md`: this page's twin is
  [`/ai/agent-tooling/index.md`](/ai/agent-tooling/index.md).
- **A tiered `llms.txt`.** [`/llms.txt`](/llms.txt) is the index tier. It starts with a task router
  that maps your goal to a reading order (manual → generated scaffold → `deno doc` symbol lookup),
  then lists every real page as an absolute canonical link with a one-line summary, grouped by
  section, plus a note on how to reach the twins. [`/llms-full.txt`](/llms-full.txt) is the full
  tier: every page's Markdown twin concatenated into one corpus.

Start at `llms.txt`, fetch the twin of the one page you need, and fetch `llms-full.txt` only when
you need everything. To search the same corpus over MCP, point the server's `--docs-root` at a
checkout of this site.

## Run the protocol smoke

```bash
deno test --allow-all packages/cli/e2e/tests/agent/agent-mcp-stdio_test.ts
```

The smoke starts the public CLI binary, initializes MCP over stdio, verifies the tool catalog, and
checks docs, exports, diagnostics, unreachable telemetry and command denial.

## Next steps

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

Look up each tool's contract and output bounds in the
[`@netscript/mcp` reference]({{ "ref:mcp" |> xref |> url }}).

- The [CLI cheat sheet]({{ "cli:reference" |> xref |> url }}) covers `agent init`, `agent mcp` and
  every other command.
- The [MCP client stack](/ai/mcp/) consumes external MCP servers inside your own product's agents.
