---
layout: layouts/base.vto
title: Background Processing
templateEngine: [vento, md]
---

# Background Processing

Background Processing covers worker tasks, queue providers, scheduled work, runtime adapters, and
per-task permissions. Start here when work should run outside the request path but does not need the
durable saga state model.

{{ comp.cardsGrid({ columns: 3, cards: [
  { eyebrow: "Overview & Concepts", title: "Workers and queues", body: "Worker tasks consume queued work with provider and runtime choices kept inside the leaf.", href: "/background-processing/workers/", icon: "O" },
  { eyebrow: "Quickstart", title: "Polyglot transform", body: "Run a task step from the ERP Sync tutorial.", href: "/tutorials/erp-sync/03-polyglot-transform/", icon: "Q" },
  { eyebrow: "How-To", title: "Queue, KV, and cron", body: "Create the queue and scheduler loop used by background work.", href: "/how-to/queue-kv-cron/", icon: "H" },
  { eyebrow: "How-To", title: "Choose a queue provider", body: "Select the provider that fits your local and deployed runtime.", href: "/how-to/choose-a-queue-provider/", icon: "H" },
  { eyebrow: "How-To", title: "Run a polyglot task", body: "Execute work in a non-TypeScript task runtime.", href: "/how-to/run-a-polyglot-task/", icon: "H" },
  { eyebrow: "API Reference", title: "workers, queue, cron", body: "Generated symbols for task, queue, scheduler, and watcher packages.", href: "/reference/workers/", icon: "R" }
] }) }}
