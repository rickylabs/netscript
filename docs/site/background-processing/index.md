---
layout: layouts/base.vto
title: Background Processing
templateEngine: [vento, md]
---

# Background Processing

**Work that outlives the request, from one handler file.** In NetScript, moving work off
the request path means authoring a single typed handler — the queue, retry policy,
scheduler, execution history, trigger API, and OpenTelemetry traces come from the worker
runtime, so there is no separate queue-and-worker stack to assemble (or to explain to an
AI agent) before the first job runs.

Two page-level stories anchor this pillar. [Background jobs](/background-processing/workers/)
opens with a production one: a vision job that turns a pasted alert-email screenshot into
structured diagnosis fields — and the two contract properties (queue-borne payloads,
compute-only workers) that shaped it, plus a factual side-by-side with Trigger.dev and
Temporal. [Polyglot tasks](/background-processing/polyglot-tasks/) covers the step that is
*not* TypeScript: an existing Python, .NET, or shell script that keeps its language and
gains the same queue, retry, and trace behavior as everything else.

Background Processing covers worker tasks, queue providers, scheduled work, runtime adapters, and
per-task permissions. Start here when work should run outside the request path but does not need the
durable saga state model — for that, see [durable workflows](/durable-workflows/).

{{ comp.cardsGrid({ columns: 3, cards: [
  { eyebrow: "Overview & Concepts", title: "Workers and queues", body: "Worker tasks consume queued work with provider and runtime choices kept inside the leaf.", href: "/background-processing/workers/", icon: "O" },
  { eyebrow: "Quickstart", title: "Polyglot transform", body: "Run a task step from the ERP Sync tutorial.", href: "/tutorials/erp-sync/03-polyglot-transform/", icon: "Q" },
  { eyebrow: "How-To", title: "Queue, KV, and cron", body: "Create the queue and scheduler loop used by background work.", href: "/data-persistence/how-to/queue-kv-cron/", icon: "H" },
  { eyebrow: "How-To", title: "Choose a queue provider", body: "Select the provider that fits your local and deployed runtime.", href: "/data-persistence/how-to/choose-a-queue-provider/", icon: "H" },
  { eyebrow: "How-To", title: "Run a polyglot task", body: "Execute work in a non-TypeScript task runtime.", href: "/background-processing/how-to/run-a-polyglot-task/", icon: "H" },
  { eyebrow: "API Reference", title: "workers, queue, cron", body: "Generated symbols for task, queue, scheduler, and watcher packages.", href: "/reference/workers/", icon: "R" }
] }) }}

## Learn, do, look up

{{ comp.cardsGrid({ columns: 4, cards: [
  { eyebrow: "Learn", title: "ERP sync tutorial", body: "An import job, a polyglot transform, and a queue-driven cron.", href: resolveXref("tut:erp-sync").href },
  { eyebrow: "Do", title: "Recipes", body: "Task-oriented recipes for this area, one problem each.", href: "/background-processing/how-to/" },
  { eyebrow: "Look up", title: "`@netscript/workers` reference", body: "Generated API reference. Related units: `queue`, `cron`, `watchers`.", href: resolveXref("ref:workers").href },
  { eyebrow: "Understand", title: "The durability model", body: "The design rationale behind this pillar.", href: resolveXref("explain:durability-model").href },
] }) }}
