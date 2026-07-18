---
layout: layouts/base.vto
title: Run the whole dashboard under Aspire
templateEngine: [vento, md]
prev: { label: "5 · Live stream", href: "/tutorials/live-dashboard/05-live-stream/" }
next: { label: "How-to guides", href: "/how-to/" }
---

# Run the whole dashboard under Aspire

You have built the full spine — contract, service, query layer, page, and live stream. This final
chapter steps back and runs the entire graph as one system: the `orders` service, the Fresh
dashboard, the durable-streams runtime, Postgres, and Redis, all under a single `aspire start`. That
is the payoff of scaffolding on NetScript — you never wrote a compose file, a container manifest, or
a service-discovery config, yet one command boots the whole graph in dependency order, resolves
every cross-reference into injected environment variables, and hands you a live view of it. This
chapter is also precise about what local Aspire is — a development orchestrator — and what it is not.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/live-dashboard/01-scaffold/" },
  { label: "2 · Contract to service", href: "/tutorials/live-dashboard/02-contract-to-service/" },
  { label: "3 · Cache-first query", href: "/tutorials/live-dashboard/03-sdk-cache-first-query/" },
  { label: "4 · definePage + island", href: "/tutorials/live-dashboard/04-definePage-QueryIsland/" },
  { label: "5 · Live stream", href: "/tutorials/live-dashboard/05-live-stream/" },
  { label: "6 · Deploy", href: "/tutorials/live-dashboard/06-deploy/" }
] }) }}

## What you will build

A complete, observable run of `my-dashboard/` on one machine: every resource your dashboard touches,
booted in dependency order from a single command, with the wiring resolved into injected environment
variables and the whole graph visible in the Aspire dashboard at `:18888`. You finish the track with
a running live dashboard you can open, watch, and trust you understand.

## Before you begin

You should have completed [chapter 5](/tutorials/live-dashboard/05-live-stream/): the live monitor
updating in real time. The AppHost was scaffolded back in chapter 1 (you did not pass `--no-aspire`),
so confirm the orchestration entry points are on disk — from the workspace root:

```sh
ls aspire/apphost.mts aspire/aspire.config.json
```

Both files should exist. `apphost.mts` is the **TypeScript/Node** program `aspire start` executes;
`aspire.config.json` pins the SDK. `netscript init` generated them — you never hand-write the
AppHost.

{{ comp callout { type: "note", title: "The graph is derived from your plugins" } }}
The resource graph inside the AppHost is assembled at boot from your installed plugins via <code>composeAppHost</code> — add the sagas plugin (chapter 5) and its API plus its streams runtime appear; remove it and they vanish, no edit to <code>apphost.mts</code>. The mechanics are in <a href="/explanation/aspire/">Orchestration with Aspire</a>.
{{ /comp }}

## Step 1 — Restore the AppHost SDK (once)

The AppHost runs on its own isolated Node runtime inside `aspire/` so its dependencies never leak
into your Deno workspace. Restore that runtime once per machine (and after an SDK bump):

```sh
cd aspire
aspire restore
```

## Step 2 — Start the whole graph

A single `aspire start` translates `appsettings.json` plus the plugin contributions into a resource
graph and boots all of it — infrastructure first, then the service, the Fresh app, and the streams
runtime, with cross-references resolved into injected environment variables:

```sh
# Still inside aspire/. Prints the dashboard URL + a one-time login token.
aspire start
```

When boot finishes, `aspire start` prints the dashboard address and a login token. The graph it stands
up for this track:

{{ comp.apiTable({
  caption: "What aspire start brings up for my-dashboard",
  rows: [
    { name: "aspire (dashboard)", type: "https://localhost:18888", desc: "The Aspire dashboard: live resource list, console logs, structured logs and traces. A login token prints on start." },
    { name: "postgres", type: "Container", desc: "Provisioned via Docker. The database your orders service reads — reachable only once Aspire is up." },
    { name: "redis", type: "Container (cache)", desc: "Redis cache — the default `--cache-backend`; Redis-compatible. Backs the KV-backed query layer from chapter 3." },
    { name: "orders", type: ":3002", desc: "Your oRPC service (defineService). RPC at /api/rpc/*, OpenAPI at /api/v1/orders/*." },
    { name: "dashboard (Fresh app)", type: ":8010", desc: "Your Fresh frontend — the live dashboard you built in chapters 4–5." },
    { name: "streams", type: ":4437", desc: "Durable-streams producer runtime, present once the sagas plugin is installed. Feeds useLiveQuery." }
  ]
}) }}

{{ comp callout { type: "note", title: "Ports are range-allocated — read the dashboard for the truth" } }}
The conventional ports above (orders <code>:3002</code>, Fresh app <code>:8010</code>, streams <code>:4437</code>) are what a default workspace lands on, but services come from the <code>:3000–3099</code> range and plugin runtimes from <code>:8091–8099</code> / <code>:4437</code>. The Aspire dashboard's resource list is the authority for the exact port each resource bound — read it from there, not from memory.
{{ /comp }}

## Step 3 — Open the live dashboard

With the graph up, open your Fresh app and the orders route you built:

```
http://localhost:8010/dashboard/orders/
```

The table renders cache-first (chapter 4), refetches on the client, and — if the streams runtime is
up — the live monitor updates in real time (chapter 5). Then open the Aspire dashboard to watch the
system behind it:

```
https://localhost:18888
```

Paste the login token `aspire start` printed. You get one pane over the running graph:

{{ comp.apiTable({
  caption: "Aspire dashboard surfaces",
  rows: [
    { name: "Resources", type: "tab", desc: "Every container and process with status, endpoints, and resolved environment. The authority for which port each resource bound." },
    { name: "Console logs", type: "tab", desc: "stdout/stderr per resource — a failing service or streams runtime is one click away, not buried in a terminal." },
    { name: "Structured logs + Traces", type: "tab", desc: "Spans your handlers and pages emit (including the withTelemetry span from chapter 4), correlated across resources via the OTLP collector on :4318." }
  ]
}) }}

## Step 4 — Watch a request flow through the graph

Create an order and follow it across the whole stack in one place. From a second terminal:

```sh
curl -X POST http://localhost:3002/api/v1/orders/create \
  -H 'content-type: application/json' \
  -d '{ "userId": 1, "total": 49.9, "status": "pending", "shippingStreet": "1 Main", "shippingCity": "Berlin", "shippingCountry": "DE", "shippingZipCode": "10115", "items": [{ "productId": 1, "quantity": 1 }] }'
```

In the **Resources** tab you can see the `orders` service handle it; in **Traces** the request shows
as a span; the live monitor in your Fresh app advances a new saga row; and the orders table picks up
the new order on its next revalidation. One command, the full spine, observable end to end.

## Verify your progress

```sh
# From the workspace root, with `aspire start` up in another terminal:
curl http://localhost:3002/health      # orders service
curl http://localhost:4437/health      # streams runtime (if sagas installed)
```

Both should return healthy responses, and the dashboard at `:18888` should list `postgres`,
`redis`, `orders`, the Fresh `dashboard`, and `streams` all running.

- [ ] `aspire restore` then `aspire start` boots the graph without errors.
- [ ] `https://localhost:18888` lists every resource healthy.
- [ ] `http://localhost:8010/dashboard/orders/` renders the live table.
- [ ] Creating an order is visible in the dashboard traces and the live monitor.

{{ comp callout { type: "warning", title: "Aspire is the LOCAL story — not a production deployer" } }}
<code>aspire start</code> exists to make one command produce a complete, observable, correctly-wired stack on <strong>one machine</strong>. The Postgres and Redis it starts are throwaway Docker containers for dev convenience — <strong>not</strong> your production database or cache. For a remote target you point processes at managed infrastructure and let your platform own lifecycle; that is the <a href="/orchestration-runtime/how-to/deploy/">Deploy</a> recipe, and the <code>--no-aspire</code> path in <a href="/explanation/aspire/">Orchestration with Aspire</a>.
{{ /comp }}

{{ comp callout { type: "warning", title: "Footguns when aspire start will not boot" } }}
<ul>
<li><strong>Docker not running.</strong> Aspire provisions Postgres + Redis through Docker; no daemon means the happy path does not start. Start Docker, or take the <code>--no-aspire</code> path with your own infrastructure.</li>
<li><strong>Wrong directory.</strong> <code>aspire restore</code> and <code>aspire start</code> run from inside <code>aspire/</code>; <code>netscript db</code> commands run from the workspace root. Mixing them up is the most common first-run error.</li>
<li><strong>db command before <code>aspire start</code>.</strong> Every <code>netscript db</code> command needs a live Postgres — bring the graph up first.</li>
<li><strong>Ports in use.</strong> The dashboard wants <code>:18888</code>/<code>:18889</code> and OTLP <code>:4318</code>; the service, Fresh app, and streams claim <code>:3000+</code>, <code>:8010</code>, and <code>:4437</code>. A stale prior run holding a port blocks boot — free it.</li>
</ul>
{{ /comp }}

## What you built

You ran the complete `my-dashboard/` graph under one `aspire start`: service, Fresh app, durable
streams, Postgres, and Redis, wired automatically and observable in the dashboard at `:18888`. That
closes the track — the order queue from the opening premise is real now: no polling loop, no refresh
button, no window where a cancelled order looks shippable. You built and ran it on the full
NetScript spine.

## Where to go next

- **Task recipes** → the [how-to guides](/how-to/) cover what the tutorials don't: adding plugins,
  database migrations, queue backends, and production pitfalls.
- **Ship it remotely** → [Deploy](/orchestration-runtime/how-to/deploy/) is the production companion to local Aspire.
- **Go deeper** → [Orchestration with Aspire](/explanation/aspire/) explains the AppHost, plugin
  contributions, and two-pass reference resolution; {{ comp.xref({ key: "cap:streams" }) }} and
  {{ comp.xref({ key: "cap:fresh-framework", text: "the Fresh meta-framework" }) }} back chapters 4
  and 5.

{{ comp.nextPrev({ prev: { label: "5 · Live stream", href: "/tutorials/live-dashboard/05-live-stream/" }, next: { label: "How-to guides", href: "/how-to/" } }) }}
