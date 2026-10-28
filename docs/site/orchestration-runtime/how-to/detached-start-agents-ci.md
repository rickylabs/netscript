---
layout: layouts/base.vto
title: Detached start for agents and CI
description: Start the AppHost non-interactively with JSON output, timeout budgets, and isolated parallel runs.
templateEngine: [vento, md]
order: 104
---

# Detached start for agents and CI

This recipe starts and manages the Aspire AppHost in detached, non-interactive, machine-readable
mode, so CI workflows, test runners and coding agents can stand up the full NetScript resource
graph without a terminal. Interactive development runs `aspire start` directly; automation needs
background execution, structured JSON output, explicit timeout budgets and port isolation.

## Detached startup with JSON output

Pass `--format Json` and `--non-interactive` to start Aspire in the background and capture
structured startup information. Add `--nologo` to suppress the startup banner.

```bash
# Run from within the aspire/ folder
aspire start --format Json --non-interactive
```

The CLI starts the AppHost in the background and prints one JSON object with the process
identifiers, the dashboard URL and the log file path:

```json
{
  "appHostPath": "/path/to/my-app/aspire/apphost.mts",
  "appHostPid": 48219,
  "cliPid": 48218,
  "dashboardUrl": "https://localhost:18888",
  "logFile": "/path/to/logs/cli_apphost-48219.log"
}
```

{{ comp callout { type: "caution", title: "The dashboard URL can carry a login token" } }}
When authentication is enabled, <code>dashboardUrl</code> may carry a token as a query parameter (<code>?t=...</code>). Never store or log raw Aspire output in CI job artifacts or agent transcripts. <a href="#discovering-the-dashboard-endpoint-without-printing-its-token">Discovering the dashboard endpoint</a> shows how to read it safely.
{{ /comp }}

## Inspecting running instances with `aspire ps`

`aspire ps --format Json` lists the running AppHosts with their endpoints and log paths, without
attaching to a TTY:

```bash
aspire ps --format Json --non-interactive --nologo
```

Output:

```json
[
  {
    "appHostPath": "/path/to/my-app/aspire/apphost.mts",
    "appHostPid": 48219,
    "status": "running",
    "sdkVersion": "13.5.3",
    "cliPid": 48218,
    "dashboardUrl": "https://localhost:18888",
    "logFilePath": "/path/to/logs/cli_apphost-48219.log"
  }
]
```

When no AppHost is running, `aspire ps --format Json` returns an empty array (`[]`) with exit code
`0`.

### Discovering the dashboard endpoint without printing its token

`dashboardUrl` in the `aspire ps --format Json` record is the supported discovery path for headless
automation. There is no separate token command or product API: read this field instead of scraping
startup output or guessing a port. Before an AppHost registers, `aspire ps` returns an empty array,
so poll until a record appears with `dashboardUrl`.

Treat the value as a **secret**. Aspire may append a dashboard login token to the URL, so anything that
echoes the raw record leaks it into CI logs, run artifacts and issue comments. Read the field
without printing it:

```bash
xtrace_was_on=; case $- in *x*) xtrace_was_on=1 ;; esac
set +x                      # no-op when tracing is already off
DASHBOARD_URL="$(aspire ps --format Json --non-interactive --nologo \
  | deno eval 'const [a] = JSON.parse(await new Response(Deno.stdin.readable).text()); if (a?.dashboardUrl) console.log(a.dashboardUrl);')"
MY_TOOL_DASHBOARD="$DASHBOARD_URL" my-tool
unset DASHBOARD_URL
# Only after the value is gone, and only if the job had tracing on. The `if` form
# matters: a bare `[ … ] && set -x` as the last line returns non-zero under `set -e`.
if [ -n "${xtrace_was_on:-}" ]; then set -x; fi
```

Three rules keep a token out of a transcript:

- **Never `echo` or `cat` the raw `aspire ps --format Json` output in CI.** Select the one field
  you need and discard the rest.
- **Never pass the URL as a command-line argument** in a logged step. Most CI runners echo
  arguments; environment variables and stdin are not echoed.
- **Disable shell tracing for the value's whole lifetime, not just its assignment.** Under `set -x`
  (`bash -x`, or a CI runner's debug mode; GitLab traces script lines by default) the shell echoes
  every expanded command, so both the extraction and the later pass-on print the URL with its
  token, even though neither calls `echo`. Re-enabling tracing between them defeats the guard: the
  pass-on line expands to `+ MY_TOOL_DASHBOARD='https://…?t=…'`. Tracing echoes the command, so
  the environment-versus-argument distinction protects nothing until tracing is off.

If a URL must appear in a log, or a traced step must handle it, redact the query string, where a
token would live:

```bash
printf 'dashboard: %s\n' "${DASHBOARD_URL%%\?*}"
```

## Startup timeout budget versus `aspire wait`

An Aspire cold start covers container provisioning (Postgres, Redis), AppHost TypeScript
compilation and health-probe convergence. Two measured cold starts on Aspire 13.5.3 took 38.62 s
and 24.80 s; budget accordingly. Two controls bound the wait:

1. **`ASPIRE_CLI_START_TIMEOUT`** sets the overall startup deadline, in seconds, that database
   operations and adapter commands wait before failing fast. It defaults to `300`:

   ```bash
   export ASPIRE_CLI_START_TIMEOUT=120
   ```

2. **`aspire wait`** blocks until a specific resource reports healthy, with a bounded deadline:

   ```bash
   # Wait up to 60 seconds for postgres to become healthy
   aspire wait postgres --timeout 60
   ```

## Parallel isolation with `--isolated`

When several CI workers or agent loops run at once on a shared host, pass `--isolated` to
`aspire start`. Per `aspire start --help`, it generates randomized ports and isolated user secrets:

```bash
aspire start --isolated --format Json --non-interactive
```

Container resources' host ports aren't guaranteed unique across isolated starts. To randomize the
host ports of the containerized infrastructure services explicitly, set
`DcpPublisher__RandomizePorts=true` in the environment.

## Cleanup and teardown

When an automated run ends, stop the AppHost:

```bash
# Graceful stop
aspire stop

# Stop the AppHost and clean up persistent resources
aspire stop --force
```

Then check that `aspire ps --format Json` returns `[]` and that no orphaned processes survive.

## Next step

Change behavior in the running graph without a restart:
[Roll out runtime overrides](/orchestration-runtime/how-to/roll-out-runtime-overrides/).
