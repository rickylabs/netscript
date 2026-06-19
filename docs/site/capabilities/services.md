---
layout: layouts/base.vto
title: Services & contracts
templateEngine: [vento, md]
prev: { label: "Capabilities", href: "/capabilities/" }
next: { label: "Background jobs", href: "/capabilities/background-jobs/" }
---

# Services & contracts

A NetScript **service** is a typed HTTP runtime that *implements* an `@orpc/contract`
definition — you author the contract once (route + zod input/output), `implement()` it,
bind `.handler()`s, and serve the resulting router. The contract object is the single
source of truth: the same object a typed client imports is the one the server
implements, so caller and server cannot drift. The example `users` service answers on
port **3001** with both an OpenAPI surface (`/api/v1/users/*`) and an oRPC endpoint
(`/rpc`).

{{ comp callout { type: "tip", title: "Use this when" } }}
Reach for a service when you need a <strong>synchronous, request/response API</strong> with
a versioned, type-locked contract shared between front end and back end — a CRUD surface,
an internal RPC boundary, or a public REST/OpenAPI endpoint. For <em>fire-and-forget</em>
work use a <a href="/capabilities/background-jobs/">background job</a>; for
<em>message-driven, long-running</em> orchestration use a
<a href="/capabilities/durable-sagas/">durable saga</a>; for <em>inbound HTTP that kicks
off work</em> use a <a href="/capabilities/triggers/">trigger</a>.
{{ /comp }}

## The contract is the source of truth

Before there is a service there is a contract. A contract is plain `@orpc/contract`
routes whose inputs and outputs are zod schemas, collected into an object and passed to
`implement()` from `@orpc/server`. `implement()` returns a `.handler()`-bindable object
the service router consumes. The example workspace versions its contracts under
`contracts/versions/v1/` and re-exports them as `@<project>/contracts`.

```ts
// contracts/versions/v1/users.contract.ts
import { z } from 'zod';
import { oc } from '@orpc/contract';
import { implement } from '@orpc/server';

export const UsersContractV1 = {
  health: { check: oc.route({ method: 'GET' }).input(z.object({}).optional()).output(UsersHealthSchemaV1) },
  list: oc.route({ method: 'POST' }).input(UsersListInputSchemaV1).output(UsersListResponseSchemaV1),
  updateStatus: oc.route({ method: 'POST' }).input(UsersUpdateStatusInputSchemaV1).output(UsersUpdateStatusResponseSchemaV1),
};

// `implement()` produces the .handler()-bindable object the service router consumes.
export const UsersV1 = implement(UsersContractV1);
```

## Headline API: two ways to construct a service

NetScript ships **two** service-construction APIs, and the example project uses both.
Workspace services use the one-call `defineService(router, options)` — the right default
for the 80% case. Plugin API services (workers, sagas) use the fluent
`createService(router, options).with*().serve()` builder when they need to add CORS,
OpenAPI, a database client, or custom context step by step. Both stand up the same
Hono + oRPC runtime.

{{ comp.tabbedCode({ tabs: [
  {
    label: "Simple — defineService (one-shot)",
    lang: "ts",
    code: "// services/users/src/main.ts\nimport { defineService } from '@netscript/service';\nimport { router } from './router.ts';\n\n// One call wires CORS, request logging, OpenAPI, RPC, and health endpoints.\nawait defineService(router, {\n  name: 'users',\n  version: '1.0.0',\n  port: parseInt(Deno.env.get('PORT') || '3001'),\n  openapi: { title: 'Users API', description: 'users service' },\n  debug: true,\n});"
  },
  {
    label: "Advanced — createService().serve() (fluent)",
    lang: "ts",
    code: "// plugins/workers/services/src/main.ts — step-by-step composition\nimport { createService } from '@netscript/service';\nimport { router } from './router.ts';\n\nawait createService(router, { name: 'workers', version: '1.0.0', port: 8091 })\n  .withCors()\n  .withLogger()\n  .withOpenAPI({ title: 'Workers API' })\n  .withDocs()\n  .withDatabase(dbClient)\n  .withContext(() => ({ workers: runtime }))\n  .withRPC({ traceContext: true })\n  .withHealth()\n  .withServiceInfo()\n  .onStartup(async () => {/* seed, warm caches */})\n  .serve();"
  }
] }) }}

{{ comp callout { type: "note", title: "Handlers bind to the contract" } }}
A router aggregates versioned handlers — <code>export const router = { v1: { users: { ...UsersV1, health } } }</code> —
and each handler is bound from the implemented contract:
<code>v1.users.list.handler(async ({ input }) =&gt; { /* return records */ })</code>. In the
scaffold's <strong>Step 5</strong> the <code>users</code> handlers return seeded
<strong>in-memory records</strong> (no database yet) — the front-end ↔ contract proof. Wiring
Prisma comes later; see <a href="/capabilities/database/">Database</a>.
{{ /comp }}

## Endpoints & ports

A `defineService` runtime exposes its OpenAPI routes, an oRPC `/rpc` endpoint, and a
health check. The example `users` service is reachable once `aspire run` is up (Aspire
provisions Postgres/Garnet first) or when you run it directly with
`deno task --cwd services/users dev`.

{{ comp.apiTable({
  caption: "Users service surface (port 3001)",
  rows: [
    { name: "/api/v1/users/*", type: "HTTP/OpenAPI", desc: "REST surface generated from the contract (list, updateStatus, health)." },
    { name: "/api/rpc/v1/...", type: "oRPC", desc: "Typed RPC endpoint a generated client calls — same contract object, no drift." },
    { name: "/rpc", type: "oRPC", desc: "Mounted oRPC handler entrypoint for the service router." },
    { name: ":3001", type: "port", desc: "Default service port; read from Deno.env.get('PORT') || '3001'." }
  ]
}) }}

{{ comp callout { type: "important", title: "Aspire first, then hit the endpoint" } }}
Services that touch the database need orchestration up first:
<code>cd aspire &amp;&amp; aspire run</code> brings up Postgres and Garnet (dashboard at
<a href="http://localhost:18888">http://localhost:18888</a>) <strong>before</strong> any
<code>netscript db</code> command. The seeded-records example service runs without the DB,
but the real workflow expects Aspire running. See <a href="/explanation/aspire/">Aspire</a>.
{{ /comp }}

## Where to go next

This hub is intentionally thin — the full generated API lives in the reference. Pick the
lane that matches what you're doing.

{{ comp.featureGrid({ items: [
  {
    title: "Learn — Build a service",
    body: "Guided tutorial: contract → users service on :3001 → typed client → island, built from scratch.",
    href: "/tutorials/build-a-service/",
    icon: "→"
  },
  {
    title: "Do — Add a service",
    body: "Task recipe: add a new typed oRPC service to an existing workspace with defineService.",
    href: "/how-to/add-a-service/",
    icon: "◆"
  },
  {
    title: "Look up — @netscript/service reference",
    body: "The full generated API: defineService, createService, the fluent builder, and runtime options.",
    href: "/reference/service/",
    icon: "≡"
  },
  {
    title: "Understand — Contracts",
    body: "The oRPC contract → implement → handler → typed client → query → island type flow, explained.",
    href: "/explanation/contracts/",
    icon: "◎"
  }
] }) }}

{{ comp.nextPrev({ prev: { label: "Capabilities", href: "/capabilities/" }, next: { label: "Background jobs", href: "/capabilities/background-jobs/" } }) }}
