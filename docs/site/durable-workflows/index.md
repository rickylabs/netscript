---
layout: layouts/base.vto
title: Durable Workflows
templateEngine: [vento, md]
---

# Durable Workflows

This pillar is about state that must outlive a request — and a process. A
[saga](/durable-workflows/sagas/) carries multi-step state across crashes, a
[trigger](/durable-workflows/triggers/) turns inbound events into durable work, and a
[stream](/durable-workflows/streams/) fans completed state out to live consumers. All three are
declared as typed definitions in your workspace, so what a workflow does is readable from its
definition — by you, by the registry tooling, and by a coding agent asked to change it.

The failure mode this pillar exists for is concrete: a checkout charges a card, the process dies
before fulfillment confirms, and on restart nobody knows whether to refund. A retry loop cannot
answer that question because the state between step three and step four lived only in memory. The
[storefront checkout saga](/tutorials/storefront/04-checkout-saga/) is the tutorial built around
exactly that scenario; the pages in this pillar cover each piece it composes.

The scaffold ships the whole chain running, not as separate demos. A webhook lands on the triggers
service (`:8093`) and enqueues a [workers](/background-processing/workers/) job; the job publishes a
`UserSettingsCreated` message; a saga on `:8092` consumes it and records completion in the durable
store you chose. Every link is scaffold code that compiles, and every runtime exposes an HTTP
surface you can query to confirm a message actually crossed — which is what makes the chain
verifiable step by step instead of trusted end to end.

Use this pillar when an operation spans multiple steps, receives inbound events, or publishes a
durable stream for consumers. Start from the failure mode you have:

- **State between steps must survive a crash** — a multi-step process with compensation:
  [Durable sagas](/durable-workflows/sagas/).
- **The outside world starts the work** — webhooks, dropped files, cron:
  [Triggers & ingress](/durable-workflows/triggers/).
- **Consumers need the latest state without polling** — a typed change-log read over HTTP/SSE:
  [Durable streams](/durable-workflows/streams/).

For the conceptual model behind all three — why state must outlive the process, and how effect-based
outcomes differ from a retry loop — read the
{{ comp.xref({ key: "explain:durable-workflows" }) }}.

{{ comp.cardsGrid({ columns: 3, cards: [
  { eyebrow: "Overview & Concepts", title: "Durability model", body: "How saga state, trigger ingress, retries, and durable streams fit together.", href: "/explanation/durability-model/", icon: "O" },
  { eyebrow: "Quickstart", title: "Checkout saga", body: "Build a multi-step checkout flow in the Storefront tutorial.", href: "/tutorials/storefront/04-checkout-saga/", icon: "Q" },
  { eyebrow: "How-To", title: "Validated ingestion queue", body: "Validate incoming work before handing it to durable processing.", href: "/durable-workflows/how-to/build-a-validated-ingestion-queue/", icon: "H" },
  { eyebrow: "How-To", title: "Durable stream", body: "Publish stream events for consumers.", href: "/durable-workflows/how-to/publish-a-durable-stream/", icon: "H" },
  { eyebrow: "API Reference", title: "sagas", body: "Generated saga API symbols.", href: "/reference/sagas/", icon: "R" },
  { eyebrow: "API Reference", title: "triggers and streams", body: "Generated trigger and stream package symbols.", href: "/reference/triggers/", icon: "R" }
] }) }}
