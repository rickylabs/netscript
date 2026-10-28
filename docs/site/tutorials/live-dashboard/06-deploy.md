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
booted from a single command and visible in the Aspire dashboard at `:18888`.

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
# Still inside aspire/. Prints the dashboard URL + a one-time login token.
aspire start
```

When boot finishes, `aspire start` prints the dashboard address and a login token. The graph it
brings up for this track:

{{ comp.apiTable({
  caption: "What aspire start brings up for my-dashboard",
  rows: [
    { name: "aspire (dashboard)", type: "https://localhost:18888", desc: "The Aspire dashboard: live resource list, console logs, structured logs and traces. A login token prints on start." },
    { name: "postgres", type: "Container", desc: "Provisioned via Docker. The database your orders service reads — reachable only once Aspire is up." },
    { name: "redis", type: "Container (cache)", desc: "Redis cache — the default `--cache-backend`; Redis-compatible. Backs the KV-backed query layer from chapter 3." },
    { name: "orders", type: ":3002", desc: "Your oRPC service (defineService). RPC at /api/rpc/*, OpenAPI at /api/v1/orders/*." },
    { name: "dashboard (Fresh app)", type: "allocated port", desc: "Your Fresh frontend — the live dashboard you built in chapters 4–5. Read its port from the dashboard resource list." },
    { name: "streams", type: "allocated port", desc: "Durable-streams producer runtime, present once the sagas plugin is installed. Feeds useLiveQuery." }
  ]
}) }}

{{ comp callout { type: "note", title: "Only pinned ports are predictable" } }}
<code>orders</code> answers on <code>:3002</code> because you pinned it with
<code>--service-port</code> in chapter 1. The Fresh <code>dashboard</code> app and every plugin
runtime installed without <code>--port</code> pin no host port, so <strong>Aspire allocates one at
every start</strong>. Read every unpinned port from the Aspire dashboard's resource list.
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
https://localhost:18888
```

Paste the login token `aspire start` printed:

{{ comp.apiTable({
  caption: "Aspire dashboard surfaces",
  rows: [
    { name: "Resources", type: "tab", desc: "Every container and process with status, endpoints, and resolved environment. The authority for which port each resource bound." },
    { name: "Console logs", type: "tab", desc: "stdout/stderr per resource — a failing service or streams runtime is one click away, not buried in a terminal." },
    { name: "Structured logs + Traces", type: "tab", desc: "Spans your handlers and pages emit (including the withTelemetry span from chapter 4), correlated across resources via the OTLP collector on :4318." }
  ]
}) }}

## Step 4 — Watch a request flow through the graph

Create an order and follow it across the stack. From a second terminal:

```sh
curl -X POST http://localhost:3002/api/v1/orders/create \
  -H 'content-type: application/json' \
  -d '{ "userId": 1, "total": 49.9, "status": "pending", "shippingStreet": "1 Main", "shippingCity": "Berlin", "shippingCountry": "DE", "shippingZipCode": "10115", "items": [{ "productId": 1, "quantity": 1 }] }'
```

The **Resources** tab shows the `orders` service handling it, **Traces** shows the request as a span,
and the orders table picks up the new order on its next revalidation. Creating an order doesn't
publish a saga message (see chapter 5), so the saga monitor doesn't change.

## Verify your progress

```sh
# From the workspace root, with `aspire start` up in another terminal:
curl http://localhost:3002/health      # orders service — pinned, so the port is known

# The streams runtime's port is allocated, not pinned. Copy its endpoint from the
# Aspire resource list, then:
curl <streams-endpoint>/health         # streams runtime (if sagas installed)
```

Both return healthy responses, and the dashboard at `:18888` lists `postgres`, `redis`, `orders`,
the Fresh `dashboard` and `streams`, all running.

- [ ] `aspire restore` then `aspire start` boots the graph without errors.
- [ ] `https://localhost:18888` lists every resource healthy.
- [ ] The `dashboard` app's endpoint (from the resource list) + `/dashboard/orders/` renders the
      live table.
- [ ] Creating an order is visible in the dashboard traces.

{{ comp callout { type: "tip", title: "If aspire start won't boot" } }}
<ul>
<li><strong>Docker isn't running.</strong> Aspire provisions Postgres and Redis through Docker. Start
Docker, or take the <code>--no-aspire</code> path with your own infrastructure.</li>
<li><strong>Wrong directory.</strong> <code>aspire restore</code> and <code>aspire start</code> run
from inside <code>aspire/</code>; <code>netscript db</code> commands run from the workspace root.</li>
<li><strong>A db command ran before <code>aspire start</code>.</strong> Every <code>netscript db</code>
command needs a live Postgres. Bring the graph up first.</li>
<li><strong>Ports in use.</strong> The dashboard uses <code>:18888</code>/<code>:18889</code> and OTLP
<code>:4318</code>; the pinned <code>orders</code> service uses <code>:3002</code>, the streams
runtime an installer-allocated port in <code>49152–65535</code>, and the Fresh app whatever Aspire
assigns at start. A stale earlier run holding a port blocks boot.</li>
</ul>
{{ /comp }}

## What you built

The complete `my-dashboard/` graph under one `aspire start`: the service, the Fresh app, durable
streams, Postgres and Redis, wired automatically and observable in the dashboard at `:18888`. Across
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
