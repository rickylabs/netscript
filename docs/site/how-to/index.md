---
layout: layouts/base.vto
title: All recipes
templateEngine: [vento, md]
prev: null
next: { label: "Add a plugin", href: "/orchestration-runtime/how-to/add-a-plugin/" }
nav_hide: true
---

# All recipes

Recipes live inside their pillar in the sidebar — each area's **Recipes** section
sits below the guides that teach the basics it assumes. This page is the
cross-area index: every recipe in the docs, grouped by pillar, so you can scan
the whole catalog in one place. Each one is goal-first — it starts from a
concrete intent and ends with a command that proves the change works.

{{ comp callout { tone: "info", title: "One prerequisite spans almost every recipe" } }}
Anything that touches Postgres, Redis/Garnet, or a plugin service expects Aspire
to be running first. From your workspace: <code>cd aspire &amp;&amp; aspire start</code>
brings up the dependencies and the dashboard on <a href="https://localhost:18888"><code>https://localhost:18888</code></a>
<strong>before</strong> any <code>netscript db</code> command or service call.
The recipes call this out where it matters, but it is the single most common
missing step.
{{ /comp }}

## Web Layer

- [Customize the Fresh UI]({{ "howto:customize-fresh-ui" |> xref |> url }}) —
  bring the dashboard components into your workspace with `ui:init` / `ui:add`
  and edit them directly.
- [Build a server-validated form]({{ "howto:build-a-server-validated-form" |> xref |> url }}) —
  route-bound form state, server validation, mutation, and success handling in
  one typed page definition with `definePage().withForm()`.
- [Build a desktop frontend]({{ "howto:build-a-desktop-frontend" |> xref |> url }}) —
  one Fresh frontend that runs as an ordinary browser app and gains native
  capabilities on the desktop.

## Services & SDK

- [Add a service]({{ "howto:add-a-service" |> xref |> url }}) — define a typed
  contract, implement the handlers, and confirm the service answers on
  `/api/rpc/*`.
- [Discover services]({{ "howto:discover-services" |> xref |> url }}) — call
  another plugin's or workspace member's typed service without hardcoding its
  address.
- [Expose OpenAPI & Scalar]({{ "howto:expose-openapi-scalar" |> xref |> url }}) —
  publish an OpenAPI document and browsable Scalar docs for a service.

## Background jobs

- [Run a polyglot task]({{ "howto:run-a-polyglot-task" |> xref |> url }}) —
  define a non-TypeScript script (Python, shell, .NET, any executable) as a
  task with a permission sandbox and run it through the executor.
- [Tune the worker runtime]({{ "howto:tune-worker-runtime" |> xref |> url }}) —
  trade throughput against isolation with concurrency, runner mode, per-task
  permissions, and timeouts/retries.
- [Restrict worker task permissions]({{ "howto:restrict-worker-task-permissions" |> xref |> url }}) —
  give every Deno task explicit permissions; an omitted permission object
  compiles to `--allow-all`.
- [Add a task runtime adapter]({{ "howto:add-a-task-runtime-adapter" |> xref |> url }}) —
  advanced: add a custom runtime adapter to the built-in task executor.

## Durable workflows

- [Build a validated ingestion queue]({{ "howto:build-a-validated-ingestion-queue" |> xref |> url }}) —
  a typed queue whose messages are schema-checked before they enter the queue
  and again before a consumer handles them.
- [Publish a durable stream]({{ "howto:publish-a-durable-stream" |> xref |> url }}) —
  let server-side state be subscribed to by browsers and other consumers
  through a durable stream service.

## AI & Agents

- [Build a durable chat]({{ "howto:build-a-durable-chat" |> xref |> url }}) —
  an AI chat on a Fresh route whose transcript survives reload and reconnect,
  with one server-side tool.

## Data & Persistence

- [Database & migration]({{ "howto:database-migration" |> xref |> url }}) —
  initialize, generate, seed, and inspect the Postgres schema with the
  `netscript db` commands.
- [Queue / KV / cron]({{ "howto:queue-kv-cron" |> xref |> url }}) — the reactive
  KV store, the durable queue, and cron schedules, including `--unstable-kv`.
- [Choose a queue provider]({{ "howto:choose-a-queue-provider" |> xref |> url }}) —
  pick the right queue backend, and either let auto-discovery select one or pin
  one explicitly.
- [Use a second database]({{ "howto:use-a-second-database" |> xref |> url }}) —
  add a second Postgres, or a MySQL/SQL Server instance, alongside the default
  database.

## Identity & Access

- [Add authentication]({{ "howto:add-authentication" |> xref |> url }}) — install
  the official auth plugin, pick one active backend via
  `NETSCRIPT_AUTH_BACKEND`, migrate, and sign in.

## Orchestration & Runtime

- [Add a plugin]({{ "howto:add-a-plugin" |> xref |> url }}) — install a
  first-party plugin, regenerate the registry, and verify the service answers.
- [Deploy locally with Aspire]({{ "howto:deploy-local-aspire" |> xref |> url }}) —
  run the full local resource graph from the generated Aspire AppHost.
- [Deploy]({{ "howto:deploy" |> xref |> url }}) — the portability story: raw
  `deno task` entry points and the `--no-aspire` escape hatch when you provision
  dependencies yourself.
- [Deploy to Deno Deploy]({{ "howto:deploy-deno-deploy" |> xref |> url }}) —
  push a preview, promote to prod, and read status and logs with the
  first-class deploy command.
- [Graceful shutdown]({{ "howto:graceful-shutdown" |> xref |> url }}) — drain
  in-flight requests and jobs, run teardown hooks, and close connections on
  `SIGINT`/`SIGTERM`.
- [Roll out runtime overrides]({{ "howto:roll-out-runtime-overrides" |> xref |> url }}) —
  change a deployed behavior without rebuilding the workspace.
- [Author a plugin]({{ "howto:author-a-plugin" |> xref |> url }}) — advanced:
  build a custom plugin with the same manifest and `mod.ts` contract the
  first-party plugins use.
- [Deno LSP code intelligence]({{ "howto:deno-lsp-code-intelligence" |> xref |> url }}) —
  keep go-to-definition, hover, and diagnostics aligned across CLI and editors.

## Observability

- [Add OpenTelemetry]({{ "howto:add-opentelemetry" |> xref |> url }}) — emit
  custom spans and structured logs, propagate `traceparent`, and read the
  traces in the Aspire dashboard.

---

Not sure which recipe you want? Name the outcome first. *"Users must sign in"* →
[Add authentication]({{ "howto:add-authentication" |> xref |> url }}).
*"This event should fan out to a background job"* →
[Add a plugin]({{ "howto:add-a-plugin" |> xref |> url }}).
*"It has to run where there is no Aspire"* →
[Deploy]({{ "howto:deploy" |> xref |> url }}). The recipes are deliberately
small and composable; most real features chain two or three of them.
