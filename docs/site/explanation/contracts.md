---
layout: layouts/base.vto
title: Contracts & type flow
templateEngine: [vento, md]
prev: { label: "Architecture", href: "/explanation/architecture/" }
next: { label: "The plugin system", href: "/explanation/plugin-system/" }
order: 2
---

# Contracts & type flow

This page explains *why* NetScript is contracts-first and *how* a single type definition
travels from a contract, through a service handler, all the way to a typed client and a UI
island — with no second source of truth and no code-generation step to drift. It is
understanding-oriented: read it to build a mental model. When you want exact signatures,
follow the links to [`reference/contracts/`](/reference/contracts/) and
[`reference/service/`](/reference/service/); when you want to build the thing, follow the
[capability hub for services](/capabilities/services/) or the
[Build a service tutorial](/tutorials/storefront/02-catalog-service/).

## The thesis: the contract is the product

Most backend stacks have *two* sources of truth for the boundary between a server and its
callers: the server's runtime validation, and a separately-maintained client (a generated
SDK, a hand-written `fetch` wrapper, an OpenAPI document, a GraphQL schema). The two drift.
You change the server, forget the client, and the mismatch surfaces at runtime — in
production, as a 500 or a silently-wrong field — instead of at your desk, as a red squiggle.

NetScript removes the second source of truth. A **contract** is one TypeScript value that
declares a route's method, its input shape, and its output shape. The server *implements*
that exact value; the client is *derived* from that exact value. There is nothing to
regenerate and nothing to keep in sync, because there is only ever one definition. The
contract is not documentation about the boundary — it **is** the boundary.

{{ comp callout { type: "important", title: "One definition, enforced three ways" } }}
The same contract value is consumed by <strong>zod</strong> (runtime input/output validation),
by the <strong>TypeScript</strong> type checker (compile-time shape checking on both sides), and by
the OpenAPI generator (the published spec). Change the contract and all three move together —
there is no path where one lags behind.
{{ /comp }}

## What a contract actually is

A contract is built from [`@orpc/contract`](https://orpc.unnoq.com) plus
[`zod`](https://zod.dev). `oc.route({ method })` declares the transport verb;
`.input(...)` and `.output(...)` attach zod schemas that describe the request and response.
The result is an inert *definition* — it owns no handler, opens no socket, and does no
runtime work. It is pure shape. That inertness is the point: because a contract performs no
side effects, it can be imported anywhere — by the server, by the client, by a test, by a
codegen-free tool — without dragging runtime behavior along with it.

{{ comp.tabbedCode({ tabs: [
  {
    label: "contracts/versions/v1/users.contract.ts",
    lang: "ts",
    code: "import { z } from 'zod';\nimport { oc } from '@orpc/contract';\nimport { implement } from '@orpc/server';\n\n// 1. zod schemas describe the data — the single shape definition.\nexport const UsersListItemSchemaV1 = z.object({\n  id: z.number().int().positive(),\n  name: z.string().min(1),\n  summary: z.string().min(1),\n  status: UsersStatusSchemaV1,\n  createdAt: z.string().datetime(),\n});\n\n// 2. The contract binds method + input + output. No handler yet.\nexport const UsersContractV1 = {\n  health: {\n    check: oc.route({ method: 'GET' })\n      .input(z.object({}).optional())\n      .output(UsersHealthSchemaV1),\n  },\n  list: oc.route({ method: 'POST' })\n    .input(UsersListInputSchemaV1)\n    .output(UsersListResponseSchemaV1),\n  updateStatus: oc.route({ method: 'POST' })\n    .input(UsersUpdateStatusInputSchemaV1)\n    .output(UsersUpdateStatusResponseSchemaV1),\n};\n\n// 3. implement() turns the contract into a .handler()-bindable object.\nexport const UsersV1 = implement(UsersContractV1);"
  },
  {
    label: "Why this order matters",
    lang: "text",
    code: "schema  ->  contract  ->  implement()  ->  handler  ->  client\n  |          |             |              |          |\n zod      oc.route     binds the      your code    derived,\n shape    (verb +      contract to      runs       not written\n          io)         a server obj   the logic     by hand\n\nEverything downstream is TYPED FROM step 1. You define the\nshape once; the compiler propagates it to every consumer."
  }
] }) }}

The contract version above lives under `contracts/versions/v1/` and is exported through the
workspace's `@<project>/contracts` alias (for the scaffolded `users` example, that is
`@my-app/contracts`). Versioning the contract directory — `versions/v1/`, later `v2/` — is
deliberate: a contract is a long-lived promise, so its breaking changes are an explicit new
version rather than an in-place mutation that silently breaks callers.

{{ comp callout { type: "note", title: "zod is the shape; oRPC is the boundary" } }}
A useful split to hold in your head: <strong>zod</strong> answers <em>"what does this data look like, and
is a given value valid?"</em>, while <strong>oRPC</strong> (<code>@orpc/contract</code>) answers <em>"which route,
which verb, what goes in, what comes out?"</em>. The contract is where the two meet — an
<code>oc.route(...)</code> wrapping zod schemas in <code>.input()</code>/<code>.output()</code>. Neither library knows
about the other's transport or persistence; together they describe the whole boundary and
nothing else.
{{ /comp }}

## `implement()`: from shape to a bindable server object

`implement()` (from `@orpc/server`) is the hinge between the *definition* and the *runtime*.
Given a contract, it returns an object whose every route exposes a `.handler(...)` method.
The handler you pass in is type-locked to the contract: its argument is the contract's
`input` type, and its return value must satisfy the contract's `output` type. You cannot
return the wrong shape — it will not compile.

{{ comp.tabbedCode({ tabs: [
  {
    label: "services/users/src/routers/v1.ts",
    lang: "ts",
    code: "import { type UsersListItemV1, v1 } from '@my-app/contracts';\n\n// `input` is typed from the contract's .input() schema.\n// The returned object is checked against the .output() schema.\nexport const UsersV1 = {\n  list: v1.users.list.handler(async ({ input }) => {\n    // `input` is fully typed. The compiler knows its fields.\n    // Returns seeded in-memory records at this scaffold step (no DB yet).\n    return { items: seededUsers, pagination: { total: seededUsers.length } };\n  }),\n  updateStatus: v1.users.updateStatus.handler(async ({ input }) => {\n    // mutate + return a value the contract's output schema accepts\n    return { updated: true, id: input.id, status: input.status };\n  }),\n};"
  },
  {
    label: "services/users/src/router.ts",
    lang: "ts",
    code: "// The router aggregates versioned handler objects into one tree.\nimport { UsersV1 } from './routers/v1.ts';\nimport { health } from './routers/health.ts';\n\nexport const v1 = { users: { ...UsersV1, health } };\nexport const router = { v1 };"
  }
] }) }}

{{ comp callout { type: "note", title: "The handler is the only place you write logic" } }}
Notice what the handler does <em>not</em> do: it never parses the request body, never validates
input, never serializes the response by hand, never declares a route string. The contract
already specified all of that. <code>implement()</code> wires zod validation around your
function automatically, so the handler body is pure business logic over already-typed,
already-validated data.
{{ /comp }}

The router tree mirrors the contract tree. Because the contract is a plain nested object —
`{ v1: { users: { list, updateStatus, health } } }` — the handlers nest the same way, and the
derived client later walks the *same* path (`client.users.list(...)`). There is no separate
routing table to register, no decorator to remember, and no string key that can fall out of
sync with the handler it names. The shape of your API *is* the shape of these objects.

## Serving the router: where the contract meets HTTP

A local service hands the router to `defineService(...)`, which wires CORS, request logging,
OpenAPI, RPC, and health endpoints in one call and binds a port. The contract's shapes become
the service's validation and its published OpenAPI document at the same time — one definition,
two artifacts.

{{ comp.tabbedCode({ tabs: [
  {
    label: "services/users/src/main.ts",
    lang: "ts",
    code: "import { defineService } from '@netscript/service';\nimport { router } from './router.ts';\n\nawait defineService(router, {\n  name: 'users',\n  version: '1.0.0',\n  port: parseInt(Deno.env.get('PORT') || '3001'),\n  openapi: { title: 'Users API', description: 'users service' },\n  debug: true,\n});\n// Serves /api/v1/users/* (OpenAPI) and /api/rpc/v1/... (typed RPC) on :3001."
  }
] }) }}

Aspire injects `PORT` at runtime, so the entrypoint reads it from the environment; the typed source
of truth is your `netscript.config.ts` `services.<name>.port` field, which the scaffold wires as the
fallback default — set the port there rather than editing this line.

The `users` service listens on **port 3001** and exposes two parallel transports from the same
contract: REST-shaped routes under `/api/v1/users/*` (driven by `oc.route({ method, path })`
and surfaced in OpenAPI) and a typed RPC channel under `/api/rpc/v1/...` that the derived client
speaks. Both are the *same* contract; the difference is only the wire format. The RPC mount
point is `/api/rpc/*` — not `/rpc` — and the derived client is configured to target exactly
that base, so you rarely type the path yourself; it follows from the contract and the service
options.

{{ comp callout { type: "tip", title: "Two service-construction APIs in one project" } }}
Local services in <code>services/</code> use the one-shot <code>defineService(router, options)</code>
form above. The framework's <strong>plugin</strong> API services (workers, sagas, triggers, auth) use a
fluent builder instead — <code>createService(router, options).withCors().withLogger().withOpenAPI(...).withDocs().withRPC(...).withHealth().serve()</code>.
Same contracts-first model underneath; the builder simply exposes each cross-cutting concern as
an explicit, composable step. Reach for <code>defineService</code> when the defaults are what you want,
and the builder when you need to add, remove, or reorder a concern. See
<a href="/capabilities/services/">the services capability</a>.
{{ /comp }}

## The type pipeline, end to end (a diagram in prose)

Here is the whole journey of a single field — say `status` on a user — from where it is born to
where it is consumed, with no manual duplication at any hop:

```text
  zod schema                contract                 server                    client / UI
 ───────────              ───────────              ──────────                ───────────────

 UsersStatusSchemaV1  ──>  oc.route({ POST })  ──>  implement(contract)  ──>  derived RPC client
   z.enum([...])            .input(InputV1)          .handler(({input}) =>     await client.users
                            .output(ResponseV1)        ...)  // typed in        .list(args)
       │                         │                       │     and out             │
       │   defines the shape     │   binds verb + io      │  runs your logic        │  args + result
       ▼                         ▼                       ▼   over typed data        ▼   are TYPED from
   one definition          one boundary            one implementation         the SAME schema —
                                                                              no codegen, no drift
```

Read it left to right. The `status` field is declared once, in a zod schema. The contract
references that schema in its `.input()`/`.output()`. `implement()` produces a server object
whose handler sees `status` as a typed field on `input` and must return it correctly in the
output. The client — derived from the very same contract value — exposes `client.users.list(...)`
whose argument type and result type are both projected straight from those schemas. A UI island
that calls the client (optionally through `@orpc/tanstack-query`) inherits those types yet again.

Crucially, no arrow in that diagram is a *copy*. Each hop is a *projection* of the previous
one — TypeScript reading the contract's types, oRPC reading the contract's routes, zod reading
the contract's schemas. Because every consumer reads from the same value rather than from a
duplicated declaration, there is no place for the two to disagree. The contract is the only
thing anyone authored by hand; everything to its right is inferred.

Change `UsersStatusSchemaV1` and the ripple is immediate and compile-time: the handler that
returns the old shape stops compiling, every client call site that reads the removed field stops
compiling, and the OpenAPI document regenerates. **The type checker becomes your integration
test.** That is the entire payoff of contracts-first: integration bugs that other stacks discover
at runtime, NetScript discovers at build time, because there was never a second copy to fall out
of step.

{{ comp.apiTable({
  caption: "What flows through the pipeline — and what never needs hand-syncing",
  rows: [
    { name: "input / output shapes", type: "zod schema", desc: "Declared once. Validated at runtime by implement(), checked at compile time on both server and client." },
    { name: "route verb + path", type: "oc.route({ method, path })", desc: "Declared on the contract. Drives the OpenAPI document and the REST routes; never re-declared in the handler." },
    { name: "handler argument", type: "{ input }", desc: "Typed from the contract's .input() schema. The handler body operates on already-validated data." },
    { name: "handler return", type: "output type", desc: "Must satisfy the contract's .output() schema or it fails to compile. No hand-written serialization." },
    { name: "typed client", type: "derived from contract", desc: "Not generated, not written by hand. Argument and result types are projected from the same contract value." },
    { name: "OpenAPI document", type: "emitted by defineService", desc: "Produced from the contract — a published spec that cannot drift from the running server." }
  ]
}) }}

## Why this design, and what it costs

The trade-offs, because contracts-first is an opinion, not a free lunch:

- **You write the schema first.** For a trivial one-off endpoint, declaring a zod schema before
  writing the handler feels like ceremony. The payoff arrives the moment a *second* consumer exists
  (a client, a UI, another service) — which for a real backend is immediately.
- **Versioning is explicit, not automatic.** A breaking change to a shape is a new contract version
  (`versions/v2/`), not an in-place edit. This is deliberate friction: it forces you to decide
  whether callers can migrate, rather than breaking them silently.
- **The boundary is the contract, not the database.** At the early scaffold step the `users`
  handlers return seeded in-memory records — the contract is proven end to end *before* a database
  is wired. Persistence is a later concern that slots in behind an unchanged contract.
- **zod is the runtime price.** Validation runs on every request. That is a deliberate cost: it is
  also the thing that makes the published OpenAPI document and the compile-time types trustworthy,
  because the wire is checked against the same shape the types describe.

The oRPC family (`@orpc/contract`, `@orpc/server`, `@orpc/client`, `@orpc/zod`,
`@orpc/tanstack-query`) at `^1.14.6` is pinned in the workspace catalog. `zod`
(`jsr:@zod/zod@4.4.3`) is pinned per-package in each member's imports section, not in the
catalog. So the contract surface stays consistent across every workspace member.

## How contracts-first shows up across the framework

The contract is not just a service idea — it is the *unifying* idea. The same model that types a
service's RPC channel also types the plugin boundaries you compose into a NetScript app:

- **Services** are the canonical case on this page — a contract, an `implement()`-bound router, and
  a `defineService`/`createService` host. See [the services capability](/capabilities/services/).
- **Workers and sagas** expose their own oRPC services built from contracts, served via the fluent
  `createService(...).serve()` builder, so dispatching a job or driving a saga is a typed client
  call rather than a hand-rolled `fetch`. See [background jobs](/capabilities/background-jobs/) and
  [durable sagas](/capabilities/durable-sagas/).
- **Triggers** also serve a typed v1 oRPC contract — for trigger and event introspection plus
  management (fire, enable/disable, schedule preview, SSE event subscription) — like workers and
  sagas. Their exception is narrower: the *webhook ingress endpoint* itself
  (`POST /api/v1/webhooks/:triggerId`) stays a *raw*, signature-verifying route rather than an oRPC
  procedure, because it verifies an HMAC over the raw request bytes from external senders whose shapes
  you do not control. That asymmetry is itself instructive — contracts-first is for boundaries you
  *own*; an inbound webhook is a boundary someone else owns. See
  [the plugin model](/explanation/plugin-system/).

Holding those together: the contract is how NetScript makes the *internal* surfaces of a system
type-safe end to end, and the framework is explicit about where that model stops.

## Glossary

- **Contract** — a single typed value declaring a route's method, input shape, and output shape.
  The boundary between a server and its callers, and the single source of truth for that boundary.
  See the [glossary](/glossary/#contract).
- **oRPC** — the contract-and-RPC library NetScript builds the boundary on (`@orpc/*`). It supplies
  `oc.route(...)`, `implement(...)`, and the derived typed client. See the
  [glossary](/glossary/#orpc).
- **zod** — the schema library that describes and validates each shape. It is the runtime half of
  the contract; oRPC is the routing half. See the [glossary](/glossary/#zod).

## Where to go next

- **Do it:** the [Build a service tutorial](/tutorials/storefront/02-catalog-service/) walks the contract →
  service → typed client → island path with this exact `users` example.
- **Hub:** the [services capability](/capabilities/services/) covers `defineService` versus the
  fluent `createService(...).serve()` builder and the real ports.
- **Architecture:** [the architecture overview](/explanation/architecture/) places contracts in the
  larger picture, and [the plugin model](/explanation/plugin-system/) shows how plugins reuse the
  same contracts-first seam.
- **Reference:** the exact exported symbols live in [`reference/contracts/`](/reference/contracts/)
  and [`reference/service/`](/reference/service/).

{{ comp.nextPrev({ prev: { label: "Architecture", href: "/explanation/architecture/" }, next: { label: "The plugin system", href: "/explanation/plugin-system/" } }) }}
