---
layout: layouts/base.vto
title: Durable Workflows
templateEngine: [vento, md]
---

# Durable Workflows

This section covers work that must outlive a request and a process. A
[saga](/durable-workflows/sagas/) carries multi-step state across crashes, a
[trigger](/durable-workflows/triggers/) turns inbound events into durable work, and a
[stream](/durable-workflows/streams/) publishes current state to live consumers. Each one is a
typed definition in your workspace, so you can read what a workflow does from its definition.

The failure these runtimes address is concrete. A checkout charges a card, the process dies before
fulfillment confirms, and on restart nobody knows whether to refund. A retry loop cannot answer that,
because the state between the two steps lived only in memory. The
[storefront checkout saga](/tutorials/storefront/04-checkout-saga/) tutorial is built around that
scenario.

The scaffold ships the chain running. A webhook lands on the triggers service and enqueues a
[workers](/background-processing/workers/) job. The job publishes a `UserSettingsCreated` message,
and a saga consumes it and records completion in the durable store you chose. Each runtime exposes
an HTTP surface, so you can confirm that a message crossed each step.

## Choose a runtime

| Your problem | Use |
| --- | --- |
| State between steps must survive a crash, with compensation when a step fails | [Durable sagas](/durable-workflows/sagas/) |
| The outside world starts the work: webhooks, dropped files, cron | [Triggers & ingress](/durable-workflows/triggers/) |
| Consumers need the latest state without polling | [Durable streams](/durable-workflows/streams/) |

{{ comp.cardsGrid({ columns: 4, cards: [
  { eyebrow: "Learn", title: "Storefront tutorial", body: "The checkout saga chapter models a multi-step flow with compensation.", href: "/tutorials/storefront/04-checkout-saga/" },
  { eyebrow: "Do", title: "Recipes", body: "Validated ingestion queues, durable streams and stream retention.", href: "/durable-workflows/how-to/" },
  { eyebrow: "Look up", title: "`@netscript/sagas` reference", body: "Generated API reference. Related units: `triggers`, `streams`.", href: resolveXref("ref:sagas").href },
  { eyebrow: "Understand", title: "The durability model", body: "Why state must outlive the process, and how effects differ from a retry loop.", href: resolveXref("explain:durability-model").href }
] }) }}

## Next step

Start with [Durable sagas](/durable-workflows/sagas/) to model your first crash-safe, multi-step
process.
