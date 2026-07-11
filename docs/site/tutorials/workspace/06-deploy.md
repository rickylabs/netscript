---
layout: layouts/base.vto
title: Deploy locally
templateEngine: [vento, md]
prev: { label: "5 · Route authz", href: "/tutorials/workspace/05-route-authz/" }
next: { label: "How-to guides", href: "/how-to/" }
---

# Deploy locally

You have built every layer of the team workspace: scaffold, an identity layer, isolated team data, a
provisioning job that never blocks the caller, and routes that fail closed. This final chapter runs
the whole thing as one coherent system — the point where the app stops being a set of chapters and
becomes something a team could actually sit inside. A single `aspire start` stands up Postgres, the
Redis cache, your `workspace` service, the `auth-api` service on `:8094`, the Workers API on
`:8091`, and every background processor — all wired together and visible in one dashboard. It is the
**local** story, and this chapter is precise about exactly that: a complete observable stack on one
machine, not a production deployer.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/workspace/01-scaffold/" },
  { label: "2 · Auth", href: "/tutorials/workspace/02-auth/" },
  { label: "3 · Workspace data", href: "/tutorials/workspace/03-workspace-data/" },
  { label: "4 · Provision job", href: "/tutorials/workspace/04-provision-job/" },
  { label: "5 · Route authz", href: "/tutorials/workspace/05-route-authz/" },
  { label: "6 · Deploy", href: "/tutorials/workspace/06-deploy/" }
] }) }}

## What you will build

Your complete `my-workspace/` running under one Aspire AppHost: every service, plugin API, background
processor, and backing container in a single resource graph, observable from the dashboard on `:18888`
— including the `:8094` auth service you added in chapter 2. By the end you can read the whole running
topology, including the exact port each resource bound, from one pane.

## Before you begin

You need everything from chapters 1–5: the scaffolded workspace, the `auth` plugin, the second
database, the workers plugin and `provision-member` job, and the guarded `workspace` service. The
AppHost was scaffolded by `netscript init` in chapter 1 (you did not pass `--no-aspire`). Confirm the
orchestration entry point is on disk and the workspace type-checks:

```sh
# From the workspace root
ls aspire/apphost.mts aspire/aspire.config.json
deno task check
```

{{ comp callout { type: "important", title: "The order is: scaffold → orchestrate → database" } }}
Aspire is <strong>step 2</strong>, before any database command. <code>netscript init</code> wrote the
<code>aspire/</code> AppHost; <code>aspire start</code> provisions Postgres and Redis and starts every
process; <strong>only then</strong> do <code>netscript db</code> commands work, because they migrate
<em>through</em> the running AppHost. The graph is derived from your installed plugins — adding the
<code>auth</code> and <code>workers</code> plugins in earlier chapters is exactly why their services and
processors now appear in it.
{{ /comp }}

## Step 1 — Restore the AppHost SDK (once)

The AppHost runs on its own isolated Node runtime inside `aspire/`, so its dependency graph never leaks
into your Deno workspace. Restore that runtime once per machine (and after an SDK bump):

```sh
cd aspire
aspire restore
```

## Step 2 — Start the whole graph

A single `aspire start` translates `appsettings.json` plus your plugin contributions into a coherent
resource graph and boots all of it — infrastructure first, then services, plugin APIs, and background
processors, with cross-references resolved into injected environment variables:

```sh
# Still inside aspire/. Boots the whole graph; prints the dashboard URL + a login token.
aspire start
```

When boot finishes, `aspire start` prints the dashboard address and a one-time login token. This is the
graph your complete app stands up:

{{ comp.apiTable({
  caption: "The local resource graph aspire start brings up",
  rows: [
    { name: "aspire (dashboard)", type: "https://localhost:18888", desc: "The Aspire dashboard — live resource list, console logs, structured logs, and traces. A login token is printed on start." },
    { name: "OTLP collector", type: "http://localhost:4318", desc: "OpenTelemetry endpoint; framework spans (job dispatch/execution, scheduler runs) land here automatically." },
    { name: "postgres", type: "Container", desc: "The primary datasource — the auth.prisma migration from chapter 2 lives here." },
    { name: "workspace (second db)", type: "Container", desc: "The isolated workspace datasource from chapter 3, provisioned alongside the primary." },
    { name: "redis", type: "Container (cache)", desc: "Redis cache — the default `--cache-backend`; Redis-compatible. Backs KV/queue workloads and the kv-oauth session store." },
    { name: "workspace (service)", type: ":3001", desc: "Your guarded oRPC service from chapter 5 — /api/workspace requires a scoped principal, /health stays public." },
    { name: "auth-api", type: ":8094", desc: "The auth plugin's service from chapter 2 — /api/v1/auth/* (signin, callback, signout, session, me)." },
    { name: "workers-api", type: ":8091", desc: "The Workers API from chapter 4 — triggers and inspects the provision-member job." },
    { name: "background processors", type: "executables (no port)", desc: "The workers processor that drains the job queue — a separate process, not a thread in the API." }
  ]
}) }}

{{ comp callout { type: "note", title: "Plugin API ports are range-allocated" } }}
The runtime plugins publish their APIs from the <code>:8091–8099</code> PLUGIN_API range, and services
from the <code>:3000–3099</code> SERVICE range. The conventional assignments — workers
<code>:8091</code>, sagas <code>:8092</code>, triggers <code>:8093</code>, auth <code>:8094</code> — are
what a default workspace lands on, but the dashboard's resource list is the authority for the exact
port each resource bound. Read it from there, not from memory.
{{ /comp }}

## Step 3 — Use the dashboard

Open `https://localhost:18888`, paste the login token `aspire start` printed, and you have one pane over
the running graph:

{{ comp.apiTable({
  caption: "Aspire dashboard surfaces",
  rows: [
    { name: "Resources", type: "tab", desc: "Every container and executable above with status, endpoints, and the resolved environment. The authority for which port each resource bound." },
    { name: "Console logs", type: "tab", desc: "stdout/stderr per resource — a failing auth-api or workers processor is one click away." },
    { name: "Structured logs + Traces", type: "tab", desc: "Spans and structured logs correlated by traceparent across services — collected via the OTLP endpoint at :4318." }
  ]
}) }}

## Verify your progress

With the graph up, walk the whole app end to end — the auth service, the guarded route, and the job:

```sh
# Auth service is up (chapter 2)
curl http://localhost:8094/health/ready

# The guarded route rejects an anonymous caller (chapter 5)
curl -i http://localhost:3001/api/workspace            # 401 UNAUTHORIZED

# ...and allows a correctly-scoped one
curl -i -H 'authorization: Bearer read' http://localhost:3001/api/workspace   # 200

# The Workers API is live (chapter 4)
curl http://localhost:8091/api/v1/workers/jobs         # provision-member appears
```

- [ ] `aspire restore` and `aspire start` succeed from inside `aspire/`.
- [ ] The dashboard on `:18888` lists `postgres`, `workspace` (db), `redis`, `workspace` (service), `auth-api`, and `workers-api` — all green.
- [ ] `curl http://localhost:8094/health/ready` succeeds.
- [ ] An anonymous `GET /api/workspace` returns `401`; `Bearer read` returns `200`.
- [ ] `GET /api/v1/workers/jobs` lists `provision-member`.

{{ comp callout { type: "warning", title: "Aspire is the LOCAL story — not a production deployer" } }}
<code>aspire start</code> exists to make <code>git clone</code> &rarr; one command produce a complete,
observable, correctly-wired stack on <strong>one machine</strong>. The Postgres and Redis it starts
are throwaway Docker containers for dev convenience — <strong>not</strong> your production database or
cache, and the <code>kv-oauth</code> session store and auth credentials here are local-dev values. For
a remote target you point processes at managed infrastructure and let your platform own lifecycle;
that is the <a href="/how-to/deploy/">Deploy</a> recipe.
{{ /comp }}

{{ comp callout { type: "warning", title: "Footguns when aspire start will not boot" } }}
<ul>
<li><strong>Docker not running.</strong> Aspire provisions Postgres + Redis (and the second workspace
db) through Docker; no daemon means the happy path does not start.</li>
<li><strong>Wrong directory.</strong> <code>aspire restore</code> and <code>aspire start</code> run from
inside <code>aspire/</code>; <code>netscript db</code> commands run from the workspace root.</li>
<li><strong>db command before aspire start.</strong> Every <code>netscript db</code> command needs a live
Postgres — bring the graph up first.</li>
<li><strong>Ports in use.</strong> The dashboard wants <code>:18888</code>/<code>:18889</code> and OTLP
<code>:4318</code>; services and plugin APIs claim the <code>:3000+</code> and <code>:8091–8099</code>
ranges. A stale prior run holding a port blocks boot.</li>
</ul>
{{ /comp }}

## What you built

The complete authenticated team-workspace backend, running locally as one orchestrated system:
Postgres, an isolated workspace database, Redis, the guarded `workspace` service, the `auth-api`
service on `:8094`, and the Workers API and its processor — all in one Aspire resource graph,
observable from one dashboard. You walked the whole arc: a pluggable auth backend, a session, team
data on its own catalog datasource, off-path provisioning, and a route-authz seam that fails closed —
single-tenant by design, with org scoping an explicit app-level extension. The off-boarded contractor
gets a `401`; the engineer you paged gets provisioned without anyone waiting on the write.

## Where to go next

- **Ship it remotely** → [Deploy](/how-to/deploy/) — the production companion: deployable units,
  managed backing services, and the `--no-aspire` path.
- **Go deeper on auth** → [Authentication capability](/capabilities/auth/) and
  [The authentication model](/explanation/auth-model/).
- **Understand the orchestrator** → [Orchestration with Aspire](/explanation/aspire/).
- **Browse more recipes** → the [how-to guides](/how-to/).

{{ comp.nextPrev({ prev: { label: "5 · Route authz", href: "/tutorials/workspace/05-route-authz/" }, next: { label: "How-to guides", href: "/how-to/" } }) }}
</content>
