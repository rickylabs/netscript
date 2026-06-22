---
layout: layouts/base.vto
title: Orchestration and Runtime
templateEngine: [vento, md]
---

# Orchestration & Runtime

Orchestration & Runtime covers the Aspire AppHost, generated plugin registry, runtime configuration,
resource graph, deployment flow, and process lifecycle. Start here when you need to bring the whole
workspace up, change runtime overrides, or understand how plugin contributions become resources.

{{ comp.cardsGrid({ columns: 3, cards: [
  { eyebrow: "Overview & Concepts", title: "Aspire resource graph", body: "How the AppHost materializes services, plugins, stores, and the dashboard.", href: "/explanation/aspire/", icon: "O" },
  { eyebrow: "Quickstart", title: "Run the workspace", body: "Scaffold and start a workspace from the quickstart.", href: "/quickstart/", icon: "Q" },
  { eyebrow: "How-To", title: "Deploy locally with Aspire", body: "Use Aspire to bring up local resources.", href: "/how-to/deploy-local-aspire/", icon: "H" },
  { eyebrow: "How-To", title: "Runtime overrides", body: "Roll out configuration overrides across resources.", href: "/how-to/roll-out-runtime-overrides/", icon: "H" },
  { eyebrow: "How-To", title: "Plugins", body: "Add or author a plugin contribution.", href: "/how-to/add-a-plugin/", icon: "H" },
  { eyebrow: "API Reference", title: "aspire and runtime config", body: "Generated symbols for AppHost, config, runtime-config, plugin, and CLI units.", href: "/reference/aspire/", icon: "R" }
] }) }}
