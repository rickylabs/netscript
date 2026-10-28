---
layout: layouts/base.vto
title: Run the whole storefront
templateEngine: [vento, md]
prev: { label: "6 · Storefront UI", href: "/tutorials/storefront/06-storefront-ui/" }
next: { label: "How-to guides", href: "/how-to/" }
---

# Run the whole storefront

In this chapter you run the **entire** `my-shop/` as one system under a single `aspire start`: the
products service, the storefront page, the checkout saga, the shipping webhook, Postgres and the
cache, all visible from one dashboard. Everything you added chapter by chapter (a service, the
runtime plugins, a webhook, a Fresh page) joined one resource graph as you added it, so you never
edit an orchestrator by hand: `netscript init` scaffolded the graph and `aspire start` runs it.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/storefront/01-scaffold/" },
  { label: "2 · Catalog service", href: "/tutorials/storefront/02-catalog-service/" },
  { label: "3 · Cart contracts", href: "/tutorials/storefront/03-cart-contracts/" },
  { label: "4 · Checkout saga", href: "/tutorials/storefront/04-checkout-saga/" },
  { label: "5 · Shipping webhook", href: "/tutorials/storefront/05-shipping-webhook/" },
  { label: "6 · Storefront UI", href: "/tutorials/storefront/06-storefront-ui/" },
  { label: "7 · Deploy", href: "/tutorials/storefront/07-deploy/" }
] }) }}

## What you will build

The complete storefront under one orchestrator. `aspire start` turns your `appsettings.json` and the
installed plugins into one resource graph and boots all of it (infrastructure, services, plugin APIs
and background processors), then gives you a dashboard over it. At the end you read the live port map
from the dashboard and confirm every resource is healthy.

{{ comp callout { type: "warning", title: "Aspire runs the local topology, not production" } }}
<code>aspire start</code> turns one command into a complete, correctly wired stack on <strong>one
machine</strong>. The Postgres and Redis it starts are throwaway Docker containers,
<strong>not</strong> your production database or cache. NetScript doesn't ship a cloud deployer for
your app: for a remote target, you point processes at managed infrastructure yourself. See the
<a href="/orchestration-runtime/how-to/deploy/">Deploy</a> and
<a href="/orchestration-runtime/how-to/deploy-local-aspire/">Deploy locally with Aspire</a> how-to
guides.
{{ /comp }}

## Before you begin

You should have finished [chapter 6](/tutorials/storefront/06-storefront-ui/), so `my-shop/` has:

- The `products` service, the `cart` contract, and the storefront page that reads and mutates through
  the typed clients from chapter 6.
- The `workers`, `sagas`, and `streams` plugins (with `CheckoutSaga` and the `process-payment` job)
  and the `triggers` plugin (with the shipping webhook and its `process-shipping-update` job).

Confirm the full plugin set is installed:

```sh
netscript plugin list
```

The list shows `workers`, `sagas`, `streams` and `triggers`. If `aspire start` from earlier chapters
is still up, stop it: this chapter starts the whole graph fresh.

## Step 1 — Confirm the AppHost was scaffolded

The orchestrator's entry point is a small **TypeScript/Node** program (not C#) at
`aspire/apphost.mts`, configured by `aspire/aspire.config.json`. `netscript init` generated it in
chapter 1; you don't write it by hand. Check it is on disk:

```sh
# From the workspace root — these two files are the orchestration entry point.
ls aspire/apphost.mts aspire/aspire.config.json
```

The graph inside the AppHost is **derived from your installed plugins** at boot. The plugins you
added in chapter 4 are why their APIs and background processors appear in the graph, with no edit to
`apphost.mts`.

{{ comp callout { type: "note", title: "There is no netscript generate aspire" } }}
Only <code>netscript init</code> produces the AppHost. <code>netscript generate</code> covers
<code>runtime-schemas</code> and <code>plugins</code>, not the AppHost. To change the graph, add or
remove a plugin (or edit <code>appsettings.json</code>) and let the contributions re-derive it.
{{ /comp }}

## Step 2 — Restore the AppHost SDK (once)

The AppHost runs on its own isolated Node runtime inside `aspire/`, so its dependencies never leak
into your Deno workspace. You restored it in chapter 1; the command is idempotent:

```sh
cd aspire
aspire restore
```

## Step 3 — Start the whole resource graph

`aspire start` turns `appsettings.json` and the plugin contributions into a resource graph and boots
all of it: infrastructure first, then services, plugin APIs and background processors, with
cross-references resolved into injected environment variables.

```sh
# Still inside aspire/. Boots the whole graph; prints the dashboard URL + a login token.
aspire start
```

When boot finishes, `aspire start` prints the dashboard address and a one-time login token. The graph
it brings up for the storefront:

{{ comp.apiTable({ caption: "What `aspire start` brings up for my-shop/", rows: [
  { name: "aspire (dashboard)", type: "https://localhost:18888 / http://localhost:18889", desc: "Live resource list, console logs, structured logs and traces. A login token is printed on start." },
  { name: "OTLP collector", type: "http://localhost:4318", desc: "OpenTelemetry endpoint the dashboard runs; framework spans and structured logs land here automatically." },
  { name: "postgres", type: "Container", desc: "Provisioned via Docker. The database your products handlers and saga store target — reachable only while Aspire is up." },
  { name: "redis", type: "Container (cache)", desc: "Redis cache — the default `--cache-backend`; Redis-compatible. Backs KV/queue workloads for the runtime plugins." },
  { name: "products (service)", type: ":3001 (pinned in chapter 1)", desc: "Your catalog service. OpenAPI at /api/products/* and RPC at /api/rpc/*." },
  { name: "sagas API", type: "allocated port", desc: "Lists sagas and instances — where you watched CheckoutSaga in chapter 4." },
  { name: "triggers API", type: "allocated port", desc: "The Hono webhook ingress from chapter 5 — /api/v1/webhooks/shipping/status." },
  { name: "workers API", type: "allocated port", desc: "Lists job executions — where the enqueued shipping and payment jobs run." },
  { name: "streams", type: "allocated port", desc: "The durable streams transport that carries cross-plugin messages between the saga and the workers." },
  { name: "background processors", type: "executables (no port)", desc: "Each plugin's isolated runners (workers, sagas, triggers) — separate processes, not threads inside the API." }
] }) }}

{{ comp callout { type: "note", title: "Only pinned ports are predictable" } }}
<code>products</code> answers on <code>:3001</code> because chapter 1 pinned it with
<code>--service-port</code>. The plugin APIs you installed without <code>--port</code> have no
<code>HostPort</code>, and the Fresh app pins nothing either, so Aspire allocates their host ports at
every start. Read every unpinned port from the dashboard's resource list.
{{ /comp }}

## Step 4 — Use the dashboard

Open `https://localhost:18888` and paste the login token `aspire start` printed:

{{ comp.apiTable({ caption: "Aspire dashboard surfaces", rows: [
  { name: "Resources", type: "tab", desc: "Every container and executable above with status, endpoints, and resolved environment. The authority for which port each resource bound." },
  { name: "Console logs", type: "tab", desc: "stdout/stderr per resource — a failing background processor is one click away, not buried in a terminal." },
  { name: "Structured logs + Traces", type: "tab", desc: "Spans and structured logs your handlers emit, correlated by traceparent across services. Collected via the OTLP endpoint at :4318." }
] }) }}

Aspire starts each resource with its `OTEL_SERVICE_NAME` and an OTLP endpoint, so framework spans
(job dispatch, job execution, saga steps) appear here with no extra wiring. A checkout (chapter 4)
and a shipping webhook call (chapter 5) both show up as correlated traces.

## Verify your progress

With the graph up, the dashboard resource list shows `postgres`, `redis`, `products` and the
`workers` / `sagas` / `triggers` APIs, all healthy. Spot-check a few endpoints:

```sh
# Catalog service — pinned in chapter 1, so the port is known
curl http://localhost:3001/health

# The plugin APIs take allocated ports. Copy each endpoint from the Aspire
# resource list, then:
curl <sagas-endpoint>/api/v1/sagas/sagas   # saga registry lists your checkout saga
curl <triggers-endpoint>/health            # triggers ingress is alive
```

- [ ] `ls aspire/apphost.mts aspire/aspire.config.json` shows both files.
- [ ] `aspire start` boots and prints a dashboard URL + login token.
- [ ] The dashboard at `https://localhost:18888` lists `postgres`, `redis`, `products`, and the
      `workers` / `sagas` / `triggers` plugin APIs, all healthy.
- [ ] `curl` against `:3001` and the sagas / triggers endpoints from the resource list all answer.
- [ ] A checkout and a webhook fire show up as correlated traces in the dashboard.

{{ comp callout { type: "tip", title: "If aspire start won't boot" } }}
<ul>
<li><strong>Docker isn't running.</strong> Aspire provisions Postgres and Redis through Docker.</li>
<li><strong>Wrong directory.</strong> <code>aspire restore</code> and <code>aspire start</code> run
from inside <code>aspire/</code>; <code>netscript db</code> commands run from the workspace root.</li>
<li><strong>A db command ran before <code>aspire start</code>.</strong> Every <code>netscript db</code>
command needs a live Postgres. Bring the graph up first.</li>
<li><strong>Ports in use.</strong> A stale earlier run holding <code>:18888</code>, <code>:3001</code>
or one of the allocated high-range ports blocks boot. Check the dashboard resource list (or your
process table) and free it.</li>
</ul>
{{ /comp }}

## What you built

The entire `my-shop/` storefront running as one resource graph under a single `aspire start`:
Postgres, Redis, the `products` service, the streams transport, and the workers, sagas and triggers
plugin APIs with their background processors. The dashboard at `https://localhost:18888` shows the
live port map, per-resource console logs and correlated traces. This is the local development
topology; for production, start from the Deploy guide below.

## Where to go next

- **Deploy remotely** → the [Deploy](/orchestration-runtime/how-to/deploy/) how-to (production
  targets) and [Deploy locally with Aspire](/orchestration-runtime/how-to/deploy-local-aspire/) (the
  full local recipe with every flag).
- **Add observability** → [Add OpenTelemetry](/observability/how-to/add-opentelemetry/) and the
  [Observability explanation](/explanation/observability/).
- **Go deeper on the ideas** → [Durability model](/explanation/durability-model/),
  [Contracts & type flow](/explanation/contracts/), and [The plugin system](/explanation/plugin-system/).
- **Solve a specific task** → the full [How-to guides](/how-to/).

{{ comp.nextPrev({ prev: { label: "6 · Storefront UI", href: "/tutorials/storefront/06-storefront-ui/" }, next: { label: "How-to guides", href: "/how-to/" } }) }}
