---
layout: layouts/base.vto
title: Detached start for agents and CI
templateEngine: [vento, md]
order: 104
---

# Detached start for agents and CI

**Goal:** start and manage the Aspire AppHost in detached, non-interactive, machine-readable mode,
so that CI workflows, test runners, and autonomous AI agents can stand up the full NetScript
resource graph without an interactive terminal.

{{ comp callout { type: "important", title: "Non-interactive orchestration" } }}
Interactive development runs <code>aspire start</code> directly in a terminal. CI pipelines and
agent sessions instead need background execution, structured JSON output for discovery, explicit
timeout budgets, and port isolation.
{{ /comp }}

## Detached startup with JSON output

To start Aspire in non-interactive mode and capture structured startup information, pass
`--format Json` and `--non-interactive` (add `--nologo` to suppress the startup banner):

```bash
# Run from within the aspire/ folder
aspire start --format Json --non-interactive
```

The CLI starts the AppHost in the background and emits a single JSON object with the process
identifiers, the dashboard URL, and the log file path:

```json
{
  "appHostPath": "/path/to/my-app/aspire/apphost.mts",
  "appHostPid": 48219,
  "cliPid": 48218,
  "dashboardUrl": "https://localhost:18888",
  "logFile": "/path/to/logs/cli_apphost-48219.log"
}
```

{{ comp callout { type: "note", title: "Redacting dashboard tokens" } }}
When authentication is enabled, <code>dashboardUrl</code> may carry an authentication token as a
query parameter (<code>?t=...</code>). Redact it before storing or logging Aspire output in CI job
artifacts or agent transcripts.
{{ /comp }}

## Inspecting running instances with `aspire ps`

To list the running AppHosts with their endpoints and log paths without attaching to a TTY, use
`aspire ps --format Json`:

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

When no AppHost is running, `aspire ps --format Json` returns an empty array (`[]`) with exit code `0`.

### Discovering the dashboard endpoint without printing its token

`dashboardUrl` in that same `aspire ps --format Json` record **is** the supported discovery path for
headless automation. There is no separate token command to call and no product API to depend on — the
canonical Aspire inventory JSON already carries it, which is why automation should read this field
rather than scraping startup output or guessing a port.

Treat the value as a **secret**. Aspire may append a dashboard login token to that URL, so anything
that echoes the raw record leaks it into CI logs, run artifacts and issue comments.

Read the field without printing it:

```bash
# Extract only what you need; never echo the whole record.
DASHBOARD_URL="$(aspire ps --format Json --non-interactive --nologo \
  | deno eval 'const [a] = JSON.parse(await new Response(Deno.stdin.readable).text()); if (a?.dashboardUrl) console.log(a.dashboardUrl);')"

# Pass it on by environment or stdin, not as a logged argument.
MY_TOOL_DASHBOARD="$DASHBOARD_URL" my-tool
```

When a URL must appear in a log, redact the query string, which is where a token would live:

```bash
printf 'dashboard: %s\n' "${DASHBOARD_URL%%\?*}"
```

Two rules follow, and they are what keeps a token out of a transcript:

- **Never `echo` or `cat` the raw `aspire ps --format Json` output in CI.** Select the one field you
  need and discard the rest.
- **Never pass the URL as a command-line argument** in a logged step — arguments are echoed by most CI
  runners, environment variables and stdin are not.

An AppHost that is starting may report `status` other than `running` with `dashboardUrl` absent; poll
`aspire ps --format Json` until the field appears rather than assuming it is present on the first read.

## Startup timeout budget versus `aspire wait`

An Aspire cold start covers container provisioning (Postgres, Redis), AppHost TypeScript
compilation, and health-probe convergence. In two recorded 13.5.3 runs, cold start took
38.62 s and 24.80 s; budget accordingly with `ASPIRE_CLI_START_TIMEOUT`.

NetScript provides two complementary timeout controls:

1. **The `ASPIRE_CLI_START_TIMEOUT` environment variable** — the overall startup deadline (in
   seconds) that database operations and adapter commands wait before failing fast. Defaults to
   `300` seconds:
   ```bash
   export ASPIRE_CLI_START_TIMEOUT=120
   ```
2. **The `aspire wait` command** — blocks until a specific resource reports healthy, with a bounded
   deadline:
   ```bash
   # Wait up to 60 seconds for postgres to become healthy
   aspire wait postgres --timeout 60
   ```

## Parallel isolation with `--isolated`

When several CI workers or agent implementation loops run concurrently on a shared host, pass
`--isolated` to `aspire start`. Per `aspire start --help`, it generates randomized ports and
isolated user secrets:

```bash
aspire start --isolated --format Json --non-interactive
```

The host ports of container resources are not guaranteed unique across isolated starts. To
randomize the host ports of the containerized infrastructure services explicitly, NetScript
workspaces can set `DcpPublisher__RandomizePorts=true` in the environment.

## Cleanup and teardown

When terminating an automated run, stop the AppHost:

```bash
# Graceful stop
aspire stop

# Stop the AppHost and clean up persistent resources
aspire stop --force
```

Then verify that `aspire ps --format Json` returns `[]` and that no orphaned processes survive.

## See also

- {{ comp.xref({ key: "howto:deploy-local-aspire", text: "Deploy locally with Aspire" }) }} — the
  interactive local-development recipe.
- {{ comp.xref({ key: "explain:aspire", text: "Orchestration with Aspire" }) }} — AppHost
  architecture and how the resource graph is derived from plugins.
- {{ comp.xref({ key: "cli:reference", text: "CLI reference" }) }} — the full command-line
  reference for Aspire and NetScript commands.

{{ comp.nextPrev({ prev: { label: "Deploy locally with Aspire", href: "/orchestration-runtime/how-to/deploy-local-aspire/" }, next: { label: "Roll out runtime overrides", href: "/orchestration-runtime/how-to/roll-out-runtime-overrides/" } }) }}
