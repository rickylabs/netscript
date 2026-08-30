---
layout: layouts/base.vto
title: Detached start for agents and CI
templateEngine: [vento, md]
order: 103
---

# Detached start for agents and CI

**Goal:** start and manage the Aspire AppHost in detached, non-interactive, and machine-readable modes — enabling automated CI workflows, test runners, and autonomous AI agents to stand up the full NetScript resource graph without an interactive terminal.

{{ comp callout { type: "important", title: "Non-interactive orchestration" } }}
While interactive development uses <code>aspire start</code> directly in a terminal, CI pipelines and agent sessions require background execution, structured JSON output for discovery, explicit timeout budgets, and port isolation.
{{ /comp }}

## Detached startup with JSON output

To launch Aspire in non-interactive mode and capture structured startup information, pass `--format Json` and `--non-interactive` (pass `--nologo` to suppress the startup banner):

```bash
# Run from within the aspire/ folder
aspire start --format Json --non-interactive
```

The CLI starts the AppHost in the background and emits a single JSON object containing process identifiers, the dashboard endpoint, and the log file path:

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
When authentication is enabled, the <code>dashboardUrl</code> may carry an authentication token query parameter (<code>?t=...</code>). When storing or logging Aspire output in CI job artifacts or agent transcripts, redact any token parameter present in the URL.
{{ /comp }}

## Inspecting running instances with `aspire ps`

To discover currently active AppHosts, their endpoints, and their log paths without attaching to a TTY, use `aspire ps --format Json`:

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

## Startup timeout budget vs `aspire wait`

Aspire cold starts involve container provisioning (Postgres, Redis), AppHost TypeScript compilation, and health probe convergence. In the two recorded 13.5.3 runs, cold start took 38.62 s and a second run 24.80 s (S2 V2); budget accordingly with `ASPIRE_CLI_START_TIMEOUT`.

NetScript provides two complementary timeout controls:

1. **`ASPIRE_CLI_START_TIMEOUT` environment variable**:
   Configures the overall startup deadline budget (in seconds) for database operations and adapter commands before failing fast. Defaults to `300` seconds:
   ```bash
   export ASPIRE_CLI_START_TIMEOUT=120
   ```
2. **`aspire wait` CLI command**:
   Explicitly blocks until a specific resource reaches a healthy state with a bounded deadline:
   ```bash
   # Wait up to 60 seconds for postgres to become healthy
   aspire wait postgres --timeout 60
   ```

## Parallel isolation with `--isolated`

When multiple CI workers or agent implementation loops run concurrently on a shared host, passing `--isolated` to `aspire start`:

- Generates randomized ports and isolated user secrets per `aspire start --help`.

```bash
aspire start --isolated --format Json --non-interactive
```

Note that host ports of container resources are not guaranteed unique across isolated starts. For explicit host port randomization across containerized infrastructure services, NetScript workspaces can configure `DcpPublisher__RandomizePorts=true` in the environment.

## Cleanup and teardown

When terminating an automated run, stop the AppHost:

```bash
# Graceful stop
aspire stop

# Stop the AppHost and clean up persistent resources
aspire stop --force
```

Verify that `aspire ps --format Json` reads `[]` and no orphaned processes survive.

## See also

- {{ comp.xref({ key: "howto:deploy-local-aspire", text: "Deploy locally with Aspire" }) }} — interactive local development recipe.
- {{ comp.xref({ key: "explain:aspire", text: "Orchestration with Aspire" }) }} — AppHost architecture and plugin resource graph derivation.
- {{ comp.xref({ key: "cli:reference", text: "CLI reference" }) }} — full command-line reference for Aspire and NetScript tools.

{{ comp.nextPrev({ prev: { label: "Deploy locally with Aspire", href: "/orchestration-runtime/how-to/deploy-local-aspire/" }, next: { label: "Roll out runtime overrides", href: "/orchestration-runtime/how-to/roll-out-runtime-overrides/" } }) }}
