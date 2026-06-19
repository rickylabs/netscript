---
layout: layouts/base.vto
title: Capabilities
templateEngine: [vento, md]
prev: null
next: { label: "Services & contracts", href: "/capabilities/services/" }
---

# Capabilities

A **capability** is a composable slice of the NetScript framework — a single,
self-contained concern (defining a service, running background jobs, ingesting a
webhook, persisting state) that you add to a workspace without rewiring the host.
Each capability owns one mental model, one headline authoring API, and — where it
runs — one HTTP surface on a known port. You compose them the way you compose
functions: add what the system needs, leave out what it doesn't, and the
contracts keep the seams type-safe.

This zone is the **hub of hubs**. Every page below is a capability hub built on the
same shape — a one-screen concept, the headline API lifted verbatim from a
scaffolded project, the real endpoints and ports, and a *Learn / Do / Reference*
triplet that points you at the tutorial that teaches it, the how-to that ships it,
and the generated [API reference](/reference/) for the full surface. The hubs
stay deliberately thin so they orient rather than duplicate the reference.

{{ comp callout { type: "note", title: "Four composable plugins + the platform underneath them" } }}
The four capabilities you <em>add</em> are plugins — <code>netscript plugin add &lt;worker|saga|trigger|stream&gt; --samples</code> lands each one under <code>plugins/&lt;name&gt;/</code>. The remaining five are <strong>platform capabilities</strong>: services, database, KV/queues/cron, telemetry, and the Fresh UI come from the scaffold itself. Plugins register their contributions; the host application never changes.
{{ /comp }}

## The four composable plugins

These are the slices you bolt on with `netscript plugin add`. Each is an isolated
background processor that also exposes its own HTTP API on a dedicated port, wired
into Aspire automatically. Bring Aspire up first (`cd aspire && aspire run`,
dashboard at `http://localhost:18888`) so the plugin services and their Postgres /
Garnet dependencies are provisioned before you call them.

{{ comp.featureGrid({ items: [
  { title: "Background jobs", body: "Workers run thread-isolated jobs with defineJobHandler and createSuccessResult. Trigger one over HTTP on :8091.", href: "/capabilities/background-jobs/" },
  { title: "Durable sagas", body: "Message-driven state machines authored with the fluent defineSaga(...).build() builder, correlated and listed on :8092.", href: "/capabilities/durable-sagas/" },
  { title: "Triggers & ingress", body: "defineWebhook turns an inbound POST into enqueued jobs. Raw Hono routes (not oRPC) on :8093.", href: "/capabilities/triggers/" },
  { title: "Durable streams", body: "defineStreamTopic gives you typed topic schemas today; producer/consumer runtime is stubbed and deferred. Dev service on :4437.", href: "/capabilities/streams/" }
] }) }}

{{ comp callout { type: "important", title: "Honest about the alpha runtime" } }}
The streams <strong>producer and consumer are stubs</strong> in the current scaffold — <code>publish</code> and <code>subscribe</code> have no-op bodies and topic-centric APIs are deferred. Treat streams as a topic-schema authoring surface plus the durable-streams dev service, not a live pub/sub runtime yet. Likewise the worker <code>createJobTools</code> trace and progress helpers are no-op stubs in the scaffolded copy. The pages below say so plainly.
{{ /comp }}

## The platform capabilities

These ship with the scaffold — no `plugin add` required. Services and contracts
are the backbone the four plugins lean on; the rest are the persistence,
primitives, observability, and UI the whole workspace shares.

{{ comp.featureGrid({ items: [
  { title: "Services & contracts", body: "defineService(router, {...}) for one-shot services, or the fluent createService(...).serve() builder. oRPC + zod contracts via implement(). Example users service on :3001.", href: "/capabilities/services/" },
  { title: "Database & Prisma", body: "Prisma 7.8 with runtime=\"deno\" over Postgres. Per-plugin .prisma files aggregate under database/postgres/schema/plugins/<plugin>/. Requires Aspire up first.", href: "/capabilities/database/" },
  { title: "KV, queues & cron", body: "Deno KV, queue, and cron primitives behind the workspace's unstable:[\"kv\"] flag — the durable substrate jobs and sagas build on.", href: "/capabilities/kv-queues-cron/" },
  { title: "Telemetry & logging", body: "OpenTelemetry (@opentelemetry/api) and structured logs are wired into handlers, RPC, and SSE from line one — observable by default.", href: "/capabilities/telemetry/" },
  { title: "Fresh UI & design", body: "apps/dashboard is a Fresh + Preact + Tailwind v4 + Vite frontend. Copy-source: the CLI copies components into your repo and the code is yours.", href: "/capabilities/fresh-ui/" }
] }) }}

## The capability matrix

At a glance: what each capability is for, how it runs, and where to read the full
generated API. Ports apply only to capabilities that expose an HTTP surface; the
primitive and UI capabilities run inside the workspace rather than on their own port.

{{ comp.apiTable({
  caption: "All nine capabilities — kind, headline API, runtime surface, reference unit",
  rows: [
    { name: "Services & contracts", type: "platform · :3001", desc: "defineService / createService().serve() + oRPC contracts. Full API at /reference/service/ and /reference/contracts/." },
    { name: "Background jobs", type: "plugin · :8091", desc: "defineJobHandler + createSuccessResult; trigger via POST /api/v1/workers/jobs/{id}/trigger. Full API at /reference/workers/." },
    { name: "Durable sagas", type: "plugin · :8092", desc: "defineSaga(id).durability('t1')...build(); list at /api/v1/sagas/sagas. Full API at /reference/sagas/." },
    { name: "Triggers & ingress", type: "plugin · :8093 (Hono)", desc: "defineWebhook → enqueueJob; POST /api/v1/webhooks/inbound/generic. Full API at /reference/triggers/." },
    { name: "Durable streams", type: "plugin · :4437 (stubbed)", desc: "defineStreamTopic for typed schemas; producer/consumer deferred. Full API at /reference/streams/." },
    { name: "Database & Prisma", type: "platform · Postgres", desc: "Prisma runtime=\"deno\", per-plugin schema aggregation. Full API at /reference/database/." },
    { name: "KV, queues & cron", type: "platform · primitives", desc: "Deno KV / queue / cron behind unstable:[\"kv\"]. Full API at /reference/kv/, /reference/queue/, /reference/cron/." },
    { name: "Telemetry & logging", type: "platform · OTel", desc: "@opentelemetry/api spans + structured logs in handlers. Full API at /reference/telemetry/ and /reference/logger/." },
    { name: "Fresh UI & design", type: "platform · copy-source", desc: "Fresh + Preact + Tailwind v4 dashboard you own. Full API at /reference/fresh/ and /reference/fresh-ui/." }
  ]
}) }}

## Where to go next

The hubs are concept-first; the rest of the site does the teaching and the
shipping. If you learn best by building, walk the [tutorials ladder](/tutorials/) —
it builds one continuous app where a service publishes a saga message, a saga
consumes it, and a webhook enqueues a job, exercising four of these capabilities in
sequence. If you have a task in hand, the [how-to recipes](/how-to/) ship each
capability directly. For the *why* behind the design, the
[core concepts](/explanation/) zone explains the contract type flow, the plugin
model, durable workflows, and the Aspire orchestration that ties it together.

{{ comp callout { type: "tip", title: "Start with services" } }}
Every other capability assumes you can define a contract and serve it. Begin at <a href="/capabilities/services/"><strong>Services &amp; contracts</strong></a> — the backbone the four plugins compose around — then follow the matrix above into whichever slice your system needs.
{{ /comp }}
