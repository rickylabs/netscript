---
layout: layouts/base.vto
title: Recipes
templateEngine: [vento, md]
order: 100
---

# Orchestration & Runtime — recipes

Each recipe here solves one concrete problem with plugins, the Aspire AppHost, runtime
configuration, deployment or process lifecycle. They assume you know the basics from the guides
above them in the sidebar.

| Recipe | Solves |
| --- | --- |
| [Add a plugin](/orchestration-runtime/how-to/add-a-plugin/) | Install an official plugin, register it and confirm it is healthy |
| [Author a plugin](/orchestration-runtime/how-to/author-a-plugin/) | Build a capability NetScript does not ship as a core package and a connector |
| [Deploy](/orchestration-runtime/how-to/deploy/) | Run the workspace on a container host, a VM or a cloud target |
| [Deploy locally with Aspire](/orchestration-runtime/how-to/deploy-local-aspire/) | Bring up the whole resource graph on one machine |
| [Deploy to Deno Deploy](/orchestration-runtime/how-to/deploy-deno-deploy/) | Push a stateless entrypoint to Deno Deploy |
| [Detached start for agents and CI](/orchestration-runtime/how-to/detached-start-agents-ci/) | Start the AppHost non-interactively with JSON output |
| [Roll out runtime overrides](/orchestration-runtime/how-to/roll-out-runtime-overrides/) | Change deployed behavior without rebuilding |
| [Graceful shutdown](/orchestration-runtime/how-to/graceful-shutdown/) | Drain requests, jobs and connections on `SIGTERM` |
| [Deliver outbound webhooks](/orchestration-runtime/how-to/outbound-webhooks/) | Send signed events with retries and a dead-letter queue |
| [Deno LSP code intelligence in Claude Code](/orchestration-runtime/how-to/deno-lsp-code-intelligence/) | Give every Claude Code session the Deno language server |

## Next step

Browse [All how-to recipes]({{ "howto:index" |> xref |> url }}) for recipes in other areas.
