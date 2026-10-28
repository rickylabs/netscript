---
layout: layouts/base.vto
title: Deploy locally with Aspire
description: Bring up the whole resource graph on one machine from the generated Aspire AppHost.
templateEngine: [vento, md]
order: 103
oldUrl: /how-to/deploy-local-aspire/
---

# Deploy locally with Aspire

This recipe runs your whole workspace on one machine under Aspire: it confirms the AppHost, brings
up the resource graph (Postgres, Redis, every service and background processor), initializes the
database and opens the Aspire dashboard. To ship to a remote target, use
[Deploy](/orchestration-runtime/how-to/deploy/); for why the AppHost works this way, read
[Orchestration with Aspire](/explanation/aspire/).

{{ comp callout { type: "important", title: "Scaffold, then orchestrate, then the database" } }}
<code>netscript init</code> writes the <code>aspire/</code> AppHost, and <code>aspire start</code> provisions Postgres and Redis and starts every process. Only then do <code>netscript db init</code>, <code>generate</code> and <code>seed</code> work, because they migrate the database through the running AppHost. With no Aspire up, a db command fails: there is no Postgres to reach. See {{ comp.xref({ key: "cap:database", text: "Database" }) }}.
{{ /comp }}

## Prerequisites

- **A workspace scaffolded without `--no-aspire`**, so the `aspire/` AppHost folder exists. With
  `--no-aspire` there is no `aspire start`: you start the Deno processes and supply your own
  infrastructure, as covered in {{ comp.xref({ key: "howto:deploy", text: "Deploy" }) }}.
- **A running Docker daemon.** Aspire provisions Postgres and Redis as local Docker containers;
  without a daemon the default workflow doesn't start.
- **The Aspire CLI.** `aspire restore` and `aspire start` are the external Aspire CLI, run from
  inside `aspire/`, not `netscript` subcommands.
- **Free ports**: the dashboard on `:18888` (HTTPS) and `:18889` (HTTP), OTLP on `:4318`, and the
  high-range ports (49152–65535) allocated per project at scaffold time for services, plugin APIs
  and frontend apps.

## Step 1 — Confirm the AppHost was scaffolded

The AppHost is a small TypeScript/Node program (not C#) at `aspire/apphost.mts`, configured by
`aspire/aspire.config.json`. `netscript init` generates it; you don't write it by hand. Check that
it exists:

```bash
# From the workspace root — these two files are the orchestration entry point.
ls aspire/apphost.mts aspire/aspire.config.json
```

`aspire.config.json` pins `language: "typescript/nodejs"` and `appHost.path: "apphost.mts"`. The
default scaffold pins the Aspire SDK to <code>13.5.3</code>, the PostgreSQL and Redis hosting
integrations to <code>13.5.3</code>, and the Browsers integration to
<code>13.5.3-preview.1.26425.3</code>. Keep the Aspire CLI and the AppHost SDK
on the same release train. If you installed the Aspire CLI through npm
(`npm install -g @microsoft/aspire-cli`), `aspire update --self` detects the installation method
and tells you to run `npm install -g @microsoft/aspire-cli@latest`.

The graph inside the AppHost is derived from your installed plugins at boot by `composeAppHost`
(from `@netscript/aspire/application`). Add a plugin and its API and background processor appear in
the graph; remove it and they disappear, with no edit to `apphost.mts`.

After you change the resource graph, run `netscript generate aspire` from the workspace root. It
re-reads `appsettings.json` and regenerates the TypeScript AppHost helpers without touching the rest
of the scaffold. Service mutation verbs regenerate those helpers in the same operation:

```bash
netscript service ref add api users
netscript service ref remove api users
netscript service set api --port 3010 --enabled true
```

## Step 2 — Restore the AppHost SDK (once)

The AppHost runs on its own Node runtime inside `aspire/`, so its dependency graph never leaks into
your Deno workspace. Restore that runtime once per machine, and again after an SDK bump:

```bash
# Run from inside the aspire/ folder. One-time SDK restore.
cd aspire
aspire restore
```

## Step 3 — Start the resource graph

`aspire start` turns `appsettings.json` and the plugin contributions into one resource graph and
boots it: infrastructure first, then services, plugin APIs and background processors, with
cross-references resolved into injected environment variables.

```bash
# Still inside aspire/. Boots the whole graph; prints the dashboard URL + a login token.
aspire start
```

When boot finishes, `aspire start` prints the dashboard address and a one-time login token. One
run brings up:

| Resource | Address | What it is |
| --- | --- | --- |
| Aspire dashboard | `https://localhost:18888`, `http://localhost:18889` | Live resource list, console logs, structured logs and traces. |
| OTLP collector | `http://localhost:4318` | The OpenTelemetry endpoint (http/protobuf) the dashboard runs. Framework spans and structured logs land here automatically. |
| `postgres` | Container | Provisioned through Docker; the database `netscript db` commands target. Postgres is the recommended engine (`--db postgres`); `--db mysql` and `--db mssql` select those engines, also as containers, and `--db sqlite` gives a file-backed database with no container. |
| `redis` | Container (cache) | The default `--cache-backend`, Redis-compatible, backing KV and queue workloads for the runtime plugins. Swap it for `garnet` (also a container) or app-level `deno-kv` with `--cache-backend`. |
| `users` (example service) | High-range port | The scaffolded oRPC service when you init with `--service`. OpenAPI at `/api/v1/users/*` and RPC at `/api/rpc/*`. |
| Plugin APIs | High-range port | Each installed runtime plugin's HTTP API (workers, sagas, triggers, auth). |
| Background processors | No port | Each plugin's isolated runners (workers, sagas, triggers): separate processes, not threads inside the API. |
| `dashboard` (Fresh app) | Assigned (>= 53248) | The scaffolded Fresh frontend, when present, allocated from the APP range at scaffold time. |

Services, plugin APIs and frontend apps get stable high-range ports (49152–65535) at scaffold time,
seeded by your project name so workspaces don't collide. The dashboard's resource list is the
authority for the port each resource bound; the scaffold output and `appsettings.json` show them
too.

## Step 4 — Initialize the database (through the running AppHost)

With Aspire up, your database is live and `netscript db` commands can reach it. Run them from the
workspace root in a second terminal, and leave `aspire start` running in the first:

```bash
# From the workspace root, with `aspire start` still up in another terminal.
netscript db init --name init   # create + apply the first migration
netscript db generate           # generate the Prisma client
netscript db seed               # optional: seed development data
```

Outside Aspire, for example in an isolated CI container, point these commands at your own database
with `POSTGRES_URI` or `DATABASE_URL`; see
{{ comp.xref({ key: "howto:database-migration", text: "Migrate the database" }) }}.

## Step 5 — Use the dashboard

Open `https://localhost:18888` and paste the login token `aspire start` printed:

| Tab | What it shows |
| --- | --- |
| Resources | Every container and executable with status, endpoints and resolved environment. The authority for which port each resource bound. |
| Console logs | stdout and stderr per resource. A failing background processor is one click away. |
| Structured logs and Traces | The spans and structured logs your handlers emit, correlated by `traceparent` across services and collected through the OTLP endpoint at `:4318`. |

Aspire starts each resource with its `OTEL_SERVICE_NAME` and an OTLP endpoint pointed at
`http://localhost:4318`, so framework spans (job dispatch, job execution, scheduler runs) appear
here with no extra wiring. {{ comp.xref({ key: "explain:observability", text: "Observability" }) }}
describes the boundary between framework and scaffold spans.

## Troubleshooting

{{ comp callout { type: "warning", title: "Aspire is for local development" } }}
<code>aspire start</code> produces a complete, observable, correctly wired stack on one machine. The Postgres and Redis it starts are throwaway Docker containers, not your production database or cache. For a remote target, point processes at managed infrastructure and let your platform own their lifecycle; see {{ comp.xref({ key: "howto:deploy", text: "Deploy" }) }}.
{{ /comp }}

| Symptom | Cause | Fix |
| --- | --- | --- |
| `aspire start` doesn't boot | Docker isn't running. | Start Docker, or use the `--no-aspire` path with your own infrastructure. |
| Commands fail on the first run | Wrong directory. `aspire restore` and `aspire start` run inside `aspire/`; `netscript db` commands run from the workspace root. | Run each command from its directory. |
| Boot is blocked | A stale earlier run holds a dashboard, OTLP or service port. | Find it in the dashboard resource list or your process table and free it. |
| `aspire restore` fails | A Node or SDK problem in `aspire/`. The AppHost runs on Node and your app on Deno, isolated on purpose. | Fix the Node/SDK setup in `aspire/`, not the Deno workspace. |
| Everything is healthy but services never become ready | The Docker daemon runs on another machine. | See [the remote Docker daemon section](#services-never-become-ready-a-remote-docker-daemon). |

A background processor that isn't explicitly disabled has its declared service and plugin
references checked by the generated AppHost before registration. Each declaration is required
configuration, so startup fails fast when the resource is missing or has no `http` endpoint. This
is a configuration error, not a processor failing under load. The messages are:

- Service reference: `Background processor configuration error: '<processor>' could not resolve service reference '<ref>' HTTP endpoint.`
- Plugin reference: `Background processor configuration error: '<processor>' could not resolve plugin reference '<ref>' HTTP endpoint.`

The generated code substitutes the configured processor and reference names for `<processor>` and
`<ref>`.

## Services never become ready: a remote Docker daemon

The local workflow assumes the Docker daemon runs on the same machine as the AppHost. If the Docker
CLI points at another machine, through `DOCKER_CONTEXT`, `DOCKER_HOST` (for example `ssh://…` or
`tcp://<host>:2376`) or the current `docker context`, Aspire still provisions every container and
every container reports healthy. The services that wait on them never become ready, and nothing
prints an error.

- **Symptom.** Containers are running and healthy, `pg_isready` passes inside the database
  container, and the AppHost is up. Every service with a database health wait stays waiting.
- **Cause.** The generated AppHost is a host service. Host services don't join container networks;
  they reach containers through ports the daemon publishes, addressed as `localhost`. Aspire
  publishes those ports on the daemon host's loopback (`5432/tcp -> 127.0.0.1:<port>`), so
  `localhost:<port>` on the AppHost machine points at nothing.
- **No setting fixes it.** Aspire's network identifiers (`LocalhostNetwork`,
  `DefaultAspireContainerNetwork`, `PublicInternet`) would be the lever, but Aspire doesn't support
  resolving endpoints by network identifier from a TypeScript AppHost, which is what NetScript
  generates. The container tunnel handles container-to-host traffic, the opposite direction.
  Proxyless endpoints and `ASPIRE_PROXYLESS_ENDPOINT_PORT_RANGE` don't change which address the
  daemon binds.
- **Remedy.** Fix this in your environment, not in project code: run the daemon locally, or make
  each published port reachable at the same `localhost:<port>` on the AppHost machine (for example
  a forwarder on the daemon host plus a local relay on the AppHost machine). Don't change project
  defaults to work around it.

`netscript plugin doctor` checks this topology. Its `docker` report classifies the daemon endpoint
as local, remote or unknown, with the Docker CLI's own precedence: `DOCKER_CONTEXT`, then
`DOCKER_HOST`, then the current context. When the AppHost is running, doctor reads the published
bindings of that AppHost's own containers from the same daemon and compares them with the
`localhost` address the AppHost uses. A container counts as the AppHost's only when its name equals
the instance name `aspire describe` reports for one of its container resources, so a same-named
resource of another AppHost on the daemon is never used as evidence:

| Result | Status | Meaning |
| --- | --- | --- |
| Local | `healthy` | The endpoint is a socket, a named pipe, or loopback, and every binding is reachable through `localhost`. |
| Mismatch | `warning` | The daemon is remote, or a port is bound to a non-loopback interface. The message names each container, port and bind address. |
| Inconclusive | `warning` | The endpoint, the AppHost, or the bindings could not be inspected, a container could not be attributed, or a binding record is incomplete. Doctor never reports this as a pass. |

If you run a relay, the mismatch warning stays: doctor checks where the daemon publishes ports, not
whether your relay forwards them.

## Next steps

To start the same graph non-interactively in CI or from a coding agent, follow
{{ comp.xref({ key: "howto:detached-start-agents-ci", text: "Detached start for agents and CI" }) }}.
