---
layout: layouts/base.vto
title: Run the dashboard under Aspire
templateEngine: [vento, md]
prev: { label: "5 · Live stream", href: "/tutorials/live-dashboard/05-live-stream/" }
next: { label: "Build", href: "/how-to/" }
---

# Run the dashboard under Aspire

In this chapter you run the entire graph as one system under a single `aspire start`: the `orders`
service, the Fresh dashboard, the durable-streams runtime, Postgres and Redis. You never wrote a
compose file, a container manifest or a service-discovery config; one command boots the graph in
dependency order and resolves every cross-reference into injected environment variables.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/live-dashboard/01-scaffold/" },
  { label: "2 · Contract to service", href: "/tutorials/live-dashboard/02-contract-to-service/" },
  { label: "3 · Cache-first query", href: "/tutorials/live-dashboard/03-sdk-cache-first-query/" },
  { label: "4 · definePage + island", href: "/tutorials/live-dashboard/04-definePage-QueryIsland/" },
  { label: "5 · Live stream", href: "/tutorials/live-dashboard/05-live-stream/" },
  { label: "6 · Deploy", href: "/tutorials/live-dashboard/06-deploy/" }
] }) }}

## What you will build

A complete, observable run of `my-dashboard/` on one machine: every resource your dashboard uses,
booted from a single command and visible in the Aspire dashboard at the URL Aspire prints.

{{ comp callout { type: "warning", title: "Aspire runs the local topology, not production" } }}
<code>aspire start</code> turns one command into a complete, observable, correctly wired stack on
<strong>one machine</strong>. The Postgres and Redis it starts are throwaway Docker containers,
<strong>not</strong> your production database or cache. For a remote target, point processes at
managed infrastructure and let your platform own the lifecycle; see the
<a href="/orchestration-runtime/how-to/deploy/">Deploy</a> recipe and the <code>--no-aspire</code> path
in <a href="/explanation/aspire/">Orchestration with Aspire</a>.
{{ /comp }}

## Before you begin

You need [chapter 5](/tutorials/live-dashboard/05-live-stream/)'s live monitor receiving mirrored
saga state over its open subscription. `netscript init` scaffolded the AppHost in chapter 1 (you
didn't pass `--no-aspire`). From the workspace root, confirm the orchestration entry points are on
disk:

```sh
ls aspire/apphost.mts aspire/aspire.config.json
```

Both files exist. `apphost.mts` is the **TypeScript/Node** program `aspire start` runs, and
`aspire.config.json` pins the SDK. You don't write the AppHost by hand.

{{ comp callout { type: "note", title: "The graph is derived from your plugins" } }}
<code>composeAppHost</code> assembles the resource graph at boot from your installed plugins. Add the
sagas plugin (chapter 5) and its API and streams runtime appear; remove it and they disappear, with
no edit to <code>apphost.mts</code>. See <a href="/explanation/aspire/">Orchestration with Aspire</a>.
{{ /comp }}

## Step 1 — Restore the AppHost SDK (once)

The AppHost runs on its own isolated Node runtime inside `aspire/`, so its dependencies never leak
into your Deno workspace. Restore that runtime once per machine, and again after an SDK bump:

```sh
cd aspire
aspire restore
```

## Step 2 — Start the whole graph

`aspire start` turns `appsettings.json` and the plugin contributions into a resource graph and boots
all of it: infrastructure first, then the service, the Fresh app and the streams runtime, with
cross-references resolved into injected environment variables.

```sh
# Still inside aspire/. Prints the dashboard URL.
aspire start
```

When boot finishes, `aspire start` prints the allocated dashboard address. The graph it
brings up for this track:

{{ comp.apiTable({
  caption: "What aspire start brings up for my-dashboard",
  rows: [
    { name: "aspire (dashboard)", type: "the URL Aspire prints", desc: "The Aspire dashboard: live resource list, console logs, structured logs and traces. The generated local profile allows anonymous access." },
    { name: "postgres", type: "Container", desc: "Provisioned via Docker. The database your orders service reads — reachable only once Aspire is up." },
    { name: "redis", type: "Container (cache)", desc: "Redis cache — the default `--cache-backend`; Redis-compatible. Backs the KV-backed query layer from chapter 3." },
    { name: "orders", type: "allocated endpoint", desc: "Your oRPC service (defineService). RPC at /api/rpc/*, OpenAPI at /api/v1/orders/*." },
    { name: "dashboard (Fresh app)", type: "allocated port", desc: "Your Fresh frontend — the live dashboard you built in chapters 4–5. Read its port from the dashboard resource list." },
    { name: "streams", type: "allocated port", desc: "Durable-streams producer runtime, present once the sagas plugin is installed. Feeds useLiveQuery." }
  ]
}) }}

{{ comp callout { type: "note", title: "Read allocated endpoints" } }}
Read the service, plugin and app endpoints from the Aspire resource list or
<code>aspire describe</code>. The CLI commands in this track do not pin host ports.
{{ /comp }}

## Step 3 — Open the live dashboard

Find the `dashboard` resource in the Aspire resource list, open its endpoint, and append the orders
route you built:

```text
/dashboard/orders/
```

The table renders cache-first (chapter 4) and refetches on the client, and, with the streams runtime
up, the saga monitor receives pushed updates over its subscription (chapter 5). Then open the Aspire
dashboard to see the system behind it:

```text
the URL Aspire prints
```

The generated local profile allows anonymous dashboard access:

{{ comp.apiTable({
  caption: "Aspire dashboard surfaces",
  rows: [
    { name: "Resources", type: "tab", desc: "Every container and process with status, endpoints, and resolved environment. The authority for which port each resource bound." },
    { name: "Console logs", type: "tab", desc: "stdout/stderr per resource — a failing service or streams runtime is one click away, not buried in a terminal." },
    { name: "Structured logs + Traces", type: "tab", desc: "Spans your handlers and pages emit (including the withTelemetry span from chapter 4), correlated across resources via the OTLP collector at the OTLP URL Aspire prints." }
  ]
}) }}

## Step 4 — Watch a request flow through the graph

Read the catalog through the typed `ordersClient.list({ limit: 20, offset: 0 })` call from chapter 3,
inside the app. The **Traces** view shows the service request, and the table receives the returned
rows on its next revalidation. The read-model contract from chapter 2 exposes `list`; it does not
add a create operation. Add writes through a separate declared contract and handler when your app
needs them. A service query does not publish a saga message.

## Verify your progress

```sh
# From the workspace root, with `aspire start` up in another terminal:
curl "$SERVICE_URL/health"      # orders service URL from Aspire

# The streams runtime's port is allocated, not pinned. Copy its endpoint from the
# Aspire resource list, then:
curl <streams-endpoint>/health         # streams runtime (if sagas installed)
```

Both return healthy responses, and the dashboard at the URL Aspire prints lists `postgres`, `redis`, `orders`,
the Fresh `dashboard` and `streams`, all running.

- [ ] `aspire restore` then `aspire start` boots the graph without errors.
- [ ] The dashboard at the URL Aspire prints lists every resource healthy.
- [ ] The `dashboard` app's endpoint (from the resource list) + `/dashboard/orders/` renders the
      live table.
- [ ] The typed orders query is visible in the dashboard traces.

{{ comp callout { type: "tip", title: "If aspire start won't boot" } }}
<ul>
<li><strong>Docker isn't running.</strong> Aspire provisions Postgres and Redis through Docker. Start
Docker, or take the <code>--no-aspire</code> path with your own infrastructure.</li>
<li><strong>Wrong directory.</strong> <code>aspire restore</code> and <code>aspire start</code> run
from inside <code>aspire/</code>; <code>netscript db</code> commands run from the workspace root.</li>
<li><strong>A db command ran before <code>aspire start</code>.</strong> Every <code>netscript db</code>
command needs a live Postgres. Bring the graph up first.</li>
<li><strong>Ports in use.</strong> Stop an earlier run only when you know it owns the conflicting
resource. Read the current run's allocated endpoints from Aspire, then retry.</li>
</ul>
{{ /comp }}

## What you built

The complete `my-dashboard/` graph under one `aspire start`: the service, the Fresh app, durable
streams, Postgres and Redis, wired automatically and observable in the dashboard at the URL Aspire prints. Across
the track you carried one contract from the database to a cache-first page and a server-pushed live
view.

## Next steps

- **Task recipes** → the recipes in [Build](/how-to/) cover what the tutorials don't: adding plugins,
  database migrations, queue backends, and production pitfalls.
- **Deploy remotely** → [Deploy](/orchestration-runtime/how-to/deploy/) is the production companion
  to local Aspire.
- **Go deeper** → [Orchestration with Aspire](/explanation/aspire/) explains the AppHost, plugin
  contributions, and two-pass reference resolution; {{ comp.xref({ key: "cap:streams" }) }} and
  {{ comp.xref({ key: "cap:fresh-framework", text: "the Fresh meta-framework" }) }} back chapters 4
  and 5.
