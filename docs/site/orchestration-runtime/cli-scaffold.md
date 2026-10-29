---
layout: layouts/base.vto
title: CLI & scaffold
templateEngine: [vento, md]
order: 1
---

# CLI & scaffold

This page shows how `netscript init` lays down a workspace, how the same CLI extends it, and
which generated files you own.

`netscript init` creates a complete, running backend workspace: shared oRPC contracts, an example
service, a Fresh frontend, the plugin registry, a default cache and the Aspire orchestration layer.
After that, the same CLI extends the workspace: `netscript plugin install` adds a capability,
`netscript generate plugins` rewires the registry, and `netscript db` runs the database workflow.

## The problem the scaffold solves

In an unstructured TypeScript repository, every backend feature starts with decisions: a validation
library, a database access pattern, a folder layout, how to register a route, how to start a
process. You, a new teammate or a coding agent can decide each one differently, and review cycles
go into undoing the drift.

A scaffolded workspace makes those decisions once. There is one place a contract goes
(`contracts/versions/v1/`), one way a service declares itself and one registry through which
plugins are discovered. The registry is generated from the workspace, not hand-imported, so
regeneration enforces the convention. When configuration changes, `netscript service generate`
regenerates the Aspire helper files that wire services, health checks, ports and cross-service
discovery. The local topology is derived, not hand-maintained.

## The everyday flow

The flow has four steps in a fixed order. The {{ comp.xref({ key: "concept:quickstart" }) }} walks
the same path end to end.

1. **Scaffold.** `netscript init my-app --db postgres --service` creates the contracts, an example
   service, the Fresh app, the plugin registry and the Aspire layer. With a database and a service,
   it generates a Prisma-backed CRUD contract and an oRPC playground at `GET /`. Add `--dry-run`
   to print every file the scaffold would create without writing anything.
2. **Orchestrate.** `cd aspire && aspire start` brings up the database and cache and opens the
   dashboard at the URL Aspire prints.
3. **Database.** `netscript db init`, `generate` and `seed` run the Prisma-on-Deno workflow,
   including every plugin's contributed schema. Run them only after Aspire is up.
4. **Extend.** `netscript plugin install workers`, then `netscript generate plugins` so the
   registry picks up the contribution.

```bash
# Preview the whole scaffold plan without writing a file
netscript init my-app --dry-run

# The fully specified, non-interactive form
netscript init my-app --db postgres --service --service-name users --yes

# Extend the workspace, then regenerate the registry
netscript plugin install workers --name workers
netscript generate plugins
```

{{ comp callout { type: "note", title: "New releases and Deno's 24-hour window" } }}
Deno 2.9 applies a 24-hour minimum dependency age to newly published registry versions. A generated JSR-mode workspace keeps that policy for third-party dependencies and exempts only exact <code>jsr:@netscript/*</code> versions from its matching NetScript release train. First-party plugin commands load the workspace policy explicitly, so scaffolding and plugin verbs work immediately after a NetScript release. Third-party plugins and other NetScript versions keep the normal age check; local-source workspaces add no registry policy.
{{ /comp }}

## Installing a plugin is installing a capability

Plugins add background workers, durable sagas, webhook triggers, durable streams and
authentication, all installed the same way. `netscript plugin install <kind-or-package>` adds the
plugin package dependency, emits workspace-owned glue that imports it (such as `workers/mod.ts`) and
registers its contributions; the host application doesn't change. The plugin's service, runtime,
contract and schema internals stay in the installed dependency, and what lands in your repository
is the thin, typed seam you own. Run `netscript generate plugins` afterwards so the host discovers
the new contribution statically.

A plugin that exposes an API declares its exact resource key and named service and app consumers in
`scaffold.plugin.json` under `linking`. Install reconciles those references into `appsettings.json`
for first- and third-party packages alike. Installing a consumer later converges the same graph, and
removing the producer prunes its references. Consumer code receives Aspire service-discovery
environment variables without hand-edited configuration.

For example, `netscript plugin install workers` adds a jobs API and its background processors as
separate Aspire resources. The typed glue and generated registry it emits are also the conventions a
coding agent reads to use that capability correctly.

The lifecycle is symmetric: `netscript plugin list`, `doctor`, `info` and `remove` inspect and
unregister installed plugins (see
[Manage plugins later](/orchestration-runtime/how-to/add-a-plugin/#manage-plugins-later)). To
write your own, `netscript plugin new billing` scaffolds a JSR-publishable core engine package and a
thin connector that re-exports its contract.

{{ comp.xref({ key: "howto:add-a-plugin" }) }} walks through the install flow,
{{ comp.xref({ key: "howto:author-a-plugin" }) }} covers the two-tier core and connector pattern,
and {{ comp.xref({ key: "explain:plugin-system", text: "the plugin system" }) }} explains the
manifest, contributions, generated registries and why one plugin runs as several processes.

## Generated, then owned

A scaffolded workspace has two kinds of generated code. Knowing which is which tells you what is
safe to edit:

| Kind | Examples | How to treat it |
| --- | --- | --- |
| Regenerated artifacts | Plugin registries (`netscript generate plugins`), runtime configuration schemas (`netscript generate runtime-schemas`), Aspire helper files (`netscript service generate`) | As outputs. They are derived from your configuration and re-derived when it changes. |
| Emitted, then owned | The glue `plugin install` writes, and the Fresh UI components `netscript ui:add` copies into your repository | As your code from the moment they land. Edit them freely; they are never overwritten behind your back. |

Conventions are enforced where regeneration is cheap, and ownership is handed over where your edits
are the point. {{ comp.xref({ key: "cap:runtime-config", text: "Runtime configuration" }) }}
explains how generated runtime schemas feed the operator-facing override layer.

## Next steps

Run the flow end to end in the [Quickstart](/quickstart/). For every command group, see the
{{ comp.xref({ key: "cli:reference" }) }}.
