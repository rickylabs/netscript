---
layout: layouts/base.vto
title: Plugin system
templateEngine: [vento, md]
order: 3
---

# Plugin system

This page explains how a NetScript plugin works: the **core package** behind it, the typed
**manifest** of contributions it declares, the generated **registries** that wire it into a host,
and why its HTTP API and background work run as separate processes.

To add a plugin to a workspace, follow the
{{ comp.xref({ key: "howto:add-a-plugin", text: "add-a-plugin how-to" }) }}; to write one, see
{{ comp.xref({ key: "howto:author-a-plugin", text: "author-a-plugin" }) }}. The exact symbols are in
the {{ comp.xref({ key: "ref:plugin", text: "@netscript/plugin reference" }) }}.

{{ comp.diagram({ src: "/assets/diagrams/plugin-thread-isolation.svg", alt: "A single plugin splits into an HTTP API service resource and one or more isolated background-processor resources, each started by the AppHost as a separate Aspire resource with its own permissions.", caption: "One plugin, many resources: the API service and each background processor run as separate AppHost resources, so a crash or a load spike in one cannot take the others down." }) }}

## A plugin is a thin layer over a core package

A NetScript plugin is usually *two packages*. The logic lives in a **core** package; the plugin is
a thin integration layer that contributes that logic to a host.

{{ comp.apiTable({
  caption: "Public plugin packages and their sibling core packages",
  columns: ["Public plugin", "Sibling core package", "What lives in core"],
  rows: [
    ["<code>@netscript/plugin-workers</code>", "<code>@netscript/plugin-workers-core</code>", "Job/scheduler runtime, ports, contracts."],
    ["<code>@netscript/plugin-sagas</code>", "<code>@netscript/plugin-sagas-core</code>", "Saga DSL, durable runtime, durability tiers."],
    ["<code>@netscript/plugin-triggers</code>", "<code>@netscript/plugin-triggers-core</code>", "Trigger definition builders, ingress runtime."],
    ["<code>@netscript/plugin-streams</code>", "<code>@netscript/plugin-streams-core</code>", "Durable stream producer runtime."],
    ["<code>@netscript/plugin-auth</code>", "<code>@netscript/plugin-auth-core</code> (+ backends)", "<code>AuthBackendPort</code> seam, domain, contracts."]
  ]
}) }}

The split separates *behavior* from *integration*:

- The **core** package implements the capability: the authoring DSL (for example the saga and
  trigger definition builders), the runtime, the ports it depends on, the adapters, telemetry
  helpers, and the versioned contract types. Long-running behavior and state live here.
- The **plugin** package is the integration layer. Its `mod.ts` is small: it re-exports the
  userland surface from its core sibling, and adds the one thing the core cannot supply, a
  **manifest** that tells a host *what* the plugin contributes and *how* to wire it.

Because application authors reach core symbols *through* the public plugin, each plugin's reference
page lists its core package in an **Internals** subsection rather than as a separate top-level
entry.

{{ comp callout { type: "tip", title: "One import path, two responsibilities" } }}
The saga DSL (<code>defineSaga</code>, <code>defineQuery</code>, <code>defineSignal</code>) is
exported from <code>@netscript/plugin-sagas-core</code>, where the capability is authored.
<code>@netscript/plugin-sagas/runtime</code> exports the runtime infrastructure: the publisher, the
durable runtime, the saga stores, the runner, and the supervisor. The plugin's own
<code>mod.ts</code> re-exports only the manifest surface (<code>sagasPlugin</code>,
<code>inspectSagas</code>), which keeps the behavior/integration boundary intact in source.
{{ /comp }}

Streams follow the same split. Runtime producers use `defineStreamSchema` and `createDurableStream`
from `@netscript/plugin-streams-core`, and consumers read the stream over HTTP/SSE. The
`@netscript/plugin-streams` root carries the service manifest and typed topic definitions. See
{{ comp.xref({ key: "cap:streams", text: "durable streams" }) }} for the producer contract.

The two-tier shape also applies to custom plugins. When you scaffold a capability that NetScript
does not ship, using `netscript plugin new <name>`, the generator emits the same pair: a JSR-publishable
core engine package under `packages/plugin-<name>-core/` (its domain, ports, application
orchestration, `contracts/v1`, and testing doubles) and a thin connector under `plugins/<name>/`
(its manifest, adapter, Aspire contribution, CLI and scaffold entrypoints, and service), whose
`contracts` subpath re-exports the core's `contracts/v1`. A custom plugin starts with the same
behavior-versus-integration split, thin and independently publishable. See
{{ comp.xref({ key: "howto:author-a-plugin", text: "author-a-plugin" }) }} for the walkthrough.

## The manifest

A plugin describes itself with a typed **manifest**, built with `definePlugin()` from
{{ comp.xref({ key: "ref:plugin", text: "@netscript/plugin" }) }}. The manifest is a
*declaration*, not executable wiring: `definePlugin(name, version)` returns a builder, and each
chained `.with*()` call adds a **contribution** along an **extension axis**.

{{ comp.tabbedCode({
  tabs: [
    {
      label: "workers manifest",
      lang: "ts",
      code: "// plugins/workers/src/public/mod.ts (abridged)\nimport { definePlugin } from \"@netscript/plugin\";\n\n// definePlugin(name, version) returns a builder. No behavior runs here —\n// each .with*() call only NAMES a contribution against a fixed axis.\nexport const workersManifest = definePlugin(\"@netscript/plugin-workers\", \"" + releaseVersion + "\")\n  .withType(\"background-processor\")\n  .withService({ name: \"workers-api\", entrypoint: \"./services/src/main.ts\", port: 8091 /* note: your scaffold's port will differ */ })\n  .withBackgroundProcessor({ name: \"workers-combined\", entrypoint: \"./bin/combined.ts\", concurrency: 2 })\n  .withBackgroundProcessor({ name: \"workers-worker\", entrypoint: \"./bin/worker.ts\", concurrency: 2 })\n  .withBackgroundProcessor({ name: \"workers-scheduler\", entrypoint: \"./bin/scheduler.ts\" })\n  .withDbSchemas([{ path: \"./database/workers.prisma\", engine: \"postgres\" }])\n  .withContractVersions([{ version: \"v1\", loader: \"./contracts/v1/mod.ts\" }])\n  .withRuntimeConfigTopics([{ name: \"workers\", schemaPath: \"./runtime/workers.schema.json\" }])\n  .withAspire(\"./src/aspire/mod.ts\")\n  .build();"
    }
  ]
}) }}

The builder exposes a *fixed* set of contribution axes, and any number of plugins can contribute
against them. That asymmetry lets capabilities compose without the host growing new code for each
plugin. The most used axes:

{{ comp.apiTable({
  caption: "Builder methods, each declaring one kind of contribution",
  columns: ["Builder method", "Contributes", "Used for"],
  rows: [
    ["<code>.withService(…)</code>", "An HTTP service: name, entrypoint, port.", "The plugin's oRPC API resource."],
    ["<code>.withBackgroundProcessor(…)</code>", "A long-running processor: name, entrypoint, concurrency.", "Workers, runners, processors — runs apart from the API."],
    ["<code>.withDbSchemas(…)</code>", "A Prisma schema fragment + engine.", "Owned tables merged into the workspace schema."],
    ["<code>.withStreamTopics(…)</code>", "Typed stream topic definitions.", "Durable change-data channels."],
    ["<code>.withRuntimeConfigTopics(…)</code>", "A named, schema-validated config topic.", "Per-plugin runtime configuration."],
    ["<code>.withContractVersions(…)</code>", "A versioned contract loader.", "Forward/backward contract compatibility."],
    ["<code>.withTelemetry(…)</code>", "Telemetry registration.", "Spans, metrics, structured logs."],
    ["<code>.withAspire(…)</code>", "An Aspire contribution module path.", "How the AppHost materializes the plugin's resources."]
  ]
}) }}

A workers plugin contributes job definitions and processors; a sagas plugin contributes saga
definitions; a streams plugin contributes stream topics and a service; an auth plugin contributes
its oRPC service, contract versions, and a runtime-config topic. The host never needs a plugin's
internals, only these contribution shapes.

This is **registration over inheritance**: a plugin *registers* named contributions against open
extension axes instead of subclassing host internals. The host can validate each registration at
composition time, log it, and reject conflicts; duplicate plugin names, for example, fail with a
structured error that names both contributors.

## Generated registries

NetScript does **not** auto-discover plugins from `node_modules`, and the host does **not**
hand-import each plugin. Plugins live under `plugins/`, and a generated **registry** links
*declaring* a plugin to the *runtime* using it.

The codegen step emits static registry modules, TypeScript the runtime imports directly, so adding
a plugin is a *regeneration* step, not a code edit. Two properties of this loader matter:

- **Load order is deterministic.** Plugins must not depend on the order in which other plugins
  load; the framework asserts against order dependence.
- **Each load contributes named registrations** against one or more extension axes, and duplicate
  names across plugins are rejected with a structured error.

{{ comp callout { type: "important", title: "Compose, don't edit" } }}
A host <em>assembles</em> plugins; it never edits another boundary's code to accept one. Adding
workers, sagas, triggers, streams, or auth means shipping a manifest and regenerating the registry,
and the host's own source stays untouched. That keeps each capability independently versioned and
independently removable.
{{ /comp }}

The {{ comp.xref({ key: "howto:add-a-plugin", text: "add-a-plugin how-to" }) }} and the
{{ comp.xref({ key: "cli:reference", text: "CLI cheat sheet" }) }} cover the sequence:
`netscript plugin install …`, then the registry-generation step that makes the plugin visible to
the runtime.

## Process isolation

"One plugin" is a packaging unit, not a runtime unit. The AppHost materializes a plugin's **HTTP
API** and its **background work** as *distinct* Aspire resources, each with its own entrypoint and
permission set. The workers plugin's Aspire contribution registers the API as a Deno *service* and
each processor as a Deno *background* resource:

{{ comp.tabbedCode({
  tabs: [
    {
      label: "workers Aspire contribution",
      lang: "ts",
      code: "// plugins/workers/src/aspire/workers-contribution.ts (abridged)\n// The API is a service resource; each processor is a SEPARATE background resource.\nconst api = builder.addDenoService(\"workers-api\", {\n  entrypoint: \"plugins/workers/services/src/main.ts\",\n  port: ctx.port(\"workers-api\", 8091), // note: your scaffold's port will differ\n  permissions: WORKERS_SERVICE_PERMISSIONS, // narrow: serve HTTP\n});\n\nconst combined = builder.addDenoBackground(\"workers-combined\", {\n  entrypoint: \"plugins/workers/bin/combined.ts\",\n  permissions: WORKERS_BACKGROUND_PERMISSIONS, // wider: queues, db\n});\n// …plus workers-scheduler and workers-worker, each its own resource\nreturn [api, combined, scheduler, worker];"
    }
  ]
}) }}

Every scaffolded plugin ships its background entrypoints:

{{ comp.apiTable({
  caption: "Where each plugin's background work runs",
  columns: ["Plugin", "Background entrypoint", "AppHost resource"],
  rows: [
    ["workers", "<code>bin/combined.ts</code> (also <code>worker.ts</code>, <code>scheduler.ts</code>)", "Deno background, separate from <code>workers-api</code>."],
    ["sagas", "<code>src/runtime/saga-runner.ts</code>", "Deno background <code>saga-runner</code>."],
    ["triggers", "<code>src/runtime/trigger-processor.ts</code>", "Deno background <code>trigger-processor</code>."]
  ]
}) }}

The split is structural for three reasons:

- **Crash containment.** A processor that hits an unrecoverable error takes down only its own
  resource. The HTTP API keeps serving, and other processors keep running.
- **Independent scaling.** The API and the processors have different load profiles, request
  latency versus queue depth, so they are tuned and scaled separately: `WORKERS_CONCURRENCY` on the
  background resource never touches the API.
- **Least privilege.** The API gets a narrow permission set (serve HTTP); background resources get
  the wider set they need (queues, database, file watching).

See [orchestration with Aspire](/explanation/aspire/) for how the AppHost assembles these
resources from the manifest and the plugin's Aspire contribution.

## Guarding a plugin's API

`createPluginService` from `@netscript/plugin/service` requires an explicit `auth` posture and
installs the guard before any RPC, REST, or raw route; `/health` stays anonymous. This is the guarded
form `netscript plugin new billing` generates for a plugin other than the auth plugin:

```ts
export const billingService = createPluginService(billingRouter, {
  name: 'billing',
  auth: {
    authn: {
      authenticator: createAuthServiceAuthenticator({ serviceName: 'auth', timeoutMs: 10_000 }),
    },
    authz: {
      authorizer: createContractAuthorizer(
        mountPluginContract(billingContractDefinition, billingContractMount),
      ),
    },
  },
});
```

`createAuthServiceAuthenticator` (`@netscript/plugin-auth/authenticator`) verifies each bearer
session through the auth service, so `billing` embeds no backend, KV handle, or provider secret. A
public API records `auth: { public: true, reason: '…' }` instead. Background callers run under a
service identity, never an app session; see
[verifying sessions from another plugin](/identity-access/auth/#verify-sessions-from-another-plugins-service).

## Auth as the worked example

The **auth** plugin applies every idea on this page and stretches the core/plugin split across
*five* units:

- `@netscript/plugin-auth-core` defines the **port**, `AuthBackendPort`, and nothing
  provider-specific.
- Three **backend adapters** implement that port: `@netscript/auth-kv-oauth` (the only interactive
  backend, with a full OAuth/OIDC redirect flow), `@netscript/auth-workos`, and
  `@netscript/auth-better-auth` (both non-interactive).
- `@netscript/plugin-auth` is the **composing plugin**: it carries the manifest, runs the
  `auth-api` oRPC service on `:8094`, and selects exactly **one** active backend through
  `NETSCRIPT_AUTH_BACKEND` (default `kv-oauth`).

Behavior lives in the core and the adapters, the plugin only composes and declares, and the host
sees one service contribution whichever backend is active. When a backend cannot satisfy a
capability, such as an interactive sign-in on a non-interactive backend, the seam throws a typed
`AuthBackendOperationUnsupportedError`. The {{ comp.xref({ key: "explain:auth-model", text: "auth model" }) }}
walks the port and its adapters, and {{ comp.xref({ key: "explain:observability" }) }} covers the
auth audit surface.

## Design rationale

The shape keeps three concerns apart:

1. **Capability authors** work in a core package and think only about behavior, ports, and
   contracts, never about how a host discovers them.
2. **Plugin packages** stay small: they translate a capability into a manifest of contributions,
   the only thing a host has to understand.
3. **Hosts** depend on a stable, finite set of contribution shapes and a deterministic registry.

As a result, a host can add workers, sagas, triggers, streams, and auth in any combination, and each
plugin contributes its services, background processors, schemas, and topics through the same
vocabulary, each running as its own isolated resource.

Next: install one with [Add a plugin](/orchestration-runtime/how-to/add-a-plugin/).
