---
layout: layouts/base.vto
title: Expose OpenAPI & Scalar
templateEngine: [vento, md]
prev: { label: "Discover services", href: "/how-to/discover-services/" }
next: { label: "Use a second database", href: "/how-to/use-a-second-database/" }
---

# Expose OpenAPI & Scalar

Turn on the generated **OpenAPI** document and the interactive **Scalar** API
reference UI for an existing oRPC service — as a one-line `defineService` option
or by mounting the Layer-1 primitives onto any Hono app yourself.

## Prerequisites

{{ comp.apiTable({
  caption: "What you need before you start",
  rows: [
    { name: "An oRPC service", type: "router", desc: "An existing service with an oRPC router whose contract inputs/outputs are zod schemas. See the Services hub or the Build-a-service tutorial." },
    { name: "@netscript/service", type: "package", desc: "Already a dependency of every generated service. Exposes defineService, the createService builder, and the createOpenAPISpec / createScalarDocs / createScalarJs primitives." },
    { name: "zod schemas", type: "contract", desc: "Spec generation reads your contract's zod schemas via the ZodToJsonSchemaConverter; routes without zod input/output produce an empty schema for that operation." }
  ]
}) }}

{{ comp callout { type: "note", title: "Already on by default in the scaffold" } }}
Generated service entrypoints call <code>defineService(router, { openapi: { … } })</code>,
so a freshly scaffolded service <strong>already</strong> serves the spec at
<code>/api/openapi.json</code> and the Scalar UI at <code>/api/docs</code>. This recipe is
for adding the surface to a service that does not have it yet, or for hand-wiring the
primitives into a custom Hono host.
{{ /comp }}

## Steps

### 1. Turn it on with `defineService` (the one-line path)

Pass an `openapi` block to the preset. That single option enables the generated
OpenAPI JSON spec, the Scalar docs page, and the bundled Scalar JS — no extra
imports.

```ts
// services/users/src/main.ts
import { defineService } from '@netscript/service';
import { router } from './router.ts';

await defineService(router, {
  name: 'users',
  version: '1.0.0',
  port: parseInt(Deno.env.get('PORT') || '3001'),
  openapi: {
    title: 'Users API',
    description: 'User management service',
  },
});
```

Aspire injects `PORT` at runtime, so the entrypoint reads it from the environment; the typed source
of truth is your `netscript.config.ts` `services.<name>.port` field, which the scaffold wires as the
fallback default — set the port there rather than editing this line.

This wires three routes onto the service:

{{ comp.apiTable({
  caption: "Routes added by the openapi option",
  rows: [
    { name: "/api/openapi.json", type: "GET → JSON", desc: "The machine-readable OpenAPI document, generated from your contract's zod schemas." },
    { name: "/api/docs", type: "GET → HTML", desc: "The Scalar interactive API reference UI; it fetches the spec above and renders try-it docs." },
    { name: "/api/docs/scalar.js", type: "GET → JS", desc: "The locally bundled Scalar runtime, so the docs UI works offline with no CDN dependency." }
  ]
}) }}

### 2. Hit the endpoints

With the service running (directly via `deno task --cwd services/users dev`, or
under `aspire start` for DB-backed services), open the docs UI and fetch the raw
spec:

```sh
# from a shell — confirm both surfaces answer
curl http://localhost:3001/api/openapi.json   # raw OpenAPI document
open http://localhost:3001/api/docs           # Scalar reference UI in a browser
```

The REST surface generated from the same contract is served under `/api/*`, and
the typed oRPC endpoint stays at `/api/rpc/*` — the spec describes the former.

### 3. (Optional) Hand-wire the primitives onto a host app

When you need finer control — a custom path, a different theme, or mounting onto
an existing Hono app that is not a `defineService` runtime — drop down to the
three Layer-1 primitives. `createOpenAPISpec` serves the spec JSON,
`createScalarDocs` serves the Scalar HTML, and `createScalarJs` serves the
bundled runtime so the UI loads offline.

{{ comp.tabbedCode({ tabs: [
  {
    label: "Preset — defineService({ openapi })",
    lang: "ts",
    code: "// services/users/src/main.ts\nimport { defineService } from '@netscript/service';\nimport { router } from './router.ts';\n\n// One option turns on the spec, the Scalar UI, and the bundled JS.\nawait defineService(router, {\n  name: 'users',\n  version: '1.0.0',\n  port: 3001,\n  openapi: {\n    title: 'Users API',\n    description: 'User management service',\n  },\n});"
  },
  {
    label: "Builder — createService().withDocs()",
    lang: "ts",
    code: "// services/users/src/main.ts — step-by-step, with a custom spec URL\nimport { createService } from '@netscript/service';\nimport { router } from './router.ts';\n\nawait createService(router, { name: 'users', version: '1.0.0', port: 3001 })\n  .withCors()\n  .withLogger()\n  .withOpenAPI({ title: 'Users API', description: 'User management service' })\n  .withDocs() // optional: .withDocs({ specUrl: '/api/openapi.json' })\n  .withRPC()\n  .withHealth()\n  .serve();"
  },
  {
    label: "Primitives — mount on any Hono app",
    lang: "ts",
    code: "// host/openapi-routes.ts — wire the primitives onto an existing Hono app\nimport {\n  createOpenAPISpec,\n  createScalarDocs,\n  createScalarJs,\n} from '@netscript/service';\nimport { router } from './router.ts';\n\n// 1. Serve the OpenAPI JSON document.\napp.get('/api/openapi.json', createOpenAPISpec(router, {\n  title: 'Users API',\n  version: '1.0.0',\n  description: 'User management service',\n  servers: [{ url: '/api', description: 'local' }],\n}));\n\n// 2. Serve the Scalar UI that loads that spec.\napp.get('/api/docs', createScalarDocs({\n  specUrl: '/api/openapi.json',\n  title: 'Users API',\n  theme: 'kepler',\n}));\n\n// 3. Serve the bundled Scalar runtime (offline, no CDN).\napp.get('/api/docs/scalar.js', createScalarJs());"
  }
] }) }}

## Option keys

The primitives accept these confirmed option shapes (`@netscript/service`):

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
The OpenAPI document is generated by oRPC's <code>OpenAPIGenerator</code> from your
router, with a <code>ZodToJsonSchemaConverter</code> turning each route's zod schemas
into JSON Schema. Richer schemas — <code>.describe()</code>, explicit
<code>.method()</code> on each contract route, named output shapes — produce a richer,
more accurate reference. The spec is only as good as the contract behind it.
{{ /comp }}

## In-production pitfalls

{{ comp callout { type: "warning", title: "Before you ship the docs UI" } }}
<ul>
<li><strong>The Scalar JS is served from your origin, not a CDN.</strong>
<code>/api/docs/scalar.js</code> streams the bundled runtime from the package's
<code>assets/</code>. That keeps the UI working offline, but it also means the
<code>/api/docs</code> page is <em>three</em> routes — if you hand-wire the primitives,
mount all three (<code>createOpenAPISpec</code>, <code>createScalarDocs</code>,
<code>createScalarJs</code>) or the page loads blank.</li>
<li><strong>The docs and spec are public by default.</strong> With the service-auth
seam installed, <code>.withAuthn()</code> protects <code>/api</code> — which includes
<code>/api/openapi.json</code> and <code>/api/docs</code>. If you do <em>not</em> want
your API surface publicly enumerable, gate it or set
<code>allowAnonymous</code> deliberately; do not assume the docs are hidden.</li>
<li><strong>The REST surface is <code>/api/*</code>; the typed RPC endpoint is
<code>/api/rpc/*</code>.</strong> The OpenAPI document describes the REST routes —
point human/integration consumers at those, and keep generated typed clients on the
RPC path.</li>
<li><strong>Routes without zod schemas under-document.</strong> A contract route with
no zod input/output yields an empty operation schema in the spec. Add schemas (and
<code>.describe()</code>) to get useful request/response docs.</li>
</ul>
{{ /comp }}

## See also

{{ comp.xref({ key: "cap:services" }) }}

{{ comp.featureGrid({ items: [
  {
    title: "Understand — Services & contracts",
    body: "The capability hub: how defineService, the fluent builder, and the OpenAPI/Scalar primitives fit together.",
    href: "/capabilities/services/",
    icon: "◎"
  },
  {
    title: "Do — Discover services",
    body: "Recipe: enumerate the services in a workspace and the endpoints each one exposes.",
    href: "/how-to/discover-services/",
    icon: "◆"
  },
  {
    title: "Do — Graceful shutdown",
    body: "Recipe: drain in-flight requests and run teardown hooks before the service process exits.",
    href: "/how-to/graceful-shutdown/",
    icon: "◆"
  },
  {
    title: "Look up — @netscript/service",
    body: "The full generated API: the OpenAPI/Scalar primitives, the builder, and every option key.",
    href: "/reference/service/",
    icon: "≡"
  }
] }) }}

{{ comp.nextPrev({ prev: { label: "Discover services", href: "/how-to/discover-services/" }, next: { label: "Use a second database", href: "/how-to/use-a-second-database/" } }) }}
