---
layout: layouts/base.vto
title: Glossary
templateEngine: [vento, md]
prev: null
next: { label: "CLI reference", href: "/cli-reference/" }
---

# Glossary

NetScript is a small framework with a handful of load-bearing words. Most of the
friction in learning it is vocabulary, not syntax — once you can map a term to the
file it lives in and the API that produces it, the rest of the docs read quickly.

This page is the dictionary. Every entry is one to three sentences, grounded in the
real scaffold and reconciled to the current framework, and links to the canonical
page where the term is *taught* (the Explanation that gives you the mental model, the
Capability hub that shows the headline API, or the generated [Reference](/reference/)
that lists every export). Use it as a lookup, not a tutorial: when a page drops a word
like **contribution**, **single-active-backend**, or **durability tier** and you want
the precise meaning, come here, then follow the link back into the learning thread.

{{ comp callout { type: "note", title: "How to read an entry" } }}
The middle column is the <strong>headline API or file</strong> a term maps to — the
concrete thing you type or open. The description links to where it is taught. Terms
are alphabetized within each table; related terms cross-reference each other so you
can chase a concept across the <a href="/explanation/">Explanation</a>,
<a href="/capabilities/">Capabilities</a>, and <a href="/reference/">Reference</a>
zones without a dead end.
{{ /comp }}

## Core vocabulary

These are the words you will meet first — in the [Quickstart](/quickstart/), the
[tutorials ladder](/tutorials/), and the [architecture overview](/explanation/architecture/).

{{ comp.apiTable({ caption: "A–C", rows: [
  { name: "AppHost", type: "aspire/apphost.mts", desc: "The Aspire orchestration entry point that boots your whole workspace — Postgres, Redis, services, and plugin processors — as one resource graph with a dashboard at http://localhost:18888. In NetScript the AppHost is a <strong>generated Node/TypeScript</strong> file (<code>aspire/apphost.mts</code>) driven by <code>aspire.config.json</code> and <code>appsettings.json</code>, not a dotnet project. You start it with <code>cd aspire &amp;&amp; aspire start</code>, and it must be up <em>before</em> any <code>netscript db</code> command. See <a href=\"/explanation/aspire/\">Explanation → Aspire</a> and <a href=\"/reference/aspire/\">reference/aspire/</a>." },
  { name: "archetype", type: "doctrine classification", desc: "The architectural category a package or plugin belongs to (for example a contract unit, an adapter, a runtime, or a plugin), which determines its public surface, quality gates, and allowed dependencies. Archetype is a <em>framework-internal</em> doctrine term; as an app author you mostly meet it indirectly through the shape of a scaffolded plugin. See <a href=\"/explanation/plugin-system/\">Explanation → Plugin system</a>." },
  { name: "Aspire", type: "aspire start", desc: "The .NET Aspire orchestration layer NetScript uses for local development. It provisions your database (Postgres by default; or <code>mysql</code> / <code>mssql</code> via <code>--db</code>, each an Aspire container resource — <code>sqlite</code> is file-backed and adds no container) and Redis as Docker containers and wires every service and plugin processor together with health, logs, and OTLP traces — no manual <code>docker compose</code>. The escape hatch is <code>netscript init --no-aspire</code> for a leaner single-process loop. See <a href=\"/explanation/aspire/\">Explanation → Aspire</a> and <a href=\"/how-to/deploy/\">How-to → Deploy</a>." },
  { name: "AuthBackendPort", type: "@netscript/plugin-auth-core/ports", desc: "The single seam every authentication backend implements — defined by <code>@netscript/plugin-auth-core</code>, it composes provider, session-store, crypto, and principal-mapper sub-ports plus an <code>authenticate(request)</code> method and an <em>optional</em> <code>interactive</code> flow. Backends are pure adapters behind this port; the host never special-cases a vendor. See <a href=\"/capabilities/auth/\">Capabilities → Authentication</a> and <a href=\"/explanation/auth-model/\">Explanation → Auth model</a>." },
  { name: "AuthBackendOperationUnsupportedError", type: "typed capability boundary", desc: "The typed error a backend throws when you call an operation it does not implement — for example a session mutation on a stateless backend, or an interactive sign-in on a non-interactive one. It makes the <strong>single-active-backend</strong> capability matrix fail loud rather than silently no-op, so missing surface is a visible error, not a mystery. See <a href=\"/explanation/auth-model/\">Explanation → Auth model</a> and the <a href=\"/capabilities/auth/\">Capabilities &rarr; Auth</a> export list." },
  { name: "AuthSession", type: "@netscript/plugin-auth-core/domain", desc: "The domain record for an authenticated session — id, user, account, and state (<code>active</code> | <code>expired</code> | <code>revoked</code>) — defined as a Zod-validated type in <code>@netscript/plugin-auth-core</code>. It is the durable shape the session store reads and writes and the entity the auth stream projects. See <a href=\"/explanation/auth-model/\">Explanation → Auth model</a> and <a href=\"/capabilities/auth/\">Capabilities → Authentication</a>." },
  { name: "capability", type: "/capabilities/<cap>/", desc: "A first-class thing NetScript does — services, background jobs, durable sagas, triggers, streams, authentication, database, KV/queues/cron, telemetry, and the Fresh UI. Each capability has a hub page pairing a one-screen concept with its headline API and a Learn / Do / Reference triplet. See the <a href=\"/capabilities/\">Capabilities</a> index." },
  { name: "composition root", type: "netscript.config.ts", desc: "The single place where a NetScript app is assembled — <code>defineConfig({...})</code> declares the project name, path layout, logging, databases, and plugin entrypoints such as generated <code>./auth/mod.ts</code> glue or author-owned <code>./plugins/&lt;name&gt;/mod.ts</code>. It is the wiring manifest the runtime reads to know what your app is made of. See <a href=\"/explanation/architecture/\">Explanation → Architecture</a> and <a href=\"/reference/config/\">reference/config/</a>." },
  { name: "contract", type: "oc.route().input().output()", desc: "The versioned, schema-first definition of an API — built with <a href=\"https://orpc.unnoq.com\">@orpc/contract</a> plus <a href=\"https://zod.dev\">zod</a> in <code>contracts/versions/v1/</code> — that locks the request and response shape <em>before</em> any handler exists. Passing a contract to <code>implement(Contract)</code> produces the object whose <code>.handler(...)</code> methods the service router binds, so the client and server share one source of truth. This is the heart of NetScript's contracts-first model. See <a href=\"/explanation/contracts/\">Explanation → Contracts</a> and <a href=\"/reference/contracts/\">reference/contracts/</a>." },
  { name: "contribution", type: "plugin manifest export", desc: "A typed unit of functionality a plugin contributes to the host — a job, a saga, a webhook trigger, a route, an Aspire resource, or a database schema — surfaced through the plugin's <code>mod.ts</code> <strong>manifest</strong> so the runtime can discover and wire it. The auth plugin, for instance, contributes a service, a Prisma schema, and durable stream events through its manifest. See <a href=\"/explanation/plugin-system/\">Explanation → Plugin system</a>." }
] }) }}

{{ comp.apiTable({ caption: "C–J", rows: [
  { name: "compensation-as-effect", type: "handler return value", desc: "How the scaffolded saga sample models rollback: instead of an explicit <code>.step()</code> / <code>.compensate()</code> chain, a message handler <em>returns an array of effects</em> (such as <code>sagaComplete({...})</code>) that the runtime applies. Compensation is just another effect a handler can emit. See <a href=\"/explanation/durability-model/\">Explanation → Durability model</a>." },
  { name: "durability tier", type: ".durability('t1')", desc: "The persistence guarantee a saga declares in its builder chain — for example <code>'t1'</code> in <code>defineSaga(id).durability('t1')</code> — telling the runtime how durably to checkpoint the saga's state across messages. This is distinct from the <strong>saga store backend</strong> (kv | prisma), which is <em>where</em> that state is written. See <a href=\"/explanation/durability-model/\">Explanation → Durability model</a> and <a href=\"/capabilities/durable-sagas/\">Capabilities → Durable sagas</a>." },
  { name: "durable", type: "saga state checkpointing", desc: "Describes work that survives process restarts because its progress is persisted, not held only in memory. NetScript's sagas are durable: their state is checkpointed per the chosen durability tier — to the <strong>saga store backend</strong> (kv or prisma) — so a long-running, message-driven workflow can resume after a crash. See <a href=\"/explanation/durability-model/\">Explanation → Durability model</a>." },
  { name: "InteractiveFlowPort", type: "optional AuthBackendPort member", desc: "The optional sub-port a backend implements when it drives a redirect-based sign-in (the <code>signIn</code> / <code>handleCallback</code> / <code>getSessionId</code> / <code>signOut</code> flow). Only the <code>kv-oauth</code> backend exposes it; on <code>workos</code> and <code>better-auth</code> the <code>signin</code> / <code>callback</code> endpoints return a typed provider error because they have no interactive flow. See <a href=\"/explanation/auth-model/\">Explanation → Auth model</a>." },
  { name: "job", type: "defineJobHandler(async (ctx) => …)", desc: "A unit of background work authored with <code>@netscript/plugin-workers-core</code>, returning <code>createSuccessResult({...})</code> or <code>createFailureResult(...)</code> and tagged with an id via <code>Object.assign(handler, { id })</code>. Jobs run on the workers processor and are triggered over HTTP at <code>POST /api/v1/workers/jobs/{id}/trigger</code> on port 8091. Job dispatch and execution are instrumented with real OpenTelemetry spans (see <strong>OTel / observability</strong>). See <a href=\"/tutorials/erp-sync/\">Tutorial → Background jobs</a> and <a href=\"/capabilities/background-jobs/\">Capabilities → Background jobs</a>." }
] }) }}

{{ comp.apiTable({ caption: "M–P", rows: [
  { name: "manifest", type: "plugins/<name>/mod.ts", desc: "A plugin's public face — its <code>mod.ts</code> — which exports the plugin object (for example <code>workersPlugin</code> or <code>authPlugin</code>), an inspector (<code>inspectWorkers</code>, <code>inspectAuth</code>), and the contribution types the host discovers. The composition root references each plugin by its manifest path, and a generated <strong>registry</strong> aggregates them. See <a href=\"/explanation/plugin-system/\">Explanation → Plugin system</a>." },
  { name: "oRPC", type: "@orpc/contract · @orpc/server", desc: "The contract-and-RPC toolkit (<a href=\"https://orpc.unnoq.com\">@orpc/*</a>, pinned at ^1.14.6) that underpins NetScript's typed APIs: contracts are declared with <code>oc.route().input().output()</code>, implemented with <code>implement(...)</code>, served by <code>defineService</code> / <code>createService</code>, and consumed by a fully typed client. Workers, sagas, the auth service, and triggers all expose oRPC (mounted under <code>/api/rpc/*</code>); triggers' only exception is the raw, HMAC-verifying <strong>webhook ingress endpoint</strong>. See <a href=\"/explanation/contracts/\">Explanation → Contracts</a>." },
  { name: "opaque session token (HMAC)", type: "createHmacSessionTokenCrypto(secret)", desc: "The default session-token scheme in the auth core — a WebCrypto HMAC-SHA256 token that carries no readable claims (opaque to the client) and is verified server-side against a secret. It is what the <code>AuthSessionCryptoPort</code> produces by default, so a stolen token reveals nothing and cannot be forged without the secret. See <a href=\"/explanation/auth-model/\">Explanation → Auth model</a> and <a href=\"/capabilities/auth/\">Capabilities &rarr; Auth</a>." },
  { name: "plugin", type: "package + generated glue", desc: "An installable, thread-isolated capability. Public workspaces install plugin packages with commands such as <code>netscript plugin install @netscript/plugin-workers</code>, which add the dependency and emit user-owned glue/sample files that import the package; local-source contributor samples use <code>deno run -A packages/cli/bin/netscript-dev.ts plugin install worker --name workers --samples</code>. The plugin's contracts, services, runtime entrypoints, and Prisma schema stay in the installed package unless you are authoring or syncing full source. See <a href=\"/explanation/plugin-system/\">Explanation → Plugin system</a> and <a href=\"/how-to/add-a-plugin/\">How-to → Add a plugin</a>." },
  { name: "Principal", type: "@netscript/service/auth", desc: "The authenticated identity an authenticator resolves from a request — id, scopes, and a <code>scheme</code> (<code>'api-key'</code> | <code>'bearer'</code> | <code>'trusted-header'</code> | <code>'custom'</code>). The auth-plugin backends map their sessions to a Principal with <code>scheme: 'custom'</code>, so service-layer authz treats vendor-backed identities uniformly. See <a href=\"/explanation/auth-model/\">Explanation → Auth model</a>." }
] }) }}

{{ comp.apiTable({ caption: "R–S", rows: [
  { name: "registry", type: "generated registry file", desc: "A generated index the runtime reads to discover what your app contains without runtime reflection. <code>netscript plugin list</code> emits the plugin registry, and the workers profile generates a jobs registry (for example to <code>.netscript/generated/plugin-workers/jobs.registry.ts</code>, keyed by job id). Registries are derived artifacts — regenerate them, do not hand-edit. See <a href=\"/explanation/plugin-system/\">Explanation → Plugin system</a>." },
  { name: "saga", type: "defineSaga(id)…build()", desc: "A durable, message-driven workflow authored with the fluent builder from <code>@netscript/plugin-sagas-core</code>: <code>defineSaga(id).durability('t1').state&lt;S&gt;({...}).on&lt;Type,Payload&gt;(type, handler).build()</code>. Each <code>.on(...)</code> handler reacts to a message and returns effects such as <code>sagaComplete({...})</code>. Runtime state persists to a chosen <strong>saga store backend</strong> (kv | prisma). The sagas service lists registered sagas at <code>/api/v1/sagas/sagas</code> on port 8092. See <a href=\"/tutorials/storefront/04-checkout-saga/\">Tutorial → Durable workflow</a> and <a href=\"/capabilities/durable-sagas/\">Capabilities → Durable sagas</a>." },
  { name: "saga store backend", type: "NETSCRIPT_SAGA_STORE=kv|prisma", desc: "Where a durable saga runtime persists its checkpointed state — selectable as <code>'kv'</code> or <code>'prisma'</code> via <code>NETSCRIPT_SAGA_STORE</code> (or appsettings <code>sagas.store.backend</code>) and constructed with <code>createDurableSagaRuntime({ backend, prisma })</code>. The selection is <em>mandatory</em> — the runtime throws if it is unset, and Prisma mode requires a client. This is distinct from a saga's <strong>durability tier</strong>. See <a href=\"/capabilities/durable-sagas/\">Capabilities → Durable sagas</a> and <a href=\"/explanation/durability-model/\">Explanation → Durability model</a>." },
  { name: "service", type: "defineService(router, {...})", desc: "An oRPC HTTP application. Local app services use a one-shot <code>defineService(router, { name, version, port, openapi })</code> call (the <code>users</code> service on port 3001), while plugin API services use the fluent <code>createService(router, {...}).withCors()…serve()</code> builder — two construction APIs in the same project. oRPC is served at <code>/api/rpc/*</code>; the service layer also offers an authn/authz middleware seam (<code>.withAuthn()</code> / <code>.withAuthz()</code>). See <a href=\"/capabilities/services/\">Capabilities → Services</a> and <a href=\"/reference/service/\">reference/service/</a>." },
  { name: "single-active-backend", type: "NETSCRIPT_AUTH_BACKEND", desc: "The hard v1 boundary of the auth plugin: exactly one authentication backend is active at a time — <code>kv-oauth</code> (default), <code>workos</code>, or <code>better-auth</code> — chosen by <code>NETSCRIPT_AUTH_BACKEND</code> (or appsettings <code>auth.backend</code>); the unified auth oRPC service answers on port <code>:8094</code>. There is no multi-active routing, cross-backend account linking, global logout, or historical session replay yet. See <a href=\"/capabilities/auth/\">Capabilities → Authentication</a> and <a href=\"/explanation/auth-model/\">Explanation → Auth model</a>." },
  { name: "stream", type: "createDurableStream({...})", desc: "A typed, durable event-stream abstraction. The <strong>producer runtime is real</strong>: <code>createDurableStream({ streamPath, schema, producerId })</code> from <code>@netscript/plugin-streams-core</code> writes durable entity state, served as an Aspire service on port 4437 and wired into workers, auth, and sagas. The <code>@netscript/plugin-streams</code> manifest helpers <code>defineStreamProducer</code> / <code>defineStreamConsumer</code> are intentional stubs that <em>throw</em> <code>StreamUnsupportedOperationError</code> and redirect you to the core; there is no in-process consumer <code>subscribe()</code> (consumption is HTTP/SSE). See <a href=\"/capabilities/streams/\">Capabilities → Streams</a> and <a href=\"/reference/streams/\">reference/streams/</a>." }
] }) }}

{{ comp.apiTable({ caption: "T–Z", rows: [
  { name: "trigger", type: "defineWebhook(handler, {...})", desc: "An inbound event source — most commonly a webhook — authored with <code>defineWebhook(handler, { id, path, verifier, tags })</code> from <code>@netscript/plugin-triggers-core/builders</code>. The handler returns an array of effects binding an HTTP request to background work. The <strong>supported action is</strong> <code>enqueueJob(jobRef, { payload, priority })</code> (live); <code>defer</code> is defined-but-unsupported — it <em>throws</em> and routes the message to the DLQ, with no deferred replay. Like workers and sagas, the triggers service serves a <strong>typed v1 oRPC contract</strong> for trigger and event introspection plus management on port 8093; the one exception is the raw, HMAC-verifying <strong>webhook ingress endpoint</strong> (<code>POST /api/v1/webhooks/:triggerId</code>). See <a href=\"/tutorials/storefront/05-shipping-webhook/\">Tutorial → Ingest a webhook</a> and <a href=\"/capabilities/triggers/\">Capabilities → Triggers</a>." }
] }) }}

## Less common, still load-bearing

A second tier of words you will meet once you go past the happy path — the toolchain,
the data layer, the auth seams, and the moving parts under a running plugin.

{{ comp.apiTable({ caption: "Infrastructure, data & auth internals", rows: [
  { name: "appsettings.json", type: "infra config", desc: "The root infrastructure manifest the Aspire <strong>AppHost</strong> actually reads — declaring <code>NetScript.Databases</code> (the database engine — Postgres by default, or <code>mysql</code> / <code>mssql</code> / <code>sqlite</code> selected at scaffold with <code>--db</code> — container mode, primary database), <code>NetScript.Cache</code> (the <code>redis</code> cache by default; <code>garnet</code> or <code>deno-kv</code> via <code>--cache-backend</code>), the services, and the per-plugin <code>Workdir</code>s. It is also where backend selections like <code>sagas.store.backend</code> and <code>auth.backend</code> can live. Note that <code>netscript.config.ts</code>'s <code>databases</code> block is intentionally near-empty; the live DB/cache config lives here. See <a href=\"/explanation/aspire/\">Explanation → Aspire</a>." },
  { name: "auth backend", type: "@netscript/auth-*", desc: "A pure adapter that implements <strong>AuthBackendPort</strong>: <code>kv-oauth</code> (interactive OAuth/OIDC redirect flow, KV sessions — the only one exposing <strong>InteractiveFlowPort</strong>), <code>workos</code> (AuthKit sealed cookie, non-interactive), and <code>better-auth</code> (Prisma-backed, non-interactive). The plugin composes exactly one — see <strong>single-active-backend</strong> — and serves the unified auth oRPC surface on port <code>:8094</code>. See <a href=\"/explanation/auth-model/\">Explanation → Auth model</a> and <a href=\"/how-to/add-authentication/\">How-to → Add authentication</a>." },
  { name: "background processor", type: "bin/combined.ts", desc: "The separate, long-running process that executes a plugin's work, distinct from its HTTP API service. Workers run from <code>bin/combined.ts</code>; sagas run from <code>src/runtime/saga-runner.ts</code>; triggers run from <code>src/runtime/trigger-processor.ts</code>. The AppHost starts these as their own Aspire resources. See <a href=\"/explanation/plugin-system/\">Explanation → Plugin system</a>." },
  { name: "Garnet", type: "Cache.garnet (KV)", desc: "One of the Redis-compatible cache/KV backends Aspire can provision as a container alongside Postgres (the default is <code>redis</code>; select Garnet with <code>--cache-backend garnet</code>), used for executions, saga registry metadata, kv-oauth sessions, and Deno KV-backed state. See <a href=\"/capabilities/kv-queues-cron/\">Capabilities → KV / queues / cron</a> and <a href=\"/reference/kv/\">reference/kv/</a>." },
  { name: "OTel / observability", type: "@netscript/telemetry", desc: "OpenTelemetry tracing and structured logging wired into the framework. Job dispatch, execution, step events, progress, scheduler runs, and subprocess trace continuation emit <em>real</em> spans — traces show up in Aspire automatically (OTLP endpoint at http://localhost:4318). The one remaining gap is the scaffold <code>createJobTools(ctx)</code> handler helpers (<code>trace.addEvent</code> / <code>withChildSpan</code> / <code>progress</code>), which are still no-op stubs (tracked debt, fix planned) — for custom handler spans call <code>@netscript/telemetry</code> helpers directly. See <a href=\"/explanation/observability/\">Explanation → Observability</a> and <a href=\"/capabilities/telemetry/\">Capabilities → Telemetry</a>." },
  { name: "Prisma (Deno runtime)", type: "database/postgres/schema/", desc: "The ORM layer, backed by a polyglot database. The engine is chosen at scaffold time with <code>--db</code> — <code>postgres</code> (the recommended default; Prisma provider <code>postgresql</code>), <code>mysql</code>, <code>mssql</code> (provider <code>sqlserver</code>), or <code>sqlite</code> (file-backed, with no Aspire container resource) — while the Prisma authoring model stays identical across engines. The root schema sets <code>generator client { runtime = \"deno\" }</code> plus a zod generator, and each plugin contributes its own <code>.prisma</code> models, aggregated under <code>schema/plugins/&lt;plugin&gt;/</code> (the auth plugin installs <code>auth_users</code> / <code>auth_sessions</code> / <code>auth_accounts</code> / <code>auth_verifications</code>). The typed client is generated with <code>netscript db generate</code> after Aspire is up. See <a href=\"/capabilities/database/\">Capabilities → Database</a> and <a href=\"/reference/database/\">reference/database/</a>." },
  { name: "queue provider", type: "QueueProvider.Postgres", desc: "The transport a <code>createQueue('name', { provider })</code> binds to — one of <strong>four</strong> backends: Deno KV, Redis, RabbitMQ, and PostgreSQL (<code>provider: 'postgres'</code>, <code>connection.postgres.{url,tableName}</code>). Postgres is selectable by <em>explicit provider only</em>; auto-discovery probes RabbitMQ → Redis → Deno KV and never picks Postgres. See <a href=\"/capabilities/kv-queues-cron/\">Capabilities → KV / queues / cron</a> and <a href=\"/reference/queue/\">reference/queue/</a>." }
] }) }}

## Where each term is taught

The glossary lowers lookup cost; these zones build the understanding. Follow a word
into the zone that matches what you need next.

{{ comp.featureGrid({ items: [
  {
    title: "Explanation",
    body: "Mental models for contracts, the plugin model, durable workflows, the auth model, observability, and Aspire — the why behind the vocabulary.",
    href: "/explanation/",
    icon: "◆"
  },
  {
    title: "Capabilities",
    body: "One hub per capability: concept, headline API, and a Learn / Do / Reference triplet for services, jobs, sagas, triggers, streams, authentication, and more.",
    href: "/capabilities/",
    icon: "◎"
  },
  {
    title: "Reference",
    body: "The generated @netscript/* API — the authoritative export list for every symbol named above, including the plugin-auth-core port surface.",
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
If a term here is unfamiliar, start with <a href="/explanation/architecture/">Explanation → Architecture</a>
for the big picture, then jump to the matching <a href="/capabilities/">capability hub</a> to see the
headline API in context. The <a href="/cli-reference/">CLI reference</a> covers every command name a
glossary entry mentions.
{{ /comp }}

{{ comp.nextPrev({ next: { label: "CLI reference", href: "/cli-reference/" } }) }}
