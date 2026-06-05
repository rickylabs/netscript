---
name: aspire
description: >
  Operate NetScript Aspire AppHosts with the Aspire CLI. Use when starting,
  stopping, describing, waiting on, debugging, or updating Aspire resources;
  running generated CLI scaffold smoke projects; inspecting Aspire logs,
  traces, docs, integrations, or MCP tools; or validating AppHost resource
  graphs. Do not use for non-Aspire .NET apps, container-only deployments, or
  cloud deployment after local Aspire validation.
---

# Aspire Skill

This repository uses Aspire to orchestrate distributed apps. AppHosts may be TypeScript
(`aspire/apphost.ts`) or .NET (`apphost.cs`) depending on the workspace being tested.

For CLI scaffold E2E work, generated projects usually live under
`.llm/tmp/cli-e2e/<project>/aspire/apphost.ts`. Use `--apphost <path>` when the AppHost is not the
current directory.

## CLI command reference

| Task                            | Command                                            |
| ------------------------------- | -------------------------------------------------- |
| Start the app                   | `aspire start`                                     |
| Start isolated (worktrees/E2E)  | `aspire start --isolated`                          |
| Restart the app                 | `aspire start` (stops previous automatically)      |
| Wait for resource healthy       | `aspire wait <resource>`                           |
| Stop the app                    | `aspire stop`                                      |
| List resources                  | `aspire describe` or `aspire resources`            |
| Run resource command            | `aspire resource <resource> <command>`             |
| Start/stop/restart resource     | `aspire resource <resource> start                  |
| Rebuild a .NET project resource | `aspire resource <resource> rebuild`               |
| View console logs               | `aspire logs [resource]`                           |
| View structured logs            | `aspire otel logs [resource]`                      |
| View traces                     | `aspire otel traces [resource]`                    |
| Logs for a trace                | `aspire otel logs --trace-id <id>`                 |
| Add an integration              | `aspire add`                                       |
| List running AppHosts           | `aspire ps`                                        |
| Update AppHost packages         | `aspire update`                                    |
| Search docs                     | `aspire docs search <query>`                       |
| Get doc page                    | `aspire docs get <slug>`                           |
| List doc pages                  | `aspire docs list`                                 |
| Environment diagnostics         | `aspire doctor`                                    |
| List resource MCP tools         | `aspire mcp tools`                                 |
| Call resource MCP tool          | `aspire mcp call <resource> <tool> --input <json>` |

Most commands support `--format Json` for machine-readable output. Use `--apphost <path>` to target
a specific AppHost.

## Key workflows

### Running in agent environments

Use `aspire start` to run the AppHost in the background. When working in a git worktree or generated
E2E project, use `--isolated` to avoid port conflicts and to prevent sharing user secrets or other
local state with other running instances:

```bash
aspire start --isolated
```

Use `aspire wait <resource>` to block until a resource is healthy before interacting with it:

```bash
aspire start --isolated
aspire wait myapi
```

Always stop an AppHost you started before handing work back:

```bash
aspire stop --apphost <path> --non-interactive --nologo
```

### Applying code changes

Choose the right action based on what changed:

| What changed                                | Action                                          | Why                                                 |
| ------------------------------------------- | ----------------------------------------------- | --------------------------------------------------- |
| AppHost project (`apphost.cs`/`apphost.ts`) | `aspire start`                                  | Resource graph changed; full restart required       |
| Compiled .NET project resource              | `aspire resource <name> rebuild`                | Rebuilds and restarts only that resource            |
| Interpreted resource (JavaScript, Python)   | Typically nothing — most run with file watchers | Restart the resource if no watch mode is configured |

Do not restart the entire AppHost just because a single resource changed. Use
`aspire resource <name> rebuild` for .NET project resources; it coordinates stop, build, and restart
for that resource. Use `aspire describe --format Json` to check which commands a resource supports.

### Debugging issues

Before making code changes, inspect the app state:

1. `aspire describe --format Json` - check resources, endpoints, commands, and health.
2. `aspire otel logs <resource>` - view structured logs.
3. `aspire logs <resource>` - view console output.
4. `aspire otel traces <resource>` - view distributed traces.

### Adding integrations

Use `aspire docs search` to find integration documentation, then `aspire docs get` to read the full
guide. Use `aspire add` to add the integration package to the AppHost.

After adding an integration, restart the app with `aspire start` for the new resource to take
effect.

### Using resource MCP tools

Some resources expose MCP tools (e.g. `WithPostgresMcp()` adds SQL query tools). Discover and call
them via CLI:

```bash
aspire mcp tools                                              # list available tools
aspire mcp tools --format Json                                # includes input schemas
aspire mcp call <resource> <tool> --input '{"key":"value"}'   # invoke a tool
```

## NetScript Rules

- Start with `aspire describe` or `aspire ps` if an AppHost may already be running.
- Use `aspire start --isolated` in worktrees and E2E generated projects.
- To restart, run `aspire start` again; it automatically stops the previous instance.
- Do not use `aspire run` for agent workflows.
- Only restart the AppHost when AppHost code changes. For .NET project resources, use
  `aspire resource <name> rebuild` instead.
- Use `--isolated` when working in a worktree.
- Avoid persistent containers early in development to prevent state management issues.
- Never install the Aspire workload; it is obsolete.
- For Aspire API reference and documentation, prefer `aspire docs search <query>` and
  `aspire docs get <slug>` over searching NuGet package caches or XML doc files. The CLI provides
  up-to-date content from aspire.dev.
- Prefer `aspire.dev` and `learn.microsoft.com/microsoft/aspire` for official documentation.

## Playwright CLI

If configured, use Playwright CLI for functional testing of resources. Get endpoints via
`aspire describe`. Run `playwright-cli --help` for available commands.
