---
layout: layouts/base.vto
title: Contracts & type flow
templateEngine: [vento, md]
order: 2
---

# Contracts & type flow

This page explains how one versioned contract types the service handler, the client, the OpenAPI
document, and the UI island, so the public boundary between a server and its callers is defined
once. For exact signatures, see [`reference/contracts/`](/reference/contracts/) and
[`reference/service/`](/reference/service/); for the headline API, see the
[services capability](/capabilities/services/).

## One boundary definition

Most backend stacks keep *two* definitions of the boundary between a server and its callers: the
server's runtime validation, and a separately maintained client such as a generated SDK, a
hand-written `fetch` wrapper, an OpenAPI document, or a GraphQL schema. The two drift. You change the
server, forget the client, and the mismatch surfaces at runtime, in production, instead of as a type
error at your desk.

NetScript removes the second definition. A **contract** is one TypeScript value that declares a
route's method, its input shape, and its output shape. The server *implements* that value and the
client is *derived* from it, so there is no generated client model to reconcile with the server.
The contract is the public boundary, not documentation about it.

{{ comp callout { type: "important", title: "One definition, enforced three ways" } }}
The same contract value is consumed by <strong>zod</strong> (runtime input and output validation),
by the <strong>TypeScript</strong> type checker (compile-time shape checks on both sides), and by
the OpenAPI generator (the published spec). Change the contract and all three change with it.
{{ /comp }}

## Where the public shape begins

A contract schema has one of two origins:

| Origin | When | How |
| --- | --- | --- |
| DB-backed | Generated schemas exist. This is the normal path. | Run `netscript db generate`, import `<Model>Schema` (and, when needed, `<Model>CreateInput` or `<Model>UpdateInput`) from `@database/zod`, then use `.pick()`, `.omit()`, and `.extend()` to define the versioned public shape. |
| DB-less | In-memory scaffold stages, external APIs, computed shapes, and products without a persistence model. | Author the Zod schema in the versioned contract module. |

In the DB-backed path, the generator stays authoritative for column types and nullability; the
contract decides what may cross the boundary and which public rules are stricter. When the
persistence model changes, you rerun `netscript db generate` and the contract narrows or extends
the new generated shape. The
[database generation step](/data-persistence/database/#generated-schemas-feed-public-contracts)
is an optional predecessor, not a competing public API. From the versioned contract onward, both
paths are identical: the handler, the OpenAPI document, the SDK query factory, and the page all
project from the same contract value.

### DB-backed derivation

Suppose the generated `ProductSchema` includes `internalCost` and `deletedAt`, and
`WarehouseSchema` includes `internalRegionCode`. Those fields are private to persistence, so the
contract selects its public fields explicitly. It also builds the relation shape explicitly: the
generated barrel provides model schemas and CRUD inputs, not a nested, relation-aware response.

```ts
import { z } from 'zod';
import {
  ProductCreateInput,
  ProductSchema,
  ProductUpdateInput,
  WarehouseSchema,
} from '@database/zod';

export const ProductApiSchemaV1 = ProductSchema.pick({
  id: true,
  name: true,
  warehouseId: true,
}).extend({
  warehouse: WarehouseSchema.pick({ id: true, name: true }),
});

export const ProductCreateApiSchemaV1 = ProductCreateInput.pick({
  name: true,
  warehouseId: true,
});

export const ProductUpdateApiSchemaV1 = ProductUpdateInput.pick({
  name: true,
  warehouseId: true,
});

export const ProductResponseSchemaV1 = z.object({
  item: ProductApiSchemaV1,
});
```

`internalCost`, `deletedAt`, and `internalRegionCode` cannot cross this boundary because none is
selected. The relation contains only the warehouse's public `id` and `name`. The versioned API can
evolve that composed shape on its own while keeping the generated column types and nullability.

## Anatomy of a contract

A contract is built from [`@orpc/contract`](https://orpc.unnoq.com) and [`zod`](https://zod.dev).
Zod describes the data and validates values; oRPC declares the route, the verb, what goes in, and
what comes out. `oc.route({ method })` declares the transport verb, and `.input(...)` and
`.output(...)` attach the zod schemas for the request and response.

The result is an inert *definition*: it owns no handler, opens no socket, and does no runtime work.
Because a contract has no side effects, the server, the client, a test, or a tool can import it
without pulling in runtime behavior.

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

The contract lives under `contracts/versions/v1/` and is exported through the workspace's
`@<project>/contracts` alias; for the scaffolded `users` example, that is `@my-app/contracts`. The
version directory (`versions/v1/`, later `v2/`) is deliberate: a contract is a long-lived promise,
so a breaking change is an explicit new version rather than an in-place edit that breaks callers.

## Binding handlers with `implement()`

`implement()` (from `@orpc/server`) connects the *definition* to the *runtime*. Given a contract,
it returns an object whose routes each expose a `.handler(...)` method. The handler you pass in is
type-locked to the contract: its argument is the contract's `input` type, and its return value must
satisfy the contract's `output` type. Returning the wrong shape does not compile.

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
The handler never parses the request body, validates input, serializes the response, or declares a
route string; the contract already specifies all of that. <code>implement()</code> wraps your
function in zod validation, so the handler body is business logic over typed, validated data.
{{ /comp }}

The router tree mirrors the contract tree. Because the contract is a plain nested object,
`{ v1: { users: { list, updateStatus, health } } }`, the handlers nest the same way, and the
derived client walks the same path (`client.users.list(...)`). There is no routing table to
register and no string key that can fall out of sync with the handler it names.

## Serving the router

A local service hands the router to `defineService(...)`, which wires CORS, request logging,
OpenAPI, RPC, and health endpoints in one call and binds a port. The contract's shapes become both
the service's validation and its published OpenAPI document.

{{ comp.tabbedCode({ tabs: [
  {
    label: "services/users/src/main.ts",
    lang: "ts",
    code: "import { defineService } from '@netscript/service';\nimport { router } from './router.ts';\n\nawait defineService(router, {\n  auth: { public: true, reason: 'Public example service; add guards before exposing private data' },\n  name: 'users',\n  version: '1.0.0',\n  port: parseInt(Deno.env.get('PORT') || '3001'), // note: your scaffold's port will differ\n  openapi: { title: 'Users API', description: 'users service' },\n  debug: true,\n});\n// Serves /api/v1/users/* (OpenAPI) and /api/rpc/v1/... (typed RPC) on its assigned port."
  }
] }) }}

Aspire injects `PORT` at runtime, so the entrypoint reads it from the environment. The typed source
of truth is the `services.<name>.port` field in `netscript.config.ts`, which the scaffold wires as
the fallback default; set the port there rather than editing this line.

The `users` service exposes two transports from the same contract: REST-shaped routes under
`/api/v1/users/*`, driven by `oc.route({ method, path })` and published in OpenAPI, and a typed RPC
channel under `/api/rpc/v1/...` that the derived client speaks. Only the wire format differs. The
RPC mount point is `/api/rpc/*`, not `/rpc`, and the derived client targets that base, so you
rarely type the path yourself.

{{ comp callout { type: "tip", title: "Two service-construction APIs in one project" } }}
Local services in <code>services/</code> use the one-shot <code>defineService(router, options)</code>
form above. The <strong>plugin</strong> API services (workers, sagas, triggers, auth) use a fluent
builder instead: <code>createService(router, options).withCors().withLogger().withOpenAPI(...).withDocs().withRPC(...).withHealth().serve()</code>.
The contracts-first model is the same; the builder exposes each cross-cutting concern as an explicit
step. Use <code>defineService</code> when the defaults fit, and the builder when you need to add,
remove, or reorder a concern.
{{ /comp }}

## The type pipeline

The diagram follows one field, `status` on a user, from its versioned public schema to every place
it is consumed:

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
                                                                              no second boundary copy
```

The `status` field is declared once in the versioned public Zod schema. The contract references
that schema in `.input()` and `.output()`. `implement()` produces a server object whose handler sees
`status` as a typed field on `input` and must return it correctly. The client, derived from the same
contract value, exposes `client.users.list(...)` with argument and result types projected from those
schemas. A UI island that calls the client, optionally through `@orpc/tanstack-query`, inherits the
same types.

No arrow to the right of the versioned schema is a *copy*. Each hop is a *projection*: TypeScript
reads the contract's types, oRPC reads its routes, Zod reads its schemas. Every public consumer
reads the same value, so no two of them can disagree.

Change `UsersStatusSchemaV1` and the effect is immediate and compile-time: the handler that returns
the old shape stops compiling, every client call site that reads a removed field stops compiling,
and the OpenAPI document regenerates. The type checker does the work of an integration test, so
mismatches that other stacks find at runtime surface at build time.

{{ comp.apiTable({
  caption: "What flows through the pipeline",
  rows: [
    { name: "input / output shapes", type: "versioned Zod schema", desc: "Narrowed or extended from generated models when they exist; otherwise authored directly. Validated by implement() and checked on server and client." },
    { name: "route verb + path", type: "oc.route({ method, path })", desc: "Declared on the contract. Drives the OpenAPI document and the REST routes; never re-declared in the handler." },
    { name: "handler argument", type: "{ input }", desc: "Typed from the contract's .input() schema. The handler body operates on validated data." },
    { name: "handler return", type: "output type", desc: "Must satisfy the contract's .output() schema or it fails to compile. No hand-written serialization." },
    { name: "typed client", type: "derived from contract", desc: "Neither generated nor hand-written. Argument and result types are projected from the same contract value." },
    { name: "OpenAPI document", type: "emitted by defineService", desc: "Produced from the contract, so the published spec cannot drift from the running server." }
  ]
}) }}

## Trade-offs

- **You establish the public schema first.** For a one-off endpoint, that feels like ceremony. It
  pays off as soon as a *second* consumer exists (a client, a UI, another service), which for a real
  backend is immediately.
- **Versioning is explicit.** A breaking change is a new contract version (`versions/v2/`), not an
  in-place edit. The friction is deliberate: you decide whether callers can migrate instead of
  breaking them silently.
- **The database is a predecessor, not the boundary.** At the early scaffold step the `users`
  handlers return seeded in-memory records, so the contract works end to end before a database is
  wired. When generated model schemas exist, contracts derive from them to keep column types and
  nullability aligned, and still narrow private fields; exposing a generated model unchanged is a
  deliberate choice.
- **Zod is the runtime price.** Validation runs on every request. That cost is what makes the
  published OpenAPI document and the compile-time types trustworthy: the wire is checked against the
  shape the types describe.

## Contracts across the framework

The model that types a service's RPC channel also types the plugin boundaries you compose into an
app:

- **Services** are the case this page covers: a contract, an `implement()`-bound router, and a
  `defineService` or `createService` host.
- **Workers and sagas** expose oRPC services built from contracts and served with the fluent
  `createService(...).serve()` builder, so dispatching a job or driving a saga is a typed client
  call. See [background jobs](/capabilities/background-jobs/) and
  [durable sagas](/capabilities/durable-sagas/).
- **Triggers** serve a typed v1 oRPC contract for trigger and event introspection and management
  (fire, enable/disable, schedule preview, SSE event subscription). The exception is the
  *webhook ingress endpoint* (`POST /api/v1/webhooks/:triggerId`), which stays a raw route because
  it verifies an HMAC over the raw request bytes from senders whose shapes you do not control.

That exception marks where the model stops: contracts are for boundaries you *own*, and an inbound
webhook is a boundary someone else owns.

Next: build a contract-first service in the [Build a service tutorial](/tutorials/storefront/02-catalog-service/).
