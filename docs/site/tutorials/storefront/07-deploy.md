---
layout: layouts/base.vto
title: Run the storefront under Aspire
templateEngine: [vento, md]
prev: { label: "6 · Storefront UI", href: "/tutorials/storefront/06-storefront-ui/" }
next: { label: "Build", href: "/how-to/" }
---

# Run the storefront under Aspire

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

After [chapter 6](/tutorials/storefront/06-storefront-ui/), `my-shop/` has:

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
# Still inside aspire/. Boots the whole graph; prints the dashboard URL.
aspire start
```

When boot finishes, `aspire start` prints the allocated dashboard address. The graph
it brings up for the storefront:

{{ comp.apiTable({ caption: "What `aspire start` brings up for my-shop/", rows: [
  { name: "aspire (dashboard)", type: "the URL Aspire prints", desc: "Live resource list, console logs, structured logs and traces. The generated local profile allows anonymous dashboard access." },
  { name: "OTLP collector", type: "the OTLP URL Aspire prints", desc: "OpenTelemetry endpoint the dashboard runs; framework spans and structured logs land here automatically." },
  { name: "postgres", type: "Container", desc: "Provisioned via Docker. The database your products handlers and saga store target — reachable only while Aspire is up." },
  { name: "redis", type: "Container (cache)", desc: "Redis cache — the default `--cache-backend`; Redis-compatible. Backs KV/queue workloads for the runtime plugins." },
  { name: "products (service)", type: "allocated endpoint", desc: "Your catalog service. OpenAPI at /api/products/* and RPC at /api/rpc/*." },
  { name: "sagas API", type: "allocated port", desc: "Lists sagas and instances — where you watched CheckoutSaga in chapter 4." },
  { name: "triggers API", type: "allocated port", desc: "The Hono webhook ingress from chapter 5 — /api/v1/webhooks/shipping/status." },
  { name: "workers API", type: "allocated port", desc: "Lists job executions — where the enqueued shipping and payment jobs run." },
  { name: "streams", type: "allocated port", desc: "The durable streams transport that carries cross-plugin messages between the saga and the workers." },
  { name: "background processors", type: "executables (no port)", desc: "Each plugin's isolated runners (workers, sagas, triggers) — separate processes, not threads inside the API." }
] }) }}

{{ comp callout { type: "note", title: "Read allocated endpoints" } }}
Read the service, plugin and app endpoints from the Aspire resource list or
<code>aspire describe</code>. The CLI commands in this track do not pin host ports.
{{ /comp }}

## Step 4 — Use the dashboard

Open the URL Aspire prints (the generated local profile allows anonymous access):

{{ comp.apiTable({ caption: "Aspire dashboard surfaces", rows: [
  { name: "Resources", type: "tab", desc: "Every container and executable above with status, endpoints, and resolved environment. The authority for which port each resource bound." },
  { name: "Console logs", type: "tab", desc: "stdout/stderr per resource — a failing background processor is one click away, not buried in a terminal." },
  { name: "Structured logs + Traces", type: "tab", desc: "Spans and structured logs your handlers emit, correlated by traceparent across services. Collected via the OTLP endpoint at the OTLP URL Aspire prints." }
] }) }}

Aspire starts each resource with its `OTEL_SERVICE_NAME` and an OTLP endpoint, so framework spans
(job dispatch, job execution, saga steps) appear here with no extra wiring. A checkout (chapter 4)
and a shipping webhook call (chapter 5) both show up as correlated traces.

## Verify your progress

With the graph up, the dashboard resource list shows `postgres`, `redis`, `products` and the
`workers` / `sagas` / `triggers` APIs, all healthy. Spot-check a few endpoints:

```sh
# Set SERVICE_URL to the product service URL Aspire prints.
curl "$SERVICE_URL/health"

# The plugin APIs take allocated ports. Copy each endpoint from the Aspire
# resource list, then:
deno x -A jsr:@netscript/plugin-sagas{{ releaseSpecifier }}/cli list --registered --json
curl <triggers-endpoint>/health            # triggers ingress is alive
```

- [ ] `ls aspire/apphost.mts aspire/aspire.config.json` shows both files.
- [ ] `aspire start` boots and prints a dashboard URL.
- [ ] The dashboard at the URL Aspire prints lists `postgres`, `redis`, `products`, and the
      `workers` / `sagas` / `triggers` plugin APIs, all healthy.
- [ ] The health probes and plugin CLI inspection use endpoints from the Aspire resource list.
- [ ] A checkout and a webhook fire show up as correlated traces in the dashboard.

{{ comp callout { type: "tip", title: "If aspire start won't boot" } }}
<ul>
<li><strong>Docker isn't running.</strong> Aspire provisions Postgres and Redis through Docker.</li>
<li><strong>Wrong directory.</strong> <code>aspire restore</code> and <code>aspire start</code> run
from inside <code>aspire/</code>; <code>netscript db</code> commands run from the workspace root.</li>
<li><strong>A db command ran before <code>aspire start</code>.</strong> Every <code>netscript db</code>
command needs a live Postgres. Bring the graph up first.</li>
<li><strong>Ports in use.</strong> Stop an earlier run only when you know it owns the conflicting
resource. Read the current run's allocated endpoints from Aspire, then retry.</li>
</ul>
{{ /comp }}

## What you built

The entire `my-shop/` storefront running as one resource graph under a single `aspire start`:
Postgres, Redis, the `products` service, the streams transport, and the workers, sagas and triggers
plugin APIs with their background processors. The dashboard at the URL Aspire prints shows the
live port map, per-resource console logs and correlated traces. This is the local development
topology; for production, start from the Deploy guide below.

## Next steps

- **Deploy remotely** → the [Deploy](/orchestration-runtime/how-to/deploy/) how-to (production
  targets) and [Deploy locally with Aspire](/orchestration-runtime/how-to/deploy-local-aspire/) (the
  full local recipe with every flag).
- **Add observability** → [Add OpenTelemetry](/observability/how-to/add-opentelemetry/) and the
  [Observability explanation](/explanation/observability/).
- **Go deeper on the ideas** → [Durability model](/explanation/durability-model/),
  [Contracts & type flow](/explanation/contracts/), and [the plugin system](/explanation/plugin-system/).
- **Solve a specific task** → the recipes in [Build](/how-to/).
