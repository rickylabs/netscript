---
layout: layouts/base.vto
title: How-to guides
templateEngine: [vento, md]
prev: null
next: { label: "Add a plugin", href: "/how-to/add-a-plugin/" }
---

How-to guides are **goal-first recipes**: each one starts from a concrete
intent — *"I need to add a service,"* *"I need auth,"* *"I need this to deploy
without Aspire"* — and gives you the shortest reliable path from that intent to a
working, verified change. They assume you already have a NetScript workspace and
know the basics; they do **not** re-teach the framework.

If NetScript is new to you, start with the [tutorials](/tutorials/) — they build
one continuous application from zero. For exact API signatures, use the
[reference](/reference/). For the concepts *behind* a task — why services are
contracts-first, what "durable" means, how Aspire wires dependencies — read the
[explanation](/explanation/) pages. Each recipe links back to the capability hub
and reference that go deeper.

{{ comp callout { tone: "info", title: "One prerequisite spans almost every recipe" } }}
Anything that touches Postgres, Redis/Garnet, or a plugin service expects Aspire
to be running first. From your workspace: <code>cd aspire &amp;&amp; aspire start</code>
brings up the dependencies and the dashboard on <a href="http://localhost:18888"><code>http://localhost:18888</code></a>
<strong>before</strong> any <code>netscript db</code> command or service call. The
recipes call this out where it matters, but it is the single most common missing
step.
{{ /comp }}

## Build & extend a workspace

These recipes add capabilities to an existing workspace and verify the wiring.
Each lands real files under `plugins/` or your service tree and ends with a
command you can run to confirm it works.

{{ comp.featureGrid({ items: [
  { title: "Add a plugin", body: "Install a first-party plugin through public package dispatch, or use the local netscript-dev scaffolding path for sample modules. Lands under plugins/<name>/, regenerates the registry, and verifies the service answers on its port.", href: "/how-to/add-a-plugin/" },
  { title: "Add a service", body: "Stand up a new typed oRPC service: define an @orpc/contract + zod contract, implement() the handlers, serve it with defineService(...) one-shot or createService(...).serve() fluent, and confirm it answers on /api/rpc/*.", href: "/how-to/add-a-service/" },
  { title: "Add authentication", body: "Add the official auth plugin (auth-api on :8094, five endpoints under /api/v1/auth/*). Pick one active backend via NETSCRIPT_AUTH_BACKEND — kv-oauth (interactive, default), WorkOS, or better-auth — run the auth.prisma migration, and sign in.", href: "/how-to/add-authentication/" },
  { title: "Database & migration", body: "Initialize, generate, seed, and inspect the Postgres schema: netscript db init --name init → db generate → db seed → db status. Requires aspire start first so Postgres is provisioned.", href: "/how-to/database-migration/" }
] }) }}

## Wire primitives & observability

Recipes for the shared building blocks every plugin leans on — queues, KV, cron,
and the OpenTelemetry traces that make them visible in the Aspire dashboard.

{{ comp.featureGrid({ items: [
  { title: "Queue / KV / cron", body: "Use the reactive KV store, the durable queue (four backends — RabbitMQ, Redis, Deno KV, and explicit-provider PostgreSQL), and cron schedules. Covers --unstable-kv and the auto-discovery order vs. an explicit provider:'postgres'.", href: "/how-to/queue-kv-cron/" },
  { title: "Add OpenTelemetry", body: "Emit custom spans and structured logs with @netscript/telemetry helpers, propagate traceparent across services, and read the traces that land in the Aspire dashboard. Worker job dispatch/execution traces are already real and automatic.", href: "/how-to/add-opentelemetry/" }
] }) }}

## Ship the UI & deploy

Recipes for the front end and for taking a workspace to production — including
the Aspire-free portability path.

{{ comp.featureGrid({ items: [
  { title: "Customize the Fresh UI", body: "Bring in and own the dashboard UI with the ui:init / ui:add tasks. The scaffold uses copy-source ownership — the components land in your workspace, so you edit them directly rather than depending on a hidden package.", href: "/how-to/customize-fresh-ui/" },
  { title: "Deploy", body: "Take a workspace to production: Docker and bare-metal targets, the raw deno task entry points behind each service, and the --no-aspire portability escape hatch when you provision Postgres and Redis (or Garnet) yourself.", href: "/how-to/deploy/" },
  { title: "Author a plugin", body: "Advanced: build a custom plugin from scratch. Defines the scaffold.plugin.json provider kind, the manifest exports, and the mod.ts contract the host discovers — the same shape the first-party plugins use.", href: "/how-to/author-a-plugin/" }
] }) }}

## How a recipe is shaped

Every how-to page follows the same contract so you always know where to look:

- **Goal** — one sentence stating exactly what you will have when you finish.
- **Prerequisites** — the workspace state and running dependencies the recipe
  assumes (almost always including a live `aspire start`).
- **Steps** — added-lines code blocks, annotated with the file path they belong
  in, using the public `netscript <cmd>` command form throughout.
- **Production pitfalls** — the caveats that bite in real deployments, stated
  plainly rather than glossed over.
- **See also** — the capability hub, reference page, and related recipes that
  take the topic further.

{{ comp callout { tone: "note", title: "Pick by intent, not by feature name" } }}
If you are not sure which recipe you want, name the outcome first. <em>"Users
must sign in"</em> → <a href="/how-to/add-authentication/">Add authentication</a>.
<em>"This event should fan out to a background job"</em> →
<a href="/how-to/add-a-plugin/">Add a plugin</a> (triggers + workers).
<em>"It has to run where there is no Aspire"</em> →
<a href="/how-to/deploy/">Deploy</a>. The recipes are deliberately small and
composable; most real features chain two or three of them.
{{ /comp }}
