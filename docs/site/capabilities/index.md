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
webhook, authenticating a user, persisting state) that you add to a workspace
without rewiring the host. Each capability owns one mental model, one headline
authoring API, and — where it runs — one HTTP surface on a known port. You
compose them the way you compose small building blocks: add what the system
needs, leave out what it doesn't, and the contracts keep the seams type-safe.

This zone is the **hub of hubs**. Every page below is a capability hub built on
the same shape — a one-screen concept, the headline API lifted verbatim from a
scaffolded project, the real endpoints and ports, and a *Learn / Do / Reference*
triplet that points you at the tutorial that teaches it, the how-to that ships
it, and the generated [API reference](/reference/) for the full surface. The
hubs stay deliberately thin so they orient rather than duplicate the reference.

{{ comp callout { type: "note", title: "Five composable plugins + the platform underneath them" } }}
The capabilities you <em>add</em> are plugins — <code>netscript plugin add &lt;worker|saga|trigger|stream|auth&gt; --samples</code> lands each one under <code>plugins/&lt;name&gt;/</code>. The remaining five are <strong>platform capabilities</strong>: services, database, KV/queues/cron, telemetry, and the Fresh UI come from the scaffold itself. Plugins register their contributions through their manifest; the host application never changes.
{{ /comp }}

## The five composable plugins

These are the slices you bolt on with `netscript plugin add`. Each is an isolated
background processor or service that exposes its own HTTP API on a dedicated
port, wired into Aspire automatically. Bring Aspire up first — `cd aspire &&
aspire run` provisions Postgres and Garnet and starts the dashboard at
`http://localhost:18888` — **before** any `netscript db` command or plugin call,
so the plugin services and their dependencies exist when you reach for them.

{{ comp.featureGrid({ items: [
  { title: "Background jobs", icon: "⚙️", body: "Workers run thread-isolated jobs with defineJobHandler and createSuccessResult. Trigger one over HTTP on :8091. Job dispatch, execution, and scheduler spans are real OTel automatically.", href: "/capabilities/background-jobs/" },
  { title: "Durable sagas", icon: "🔁", body: "Message-driven state machines authored with the fluent defineSaga(...).build() builder, correlated and listed on :8092. Durable store is kv or prisma.", href: "/capabilities/durable-sagas/" },
  { title: "Triggers & ingress", icon: "🪝", body: "defineWebhook turns an inbound POST into an enqueued job (enqueueJob). Raw Hono routes (not oRPC) on :8093.", href: "/capabilities/triggers/" },
  { title: "Durable streams", icon: "🌊", body: "createDurableStream gives you a real producer runtime served on :4437 and wired into workers, auth, and sagas. The plugin-streams manifest helpers stay stubbed and fail loud.", href: "/capabilities/streams/" },
  { title: "Authentication", icon: "🔐", body: "auth-api oRPC service on :8094 with five endpoints. A pure-backend seam composing one active backend — kv-oauth (interactive), WorkOS, or better-auth.", href: "/capabilities/auth/" }
] }) }}

{{ comp callout { type: "important", title: "Alpha status" } }}
A few seams are intentionally not-yet-live and the hubs say so plainly. The streams <strong>producer runtime is real</strong> via <code>@netscript/plugin-streams-core</code> (<code>createDurableStream</code>) — only the <code>@netscript/plugin-streams</code> manifest helpers (<code>defineStreamProducer</code>/<code>defineStreamConsumer</code>) fail loud but differently: <code>defineStreamConsumer.subscribe()</code> synchronously <strong>throws</strong> <code>StreamUnsupportedOperationError</code>; <code>defineStreamProducer.publish()</code> returns a <strong>rejected</strong> <code>Promise</code> with <code>StreamUnsupportedOperationError</code>. Worker <strong>job</strong> tracing is real — only the scaffold <code>createJobTools(ctx)</code> handler helpers (<code>trace.addEvent</code>, <code>withChildSpan</code>, <code>progress</code>) remain no-op stubs (a tracked limitation with a fix planned). Trigger <code>enqueueJob</code> is live; <code>defer</code> is defined-but-unsupported (throws and routes to the DLQ). The auth packages are <code>0.0.1-alpha.0</code>; the scaffold's <code>jsr:...@^1.0.0</code> specifiers are forward-looking, not installable today.
{{ /comp }}

## The platform capabilities

These ship with the scaffold — no `plugin add` required. Services and contracts
are the backbone the five plugins lean on; the rest are the persistence,
primitives, observability, and UI the whole workspace shares.

{{ comp.featureGrid({ items: [
  { title: "Services & contracts", icon: "🔌", body: "defineService(router, {...}) for one-shot services, or the fluent createService(...).serve() builder. oRPC + zod contracts via implement(); RPC mounts at /api/rpc/*. Example users service on :3001.", href: "/capabilities/services/" },
  { title: "Database & Prisma", icon: "🗄️", body: "Prisma 7.8 with runtime=\"deno\" over Postgres. Per-plugin .prisma files aggregate under database/postgres/schema/plugins/<plugin>/. Requires Aspire up first.", href: "/capabilities/database/" },
  { title: "KV, queues & cron", icon: "⏱️", body: "Deno KV, queue, and cron primitives behind the workspace's unstable:[\"kv\"] flag. The queue has four backends including Postgres — the durable substrate jobs and sagas build on.", href: "/capabilities/kv-queues-cron/" },
  { title: "Telemetry & logging", icon: "🔭", body: "OpenTelemetry and structured logs are wired into handlers, RPC, job dispatch, and SSE from line one — observable by default, with traces visible in the Aspire dashboard.", href: "/capabilities/telemetry/" },
  { title: "Fresh UI & design", icon: "🎨", body: "apps/dashboard is a Fresh + Preact + Tailwind v4 + Vite frontend. Copy-source: the CLI copies components into your repo and the code is yours.", href: "/capabilities/fresh-ui/" }
] }) }}

## The capability matrix

At a glance: what each capability is for, how it runs, and where to read the full
generated API. Ports apply only to capabilities that expose an HTTP surface; the
primitive and UI capabilities run inside the workspace rather than on their own
port. Always read the generated [API reference](/reference/) for the exhaustive
surface — these hubs orient, the reference enumerates.

{{ comp.apiTable({
  caption: "All ten capabilities — kind, headline API, runtime surface, reference unit",
  rows: [
    { name: "Services & contracts", type: "platform · :3001", desc: "defineService / createService().serve() + oRPC contracts via implement(); RPC at /api/rpc/*. Full API at /reference/service/ and /reference/contracts/." },
    { name: "Background jobs", type: "plugin · :8091", desc: "defineJobHandler + createSuccessResult; trigger via POST /api/v1/workers/jobs/{id}/trigger. Job/scheduler OTel spans are real. Full API at /reference/workers/." },
    { name: "Durable sagas", type: "plugin · :8092", desc: "defineSaga(id).durability('t1')...build(); durable store kv | prisma; list at /api/v1/sagas/sagas. Full API at /reference/sagas/." },
    { name: "Triggers & ingress", type: "plugin · :8093 (Hono)", desc: "defineWebhook → enqueueJob; POST /api/v1/webhooks/inbound/generic. defer throws + DLQs. Full API at /reference/triggers/." },
    { name: "Durable streams", type: "plugin · :4437", desc: "createDurableStream producer runtime is real; plugin-streams manifest helpers throw StreamUnsupportedOperationError. Full API at /reference/streams/." },
    { name: "Authentication", type: "plugin · :8094", desc: "auth-api oRPC; /api/v1/auth/{signin,callback,signout,session,me}; one active backend (kv-oauth | workos | better-auth). Full API at /capabilities/auth/." },
    { name: "Database & Prisma", type: "platform · Postgres", desc: "Prisma runtime=\"deno\", per-plugin schema aggregation. Full API at /reference/database/." },
    { name: "KV, queues & cron", type: "platform · primitives", desc: "Deno KV / queue (four backends incl. postgres) / cron behind unstable:[\"kv\"]. Full API at /reference/kv/, /reference/queue/, /reference/cron/." },
    { name: "Telemetry & logging", type: "platform · OTel", desc: "@opentelemetry/api spans + structured logs in handlers, RPC, and job dispatch. Full API at /reference/telemetry/ and /reference/logger/." },
    { name: "Fresh UI & design", type: "platform · copy-source", desc: "Fresh + Preact + Tailwind v4 dashboard you own. Full API at /reference/fresh/ and /reference/fresh-ui/." }
  ]
}) }}

## How the seams fit together

The plugins are not islands — they compose through the same contracts and durable
substrate. A **service** defines an oRPC contract and serves it at `/api/rpc/*`.
A **trigger** turns an inbound webhook into a queued job via `enqueueJob`. A
**worker** picks that job off the queue and runs it thread-isolated, emitting
real OTel spans as it goes. A **saga** drives a message-correlated state machine,
persisting its durable state to `kv` or `prisma`. A **stream** producer mirrors
execution state out of workers, auth, and sagas over the durable-streams service
on `:4437`. And **authentication** sits in front as a pure-backend seam: the core
defines `AuthBackendPort`, the three backends are pure adapters, and the plugin
composes exactly one active backend at a time. Underneath them all, the platform
capabilities — services, database, KV/queues/cron, telemetry, and the Fresh UI —
supply the contracts, persistence, primitives, and observability the whole
workspace shares.

{{ comp callout { type: "note", title: "One active auth backend at a time" } }}
Authentication is a hard single-active-backend boundary in v1 — you select one of <code>kv-oauth</code>, <code>workos</code>, or <code>better-auth</code> via <code>NETSCRIPT_AUTH_BACKEND</code> (default <code>kv-oauth</code>). Only <strong>kv-oauth</strong> exposes the interactive sign-in flow; on WorkOS or better-auth the <code>signin</code>/<code>callback</code> endpoints return a typed <code>AUTH_PROVIDER_ERROR</code> by design. There is no multi-active routing, cross-backend linking, or global logout yet. See <a href="/capabilities/auth/"><strong>Authentication</strong></a> for the full backend capability matrix.
{{ /comp }}

## Where to go next

The hubs are concept-first; the rest of the site does the teaching and the
shipping. If you learn best by building, walk the [tutorials ladder](/tutorials/)
— it builds one continuous app where a service publishes a saga message, a saga
consumes it, and a webhook enqueues a job, exercising several of these
capabilities in sequence. If you have a task in hand, the
[how-to recipes](/how-to/) ship each capability directly — including
[adding authentication](/how-to/add-authentication/). For the *why* behind the
design, the [core concepts](/explanation/) zone explains the contract type flow,
the plugin system, the durability model, the [auth model](/explanation/auth-model/),
and the Aspire orchestration that ties it together.

{{ comp callout { type: "tip", title: "Start with services" } }}
Every other capability assumes you can define a contract and serve it. Begin at <a href="/capabilities/services/"><strong>Services &amp; contracts</strong></a> — the backbone the five plugins compose around — then follow the matrix above into whichever slice your system needs.
{{ /comp }}
