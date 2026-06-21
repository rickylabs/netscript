---
layout: layouts/base.vto
title: Services & contracts
templateEngine: [vento, md]
prev: { label: "Capabilities", href: "/capabilities/" }
next: { label: "Background jobs", href: "/capabilities/background-jobs/" }
---

# Services & contracts

A NetScript **service** is a typed HTTP runtime that *implements* an
[`@orpc/contract`](/explanation/contracts/) definition. You author the contract once
(route + zod input/output), `implement()` it, bind `.handler()`s, and serve the resulting
router on a Hono + oRPC runtime. The contract object is the single source of truth: the
same object a typed client imports is the one the server implements, so caller and server
**cannot drift**. The example `users` service answers on port **3001** with both an
OpenAPI surface (`/api/v1/users/*`) and a typed oRPC endpoint (`/api/rpc/*`).

{{ comp callout { type: "tip", title: "Use this when" } }}
Reach for a service when you need a <strong>synchronous, request/response API</strong> with
a versioned, type-locked contract shared between front end and back end — a CRUD surface,
an internal RPC boundary, or a public REST/OpenAPI endpoint. For <em>fire-and-forget</em>
work use a <a href="/capabilities/background-jobs/">background job</a>; for
<em>message-driven, long-running</em> orchestration use a
<a href="/capabilities/durable-sagas/">durable saga</a>; for <em>inbound HTTP that kicks
off work</em> use a <a href="/capabilities/triggers/">trigger</a>; for
<em>signed-in identity and sessions</em> compose the
<a href="/capabilities/auth/">auth plugin</a>.
{{ /comp }}

## The contract is the source of truth

Before there is a service there is a contract. A contract is plain `@orpc/contract`
routes whose inputs and outputs are zod schemas, collected into an object and passed to
`implement()` from `@orpc/server`. `implement()` returns a `.handler()`-bindable object
the service router consumes. The example workspace versions its contracts under
`contracts/versions/v1/` and re-exports them as `@<project>/contracts` — so a contract
bump is an explicit, reviewable version directory, never an accidental break.

```ts
// contracts/versions/v1/users.contract.ts
import { z } from 'zod';
import { oc } from '@orpc/contract';
import { implement } from '@orpc/server';

export const UsersContractV1 = {
  health: oc.route({ method: 'GET' }).input(z.object({}).optional()).output(UsersHealthSchemaV1),
  list: oc.route({ method: 'POST' }).input(UsersListInputSchemaV1).output(UsersListResponseSchemaV1),
  updateStatus: oc.route({ method: 'POST' }).input(UsersUpdateStatusInputSchemaV1).output(UsersUpdateStatusResponseSchemaV1),
};

// `implement()` produces the .handler()-bindable object the service router consumes.
export const UsersV1 = implement(UsersContractV1);
```

The chain end-to-end — contract → `implement()` → `.handler()` → typed client → query →
island — is laid out in [Contracts](/explanation/contracts/). The key property: the
client imports the *same* contract object, so a renamed field or a changed output shape is
a **compile error in both the handler and the caller** before it can ship.

## Headline API: two ways to construct a service

NetScript ships **two** service-construction APIs, and the example project uses both.
Workspace services use the one-call `defineService(router, options)` — the right default
for the 80% case. Plugin API services (workers, sagas, auth) use the fluent
`createService(router, options).with*().serve()` builder when they need to add CORS,
OpenAPI, a database client, auth middleware, or custom context step by step. Both stand up
the same Hono + oRPC runtime; `defineService` is a curated preset over the same builder.

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

A `defineService` runtime exposes its OpenAPI routes, a typed oRPC endpoint mounted under
`/api/rpc/*`, and a health check. The example `users` service is reachable once
`aspire run` is up (Aspire provisions Postgres/Garnet first) or when you run it directly
with `deno task --cwd services/users dev`.

{{ comp.apiTable({
  caption: "Users service surface (port 3001)",
  rows: [
    { name: "/api/v1/users/*", type: "HTTP/OpenAPI", desc: "REST surface generated from the contract (list, updateStatus, health)." },
    { name: "/api/rpc/*", type: "oRPC", desc: "Typed RPC endpoint a generated client calls — same contract object, no drift. This is the served default path (not /rpc)." },
    { name: "/health", type: "HTTP", desc: "Liveness/readiness check; anonymous by default (excluded from authn)." },
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

## Service-layer authn / authz middleware

The service builder ships a **provider-agnostic** authentication and authorization seam in
`@netscript/service/auth`. It is a thin Hono-middleware layer over the request pipeline —
deliberately **distinct from the [auth plugin](/capabilities/auth/)**, which composes a
sign-in/session backend (kv-oauth, WorkOS, better-auth). Use this seam when a service needs
to gate its own routes — verify a credential, trust an upstream identity header, or check a
scope — without taking on an interactive identity provider.

Two middlewares wrap the request: `createAuthnMiddleware` resolves a `Principal`
(authentication), and `createAuthzMiddleware` makes an `AuthzDecision` from that principal
(authorization). By default the `/api` surface is protected and `/health` is anonymous.
Both are pluggable through small ports — `AuthenticatorPort`, `AuthorizerPort` — so you
supply the strategy and the seam stays the same.

{{ comp.apiTable({
  caption: "@netscript/service/auth surface",
  rows: [
    { name: "createAuthnMiddleware", type: "middleware", desc: "Authentication gate; resolves a Principal from the request via an AuthenticatorPort. Protects /api by default, leaves /health anonymous." },
    { name: "createAuthzMiddleware", type: "middleware", desc: "Authorization gate; turns a Principal into an AuthzDecision via an AuthorizerPort." },
    { name: "createStaticCredentialAuthenticator", type: "authenticator", desc: "Matches a configured static credential (e.g. API key / shared secret) → Principal." },
    { name: "createTrustedHeaderAuthenticator", type: "authenticator", desc: "Trusts an identity asserted by an upstream proxy header (e.g. behind a gateway)." },
    { name: "createScopeAuthorizer", type: "authorizer", desc: "Allows/denies a request by checking the Principal's scopes against required scopes." }
  ]
}) }}

{{ comp.tabbedCode({ tabs: [
  {
    label: "Fluent — withAuthn / withAuthz",
    lang: "ts",
    code: "// Gate a service with a static credential + scope check\nimport { createService } from '@netscript/service';\nimport {\n  createStaticCredentialAuthenticator,\n  createScopeAuthorizer,\n} from '@netscript/service/auth';\nimport { router } from './router.ts';\n\nconst authenticator = createStaticCredentialAuthenticator({\n  credentials: {\n    [Deno.env.get('SERVICE_API_KEY') ?? '']: {\n      subject: 'service:ci',\n      scopes: ['users:write'],\n    },\n  },\n});\nconst authorizer = createScopeAuthorizer({\n  rules: [{ match: () => true, requireScopes: ['users:write'] }],\n  denyByDefault: true,\n});\n\nawait createService(router, { name: 'users', version: '1.0.0', port: 3001 })\n  .withRPC()\n  .withAuthn({ authenticator })\n  .withAuthz({ authorizer })\n  .withHealth() // /health stays anonymous\n  .serve();"
  },
  {
    label: "Trusted-header (behind a gateway)",
    lang: "ts",
    code: "// Trust identity asserted by an upstream proxy/gateway\nimport { createTrustedHeaderAuthenticator } from '@netscript/service/auth';\n\n// The Principal is assembled internally from these header NAMES — point at the\n// headers your gateway sets; you do not map values yourself.\nconst authenticator = createTrustedHeaderAuthenticator({\n  subjectHeader: 'x-forwarded-user',\n  scopesHeader: 'x-forwarded-scopes', // optional; space/comma-separated\n});\n\n// then: .withAuthn({ authenticator })"
  }
] }) }}

{{ comp callout { type: "note", title: "Service-auth seam vs. the auth plugin" } }}
This middleware is for <strong>machine-to-machine and gateway-fronted</strong> gating: static
credentials, trusted upstream headers, scope checks. It does <em>not</em> do interactive
sign-in, OAuth callbacks, or session cookies. For <strong>signed-in human users</strong>
(sign-in / callback / session / me), compose the
<a href="/capabilities/auth/"><code>auth</code> plugin</a> backend instead — the two layers
are complementary and can run together.
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
    body: "The full generated API: defineService, createService, the fluent builder, the /auth middleware seam, and runtime options.",
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
