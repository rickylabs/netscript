---
name: aspire
description: 'Diagnoses and operates Aspire distributed applications with the Aspire CLI — resource state, health reports, console logs, structured logs, spans and traces. USE FOR: a resource says Healthy but does not respond, an endpoint times out, a request fails and you do not know which service, the AppHost vanished, a resource is stuck Waiting/Starting, finding the port a resource actually bound, reading logs or traces, restarting one resource, aspire start/stop/describe/logs/otel/export/wait. DO NOT USE FOR: non-Aspire .NET apps (use dotnet CLI), container-only deployments (use docker/podman). INVOKES: aspire describe, aspire logs, aspire otel logs|spans|traces, aspire ps, aspire export, aspire resource, aspire wait, aspire doctor, aspire docs, bash. FOR SINGLE OPERATIONS: run the Aspire CLI command directly.'
---

# Aspire Skill

This repository uses Aspire to orchestrate its distributed application. Resources are defined in the
AppHost (`aspire/apphost.mts`, or `apphost.cs` in .NET projects).

The Aspire CLI is a **diagnostic instrument**, not just a launcher. Statements explicitly tagged
with a `V17-*` evidence key were verified against **Aspire CLI 17.0.0**; other operational guidance
is not a blanket certification. The evidence keys link to recorded fixtures at the end of this
skill. When something misbehaves, ask the CLI before touching application code. **Rule zero:
`Healthy` is not proof.**

## CLI command reference

Append `--non-interactive --nologo` to every command in an agent session: no spinners, no banners,
no prompts, parseable output. Add `--format Json` when you need fields rather than a table.

| Task                                                | Command                                                                      |
| --------------------------------------------------- | ---------------------------------------------------------------------------- |
| Start (or restart — it stops the previous instance) | `aspire start`                                                               |
| Start isolated (worktrees, parallel agents)         | `aspire start --isolated`                                                    |
| Stop one exact AppHost                              | `aspire stop --apphost <exact-AppHost-path>`                                 |
| Force-stop one orphaned AppHost                     | `aspire stop --apphost <exact-AppHost-path> --force`                         |
| Running AppHosts + dashboard URL + PID + log path   | `aspire ps --format Json` (V17-PS)                                           |
| Resource state, URLs, env, health reports           | `aspire describe [<resource>] --format Json` (V17-DESCRIBE)                  |
| Resource-state alias                                | `aspire resources [<resource>] --format Json`                                |
| Include Aspire infra resources · stream changes     | `aspire describe --include-hidden` · `--follow` (V17-FOLLOW)                 |
| Wait for a resource                                 | `aspire wait <resource> --status healthy --timeout 60`                       |
| **Console logs (stdout/stderr)**                    | `aspire logs <resource> -n 200 -t` · `aspire logs --follow`                  |
| **Structured logs**                                 | `aspire otel logs [<resource>] --severity Error -n 100`                      |
| **Spans**                                           | `aspire otel spans [<resource>] --has-error`                                 |
| **Traces**                                          | `aspire otel traces [<resource>] --has-error`                                |
| Everything for one trace                            | `aspire otel spans --trace-id <id>` · `aspire otel logs --trace-id <id>`     |
| Capture resources + logs + telemetry to a zip       | `aspire export -o /tmp/aspire.zip`                                           |
| Start/stop/restart one resource                     | `aspire resource <resource> start\|stop\|restart`                            |
| Environment diagnostics                             | `aspire doctor --format Json` (V17-DOCTOR)                                   |
| Restore AppHost SDK + deps                          | `aspire restore`                                                             |
| Add an integration / list AppHost files             | `aspire add` · `aspire ls`                                                   |
| Docs                                                | `aspire docs search <query>` · `aspire docs get <slug>` · `aspire docs list` |
| TypeScript API docs                                 | `aspire docs api search <query> --language typescript`                       |
| Resource-exposed MCP tools                          | `aspire mcp tools` · `aspire mcp call <resource> <tool> --input <json>`      |

`--apphost <path>` targets a specific AppHost when several run. There is no `aspire exec`.
`aspire resources` is an alias of `aspire describe`; singular `aspire resource` still operates one
resource.

## Rule zero: `Healthy` is not proof

`healthStatus` is inferred from **process/container state** unless a health check is registered. A
resource with no health checks reports `Healthy` the moment its process is alive — before it binds a
port, and while every request to it times out.

The proof is in `healthReports`:

```bash
aspire describe --format Json --non-interactive --nologo \
  | jq -r '.resources[] | "\(.displayName)\t\(.state)\t\(.healthStatus)\treports=\(.healthReports|length)"'
```

```
dashboard     Running  Healthy  reports=0   <- nothing was ever checked
streams       Running  Healthy  reports=0   <- nothing was ever checked
postgres      Running  Healthy  reports=1   <- postgres_check actually ran
hookline-db   Running  Healthy  reports=2   <- hookline-db_check, postgres_check
```

**`healthReports: {}` means no check ran.** In exactly this state the `dashboard` resource
advertised `http://localhost:42719` and every request timed out for ~30s while the label stayed
`Healthy`. Treat `reports=0` as _unknown_ and go get evidence.

## Diagnose by symptom

### "It says Healthy but nothing responds"

```bash
aspire describe <resource> --format Json --non-interactive --nologo   # healthReports, state, urls, environment
aspire logs <resource> -n 200 -t --non-interactive --nologo           # the most under-used command there is
aspire otel logs <resource> --severity Error --dashboard-url "$DASH" --non-interactive --nologo
```

`aspire logs` is console stdout/stderr exactly as the process wrote it — dev-server banners, bind
errors, stack traces. It works even when telemetry does not, because it arrives over the AppHost
backchannel rather than the dashboard. `--format Json` yields `{resourceName, content, isError}`;
`isError: true` marks stderr.

`aspire otel logs --severity Error` finds silent crashes. On a run where every resource read
`Healthy`, it surfaced a full `initializeKv` stack trace and a
`PostgreSQL is NOT reachable at localhost:5432` banner that no status column mentioned.

Two common non-bugs: a dev server (Vite, Next) still doing its first compile times out for tens of
seconds while `Healthy` — retry before debugging; and the URL in `describe` is a proxy that forwards
only once the target binds. If neither log source explains it, probe the port the resource actually
bound (next-but-one section).

### "A request fails and I do not know which service"

Follow one request end to end:

```bash
aspire otel traces --has-error --format Json --non-interactive --nologo -n 10   # 1. which traces failed
aspire otel spans  --trace-id <traceId> --non-interactive --nologo              # 2. every span, in order
aspire otel logs   --trace-id <traceId> --non-interactive --nologo              # 3. log lines inside it
```

A span carries `traceId`, `spanId`, `parentSpanId`, `kind` (`Server`/`Client`/`Internal`), `name`,
`source` (the emitting resource), `status`, `statusMessage`, `durationMs`, and `attributes`
(`http.request.method`, `url.full`, `url.path`, `http.response.status_code`, `error.type`). Chain
`parentSpanId` → `spanId` for the call graph; `source` changes at each hop, so a `Client` span in
service A next to a `Server` span in service B _is_ the network boundary. The failing span is the
deepest one with `status: Error` — its `url.full` and `error.type` name the exact call that broke.

Structured log records carry `traceId` and `spanId`, so you can go the other way: find an error line
with `aspire otel logs --severity Error --format Json`, take its `traceId`, replay the whole
request. Every trace and span also ships a `dashboardUrl` deep link.
`aspire otel logs --trace-id <id>` printing `No logs found` is normal — that trace emitted spans but
no correlated log records.

### "`aspire otel` says the dashboard is not available"

On a detached AppHost, bare `aspire otel logs` can exit non-zero when the dashboard URL is
unavailable to the command, while passing the recorded URL with `--dashboard-url` succeeds. Pass the
URL explicitly.

```bash
DASH=$(aspire ps --format Json --non-interactive --nologo | jq -r '.[0].dashboardUrl')
aspire otel traces --dashboard-url "$DASH" --non-interactive --nologo
```

**Never conclude telemetry is unavailable until you have retried with `--dashboard-url`.** The URL
is also in `aspire describe aspire-dashboard --include-hidden --format Json`. `--api-key` exists for
dashboards with API-key auth.

### "Something answers the URL, but is it mine?"

`describe` advertises the endpoint the AppHost _intended_. If a fixed port was already taken by a
foreign process, Aspire logs nothing, the URL still appears, and the foreign process answers —
healthily — with somebody else's application. Reproduced here: `streams` advertised
`http://localhost:4437`; stopping the resource left `4437` still returning
`{"status":"healthy","version":"1.0.0"}` while the real service on its own port went dark.

```bash
aspire describe <resource> --format Json --non-interactive --nologo \
  | jq '.resources[0] | {url: [.urls[].url], port: .environment.PORT, pid: .properties["executable.pid"]}'
# => {"url":["http://localhost:4437"], "port":"42117", "pid":552186}

ss -ltnp | grep -E ':(4437|42117) '
# 42117 -> deno pid 552186  == the resource's own pid  -> yours
# 4437  -> no listener at all, yet curl answers        -> foreign / out-of-namespace process
```

**`urls[].url` is the Aspire (DCP) proxy port; `environment.PORT` is the port the app itself bound**
— they differ. A proxy port owned by `dcp` in front of the resource's own PID is genuinely yours. A
port that responds with **no listener** `ss`/`lsof` can attribute is not in your process tree — on
WSL usually a Windows-side or other-namespace process; compare an identity field (`/health`,
`/version`) against the resource's own port to confirm. `aspire start --isolated` randomizes ports
and removes this failure class entirely.

### "A resource will not start, or is stuck Waiting/Starting"

`Waiting` means an upstream dependency has not gone healthy — fix the dependency, not the resource.
Watch the graph converge instead of polling: `aspire describe --follow`, or block on one resource
with `aspire wait <resource> --status healthy --timeout 60`.

For a stopped resource, `state` becomes `Finished`, `healthStatus` becomes `null`, and `exitCode` +
`stopTimestamp` populate (`exitCode: -1` = killed). `aspire logs <resource>` retains the dead
process's output — read it before restarting.

### "The AppHost is gone"

`aspire ps --format Json --non-interactive --nologo` returning an empty array means nothing is
running — something stopped it (another `aspire start`, the host-wide stop mode, or a tool that
takes over the AppHost's port, e.g. a database CLI command). When one _is_ running it returns
`appHostPath`, `appHostPid`, `cliPid`, `sdkVersion`, `dashboardUrl` and **`logFilePath`** — the
AppHost's own log, which explains startup and shutdown when resource logs cannot. (V17-PS)

With no AppHost running, command output may be informational rather than a health verdict. Check
`aspire ps` first.

### "`aspire restore` / `aspire start` is hanging"

Cold start and restore times vary with NuGet/Deno cache warmth and container image pulls; treat
prior measurements as bounded observations, not portable guarantees. Before waiting out a
multi-minute operation, run `aspire doctor --format Json --non-interactive --nologo` (container
runtime, SDK, certs, WSL integration) and `docker ps`.

### Capture everything before you lose it

Use `aspire export --help` to inspect the current export options before capturing an intermittent
failure or preparing a handoff.

## Search and filter syntax

Search grammar differs across console logs and structured telemetry commands. Run the relevant
`aspire logs --help` or `aspire otel logs|spans|traces --help` before composing filters.

## Aspire MCP tools

The Aspire MCP server is launched in AppHost mode as `aspire agent mcp`; that exact argv was
observed in the **Aspire 17.0.0** JSON-RPC capture. For dashboard-only mode, use
`aspire agent mcp --dashboard-url <dashboard-url>`; add `--api-key <api-key>` only when that
dashboard requires API-key authentication. (V17-MCP-STATIC) It exposes the same data without shelling
out. **It is often not connected** — if these tools are absent from your tool list, use the CLI. The
Aspire 17.0.0 static receipt observed these 15 tools (V17-MCP-STATIC):

| Tool                                           | Args                                       | Use it for                                                   |
| ---------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------ |
| `list_resources`                               | —                                          | state, health, `health_reports`, urls, commands (snake_case) |
| `wait_for_resources`                           | `resourceNames`, `status`, `timeout`       | wait for resources to reach target state or health           |
| `list_console_logs`                            | `resourceName`, `search`                   | why a resource is not running                                |
| `list_structured_logs`                         | `resourceName`, `search`                   | errors carrying `trace_id`/`span_id`                         |
| `list_traces`                                  | `resourceName`, `search`                   | which traces failed                                          |
| `list_trace_structured_logs`                   | `traceId`, `search`                        | drill into one trace                                         |
| `execute_resource_command`                     | `resourceName`, `commandName`, `arguments` | start/stop/restart a resource                                |
| `list_apphosts` / `select_apphost`             | — / `appHostPath`                          | disambiguate multiple AppHosts                               |
| `doctor`, `list_integrations`, `refresh_tools` | —                                          | environment checks, integrations, surface refresh            |
| `search_docs`, `get_doc`, `list_docs`          | `query` / `slug`                           | aspire.dev documentation                                     |

The required **Aspire 17.0.0** baseline is the 15 tools above. `get_integration_docs` is documented
upstream but was unobserved in the 17.0.0 capture; its absence and later appearance are
informational, not a smoke-gate failure. (V17-MCP-STATIC)

There is no MCP tool for spans — use `aspire otel spans` for span-level detail. **Use the CLI over
MCP when you need environment variable values:** `list_resources` returns env var _names with null
values_ (redacted), so `PORT` — the field that proves which port a resource actually bound — is
available only from `aspire describe --format Json`. `aspire mcp tools` / `aspire mcp call` are
unrelated: they list MCP tools that **resources** expose (e.g. `WithPostgresMcp()` adds SQL query
tools), and report `No resources with MCP tools found` when none do.

## Applying code changes

| What changed                              | Action                           | Why                                               |
| ----------------------------------------- | -------------------------------- | ------------------------------------------------- |
| AppHost (`apphost.mts`/`apphost.cs`)      | `aspire start`                   | Resource graph changed; full restart required     |
| Compiled .NET project resource            | `aspire resource <name> rebuild` | Rebuild + restart that resource only              |
| Interpreted resource (TypeScript, Python) | usually nothing — file watchers  | `aspire resource <name> restart` if no watch mode |

**Never restart the whole AppHost because one resource changed.** Which commands a resource supports
is data, not a guess — `jq -r '.resources[] | "\(.displayName)\t\(.commands|keys|join(","))"'` over
`aspire describe --format Json`. Executables and containers typically expose only `restart,stop`
(and `start` once stopped); `rebuild` exists only on .NET project resources. Calling a command a
resource lacks fails loudly: `Command 'rebuild' not available for resource 'users'.`

## Important rules

- **Never kill an `aspire agent mcp` process.** Those are the session's MCP servers, not stray
  AppHosts.
- **`Healthy` with `healthReports: {}` is not evidence.** Get console logs, structured logs, or a
  probe against the resource's own port.
- **To restart, just run `aspire start` again** — it stops the previous instance. Never
  `aspire stop` then `aspire run`, and never `aspire run` in an agent session (it is
  interactive/foreground).
- **Use `--isolated`** in worktrees or when another agent may be running.
- **Clean up only the AppHost you started**: take its exact `appHostPath` from `aspire ps`, then run
  `aspire stop --apphost <exact-AppHost-path> --non-interactive --nologo`. Use
  `aspire resource <name> stop` when targeted cleanup is enough, then check `docker ps`. The
  host-wide `aspire stop` mode with `--all` is both unsafe and unreliable on a shared host: it has
  reported `No running AppHost found` and exited 0 while processes rooted at the AppHost survived.
  Three independent agents observed that failure in one night. `dcp` helper processes take ~20s to
  exit after a scoped stop returns, so re-check rather than killing them. Leave pre-existing
  containers alone — Aspire reuses persistent ones and deleting them destroys another session's
  data.
- **Use `--force` only for the exact orphan you own.** Aspire 17.0.0 automatically removes an
  orphaned launcher registration after its process dies; if it persists, scoped
  `aspire stop --apphost <path> --force` clears it without broad host cleanup.
- **Prefer `aspire logs` / `aspire otel` over hand-rolled `curl` probing.** A `curl` timeout tells
  you nothing about why; the failing span names the exact call that broke.
- **Prefer `aspire docs search <query>` / `aspire docs get <slug>`** over searching package caches;
  it serves current content from aspire.dev.
- **Avoid persistent containers** early in development, and **never install the Aspire workload** —
  it is obsolete.

## Playwright CLI

If configured, use Playwright CLI for functional testing of resources. Get endpoints from
`aspire describe --format Json` — and verify the port is yours, per above — rather than assuming a
default. Run `playwright-cli --help` for available commands.

## 17.0.0 evidence

Verified against `Aspire.Cli 17.0.0` recorded contract captures:

- V17-MCP-STATIC: 15-tool `aspire agent mcp` JSON-RPC surface (`wait_for_resources` added)
- V17-DOCTOR: `aspire doctor --format Json` output shape
- V17-DESCRIBE: `aspire describe --format Json` PostgreSQL + Deno resource snapshot
- V17-FOLLOW: `aspire describe --follow --format Json` NDJSON transition stream
- V17-TELEMETRY: Aspire dashboard `/api/telemetry/{resources,spans}` payload shape
- V17-PS: `aspire ps --format Json` running AppHost descriptor (`sdkVersion: "17.0.0"`)

### Upstream cleanup of networks and anonymous volumes (issue #1855)

Stopping an AppHost — `aspire stop`, or the AppHost exiting — tears down its DCP session, and DCP's
own cleanup controller then reaps Aspire-managed Docker resources it considers abandoned, including
`aspire-persistent-network-*` networks. That reap is keyed on DCP metadata inside the Aspire
runtime, not on the calling process, so a foreign run's persistent network can be removed as
collateral while stopping your own AppHost. Cleanup code that removes only containers cannot prevent
or intercept this from inside `aspire stop`; the mitigation is detection, not prevention:

- Before cleanup, enumerate DCP-managed networks by the `com.microsoft.developer.usvc-dev.*` label
  namespace, never by name pattern, and flag the ones your run cannot positively own as at-risk.
  Keep that list as the record of what existed before cleanup; a network is never a cleanup target.
- Remove owned containers with `docker rm -f -v`, so the run's anonymous volumes die with their
  containers while named volumes always survive. Report run-owned volumes that remain as survivors.
- Upstream references: the aspire.dev networking overview (persistent vs session networks),
  `dotnet/aspire#9785`, `dotnet/aspire#13320`, and `microsoft/dcp#213` (workload-scoped persistent
  resource cleanup).
