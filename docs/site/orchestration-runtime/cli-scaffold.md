---
layout: layouts/base.vto
title: CLI and Scaffold
templateEngine: [vento, md]
prev: { label: "Orchestration & Runtime", href: "/orchestration-runtime/" }
next: { label: "Runtime configuration", href: "/orchestration-runtime/runtime-config/" }
---

# CLI & scaffold

One command — `netscript init` — lays down a complete, running backend workspace:
shared oRPC contracts, an example service, a Fresh frontend, the plugin registry, a
default cache, and the Aspire orchestration layer. Everything after that is the same
CLI extending the same workspace: `netscript plugin install` to add a capability,
`netscript generate plugins` to rewire the registry, `netscript db` for the database
workflow. The point is not typing speed. It is that every structural decision a
backend needs — where contracts live, how a service registers, how a plugin
contributes, how processes find each other — has already been made, once, in one
conventional shape that both you and a coding agent can read back out of the
workspace itself.

## The problem the scaffold solves

Ask a coding agent to "add a backend feature" in an unstructured TypeScript repo and
watch where its turns go. Before it writes the feature, it has to *decide* things: a
validation library, a database access pattern, a folder layout, a way to register the
new route, a way to start the new process. Each decision is a turn, each turn is a
chance to pick differently than last time, and the resulting drift is what you spend
review cycles undoing.

A scaffolded NetScript workspace removes that entire class of turns. The layout is
generated, so there is exactly one place a contract goes (`contracts/versions/v1/`),
one way a service declares itself, one registry through which plugins are discovered
— and the registry is **generated from the workspace, not hand-imported**, so the
convention is enforced by regeneration rather than by review. When configuration
changes, `netscript service generate` regenerates the Aspire helper files that wire
services, health checks, ports, and cross-service discovery from your declarative
config — the local topology is derived, not hand-maintained. An agent (or a new
teammate) reads the existing conventions and follows them; the turns go into the
feature.

{{ comp callout { type: "note", title: "One comparison, stated plainly" } }}
Encore's NestJS comparison makes the file-count argument for conventions — a CRUD
endpoint "shouldn't require five files and a module registration" — and AdonisJS
positions itself as batteries-included, "for teams who want to ship products, not
assemble frameworks." NetScript applies both arguments one level up, to the whole
workspace: run <code>netscript init my-app --dry-run</code> and it prints every file
the scaffold would create — the contracts workspace, the example service, the
frontend, the plugin registry, and the orchestration layer you would otherwise
assemble by hand, one decision at a time — without writing anything to disk.
{{ /comp }}

## The everyday flow

Four steps, in a fixed order — Aspire must be up before any `db` command. The
{{ comp.xref({ key: "cli:reference" }) }} covers each group in depth; the
{{ comp.xref({ key: "concept:quickstart" }) }} walks the same path end to end in
about five minutes.

{{ comp.featureGrid({ items: [
  {
    title: "1 · Scaffold",
    body: "netscript init my-app --db postgres --service — a workspace with contracts, an example service, the Fresh app, the plugin registry, and the Aspire layer. With a database and a service it generates a real Prisma-backed CRUD contract and an oRPC playground at GET /.",
    icon: "◆"
  },
  {
    title: "2 · Orchestrate",
    body: "cd aspire && aspire start brings up the database and cache and opens the dashboard at :18888 — the generated resource graph, live.",
    icon: "▶"
  },
  {
    title: "3 · Database",
    body: "netscript db init / generate / seed — the Prisma-on-Deno workflow, including every plugin's contributed schema, only after Aspire is up.",
    icon: "▤"
  },
  {
    title: "4 · Extend",
    body: "netscript plugin install workers, then netscript generate plugins so the registry picks the contribution up.",
    icon: "✶"
  }
] }) }}

```bash
# Preview the whole scaffold plan without writing a file
netscript init my-app --dry-run

# The fully specified, non-interactive form
netscript init my-app --db postgres --service --service-name users --yes

# Extend the workspace, then regenerate the registry
netscript plugin install workers --name workers
netscript generate plugins
```

{{ comp callout { type: "note", title: "Fresh NetScript releases and Deno's 24-hour window" } }}
Deno 2.9 applies a 24-hour minimum dependency age to newly published registry versions. A generated
JSR-mode workspace preserves that policy for third-party dependencies and exempts only exact
`jsr:@netscript/*` versions from its matching NetScript release train. First-party plugin commands
load the workspace policy explicitly, so scaffolding and plugin verbs work immediately after a
NetScript release. Third-party plugins and explicitly different NetScript versions keep the normal
age check; local-source workspaces do not add registry policy.
{{ /comp }}

This page is the story; the mechanism lives elsewhere and is linked, not duplicated:
the curated command tour is the {{ comp.xref({ key: "cli:reference" }) }}, the
exhaustive generated surface is {{ comp.xref({ key: "ref:cli", text: "the @netscript/cli reference" }) }},
and the database order-of-operations is the
{{ comp.xref({ key: "howto:database-migration", text: "database & migration how-to" }) }}.

## Installing a plugin is installing a capability

Plugins are how the scaffold grows: background workers, durable sagas, webhook
triggers, durable streams, and authentication are all installed the same way.
`netscript plugin install <kind-or-package>` adds the plugin package dependency,
emits **workspace-owned glue** that imports it (such as `workers/mod.ts`), and
registers its contributions — the host application never changes. The plugin's
service, runtime, contract, and schema internals stay in the installed dependency;
what lands in your repo is the thin, typed seam you own. After installing, one
`netscript generate plugins` regenerates the registry so the host discovers the new
contribution statically.

Medusa's Agent Skills docs collapse "install a plugin" and "give an agent a
capability" into the same action — skills are installable units an agent uses
directly. A NetScript plugin carries the same dual reading, one artifact with two
framings: `netscript plugin install workers` adds a runtime capability (a jobs API
and its isolated background processors, run as separate Aspire resources), and the
typed glue plus generated registry it emits *is* the convention surface a coding
agent reads to use that capability correctly — no separate integration guide to keep
in sync.

The lifecycle is symmetric and inspectable: `netscript plugin list` shows what is
registered, `netscript plugin doctor` sanity-checks the wiring, `netscript plugin
info <name>` runs a plugin's published info command, and `netscript plugin remove`
unregisters it. Authoring your own follows the same two-tier shape the official
plugins use — `netscript plugin new billing` scaffolds a JSR-publishable core engine
package and a thin connector that re-exports its contract.

- **Add one:** {{ comp.xref({ key: "howto:add-a-plugin" }) }} — the install flow step by step.
- **Author one:** {{ comp.xref({ key: "howto:author-a-plugin" }) }} — the two-tier core + connector pattern.
- **Understand the model:** {{ comp.xref({ key: "explain:plugin-system", text: "the plugin system" }) }} —
  manifest, contributions, generated registries, and why one plugin runs as several processes.

## Generated, then owned

Two generation modes coexist in a scaffolded workspace, and knowing which is which
tells you what is safe to edit:

- **Regenerated artifacts** — the plugin registries (`netscript generate plugins`),
  runtime configuration schemas (`netscript generate runtime-schemas`), and the
  Aspire helper files (`netscript service generate`). These are derived from your
  configuration and re-derived when it changes; treat them as outputs.
- **Emitted-then-owned code** — the glue a `plugin install` writes and the Fresh UI
  components `netscript ui:add` copies into your repo. These are yours from the
  moment they land: edit them freely, they are never overwritten behind your back.

That split is the scaffold's contract with you: conventions are enforced where
regeneration is cheap, and ownership is handed over where your edits are the point.
How generated runtime schemas feed the operator-facing override layer is the
{{ comp.xref({ key: "cap:runtime-config", text: "runtime configuration" }) }} story.

## Where to go next

{{ comp.featureGrid({ items: [
  {
    title: "Look up — CLI reference",
    body: "The curated, task-grouped tour of every netscript command group: scaffold, plugins, services, database, generate, deploy.",
    href: "/cli-reference/",
    icon: "≡"
  },
  {
    title: "Learn — Quickstart",
    body: "Install → init → aspire start → db → hit an endpoint, in about five minutes.",
    href: "/quickstart/",
    icon: "▸"
  },
  {
    title: "Understand — Orchestration with Aspire",
    body: "Why the workspace is a resource graph and what a single aspire start actually stands up.",
    href: "/explanation/aspire/",
    icon: "◎"
  },
  {
    title: "Understand — The plugin system",
    body: "Manifest, contributions, generated registries — the mental model behind plugin install.",
    href: "/explanation/plugin-system/",
    icon: "✲"
  }
] }) }}

{{ comp.nextPrev({ prev: { label: "Orchestration & Runtime", href: "/orchestration-runtime/" }, next: { label: "Runtime configuration", href: "/orchestration-runtime/runtime-config/" } }) }}
