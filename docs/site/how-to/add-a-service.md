---
layout: layouts/base.vto
title: Add a service
templateEngine: [vento, md]
prev: { label: "Add a plugin", href: "/how-to/add-a-plugin/" }
next: { label: "Database & migration", href: "/how-to/database-migration/" }
---

# Add a service

**Goal:** add a new typed oRPC service to an existing NetScript workspace — define
its contract, implement the handlers, serve it with `defineService`, and confirm it
answers on its own port over both its OpenAPI surface and the `/api/rpc/*` RPC endpoint
that typed clients call.

This is a task-oriented recipe. It assumes you already have a NetScript workspace
(created with `netscript init`) and that the `netscript` command is on your path. If
you want the guided, build-up-from-scratch version that explains *why* each piece
exists — contract to typed client to a Fresh island — follow the
[Build a service tutorial](/tutorials/storefront/02-catalog-service/) instead. For the full generated
API of the service runtime, see the [`@netscript/service` reference](/reference/service/);
for the concept behind contract-first wiring, read
[Contracts, explained](/explanation/contracts/).

A NetScript service is contract-first: a service is the runtime that *implements* an
`@orpc/contract` definition. You author the contract once (route + zod input/output),
`implement()` it, bind `.handler()`s, then hand the resulting router to
`defineService(...)`. The same contract object is what a typed client imports, so the
service and its callers cannot drift.

{{ comp callout { type: "note", title: "Two ways to construct a service" } }}
Workspace services use <code>defineService(router, options)</code> — one call, an options
object, the right default for the 80% case. NetScript <strong>plugin</strong> API services
(workers, sagas, triggers, auth) instead use the fluent
<code>createService(router, options).withCors().withDatabase(db).withRPC().serve({ port })</code>
builder when they need to layer CORS, OpenAPI, a database client, authn/authz, or custom
context step by step. Both stand up the same Hono + oRPC runtime and advertise the identical
<code>/api/rpc/*</code> endpoint; this recipe uses <code>defineService</code>.
{{ /comp }}

## Before you start

{{ comp.apiTable({
  caption: "Prerequisites",
  rows: [
    { name: "A NetScript workspace", type: "netscript init", desc: "An existing project on disk. If you do not have one, scaffold it first — see the tutorials. Run commands from the workspace root." },
    { name: "The netscript CLI", type: "on your PATH", desc: "Install globally with: deno install --global --allow-all --name netscript jsr:@netscript/cli" + releaseSpecifier + " — then confirm with netscript --help." },
    { name: "A contracts workspace", type: "contracts/", desc: "The init scaffold ships a shared contracts/ workspace exposed as the @<project>/contracts import alias. New services add their contract here so clients can import it." },
    { name: "A free port", type: ":3001 by default", desc: "The example users service listens on :3001. Pick an unused port per service; it is read from the PORT env var with a literal fallback. Plugin API ports are already claimed (workers :8091, sagas :8092, triggers :8093, auth :8094)." }
  ]
}) }}

This recipe adds a service named `users` on port `3001`, mirroring the example the
scaffold ships, so every path and code shape below matches a real generated workspace.
Substitute your own name and port where you see them.

## Step 1 — Scaffold the service (or add one at init time)

The fastest path is to let the CLI scaffold a service workspace for you. If you are
creating a brand-new project, pass the service flags straight to `netscript init`:

```bash
netscript init my-app --db postgres --service --service-name users --service-port 3001 --yes
```

`--db postgres` is the recommended default; swap it for `mysql`, `mssql`, or `sqlite` to scaffold a different Prisma-backed engine (`sqlite` is file-backed and runs without an Aspire container).

To add a service to a workspace that already exists, use the `netscript service add`
subcommand with the `--name` and `--port` flags (the `service` group also has `list` and
`generate` subcommands; `service generate` only regenerates Aspire helper files):

```bash
# from the workspace root
netscript service add --name users --port 3001
```

Either path lays down a `services/users/` workspace member with this shape:

```text
services/users/
├── deno.json              # workspace member; exports ./src/main.ts
└── src/
    ├── main.ts            # defineService(router, { name, version, port, openapi })
    ├── router.ts          # version-namespaced router aggregation
    └── routers/
        ├── v1.ts          # binds the contract: v1.users.list.handler(...)
        └── health.ts      # health.check handler
```

{{ comp callout { type: "tip", title: "Naming and the import alias" } }}
The service name (<code>users</code>) becomes the workspace folder under <code>services/</code> and the
service's reported <code>name</code>. Its contract lives in the shared <code>contracts/</code> workspace and is
imported through the <code>@&lt;project&gt;/contracts</code> alias (for the example project that is
<code>@my-app/contracts</code>) — never via a relative <code>../../contracts</code> path.
{{ /comp }}

## Step 2 — Define the contract

A service implements a contract; define it first. `service add` creates the initial versioned
contract and aggregate. Add each procedure through the CLI so it updates the existing contract
without hand-editing the aggregate:

```bash
netscript contract add-route users findByEmail \
  --method POST \
  --path /users/by-email \
  --input "z.object({ email: z.string().email() })" \
  --output "UsersListItemSchemaV1.optional()"

netscript contract inspect users
netscript contract inspect users --json
```

The command appends an `@orpc/contract` + Zod route to
`contracts/versions/v1/users.contract.ts`. The generated module calls `implement()` so the result
is ready for `.handler()` binding. The equivalent source shape is shown below so you know what to
customize:

```ts
// contracts/versions/v1/users.contract.ts
import { z } from 'zod';
import { oc } from '@orpc/contract';
import { implement } from '@orpc/server';

export const UsersListItemSchemaV1 = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  summary: z.string().min(1),
  status: z.enum(['active', 'suspended']),
  createdAt: z.string().datetime(),
});

export const UsersContractV1 = {
  health: {
    check: oc.route({ method: 'GET' })
      .input(z.object({}).optional())
      .output(z.object({ status: z.literal('healthy'), service: z.string() })),
  },
  list: oc.route({ method: 'POST' })
    .input(z.object({ limit: z.number().int().positive().optional() }))
    .output(z.object({ items: z.array(UsersListItemSchemaV1) })),
};

// implement() turns the contract object into a .handler()-bindable surface.
export const UsersV1 = implement(UsersContractV1);
```

The CLI maintains this aggregate so callers and the service share one type source:

```ts
// contracts/versions/v1/mod.ts
export { UsersContractV1, UsersV1 } from './users.contract.ts';
export const v1 = { users: UsersV1 };
```

{{ comp callout { type: "important", title: "Contract is the source of truth" } }}
Each route is <code>oc.route({ method }).input(zod).output(zod)</code>. Calling
<code>implement(UsersContractV1)</code> produces the object whose <code>.handler()</code> the service
binds — and the very same contract is what a typed client imports. Change the schema in one
place and both the service handler and every caller fail to type-check until they agree.
{{ /comp }}

For a breaking schema change, promote the contract instead of editing v1 in place. This creates
the v2 aggregate and updates the root contract exports:

```bash
netscript contract version add users --from v1 --to v2
netscript contract list
```

## Step 3 — Implement the handlers

Create the binding stub with the paired service verb, then replace its intentional
`Not implemented` error with your business logic:

```bash
netscript service add-handler users findByEmail
```

The command verifies that `findByEmail` exists in the users contract, then appends a compiling
`.handler()` binding to `services/users/src/routers/v1.ts`. Import the contract through the project
alias, not a relative path. At this scaffold stage handlers can return seeded in-memory records —
no database is wired yet, which keeps the contract↔client proof isolated.

```ts
// services/users/src/routers/v1.ts
import { v1 } from '@my-app/contracts';

const seeded = [
  { id: 1, name: 'Ada Lovelace', summary: 'first programmer', status: 'active' as const, createdAt: new Date().toISOString() },
];

export const UsersV1 = {
  list: v1.users.list.handler(async ({ input }) => ({
    items: seeded.slice(0, input.limit ?? seeded.length),
  })),
};
```

```ts
// services/users/src/routers/health.ts
import { v1 } from '@my-app/contracts';

export const health = {
  check: v1.users.health.check.handler(async () => ({
    status: 'healthy' as const,
    service: 'users',
  })),
};
```

Aggregate the handlers into a version-namespaced router:

```ts
// services/users/src/router.ts
import { UsersV1 } from './routers/v1.ts';
import { health } from './routers/health.ts';

export const v1 = { users: { ...UsersV1, health } };
export const router = { v1 };
```

## Step 4 — Serve it with `defineService`

`netscript service add` already creates this entry point and registers it in appsettings and the
Deno workspace; `netscript service generate` can regenerate Aspire helpers after later config
edits. The service entry point passes the router to `defineService(...)`. The port reads from
the `PORT` env var with a literal fallback so the same code runs locally and under Aspire.

```ts
// services/users/src/main.ts
import { defineService } from '@netscript/service';
import { router } from './router.ts';

await defineService(router, {
  name: 'users',
  version: '1.0.0',
  port: parseInt(Deno.env.get('PORT') || '3001'),
  openapi: { title: 'Users API', description: 'users service' },
  debug: true,
});
```

Aspire injects `PORT` at runtime, so the entrypoint reads it from the environment; the typed source
of truth is your `netscript.config.ts` `services.<name>.port` field, which the scaffold wires as the
fallback default — set the port there rather than editing this line.

`defineService` stands up the Hono + oRPC runtime, mounting your router under both an
OpenAPI surface (`/api/v1/users/*`) and the RPC surface (`/api/rpc/v1/...`). The default
RPC mount point is `/api/rpc` and the OpenAPI mount point is `/api`; both are overridable
via the builder's `rpcPath` / `apiPath` options if you reach for `createService`.

To reverse this lifecycle, `netscript service remove users` removes the service workspace,
appsettings/workspace registrations, paired contracts, and regenerated helpers. Pass
`--keep-contract` when the API definition must remain published after the runtime is retired.

{{ comp callout { type: "note", title: "Need CORS, a database, or auth? Use createService" } }}
When a service must layer cross-cutting concerns, swap <code>defineService</code> for the fluent
builder. Each step returns the builder, so you compose only what you need before
<code>.serve({ port })</code>:
<pre><code>const app = createService(router, { name: 'users', version: '1.0.0' })
  .withCors()
  .withDatabase(db)
  .withAuthn({ authenticator })
  .withAuthz({ authorizer })
  .withRPC();
await app.serve({ port: 3001 });</code></pre>
The authn/authz seam (<code>@netscript/service/auth</code>) is provider-agnostic — static-credential
and trusted-header authenticators plus a scope authorizer ship built in. It is distinct from
the auth <strong>plugin</strong> backends; see <a href="/capabilities/auth/">Authentication</a>.
{{ /comp }}

## Step 5 — Run and verify

Start just this service workspace directly, or let `aspire start` orchestrate it alongside
the rest of your resources:

```bash
# run only the users service
deno task --cwd services/users dev
```

You should see it bind on `:3001`. Confirm the runtime answers — the health route over
HTTP, and the RPC surface that typed clients call:

```bash
# OpenAPI / HTTP surface
curl http://localhost:3001/api/v1/users/health

# RPC surface (what the generated typed client uses)
curl -X POST http://localhost:3001/api/rpc/v1/users/list \
  -H 'content-type: application/json' -d '{"limit":10}'
```

A healthy service returns `{"status":"healthy","service":"users"}` from the health route
and the seeded `items` array from `list`. A typed client imports `UsersContractV1` from
`@my-app/contracts` and calls `.list(...)` with full input/output inference — no codegen,
no drift.

{{ comp callout { type: "warning", title: "Production pitfalls" } }}
<strong>Port collisions.</strong> Every service needs a distinct port; the workers
(<code>:8091</code>), sagas (<code>:8092</code>), triggers (<code>:8093</code>), and auth
(<code>:8094</code>) plugins already claim theirs. Read the port from <code>PORT</code> and let
Aspire assign it in orchestrated runs rather than hard-coding.<br>
<strong>RPC lives under <code>/api/rpc/*</code>.</strong> The typed-client surface is
<code>/api/rpc/&lt;version&gt;/&lt;router&gt;/&lt;procedure&gt;</code>, not a bare <code>/rpc</code>.
The REST/OpenAPI surface is <code>/api/*</code>. Point clients and smoke tests at the right one.<br>
<strong>Contracts before handlers.</strong> Edit the contract first, then the handler — never
the reverse. The contract is the shared truth; a handler that out-runs its contract silently
breaks every client.<br>
<strong>Use the import alias.</strong> Import contracts via <code>@&lt;project&gt;/contracts</code>,
not a relative path, so the service and its clients resolve the identical type.<br>
<strong>No DB yet at this step.</strong> The scaffold handlers return seeded in-memory records.
Wire persistence with the database recipe before you depend on durability.
{{ /comp }}

## See also

{{ comp.featureGrid({ items: [
  { title: "Tutorial: Build a service", body: "The guided, learning-oriented version — contract to typed client to a Fresh island, explained step by step.", href: "/tutorials/storefront/02-catalog-service/", icon: "→" },
  { title: "Service API reference", body: "The full generated surface of defineService and createService — every option, builder method, and return type.", href: "/reference/service/", icon: "◆" },
  { title: "Contracts, explained", body: "How an oRPC contract flows from service to typed client to UI without a codegen step.", href: "/explanation/contracts/", icon: "◎" },
  { title: "Database & migration", body: "Replace the seeded in-memory records with real Prisma-backed persistence — Postgres is the recommended engine, or mysql / mssql / sqlite via --db — init, generate, seed (Aspire up first).", href: "/how-to/database-migration/", icon: "▣" }
] }) }}

Manage the service over its lifetime by editing its contract under `contracts/versions/`
and re-running your workspace gates (`deno task check`). For the concepts behind
contract-first services, read the [contracts explanation](/explanation/contracts/); for
the capability overview, see [Services](/capabilities/services/).
