---
layout: layouts/base.vto
title: Build a service
templateEngine: [vento, md]
prev: { label: "1 · Your first workspace", href: "/tutorials/first-workspace/" }
next: { label: "3 · Add background jobs", href: "/tutorials/background-jobs/" }
---

# Tutorial 2 · Build a service

This is the second rung of the ladder. In [Tutorial 1](/tutorials/first-workspace/) you scaffolded a
workspace and watched it boot under Aspire. Now you will add a real, typed procedure to the `users`
service: define an [oRPC contract](/explanation/contracts/) with Zod input/output schemas, implement
it as a handler, serve it on port **3001**, and call it over the `/rpc` endpoint with full type
safety from contract to client.

By the end you will understand NetScript's central idea — **the contract is the single source of
truth**. The schema you write once locks the types for both the server handler and any client, so a
mismatch is a compile error, not a 3am pager alert.

{{ comp.learningPath({ steps: [
  { label: "1 · First workspace", href: "/tutorials/first-workspace/" },
  { label: "2 · Build a service", href: "/tutorials/build-a-service/" },
  { label: "3 · Background jobs", href: "/tutorials/background-jobs/" },
  { label: "4 · Durable workflow", href: "/tutorials/durable-workflow/" },
  { label: "5 · Ingest a webhook", href: "/tutorials/ingest-webhook/" }
] }) }}

## What you will build

You will extend the scaffolded `users` service with a `list` procedure that returns seeded user
records. The flow is the same one every NetScript service follows:

```
contracts/versions/v1/users.contract.ts   →  implement()  →  services/users/src/routers/v1.ts
  oc.route().input(zod).output(zod)            (typed bind)     v1.users.list.handler(...)
                                                                        │
                                                                        ▼
                                              services/users/src/main.ts  →  defineService(router, {...})
                                                                        │
                                                                        ▼
                                              http://localhost:3001/rpc  (typed oRPC surface)
```

{{ comp callout { type: "note", title: "No database yet" } }}
The handler in this tutorial returns <strong>seeded, in-memory records</strong> — there is no Postgres query here. That is intentional: this rung proves the <em>contract ↔ client</em> type seam in isolation. You wire real persistence later, in <a href="/how-to/database-migration/">Database &amp; migration</a> and the <a href="/capabilities/database/">database capability</a>.
{{ /comp }}

## Before you begin

You should already have completed [Tutorial 1](/tutorials/first-workspace/), which means:

- A `my-app/` workspace on disk with `services/users/` and `contracts/` directories.
- `aspire run` running in a terminal (from the `aspire/` folder) so the dashboard at
  [http://localhost:18888](http://localhost:18888) is live. You do not strictly need the database
  for this rung, but keeping Aspire up matches the real dev loop.
- The CLI installed:
  `deno install --global --allow-all --name netscript jsr:@netscript/cli/bin/netscript.ts`.

Confirm the service is reachable before you change anything — in a second terminal:

```sh
curl http://localhost:3001/health
```

A healthy JSON response means the scaffolded `users` service is up on port **3001** and ready to
extend.

## Step 1 — Define the contract

Contracts are the typed seam between your service and every client. They live in `contracts/`,
versioned under `versions/v1/`, and are built from [`@orpc/contract`](/explanation/contracts/) routes
plus [Zod](https://zod.dev) schemas. Open `contracts/versions/v1/users.contract.ts` — the scaffold
already defines schemas and a `list` route. Read it top to bottom:

```ts
// contracts/versions/v1/users.contract.ts
import { z } from 'zod';
import { oc } from '@orpc/contract';
import { implement } from '@orpc/server';

// 1. Describe your data with Zod. These schemas are the contract's shape.
export const UsersStatusSchemaV1 = z.enum(['active', 'invited', 'suspended']);

export const UsersListItemSchemaV1 = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  summary: z.string().min(1),
  status: UsersStatusSchemaV1,
  createdAt: z.string().datetime(),
});

export const UsersListInputSchemaV1 = z.object({
  status: UsersStatusSchemaV1.optional(),
  limit: z.number().int().positive().max(100).default(20),
});

export const UsersListResponseSchemaV1 = z.object({
  items: z.array(UsersListItemSchemaV1),
  total: z.number().int().nonnegative(),
});

// 2. Declare routes: method + typed input + typed output. No implementation yet.
export const UsersContractV1 = {
  list: oc
    .route({ method: 'POST' })
    .input(UsersListInputSchemaV1)
    .output(UsersListResponseSchemaV1),
};

// 3. implement() turns the contract into a `.handler()`-bindable object.
export const UsersV1 = implement(UsersContractV1);
```

The three numbered moves are the whole pattern:

1. **Schemas first.** Zod objects describe input and output. They double as runtime validation and
   as the TypeScript types that flow everywhere else.
2. **Routes declare intent, not behavior.** `oc.route({ method }).input(...).output(...)` says *what*
   the procedure accepts and returns — there is no handler body in the contract.
3. **`implement(UsersContractV1)`** produces `UsersV1`, an object whose `.list.handler(...)` is now
   strongly typed to the schemas above. Pass it the wrong shape and the build fails.

{{ comp callout { type: "tip", title: "Why a separate contracts/ workspace?" } }}
Because both your service <em>and</em> your Fresh app import from the same <code>@my-app/contracts</code> alias, there is exactly one definition of a "user". Change a field here and every consumer re-type-checks against it — see <a href="/explanation/contracts/">Contracts &amp; type flow</a>.
{{ /comp }}

## Step 2 — Implement the handler

A contract describes the shape; a handler supplies the behavior. Handlers live under
`services/users/src/routers/`. Open `services/users/src/routers/v1.ts` and bind a handler to the
`list` route. Notice the import: handlers pull the implemented contract from the
`@my-app/contracts` workspace alias (named after your project), **not** by reaching into the
`contracts/` folder by relative path.

```ts
// services/users/src/routers/v1.ts
import { v1 } from '@my-app/contracts';

// Seeded, in-memory records — no DB call yet (that comes in a later tutorial).
const seeded = [
  { id: 1, name: 'Ada Lovelace', summary: 'First programmer', status: 'active', createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 2, name: 'Alan Turing', summary: 'Computability', status: 'invited', createdAt: '2026-01-02T00:00:00.000Z' },
  { id: 3, name: 'Grace Hopper', summary: 'Compiler pioneer', status: 'suspended', createdAt: '2026-01-03T00:00:00.000Z' },
] as const;

export const UsersV1 = {
  list: v1.users.list.handler(async ({ input }) => {
    const filtered = input.status
      ? seeded.filter((u) => u.status === input.status)
      : seeded;
    const items = filtered.slice(0, input.limit);
    return { items, total: filtered.length };
  }),
};
```

What is type-locked here, for free:

- `input` is already parsed and typed as `{ status?: 'active' | 'invited' | 'suspended'; limit: number }`.
  You never re-validate it — `implement()` did that.
- The returned object must satisfy `UsersListResponseSchemaV1`. Drop a field, mistype `total`, or
  forget `items`, and `deno task check` rejects it.

Now aggregate the handler into the service router. The router namespaces handlers by version so the
service can host `v1`, `v2`, and so on side by side:

```ts
// services/users/src/router.ts
import { UsersV1 } from './routers/v1.ts';
import { health } from './routers/health.ts';

export const v1 = { users: { ...UsersV1, health } };
export const router = { v1 };
```

## Step 3 — Serve it with `defineService`

The service entry point is `services/users/src/main.ts`. NetScript gives you **two ways** to stand a
service up, and the scaffold uses the simpler one. Here is the scaffolded `defineService` form:

{{ comp.tabbedCode({ tabs: [
  {
    label: "main.ts — defineService (one-shot)",
    lang: "ts",
    code: "import { defineService } from '@netscript/service';\nimport { router } from './router.ts';\n\n// One call wires CORS, request logging, OpenAPI, RPC, and health endpoints.\nawait defineService(router, {\n  name: 'users',\n  version: '1.0.0',\n  port: parseInt(Deno.env.get('PORT') || '3001'),\n  openapi: { title: 'Users API', description: 'users service' },\n  debug: true,\n});"
  },
  {
    label: "main.ts — createService().serve() (fluent)",
    lang: "ts",
    code: "import { createService } from '@netscript/service';\nimport { router } from './router.ts';\n\n// Same result, but each cross-cutting concern is opt-in and ordered explicitly.\nawait createService(router, {\n  name: 'users',\n  version: '1.0.0',\n  port: parseInt(Deno.env.get('PORT') || '3001'),\n})\n  .withCors()\n  .withLogger()\n  .withOpenAPI({ title: 'Users API', description: 'users service' })\n  .withRPC({ traceContext: true })\n  .withHealth()\n  .serve();"
  }
] }) }}

### Which form should I use?

{{ comp.apiTable({ title: "Choosing a service builder", columns: ["API", "Shape", "Use it when"], rows: [
  ["defineService(router, { … })", "One call, one options object — CORS, logging, OpenAPI, RPC, and health are wired by sensible defaults.", "Most application services. It is what the scaffold generates and what you will use 90% of the time."],
  ["createService(router, { … }).with*().serve()", "A fluent builder where each concern (`withCors`, `withLogger`, `withOpenAPI`, `withDatabase`, `withContext`, `withRPC`, `withHealth`, `onStartup`) is added explicitly, then `.serve()` boots it.", "You need to inject a database client, add custom request context, control middleware order, or run startup hooks — exactly what NetScript's own plugin API services (workers :8091, sagas :8092) do."]
] }) }}

{{ comp callout { type: "important", title: "Two construction APIs, on purpose" } }}
Local application services use <code>defineService(...)</code>; the framework's <em>plugin</em> API services use the fluent <code>createService(...).serve()</code> builder. Both produce an oRPC service — pick <code>defineService</code> unless you need the extra wiring hooks the builder exposes. See <a href="/capabilities/services/">the services capability</a> for the full comparison.
{{ /comp }}

Either form binds the same router and exposes the same surface on port **3001**:

{{ comp.apiTable({ title: "users service endpoints (port 3001)", columns: ["Path", "Method", "Purpose"], rows: [
  ["/rpc", "POST", "The typed oRPC surface. Your typed client calls procedures (`v1.users.list`) here with end-to-end type safety."],
  ["/api/v1/users/list", "POST", "The OpenAPI/REST projection of the same procedure, for tools and `curl`."],
  ["/health", "GET", "Liveness probe — the plain JSON health check you hit in Tutorial 1."]
] }) }}

## Step 4 — Run the service

If you let `aspire run` orchestrate everything, the `users` service is already live on `:3001`. To
run just this service in its own terminal — handy while iterating — start it directly from the
project root:

```sh
deno task --cwd services/users dev
```

The service reads `PORT` from the environment (defaulting to `3001`) and prints its bound address on
startup. Leave it running for the verify step.

## Step 5 — Verify

This is the proof that the contract, handler, and service all line up. From a second terminal, call
the `list` procedure over the OpenAPI projection with `curl`:

```sh
curl -X POST http://localhost:3001/api/v1/users/list \
  -H 'content-type: application/json' \
  -d '{ "limit": 2 }'
```

You should see two seeded records and a total, shaped exactly like `UsersListResponseSchemaV1`:

```json
{
  "items": [
    { "id": 1, "name": "Ada Lovelace", "summary": "First programmer", "status": "active", "createdAt": "2026-01-01T00:00:00.000Z" },
    { "id": 2, "name": "Alan Turing", "summary": "Computability", "status": "invited", "createdAt": "2026-01-02T00:00:00.000Z" }
  ],
  "total": 3
}
```

Send the `status` filter and the same handler narrows the result:

```sh
curl -X POST http://localhost:3001/api/v1/users/list \
  -H 'content-type: application/json' \
  -d '{ "status": "active" }'
```

Finally, confirm the whole workspace still type-checks end to end — contract, handler, and router
together — from the project root:

```sh
deno task check
```

A clean check is the real verification: it proves the handler's return value satisfies the
contract's output schema and that the typed `/rpc` surface is internally consistent.

{{ comp callout { type: "tip", title: "Calling /rpc from a typed client" } }}
The <code>/rpc</code> endpoint is what an <code>@orpc/client</code> consumer (your Fresh island, a CLI, another service) talks to — it gets the same Zod-derived types you wrote in the contract, with no codegen step. The <code>/api/v1/users/list</code> REST path you curl'd above is the OpenAPI projection of that same procedure. See <a href="/explanation/contracts/">Contracts &amp; type flow</a> for the client side.
{{ /comp }}

## What you built

- A versioned **oRPC contract** (`@orpc/contract` + Zod) with typed `input`/`output` schemas.
- A handler bound with **`implement(Contract)` → `.handler(...)`** that returns seeded in-memory
  records, fully type-locked to the contract.
- A running service via **`defineService(router, { … })`** on port **3001**, and you saw the
  alternative fluent **`createService(...).serve()`** builder and when to reach for it.
- A verified `/rpc` typed surface plus its `/api/v1/users/*` OpenAPI projection, confirmed with
  `curl` and `deno task check`.

You now own the contract-first loop that every NetScript service follows.

## Where to go next

- **Continue the ladder** → [Tutorial 3 · Add background jobs](/tutorials/background-jobs/) — give
  this service real work to offload: author a worker job and trigger it on `:8091`.
- **Look it up** → the [service reference](/reference/service/) for every `defineService` /
  `createService` option, and the [contracts reference](/reference/contracts/) for the full
  `@orpc/contract` surface. This tutorial intentionally does not duplicate the generated API.
- **Go deeper on the idea** → [Contracts & type flow](/explanation/contracts/) traces a contract all
  the way to a typed Fresh island.
