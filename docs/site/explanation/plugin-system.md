---
layout: layouts/base.vto
title: The plugin system
templateEngine: [vento, md]
prev: { label: "Contracts & type flow", href: "/explanation/contracts/" }
next: { label: "Auth model", href: "/explanation/auth-model/" }
order: 3
---

# The plugin system

This essay explains the mental model behind a NetScript plugin: how a plugin relates to its
sibling **core package**, what it *contributes* to a host through a typed **manifest**, how the
host *discovers* it through **generated registries** rather than hand-imports, and why a single
plugin's HTTP API and its background work run as **separate processes**. Read it to understand
the shape before you extend it.

If you only want to *add* a plugin to a workspace, follow the
{{ comp.xref({ key: "howto:add-a-plugin", text: "add-a-plugin how-to" }) }}; to *author* a new
one, see {{ comp.xref({ key: "howto:author-a-plugin", text: "author-a-plugin" }) }}. For the exact
symbols a plugin author calls, use the {{ comp.xref({ key: "ref:plugin", text: "@netscript/plugin reference" }) }}.
The {{ comp.xref({ key: "explain:auth-model", text: "auth model" }) }} is the richest worked
example of every idea here.

{{ comp.diagram({ src: "/assets/diagrams/plugin-thread-isolation.svg", alt: "A single plugin splits into an HTTP API service resource and one or more isolated background-processor resources, each started by the AppHost as a separate Aspire resource with its own permissions.", caption: "One plugin, many resources: the API service and each background processor run as separate AppHost resources, so a crash or a load spike in one cannot take the others down." }) }}

{{ comp callout { type: "note", title: "Three nouns carry the whole model" } }}
A plugin declares a <strong>manifest</strong>; the manifest names a set of
<strong>contributions</strong> against a fixed set of extension axes; a generated
<strong>registry</strong> turns those declarations into static modules the host imports. Hold
those three nouns and the rest of this page is detail.
{{ /comp }}

## A plugin is a thin layer over a core package

The single most important thing to understand is that a NetScript plugin is usually *two
packages, not one*. The real logic lives in a **core** package; the plugin is a thin
integration layer that contributes that logic to a host.

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

The split follows the architecture doctrine's separation of *behavior* from *integration*:

- The **core** package implements the capability itself — the authoring DSL (for example the
  saga and trigger definition builders), the runtime, the ports it depends on, the adapters,
  telemetry helpers, and the versioned contract types. This is where the long-running behavior
  and state live.
- The **plugin** package is a thin integration layer (the doctrine's *Plugin Package*
  archetype). Its `mod.ts` is small. It re-exports the userland surface from its core sibling
  rather than redefining it, and it adds the one thing the core cannot supply on its own: a
  **manifest** that tells a host *what* this plugin contributes and *how* to wire it up.

Because of this split, core packages appear as an **Internals** subsection on each plugin's
reference page rather than as separate top-level entries. Application authors normally reach
core symbols *through* the public plugin, so the public plugin is the surface users consume.

{{ comp callout { type: "tip", title: "One import path, two responsibilities" } }}
The saga DSL (<code>defineSaga</code>, <code>defineQuery</code>, <code>defineSignal</code>) is
exported from <code>@netscript/plugin-sagas-core</code>, where the capability is authored.
<code>@netscript/plugin-sagas/runtime</code> exports the runtime infrastructure instead — the
publisher, the durable runtime, the saga stores, the runner, and the supervisor. The plugin
package itself stays thin: its <code>mod.ts</code> re-exports only the manifest surface
(<code>sagasPlugin</code>, <code>inspectSagas</code>) so the behavior/integration boundary stays
intact in source.
{{ /comp }}

This is also why some plugin surfaces are deliberately thin or even fail loud. In
`@netscript/plugin-streams`, the manifest-side helpers redirect you to the real producer runtime
in `@netscript/plugin-streams-core` (`createDurableStream`) by surfacing a
`StreamUnsupportedOperationError` rather than quietly doing nothing. The *behavior* lives in core;
the *plugin* only carries the manifest. The boundary is a feature, not an oversight — see
{{ comp.xref({ key: "cap:streams", text: "durable streams" }) }} for the producer-versus-manifest
framing.
<!-- caveat: arch-debt:streams-manifest-helpers-unsupported -->

This two-tier shape is not reserved for the official plugins. When you scaffold a custom plugin with
`netscript plugin new <name>`, the generator emits the same pair: a JSR-publishable core engine
package under `packages/plugin-<name>-core/` (its domain, ports, application orchestration,
`contracts/v1`, and testing doubles) and a thin connector under `plugins/<name>/` (its manifest,
adapter, Aspire contribution, CLI/scaffold entrypoints, and service) whose `contracts` subpath simply
re-exports the core's `contracts/v1`. So custom plugins inherit the same behavior-versus-integration
split — thin, composable, and independently publishable — from the moment they are generated. See
{{ comp.xref({ key: "howto:author-a-plugin", text: "author-a-plugin" }) }} for the walkthrough.

## What a plugin contributes: the manifest

A plugin describes itself with a typed **manifest**, assembled through the `definePlugin()`
builder in {{ comp.xref({ key: "ref:plugin", text: "@netscript/plugin" }) }}. The manifest is a
*declaration*, not executable wiring: `definePlugin(name, version)` returns a builder, and each
chained `.with*()` call adds a **contribution** along a well-defined **extension axis**.

{{ comp.tabbedCode({
  tabs: [
    {
      label: "workers manifest",
      lang: "ts",
      code: "// plugins/workers/src/public/mod.ts (abridged)\nimport { definePlugin } from \"@netscript/plugin\";\n\n// definePlugin(name, version) returns a builder. No behavior runs here —\n// each .with*() call only NAMES a contribution against a fixed axis.\nexport const workersManifest = definePlugin(\"@netscript/plugin-workers\", \"" + releaseVersion + "\")\n  .withType(\"background-processor\")\n  .withService({ name: \"workers-api\", entrypoint: \"./services/src/main.ts\", port: 8091 })\n  .withBackgroundProcessor({ name: \"workers-combined\", entrypoint: \"./bin/combined.ts\", concurrency: 2 })\n  .withBackgroundProcessor({ name: \"workers-worker\", entrypoint: \"./bin/worker.ts\", concurrency: 2 })\n  .withBackgroundProcessor({ name: \"workers-scheduler\", entrypoint: \"./bin/scheduler.ts\" })\n  .withDbSchemas([{ path: \"./database/workers.prisma\", engine: \"postgres\" }])\n  .withContractVersions([{ version: \"v1\", loader: \"./contracts/v1/mod.ts\" }])\n  .withRuntimeConfigTopics([{ name: \"workers\", schemaPath: \"./runtime/workers.schema.json\" }])\n  .withAspire(\"./src/aspire/mod.ts\")\n  .build();"
    }
  ]
}) }}

The builder exposes a *fixed* set of contribution axes — the vocabulary every host understands.
The most load-bearing ones:

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

Contributions are the vocabulary the host understands. A workers plugin contributes worker job
definitions and processors; a sagas plugin contributes saga definitions; a streams plugin
contributes stream topics and a service; an auth plugin contributes its oRPC service, contract
versions, and a runtime-config topic. The host never needs to know the *internals* of any plugin
— it only needs to understand these contribution shapes.

This is the doctrine's principle of **registration over inheritance** for cross-package
extension: a plugin *registers* named contributions against open extension axes instead of
subclassing host internals. Registration scales because the host can validate a registration at
composition time, log it, and reject conflicts — for example, duplicate plugin names are rejected
with a structured error that references both contributors.

{{ comp callout { type: "note", title: "Contributions are a closed set; plugins are an open set" } }}
The host understands a <strong>fixed</strong> list of contribution shapes, but any number of
plugins may contribute against them. That asymmetry is what lets capabilities compose without the
host growing new code for each plugin.
{{ /comp }}

## How the host discovers plugins: generated registries

NetScript does **not** auto-discover plugins from `node_modules`, and the host does **not**
hand-import each plugin. Plugins live under `plugins/` and are discovered through the file system,
but the link between *declaring* a plugin and the *runtime* using it is a generated **registry**.

Rather than scanning the file system at runtime, the scaffold/codegen step emits static registry
modules — TypeScript that the runtime imports directly — so that adding a plugin is a
*regeneration* step, not a code edit. Two properties of this loader matter for the model:

- **Load order is deterministic.** Plugins must not depend on the order in which other plugins
  load; the doctrine forbids order-dependence and asserts against it.
- **Each load contributes named registrations** against one or more extension axes, and duplicate
  names across plugins are rejected with a structured error.

{{ comp callout { type: "important", title: "Compose, don't edit" } }}
A host <em>assembles</em> plugins; it never edits another boundary's code to accept one. Adding
workers, sagas, triggers, streams, or auth means shipping a manifest and regenerating the
registry — the host's own source is untouched. This is the discipline that keeps capabilities
independently versioned and independently removable.
{{ /comp }}

The practical sequence — `netscript plugin install …` followed by the registry-generation step — is
covered in the {{ comp.xref({ key: "howto:add-a-plugin", text: "add-a-plugin how-to" }) }} and the
{{ comp.xref({ key: "cli:reference", text: "CLI reference" }) }}. Regenerating the registry is
what makes a freshly added plugin visible to the runtime.

## Why background work runs as separate processes

A single plugin almost never runs as one process. Its **HTTP API** and its **background work** are
materialized by the AppHost as *distinct* Aspire resources, each with its own entrypoint and its
own permission set. The workers plugin is the clearest example: its Aspire contribution registers
the API as a Deno *service* and each processor as a Deno *background* resource:

{{ comp.tabbedCode({
  tabs: [
    {
      label: "workers Aspire contribution",
      lang: "ts",
      code: "// plugins/workers/src/aspire/workers-contribution.ts (abridged)\n// The API is a service resource; each processor is a SEPARATE background resource.\nconst api = builder.addDenoService(\"workers-api\", {\n  entrypoint: \"plugins/workers/services/src/main.ts\",\n  port: ctx.port(\"workers-api\", 8091),\n  permissions: WORKERS_SERVICE_PERMISSIONS, // narrow: serve HTTP\n});\n\nconst combined = builder.addDenoBackground(\"workers-combined\", {\n  entrypoint: \"plugins/workers/bin/combined.ts\",\n  permissions: WORKERS_BACKGROUND_PERMISSIONS, // wider: queues, db\n});\n// …plus workers-scheduler and workers-worker, each its own resource\nreturn [api, combined, scheduler, worker];"
    }
  ]
}) }}

The background entrypoints are real files in every scaffolded plugin, and each capability picks the
shape it needs:

{{ comp.apiTable({
  caption: "Where each plugin's background work runs",
  columns: ["Plugin", "Background entrypoint", "AppHost resource"],
  rows: [
    ["workers", "<code>bin/combined.ts</code> (also <code>worker.ts</code>, <code>scheduler.ts</code>)", "Deno background, separate from <code>workers-api</code>."],
    ["sagas", "<code>src/runtime/saga-runner.ts</code>", "Deno background <code>saga-runner</code>."],
    ["triggers", "<code>src/runtime/trigger-processor.ts</code>", "Deno background <code>trigger-processor</code>."]
  ]
}) }}

The reason this is structural rather than incidental is three-fold:

1. **Crash containment.** A processor that hits an unrecoverable error takes down only its own
   resource. The HTTP API keeps serving; other processors keep running.
2. **Independent scaling.** The API and the processors have different load profiles — request
   latency versus queue depth — so they are tuned and scaled independently
   (`WORKER_CONCURRENCY` on the background resource never touches the API).
3. **Least privilege.** The API gets a narrow permission set (serve HTTP); background resources
   get the wider set they need (queues, database, file watching). Splitting the processes lets
   each one run with only the permissions its job requires.

{{ comp callout { type: "tip", title: "The key insight" } }}
"One plugin" is a packaging unit, not a runtime unit. At runtime a plugin fans out into one API
service and N background resources — that fan-out is exactly what the AppHost reads from the
manifest and the plugin's Aspire contribution. See
<a href="/explanation/aspire/">orchestration with Aspire</a> for how the AppHost assembles them.
{{ /comp }}

## Auth: the model at its richest

The **auth** plugin is the clearest single exemplar of every idea on this page, because it
stretches the core/plugin split across *five* units instead of two:

- `@netscript/plugin-auth-core` defines the **port** — `AuthBackendPort` — and nothing
  provider-specific. It is the seam.
- Three pure **backend adapters** implement that port for different identity providers:
  `@netscript/auth-kv-oauth` (the only interactive backend — full OAuth/OIDC redirect flow),
  `@netscript/auth-workos`, and `@netscript/auth-better-auth` (both non-interactive).
- `@netscript/plugin-auth` is the **composing plugin**: it carries the manifest, runs the
  `auth-api` oRPC service on `:8094`, and selects exactly **one** active backend via
  `NETSCRIPT_AUTH_BACKEND` (default `kv-oauth`).

That is the whole model written large: behavior lives in core and adapters, the plugin only
composes and declares, and the host sees one service contribution regardless of which backend is
active. Where a backend cannot satisfy a capability — for instance, asking a non-interactive
backend to run an interactive sign-in — the seam fails loud with a typed
`AuthBackendOperationUnsupportedError` rather than silently misbehaving. Read the
{{ comp.xref({ key: "explain:auth-model", text: "auth model" }) }} for the full port-and-adapter
walkthrough.

{{ comp callout { type: "note", title: "Package pins & the audit surface" } }}
Scaffolded JSR imports use exact <code>{{ releaseSpecifier }}</code> pins for the aligned release
train. Auth also ships a structured, redacted audit surface — <code>createAuthTelemetry</code>
from <code>@netscript/plugin-auth-core</code> — which records audit spans only when a
<code>subjectHashSalt</code> is configured (<code>NETSCRIPT_AUTH_AUDIT_SALT</code>); without a
salt it runs as a no-op. See {{ comp.xref({ key: "explain:observability" }) }} for the full
audit-trail model.
{{ /comp }}

## Why the model looks like this

The shape exists to keep three concerns from leaking into each other:

1. **Capability authors** work in a core package and think only about behavior, ports, and
   contracts — never about how a host discovers them.
2. **Plugin packages** stay small: they translate a capability into a manifest of contributions,
   which is the only thing a host has to understand.
3. **Hosts** depend on a stable, finite set of contribution shapes and a deterministic registry,
   so adding a plugin never requires editing host code — it requires a manifest and a regenerated
   registry.

The result is that capabilities **compose**. A host can add workers, sagas, triggers, streams, and
auth in any combination, and each plugin contributes its services, background processors, schemas,
and topics through the same vocabulary — each running as its own isolated resource.

## Where to go next

{{ comp.featureGrid({ items: [
  { title: "Add a first-party plugin", body: "The task-oriented recipe: scaffold, register, regenerate, verify.", href: "/orchestration-runtime/how-to/add-a-plugin/", icon: "🔌" },
  { title: "The auth model", body: "The five-unit core/adapter/plugin split — the model at its richest.", href: "/explanation/auth-model/", icon: "🔐" },
  { title: "Orchestration with Aspire", body: "How the AppHost turns manifests into running API and background resources.", href: "/explanation/aspire/", icon: "🧩" },
  { title: "Plugin authoring contract", body: "definePlugin(), the contribution axes, and the registry emitter.", href: "/reference/plugin/", icon: "📐" }
] }) }}

Each plugin's surface is documented on its own reference page:
{{ comp.xref({ key: "ref:workers", text: "workers" }) }},
{{ comp.xref({ key: "ref:sagas", text: "sagas" }) }},
{{ comp.xref({ key: "ref:triggers", text: "triggers" }) }}, and
{{ comp.xref({ key: "ref:streams", text: "streams" }) }}. For the wider picture, see
{{ comp.xref({ key: "explain:architecture", text: "architecture" }) }} and
{{ comp.xref({ key: "explain:durability-model", text: "the durability model" }) }}.

{{ comp.nextPrev({ prev: { label: "Contracts & type flow", href: "/explanation/contracts/" }, next: { label: "Auth model", href: "/explanation/auth-model/" } }) }}
