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

To launch Aspire in non-interactive mode and capture structured startup information, pass `--format Json` and `--non-interactive` (or `--nologo`):

```bash
# Run from within the aspire/ folder
aspire start --format Json --non-interactive
```

The CLI starts the AppHost in the background and returns a single JSON object with the process state, dashboard endpoint, and log file path:

```json
{
  "pid": 48219,
  "appHostPath": "/home/agent/projects/my-app/aspire/apphost.mts",
  "dashboardUrl": "https://localhost:18888?t=REDACTED_TOKEN",
  "logFilePath": "/home/agent/.aspire/logs/my-app-apphost-48219.log",
  "state": "Running"
}
```

{{ comp callout { type: "note", title: "Redacting dashboard tokens" } }}
The <code>dashboardUrl</code> field contains an authentication token parameter (<code>?t=...</code>). When storing or logging Aspire output in CI job artifacts or agent transcripts, always redact the token query parameter.
{{ /comp }}

## Inspecting running instances with `aspire ps`

To discover currently active AppHosts, their endpoints, and their log paths without attaching to a TTY, use `aspire ps --format Json`:

```bash
aspire ps --format Json --nologo --non-interactive
```

Output:

```json
[
  {
    "pid": 48219,
    "appHostPath": "/home/agent/projects/my-app/aspire/apphost.mts",
    "dashboardUrl": "https://localhost:18888?t=REDACTED_TOKEN",
    "logFilePath": "/home/agent/.aspire/logs/my-app-apphost-48219.log",
    "resources": [
      { "name": "postgres", "type": "Container", "state": "Running" },
      { "name": "redis", "type": "Container", "state": "Running" },
      { "name": "my-app-web", "type": "Executable", "state": "Running" }
    ]
  }
]
```

When no AppHost is running, `aspire ps --format Json` returns an empty array (`[]`) with exit code `0`.

## Startup timeout budget vs `aspire wait`

Aspire cold starts involve container provisioning (Postgres, Redis), Node SDK compilation, and health probe convergence. In CI environments under load, cold starts can take tens of seconds (observed 13–38s across runtime verification benchmarks).

NetScript provides two complementary timeout controls:

1. **`ASPIRE_CLI_START_TIMEOUT` environment variable**:
   Configures the overall startup deadline budget (in seconds) for database operations and adapter commands before failing fast. Defaults to `300` seconds:
   ```bash
   export ASPIRE_CLI_START_TIMEOUT=120
   ```
2. **`aspire wait` CLI command**:
   Explicitly blocks until a specific resource or the overall AppHost reaches a healthy state with a bounded deadline:
   ```bash
   # Wait up to 60 seconds for postgres to become healthy
   aspire wait postgres --timeout 60
   ```

## Parallel isolation with `--isolated`

When multiple CI workers or agent implementation loops run concurrently on a shared host, hardcoded ports collide. Passing `--isolated` to `aspire start`:

- Randomizes all host port allocations (Postgres, Redis, services, and dashboard).
- Scopes container lifetimes to the session (`ContainerLifetime.Session`), ensuring containers are not shared between concurrent runs.
- Stores secrets and state in an isolated run directory.

```bash
aspire start --isolated --format Json --non-interactive
```

## Forceful cleanup and teardown

When terminating an automated run, stop the AppHost and ensure no orphaned containers or background processes survive:

```bash
# Graceful stop
aspire stop

# Forceful teardown for CI exit traps and teardown scripts
aspire stop --force
```

Verify that `aspire ps --format Json` reads `[]` and `docker ps` contains no surviving project containers.

## Verified evidence & receipts

The behaviors and JSON schemas documented here are verified by reproducible repository receipts:
- **S2 runtime verification receipts**: `03-v2-cold-start-timing.time.txt` (cold-start budgets), `03-v3-isolated-starts.raw.txt` (isolated port allocation), and `03-v4-detached-dashboard.raw.txt` (JSON format schema).
- **S10 E2E gate receipts**: `doctor --format Json` contract verification, `describe --follow` stream parsing, and `stop --force` container ownership proof.

## See also

- {{ comp.xref({ key: "howto:deploy-local-aspire", text: "Deploy locally with Aspire" }) }} — interactive local development recipe.
- {{ comp.xref({ key: "explain:aspire", text: "Orchestration with Aspire" }) }} — AppHost architecture and plugin resource graph derivation.
- {{ comp.xref({ key: "cli:reference", text: "CLI reference" }) }} — full command-line reference for Aspire and NetScript tools.

{{ comp.nextPrev({ prev: { label: "Deploy locally with Aspire", href: "/orchestration-runtime/how-to/deploy-local-aspire/" }, next: { label: "Roll out runtime overrides", href: "/orchestration-runtime/how-to/roll-out-runtime-overrides/" } }) }}
