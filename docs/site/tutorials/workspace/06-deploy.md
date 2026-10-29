---
layout: layouts/base.vto
title: Run the team workspace under Aspire
templateEngine: [vento, md]
prev: { label: "5 · Route authz", href: "/tutorials/workspace/05-route-authz/" }
next: { label: "Build", href: "/how-to/" }
---

# Run the team workspace under Aspire

In this chapter you run the whole team workspace as one system. A single `aspire start` brings up
Postgres, the Redis cache, your `workspace` service, the `auth-api` service at its allocated endpoint, the Workers
API and every background processor, wired together and visible in one dashboard. `netscript init`
generated the AppHost in chapter 1, and each plugin you installed since (`auth`, then `workers`)
added its own service and processor to the resource graph, so there is no orchestration wiring to
maintain by hand.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/workspace/01-scaffold/" },
  { label: "2 · Auth", href: "/tutorials/workspace/02-auth/" },
  { label: "3 · Workspace data", href: "/tutorials/workspace/03-workspace-data/" },
  { label: "4 · Provision job", href: "/tutorials/workspace/04-provision-job/" },
  { label: "5 · Route authz", href: "/tutorials/workspace/05-route-authz/" },
  { label: "6 · Deploy", href: "/tutorials/workspace/06-deploy/" }
] }) }}

## What you will build

Your complete `my-workspace/` running under one Aspire AppHost: every service, plugin API,
background processor and backing container in a single resource graph, observable from the dashboard
at the URL Aspire prints, including the auth service from chapter 2. At the end you can read the running
topology, with the exact port each resource bound, from one pane.

{{ comp callout { type: "warning", title: "Aspire runs the local topology, not production" } }}
<code>aspire start</code> turns <code>git clone</code> plus one command into a complete, observable,
correctly wired stack on <strong>one machine</strong>. The Postgres and Redis it starts are throwaway
Docker containers, <strong>not</strong> your production database or cache, and the
<code>kv-oauth</code> session store and auth credentials here are local development values. For a
remote target, point processes at managed infrastructure and let your platform own the lifecycle;
see the <a href="/orchestration-runtime/how-to/deploy/">Deploy</a> recipe.
{{ /comp }}

## Before you begin

You need everything from chapters 1–5: the scaffolded workspace, the `auth` plugin, the second
database, the workers plugin and `provision-member` job, and the guarded `workspace` service.
`netscript init` scaffolded the AppHost in chapter 1 (you didn't pass `--no-aspire`). Confirm the
orchestration entry point is on disk and the workspace type-checks:

```sh
# From the workspace root
ls aspire/apphost.mts aspire/aspire.config.json
deno task check
```

## Step 1 — Restore the AppHost SDK (once)

The AppHost runs on its own isolated Node runtime inside `aspire/`, so its dependencies never leak
into your Deno workspace. Restore that runtime once per machine, and again after an SDK bump:

```sh
cd aspire
aspire restore
```

## Step 2 — Start the whole graph

`aspire start` turns `appsettings.json` and your plugin contributions into a resource graph and boots
all of it: infrastructure first, then services, plugin APIs and background processors, with
cross-references resolved into injected environment variables.

```sh
# Still inside aspire/. Boots the whole graph; prints the dashboard URL.
aspire start
```

When boot finishes, `aspire start` prints the allocated dashboard address. The graph
it brings up:

{{ comp.apiTable({
  caption: "The local resource graph aspire start brings up",
  rows: [
    { name: "aspire (dashboard)", type: "the URL Aspire prints", desc: "The Aspire dashboard — live resource list, console logs, structured logs, and traces. The generated local profile allows anonymous dashboard access." },
    { name: "OTLP collector", type: "the OTLP URL Aspire prints", desc: "OpenTelemetry endpoint; framework spans (job dispatch/execution, scheduler runs) land here automatically." },
    { name: "postgres", type: "Container", desc: "The primary datasource — the auth.prisma migration from chapter 2 lives here." },
    { name: "workspace (second db)", type: "Container", desc: "The isolated workspace datasource from chapter 3, provisioned alongside the primary." },
    { name: "redis", type: "Container (cache)", desc: "Redis cache — the default `--cache-backend`; Redis-compatible. Backs KV/queue workloads and the kv-oauth session store." },
    { name: "workspace (service)", type: ":3001", desc: "Your guarded oRPC service from chapter 5 — /api/workspace requires a scoped principal, /health stays public." },
    { name: "auth-api", type: "allocated endpoint", desc: "The auth plugin's service from chapter 2 — /api/v1/auth/* (signin, callback, signout, sessions/revoke, session, me)." },
    { name: "workers-api", type: "allocated port", desc: "The Workers API from chapter 4 — triggers and inspects the provision-member job." },
    { name: "background processors", type: "executables (no port)", desc: "The workers processor that drains the job queue — a separate process, not a thread in the API." }
  ]
}) }}

{{ comp callout { type: "note", title: "Read allocated endpoints" } }}
Open the dashboard at the URL Aspire prints and read each resource's endpoint from its Resources
view. The auth and worker APIs need no conventional host port. The generated app's BFF owns the
browser callback; use the app origin configured with your identity provider.
{{ /comp }}

## Step 3 — Use the dashboard

Open the URL Aspire prints (the generated local profile allows anonymous access):

{{ comp.apiTable({
  caption: "Aspire dashboard surfaces",
  rows: [
    { name: "Resources", type: "tab", desc: "Every container and executable above with status, endpoints, and the resolved environment. The authority for which port each resource bound." },
    { name: "Console logs", type: "tab", desc: "stdout/stderr per resource — a failing auth-api or workers processor is one click away." },
    { name: "Structured logs + Traces", type: "tab", desc: "Spans and structured logs correlated by traceparent across services — collected via the OTLP endpoint at the OTLP URL Aspire prints." }
  ]
}) }}

## Verify your progress

With the graph up, check the app end to end: the auth service, the guarded route and the job.

```sh
netscript service list
netscript contract inspect workspace
netscript plugin doctor
ns-workers executions --limit=10 --json
```

Use `list_api_services` → `list_service_operations` → `get_operation_schema` to inspect the live
`workspace.members` operation. Call it through the server-side session client from chapter 5 with
`{ workspace: 'ws-1', limit: 20, offset: 0 }`. A request without a session returns 401; a session
without `workspace:read` returns 403; a member with that scope receives the members list.

- [ ] `aspire restore` and `aspire start` succeed from inside `aspire/`.
- [ ] The dashboard at the URL Aspire prints lists `postgres`, `workspace` (db), `redis`, `workspace` (service), `auth-api`, and `workers-api` — all green.
- [ ] Aspire reports the auth service ready at its allocated endpoint.
- [ ] An anonymous `GET /api/workspace` returns `401`; `Bearer read` returns `200`.
- [ ] `GET /api/v1/workers/jobs` lists `provision-member`.

{{ comp callout { type: "tip", title: "If aspire start won't boot" } }}
<ul>
<li><strong>Docker isn't running.</strong> Aspire provisions Postgres, Redis and the second workspace
database through Docker.</li>
<li><strong>Wrong directory.</strong> <code>aspire restore</code> and <code>aspire start</code> run
from inside <code>aspire/</code>; <code>netscript db</code> commands run from the workspace root.</li>
<li><strong>A db command ran before <code>aspire start</code>.</strong> Every <code>netscript db</code>
command needs a live Postgres. Bring the graph up first.</li>
<li><strong>Ports in use.</strong> Read allocated endpoints from Aspire. Stop an earlier run that
owns a conflicting resource before starting another; a pinned endpoint is not isolated automatically.</li>
</ul>
{{ /comp }}

## What you built

The complete authenticated team-workspace backend, running locally as one orchestrated system:
Postgres, an isolated workspace database, Redis, the guarded `workspace` service, the `auth-api`
service at its allocated endpoint, and the Workers API with its processor, all in one Aspire resource graph. Across
the track you added a pluggable auth backend, a session, team data in its own datasource, off-path
provisioning and a route-authz seam that fails closed. The app is single-tenant by design, with org
scoping as an app-level extension.

## Next steps

- **Deploy remotely** → [Deploy](/orchestration-runtime/how-to/deploy/): deployable units, managed
  backing services and the `--no-aspire` path.
- **Go deeper on auth** → [Authentication capability](/identity-access/auth/) and
  [The authentication model](/explanation/auth-model/).
- **Understand the orchestrator** → [Orchestration with Aspire](/explanation/aspire/).
- **Browse more recipes** → the recipes in [Build](/how-to/).
