---
layout: layouts/base.vto
title: Orchestration and Runtime
templateEngine: [vento, md]
---

# Orchestration & Runtime

A NetScript app is never one process — it is services, plugin APIs, background
processors, a database, and a cache, wired together. This pillar is about the machinery
that makes that fleet **derived rather than hand-maintained**: one `netscript init`
scaffolds the workspace, plugin contributions become Aspire resources through generated
registries, and a single `aspire start` stands the whole graph up with its wiring
resolved. Encore markets its generated local development dashboard hard, and for good
reason — a live, auto-provisioned map of the system is the artifact that proves the
wiring is derived. NetScript's equivalent is the Aspire dashboard at `:18888`: every
resource on it comes from your declared services and plugin contributions, not from a
hand-edited process list.

Orchestration & Runtime covers the Aspire AppHost, generated plugin registry, runtime configuration,
resource graph, deployment flow, and process lifecycle. Start here when you need to bring the whole
workspace up, change runtime overrides, or understand how plugin contributions become resources.

{{ comp.cardsGrid({ columns: 3, cards: [
  { eyebrow: "Overview & Concepts", title: "Aspire resource graph", body: "How the AppHost materializes services, plugins, stores, and the dashboard.", href: "/explanation/aspire/", icon: "O" },
  { eyebrow: "Story", title: "CLI & scaffold", body: "One command to a complete workspace — and why generated conventions save agent turns.", href: "/orchestration-runtime/cli-scaffold/", icon: "S" },
  { eyebrow: "Story", title: "Runtime configuration", body: "Typed project config plus hot-reloadable operator overrides.", href: "/orchestration-runtime/runtime-config/", icon: "S" },
  { eyebrow: "Quickstart", title: "Run the workspace", body: "Scaffold and start a workspace from the quickstart.", href: "/quickstart/", icon: "Q" },
  { eyebrow: "How-To", title: "Deploy locally with Aspire", body: "Use Aspire to bring up local resources.", href: "/orchestration-runtime/how-to/deploy-local-aspire/", icon: "H" },
  { eyebrow: "How-To", title: "Runtime overrides", body: "Roll out configuration overrides across resources.", href: "/orchestration-runtime/how-to/roll-out-runtime-overrides/", icon: "H" },
  { eyebrow: "How-To", title: "Plugins", body: "Add or author a plugin contribution.", href: "/orchestration-runtime/how-to/add-a-plugin/", icon: "H" },
  { eyebrow: "API Reference", title: "aspire and runtime config", body: "Generated symbols for AppHost, config, runtime-config, plugin, and CLI units.", href: "/reference/aspire/", icon: "R" }
] }) }}

## Where to go next

New here, start with the concept, then the practical wiring, then the reference:

- **Start from the CLI:** [CLI & scaffold](/orchestration-runtime/cli-scaffold/) is the
  story of how one command lays the workspace down and why the generated conventions are
  the part that saves turns — for you and for a coding agent.
- **Understand the model:** {{ comp.xref({ key: "explain:aspire", text: "Orchestration with Aspire" }) }}
  explains why a NetScript app is a resource graph, how plugin contributions become resources, and
  when to change vs. regenerate vs. hand-edit the generated AppHost.
- **Wire resources together:** {{ comp.xref({ key: "howto:discover-services", text: "Discover services" }) }}
  covers the two-pass reference resolution — including how a service now declares
  `pluginReferences`/`dependsOn` — and {{ comp.xref({ key: "howto:roll-out-runtime-overrides", text: "Roll out runtime overrides" }) }}
  covers configuration across resources.
- **See it observed:** {{ comp.xref({ key: "cap:telemetry", text: "Telemetry & logging" }) }} is the
  dashboard side of the same graph — the spans and logs `aspire start` collects.
- **Look up exact symbols:** {{ comp.xref({ key: "ref:aspire", text: "the Aspire reference" }) }} and
  the {{ comp.xref({ key: "cli:reference", text: "CLI reference" }) }}.

## Learn, do, look up

{{ comp.cardsGrid({ columns: 4, cards: [
  { eyebrow: "Learn", title: "Quickstart", body: "From `netscript init` to a running, orchestrated workspace.", href: resolveXref("concept:quickstart").href },
  { eyebrow: "Do", title: "Recipes", body: "Task-oriented recipes for this area, one problem each.", href: "/orchestration-runtime/how-to/" },
  { eyebrow: "Look up", title: "`@netscript/aspire` reference", body: "Generated API reference. Related units: `cli`, `config`, `runtime-config`, `plugin`.", href: resolveXref("ref:aspire").href },
  { eyebrow: "Understand", title: "Orchestration with Aspire", body: "The design rationale behind this pillar.", href: resolveXref("explain:aspire").href },
] }) }}
