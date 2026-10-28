---
layout: layouts/base.vto
title: Explanation
templateEngine: [vento, md]
prev: null
next:
  label: The NetScript architecture
  href: /explanation/architecture/
---

# Explanation

These pages explain how NetScript is put together, why each boundary has its shape, and what that
shape costs. Read them to build the mental model, not to find a specific command.

NetScript is a **Deno-native, contracts-first backend framework**. One thesis governs its design:
*the published surface is the product*. Every page here follows from it. Types come before
implementation, each boundary keeps a small and predictable surface, and durable behavior is an
explicit state machine instead of a scatter of event handlers.

{{ comp callout { type: "tip", title: "How this zone fits the others" } }}
These pages are <strong>understanding-oriented</strong>. For a guided first path, use the <a href="/tutorials/">tutorials</a>. To get a job done, use the <a href="/how-to/">how-to guides</a>. For the exact symbols, ports, and signatures of a package, use the generated <a href="/reference/">reference</a>. For a one-screen tour of each subsystem, use the <a href="/capabilities/">capability</a> hubs.
{{ /comp }}

## The concept map

Eight pages, ordered from the whole framework down to single subsystems. If the design is new to
you, read them in order: the architecture page sets the vocabulary the others assume, and the auth
model is easiest once you know plugins and ports.

{{ comp.featureGrid({ items: [
  { title: "The NetScript architecture", href: "/explanation/architecture/", body: "The published-surface thesis, the layers of a workspace, the direction of their dependencies, and the publish gate that enforces them." },
  { title: "Contracts first", href: "/explanation/contracts/", body: "How an oRPC contract flows through implement() and a typed handler into a typed client, query layer, and island." },
  { title: "The plugin system", href: "/explanation/plugin-system/", body: "How a plugin relates to its core package, what it contributes through its manifest, and how the host discovers it through generated registries." },
  { title: "Durability model", href: "/explanation/durability-model/", body: "Sagas as explicit state machines: correlation, the kv or prisma durable store, and compensation modeled as message-handler effects." },
  { title: "Observability", href: "/explanation/observability/", body: "How automatic framework spans, scaffold handler telemetry, console logs, and Aspire collection fit together." },
  { title: "The Aspire orchestrator", href: "/explanation/aspire/", body: "The generated TypeScript AppHost, the resource graph it starts (database, cache, and every plugin API), and the Aspire dashboard." },
  { title: "The pure-backend auth model", href: "/explanation/auth-model/", body: "Core defines the AuthBackendPort, backends are pure adapters, and the plugin composes exactly one active backend. Why only kv-oauth is interactive." },
  { title: "How NetScript's path compares", href: "/explanation/compared/", body: "What the getting-started flows of Next.js, Nuxt, SvelteKit, Laravel, and Rails teach first, where NetScript's order differs and why, and where those peers are ahead today." }
] }) }}

## Recurring themes

Four ideas run through every page. Knowing them early makes the zone read as one argument.

- **Contracts before implementation.** Every subsystem starts from a schema and type contract: an
  oRPC contract for a service, a `defineSaga` definition for a workflow, an `AuthBackendPort` for
  an auth adapter. The implementation is written to satisfy it. The
  [architecture](/explanation/architecture/) and [contracts](/explanation/contracts/) pages
  establish this; the others apply it.
- **Ports own the seam; adapters stay swappable.** A package owns the *port* and wires one default
  adapter through a `createX()` factory. Technology-specific adapters and in-memory testing helpers
  live behind their own subpaths. In the [auth model](/explanation/auth-model/), one
  `AuthBackendPort` defined in core is satisfied by three independent backends.
- **Durable state is explicit.** Long-running behavior is a named state machine with a persistence
  backend, not an implicit ladder of callbacks. See the
  [durability model](/explanation/durability-model/) for sagas (`kv` or `prisma` store) and the
  [auth model](/explanation/auth-model/) for durable `auth.*` events.
- **Plugins extend without redefining.** First-party plugins under `plugins/*` re-export their core
  package's contract and contribute service entrypoints, runtime declarations, and schema
  fragments. See [the plugin system](/explanation/plugin-system/).

Next: [The NetScript architecture](/explanation/architecture/).
