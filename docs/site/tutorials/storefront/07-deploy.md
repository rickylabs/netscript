---
layout: layouts/base.vto
title: Run the whole storefront
templateEngine: [vento, md]
prev: { label: "6 · Storefront UI", href: "/tutorials/storefront/06-storefront-ui/" }
next: { label: "How-to guides", href: "/how-to/" }
---

# Run the whole storefront

Across the previous six chapters you built the storefront one piece at a time, usually starting a
single service in its own terminal. This final chapter zooms out: you run the **entire** `my-shop/` —
the products service, the cart contract's consumers, the storefront page, the checkout saga, the
shipping webhook, Postgres, and the cache — as one coherent system under a single `aspire start`, and
watch all of it from one dashboard.

This is the payoff of the whole track, and it is one command. Everything you added chapter by chapter
— a service, three runtime plugins, a webhook, a Fresh page — the scaffold has been wiring into a
single resource graph the entire time. You never edited an orchestrator by hand. `aspire start` reads
that graph and boots all of it at once: **`netscript init` scaffolded it, `aspire start` runs it —
from an empty folder to a complete, observable stack in two commands, no deploy YAML in between.**
That one-command-from-scaffold story *is* NetScript's local topology.

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

You will bring the complete storefront up under one orchestrator: `aspire start` translates your
`appsettings.json` plus the installed plugins into a single resource graph and boots all of it —
infrastructure, services, plugin APIs, and background processors — then gives you a dashboard over the
whole thing. You will read the live port map from the dashboard and confirm every resource is healthy.

{{ comp callout { type: "warning", title: "This is the LOCAL story — not a production deployer" } }}
<code>aspire start</code> exists to make one command produce a complete, correctly-wired stack on <strong>one machine</strong>. The Postgres and Redis it starts are throwaway Docker containers for dev convenience — <strong>not</strong> your production database or cache. NetScript does not ship a cloud deployer for your app; for a remote target you point processes at managed infrastructure yourself. This chapter teaches the local topology. See the <a href="/how-to/deploy/">Deploy</a> and <a href="/how-to/deploy-local-aspire/">Deploy locally with Aspire</a> how-to guides for the production-vs-local split.
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

You should see `workers`, `sagas`, `streams`, and `triggers`. If `aspire start` from earlier
chapters is still up, you can stop it now — this chapter starts the whole graph fresh.

## Step 1 — Confirm the AppHost was scaffolded

The orchestrator's entry point is a small **TypeScript/Node** program (not C#) at
`aspire/apphost.mts`, configured by `aspire/aspire.config.json`. `netscript init` generated it back in
chapter 1; you never hand-write it. Verify it is on disk:

```sh
# From the workspace root — these two files are the orchestration entry point.
ls aspire/apphost.mts aspire/aspire.config.json
```

The graph inside the AppHost is **derived from your installed plugins** at boot — adding the `sagas`
and `triggers` plugins in chapters 4 and 5 is exactly why their APIs and background processors now
appear in the graph, with no edit to `apphost.mts` required.

{{ comp callout { type: "note", title: "There is no `netscript generate aspire`" } }}
The AppHost is produced by <code>netscript init</code> only. <code>netscript generate</code> covers <code>runtime-schemas</code> and <code>plugins</code>, not the AppHost. To change the graph, add or remove a plugin (or edit <code>appsettings.json</code>) and let the contributions re-derive it.
{{ /comp }}

## Step 2 — Restore the AppHost SDK (once)

The AppHost runs on its own isolated Node runtime inside `aspire/` so its dependency graph never leaks
into your Deno workspace. Restore that runtime once per machine (you did this in chapter 1; it is
idempotent):

```sh
cd aspire
aspire restore
```

## Step 3 — Start the whole resource graph

A single `aspire start` translates `appsettings.json` plus the plugin contributions into a coherent
resource graph and boots all of it — infrastructure first, then services, plugin APIs, and background
processors, with cross-references resolved into injected environment variables:

```sh
# Still inside aspire/. Boots the whole graph; prints the dashboard URL + a login token.
aspire start
```

When boot finishes, `aspire start` prints the dashboard address and a one-time login token. Here is the
graph a single run stands up for the storefront:

{{ comp.apiTable({ caption: "What `aspire start` brings up for my-shop/", rows: [
  { name: "aspire (dashboard)", type: "https://localhost:18888 / http://localhost:18889", desc: "Live resource list, console logs, structured logs and traces. A login token is printed on start." },
  { name: "OTLP collector", type: "http://localhost:4318", desc: "OpenTelemetry endpoint the dashboard runs; framework spans and structured logs land here automatically." },
  { name: "postgres", type: "Container", desc: "Provisioned via Docker. The database your products handlers and saga store target — reachable only while Aspire is up." },
  { name: "redis", type: "Container (cache)", desc: "Redis cache — the default `--cache-backend`; Redis-compatible. Backs KV/queue workloads for the runtime plugins." },
  { name: "products (service)", type: ":3001 (SERVICE range, from :3000)", desc: "Your catalog service. OpenAPI at /api/products/* and RPC at /api/rpc/*." },
  { name: "sagas API", type: ":8092 (PLUGIN_API range)", desc: "Lists sagas and instances — where you watched CheckoutSaga in chapter 4." },
  { name: "triggers API", type: ":8093 (PLUGIN_API range)", desc: "The Hono webhook ingress from chapter 5 — /api/v1/webhooks/shipping/status." },
  { name: "workers API", type: ":8091 (PLUGIN_API range)", desc: "Lists job executions — where the enqueued shipping and payment jobs run." },
  { name: "streams", type: ":4437", desc: "The durable streams transport that carries cross-plugin messages between the saga and the workers." },
  { name: "background processors", type: "executables (no port)", desc: "Each plugin's isolated runners (workers, sagas, triggers) — separate processes, not threads inside the API." }
] }) }}

{{ comp callout { type: "note", title: "Plugin API ports are range-allocated, not fixed" } }}
The runtime plugins publish their APIs from the <code>:8091–8099</code> <strong>PLUGIN_API</strong> range, and services from the <code>:3000–3099</code> <strong>SERVICE</strong> range. The conventional assignments (products <code>:3001</code>, workers <code>:8091</code>, sagas <code>:8092</code>, triggers <code>:8093</code>) are what this workspace lands on — but the dashboard's resource list is the authority for the exact port each resource bound, not a memorized number. Read it from there.
{{ /comp }}

## Step 4 — Use the dashboard

Open `https://localhost:18888`, paste the login token `aspire start` printed, and you have a single pane
over the running storefront:

{{ comp.apiTable({ caption: "Aspire dashboard surfaces", rows: [
  { name: "Resources", type: "tab", desc: "Every container and executable above with status, endpoints, and resolved environment. The authority for which port each resource bound." },
  { name: "Console logs", type: "tab", desc: "stdout/stderr per resource — a failing background processor is one click away, not buried in a terminal." },
  { name: "Structured logs + Traces", type: "tab", desc: "Spans and structured logs your handlers emit, correlated by traceparent across services. Collected via the OTLP endpoint at :4318." }
] }) }}

Because Aspire starts each resource with its `OTEL_SERVICE_NAME` and an OTLP endpoint, framework-level
spans — job dispatch, job execution, saga steps — surface here with no extra wiring. Driving a
checkout end to end (chapter 4) and firing the shipping webhook (chapter 5) now both show up as
correlated traces in one place.

## Verify your progress

With the graph up, confirm the whole storefront is live from one terminal. The dashboard resource list
should show `postgres`, `redis`, `products`, and the `workers` / `sagas` / `triggers` APIs all
healthy. Spot-check a few endpoints:

```sh
# Catalog service
curl http://localhost:3001/health

# Saga registry lists your checkout saga
curl http://localhost:8092/api/v1/sagas/sagas

# Triggers ingress is alive
curl http://localhost:8093/health
```

- [ ] `ls aspire/apphost.mts aspire/aspire.config.json` shows both files.
- [ ] `aspire start` boots and prints a dashboard URL + login token.
- [ ] The dashboard at `https://localhost:18888` lists `postgres`, `redis`, `products`, and the
      `workers` / `sagas` / `triggers` plugin APIs, all healthy.
- [ ] `curl` against `:3001`, `:8092`, and `:8093` all answer.
- [ ] A checkout and a webhook fire show up as correlated traces in the dashboard.

{{ comp callout { type: "warning", title: "Footguns when `aspire start` will not boot" } }}
<ul>
<li><strong>Docker not running.</strong> Aspire provisions Postgres + Redis through Docker; no daemon means the happy path does not start.</li>
<li><strong>Wrong directory.</strong> <code>aspire restore</code> and <code>aspire start</code> run from inside <code>aspire/</code>; <code>netscript db</code> commands run from the workspace root. Mixing them up is the most common first-run error.</li>
<li><strong>db command before <code>aspire start</code>.</strong> Every <code>netscript db</code> command needs a live Postgres. Bring the graph up first.</li>
<li><strong>Ports in use.</strong> A stale prior run holding <code>:18888</code>, <code>:3001</code>, or an <code>:8091–8099</code> port blocks boot — check the dashboard resource list (or your process table) and free it.</li>
</ul>
{{ /comp }}

## What you built

- The entire `my-shop/` storefront running as one orchestrated resource graph under a single
  `aspire start` — Postgres, Redis, the `products` service, the streams transport, and the workers,
  sagas, and triggers plugin APIs plus their background processors.
- A dashboard at `https://localhost:18888` giving you the live port map, per-resource console logs,
  and correlated traces across the whole app.
- A precise mental model: this is the **local** topology Aspire stands up for development, not a
  production deployer for your app.

You have built and run a complete NetScript storefront backend — contract-first throughout, durable
where it counts, and verified at its edges.

## Where to go next

- **Ship it somewhere real** → the [Deploy](/how-to/deploy/) how-to (production targets) and
  [Deploy locally with Aspire](/how-to/deploy-local-aspire/) (the full local recipe with every flag).
- **Add observability** → [Add OpenTelemetry](/how-to/add-opentelemetry/) and the
  [Observability explanation](/explanation/observability/).
- **Go deeper on the ideas** → [Durability model](/explanation/durability-model/),
  [Contracts & type flow](/explanation/contracts/), and [The plugin system](/explanation/plugin-system/).
- **Solve a specific task** → the full [How-to guides](/how-to/).

{{ comp.nextPrev({ prev: { label: "6 · Storefront UI", href: "/tutorials/storefront/06-storefront-ui/" }, next: { label: "How-to guides", href: "/how-to/" } }) }}
