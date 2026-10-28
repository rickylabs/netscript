---
layout: layouts/base.vto
title: Recipes
templateEngine: [vento, md]
order: 100
---

# Durable workflows — recipes

Each recipe here solves one concrete problem with sagas, triggers, queues or streams. They assume you
know the basics from the guides above them in the sidebar.

| Recipe | Solves |
| --- | --- |
| [Build a validated ingestion queue](/durable-workflows/how-to/build-a-validated-ingestion-queue/) | Reject malformed messages before they enter a queue and before a consumer runs |
| [Publish a durable stream](/durable-workflows/how-to/publish-a-durable-stream/) | Publish server-owned entity state for live consumers |
| [Bound stream retention](/durable-workflows/how-to/bound-stream-retention/) | Put a hard limit on how long a durable stream keeps data |

## Next step

Browse [All how-to recipes]({{ "howto:index" |> xref |> url }}) for recipes in other areas.
