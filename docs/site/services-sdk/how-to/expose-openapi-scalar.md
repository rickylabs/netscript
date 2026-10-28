---
layout: layouts/base.vto
title: Expose OpenAPI & Scalar
description: Serve the generated OpenAPI document and the Scalar reference UI for a service.
templateEngine: [vento, md]
order: 103
oldUrl: /how-to/expose-openapi-scalar/
---

# Expose OpenAPI & Scalar

This recipe serves the generated OpenAPI document and the Scalar API reference UI for an existing
oRPC service, either with one `defineService` option or by mounting the Layer-1 primitives on a
Hono app.

## Prerequisites

- An oRPC service whose contract inputs and outputs are Zod schemas. See
  [Services & contracts](/services-sdk/services/) or [Add a service](/services-sdk/how-to/add-a-service/).
- `@netscript/service`, already a dependency of every generated service. It exposes
  `defineService`, the `createService` builder, and the `createOpenAPISpec`, `createScalarDocs` and
  `createScalarJs` primitives.
- Zod schemas on your routes. Spec generation reads them through the `ZodToJsonSchemaConverter`; a
  route without Zod input or output produces an empty schema for that operation.

{{ comp callout { type: "note", title: "Already on by default in the scaffold" } }}
Generated service entrypoints call <code>defineService(router, { openapi: { … } })</code>, so a
new service already serves the spec at <code>/api/openapi.json</code> and the Scalar UI at
<code>/api/docs</code>. Use this recipe for a service that lacks the surface, or to wire the
primitives into a custom Hono host.
{{ /comp }}

## 1. Turn it on with `defineService`

Pass an `openapi` block to the preset. That one option enables the generated OpenAPI JSON document,
the Scalar docs page, and the bundled Scalar JS:

```ts
// services/users/src/main.ts
import { defineService } from '@netscript/service';
import { router } from './router.ts';

await defineService(router, {
  auth: { public: true, reason: 'Public example service; add guards before exposing private data' },
  name: 'users',
  version: '1.0.0',
  port: parseInt(Deno.env.get('PORT') || '3001'), // note: your scaffold's port will differ
  openapi: {
    title: 'Users API',
    description: 'User management service',
  },
});
```

Aspire injects `PORT` at runtime. The typed source of truth is the `services.<name>.port` field in
`netscript.config.ts`, which the scaffold wires as the fallback default; set the port there rather
than editing this line.

The option adds three routes to the service:

{{ comp.apiTable({
  caption: "Routes added by the openapi option",
  rows: [
    { name: "/api/openapi.json", type: "GET → JSON", desc: "The machine-readable OpenAPI document, generated from your contract's zod schemas." },
    { name: "/api/docs", type: "GET → HTML", desc: "The Scalar interactive API reference UI; it fetches the spec above and renders try-it docs." },
    { name: "/api/docs/scalar.js", type: "GET → JS", desc: "The locally bundled Scalar runtime, so the docs UI works offline with no CDN dependency." }
  ]
}) }}

## 2. Check the endpoints

With the service running (`deno task --cwd services/users dev`, or `aspire start` for a
database-backed service), fetch the document and open the docs UI:

```sh
# from a shell — confirm both surfaces answer (replace <port> with your assigned port)
curl http://localhost:<port>/api/openapi.json   # raw OpenAPI document
open http://localhost:<port>/api/docs           # Scalar reference UI in a browser
```

The spec describes the REST surface under `/api/*`. The typed oRPC endpoint stays at `/api/rpc/*`.

## 3. Mount the primitives on a host app (optional)

For a custom path, a different theme, or a Hono app that is not a `defineService` runtime, use the
builder or the three Layer-1 primitives. `createOpenAPISpec` serves the spec JSON, `createScalarDocs`
serves the Scalar HTML, and `createScalarJs` serves the bundled runtime so the UI loads offline.

{{ comp.tabbedCode({ tabs: [
  {
    label: "Builder — createService().withDocs()",
    lang: "ts",
    code: "// services/users/src/main.ts — step-by-step, with a custom spec URL\nimport { createService } from '@netscript/service';\nimport { router } from './router.ts';\n\nawait createService(router, { name: 'users', version: '1.0.0', port: 3001 }) // note: your scaffold's port will differ\n  .withCors()\n  .withLogger()\n  .withOpenAPI({ title: 'Users API', description: 'User management service' })\n  .withDocs() // optional: .withDocs({ specUrl: '/api/openapi.json' })\n  .withRPC()\n  .withHealth()\n  .serve();"
  },
  {
    label: "Primitives — mount on any Hono app",
    lang: "ts",
    code: "// host/openapi-routes.ts — wire the primitives onto an existing Hono app\nimport {\n  createOpenAPISpec,\n  createScalarDocs,\n  createScalarJs,\n} from '@netscript/service';\nimport { router } from './router.ts';\n\n// 1. Serve the OpenAPI JSON document.\napp.get('/api/openapi.json', createOpenAPISpec(router, {\n  title: 'Users API',\n  version: '1.0.0',\n  description: 'User management service',\n  servers: [{ url: '/api', description: 'local' }],\n}));\n\n// 2. Serve the Scalar UI that loads that spec.\napp.get('/api/docs', createScalarDocs({\n  specUrl: '/api/openapi.json',\n  title: 'Users API',\n  theme: 'kepler',\n}));\n\n// 3. Serve the bundled Scalar runtime (offline, no CDN).\napp.get('/api/docs/scalar.js', createScalarJs());"
  }
] }) }}

## Option keys

The primitives in `@netscript/service` accept these options:

{{ comp.apiTable({
  caption: "OpenAPIConfig (createOpenAPISpec)",
  rows: [
    { name: "title", type: "string (required)", desc: "API title shown in the spec and the Scalar UI." },
    { name: "version", type: "string (required)", desc: "API version string, e.g. '1.0.0'." },
    { name: "description", type: "string?", desc: "Longer API description rendered in the docs." },
    { name: "servers", type: "Array<{ url; description? }>?", desc: "Server URLs advertised in the spec; defaults to a single entry { url: '/api' }." }
  ]
}) }}

{{ comp.apiTable({
  caption: "ScalarDocsOptions (createScalarDocs)",
  rows: [
    { name: "specUrl", type: "string (required)", desc: "URL the Scalar UI fetches the OpenAPI document from, e.g. '/api/openapi.json'." },
    { name: "title", type: "string?", desc: "Docs page title; defaults to 'API Documentation'." },
    { name: "theme", type: "'default' | 'kepler' | 'moon' | 'purple' | 'saturn'", desc: "Scalar UI theme; defaults to 'kepler'." }
  ]
}) }}

{{ comp callout { type: "note", title: "Spec quality comes from your contract" } }}
oRPC's <code>OpenAPIGenerator</code> builds the document from your router, and a
<code>ZodToJsonSchemaConverter</code> turns each route's Zod schemas into JSON Schema. Richer schemas
(<code>.describe()</code>, an explicit <code>.method()</code> on each contract route, named output
shapes) produce a more accurate reference.
{{ /comp }}

## Production pitfalls

> [!CAUTION]
> The docs and spec are public unless you gate them. With the service-auth seam installed,
> `.withAuthn()` protects `/api`, which includes `/api/openapi.json` and `/api/docs`. If your API
> surface must not be publicly enumerable, gate it or set `allowAnonymous` deliberately.

- **Mount all three routes.** `/api/docs/scalar.js` streams the bundled runtime from the package's
  `assets/`, so the UI works offline, and the `/api/docs` page depends on three routes. If you wire
  the primitives by hand, mount `createOpenAPISpec`, `createScalarDocs` and `createScalarJs`, or the
  page loads blank.
- **REST and RPC are separate surfaces.** The OpenAPI document describes the REST routes under
  `/api/*`. Point people and integrations at those, and keep generated typed clients on
  `/api/rpc/*`.
- **Routes without Zod schemas are under-documented.** A route with no Zod input or output yields an
  empty operation schema. Add schemas, and `.describe()`, for useful request and response docs.

## Next steps

Decide who may read the docs with the
[service-layer auth middleware](/services-sdk/services/#service-layer-authn-authz-middleware). See
also [Discover services](/services-sdk/how-to/discover-services/) and the
[`@netscript/service` reference](/reference/service/).

{{ comp.nextPrev({ prev: { label: "Discover services", href: "/services-sdk/how-to/discover-services/" }, next: { label: "Use a second database", href: "/data-persistence/how-to/use-a-second-database/" } }) }}
