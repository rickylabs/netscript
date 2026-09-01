---
name: aspire
description: 'Orchestrates Aspire distributed applications using the Aspire CLI for running, debugging, and managing distributed apps. USE FOR: aspire start, aspire stop, start aspire app, aspire describe, list aspire integrations, debug aspire issues, view aspire logs, add aspire resource, aspire dashboard, update aspire apphost, observe resource health/readiness, subscribe to resource lifecycle events, replace flaky polling with Aspire events. DO NOT USE FOR: non-Aspire .NET apps (use dotnet CLI), container-only deployments (use docker/podman), Azure deployment after local testing (use azure-deploy skill). INVOKES: Aspire CLI commands (aspire start, aspire describe, aspire otel logs, aspire docs search, aspire add), bash. FOR SINGLE OPERATIONS: Use Aspire CLI commands directly for quick resource status or doc lookups.'
---

# Aspire Skill

This repository uses Aspire to orchestrate its distributed application. Resources are defined in the
AppHost project (`apphost.cs` or `apphost.ts`).

## CLI command reference

| Task                            | Command                                            |
| ------------------------------- | -------------------------------------------------- |
| Start the app                   | `aspire start`                                     |
| Start isolated (worktrees)      | `aspire start --isolated`                          |
| Restart the app                 | `aspire start` (stops previous automatically)      |
| Wait for resource healthy       | `aspire wait <resource>`                           |
| Stop the exact AppHost          | `aspire stop --apphost <exact-AppHost-path>`       |
| List resources                  | `aspire describe` or `aspire resources`            |
| Run resource command            | `aspire resource <resource> <command>`             |
| Start/stop/restart resource     | `aspire resource <resource> start\|stop\|restart`  |
| Rebuild a .NET project resource | `aspire resource <resource> rebuild`               |
| View console logs               | `aspire logs [resource]`                           |
| View structured logs            | `aspire otel logs [resource]`                      |
| View traces                     | `aspire otel traces [resource]`                    |
| Logs for a trace                | `aspire otel logs --trace-id <id>`                 |
| Detached workspace telemetry    | `deno task aspire:otel -- traces <resource>`       |
| Export detached telemetry       | `deno task aspire:export -- -o telemetry.zip`      |
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

On a shared host, always take the exact `appHostPath` from `aspire ps` and pass it to the stop
command. Use `aspire resource <name> stop` when only one resource needs cleanup. The host-wide
`aspire stop` mode with `--all` is dangerous to sibling runs and unreliable: it has reported
`No running AppHost found` and exited 0 while processes rooted at the AppHost survived.

### Detached dashboard discovery

In a generated NetScript workspace, prefer `deno task aspire:otel -- <subcommand> [resource]` and
`deno task aspire:export -- [options]`. They forward arguments and recover through the dashboard URL
reported by `aspire ps` if Aspire automatic discovery fails. If bare Aspire prints
`The dashboard is not available` (exit 12), use the generated task; telemetry may still be healthy
and reachable through the dashboard HTTP API.

## Key workflows

### Running in agent environments

Use `aspire start` to run the AppHost in the background. When working in a git worktree, use
`--isolated` to avoid port conflicts and to prevent sharing user secrets or other local state with
other running instances:

```bash
aspire start --isolated
```

Use `aspire wait <resource>` to block until a resource is healthy before interacting with it:

```bash
aspire start --isolated
aspire wait myapi
```

### Applying code changes

Choose the right action based on what changed:

| What changed                                | Action                                          | Why                                                 |
| ------------------------------------------- | ----------------------------------------------- | --------------------------------------------------- |
| AppHost project (`apphost.cs`/`apphost.ts`) | `aspire start`                                  | Resource graph changed; full restart required       |
| Compiled .NET project resource              | `aspire resource <name> rebuild`                | Rebuilds and restarts only that resource            |
| Interpreted resource (JavaScript, Python)   | Typically nothing — most run with file watchers | Restart the resource if no watch mode is configured |

**Never restart the entire AppHost just because a single resource changed.** Use
`aspire resource <name> rebuild` for .NET project resources — it coordinates stop, build, and
restart for just that resource. Use `aspire describe --format Json` to check which commands a
resource supports.

### Debugging issues

Before making code changes, inspect the app state:

1. `aspire describe` — check resource status
2. `aspire otel logs <resource>` — view structured logs
3. `aspire logs <resource>` — view console output
4. `aspire otel traces <resource>` — view distributed traces

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

### Upstream cleanup of networks and anonymous volumes (issue #1855)

Stopping an AppHost — `aspire stop`, or the AppHost exiting — tears down its DCP session, and DCP's
own cleanup controller then reaps Aspire-managed Docker resources it considers abandoned, including
`aspire-persistent-network-*` networks. That reap is keyed on DCP metadata inside the Aspire
runtime, not on the calling process, so a foreign run's persistent network can be removed as
collateral while stopping your own AppHost. Repo code (`agentic:teardown`) only ever removes
containers and cannot prevent or intercept this from inside `aspire stop`; the mitigation is
detection, not prevention:

- `agentic:leak-check` enumerates DCP-managed networks before cleanup — by the
  `com.microsoft.developer.usvc-dev.*` label namespace, never by name pattern — and flags the ones
  this run cannot positively own as at-risk. Treat those report entries as the record of what
  existed before cleanup; a network is never a cleanup target.
- `agentic:teardown` removes owned containers with `docker rm -f -v`, so the run's anonymous volumes
  die with their containers while named volumes always survive. `agentic:leak-check` reports
  run-owned volumes as survivors.
- Upstream references: the aspire.dev networking overview (persistent vs session networks),
  `dotnet/aspire#9785`, `dotnet/aspire#13320`, and `microsoft/dcp#213` (workload-scoped persistent
  resource cleanup).

## Observing resource state: use Aspire's event system, never hand-rolled polling

Aspire is **event-based**. The CLI is a thin client over it, not the platform. Reading only
`aspire wait --help` and concluding a capability is missing is a recurring, expensive mistake — it
produced flaky arbitrary-timeout tests that blocked multiple agents. **The CLI surface is not the
platform surface.**

Choose the observation mechanism in this order. Only fall down the list when the layer above
genuinely cannot express the thing.

### 1. Resource lifecycle events (preferred — push-based, no timing)

Every resource builder exposes subscription handles. `onResourceReady` fires for _"the resource that
is in a healthy state"_ — it **is** the native readiness signal.

| Handle                             | Fires when                       |
| ---------------------------------- | -------------------------------- |
| `onResourceReady(cb)`              | resource reached a healthy state |
| `onResourceStopped(cb)`            | resource stopped                 |
| `onBeforeResourceStarted(cb)`      | before start                     |
| `onInitializeResource(cb)`         | during initialization            |
| `onConnectionStringAvailable(cb)`  | connection string resolved       |
| `onResourceEndpointsAllocated(cb)` | endpoints allocated              |

App-level events come from `builder.eventing()` → `onBeforeStart`, `onAfterResourcesCreated`,
`onBeforePublish`, `onAfterPublish`.

### 2. `ResourceNotificationService` (when you need to await a specific state)

Reached via `builder.notifications()`:

| API                                           | Behaviour                                                    |
| --------------------------------------------- | ------------------------------------------------------------ |
| `waitForResourceHealthy(name)`                | awaits health arrival → `ResourceEventDto`                   |
| `waitForResourceStates(name, targetStates[])` | awaits **any** of an arbitrary state list, returns which hit |
| `waitForResourceState(name, options?)`        | awaits a single target state                                 |
| `tryGetResourceState(name)`                   | current state, **including `healthStatus`**                  |
| `publishResourceUpdate(resource, options?)`   | pushes a resource update                                     |

`ResourceEventDto` carries `resourceName`, `resourceId`, `state`, `stateStyle`, **`healthStatus`**,
and `exitCode`. Because `waitForResourceStates` accepts arbitrary target states and the DTO carries
health, **both arrival and departure are natively expressible**.

### 3. `aspire wait` (CLI) — arrival only, and it answers from cache

`aspire wait --status healthy|up|down` is fine for coarse arrival gating from outside the AppHost.
It is **not** an observation primitive: it answers from the last completed evaluation, so
immediately after you induce a transition it can return the _previous_ verdict and exit 0. Never use
it to observe a transition you just caused.

### Anti-pattern: hand-rolled health/lifecycle checks

Do not write, and remove on sight:

- polling loops with `setTimeout`/sleep against a resource, endpoint, or report file;
- `*_DEADLINE_MS` / `*_POLL_MS` / `*_TIMEOUT_SECONDS` constants chosen to "exceed Aspire's
  evaluation interval";
- retry-until-success `fetch` loops standing in for readiness;
- parsing `aspire describe`/`aspire ps` output to infer a transition.

Every one of these is a local reimplementation of something Aspire already emits, and each is a
future flaky test. This is AGENTS.md operating rule 3 (_wrap, do not reinvent — prefer upstream APIs
before local abstractions_) applied to Aspire.

**Test fixtures can use all of this.** E2E fixtures already inject code into the generated AppHost,
which is exactly where `eventing()` and `notifications()` are available. "It's a test" is not a
reason to hand-roll.

## Important rules

- **Always start the app first** (`aspire start`) before making changes to verify the starting
  state.
- **To restart, just run `aspire start` again** — it automatically stops the previous instance.
  NEVER use `aspire stop` then `aspire run`. NEVER use `aspire run` at all.
- **Only restart the AppHost when AppHost code changes.** For .NET project resources, use
  `aspire resource <name> rebuild` instead.
- **Never kill an `aspire mcp start` process.** It is the session's MCP server, not a stray AppHost.
- Use `--isolated` when working in a worktree.
- **Avoid persistent containers** early in development to prevent state management issues.
- **Never install the Aspire workload** — it is obsolete.
- **For Aspire API reference and documentation, prefer `aspire docs search <query>` and
  `aspire docs get <slug>`** over searching NuGet package caches or XML doc files. The CLI provides
  up-to-date content from aspire.dev.
- Prefer `aspire.dev` and `learn.microsoft.com/microsoft/aspire` for official documentation.
- **Never hand-roll health, readiness, or lifecycle observation.** Use resource events
  (`onResourceReady`, `onResourceStopped`) or `builder.notifications()`. Arbitrary poll/timeout
  constants against an Aspire resource are a defect, not a style choice — see the
  observation-surface section above.

## Playwright CLI

If configured, use Playwright CLI for functional testing of resources. Get endpoints via
`aspire describe`. Run `playwright-cli --help` for available commands.
