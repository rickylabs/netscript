---
layout: layouts/base.vto
title: Durable Workflows
templateEngine: [vento, md]
---

# Durable Workflows

Durable Workflows covers sagas, triggers, streams, retry and DLQ behavior, and state that survives a
single process. Use this pillar when an operation spans multiple steps, receives inbound events, or
publishes a durable stream for consumers.

{{ comp.cardsGrid({ columns: 3, cards: [
  { eyebrow: "Overview & Concepts", title: "Durability model", body: "How saga state, trigger ingress, retries, and durable streams fit together.", href: "/explanation/durability-model/", icon: "O" },
  { eyebrow: "Quickstart", title: "Checkout saga", body: "Build a multi-step checkout flow in the Storefront tutorial.", href: "/tutorials/storefront/04-checkout-saga/", icon: "Q" },
  { eyebrow: "How-To", title: "Validated ingestion queue", body: "Validate incoming work before handing it to durable processing.", href: "/how-to/build-a-validated-ingestion-queue/", icon: "H" },
  { eyebrow: "How-To", title: "Durable stream", body: "Publish stream events for consumers.", href: "/how-to/publish-a-durable-stream/", icon: "H" },
  { eyebrow: "API Reference", title: "sagas", body: "Generated saga API symbols.", href: "/reference/sagas/", icon: "R" },
  { eyebrow: "API Reference", title: "triggers and streams", body: "Generated trigger and stream package symbols.", href: "/reference/triggers/", icon: "R" }
] }) }}
