---
name: netscript-operate
description: "Monitor, debug, and analyze a running NetScript application through the NetScript MCP tools. USE FOR: is my app healthy, list recent runs, inspect one execution, find recent errors, why did a job fail, why is a service slow, database/KV bottlenecks, run diagnostics, search the docs. DO NOT USE FOR: scaffolding or changing the project (use netscript-build); Aspire dashboards or raw resource logs (use the aspire skill)."
---

# NetScript Operate

Observe a running NetScript app with bounded MCP tools. Every tool returns a summary — chain
tools, do not dump raw payloads.

## Task → tool

| Task | Tool |
|---|---|
| Is the app healthy? | `get_app_status` |
| List recent executions (jobs, saga instances, trigger firings) | `list_runs` |
| Inspect one execution end to end | `get_run` |
| Group recent application errors | `get_recent_errors` |
| Latest result for a job | `get_last_job_result` |
| Service performance stats (p50/p95, error rate, throughput) | `analyze_service_performance` |
| Rank slow/frequent DB + KV operations | `analyze_db_bottlenecks` |
| Environment + project diagnostics (no running app needed) | `doctor` |
| Search public docs | `search_docs` |
| List doc summaries | `list_docs` |
| Read one doc or section | `get_doc` |
| Discover CLI verbs | `list_commands` |
| Run one allowlisted CLI verb | `execute_command` |

## Playbooks

**Is my app healthy?**
`get_app_status` — one call summarizing services, workers, sagas, triggers, streams with state and
recent error counts. Drill into anything unhealthy with `list_runs` or `get_recent_errors`.

**A job failed — find out why.**
`get_last_job_result` (did it run, what happened) → `get_run` (the failing execution end to end) →
`get_recent_errors` (correlate with other failures in the same window).

**Service X is slow.**
`analyze_service_performance` (confirm and quantify: p95, error rate, throughput) →
`analyze_db_bottlenecks` (if latency is data-bound, rank the slowest KV/DB operations).

**Nothing responds.**
Start with `doctor` — it checks telemetry reachability, project wiring, Aspire markers, and plugin
diagnostics with pass/warn/fail and fix suggestions, and works without a running app. Fix what it
flags before re-querying telemetry tools.

## Docs funnel

`search_docs` (or `list_docs`) to find the right document → `get_doc` with a `section` to read only
the relevant part. Never fetch whole pages when a section answers the question.

## Token discipline

- Never print raw tool output to the user — summarize the bounded result.
- Chain narrow tools instead of re-running broad ones.
- Prefer `doctor` for setup problems over hand-probing endpoints.

## Boundaries

- No project mutation here — scaffold, add, and generate live in `netscript-build`.
- For Aspire dashboards, resource start/stop, and raw traces/logs, use the `aspire` skill.
