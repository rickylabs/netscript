---
layout: layouts/base.vto
title: Glossary
templateEngine: [vento, md]
prev: null
next: { label: "CLI reference", href: "/cli-reference/" }
---

{{ comp.breadcrumb() }}

# Glossary

NetScript is a small framework with a handful of load-bearing words. Most of the
friction in learning it is vocabulary, not syntax — once you can map a term to the
file it lives in and the API that produces it, the rest of the docs read quickly.

This page is the dictionary. Every entry is one to three sentences, grounded in the
real scaffold, and links to the canonical page where the term is *taught* (the
Explanation that gives you the mental model, the Capability hub that shows the
headline API, or the generated [Reference](/reference/) that lists every export).
Use it as a lookup, not a tutorial: when a page drops a word like
**contribution** or **durability tier** and you want the precise meaning, come here,
then follow the link back into the learning thread.

{{ comp callout { type: "note", title: "How to read an entry" } }}
The middle column is the <strong>headline API or file</strong> a term maps to — the
concrete thing you type or open. The description links to where it is taught. Terms
are alphabetized; related terms cross-reference each other so you can chase a concept
across the <a href="/explanation/">Explanation</a>, <a href="/capabilities/">Capabilities</a>,
and <a href="/reference/">Reference</a> zones without a dead end.
{{ /comp }}

## Core vocabulary

These are the words you will meet first — in the [Quickstart](/quickstart/), the
[tutorials ladder](/tutorials/), and the [architecture overview](/explanation/architecture/).

{{ comp.apiTable({ caption: "A–D", rows: [
  { name: "AppHost", type: "aspire/apphost.mts", desc: "The Aspire orchestration entry point that boots your whole workspace — Postgres, Garnet, services, and plugin processors — as one resource graph with a dashboard at http://localhost:18888. In NetScript the AppHost is a <strong>generated Node/TypeScript</strong> file (<code>aspire/apphost.mts</code>) driven by <code>aspire.config.json</code> and <code>appsettings.json</code>, not a dotnet project. You start it with <code>cd aspire &amp;&amp; aspire run</code>, and it must be up before any <code>netscript db</code> command. See <a href=\"/explanation/aspire/\">Explanation → Aspire</a> and <a href=\"/reference/aspire/\">reference/aspire/</a>." },
  { name: "archetype", type: "doctrine classification", desc: "The architectural category a package or plugin belongs to (for example a contract unit, an adapter, a runtime, or a plugin), which determines its public surface, quality gates, and allowed dependencies. Archetype is a <em>framework-internal</em> doctrine term; as an app author you mostly meet it indirectly through the shape of a scaffolded plugin. See <a href=\"/explanation/plugin-model/\">Explanation → Plugin model</a>." },
  { name: "Aspire", type: "aspire run", desc: "The .NET Aspire orchestration layer NetScript uses for local development. It provisions Postgres and Garnet as Docker containers and wires every service and plugin processor together with health, logs, and OTLP traces — no manual <code>docker compose</code>. The escape hatch is <code>netscript init --no-aspire</code> for a leaner single-process loop. See <a href=\"/explanation/aspire/\">Explanation → Aspire</a> and <a href=\"/how-to/deploy/\">How-to → Deploy</a>." },
  { name: "capability", type: "/capabilities/<cap>/", desc: "A first-class thing NetScript does — services, background jobs, durable sagas, triggers, streams, database, KV/queues/cron, telemetry, and the Fresh UI. Each capability has a hub page pairing a one-screen concept with its headline API and a Learn / Do / Reference triplet. See the <a href=\"/capabilities/\">Capabilities</a> index." },
  { name: "composition root", type: "netscript.config.ts", desc: "The single place where a NetScript app is assembled — <code>defineConfig({...})</code> declares the project name, path layout, logging, databases, and the list of plugins (<code>./plugins/<name>/mod.ts</code>). It is the wiring manifest the runtime reads to know what your app is made of. See <a href=\"/explanation/architecture/\">Explanation → Architecture</a> and <a href=\"/reference/config/\">reference/config/</a>." },
  { name: "contract", type: "oc.route().input().output()", desc: "The versioned, schema-first definition of an API — built with <a href=\"https://orpc.unnoq.com\">@orpc/contract</a> plus <a href=\"https://zod.dev\">zod</a> in <code>contracts/versions/v1/</code> — that locks the request and response shape <em>before</em> any handler exists. Passing a contract to <code>implement(Contract)</code> produces the object whose <code>.handler(...)</code> methods the service router binds, so the client and server share one source of truth. This is the heart of NetScript's contracts-first model. See <a href=\"/explanation/contracts/\">Explanation → Contracts</a> and <a href=\"/reference/contracts/\">reference/contracts/</a>." },
  { name: "contribution", type: "plugin manifest export", desc: "A typed unit of functionality a plugin contributes to the host — a job, a saga, a webhook trigger, a route, an Aspire resource, or a database schema — surfaced through the plugin's <code>mod.ts</code> manifest so the runtime can discover and wire it. Streams' <code>mod.ts</code>, for instance, re-exports its topic API alongside many contribution types. See <a href=\"/explanation/plugin-model/\">Explanation → Plugin model</a>." }
] }) }}

{{ comp.apiTable({ caption: "D–O", rows: [
  { name: "durability tier", type: ".durability('t1')", desc: "The persistence guarantee a saga declares in its builder chain — for example <code>'t1'</code> in <code>defineSaga(id).durability('t1')</code> — telling the runtime how durably to checkpoint the saga's state across messages. Higher tiers trade throughput for stronger crash recovery. See <a href=\"/explanation/durable-workflows/\">Explanation → Durable workflows</a> and <a href=\"/capabilities/durable-sagas/\">Capabilities → Durable sagas</a>." },
  { name: "durable", type: "saga state checkpointing", desc: "Describes work that survives process restarts because its progress is persisted, not held only in memory. NetScript's sagas are durable: their state is checkpointed per the chosen durability tier so a long-running, message-driven workflow can resume after a crash. See <a href=\"/explanation/durable-workflows/\">Explanation → Durable workflows</a>." },
  { name: "compensation-as-effect", type: "handler return value", desc: "How the scaffolded saga sample models rollback: instead of an explicit <code>.step()</code> / <code>.compensate()</code> chain, a message handler <em>returns an array of effects</em> (such as <code>sagaComplete({...})</code>) that the runtime applies. Compensation is just another effect a handler can emit. See <a href=\"/explanation/durable-workflows/\">Explanation → Durable workflows</a>." },
  { name: "job", type: "defineJobHandler(async (ctx) => …)", desc: "A unit of background work authored with <code>@netscript/plugin-workers-core</code>, returning <code>createSuccessResult({...})</code> or <code>createFailureResult(...)</code> and tagged with an id via <code>Object.assign(handler, { id })</code>. Jobs run on the workers processor and are triggered over HTTP at <code>POST /api/v1/workers/jobs/{id}/trigger</code> on port 8091. See <a href=\"/tutorials/background-jobs/\">Tutorial → Background jobs</a> and <a href=\"/capabilities/background-jobs/\">Capabilities → Background jobs</a>." },
  { name: "manifest", type: "plugins/<name>/mod.ts", desc: "A plugin's public face — its <code>mod.ts</code> — which exports the plugin object (for example <code>workersPlugin</code>), an inspector (<code>inspectWorkers</code>), and the contribution types the host discovers. The composition root references each plugin by its manifest path, and a generated <strong>registry</strong> aggregates them. See <a href=\"/explanation/plugin-model/\">Explanation → Plugin model</a>." },
  { name: "oRPC", type: "@orpc/contract · @orpc/server", desc: "The contract-and-RPC toolkit (<a href=\"https://orpc.unnoq.com\">@orpc/*</a>, pinned at ^1.14.6) that underpins NetScript's typed APIs: contracts are declared with <code>oc.route().input().output()</code>, implemented with <code>implement(...)</code>, served by <code>defineService</code>, and consumed by a fully typed client. Workers and sagas expose oRPC services; <strong>triggers are the exception</strong> — they mount raw Hono routes. See <a href=\"/explanation/contracts/\">Explanation → Contracts</a>." }
] }) }}

{{ comp.apiTable({ caption: "P–S", rows: [
  { name: "plugin", type: "plugins/<name>/", desc: "An installable, thread-isolated capability you add with <code>netscript plugin add <worker|saga|trigger|stream> --samples</code>. It lands canonically under <code>plugins/<name>/</code> with its own <code>mod.ts</code> manifest, contracts, jobs, services, and (optionally) Prisma schema; background processors run from entry points like <code>bin/combined.ts</code> or <code>src/runtime/trigger-processor.ts</code>. See <a href=\"/explanation/plugin-model/\">Explanation → Plugin model</a> and <a href=\"/how-to/add-a-plugin/\">How-to → Add a plugin</a>." },
  { name: "registry", type: "generated registry file", desc: "A generated index the runtime reads to discover what your app contains without runtime reflection. <code>netscript plugin list</code> emits the plugin registry, and the workers profile generates a jobs registry (for example to <code>.netscript/generated/plugin-workers/jobs.registry.ts</code>, keyed by job id). Registries are derived artifacts — regenerate them, do not hand-edit. See <a href=\"/explanation/plugin-model/\">Explanation → Plugin model</a>." },
  { name: "saga", type: "defineSaga(id)…build()", desc: "A durable, message-driven workflow authored with the fluent builder from <code>@netscript/plugin-sagas-core</code>: <code>defineSaga(id).durability('t1').state<S>({...}).on<Type,Payload>(type, handler).build()</code>. Each <code>.on(...)</code> handler reacts to a message and returns effects such as <code>sagaComplete({...})</code>. The sagas service lists registered sagas at <code>/api/v1/sagas/sagas</code> on port 8092. See <a href=\"/tutorials/durable-workflow/\">Tutorial → Durable workflow</a> and <a href=\"/capabilities/durable-sagas/\">Capabilities → Durable sagas</a>." },
  { name: "service", type: "defineService(router, {...})", desc: "An oRPC HTTP application. Local app services use a one-shot <code>defineService(router, { name, version, port, openapi })</code> call (the <code>users</code> service on port 3001), while plugin API services use the fluent <code>createService(router, {...}).withCors().…serve()</code> builder — two construction APIs in the same project. See <a href=\"/capabilities/services/\">Capabilities → Services</a> and <a href=\"/reference/service/\">reference/service/</a>." },
  { name: "stream", type: "defineStreamTopic(name, schema)", desc: "A typed event-stream abstraction. You define a topic with <code>defineStreamTopic('orders', schema)</code> from <code>@netscript/plugin-streams</code>; the entity schemas come from <code>@netscript/plugin-streams-core</code>. <strong>Honest reality:</strong> in the current scaffold the producer/consumer runtime is stubbed (topic APIs are deferred), so treat streams as topic-schema authoring plus the durable-streams dev service on port 4437, not live pub/sub yet. See <a href=\"/capabilities/streams/\">Capabilities → Streams</a> and <a href=\"/reference/streams/\">reference/streams/</a>." }
] }) }}

{{ comp.apiTable({ caption: "T–Z", rows: [
  { name: "trigger", type: "defineWebhook(handler, {...})", desc: "An inbound event source — most commonly a webhook — authored with <code>defineWebhook(handler, { id, path, verifier, tags })</code> from <code>@netscript/plugin-triggers-core/builders</code>. The handler returns an array of <code>enqueueJob(jobRef, { payload, priority })</code> effects, binding an HTTP request to a background job. Unlike workers and sagas, the triggers service is built on <strong>raw Hono routes, not oRPC</strong>; <code>POST /api/v1/webhooks/inbound/generic</code> on port 8093 resolves the <code>inbound/generic</code> trigger. See <a href=\"/tutorials/ingest-webhook/\">Tutorial → Ingest a webhook</a> and <a href=\"/capabilities/triggers/\">Capabilities → Triggers</a>." }
] }) }}

## Less common, still load-bearing

A second tier of words you will meet once you go past the happy path — the toolchain,
the data layer, and the moving parts under a running plugin.

{{ comp.apiTable({ caption: "Infrastructure & data", rows: [
  { name: "appsettings.json", type: "infra config", desc: "The root infrastructure manifest the Aspire AppHost actually reads — declaring <code>NetScript.Databases</code> (Postgres engine, container mode, primary database), <code>NetScript.Cache</code> (Garnet), the services, and the per-plugin <code>Workdir</code>s. Note that <code>netscript.config.ts</code>'s <code>databases</code> block is intentionally near-empty; the live DB/cache config lives here. See <a href=\"/explanation/aspire/\">Explanation → Aspire</a>." },
  { name: "Garnet", type: "Cache.garnet (KV)", desc: "The Redis-compatible cache/KV engine Aspire provisions as a container alongside Postgres, used for executions, saga registry metadata, and Deno KV-backed state. See <a href=\"/capabilities/kv-queues-cron/\">Capabilities → KV / queues / cron</a> and <a href=\"/reference/kv/\">reference/kv/</a>." },
  { name: "Prisma (Deno runtime)", type: "database/postgres/schema/", desc: "The ORM layer. The root schema sets <code>generator client { runtime = \"deno\" }</code> plus a zod generator, and each plugin contributes its own <code>.prisma</code> models, aggregated under <code>schema/plugins/<plugin>/</code>. The typed client is generated with <code>netscript db generate</code> after Aspire is up. See <a href=\"/capabilities/database/\">Capabilities → Database</a> and <a href=\"/reference/database/\">reference/database/</a>." },
  { name: "OTel / observability", type: "@opentelemetry/api", desc: "OpenTelemetry tracing and structured logging are wired into the framework; job tooling exposes <code>trace.withChildSpan(...)</code> and structured <code>log</code>. <strong>Honest reality:</strong> the trace/progress helpers in the scaffolded job samples are no-op stubs — real spans flow through the service layer and Aspire's OTLP endpoint at http://localhost:4318, not the sample tools. See <a href=\"/explanation/observability/\">Explanation → Observability</a> and <a href=\"/capabilities/telemetry/\">Capabilities → Telemetry</a>." },
  { name: "background processor", type: "bin/combined.ts", desc: "The separate, long-running process that executes a plugin's work, distinct from its HTTP API service. Workers and sagas run from <code>bin/combined.ts</code>; triggers run from <code>src/runtime/trigger-processor.ts</code>. The AppHost starts these as their own Aspire resources. See <a href=\"/explanation/plugin-model/\">Explanation → Plugin model</a>." }
] }) }}

## Where each term is taught

The glossary lowers lookup cost; these zones build the understanding. Follow a word
into the zone that matches what you need next.

{{ comp.featureGrid({ items: [
  {
    title: "Explanation",
    body: "Mental models for contracts, the plugin model, durable workflows, observability, and Aspire — the why behind the vocabulary.",
    href: "/explanation/",
    icon: "◆"
  },
  {
    title: "Capabilities",
    body: "One hub per capability: concept, headline API, and a Learn / Do / Reference triplet for services, jobs, sagas, triggers, streams, and more.",
    href: "/capabilities/",
    icon: "◎"
  },
  {
    title: "Reference",
    body: "The generated @netscript/* API across 22 units — the authoritative export list for every symbol named above.",
    href: "/reference/",
    icon: "≡"
  },
  {
    title: "Tutorials",
    body: "One continuous app that introduces these terms in order: contract, service, job, saga, then trigger.",
    href: "/tutorials/",
    icon: "→"
  }
] }) }}

{{ comp callout { type: "tip", title: "Still stuck on a word?" } }}
If a term here is unfamiliar, start with <a href=\"/explanation/architecture/\">Explanation → Architecture</a>
for the big picture, then jump to the matching <a href=\"/capabilities/\">capability hub</a> to see the
headline API in context. The <a href=\"/cli-reference/\">CLI reference</a> covers every command name a
glossary entry mentions.
{{ /comp }}

{{ comp.nextPrev({ next: { label: "CLI reference", href: "/cli-reference/" } }) }}
