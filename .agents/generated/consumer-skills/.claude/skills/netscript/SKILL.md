---
name: netscript
description: "Router for operating and building NetScript applications. USE FOR: scaffold a NetScript app, add services/plugins/UI, run the database lifecycle, monitor services/jobs/sagas/triggers/streams, debug a failing run, analyze service or database performance, search NetScript documentation. DO NOT USE FOR: generic Deno language/tooling questions (use the Deno docs); Aspire orchestration, dashboards, or resource graph specifics (use the aspire skill); non-NetScript projects. INVOKES: the `netscript` CLI and the NetScript MCP tools (get_app_status, list_runs, get_run, doctor, search_docs, list_commands, execute_command, ...)."
---

# NetScript Skill (router)

NetScript ships one version-locked agentic surface: the `netscript` CLI, the NetScript MCP
tools, and these skills share one vocabulary. This router only dispatches — **it is not useful
alone.** Pick a workflow skill below and follow its tables.

## Routing

| The task is about... | Go to |
|---|---|
| Scaffold, add resources, database lifecycle, generators — changing the project | `netscript-build` |
| Health, failing runs, slow services, error triage, docs lookup — observing the project | `netscript-operate` |

## CLI vs MCP

- **Prefer the CLI** when a CLI verb covers the task (scaffold, add, generate, migrate, seed).
  Mutations must behave exactly like a user-run command.
- **Use MCP tools** for telemetry-heavy or interactive loops: monitoring, debugging, performance
  analysis, and documentation search, where one bounded call replaces many token-heavy queries.
- Discover the real verb surface at runtime with the `list_commands` MCP tool rather than guessing
  flags; run allowlisted verbs through `execute_command`.

## Hand-offs

| Need | Skill |
|---|---|
| Aspire start/stop, dashboard, resource graph, raw traces/logs | the `aspire` skill |
| Generic Deno runtime / tooling questions | Deno documentation |

NetScript's MCP layer is framework-semantic (jobs, sagas, triggers, streams, workers, docs, CLI
verbs); it rides above Aspire's generic MCP, it does not replace it.
