---
layout: layouts/base.vto
title: Background processing
description: Worker jobs and polyglot tasks that run outside the request path.
templateEngine: [vento, md]
---

# Background processing

Background Processing covers work that runs outside the request path: background jobs, polyglot
tasks, queue providers, scheduled work, runtime adapters and per-task permissions. You write one
typed handler; the worker runtime supplies the queue, retry policy, scheduler, execution history,
trigger API and traces.

For multi-step work that waits for messages or compensates on failure, use
[durable workflows](/durable-workflows/) instead.

{{ comp.cardsGrid({ columns: 3, cards: [
  { eyebrow: "Concept", title: "Background jobs", body: "Write a typed job handler, enqueue it and observe each run.", href: "/background-processing/workers/" },
  { eyebrow: "Concept", title: "Polyglot tasks", body: "Run Python, .NET or shell steps as subprocesses on the same queue.", href: "/background-processing/polyglot-tasks/" },
  { eyebrow: "Tutorial", title: "ERP sync tutorial", body: "An import job, a polyglot transform and a queue-driven cron.", href: resolveXref("tut:erp-sync").href },
  { eyebrow: "How-to", title: "Run a polyglot task", body: "Define, run and sandbox a task in another runtime.", href: "/background-processing/how-to/run-a-polyglot-task/" },
  { eyebrow: "How-to", title: "Choose a queue provider", body: "Pick the queue backend for your local and deployed runtime.", href: "/data-persistence/how-to/choose-a-queue-provider/" },
  { eyebrow: "How-to", title: "Queue, KV, and cron", body: "Create the queue and scheduler loop that background work uses.", href: "/data-persistence/how-to/queue-kv-cron/" },
  { eyebrow: "Recipes", title: "Background recipes", body: "Tuning, permissions and runtime adapters, one problem each.", href: "/background-processing/how-to/" },
  { eyebrow: "Reference", title: "Workers reference", body: "Generated API for workers. Related units: `queue`, `cron`, `watchers`.", href: resolveXref("ref:workers").href },
  { eyebrow: "Explanation", title: "The durability model", body: "The design rationale behind background and durable work.", href: resolveXref("explain:durability-model").href }
] }) }}
