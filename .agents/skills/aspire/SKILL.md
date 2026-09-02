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

### 1. Resource lifecycle events (push-based, no timing)

Resource events are raised **per resource**, in this startup order:

`InitializeResourceEvent` → `ResourceEndpointsAllocatedEvent` → `ConnectionStringAvailableEvent` →
`BeforeResourceStartedEvent` → `ResourceReadyEvent`.

`ResourceStoppedEvent` is separate — it is raised after a resource stops, not part of that sequence.

**`ResourceReadyEvent` is raised when a resource _initially_ transitions to a ready state — it fires
once.** It is the native _first-readiness_ signal, not a health-transition stream. Do not use it to
assert recovery after an induced failure: it will not fire again, so the test hangs instead of
failing. For repeated transitions use the stream in section 3.

Handles are **capability-scoped**, not present on every builder:

| Handle                             | Fires when                 | Available on                   |
| ---------------------------------- | -------------------------- | ------------------------------ |
| `onInitializeResource(cb)`         | during initialization      | base resource                  |
| `onBeforeResourceStarted(cb)`      | before start               | base resource                  |
| `onResourceReady(cb)`              | first transition to ready  | base resource                  |
| `onResourceStopped(cb)`            | resource stopped           | base resource                  |
| `onConnectionStringAvailable(cb)`  | connection string resolved | `ResourceWithConnectionString` |
| `onResourceEndpointsAllocated(cb)` | endpoints allocated        | `ResourceWithEndpoints`        |

**App-level events, TypeScript AppHost.** Subscribe inline on the builder:
`builder.subscribeBeforeStart(...)`, `builder.subscribeAfterResourcesCreated(...)`,
`builder.subscribeBeforePublish(...)`, `builder.subscribeAfterPublish(...)`.

`builder.eventing()` is **not** the subscription path — the `DistributedApplicationEventing` it
returns exposes only `unsubscribe`. The `onBeforeStart` / `onAfterResourcesCreated` /
`onBeforePublish` / `onAfterPublish` names live on the registration context handed to
`builder.addEventingSubscriber(...)`, which is how a service or extension library subscribes instead
of the AppHost doing it inline. `addEventingSubscriber` changes **where** you subscribe from, not
**when** events fire.

### 2. `ResourceNotificationService` — state waits, and health _arrival_ only

Reached via `builder.notifications()`:

| API                                           | Behaviour                                                              |
| --------------------------------------------- | ---------------------------------------------------------------------- |
| `waitForResourceHealthy(name)`                | awaits health **arrival** → `ResourceEventDto`                         |
| `waitForResourceStates(name, targetStates[])` | awaits any of an arbitrary **lifecycle-state** list, returns which hit |
| `waitForResourceState(name, options?)`        | awaits a single target lifecycle state                                 |
| `tryGetResourceState(name)`                   | current state, including `healthStatus`                                |
| `publishResourceUpdate(resource, options?)`   | pushes a `state` / `stateStyle` update                                 |

`ResourceEventDto` carries `resourceName`, `resourceId`, `state`, `stateStyle`, `healthStatus`,
`exitCode`.

**This service cannot express a health _departure_.** `targetStates` are lifecycle-state strings,
not health values, and `healthStatus` is output data on the DTO rather than something you can wait
on; `publishResourceUpdate` likewise takes state, not health. `waitForResourceHealthy` covers health
arrival and there is no departure counterpart here. For a healthy → unhealthy transition, or any
repeated health cycle, use the stream in section 3.

### 3. `aspire describe --follow` — a transition stream from outside the AppHost

```
aspire describe <resource> --follow --format Json
```

> `-f, --follow` — Continuously stream resource state changes. In JSON mode, each update emits a
> single JSON object per line (NDJSON), showing the resource name, state, health and endpoints.

This is the right tool when the observer is **not** inside the AppHost — E2E harnesses, scripts, CI
gates — and whenever you need **repeated** transitions (healthy → unhealthy → healthy), which the
one-shot lifecycle events cannot give you.

Two rules:

- **Subscribe before you induce.** Start the follower, _then_ cause the transition, then await.
  Starting it afterwards reintroduces the race you are removing.
- **Buffer.** Lines can arrive between subscribing and awaiting; a reader that only listens for
  future lines will miss them.

Snapshot mode (no `--follow`) wraps resources in `{ "resources": [...] }`; follow mode emits one
JSON object per line.

### 4. `aspire wait` (CLI) — arrival gating, bounded by what Aspire has evaluated

`aspire wait <resource> --status healthy|up|down` connects to the AppHost over the backchannel and
**streams resource state changes in real time**. It validates the resource name before entering the
wait loop, so a typo fails immediately instead of timing out silently.

| Exit | Meaning                                                                      |
| ---- | ---------------------------------------------------------------------------- |
| `0`  | resource reached the target status                                           |
| `7`  | no running AppHost found                                                     |
| `17` | timeout exceeded before the target status was reached                        |
| `18` | resource entered a failed or terminal state while waiting for `up`/`healthy` |

Two traps that have both cost time here:

- **`healthy` means "running and healthy, _or_ running with no health checks configured."** A
  resource with no health check satisfies `--status healthy` immediately, so exit 0 is **not** proof
  that a health check passed.
- **It can only report health Aspire has already evaluated.** The stream is real time, but health
  evaluation is periodic — so immediately after you break something the resource can still be
  Healthy and `wait --status healthy` returns 0 at once. Measured in this repo at **1409 ms** while
  the backing listener was already closed. This is a lag in evaluation, not a stale cache read.

Use `wait` to gate on arrival. Never use it to observe a transition you just caused — use the stream
in section 3.

### Anti-pattern: hand-rolled health/lifecycle checks

Do not write, and remove on sight:

- polling loops with `setTimeout`/sleep against a resource, endpoint, or report file;
- `*_DEADLINE_MS` / `*_POLL_MS` / `*_TIMEOUT_SECONDS` constants chosen to "exceed Aspire's
  evaluation interval";
- retry-until-success `fetch` loops standing in for readiness;
- parsing repeated `aspire describe`/`aspire ps` **snapshots** to infer a transition — use
  `--follow` and read the stream.

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
- **Never hand-roll health, readiness, or lifecycle observation.** Use the lifecycle events for
  first-occurrence gating, `builder.notifications()` for lifecycle-state waits and health arrival,
  and `aspire describe --follow` for repeated health transitions. Arbitrary poll/timeout constants
  against an Aspire resource are a defect, not a style choice — see the observation-surface section
  above.
