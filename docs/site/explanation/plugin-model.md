---
layout: layouts/base.vto
title: The plugin model
---

# The plugin model

This page is **understanding-oriented**: it explains *how* NetScript plugins are put
together and *why* the design is split the way it is. It is for reading and reflection,
not step-by-step doing. To actually add a plugin, follow the
[how-to guide](/how-to/add-a-plugin/); to look up the exact symbols, use the
[reference](/reference/).

## What a plugin is

A NetScript plugin is a package under `plugins/` that contributes capability to a host
workspace without the host having to hard-code knowledge of that capability. The
first-party plugins are:

| Plugin | JSR package | Capability |
| --- | --- | --- |
| workers | `@netscript/plugin-workers` | Background job scheduling and task execution. |
| sagas | `@netscript/plugin-sagas` | Durable saga orchestration and workflow APIs. |
| triggers | `@netscript/plugin-triggers` | Trigger ingress, scheduling, and file watching. |
| streams | `@netscript/plugin-streams` | Durable change-data stream services. |

Each is its own publishable unit with its own reference page:
[`@netscript/plugin-workers`](/reference/workers/),
[`@netscript/plugin-sagas`](/reference/sagas/),
[`@netscript/plugin-triggers`](/reference/triggers/), and
[`@netscript/plugin-streams`](/reference/streams/).

## Plugins versus their core packages

The most important thing to understand about a NetScript plugin is that it is *two
packages, not one*. Every public plugin has a sibling **core** package:

| Public plugin | Sibling core package |
| --- | --- |
| `@netscript/plugin-workers` | `@netscript/plugin-workers-core` |
| `@netscript/plugin-sagas` | `@netscript/plugin-sagas-core` |
| `@netscript/plugin-triggers` | `@netscript/plugin-triggers-core` |
| `@netscript/plugin-streams` | `@netscript/plugin-streams-core` |

The split follows the architecture doctrine's separation of *behavior* from
*integration*:

- The **core** package implements the capability itself — the authoring DSL (for example
  the saga and trigger definition builders), the runtime, the ports it depends on, the
  adapters, telemetry, and the versioned contract types. This is where the long-running
  behavior and state live.
- The **plugin** package is a thin integration layer (the doctrine's *Plugin Package*
  archetype). Its `mod.ts` is small. It re-exports the userland surface from its core
  sibling rather than redefining it, and it adds the one thing the core cannot supply on
  its own: a **manifest** that tells a host *what* this plugin contributes and *how* to
  wire it up.

Because of this split, the core packages are documented as an **Internals** subsection on
each plugin's reference page rather than as separate top-level entries: application authors
normally reach the core symbols *through* the public plugin, so the public plugin is the
surface users consume.

This is why you will see, for example, the saga DSL exported from
`@netscript/plugin-sagas/runtime` even though it is authored in
`@netscript/plugin-sagas-core` — the plugin package re-exports the core's contract and
runtime, keeping a single import path for consumers while preserving the
behavior/integration boundary in the source.

## Manifests and contributions

A plugin describes itself with a typed **manifest**, assembled through the
`definePlugin()` builder in [`@netscript/plugin`](/reference/plugin/). The manifest is a
declaration, not executable wiring: it names the plugin, its version, and the set of
**contributions** the plugin makes along well-defined **extension axes**.

Contributions are the vocabulary the host understands. The plugin contract defines a fixed
set of contribution shapes — among them service contributions, background-processor
contributions, database-schema contributions, stream-topic contributions, contract-version
contributions, runtime-config-topic contributions, and telemetry contributions. A workers
plugin contributes worker job definitions; a sagas plugin contributes saga definitions; a
streams plugin contributes stream topics and a service. The host does not need to know the
internals of any plugin — it only needs to understand these contribution shapes.

This is the doctrine's principle of **registration over inheritance** for cross-package
extension: a plugin *registers* named contributions against open extension axes instead of
subclassing host internals. Registration scales because the host can validate a
registration at composition time, log it, and reject conflicts — for example, duplicate
plugin names are rejected with a structured error that references both contributors.

## Discovery, loading, and registries

NetScript does not auto-discover plugins from `node_modules`. Plugins use **file-system
based discovery** under `plugins/`, and the host loader resolves them **explicitly**. Two
properties of the loader matter for understanding the model:

- **Load order is deterministic.** Plugins must not depend on the order in which other
  plugins load; the doctrine forbids order-dependence and asserts against it.
- **Each load contributes named registrations** against one or more extension axes, and
  duplicate names across plugins are rejected.

Between *declaring* a plugin and the *runtime* being able to use it sits a generated
**registry**. Rather than scanning the file system at runtime, NetScript emits static
registry modules — one generated TypeScript module per contribution axis — that the
runtime imports directly. (The plugin package exposes the emitter and port types behind
this on its reference page, and each plugin can load its definitions from the generated
static registry module.) Regenerating the registry is what makes a freshly added plugin
visible to the runtime; the practical command sequence for this is covered in the
[add-a-plugin how-to](/how-to/add-a-plugin/).

## Why the model looks like this

The shape exists to keep three concerns from leaking into each other:

1. **Capability authors** work in a core package and think only about behavior, ports, and
   contracts — never about how a host discovers them.
2. **Plugin packages** stay small: they translate a capability into a manifest of
   contributions, which is the only thing a host has to understand.
3. **Hosts** depend on a stable, finite set of contribution shapes and a deterministic
   loader, so adding a plugin never requires editing host code — it requires a manifest
   and a regenerated registry.

The result is that capabilities compose. A host can add workers, sagas, triggers, and
streams in any combination, and each plugin contributes its services, background
processors, schemas, and topics through the same contribution vocabulary.

## Where to go next

- **Do it:** [Add a first-party plugin](/how-to/add-a-plugin/) — the task-oriented recipe.
- **Look it up:** the plugin authoring contract in
  [`@netscript/plugin`](/reference/plugin/), and each plugin's surface —
  [workers](/reference/workers/), [sagas](/reference/sagas/),
  [triggers](/reference/triggers/), [streams](/reference/streams/).
- **Read more:** the other [explanation](/explanation/) pages for the wider architecture.

---

Back to the [explanation overview](/explanation/).
