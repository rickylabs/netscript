---
layout: layouts/base.vto
title: Orchestration & runtime
description: The CLI scaffold, the Aspire resource graph, runtime configuration, plugins, and deployment.
templateEngine: [vento, md]
---

# Orchestration & runtime

This section covers how a NetScript workspace runs as one system: the CLI scaffold, the Aspire
AppHost and its resource graph, generated plugin registries, runtime configuration, deployment and
process lifecycle.

A NetScript app runs as several processes: services, plugin APIs, background processors, a database
and a cache. `netscript init` scaffolds the workspace, plugin contributions become Aspire resources
through generated registries, and one `aspire start` brings the whole graph up with its wiring
resolved. Every resource in the Aspire dashboard at the URL Aspire prints comes from your declared services and
plugin contributions, not from a hand-edited process list.

{{ comp.cardsGrid({ columns: 3, cards: [
  { eyebrow: "Understand", title: "Aspire resource graph", body: "How the AppHost materializes services, plugins, stores and the dashboard.", href: "/explanation/aspire/", icon: "O" },
  { eyebrow: "Understand", title: "CLI & scaffold", body: "The command flow from `netscript init` to an extended workspace, and which generated files you own.", href: "/orchestration-runtime/cli-scaffold/", icon: "S" },
  { eyebrow: "Understand", title: "Runtime configuration", body: "Typed project config plus hot-reloadable operator overrides.", href: "/orchestration-runtime/runtime-config/", icon: "S" },
  { eyebrow: "Look up", title: "Background child health", body: "The generated lifecycle vocabulary, restart threshold and authoring metadata.", href: "/orchestration-runtime/child-health/", icon: "S" },
  { eyebrow: "Learn", title: "Run the workspace", body: "Scaffold and start a workspace from the quickstart.", href: "/quickstart/", icon: "Q" },
  { eyebrow: "Do", title: "Deploy locally with Aspire", body: "Bring up every local resource and watch it in the dashboard.", href: "/orchestration-runtime/how-to/deploy-local-aspire/", icon: "H" },
  { eyebrow: "Do", title: "Discover services", body: "How a service declares `pluginReferences` and `dependsOn`, and how references resolve.", href: resolveXref("howto:discover-services").href, icon: "H" },
  { eyebrow: "Do", title: "Recipes", body: "Plugins, deployment, runtime overrides, shutdown and webhooks, one task each.", href: "/orchestration-runtime/how-to/", icon: "H" },
  { eyebrow: "Look up", title: "Aspire and runtime config", body: "Symbols for the AppHost, config, runtime-config, plugin and CLI units.", href: "/reference/aspire/", icon: "R" }
] }) }}

## Next steps

New to the workspace model? Start with [CLI & scaffold](/orchestration-runtime/cli-scaffold/).
